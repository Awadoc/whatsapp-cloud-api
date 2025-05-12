import express, { Router } from 'express';
import {
  Contact,
  InteractiveHeader,
  TemplateComponent,
  MarkAsRead,
  Message as WhatsappMessageObject,
} from './messages.types';
import { SendMessageResult } from './sendRequestHelper';
import { FreeFormObject } from './utils/misc';
import { PubSubEvent } from './utils/pubSub';

export interface Message {
  from: string;
  name: string | undefined;
  id: string;
  timestamp: string;
  type: PubSubEvent;
  data: FreeFormObject; // TODO: properly define interfaces for each type
}

// 👇 Base option for all send methods
export type BaseOptionType = {
  context?: WhatsappMessageObject['context'];
};

export interface Bot {
  getExpressRoute: (options?: {
    useMiddleware?: (app: express.Router) => void;
    webhookVerifyToken?: string;
  }) => Router;

  on: (event: PubSubEvent, cb: (message: Message) => void) => string;
  unsubscribe: (token: string) => string | boolean;

  sendText: (
    to: string,
    text: string,
    options?: BaseOptionType & {
      preview_url?: boolean;
    }
  ) => Promise<SendMessageResult>;

  sendMessage: (
    to: string,
    text: string,
    options?: BaseOptionType & {
      preview_url?: boolean;
    }
  ) => Promise<SendMessageResult>;

  sendImage: (
    to: string,
    urlOrObjectId: string,
    options?: BaseOptionType & {
      caption?: string;
    }
  ) => Promise<SendMessageResult>;

  sendDocument: (
    to: string,
    urlOrObjectId: string,
    options?: BaseOptionType & {
      caption?: string;
      filename?: string;
    }
  ) => Promise<SendMessageResult>;

  sendAudio: (
    to: string,
    urlOrObjectId: string,
    options?: BaseOptionType
  ) => Promise<SendMessageResult>;

  sendVideo: (
    to: string,
    urlOrObjectId: string,
    options?: BaseOptionType & {
      caption?: string;
    }
  ) => Promise<SendMessageResult>;

  sendSticker: (
    to: string,
    urlOrObjectId: string,
    options?: BaseOptionType
  ) => Promise<SendMessageResult>;

  sendLocation: (
    to: string,
    latitude: number,
    longitude: number,
    options?: BaseOptionType & {
      name?: string;
      address?: string;
    }
  ) => Promise<SendMessageResult>;

  sendTemplate: (
    to: string,
    name: string,
    languageCode: string,
    components?: TemplateComponent[],
    options?: BaseOptionType
  ) => Promise<SendMessageResult>;

  sendContacts: (
    to: string,
    contacts: Contact[],
    options?: BaseOptionType
  ) => Promise<SendMessageResult>;

  sendReplyButtons: (
    to: string,
    bodyText: string,
    buttons: {
      [id: string]: string | number;
    },
    options?: BaseOptionType & {
      footerText?: string;
      header?: InteractiveHeader;
    }
  ) => Promise<SendMessageResult>;

  sendList: (
    to: string,
    buttonName: string,
    bodyText: string,
    sections: {
      [sectionTitle: string]: {
        id: string | number;
        title: string | number;
        description?: string;
      }[];
    },
    options?: BaseOptionType & {
      footerText?: string;
      header?: InteractiveHeader;
    }
  ) => Promise<SendMessageResult>;

  sendCTAUrl: (
    to: string,
    bodyText: string,
    display_text: string,
    url: `http://${string}` | `https://${string}`,
    options?: BaseOptionType & {
      footerText?: string;
      header?: InteractiveHeader;
    }
  ) => Promise<SendMessageResult>;

  markAsRead: (
    message_id: string,
    status: MarkAsRead['status'],
    typing_indicator?: MarkAsRead['typing_indicator']
  ) => Promise<SendMessageResult>;
}

export type ICreateBot = (
  fromPhoneNumberId: string,
  accessToken: string,
  options?: {
    version?: string;
  }
) => Bot;
