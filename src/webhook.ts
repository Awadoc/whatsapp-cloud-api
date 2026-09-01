/**
 * Framework-agnostic WhatsApp webhook parsing.
 *
 * Both the Express and Next.js integrations are thin wrappers around the functions
 * here. Keeping the parsing in one place means the HTTP-status contract, the
 * identifier handling (phone number vs BSUID) and every event type behave
 * identically regardless of framework.
 */
import PubSub from 'pubsub-js';
import { FreeFormObject } from './utils/misc';
import { PubSubEvent, PubSubEvents } from './utils/pubSub';
import { Message } from './createBot.types';
import { WebhookContact } from './messages.types';
import {
  Phone, UserId, RecipientTarget, getRecipientIdentity, RecipientIdentity,
} from './recipient';
import { verifyWebhookSignature } from './utils/signature';
import { DebugLogger } from './utils/logger';

// ============================================================================
// Options
// ============================================================================

export interface WebhookOptions {
  /** Token configured in the Meta app dashboard for the GET verification handshake. */
  webhookVerifyToken?: string;
  /**
   * Your Meta app secret. When provided, every POST is rejected with 401 unless it
   * carries a valid `X-Hub-Signature-256` header. Strongly recommended in production.
   */
  appSecret?: string;
}

// ============================================================================
// GET — verification handshake
// ============================================================================

export interface VerifyResult {
  status: number;
  body: string;
}

export const verifyWebhookChallenge = (
  query: Record<string, string | string[] | undefined>,
  webhookVerifyToken: string | undefined,
): VerifyResult => {
  if (!webhookVerifyToken) {
    return { status: 500, body: 'Webhook verification not configured' };
  }

  const pick = (
    v: string | string[] | undefined,
  ): string | undefined => (Array.isArray(v) ? v[0] : v);
  const mode = pick(query['hub.mode']);
  const token = pick(query['hub.verify_token']);
  const challenge = pick(query['hub.challenge']);

  if (!mode || !token || !challenge) {
    return { status: 403, body: 'Forbidden' };
  }
  if (mode === 'subscribe' && token === webhookVerifyToken) {
    return { status: 200, body: challenge };
  }
  return { status: 403, body: 'Forbidden' };
};

// ============================================================================
// POST — payload parsing
// ============================================================================

export interface ParsedEvent {
  event: PubSubEvent;
  payload: Message;
}

export interface ParseResult {
  /** HTTP status the handler should return. Always 2xx for a well-formed Meta payload. */
  status: number;
  /** Events to dispatch to `bot.on(...)` subscribers. */
  events: ParsedEvent[];
}

interface RawContact {
  profile?: { name?: string; username?: string };
  wa_id?: string;
  user_id?: string;
  parent_user_id?: string;
}

const findContact = (
  contacts: RawContact[] | undefined,
  from: string | undefined,
  fromUserId: string | undefined,
): RawContact | undefined => {
  if (!contacts?.length) return undefined;
  return (
    contacts.find((c) => (fromUserId && c.user_id === fromUserId)
      || (from && c.wa_id === from))
    || contacts[0]
  );
};

const buildReplyTarget = (
  from: string | undefined,
  bsuid: string | undefined,
): RecipientTarget | undefined => {
  if (from) return Phone(from);
  if (bsuid) return UserId(bsuid);
  return undefined;
};

const buildIdentity = (
  from: string | undefined,
  bsuid: string | undefined,
  parentBsuid: string | undefined,
  contact: RawContact | undefined,
): RecipientIdentity => getRecipientIdentity({
  wa_id: from || contact?.wa_id,
  user_id: bsuid,
  parent_user_id: parentBsuid,
  username: contact?.profile?.username,
});

/** Turns one incoming `messages[]` entry into a ParsedEvent (or null if unroutable). */
const parseMessage = (
  messageData: FreeFormObject<PubSubEvent> & Record<string, any>,
  contacts: RawContact[] | undefined,
): ParsedEvent | null => {
  const {
    from, id, timestamp, type, context,
    from_user_id: fromUserId,
    from_parent_user_id: fromParentUserId,
    ...rest
  } = messageData;

  let event: PubSubEvent | undefined;
  let data: FreeFormObject<PubSubEvent> | undefined;

  switch (type) {
    case 'text':
      event = PubSubEvents.text;
      data = { text: rest.text?.body } as FreeFormObject<'text'>;
      break;

    case 'image':
    case 'document':
    case 'audio':
    case 'video':
    case 'sticker':
    case 'location':
    case 'contacts':
      event = PubSubEvents[type as PubSubEvent];
      data = rest[type as string] as FreeFormObject<PubSubEvent>;
      break;

    case 'interactive':
      if (rest.interactive) {
        event = rest.interactive.type as PubSubEvent;
        if (rest.interactive.nfm_reply) {
          const nfmReply = rest.interactive.nfm_reply as {
            response_json?: string; body?: string; name?: string;
          };
          let parsedResponse: Record<string, unknown> | undefined;
          if (nfmReply.response_json) {
            try {
              parsedResponse = JSON.parse(nfmReply.response_json);
            } catch { /* leave response undefined */ }
          }
          data = { ...nfmReply, response: parsedResponse } as FreeFormObject<'nfm_reply'>;
        } else {
          data = {
            ...(rest.interactive.list_reply || rest.interactive.button_reply),
          } as FreeFormObject<PubSubEvent>;
        }
      }
      break;

    case 'button':
      event = PubSubEvents.button;
      data = rest.button as FreeFormObject<'button'>;
      break;

    case 'reaction':
      event = PubSubEvents.reaction;
      data = rest.reaction as FreeFormObject<'reaction'>;
      break;

    case 'order':
      event = PubSubEvents.order;
      data = rest.order as FreeFormObject<'order'>;
      break;

    case 'edit':
      event = PubSubEvents.edit;
      data = rest.edit as FreeFormObject<'edit'>;
      break;

    case 'revoke':
      event = PubSubEvents.revoke;
      data = rest.revoke as FreeFormObject<'revoke'>;
      break;

    case 'system':
      event = PubSubEvents.system;
      data = rest.system as FreeFormObject<'system'>;
      break;

    default:
      event = PubSubEvents.unsupported;
      data = { raw: messageData, errors: rest.errors } as FreeFormObject<'unsupported'>;
      break;
  }

  if (!event || !data) return null;

  const contact = findContact(contacts, from, fromUserId);
  const bsuid = fromUserId || contact?.user_id;
  const parentBsuid = fromParentUserId || contact?.parent_user_id;
  const isSystemMessage = type === 'system';

  const payload = {
    from,
    from_user_id: bsuid,
    from_parent_user_id: parentBsuid,
    replyTarget: buildReplyTarget(from, bsuid),
    identity: buildIdentity(from, bsuid, parentBsuid, contact),
    name: isSystemMessage ? undefined : contact?.profile?.name,
    id,
    timestamp,
    type: event,
    data: context ? { ...data, context } : data,
    contact: contact as unknown as WebhookContact,
  } as Message;

  return { event, payload };
};

/** Turns one `statuses[]` entry into a `status` ParsedEvent. */
const parseStatus = (
  status: Record<string, any>,
  contacts: RawContact[] | undefined,
): ParsedEvent => {
  const contact = findContact(contacts, status.recipient_id, status.recipient_user_id);
  const bsuid = status.recipient_user_id || contact?.user_id;
  const parentBsuid = status.recipient_parent_user_id || contact?.parent_user_id;

  const payload = {
    from: status.recipient_id,
    from_user_id: bsuid,
    from_parent_user_id: parentBsuid,
    replyTarget: buildReplyTarget(status.recipient_id, bsuid),
    identity: buildIdentity(status.recipient_id, bsuid, parentBsuid, contact),
    name: contact?.profile?.name,
    id: status.id,
    timestamp: status.timestamp,
    type: PubSubEvents.status,
    data: status as FreeFormObject<'status'>,
    contact: contact as unknown as WebhookContact,
  } as Message;

  return { event: PubSubEvents.status, payload };
};

/** `user_id_update` change field. */
const parseUserIdUpdate = (value: Record<string, any>): ParsedEvent => {
  const update = value.user_id_update?.[0] ?? {};
  const previous = update.user_id?.previous ?? value.old_user_id;
  const current = update.user_id?.current ?? value.new_user_id;
  const data = {
    wa_id: update.wa_id ?? value.contacts?.[0]?.wa_id,
    detail: update.detail,
    previous,
    current,
    parent_previous: update.parent_user_id?.previous,
    parent_current: update.parent_user_id?.current,
    old_user_id: previous,
    new_user_id: current,
  } as FreeFormObject<'user_id_update'>;

  return {
    event: PubSubEvents.user_id_update,
    payload: {
      from: data.wa_id,
      from_user_id: current,
      replyTarget: buildReplyTarget(data.wa_id, current),
      id: '',
      timestamp: Math.floor(Date.now() / 1000).toString(),
      type: PubSubEvents.user_id_update,
      data,
    } as Message,
  };
};

/** `business_username_updates` change field. */
const parseBusinessUsernameUpdate = (value: Record<string, any>): ParsedEvent => {
  const data = {
    display_phone_number: value.display_phone_number,
    username: value.username,
    status: value.status,
  } as FreeFormObject<'business_username_updates'>;

  return {
    event: PubSubEvents.business_username_updates,
    payload: {
      // `user_id` only appears on the deprecated singular payload shape.
      from_user_id: value.user_id,
      id: '',
      timestamp: Math.floor(Date.now() / 1000).toString(),
      type: PubSubEvents.business_username_updates,
      data,
    } as Message,
  };
};

/**
 * Parse a full Meta webhook body into events to dispatch and the HTTP status to reply.
 *
 * Contract:
 * - Any recognisable `whatsapp_business_account` payload → **200** (never make Meta
 *   retry a delivery/read receipt or a change notification).
 * - Unrecognisable body → **404** (matches Meta's own "not a whatsapp object" guidance).
 */
const parseChange = (
  change: any,
  fromPhoneNumberId: string,
): ParsedEvent[] => {
  const { value = {}, field } = change as { value?: any; field?: string };
  const phoneNumberId = value.metadata?.phone_number_id;

  // Some change fields (username updates) are account-scoped and carry no
  // phone_number_id; only filter when one is present.
  if (phoneNumberId && phoneNumberId !== fromPhoneNumberId) return [];

  if (field === 'user_id_update') return [parseUserIdUpdate(value)];
  if (field === 'business_username_updates' || field === 'business_username_update') {
    return [parseBusinessUsernameUpdate(value)];
  }

  const { contacts } = value as { contacts?: RawContact[] };
  const statusEvents: ParsedEvent[] = (value.statuses ?? []).map(
    (s: Record<string, any>) => parseStatus(s, contacts),
  );
  const messageEvents: ParsedEvent[] = (value.messages ?? [])
    .map((m: any) => parseMessage(m, contacts))
    .filter((e: ParsedEvent | null): e is ParsedEvent => e !== null);

  return [...statusEvents, ...messageEvents];
};

export const parseWebhookPayload = (
  body: any,
  fromPhoneNumberId: string,
): ParseResult => {
  if (!body || body.object !== 'whatsapp_business_account') {
    return { status: 404, events: [] };
  }

  const events: ParsedEvent[] = (body.entry ?? []).flatMap(
    (entry: any) => (entry.changes ?? []).flatMap(
      (change: any) => parseChange(change, fromPhoneNumberId),
    ),
  );

  return { status: 200, events };
};

// ============================================================================
// Dispatch
// ============================================================================

export const publishWebhookEvents = (
  fromPhoneNumberId: string,
  events: ParsedEvent[],
): void => {
  events.forEach(({ event, payload }) => {
    [
      `bot-${fromPhoneNumberId}-message`,
      `bot-${fromPhoneNumberId}-${event}`,
    ].forEach((topic) => PubSub.publish(topic, payload));

    // Deprecated alias: also fire the singular username event.
    if (event === PubSubEvents.business_username_updates) {
      PubSub.publish(`bot-${fromPhoneNumberId}-business_username_update`, payload);
    }
  });
};

/**
 * Handle a POST body end-to-end: optional signature check, parse, dispatch.
 * `rawBody` is required only when `options.appSecret` is set.
 */
export const handleWebhookPost = (
  body: any,
  fromPhoneNumberId: string,
  options: WebhookOptions | undefined,
  rawBody: string | Buffer | undefined,
  signatureHeader: string | undefined,
): { status: number } => {
  DebugLogger.logIncomingWebhook(body);

  if (options?.appSecret) {
    const ok = verifyWebhookSignature(
      rawBody ?? JSON.stringify(body ?? {}),
      signatureHeader,
      options.appSecret,
    );
    if (!ok) return { status: 401 };
  }

  const { status, events } = parseWebhookPayload(body, fromPhoneNumberId);
  if (events.length) publishWebhookEvents(fromPhoneNumberId, events);
  return { status };
};
