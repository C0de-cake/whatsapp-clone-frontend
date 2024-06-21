import {Dayjs} from "dayjs";

export interface BaseUser {
  firstName?: string;
  lastName?: string;
  email?: string;
  imageUrl?: string;
  publicId?: string;
  lastSeen?: Dayjs;
}

export interface ConnectedUser extends BaseUser {
  authorities?: string[];
}
