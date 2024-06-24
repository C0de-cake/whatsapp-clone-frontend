import {Message} from "./message.model";
import {BaseUser} from "../../shared/model/user.model";

export interface Conversation {
  publicId: string,
  name: string,
  members: Array<BaseUser>,
  messages: Array<Message>,
  active?: boolean
}

export interface ConversationToCreate {
  members: Array<string>,
  name: string
}
