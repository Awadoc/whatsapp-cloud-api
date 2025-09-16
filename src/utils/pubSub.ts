import { FreeFormObjectMap } from './misc';

// In utils/pubSub.ts - Add new event types
export const PubSubEvents = {
  // message: 'message',
  text: 'text',
  image: 'image',
  document: 'document',
  audio: 'audio',
  video: 'video',
  sticker: 'sticker',
  location: 'location',
  contacts: 'contacts',
  button_reply: 'button_reply',
  list_reply: 'list_reply',
  user_changed_number: 'user_changed_number',
  nfm_reply: 'nfm_reply',
  reaction: 'reaction',
  order: 'order',
  system: 'system',
} as const satisfies Record<
keyof FreeFormObjectMap,
keyof FreeFormObjectMap
>;

export type PubSubEvent = keyof typeof PubSubEvents;
