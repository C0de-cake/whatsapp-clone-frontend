import {Injectable} from '@angular/core';
import {environment} from "../../environments/environment";
import {interval, Subject, Subscription} from "rxjs";
import {EventSourcePolyfill} from "event-source-polyfill";

@Injectable({
  providedIn: 'root'
})
export class SseService {

  private sseEndpoint = `${environment.API_URL}/sse/subscribe`;
  private eventSource: EventSource | undefined;

  private deleteConversation$ = new Subject<string>();
  deleteConversation = this.deleteConversation$.asObservable();

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
    })
  }

  private retryConnectionToSSEServer() {
    this.retryConnectionSubscription = interval(10000)
      .subscribe(() => this.subscribe(this.accessToken!));
  }
}
