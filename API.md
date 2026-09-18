# API Reference

`@awadoc/whatsapp-cloud-api` — a Node.js client for the WhatsApp Cloud API: send
every message type, receive webhooks as typed events, manage templates and the
business username, and stay compliant with Meta's 2026 **Business-Scoped User ID
(BSUID) / Username** rollout.

- [Install](#install)
- [Quick start](#quick-start)
- [`createBot(phoneNumberId, accessToken, options?)`](#createbot)
- [Sending messages](#sending-messages)
  - [`sendText` / `sendMessage`](#sendtext)
  - [`sendImage` / `sendVideo` / `sendAudio` / `sendDocument` / `sendSticker`](#media)
  - [`sendLocation`](#sendlocation)
  - [`sendContacts`](#sendcontacts)
  - [`sendReplyButtons`](#sendreplybuttons)
  - [`sendList`](#sendlist)
  - [`sendCTAUrl`](#sendctaurl)
  - [`sendReaction`](#sendreaction)
  - [`sendRequestContactInfo`](#sendrequestcontactinfo)
  - [`sendTemplate`](#sendtemplate)
  - [`sendFlow`](#sendflow)
  - [`markAsRead`](#markasread)
  - [`uploadMedia`](#uploadmedia)
- [Recipients: phone numbers and BSUIDs](#recipients)
- [Receiving: `bot.on(event, cb)`](#receiving)
  - [Event reference](#event-reference)
  - [The `Message` object](#message-object)
  - [`status` events (delivery & read receipts)](#status-events)
  - [BSUID / username webhooks](#bsuid-webhooks)
- [Webhook servers](#webhook-servers)
  - [Express](#express)
  - [Next.js](#nextjs)
  - [Signature verification](#signature-verification)
  - [Custom server](#custom-server)
- [Account management APIs](#management)
  - [`bot.templates`](#bot-templates)
  - [`bot.username`](#bot-username)
  - [`bot.profile`](#bot-profile)
  - [`bot.blockUsers`](#bot-blockusers)
- [Flows](#flows)
- [Migrating to BSUID](./docs/BSUID_GUIDE.md)

---

<a name="install"></a>

## Install

```bash
npm install @awadoc/whatsapp-cloud-api
```

`express` and `next` are optional peer dependencies — install whichever webhook
integration you use.

---

<a name="quick-start"></a>

## Quick start

```ts
import express from 'express';
import { createBot } from '@awadoc/whatsapp-cloud-api';
import { getExpressRoute } from '@awadoc/whatsapp-cloud-api/express';

const phoneId = process.env.PHONE_NUMBER_ID!;
const bot = createBot(phoneId, process.env.ACCESS_TOKEN!, {
  wabaId: process.env.WABA_ID,        // needed only for bot.templates.*
  appSecret: process.env.APP_SECRET,  // enables webhook signature checks
});

const app = express();
app.use('/webhook', getExpressRoute(phoneId, {
  webhookVerifyToken: process.env.VERIFY_TOKEN,
  appSecret: process.env.APP_SECRET,
}));

bot.on('text', async (msg) => {
  await bot.markAsRead(msg.id, true);           // read receipt + typing indicator
  await bot.sendText(msg.replyTarget!, `You said: ${msg.data.text}`);
});

bot.on('status', (s) => {
  console.log(s.data.status, '→', s.data.id);   // sent | delivered | read | failed
});

app.listen(3000);
```

---

<a name="createbot"></a>

## `createBot(phoneNumberId, accessToken, options?)`

| Param | Type | Description |
| --- | --- | --- |
| `phoneNumberId` | `string` | Business phone number ID (from Meta app dashboard → WhatsApp → API Setup). |
| `accessToken` | `string` | A system-user or temporary access token. |
| `options.version` | `string` | Graph API version. Default `v20.0`. |
| `options.wabaId` | `string` | WhatsApp Business Account ID. Required only for [`bot.templates`](#bot-templates). |
| `options.appSecret` | `string` | Meta app secret. Passed here for convenience; the value that matters is the one you pass to the webhook route for [signature verification](#signature-verification). |

Returns a `Bot`. `createBot` performs no network calls.

---

<a name="sending-messages"></a>

## Sending messages

Every `send*` method:

- takes the recipient as its first argument — a **plain string** (phone number),
  `Phone(...)`, `UserId(...)`, or the `msg.replyTarget` from an incoming message
  (see [Recipients](#recipients));
- accepts an `options` object whose common fields are:

  | Field | Type | Description |
  | --- | --- | --- |
  | `context` | `{ message_id: string }` | Quote/reply to a specific message. |
  | `recipient` | `string` | An explicit BSUID, when the first arg is a phone number. |

- returns a `SendMessageResult`:

  ```ts
  interface SendMessageResult {
    messageId: string;       // wamid
    phoneNumber?: string;    // echo of the `input` you sent
    whatsappId?: string;     // wa_id, when sent to a phone number
    userId?: string;         // BSUID, when sent to a BSUID
  }
  ```

- **throws** the raw Meta error body on failure (`{ error: { message, code, ... } }`).

<a name="sendtext"></a>

### `sendText(to, text, options?)` · `sendMessage(...)` (alias)

```ts
await bot.sendText('2348012345678', 'Hello 👋', { preview_url: true });
```

| Option | Type | Description |
| --- | --- | --- |
| `preview_url` | `boolean` | Render a link preview for the first URL in `text`. |

<a name="media"></a>

### `sendImage` · `sendVideo` · `sendAudio` · `sendDocument` · `sendSticker`

```ts
await bot.sendImage(to, 'https://example.com/pic.jpg', { caption: 'Nice' });
await bot.sendImage(to, mediaObjectId);                    // id from uploadMedia()
await bot.sendDocument(to, url, { filename: 'invoice.pdf', caption: 'Your invoice' });
```

`urlOrObjectId` is either an `http(s)` link or a media object ID from
[`uploadMedia`](#uploadmedia). Options: `caption` (image/video/document),
`filename` (document).

<a name="sendlocation"></a>

### `sendLocation(to, latitude, longitude, options?)`

```ts
await bot.sendLocation(to, 6.5244, 3.3792, { name: 'Lagos', address: 'Nigeria' });
```

<a name="sendcontacts"></a>

### `sendContacts(to, contacts, options?)`

`contacts` is an array of [contact objects](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages#contacts-object).

<a name="sendreplybuttons"></a>

### `sendReplyButtons(to, bodyText, buttons, options?)`

Up to **3** tappable buttons. `buttons` maps the id echoed back on tap → the label.

```ts
await bot.sendReplyButtons(to, 'Confirm your booking?', {
  yes: 'Yes, confirm',
  no: 'Cancel',
}, { footerText: 'Reply within 24h' });
```

The tap arrives as a [`button_reply`](#event-reference) event.

<a name="sendlist"></a>

### `sendList(to, buttonName, bodyText, sections, options?)`

```ts
await bot.sendList(to, 'View slots', 'Pick a time', {
  Morning: [{ id: '9am', title: '09:00' }, { id: '10am', title: '10:00' }],
  Afternoon: [{ id: '2pm', title: '14:00' }],
});
```

Max 10 rows total across sections. Selection arrives as a [`list_reply`](#event-reference) event.

<a name="sendctaurl"></a>

### `sendCTAUrl(to, bodyText, displayText, url, options?)`

A single URL button. `url` must be `http(s)` (enforced at compile time).

```ts
await bot.sendCTAUrl(to, 'Your invoice is ready', 'View invoice', 'https://acme.co/i/42');
```

<a name="sendreaction"></a>

### `sendReaction(to, messageId, emoji?, options?)`

React to a message. Pass an empty string / omit `emoji` to remove a reaction you
previously sent.

```ts
await bot.sendReaction(msg.replyTarget!, msg.id, '👍');
await bot.sendReaction(msg.replyTarget!, msg.id);          // remove it
```

Incoming reactions from users arrive as a [`reaction`](#event-reference) event.

<a name="sendrequestcontactinfo"></a>

### `sendRequestContactInfo(to, bodyText, options?)`

Sends an interactive **"share your phone number"** prompt (Meta 2026). Use this
when a user has adopted a username and you still need their number. When they
tap it, a [`contacts`](#event-reference) event fires carrying their phone number.

```ts
await bot.sendRequestContactInfo(msg.replyTarget!,
  'To send your receipt by SMS as well, share your number:');
```

Options: `footerText`, `header`.

> You can also add a `REQUEST_CONTACT_INFO` button to a `utility`/`marketing`
> template via [`bot.templates.create`](#bot-templates).

<a name="sendtemplate"></a>

### `sendTemplate(to, name, languageCode, components?, options?)`

Send an **approved** template — the only message type Meta delivers **outside the
24-hour customer-service window** (reminders, receipts, OTPs, re-engagement).

```ts
await bot.sendTemplate(to, 'appointment_reminder', 'en_US', [
  { type: 'body', parameters: [
    { type: 'text', text: 'Dr. Smith' },
    { type: 'text', text: 'Tomorrow 3pm' },
  ] },
]);
```

Authentication (OTP) templates — the code must appear in the body **and** the
button:

```ts
import { authTemplateComponents } from '@awadoc/whatsapp-cloud-api';

await bot.sendTemplate(to, 'otp_login', 'en_US', authTemplateComponents('123456'));
```

> **BSUID note:** one-tap / zero-tap / copy-code authentication templates cannot
> be sent to a BSUID (`recipient`) — Meta requires a phone number and returns
> error `131062`. Send these to `Phone(...)` only.

Managing the templates themselves (create, list, delete) → [`bot.templates`](#bot-templates).

<a name="sendflow"></a>

### `sendFlow(to, flowIdOrName, ctaText, options)`

Opens a native WhatsApp Flow (a form the user fills in on their phone).

```ts
await bot.sendFlow(to, 'flow_123', 'Book now', {
  body: 'Tap below to book an appointment',
  flowToken: `sess_${msg.identity!.key}`,   // correlates the submission
  flowAction: 'navigate',
  flowActionPayload: { screen: 'WELCOME', data: { name: msg.name } },
});
```

| Option | Type | Notes |
| --- | --- | --- |
| `body` | `string` | **required** |
| `header`, `footer` | | optional |
| `flowToken` | `string` | correlate the reply to a session; derive from a stable seed |
| `mode` | `'draft' \| 'published'` | default `published` |
| `flowAction` | `'navigate' \| 'data_exchange'` | |
| `flowActionPayload` | `{ screen, data? }` | first-screen data for `navigate` |

`flowIdOrName` is a string (flow id) or `{ flow_id }` / `{ flow_name }`.
The completed form arrives as an [`nfm_reply`](#event-reference) event with a
parsed `response` object. Full Flow authoring/hosting → [Flows](#flows).

<a name="markasread"></a>

### `markAsRead(messageId, statusOrTyping?, typingIndicator?)`

Marks an inbound message read (shows the user a blue-tick read receipt), and can
optionally show the "typing…" indicator until your next message.

```ts
await bot.markAsRead(msg.id);                       // read receipt
await bot.markAsRead(msg.id, true);                 // + typing indicator
await bot.markAsRead(msg.id, 'read', { type: 'text' }); // legacy form, still works
```

<a name="uploadmedia"></a>

### `uploadMedia(file, mimeType?, filename?)`

Uploads media to Meta and returns `{ id }` for reuse across sends (cheaper than
re-hosting a URL).

```ts
const { id } = await bot.uploadMedia('./invoice.pdf');          // path — mime auto-detected
const { id } = await bot.uploadMedia(buffer, 'image/png', 'x.png');
const { id } = await bot.uploadMedia(new URL('file:///abs/path.jpg'));
await bot.sendDocument(to, id, { filename: 'invoice.pdf' });
```

---

<a name="recipients"></a>

## Recipients: phone numbers and BSUIDs

Meta is rolling out **usernames**. When a user adopts one, their phone number
(`wa_id`) may be **absent** from webhooks, and their stable identifier becomes a
**BSUID** (`user_id`, e.g. `US.13491208655302741918`). See the
[migration guide](./docs/BSUID_GUIDE.md).

Every `send*` method accepts any of:

```ts
import { Phone, UserId } from '@awadoc/whatsapp-cloud-api';

await bot.sendText('2348012345678', 'hi');           // plain string → phone number
await bot.sendText(Phone('2348012345678'), 'hi');    // explicit phone
await bot.sendText(UserId('US.1349...'), 'hi');      // explicit BSUID
await bot.sendText(msg.replyTarget!, 'hi');          // whatever the webhook gave you
await bot.sendText('2348012345678', 'hi', { recipient: 'US.1349...' }); // both; phone wins
```

- `Phone(x)` → request sends `to: x`.
- `UserId(x)` → request sends `recipient: x`, and **omits `to`** entirely.
- If both a phone number and a BSUID are present, **Meta uses the phone number**.

### `getRecipientIdentity(input)`

Normalizes "which identifier did I get?" — also attached to every incoming
message as `msg.identity`.

```ts
const id = getRecipientIdentity({ wa_id, user_id, parent_user_id, username });
// {
//   key: string;              // stable DB key — BSUID if present, else phone
//   primary: 'phone'|'bsuid';
//   waId?, userId?, parentUserId?, username?;
//   phoneUnavailable: boolean;
//   replyTarget?: RecipientTarget;
// }
```

### Parent BSUIDs (`from_parent_user_id` / `parent_user_id`)

A regular BSUID (`from_user_id`) is scoped to **one** business portfolio — the same
person gets a *different* BSUID if they message a different business phone number
that belongs to a different portfolio. If you manage **multiple** business
portfolios and want one identifier that works across all of them, you can ask
your Meta partner/point-of-contact to enroll those portfolios in **parent BSUIDs**.

Once enrolled:
- Every webhook that carries `from_user_id` also carries **`from_parent_user_id`**
  (format `US.ENT.<digits>`, vs. a regular BSUID's `US.<digits>`).
- You can send to `UserId(parentBsuid)` exactly like a regular BSUID — but the
  message can go out from **any** business phone number in any of the enrolled
  portfolios, not just the one the user originally messaged.
- If you're not enrolled, `from_parent_user_id` / `parent_user_id` are simply
  omitted everywhere — you can ignore these fields entirely for a single-portfolio
  integration.

Regular BSUIDs still work after enrollment; the parent BSUID is an addition, not
a replacement.

---

<a name="receiving"></a>

## Receiving: `bot.on(event, cb)`

```ts
const token = bot.on('text', (msg) => { /* ... */ });
bot.unsubscribe(token);

bot.on('message', (msg) => { /* fires for EVERY event below */ });
```

`bot.on('message', ...)` receives all events; `bot.on('<event>', ...)` receives
just one. The callback is synchronous from the library's side — do your async
work inside and catch your own errors.

<a name="event-reference"></a>

### Event reference

| Event | Fires when | `msg.data` shape (key fields) |
| --- | --- | --- |
| `text` | text message | `{ text: string }` |
| `image` `video` `audio` `document` `sticker` | media message | `{ id, mime_type, sha256, caption?, filename?, voice? }` |
| `location` | location shared | `{ latitude, longitude, name?, address? }` |
| `contacts` | contact card / `sendRequestContactInfo` tap | `Array<{ name, phones, emails, ... }>` |
| `button_reply` | reply-button tap | `{ id, title }` |
| `list_reply` | list-row selection | `{ id, title, description? }` |
| `button` | template quick-reply tap | `{ text, payload? }` |
| `nfm_reply` | Flow completed | `{ response_json, name, body, response? }` |
| `reaction` | user reacts | `{ message_id, emoji }` |
| `order` | catalog order placed | `{ catalog_id, product_items[], text? }` |
| `edit` | user edits a sent message | `{ original_message_id, message }` |
| `revoke` | user deletes a message for everyone | `{ original_message_id }` |
| `system` | number / identity / **BSUID** change | `{ body, type, wa_id?, user_id?, parent_user_id? }` |
| `status` | delivery / read receipt | see [status events](#status-events) |
| `user_id_update` | a user's BSUID changed | see [BSUID webhooks](#bsuid-webhooks) |
| `business_username_updates` | your business username status changed | `{ username?, status, display_phone_number? }` |
| `unsupported` | a message type this library doesn't model | `{ raw, errors? }` |

<a name="message-object"></a>

### The `Message` object

Every callback receives:

```ts
interface Message {
  from?: string;              // sender phone — may be undefined for username users
  from_user_id?: string;      // BSUID, scoped to your business portfolio
  from_parent_user_id?: string; // parent BSUID — see "Parent BSUIDs" below
  name?: string;              // sender display name
  id: string;                 // wamid
  timestamp: string;          // unix seconds
  type: string;               // the event name
  data: object;               // per-event, see table above
  contact?: WebhookContact;   // { profile: { name, username? }, wa_id?, user_id?, parent_user_id? }
  replyTarget?: RecipientTarget;   // pass straight to any send* method
  identity?: RecipientIdentity;    // normalized identity (see getRecipientIdentity)
}
```

Reply without caring which identifier you got:

```ts
bot.on('text', (msg) => bot.sendText(msg.replyTarget!, 'Got it'));
```

<a name="status-events"></a>

### `status` events — delivery & read receipts

```ts
bot.on('status', (msg) => {
  const s = msg.data; // { id, status, timestamp, recipient_id?, recipient_user_id?,
                      //   recipient_parent_user_id?, conversation?, pricing?, errors? }
  if (s.status === 'read')   markThreadRead(s.id);
  if (s.status === 'failed') retryOrAlert(s.id, s.errors);
});
```

- `status` is `sent` → `delivered` → `read`, or `failed`.
- `recipient_user_id` (BSUID) is present on `delivered`/`read` regardless of how
  you addressed the message. On `failed` sent-to-phone it is omitted.
- `msg.from` / `msg.replyTarget` / `msg.identity` are populated from the recipient
  so you can correlate to a user the same way as inbound messages.
- The handler **always returns HTTP 200** for status webhooks — earlier versions
  returned 400, which made Meta retry every receipt indefinitely.

<a name="bsuid-webhooks"></a>

### BSUID / username webhooks

Subscribe your app to these fields in the Meta dashboard.

**`user_id_update`** — a user's BSUID changed (e.g. they changed phone number).
Persist the mapping to keep conversation continuity:

```ts
bot.on('user_id_update', ({ data }) => {
  // { previous, current, wa_id?, parent_previous?, parent_current?, detail? }
  db.users.remap(data.previous, data.current);
});
```

**`system`** with `type: 'user_changed_user_id'` — same situation, delivered
in-thread with the new `user_id`.

**`business_username_updates`** — your own business username was approved /
reserved / deleted:

```ts
bot.on('business_username_updates', ({ data }) => {
  // { username?, status: 'approved'|'reserved'|'deleted', display_phone_number? }
});
```

---

<a name="webhook-servers"></a>

## Webhook servers

<a name="express"></a>

### Express

```ts
import { getExpressRoute } from '@awadoc/whatsapp-cloud-api/express';

app.use('/webhook', getExpressRoute(phoneId, {
  webhookVerifyToken: process.env.VERIFY_TOKEN, // GET handshake
  appSecret: process.env.APP_SECRET,            // POST signature check
  useMiddleware: (router) => { /* add your own middleware */ },
}));
```

The route parses its own JSON body (capturing the raw bytes for signature
verification) — do **not** mount `express.json()` ahead of it on the same path.

<a name="nextjs"></a>

### Next.js

```ts
// App Router — app/api/whatsapp/route.ts
import { getNextAppRouteHandlers } from '@awadoc/whatsapp-cloud-api/next';
export const { GET, POST } = getNextAppRouteHandlers(phoneId, {
  webhookVerifyToken: process.env.VERIFY_TOKEN,
  appSecret: process.env.APP_SECRET,
});
```

```ts
// Pages Router — pages/api/whatsapp.ts
import { getNextPagesApiHandler } from '@awadoc/whatsapp-cloud-api/next';
export default getNextPagesApiHandler(phoneId, {
  webhookVerifyToken: process.env.VERIFY_TOKEN,
  appSecret: process.env.APP_SECRET,
});
export const config = { api: { bodyParser: false } }; // required for signature checks
```

<a name="signature-verification"></a>

### Signature verification

When `appSecret` is set, every POST without a valid `X-Hub-Signature-256` header
is rejected with **401** before any event is dispatched. Strongly recommended in
production — otherwise anyone who learns your webhook URL can inject fake
messages.

Verify manually (custom server):

```ts
import { verifyWebhookSignature } from '@awadoc/whatsapp-cloud-api';
const ok = verifyWebhookSignature(rawBodyBytes, req.headers['x-hub-signature-256'], appSecret);
```

#### `webhookVerifyToken` vs `appSecret` — they protect two different things

These are easy to conflate because they're both "a secret string for the
webhook", but they solve different problems and come from different places:

| | `webhookVerifyToken` | `appSecret` |
| --- | --- | --- |
| **Protects** | The one-time **GET** handshake when you first register the webhook URL in Meta's dashboard | **Every POST** Meta ever sends afterward |
| **What it proves** | "Whoever is configuring this webhook in the Meta dashboard knows the value I expect" | "This POST body was actually sent by Meta, not forged by a third party who found my URL" |
| **Who invents it** | **You.** It's an arbitrary string *you* choose (e.g. a random UUID) | **Meta.** It's generated by Meta for your app — you can't pick it |
| **Where it's used** | Compared against the `hub.verify_token` query param on `GET` | Used as the HMAC-SHA256 key to check the `X-Hub-Signature-256` header on `POST` |
| **If it leaks** | Someone could re-verify a webhook URL pointed at your endpoint (limited impact — it's a one-time check, not ongoing auth) | Someone could forge fake incoming messages/statuses to your endpoint indefinitely |

You need **both** for a production integration: `webhookVerifyToken` so Meta's
dashboard accepts your webhook URL in the first place, and `appSecret` so every
message after that is actually verified as coming from Meta.

#### How to get your `appSecret`

1. Go to the [Meta App Dashboard](https://developers.facebook.com/apps/) and open
   the app your WhatsApp Business Account is registered under.
2. **App settings → Basic**.
3. Find **App Secret**, click **Show**, and confirm your password/2FA if prompted.
4. Copy that value into your server's environment as `APP_SECRET` — **never commit
   it, and never send it to the client**. It's a long-lived secret for the whole
   app (not per-phone-number), so rotating it invalidates every integration using
   that app until they're updated.

`webhookVerifyToken`, by contrast, isn't fetched from anywhere — you make it up
yourself (e.g. `openssl rand -hex 32` or any sufficiently random string) and type
the *same* value into both your server's config and the Meta dashboard's webhook
setup screen.

### HTTP status contract

| Situation | Response |
| --- | --- |
| Valid `whatsapp_business_account` payload (messages, statuses, or change fields) | `200` |
| `GET` verification success | `200` + challenge |
| `GET` verification failure | `403` |
| Bad / missing signature (when `appSecret` set) | `401` |
| Body has no `object` field at all | `404` |

<a name="custom-server"></a>

### Custom server (no Express/Next)

```ts
import { parseWebhookPayload, publishWebhookEvents } from '@awadoc/whatsapp-cloud-api';

const { status, events } = parseWebhookPayload(JSON.parse(rawBody), phoneId);
publishWebhookEvents(phoneId, events); // now bot.on(...) fires
res.writeHead(status).end();
```

---

<a name="management"></a>

## Account management APIs

<a name="bot-templates"></a>

### `bot.templates` — message templates *(requires `wabaId`)*

```ts
const { data, after } = await bot.templates.list({ status: 'APPROVED', limit: 50 });
const tpl  = await bot.templates.get(templateId);
const { id, status } = await bot.templates.create({
  name: 'order_shipped',
  language: 'en_US',
  category: 'UTILITY',
  components: [
    { type: 'BODY', text: 'Your order {{1}} shipped.' },
    { type: 'BUTTONS', buttons: [{ type: 'REQUEST_CONTACT_INFO' }] },
  ],
});
await bot.templates.update(templateId, [/* components */]);
await bot.templates.delete({ name: 'order_shipped' });        // all languages
await bot.templates.namespace();
```

<a name="bot-username"></a>

### `bot.username` — business username *(Meta 2026)*

```ts
const { username, status } = await bot.username.get();
const suggestions = await bot.username.suggestions();          // reserved for you
await bot.username.set('jaspersmarket');                       // → { status: 'approved'|'reserved' }
await bot.username.set('jaspers_market', 'force_transfer');    // move from another of your numbers
await bot.username.remove();
```

Adopting a username does **not** hide your business phone number in the app.

<a name="bot-profile"></a>

### `bot.profile` — business profile

```ts
const p = await bot.profile.get();
await bot.profile.update({
  about: 'Open 9–5',
  websites: ['https://acme.co'],
  email: 'hi@acme.co',
});
```

<a name="bot-blockusers"></a>

### `bot.blockUsers`

```ts
await bot.blockUsers.block(['2348012345678', UserId('US.1349...')]);
await bot.blockUsers.unblock([msg.replyTarget!]);
const { data, after } = await bot.blockUsers.list({ limit: 100 });
```

Parent BSUIDs are not supported for blocking.

---

<a name="flows"></a>

## Flows

Full Flow authoring, management and the encrypted data-exchange endpoint live in
the `flows` subpath, with **both Express and Next.js route handlers** — see the
[Flows module docs](./docs/flows/README.md) and the
[data-exchange endpoint doc](./docs/flows/data-exchange-endpoint.md) for the full
walkthrough (encryption keys, health checks, error handling).

```ts
import { createFlowManager, FlowJSON, Screen } from '@awadoc/whatsapp-cloud-api/flows';

// Express
import { createFlowEndpoint } from '@awadoc/whatsapp-cloud-api/flows/endpoint/express';
app.use('/flow-endpoint', createFlowEndpoint({
  privateKey: process.env.FLOW_PRIVATE_KEY!,
  onRequest: (req) => req.respond().goToScreen('NEXT'),
}));

// Next.js — App Router (13+)
import { createFlowEndpointHandlers } from '@awadoc/whatsapp-cloud-api/flows/endpoint/next';
export const { POST } = createFlowEndpointHandlers({
  privateKey: process.env.FLOW_PRIVATE_KEY!,
  onRequest: (req) => req.respond().goToScreen('NEXT'),
});

// Next.js — Pages Router
import { createFlowEndpointPagesHandler } from '@awadoc/whatsapp-cloud-api/flows/endpoint/next';
export default createFlowEndpointPagesHandler({
  privateKey: process.env.FLOW_PRIVATE_KEY!,
  onRequest: (req) => req.respond().goToScreen('NEXT'),
});
```

This is a **separate** endpoint from the message webhook (`getExpressRoute` /
`getNextAppRouteHandlers`) — Flows' data-exchange requests are RSA/AES-encrypted
and arrive at whatever URL you configure in the Flow's own settings in WhatsApp
Manager, not your regular webhook.

To simply *send* a published Flow to a user, use [`bot.sendFlow`](#sendflow).

---

## Resources

- [WhatsApp Cloud API — Messages](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages)
- [Business-scoped user IDs & usernames](https://developers.facebook.com/docs/whatsapp/cloud-api/overview/business-scoped-user-ids)
- [Migrating to BSUID](./docs/BSUID_GUIDE.md)
