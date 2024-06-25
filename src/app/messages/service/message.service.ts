import {inject, Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Subject} from "rxjs";
import {State} from "../../shared/model/state.model";
import {Message} from "../../conversations/model/message.model";
import {environment} from "../../../environments/environment";
import {BaseUser} from "../../shared/model/user.model";

@Injectable({
  providedIn: 'root'
})
export class MessageService {

  http = inject(HttpClient);

  private send$ = new Subject<State<void>>();
  send = this.send$.asObservable();

  handleSend(newMessage: Message): void {
    const formData = new FormData();
    formData.append("file", newMessage.mediaContent!);
    const clone = structuredClone(newMessage);
    clone.mediaContent = undefined;
    formData.append("dto", JSON.stringify(clone));

    this.http.post<void>(`${environment.API_URL}/messages/send`, formData)
      .subscribe({
        next: () => this.send$.next(State.Builder().forSuccessEmpty()),
        error: err => this.send$.next(State.Builder().forError(err))
      });
  }

  extractSender(conversationUsers: Array<BaseUser>, senderId: string) : BaseUser {
    const indexSender = conversationUsers.findIndex(user => user.publicId === senderId);
    return conversationUsers[indexSender];
  }
}
