import {Component, effect, EventEmitter, inject, input, Output} from '@angular/core';
import {Conversation} from "../model/conversation.model";
import {BaseUser} from "../../shared/model/user.model";
import {ConversationService} from "../conversation.service";
import dayjs from "dayjs";
import {Message} from "../model/message.model";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {NgbDropdown, NgbDropdownItem, NgbDropdownMenu, NgbDropdownToggle} from "@ng-bootstrap/ng-bootstrap";
import {SendStateDisplayComponent} from "../../messages/send-state-display/send-state-display.component";

@Component({
  selector: 'wac-conversation',
  standalone: true,
  imports: [
    FaIconComponent,
    NgbDropdown,
    NgbDropdownToggle,
    NgbDropdownItem,
    SendStateDisplayComponent,
    NgbDropdownMenu
  ],
  templateUrl: './conversation.component.html',
  styleUrl: './conversation.component.scss'
})
export class ConversationComponent {

  conversation = input.required<Conversation>();
  connectedUser = input.required<BaseUser>();

  conversationService = inject(ConversationService);

  @Output() select = new EventEmitter<Conversation>();
  @Output() delete = new EventEmitter<Conversation>();

  protected showMenu = false;
  nbOfUnReadMessage = 0;
  contact: BaseUser | undefined;

  showConversation() {
    this.select.emit(this.conversation());
  }

  constructor() {
    this.getReceiverMember();
  }

  private getReceiverMember() {
    effect(() => {
      this.contact = this.conversationService.getReceiverMember(this.conversation())
    });
  }

  computeTitle(): string {
    if (this.contact) {
      return this.contact.firstName + " " + this.contact.lastName;
    } else {
      return this.conversation().name;
    }
  }

  computeTime() {
    const lastMessage = this.getLastMessage();
    if (lastMessage) {
      return dayjs(lastMessage.sendDate).fromNow();
    } else {
      return "";
    }
  }

  hasUnreadMessage(): boolean {
    if (this.conversation().messages) {
      const unreadMessages = this.conversation().messages.filter(message => message.state === "RECEIVED"
        && message.senderId !== this.connectedUser().publicId);
      if (unreadMessages.length > 0) {
        this.nbOfUnReadMessage = unreadMessages.length;
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  getLastMessage(): Message | null {
    if (this.conversation().messages && this.conversation().messages.length > 0) {
      return this.conversation().messages[this.conversation().messages.length - 1];
    } else {
      return null;
    }
  }

  onDelete() {
    this.delete.emit(this.conversation());
  }

  onMouseOver() {
    this.showMenu = true;
  }

  onMouseLeave() {
    this.showMenu = false;
  }
}
