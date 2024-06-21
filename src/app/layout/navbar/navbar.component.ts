import {Component, effect, inject} from '@angular/core';
import {Oauth2AuthService} from "../../auth/oauth2-auth.service";
import {ConnectedUser} from "../../shared/model/user.model";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'wac-navbar',
  standalone: true,
  imports: [
    FaIconComponent,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem
  ],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss'
})
export class NavbarComponent {

  oauth2Service = inject(Oauth2AuthService);

  connectedUser: ConnectedUser | undefined;

  constructor() {
    this.listenToFetchUser();
  }


  private listenToFetchUser() {
    effect(() => {
      const userState = this.oauth2Service.fetchUser();
      if (userState.status === "OK"
        && userState.value?.email
        && userState.value.email !== this.oauth2Service.notConnected) {
        this.connectedUser = userState.value;
      }
    });
  }

  logout(): void {
    this.oauth2Service.logout();
  }

  editProfile(): void {
    this.oauth2Service.goToProfilePage();
  }

  openNewConversation() {

  }
}
