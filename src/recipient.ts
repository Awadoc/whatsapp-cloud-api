/**
 * Recipient targeting helpers for WhatsApp Cloud API.
 *
 * Use these when sending messages to identify whether you're targeting a user
 * by phone number or by BSUID (Business-Scoped User ID).
 *
 * @example
 * import { Phone, UserId } from '@awadoc/whatsapp-cloud-api';
 *
 * // Target by phone number (traditional)
 * await bot.sendText(Phone('+2349012345678'), 'Hello!');
 *
 * // Target by BSUID (for users who adopted a username)
 * await bot.sendText(UserId(msg.from_user_id), 'Hello!');
 *
 * // Or just pass a plain string — treated as phone (backwards compatible)
 * await bot.sendText('+2349012345678', 'Hello!');
 *
 * // Or reply to an incoming message without caring which it is
 * await bot.sendText(msg.replyTarget, 'Hello!');
 */

/** @internal */
const PHONE_TARGET = 'phone' as const;
/** @internal */
const USER_ID_TARGET = 'user_id' as const;

/** A recipient identified by their phone number (wa_id). */
export interface PhoneTarget {
  readonly kind: typeof PHONE_TARGET;
  readonly value: string;
}

/** A recipient identified by their Business-Scoped User ID (BSUID). */
export interface UserIdTarget {
  readonly kind: typeof USER_ID_TARGET;
  readonly value: string;
}

/**
 * A typed recipient target — either a phone number or a BSUID.
 * Plain strings are also accepted in all send methods and treated as phone numbers.
 */
export type RecipientTarget = PhoneTarget | UserIdTarget;

/**
 * Create a phone-number-based recipient target.
 * @param phoneNumber The E.164 phone number (e.g. '+2349012345678')
 */
export function Phone(phoneNumber: string): PhoneTarget {
  return { kind: PHONE_TARGET, value: phoneNumber };
}

/**
 * Create a BSUID-based recipient target.
 * @param userId The Business-Scoped User ID (e.g. 'US.13491208655302741918')
 */
export function UserId(userId: string): UserIdTarget {
  return { kind: USER_ID_TARGET, value: userId };
}

/** @internal — checks if a value is a RecipientTarget (not a plain string) */
export function isRecipientTarget(v: unknown): v is RecipientTarget {
  return (
    typeof v === 'object'
    && v !== null
    && 'kind' in v
    && ((v as RecipientTarget).kind === PHONE_TARGET
      || (v as RecipientTarget).kind === USER_ID_TARGET)
  );
}

/** The raw recipient fields the Messages API expects. */
export interface ResolvedRecipient {
  /** Present only when targeting by phone number. */
  to?: string;
  /** Present only when targeting by BSUID / parent BSUID. */
  recipient?: string;
}

/**
 * @internal — resolves any supported recipient input into the raw fields
 * the WhatsApp API expects.
 *
 * - Plain string → `{ to: string }`
 * - `Phone(...)` → `{ to: string }` (plus any explicit `recipient` override)
 * - `UserId(...)` → `{ recipient: string }` — `to` is **omitted**, not sent empty
 */
export function resolveRecipient(
  input: string | RecipientTarget,
  explicitRecipient?: string,
): ResolvedRecipient {
  if (isRecipientTarget(input)) {
    if (input.kind === USER_ID_TARGET) {
      return { recipient: input.value };
    }
    return explicitRecipient
      ? { to: input.value, recipient: explicitRecipient }
      : { to: input.value };
  }
  return explicitRecipient ? { to: input, recipient: explicitRecipient } : { to: input };
}

// ============================================================================
// Identity — "which identifier did I actually receive?"
// ============================================================================

/**
 * A normalized view of who a webhook is about, so callers don't have to inspect
 * empty strings and missing fields themselves.
 */
export interface RecipientIdentity {
  /** The stable key to use in your database. Prefers BSUID, falls back to phone. */
  key: string;
  /** `'bsuid'` when the phone number is unavailable, otherwise `'phone'`. */
  primary: 'phone' | 'bsuid';
  /** Phone number, if WhatsApp included one. */
  waId?: string;
  /** Business-Scoped User ID, if present. */
  userId?: string;
  /** Parent BSUID, if parent BSUIDs are enabled on the portfolio. */
  parentUserId?: string;
  /** The user's WhatsApp username, if they have adopted one. */
  username?: string;
  /** `true` when WhatsApp did not share a phone number for this user. */
  phoneUnavailable: boolean;
  /** A ready-to-use send target for replying. */
  replyTarget?: RecipientTarget;
}

export function getRecipientIdentity(input: {
  wa_id?: string;
  user_id?: string;
  parent_user_id?: string;
  username?: string;
}): RecipientIdentity {
  const waId = input.wa_id || undefined;
  const userId = input.user_id || undefined;
  const primary: 'phone' | 'bsuid' = waId ? 'phone' : 'bsuid';
  const key = (userId || waId) as string;

  let replyTarget: RecipientTarget | undefined;
  if (waId) replyTarget = Phone(waId);
  else if (userId) replyTarget = UserId(userId);

  return {
    key,
    primary,
    waId,
    userId,
    parentUserId: input.parent_user_id || undefined,
    username: input.username || undefined,
    phoneUnavailable: !waId,
    replyTarget,
  };
}
