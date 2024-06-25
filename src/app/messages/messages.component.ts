import {Component, effect, ElementRef, inject, OnInit, ViewChild} from '@angular/core';
import {Conversation} from "../conversations/model/conversation.model";
import {ConversationService} from "../conversations/conversation.service";
import {SseService} from "./service/sse.service";
import {Oauth2AuthService} from "../auth/oauth2-auth.service";
import {ConnectedUser} from "../shared/model/user.model";
import {Message} from "../conversations/model/message.model";
import {filter, timer} from "rxjs";
import dayjs from "dayjs";
import {DatePipe, UpperCasePipe} from "@angular/common";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {SendStateDisplayComponent} from "./send-state-display/send-state-display.component";

@Component({
  selector: 'wac-messages',
  standalone: true,
  imports: [
    UpperCasePipe,
    FaIconComponent,
    DatePipe,
    SendStateDisplayComponent
  ],
  templateUrl: './messages.component.html',
  styleUrl: './messages.component.scss'
})
export class MessagesComponent implements OnInit {

  @ViewChild("messages") private messagesElement: ElementRef | undefined;

  conversation: Conversation | undefined;
  conversationService = inject(ConversationService);
  sseService = inject(SseService);
  oauth2Service = inject(Oauth2AuthService);
  private connectedUser: ConnectedUser | undefined;

  messagesByDate = new Map<string, Array<Message>>();

  hasInitBottomScroll = false;


  constructor() {
    this.fetchConnectedUser();
  }

  ngOnInit(): void {
    this.listenToNewMessage();
    this.listenToNavigateToConversation();
    this.listenToDeleteConversation();
    this.listenToMarkAsRead();
  }

  private fetchConnectedUser() {
    effect(() => this.connectedUser = this.oauth2Service.fetchUser().value);
  }

  private listenToNewMessage(): void {
    this.sseService.receiveNewMessage.pipe(
      filter(newMessage => this.conversation?.publicId === newMessage.conversationId)
    ).subscribe(
      newMessage => {
        this.pushMessageWithKey(newMessage, "Today");
        this.triggerScroll();
        this.conversationService.handleMarkAsRead(this.conversation?.publicId!);
      }
    )
  }

  private triggerScroll() {
    this.hasInitBottomScroll = false;
    timer(1).subscribe(() => this.scrollToBottom());
  }

  private scrollToBottom() {
    if (this.messagesElement && !this.hasInitBottomScroll) {
      this.messagesElement!.nativeElement.scrollTop = this.messagesElement
        .nativeElement.scrollHeight;
      this.hasInitBottomScroll = true;
    }
  }

  private listenToNavigateToConversation(): void {
    this.conversationService.navigateToConversation
      .subscribe(conversation => {
        this.conversation = conversation;
        this.organizeMessageByDate();
        this.triggerScroll();
      })
  }

  private organizeMessageByDate() {
    this.messagesByDate = new Map<string, Array<Message>>();
    for (let message of this.conversation!.messages) {
      if (message.sendDate) {
        if (message.sendDate.isSame(dayjs(), "day")) {
          this.pushMessageWithKey(message, "Today");
        } else if (message.sendDate.isSame(dayjs().subtract(1, "day"), "day")) {
          this.pushMessageWithKey(message, "Yesterday");
        } else {
          this.pushMessageWithKey(message, message.sendDate.format("DD/MM/YYYY"));
        }
      }
    }
  }

  private pushMessageWithKey(message: Message, key: string) {
    if (this.messagesByDate.has(key)) {
      this.messagesByDate.get(key)?.push(message);
    } else {
      const messages = new Array<Message>();
      messages.push(message);
      this.messagesByDate.set(key, messages);
    }
  }

  private listenToDeleteConversation(): void {
    this.sseService.deleteConversation.pipe(
      filter(conversationPublicId => this.conversation?.publicId === conversationPublicId))
      .subscribe(() => this.conversation = undefined);
  }

  public isMessageFromContact(senderId: string): boolean {
    return this.connectedUser?.publicId !== senderId;
  }

  onClickFile(message: Message): void {
    if (message.type !== "TEXT") {
      const downloadLink = document.createElement("a");
      const fileName = `attachment.${message.mimeType?.split('/')[1]}`;

      downloadLink.href = `data:${message.mimeType};base64,${message.mediaContent}`;
      downloadLink.download = fileName;
      downloadLink.click();
    }
  }

  private listenToMarkAsRead(): void {
    this.conversationService.markAsViewed.subscribe(
      messageMarkAsReadState => {
        if (messageMarkAsReadState.status === "OK" && messageMarkAsReadState.value) {
          this.updateMessageSendState(messageMarkAsReadState.value.nbMessagesUpdated);
        }
      }
    )
  }

  private updateMessageSendState(nbMessagesUpdated: number) {
    const messagesInReceivedState = this.conversation?.messages.filter(message => message.state === "RECEIVED");
    if (messagesInReceivedState && nbMessagesUpdated === messagesInReceivedState.length) {
      for (let message of messagesInReceivedState) {
        message.state = "READ";
      }
      for (let entry of this.messagesByDate.entries()) {
        for (const messageToUpdate of entry[1]) {
          if (messageToUpdate.state === "RECEIVED") {
            messageToUpdate.state = "READ";
          }
        }
      }
    }
  }
}
