import {Injectable} from '@angular/core';
import {interval, Subject, Subscription} from "rxjs";
import {EventSourcePolyfill} from "event-source-polyfill";
import dayjs from "dayjs";
import {ConversationViewedForNotification} from "./sse.model";
import {environment} from "../../../environments/environment";
import {Message} from "../../conversations/model/message.model";

@Injectable({
  providedIn: 'root'
})
export class SseService {

  private sseEndpoint = `${environment.API_URL}/sse/subscribe`;
  private eventSource: EventSource | undefined;

  private receiveNewMessage$ = new Subject<Message>();
  receiveNewMessage = this.receiveNewMessage$.asObservable();

  private deleteConversation$ = new Subject<string>();
  deleteConversation = this.deleteConversation$.asObservable();

  private viewMessages$ = new Subject<ConversationViewedForNotification>();
  viewMessages = this.viewMessages$.asObservable();

  accessToken: string | undefined;

  private retryConnectionSubscription: Subscription | undefined;

  public subscribe(accessToken: string): void {
    this.accessToken = accessToken;
    this.eventSource = new EventSourcePolyfill(this.sseEndpoint, {
      headers: {
        "Authorization": `Bearer ${this.accessToken}`
      },
      heartbeatTimeout: 60000
    });

    this.eventSource!.onopen = ((event) => {
      console.log("Connection SSE to server OK", event);
      if (this.retryConnectionSubscription) {
        this.retryConnectionSubscription.unsubscribe();
      }
    });

    this.eventSource!.onerror = ((event) => {
      if (!this.retryConnectionSubscription) {
        console.log("Connection SSE lost, let's retry to connect");
        this.retryConnectionToSSEServer();
      }
    });

    this.eventSource.addEventListener("delete-conversation", event => {
      this.deleteConversation$.next(JSON.parse(event.data));
    });

    this.eventSource.addEventListener("view-messages", event => {
      this.viewMessages$.next(JSON.parse(event.data));
    });

    this.eventSource!.onmessage = ((event) => {
      if (event.data.indexOf("{") !== -1) {
        const message: Message = JSON.parse(event.data);
        message.sendDate = dayjs(message.sendDate);
        this.receiveNewMessage$.next(message);
      }
    });
  }

  private retryConnectionToSSEServer() {
    this.retryConnectionSubscription = interval(10000)
      .subscribe(() => this.subscribe(this.accessToken!));
  }
}
