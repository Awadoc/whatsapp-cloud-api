import {
  Contact,
  WebhookContact,
  InteractiveHeader,
  TemplateComponent,
  MarkAsRead,
  Message as WhatsappMessageObject,
  FlowMode,
  FlowAction,
  FlowActionPayload,
  FlowIdentifier,
} from './messages.types';
import {
  UploadMediaResult,
  SendMessageResult,
} from './sendRequestHelper.types';
import { FreeFormObject, FreeFormObjectMap } from './utils/misc';
import { PubSubEvent } from './utils/pubSub';

export interface GenericMessage<
  K extends keyof FreeFormObjectMap = keyof FreeFormObjectMap,
> {
  from: string;
  from_user_id?: string;
  name: string | undefined;
  id: string;
  timestamp: string;
  type: K;
  data: FreeFormObject<K>;
  contact?: WebhookContact;
}

export type AllPossibleMessages = {
  [K in keyof FreeFormObjectMap]: GenericMessage<K>;
}[keyof FreeFormObjectMap];

export type Message = AllPossibleMessages;

export type MessageEventCallback = (message: Message) => void;
export type SpecificEventCallback<K extends PubSubEvent> = (
  message: GenericMessage<K>,
) => void;

// 👇 Base option for all send methods
export type BaseOptionType = {
  context?: WhatsappMessageObject['context'];
};

// 👇 Options for sending flow messages
export interface SendFlowOptions extends BaseOptionType {
  /** Header for the flow message */
  header?: InteractiveHeader;
  /** Body text for the flow message (required) */
  body: string;
  /** Footer text for the flow message */
  footer?: string;
  /** Flow mode: 'draft' or 'published' (default: 'published') */
  mode?: FlowMode;
  /** Token to identify the flow session */
  flowToken?: string;
  /** Action type: 'navigate' or 'data_exchange' (default: 'navigate') */
  flowAction?: FlowAction;
  /** Payload for navigate action with initial screen and data */
  flowActionPayload?: FlowActionPayload;
}

export interface Bot {
  on(event: 'message', cb: MessageEventCallback): string;
  on<K extends PubSubEvent>(event: K, cb: SpecificEventCallback<K>): string;
  unsubscribe: (token: string) => string | boolean;

  sendText: (
    to: string,
    text: string,
    options?: BaseOptionType & {
      preview_url?: boolean;
    },
  ) => Promise<SendMessageResult>;

  sendMessage: (
    to: string,
    text: string,
    options?: BaseOptionType & {
      preview_url?: boolean;
    },
  ) => Promise<SendMessageResult>;

  sendImage: (
    to: string,
    urlOrObjectId: string,
    options?: BaseOptionType & {
      caption?: string;
    },
  ) => Promise<SendMessageResult>;

  sendDocument: (
    to: string,
    urlOrObjectId: string,
    options?: BaseOptionType & {
      caption?: string;
      filename?: string;
    },
  ) => Promise<SendMessageResult>;

  sendAudio: (
    to: string,
    urlOrObjectId: string,
    options?: BaseOptionType,
  ) => Promise<SendMessageResult>;

  sendVideo: (
    to: string,
    urlOrObjectId: string,
    options?: BaseOptionType & {
      caption?: string;
    },
  ) => Promise<SendMessageResult>;

  sendSticker: (
    to: string,
    urlOrObjectId: string,
    options?: BaseOptionType,
  ) => Promise<SendMessageResult>;

  sendLocation: (
    to: string,
    latitude: number,
    longitude: number,
    options?: BaseOptionType & {
      name?: string;
      address?: string;
    },
  ) => Promise<SendMessageResult>;

  sendTemplate: (
    to: string,
    name: string,
    languageCode: string,
    components?: TemplateComponent[],
    options?: BaseOptionType,
  ) => Promise<SendMessageResult>;

  sendContacts: (
    to: string,
    contacts: Contact[],
    options?: BaseOptionType,
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
    },
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
    },
  ) => Promise<SendMessageResult>;

  sendCTAUrl: (
    to: string,
    bodyText: string,
    display_text: string,
    url: `http://${string}` | `https://${string}`,
    options?: BaseOptionType & {
      footerText?: string;
      header?: InteractiveHeader;
    },
  ) => Promise<SendMessageResult>;

  /**
   * Send a WhatsApp Flow message to a user.
   *
   * @param to - Recipient phone number
   * @param flowIdOrName - Flow ID string, or object with flow_id or flow_name
   * @param ctaText - Call-to-action button text (max 20 chars, no emoji)
   * @param options - Flow message options including body text
   *
   * @example
   * ```typescript
   * // Send flow by ID
   * await bot.sendFlow('1234567890', 'flow_123', 'Book Now', {
   *   body: 'Click below to book an appointment',
   * });
   *
   * // Send flow by name with initial screen data
   * await bot.sendFlow('1234567890', { flow_name: 'booking_flow' }, 'Start', {
   *   body: 'Begin your booking',
   *   flowAction: 'navigate',
   *   flowActionPayload: {
   *     screen: 'WELCOME',
   *     data: { user_name: 'John' },
   *   },
   * });
   * ```
   */
  sendFlow: (
    to: string,
    flowIdOrName: string | FlowIdentifier,
    ctaText: string,
    options: SendFlowOptions,
  ) => Promise<SendMessageResult>;

  markAsRead: (
    message_id: string,
    status: MarkAsRead['status'],
    typing_indicator?: MarkAsRead['typing_indicator'],
  ) => Promise<SendMessageResult>;

  uploadMedia: (
    filePath: string | URL | Buffer,
    mimeType?: string | null,
    filename?: string,
  ) => Promise<UploadMediaResult>;
}

export type ICreateBot = (
  fromPhoneNumberId: string,
  accessToken: string,
  options?: {
    version?: string;
  },
) => Bot;
