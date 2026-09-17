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
import { RecipientTarget, RecipientIdentity } from './recipient';
import { TemplatesApi } from './management/templates';
import { UsernameApi } from './management/username';
import { BusinessProfileApi } from './management/businessProfile';
import { BlockUsersApi } from './management/blockUsers';

export interface GenericMessage<
  K extends keyof FreeFormObjectMap = keyof FreeFormObjectMap,
> {
  /** Sender phone number. May be `undefined`/empty for username users. */
  from?: string;
  from_user_id?: string;
  from_parent_user_id?: string;
  name: string | undefined;
  id: string;
  timestamp: string;
  type: K;
  data: FreeFormObject<K>;
  contact?: WebhookContact;
  /** Ready-to-use send target for replying (phone or BSUID, whichever is available). */
  replyTarget?: RecipientTarget;
  /** Normalized identity: which identifier you got, the stable key, username, etc. */
  identity?: RecipientIdentity;
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
  /** Recipient BSUID. Use this if you don't have the user's phone number. */
  recipient?: string;
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
    to: string | RecipientTarget,
    text: string,
    options?: BaseOptionType & {
      preview_url?: boolean;
    },
  ) => Promise<SendMessageResult>;

  sendMessage: (
    to: string | RecipientTarget,
    text: string,
    options?: BaseOptionType & {
      preview_url?: boolean;
    },
  ) => Promise<SendMessageResult>;

  sendImage: (
    to: string | RecipientTarget,
    urlOrObjectId: string,
    options?: BaseOptionType & {
      caption?: string;
    },
  ) => Promise<SendMessageResult>;

  sendDocument: (
    to: string | RecipientTarget,
    urlOrObjectId: string,
    options?: BaseOptionType & {
      caption?: string;
      filename?: string;
    },
  ) => Promise<SendMessageResult>;

  sendAudio: (
    to: string | RecipientTarget,
    urlOrObjectId: string,
    options?: BaseOptionType,
  ) => Promise<SendMessageResult>;

  sendVideo: (
    to: string | RecipientTarget,
    urlOrObjectId: string,
    options?: BaseOptionType & {
      caption?: string;
    },
  ) => Promise<SendMessageResult>;

  sendSticker: (
    to: string | RecipientTarget,
    urlOrObjectId: string,
    options?: BaseOptionType,
  ) => Promise<SendMessageResult>;

  sendLocation: (
    to: string | RecipientTarget,
    latitude: number,
    longitude: number,
    options?: BaseOptionType & {
      name?: string;
      address?: string;
    },
  ) => Promise<SendMessageResult>;

  sendTemplate: (
    to: string | RecipientTarget,
    name: string,
    languageCode: string,
    components?: TemplateComponent[],
    options?: BaseOptionType,
  ) => Promise<SendMessageResult>;

  sendContacts: (
    to: string | RecipientTarget,
    contacts: Contact[],
    options?: BaseOptionType,
  ) => Promise<SendMessageResult>;

  sendReplyButtons: (
    to: string | RecipientTarget,
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
    to: string | RecipientTarget,
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
    to: string | RecipientTarget,
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
   * @param to - Recipient phone number or typed target
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
    to: string | RecipientTarget,
    flowIdOrName: string | FlowIdentifier,
    ctaText: string,
    options: SendFlowOptions,
  ) => Promise<SendMessageResult>;

  /**
   * React to a message with an emoji. Pass an empty string (or omit `emoji`) to
   * remove a reaction you previously sent.
   */
  sendReaction: (
    to: string | RecipientTarget,
    messageId: string,
    emoji?: string,
    options?: BaseOptionType,
  ) => Promise<SendMessageResult>;

  /**
   * Send an interactive "share your phone number" prompt (Meta 2026). Useful once a
   * user has adopted a username and you still need their number.
   */
  sendRequestContactInfo: (
    to: string | RecipientTarget,
    bodyText: string,
    options?: BaseOptionType & {
      footerText?: string;
      header?: InteractiveHeader;
    },
  ) => Promise<SendMessageResult>;

  /**
   * Mark an inbound message as read (and optionally show the typing indicator).
   *
   * `markAsRead(id)` — mark read
   * `markAsRead(id, true)` — mark read + typing indicator
   * `markAsRead(id, 'read', { type: 'text' })` — legacy form, still works
   */
  markAsRead: (
    message_id: string,
    statusOrTyping?: MarkAsRead['status'] | boolean,
    typing_indicator?: MarkAsRead['typing_indicator'] | boolean,
  ) => Promise<SendMessageResult>;

  uploadMedia: (
    filePath: string | URL | Buffer,
    mimeType?: string | null,
    filename?: string,
  ) => Promise<UploadMediaResult>;

  /** Message-template management (needs `wabaId`). */
  templates: TemplatesApi;
  /** Business username management (Meta 2026). */
  username: UsernameApi;
  /** Business profile (about, address, websites, …). */
  profile: BusinessProfileApi;
  /** Block / unblock users. */
  blockUsers: BlockUsersApi;
}

export type ICreateBot = (
  fromPhoneNumberId: string,
  accessToken: string,
  options?: {
    /** Graph API version, e.g. `v21.0`. Defaults to `v20.0`. */
    version?: string;
    /** WhatsApp Business Account id — required only for `bot.templates.*`. */
    wabaId?: string;
    /** Meta app secret — enables webhook signature verification when passed to the route. */
    appSecret?: string;
  },
) => Bot;
