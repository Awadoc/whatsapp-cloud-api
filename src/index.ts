import 'dotenv/config';

export { createBot } from './createBot';

export type {
  Bot,
  Message,
  GenericMessage,
  AllPossibleMessages,
  MessageEventCallback,
  SpecificEventCallback,
  BaseOptionType,
  SendFlowOptions,
  ICreateBot,
} from './createBot.types';

export type {
  SendMessageResult,
  UploadMediaResult,
} from './sendRequestHelper.types';

export type {
  FreeFormObject,
  FreeFormObjectMap,
  MessageData,
} from './utils/misc';

export { PubSubEvents } from './utils/pubSub';
export type { PubSubEvent } from './utils/pubSub';

export { Phone, UserId } from './recipient';
export type { RecipientTarget, PhoneTarget, UserIdTarget } from './recipient';
