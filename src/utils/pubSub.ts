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
  /** Triggered when a user taps a quick-reply button on a template message */
  button: 'button',
  /** Triggered when a user changes their phone number (legacy) */
  user_changed_number: 'user_changed_number',
  /** Triggered for WhatsApp Flow completion responses */
  nfm_reply: 'nfm_reply',
  /** Triggered when a user reacts to a message with an emoji */
  reaction: 'reaction',
  /** Triggered when an order is placed via a product catalog */
  order: 'order',
  /** Internal WhatsApp system notifications (number/identity/BSUID changes) */
  system: 'system',
  /** Message delivery/read/sent/failed status updates */
  status: 'status',
  /** Triggered when a user edits a message they previously sent */
  edit: 'edit',
  /** Triggered when a user deletes (revokes) a message for everyone */
  revoke: 'revoke',
  /** Triggered for an incoming message type this library does not model */
  unsupported: 'unsupported',
  /** Triggered when a WhatsApp user's BSUID changes (Meta 2026) */
  user_id_update: 'user_id_update',
  /** Triggered when a business username status changes (Meta 2026) */
  business_username_updates: 'business_username_updates',
  /** @deprecated alias of `business_username_updates` */
  business_username_update: 'business_username_update',
} as const satisfies Record<keyof FreeFormObjectMap, keyof FreeFormObjectMap>;

export type PubSubEvent = keyof typeof PubSubEvents;
