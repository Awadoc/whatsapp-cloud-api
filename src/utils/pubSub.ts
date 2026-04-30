import { FreeFormObjectMap } from './misc';

// In utils/pubSub.ts - Add new event types
export const PubSubEvents = {
  // message: 'message',
  /** Triggered for every incoming text message */
  text: 'text',
  /** Triggered for incoming image messages */
  image: 'image',
  /** Triggered for incoming document/file messages */
  document: 'document',
  /** Triggered for incoming audio messages */
  audio: 'audio',
  /** Triggered for incoming video messages */
  video: 'video',
  /** Triggered for incoming sticker messages */
  sticker: 'sticker',
  /** Triggered for incoming location sharing */
  location: 'location',
  /** Triggered when a user shares their contact card */
  contacts: 'contacts',
  /** Triggered when a user clicks a button in an interactive button message */
  button_reply: 'button_reply',
  /** Triggered when a user selects an item from a list message */
  list_reply: 'list_reply',
  /** Triggered when a user changes their phone number */
  user_changed_number: 'user_changed_number',
  /** Triggered for WhatsApp Flow completion responses */
  nfm_reply: 'nfm_reply',
  /** Triggered when a user reacts to a message with an emoji */
  reaction: 'reaction',
  /** Triggered when an order is placed via a product catalog */
  order: 'order',
  /** Internal WhatsApp system notifications */
  system: 'system',
  /** Message delivery/read status updates */
  status: 'status',
  /** Triggered when a user's BSUID is updated (Meta 2026) */
  user_id_update: 'user_id_update',
  /** Triggered when a user updates their username or profile (Meta 2026) */
  business_username_update: 'business_username_update',
} as const satisfies Record<keyof FreeFormObjectMap, keyof FreeFormObjectMap>;

export type PubSubEvent = keyof typeof PubSubEvents;
