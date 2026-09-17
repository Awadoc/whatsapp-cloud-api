# Migrating to Business-Scoped User IDs (BSUID)

WhatsApp is rolling out **usernames**. When a user adopts one, their phone number
stops being a reliable identifier — it may disappear from your webhooks entirely.
Meta's replacement is the **Business-Scoped User ID (BSUID)**.

This guide shows how to migrate **gradually and safely**, while WhatsApp is still
sending you phone numbers alongside BSUIDs.

- [The timeline you're migrating against](#timeline)
- [What a BSUID is](#what)
- [Step 1 — store both identifiers](#step1)
- [Step 2 — resolve an incoming message to one user](#step2)
- [Step 3 — keep the mapping fresh](#step3)
- [Step 4 — send messages](#step4)
- [Step 5 — ask for a phone number when you still need one](#step5)
- [Edge cases](#edge)
- [Checklist](#checklist)

---

<a name="timeline"></a>

## The timeline you're migrating against

| Now → gradually | What you receive |
| --- | --- |
| Most users, today | **phone number `wa_id` + BSUID `user_id`** in every webhook |
| A user adopts a username, you've messaged them in the last 30 days | still both |
| A user adopts a username, no recent contact | **BSUID only** — `wa_id` / `from` absent |
| A user changes their phone number | a `user_id_update` (and/or `system` `user_changed_user_id`) webhook — **their BSUID changes too** |

Key consequence: **you cannot wait.** A user who adopted a username more than 30
days ago will arrive looking like a brand-new contact if your only key is their
phone number. Start storing BSUIDs now, while you still get both.

---

<a name="what"></a>

## What a BSUID is

- A stable, unique ID for a user **scoped to your business portfolio**
  (e.g. `US.13491208655302741918`). The same person has a different BSUID with a
  different business.
- Present in **every** messages webhook, whether or not the user has a username.
- **Changes** when the user changes their phone number — you'll get a
  `user_id_update` webhook with `previous` → `current`.
- A `parent_user_id` (e.g. `US.ENT.118...`) also appears if your portfolios are
  enrolled in **parent BSUIDs**; it works across all enrolled portfolios.

---

<a name="step1"></a>

## Step 1 — store both identifiers

Add columns and **index the BSUID**. Treat BSUID as the primary key going
forward; keep the phone number as a secondary lookup and for template/OTP sends.

```sql
ALTER TABLE users ADD COLUMN bsuid           TEXT;
ALTER TABLE users ADD COLUMN parent_bsuid    TEXT;
ALTER TABLE users ADD COLUMN wa_username     TEXT;
ALTER TABLE users ADD COLUMN phone_e164      TEXT;   -- may become null over time
CREATE UNIQUE INDEX users_bsuid_idx        ON users (bsuid);
CREATE INDEX        users_phone_idx        ON users (phone_e164);
```

---

<a name="step2"></a>

## Step 2 — resolve an incoming message to one user

Every incoming `msg` carries a normalized `msg.identity`
([`getRecipientIdentity`](../API.md#recipients)):

```ts
interface RecipientIdentity {
  key: string;                 // BSUID if present, else phone — your lookup key
  primary: 'phone' | 'bsuid';
  waId?: string;
  userId?: string;             // BSUID
  parentUserId?: string;
  username?: string;
  phoneUnavailable: boolean;
  replyTarget?: RecipientTarget;
}
```

A **resolve-or-create** that survives the whole transition:

```ts
async function resolveUser(msg) {
  const { userId, parentUserId, waId, username } = msg.identity!;

  // 1. Prefer the BSUID — it's stable and always present going forward.
  let user = userId && await db.users.findByBsuid(userId);

  // 2. Fall back to phone (users seen before you started storing BSUIDs).
  if (!user && waId) user = await db.users.findByPhone(waId);

  // 3. First contact.
  if (!user) user = await db.users.create({});

  // 4. Backfill / refresh whatever this webhook told us.
  await db.users.update(user.id, {
    bsuid: userId ?? user.bsuid,
    parent_bsuid: parentUserId ?? user.parent_bsuid,
    phone_e164: waId ?? user.phone_e164,          // never null out a known number
    wa_username: username ?? user.wa_username,
  });

  return user;
}
```

Rules of thumb:

- **Match on BSUID first, phone second.** Once a user has adopted a username,
  only the BSUID is guaranteed.
- **Never overwrite a stored phone number with `undefined`.** An absent `wa_id`
  means "not shared this time", not "no longer valid".
- **Deduplicate.** If step 1 finds a BSUID row and step 2 also finds a different
  phone-only row, merge them (point conversations/bookings at the BSUID row,
  soft-delete the other).

---

<a name="step3"></a>

## Step 3 — keep the mapping fresh

### BSUID changed (`user_id_update`)

```ts
bot.on('user_id_update', async ({ data }) => {
  // { previous, current, wa_id?, parent_previous?, parent_current? }
  await db.users.remapBsuid(data.previous, data.current);
  if (data.parent_current) {
    await db.users.setParentBsuid(data.current, data.parent_current);
  }
});
```

The same change can also arrive in-thread as a `system` event:

```ts
bot.on('system', async ({ data }) => {
  if (data.type === 'user_changed_user_id' && data.user_id) {
    // data.body ~ "User X changed from <OLD_BSUID> to <NEW_BSUID>"
    await db.users.noteIdentityChange(data);
  }
});
```

### Username changed

Any subsequent message carries the new `msg.identity.username`; step 2 already
refreshes it. There is no separate per-user username webhook — only
`business_username_updates`, which is about **your own** business username.

---

<a name="step4"></a>

## Step 4 — send messages

Use `msg.replyTarget` when replying — it's already the right kind:

```ts
bot.on('text', (msg) => bot.sendText(msg.replyTarget!, 'Got it'));
```

Sending outside a webhook (a reminder, a broadcast): prefer the **phone number
when you still have it** — sending to a phone keeps the phone number flowing back
in your webhooks; sending only to a BSUID does not.

```ts
import { Phone, UserId } from '@awadoc/whatsapp-cloud-api';

const target = user.phone_e164 ? Phone(user.phone_e164) : UserId(user.bsuid);
await bot.sendText(target, 'Your appointment is tomorrow at 3pm.');
```

If you have both and want to be explicit, pass both — **Meta uses the phone
number** and you keep receiving it:

```ts
await bot.sendText(Phone(user.phone_e164), 'Reminder', { recipient: user.bsuid });
```

### Outside the 24-hour window

Free-form sends only work within 24h of the user's last inbound message. Outside
it, use an approved template ([`sendTemplate`](../API.md#sendtemplate)). Templates
can be sent to a BSUID — **except** one-tap / zero-tap / copy-code authentication
(OTP) templates, which require a phone number (`Phone(...)`).

---

<a name="step5"></a>

## Step 5 — ask for a phone number when you still need one

If your process genuinely needs a phone number (SMS fallback, delivery, KYC),
ask for it in-thread:

```ts
await bot.sendRequestContactInfo(msg.replyTarget!,
  'Share your number so we can also text you order updates:');
```

When the user taps it, a `contacts` event fires with their phone number — store
it against their BSUID:

```ts
bot.on('contacts', async (msg) => {
  const phone = msg.data?.[0]?.phones?.[0]?.wa_id ?? msg.data?.[0]?.phones?.[0]?.phone;
  if (phone && msg.from_user_id) {
    await db.users.setPhone(msg.from_user_id, phone);
  }
});
```

You can also put a `REQUEST_CONTACT_INFO` button on a `utility`/`marketing`
template via [`bot.templates.create`](../API.md#bot-templates).

---

<a name="edge"></a>

## Edge cases

| Situation | Handling |
| --- | --- |
| `msg.from` is `undefined` / `''` | Expected for username users. Use `msg.from_user_id` / `msg.identity.key`. Never crash on empty `from`. |
| Same person, two DB rows (BSUID row + old phone row) | Merge on next contact; keep the BSUID row. |
| User messaged you >30 days ago, then adopted a username | Arrives as BSUID-only and looks new. If you stored their BSUID earlier, step 2 still matches. If not, that thread's history is unrecoverable — hence "start now". |
| `parent_user_id` present | Store it; you can send to it and it works across enrolled portfolios. |
| Authentication (OTP) template to a username user with no phone | Not possible — `sendRequestContactInfo` first, or use a non-auth template. |
| Status webhook for a message you sent to a phone number | `recipient_user_id` (BSUID) is still included on `delivered`/`read` — a free backfill opportunity. |

---

<a name="checklist"></a>

## Checklist

- [ ] `bsuid` column added and uniquely indexed; `parent_bsuid`, `wa_username` added.
- [ ] Inbound handler resolves **BSUID first, phone second**, and backfills both.
- [ ] Inbound handler never nulls a known phone number.
- [ ] `user_id_update` handler remaps `previous` → `current`.
- [ ] `system` handler covers `type: 'user_changed_user_id'`.
- [ ] Reminders/broadcasts send to `Phone(...)` when a number is known.
- [ ] OTP/auth templates only ever sent to `Phone(...)`.
- [ ] Webhook subscribed to `user_id_update` and `business_username_updates` in the Meta dashboard.
- [ ] Webhook signature verification enabled (`appSecret`).
- [ ] Code paths that assumed `msg.from` is always present are audited.
