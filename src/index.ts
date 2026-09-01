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

export { Phone, UserId, getRecipientIdentity } from './recipient';
export type {
  RecipientTarget,
  PhoneTarget,
  UserIdTarget,
  RecipientIdentity,
  ResolvedRecipient,
} from './recipient';

// Webhook internals — for building a custom (non-Express/Next) server.
export {
  parseWebhookPayload,
  publishWebhookEvents,
  verifyWebhookChallenge,
  handleWebhookPost,
} from './webhook';
export type { WebhookOptions, ParsedEvent, ParseResult } from './webhook';
export { verifyWebhookSignature } from './utils/signature';

// Account-level management APIs.
export { authTemplateComponents } from './management/templates';
export type {
  TemplatesApi,
  TemplateCategory,
  TemplateStatus,
  MessageTemplateSummary,
  CreateTemplateInput,
} from './management/templates';
export type { UsernameApi, UsernameStatus } from './management/username';
export type { BusinessProfile, BusinessProfileApi } from './management/businessProfile';
export type { BlockUsersApi, BlockedUser } from './management/blockUsers';
