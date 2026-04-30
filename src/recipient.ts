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
 * // Target by BSUID (new, for username users)
 * await bot.sendText(UserId(msg.from_user_id), 'Hello!');
 *
 * // Or just pass a plain string — treated as phone (backwards compatible)
 * await bot.sendText('+2349012345678', 'Hello!');
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
 * @param userId The Business-Scoped User ID (e.g. 'user.abc123bsuid')
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

/**
 * @internal — resolves any supported recipient input into the raw fields
 * the WhatsApp API expects: { to, recipient }.
 *
 * - Plain string → treated as phone number → `{ to: string, recipient: undefined }`
 * - `Phone(...)` → `{ to: string, recipient: undefined }`
 * - `UserId(...)` → `{ to: '', recipient: string }`
 */
export function resolveRecipient(
  input: string | RecipientTarget,
  explicitRecipient?: string,
): { to: string; recipient: string | undefined } {
  if (isRecipientTarget(input)) {
    if (input.kind === USER_ID_TARGET) {
      return { to: '', recipient: input.value };
    }
    // PhoneTarget
    return { to: input.value, recipient: explicitRecipient };
  }
  // Plain string — backwards compatible phone number
  return { to: input, recipient: explicitRecipient };
}
