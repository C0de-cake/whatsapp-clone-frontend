import {effect, inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {Oauth2AuthService} from "../auth/oauth2-auth.service";
import {Subject} from "rxjs";
import {State} from "../shared/model/state.model";
import {BaseUser, ConnectedUser} from "../shared/model/user.model";
import {createPaginationOption, Pagination} from "../shared/model/request.model";
import {environment} from "../../environments/environment";
import dayjs from "dayjs";
import {Conversation, ConversationToCreate} from "./model/conversation.model";
import {MessageMarkAsViewedResponse} from "./model/message.model";

@Injectable({
  providedIn: 'root'
})
export class ConversationService {

  http = inject(HttpClient);
  oauth2Service = inject(Oauth2AuthService);

  private createOrLoadConversation$ = new Subject<string>();
  createOrLoadConversation = this.createOrLoadConversation$.asObservable();

  private navigateToConversation$ = new Subject<Conversation>();
  navigateToConversation = this.navigateToConversation$.asObservable();

  private create$ = new Subject<State<Conversation>>();
  create = this.create$.asObservable();

  private getAll$ = new Subject<State<Array<Conversation>>>();
  getAll = this.getAll$.asObservable();

  private delete$ = new Subject<State<string>>();
  delete = this.delete$.asObservable();

  private getOneByPublicId$ = new Subject<State<Conversation>>();
  getOneByPublicId = this.getOneByPublicId$.asObservable();

  private markAsViewed$ = new Subject<State<MessageMarkAsViewedResponse>>();
  markAsViewed = this.markAsViewed$.asObservable();

  private connectedUser: ConnectedUser | undefined;

  constructor() {
    effect(() => {
      if (this.oauth2Service.fetchUser().status === "OK"
        && this.oauth2Service.fetchUser().value) {
        this.connectedUser = this.oauth2Service.fetchUser().value;
      }
    });
  }

  handleNavigateToConversation(userPublicId: string) {
    this.createOrLoadConversation$.next(userPublicId);
  }

  handleGetAll(pagination: Pagination) {
    const params = createPaginationOption(pagination);
    this.http.get<Array<Conversation>>(`${environment.API_URL}/conversations`
      , {params})
      .subscribe({
        next: conversations => {
          this.mapDateToDayJsList(conversations);
          this.sortMessageByTime(conversations);
          this.sortConversationByLastMessage(conversations);
          this.getAll$.next(State.Builder<Array<Conversation>>().forSuccess(conversations));
        },
        error: err => this.getAll$.next(State.Builder<Array<Conversation>>().forError(err))
      });
  }

  private mapDateToDayJsList(conversations: Array<Conversation>) {
    conversations.forEach(conversation => this.mapDateToDayJs(conversation));
  }

  private mapDateToDayJs(conversation: Conversation) {
    if (conversation.messages) {
      conversation.messages
        .forEach(message => message.sendDate = dayjs(message.sendDate));
    }

    conversation.members.forEach((member: BaseUser) => {
      member.lastSeen = dayjs(member.lastSeen);
    });
  }

  sortConversationByLastMessage(conversations: Array<Conversation>) {
    conversations.sort((conversationA, conversationB) => {
      if (conversationA.messages && conversationB.messages
        && conversationB.messages.length != 0 && conversationA.messages.length != 0) {
        return conversationB.messages[conversationB.messages.length - 1].sendDate!.toDate().getTime()
          - conversationA.messages[conversationA.messages.length - 1].sendDate!.toDate().getTime()
      } else {
        return 0;
      }
    })
  }

  private sortMessageByTime(conversations: Array<Conversation>) {
    conversations.forEach(conversation => {
      conversation.messages.sort((messageA, messageB) => {
        return messageA.sendDate!.toDate().getTime() - messageB.sendDate!.toDate().getTime();
      });
    });
  }

  handleCreate(conversationToCreate: ConversationToCreate) {
    this.http.post<Conversation>(`${environment.API_URL}/conversations`, conversationToCreate)
      .subscribe({
        next: conversation => {
          this.mapDateToDayJs(conversation);
          this.create$.next(State.Builder<Conversation>().forSuccess(conversation))
        },
        error: err => this.create$.next(State.Builder<Conversation>().forError(err))
      })
  }

  handleDelete(conversationPublicId: string) {
    const params = new HttpParams().set("publicId", conversationPublicId);
    this.http.delete<string>(`${environment.API_URL}/conversations`, {params})
      .subscribe({
        next: publicId => this.delete$.next(State.Builder<string>().forSuccess(publicId)),
        error: err => this.delete$.next(State.Builder<string>().forError(err))
      });
  }

  handleGetOne(conversationId: string) {
    const params = new HttpParams().set("conversationId", conversationId);
    this.http.get<Conversation>(`${environment.API_URL}/conversations/get-one-by-public-id`,
      {params})
      .subscribe({
        next: conversation => {
          this.mapDateToDayJs(conversation);
          this.getOneByPublicId$.next(State.Builder<Conversation>().forSuccess(conversation))
        },
        error: err => this.getOneByPublicId$.next(State.Builder<Conversation>().forError(err))
      });
  }

  navigateToNewConversation(conversation: Conversation) {
    this.navigateToConversation$.next(conversation);
  }

  getReceiverMember(conversation: Conversation): BaseUser {
    return conversation.members.find(member => member.publicId !== this.connectedUser?.publicId)!;
  }

  handleMarkAsRead(conversationId: string): void {
    const params = new HttpParams().set("conversationId", conversationId);
    this.http.post<number>(`${environment.API_URL}/conversations/mark-as-read`, {}, {params})
      .subscribe({
        next: nbUpdatedMessages => {
          const messagesMarkAsReadResult: MessageMarkAsViewedResponse = {
            conversationPublicId: conversationId,
            nbMessagesUpdated: nbUpdatedMessages
          }
          this.markAsViewed$.next(State.Builder<MessageMarkAsViewedResponse>().forSuccess(messagesMarkAsReadResult))
        },
        error: err => this.markAsViewed$.next(State.Builder<MessageMarkAsViewedResponse>().forError(err))
      });
  }
}
