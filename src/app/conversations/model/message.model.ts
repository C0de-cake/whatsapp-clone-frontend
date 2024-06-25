import {Dayjs} from "dayjs";

export type SendState = "TO_SEND" | "SENT" | "RECEIVED" | "READ"
export type MessageType = "TEXT" | "AUDIO" | "VIDEO" | "PICTURE"

export interface Message {
  textContent: string,
  sendDate?: Dayjs,
  conversationId: string,
  state?: SendState,
  publicId?: string,
  type: MessageType,
  mediaContent?: File,
  mimeType?: string,
  senderId?: string
}

export interface MessageMarkAsViewedResponse {
  conversationPublicId: string,
  nbMessagesUpdated: number
}
