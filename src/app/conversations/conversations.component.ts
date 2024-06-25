import {Component, effect, inject, OnDestroy, OnInit} from '@angular/core';
import {ConversationService} from "./conversation.service";
import {ToastService} from "../shared/toast/toast.service";
import {Oauth2AuthService} from "../auth/oauth2-auth.service";
import {Conversation, ConversationToCreate} from "./model/conversation.model";
import {Subscription} from "rxjs";
import {ConnectedUser} from "../shared/model/user.model";
import {ConversationComponent} from "./conversation/conversation.component";
import {MessageService} from "../messages/service/message.service";
import {Message} from "./model/message.model";
import {SseService} from "../messages/service/sse.service";

@Component({
  selector: 'wac-conversations',
  standalone: true,
  imports: [
    ConversationComponent
  ],
  templateUrl: './conversations.component.html',
  styleUrl: './conversations.component.scss'
})
export class ConversationsComponent implements OnInit, OnDestroy {

  conversationService = inject(ConversationService);
  toastService = inject(ToastService);
  oauth2Service = inject(Oauth2AuthService);
  sseService = inject(SseService);
  messageService = inject(MessageService);

  conversations = new Array<Conversation>();
  selectedConversation: Conversation | undefined;
  private createOrLoadConversation: Subscription | undefined;
  private createSub: Subscription | undefined;
  private getAllSub: Subscription | undefined;
  private getOneByPublicIdSub: Subscription | undefined;
  private deleteSSESub: Subscription | undefined;
  private viewedMessageSSESub: Subscription | undefined;

  connectedUser: ConnectedUser | undefined;

  constructor() {
    this.fetchConnectedUser();
  }

  private fetchConnectedUser() {
    effect(() => {
      const connectedUserState = this.oauth2Service.fetchUser();
      if (connectedUserState.status === "OK"
        && connectedUserState.value?.email !== this.oauth2Service.notConnected) {
        this.connectedUser = connectedUserState.value;
        this.conversationService.handleGetAll({page: 0, size: 20, sort: []});
      }
    });
  }

  ngOnDestroy(): void {
    if (this.createOrLoadConversation) {
      this.createOrLoadConversation.unsubscribe();
    }

    if (this.createSub) {
      this.createSub.unsubscribe();
    }

    if (this.getAllSub) {
      this.getAllSub.unsubscribe();
    }

    if (this.getOneByPublicIdSub) {
      this.getOneByPublicIdSub.unsubscribe();
    }

    if (this.deleteSSESub) {
      this.deleteSSESub.unsubscribe();
    }

    if(this.viewedMessageSSESub) {
      this.viewedMessageSSESub.unsubscribe();
    }
  }

  ngOnInit(): void {
    this.listenToGetAllConversation();
    this.listenToGetOneByPublicId();
    this.listenToConversationCreated();
    this.listenToNavigateToConversation();
    this.listenToSSEDeleteConversation();
    this.listenToSSENewMessage();
    this.listenToSSEViewMessage();
  }

  private listenToGetAllConversation(): void {
    this.getAllSub = this.conversationService.getAll
      .subscribe(conversationsState => {
        if (conversationsState.status === "OK" && conversationsState.value) {
          this.conversations = conversationsState.value;
        } else {
          this.toastService.show("Error occurred when fetching conversations", "DANGER");
        }
      });
  }

  private listenToGetOneByPublicId(): void {
    this.getOneByPublicIdSub = this.conversationService.getOneByPublicId
      .subscribe(conversationState => {
        if (conversationState.status === "OK" && conversationState.value) {
          this.conversations.push(conversationState.value);
        } else {
          this.toastService.show("Error occurred when fetching conversation", "DANGER");
        }
      })
  }

  private listenToConversationCreated(): void {
    this.createSub = this.conversationService.create
      .subscribe(newConversationState => {
        if (newConversationState.status === "OK" && newConversationState.value) {
          this.conversations.push(newConversationState.value);
          this.conversationService.navigateToNewConversation(newConversationState.value);
        } else {
          this.toastService.show("Error occurred when conversation creation", "DANGER");
        }
      });
  }

  private listenToNavigateToConversation(): void {
    this.createOrLoadConversation = this.conversationService.createOrLoadConversation
      .subscribe(userPublicId => {
        const existingConversation = this.conversations.find(conversation => conversation.members
          .findIndex(member => member.publicId === userPublicId) !== -1);
        if (existingConversation) {
          this.conversationService.handleMarkAsRead(existingConversation.publicId);
          this.conversationService.navigateToNewConversation(existingConversation);
        } else {
          const newConversation: ConversationToCreate = {
            members: [userPublicId],
            name: "Default"
          }
          this.conversationService.handleCreate(newConversation)
        }
      });
  }

  onDeleteConversation(conversation: Conversation) {
    this.conversationService.handleDelete(conversation.publicId);
  }

  onSelectConversation(conversation: Conversation) {
    if (this.selectedConversation) {
      this.selectedConversation.active = false;
    }
    this.selectedConversation = conversation;
    this.selectedConversation.active = true;
    this.conversationService.handleMarkAsRead(conversation.publicId);
    this.conversationService.navigateToNewConversation(conversation);
  }

  private listenToSSEDeleteConversation(): void {
    this.deleteSSESub = this.sseService.deleteConversation.subscribe(uuidDeleted => {
      const indexToDelete = this.conversations.findIndex(conversation => conversation.publicId === uuidDeleted);
      this.conversations.splice(indexToDelete, 1);
      this.toastService.show("Conversation deleted by the user", "SUCCESS");
    })
  }

  private listenToSSENewMessage(): void {
    this.sseService.receiveNewMessage.subscribe(newMessage => {
      const indexToUpdate = this.conversations.findIndex(conversation => conversation.publicId === newMessage.conversationId);
      if (indexToUpdate === -1) {
        this.conversationService.handleGetOne(newMessage.conversationId);
      } else {
        const conversationToUpdate = this.conversations[indexToUpdate];
        if (!conversationToUpdate.messages) {
          conversationToUpdate.messages = new Array<Message>();
        }
        conversationToUpdate.messages.push(newMessage);
        const sender = this.messageService.extractSender(conversationToUpdate.members, newMessage.senderId!);
        if (this.oauth2Service.fetchUser().value!.publicId !== sender.publicId) {
          this.toastService.show(`New message received from ${sender.firstName} ${sender.lastName}`, "SUCCESS");
        }
      }
      this.conversationService.sortConversationByLastMessage(this.conversations);
    });
  }

  private listenToSSEViewMessage(): void {
   this.viewedMessageSSESub = this.sseService.viewMessages.subscribe(
     conversationViewedForNotification => {
       if(this.selectedConversation?.publicId === conversationViewedForNotification.conversationId) {
         conversationViewedForNotification.messageIdsViewed.forEach(messageId => {
           const messageToUpdate = this.selectedConversation?.messages.find(message => message.publicId === messageId)
           if(messageToUpdate) {
             messageToUpdate.state = "READ";
           }
         })
       }
     }
   )
  }

}
