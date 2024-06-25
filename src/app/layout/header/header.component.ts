import {Component, inject, OnInit} from '@angular/core';
import {ConnectedUser} from "../../shared/model/user.model";
import {ConversationService} from "../../conversations/conversation.service";
import {Oauth2AuthService} from "../../auth/oauth2-auth.service";
import {Conversation} from "../../conversations/model/conversation.model";
import {filter, interval, Subscription} from "rxjs";
import {ToastService} from "../../shared/toast/toast.service";
import dayjs from "dayjs";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle} from "@ng-bootstrap/ng-bootstrap";
import {SseService} from "../../messages/service/sse.service";

@Component({
  selector: 'wac-header',
  standalone: true,
  imports: [
    FaIconComponent,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownMenu,
    NgbDropdownItem
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {


  userSelected: ConnectedUser | undefined;

  conversationService = inject(ConversationService);
  sseService = inject(SseService);
  oauth2Service = inject(Oauth2AuthService);
  toastService = inject(ToastService);

  private conversation: Conversation | undefined;
  lastSeenSub: Subscription | undefined;

  ngOnInit(): void {
    this.listenToNavigateToConversation();
    this.listenToLastSeen();
    this.listenToDeleteConversation();
  }

  private listenToLastSeen(): void {
    this.oauth2Service.lastSeen.subscribe(
      lastSeenState => {
        if (lastSeenState.status === "OK") {
          this.userSelected!.lastSeen = lastSeenState.value;
        } else {
          this.toastService.show("Error occurred when fetching the presence of the user.", "DANGER");
        }
      }
    )
  }

  private listenToNavigateToConversation(): void {
    this.conversationService.navigateToConversation
      .subscribe(conversation => {
        this.conversation = conversation;
        this.userSelected = this.conversationService.getReceiverMember(conversation);
        this.pollUserPresence();
      });
  }

  private pollUserPresence(): void {
    this.unsubscribeLastSeen();
    this.lastSeenSub = interval(5000)
      .subscribe(() =>
        this.oauth2Service.handleLastSeen(this.userSelected?.publicId!))
  }

  private unsubscribeLastSeen() {
    if (this.lastSeenSub) {
      this.lastSeenSub.unsubscribe();
    }
  }

  private listenToDeleteConversation(): void {
    this.sseService.deleteConversation.pipe(
      filter(conversationPublicId => conversationPublicId === this.conversation?.publicId),
    ).subscribe(() => {
      this.userSelected = undefined;
      this.unsubscribeLastSeen();
    });
  }

  computeLastSeen(): string {
    if (this.userSelected && this.userSelected.lastSeen) {
      const secondDiff = dayjs().diff(this.userSelected.lastSeen) / 1000;
      if (secondDiff < 10) {
        return "Connected";
      } else {
        return `last seen ${this.userSelected.lastSeen!.fromNow()}`
      }
    } else {
      return "";
    }
  }
}
