import {Component, inject, OnDestroy, OnInit} from '@angular/core';
import {Conversation} from "../../conversations/model/conversation.model";
import {ConversationService} from "../../conversations/conversation.service";
import {MessageService} from "../service/message.service";
import {Subscription} from "rxjs";
import {Message, MessageType} from "../../conversations/model/message.model";
import {EmojiData} from "@ctrl/ngx-emoji-mart/ngx-emoji";
import {ClickOutside} from "ngxtension/click-outside";
import {FaIconComponent} from "@fortawesome/angular-fontawesome";
import {FormsModule} from "@angular/forms";
import {PickerComponent} from "@ctrl/ngx-emoji-mart";
import {MediaComponent} from "./media/media.component";

@Component({
  selector: 'wac-send',
  standalone: true,
  imports: [
    ClickOutside,
    FaIconComponent,
    FormsModule,
    PickerComponent,
    MediaComponent
  ],
  templateUrl: './send.component.html',
  styleUrl: './send.component.scss'
})
export class SendComponent implements OnInit, OnDestroy {

  message = "";
  conversation: Conversation | undefined;
  conversationService = inject(ConversationService);
  messageService = inject(MessageService);

  private navigateToConversationSub: Subscription | undefined;
  private sendSub: Subscription | undefined;
  showEmojis = false;
  showMedia = false;

  ngOnDestroy(): void {
    if (this.sendSub) {
      this.sendSub.unsubscribe();
    }

    if (this.navigateToConversationSub) {
      this.navigateToConversationSub.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.listenToNavigateToConversation();
  }

  private listenToNavigateToConversation(): void {
    this.conversationService.navigateToConversation.subscribe(conversation => {
      this.conversation = conversation;
    })
  }

  onEnter(): void {
    this.sendMessage(this.message);
  }

  public sendMessage(message: string) {
    if (message !== "") {
      const newMessage: Message = {
        conversationId: this.conversation?.publicId!,
        textContent: message,
        type: "TEXT"
      }
      this.messageService.handleSend(newMessage);
      this.message = "";
    }
  }

  createMediaMessage(file: File): void {
    let type: MessageType;
    if (file.type.indexOf("audio/") !== -1) {
      type = "AUDIO";
    } else if (file.type.indexOf("video/") !== -1) {
      type = "VIDEO";
    } else {
      type = "PICTURE";
    }

    const newMediaMessage: Message = {
      conversationId: this.conversation?.publicId!,
      textContent: "Attachment",
      type: type,
      mediaContent: file,
      mimeType: file.type
    }

    this.messageService.handleSend(newMediaMessage);
  }

  onSelectEmojis(emojiSelected: any) {
    const emoji: EmojiData = emojiSelected.emoji;
    this.message += emoji.native;
  }

  onClickEmojis(){
    this.showEmojis = !this.showEmojis;
    this.showMedia = false;
  }

  closePanel(): void {
    this.showEmojis = false;
    this.showMedia = false;
  }

  onClickMedia() {
    this.showMedia = !this.showMedia;
    this.showEmojis = false;
  }

}
