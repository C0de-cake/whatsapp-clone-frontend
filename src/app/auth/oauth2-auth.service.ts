import {computed, inject, Injectable, signal, WritableSignal} from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpParams} from "@angular/common/http";
import {NgbModal, NgbModalRef} from "@ng-bootstrap/ng-bootstrap";
import Keycloak from "keycloak-js";
import {environment} from "../../environments/environment";
import {ConnectedUser} from "../shared/model/user.model";
import {State} from "../shared/model/state.model";
import {catchError, from, interval, Observable, of, shareReplay, Subject, switchMap} from "rxjs";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {AuthModalComponent} from "./auth-modal/auth-modal.component";
import dayjs, {Dayjs} from "dayjs";
import {SseService} from "../messages/service/sse.service";

@Injectable({
  providedIn: 'root'
})
export class Oauth2AuthService {

  http = inject(HttpClient);
  modalService = inject(NgbModal);
  sseService = inject(SseService);

  notConnected = "NOT_CONNECTED";

  accessToken: string | undefined;
  private authModalRef: NgbModalRef | undefined;

  private keycloak = new Keycloak({
    url: environment.keycloak.url,
    realm: environment.keycloak.realm,
    clientId: environment.keycloak.clientId
  });

  private MIN_TOKEN_VALIDITY_MILLISECONDS = 10000;

  private fetchUserHttp$ = new Observable<ConnectedUser>();

  private lastSeen$ = new Subject<State<Dayjs>>();
  lastSeen = this.lastSeen$.asObservable();

  constructor() {
    this.initFetchUserCaching(false);
  }

  private fetchUser$: WritableSignal<State<ConnectedUser>> =
    signal(State.Builder<ConnectedUser>().forSuccess({email: this.notConnected}));
  fetchUser = computed(() => this.fetchUser$());

  public initAuthentication(): void {
    from(this.keycloak.init({
      flow: "standard",
      onLoad: "check-sso",
      redirectUri: "http://localhost:4200/",
      silentCheckSsoRedirectUri: window.location.origin + "/assets/silentCheckSsoRedirectUri.html",
    }))
      .subscribe(isAuthenticated => {
        if (isAuthenticated) {
          this.accessToken = this.keycloak.token;
          this.fetch();
          this.initUpdateTokenRefresh();
          if (this.authModalRef) {
            this.authModalRef.close();
          }
          this.sseService.subscribe(this.accessToken!);
        } else {
          this.authModalRef = this.modalService
            .open(AuthModalComponent, {centered: true, backdrop: "static"});
        }
      });
  }

  initUpdateTokenRefresh(): void {
    interval(this.MIN_TOKEN_VALIDITY_MILLISECONDS)
      .pipe(
        switchMap(() => fromPromise(this.keycloak.updateToken(this.MIN_TOKEN_VALIDITY_MILLISECONDS)))
      ).subscribe({
      next: refreshed => {
        if (refreshed) {
          this.accessToken = this.keycloak.token;
        }
      },
      error: err => console.error("Failed to refresh token" + err)
    });
  }

  initFetchUserCaching(forceResync: boolean): void {
    const params = new HttpParams().set("forceResync", forceResync);
    this.fetchUserHttp$ = this.http.get<ConnectedUser>(`${environment.API_URL}/users/get-authenticated-user`, {params: params})
      .pipe(
        catchError(() => of({email: this.notConnected})),
        shareReplay(1)
      );
  }

  fetch(): void {
    this.fetchUserHttp$
      .subscribe({
        next: user => this.fetchUser$.set(State.Builder<ConnectedUser>().forSuccess(user)),
        error: (error: HttpErrorResponse) => {
          this.fetchUser$.set(State.Builder<ConnectedUser>().forError(error))
        }
      });
  }

  isAuthenticated(): boolean {
    return this.keycloak.authenticated!;
  }

  login(): void {
    this.keycloak.login();
  }

  logout(): void {
    this.keycloak.logout();
  }

  goToProfilePage(): void {
    this.keycloak.accountManagement();
  }

  handleLastSeen(userPublicId: string): void {
    const params = new HttpParams().set("publicId", userPublicId);
    this.http.get<Date>(`${environment.API_URL}/users/get-last-seen`, {params})
      .subscribe({
        next: lastSeen => this.lastSeen$.next(State.Builder<Dayjs>().forSuccess(dayjs(lastSeen))),
        error: err => this.lastSeen$.next(State.Builder<Dayjs>().forError(err))
      });
  }

}
