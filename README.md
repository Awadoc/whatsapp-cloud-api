# whatsapp-cloud-api

[![npm version](https://img.shields.io/npm/v/@awadoc/whatsapp-cloud-api.svg)](https://www.npmjs.com/package/@awadoc/whatsapp-cloud-api)
[![tests](https://github.com/Awadoc/whatsapp-cloud-api/actions/workflows/tests.yml/badge.svg)](https://github.com/Awadoc/whatsapp-cloud-api/actions/workflows/tests.yml)
[![license: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/@awadoc/whatsapp-cloud-api.svg)](package.json)

A modern Node.js wrapper for [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/) with full TypeScript support. Built to send and receive messages, handle webhooks via Express or Next.js, and scale cleanly in your apps.

> **Forked from:** [tawn33y/whatsapp-cloud-api](https://github.com/tawn33y/whatsapp-cloud-api) _(Archived)_\
> Maintained with extended support, modular routing, and Next.js support.

## 📖 Documentation

| | |
| --- | --- |
| **[API Reference](./API.md)** | Every method, event and payload shape |
| **[BSUID Migration Guide](./docs/BSUID_GUIDE.md)** | Moving from phone numbers to Business-Scoped User IDs |
| **[WhatsApp Flows](./docs/flows/README.md)** | Building and hosting interactive Flows |
| **[Changelog](./CHANGELOG.md)** | Release history |

---

## 🚀 Install

```bash
npm install @awadoc/whatsapp-cloud-api
```

**For Next.js support (optional):**

```bash
npm install next
```

---

## 📦 Usage with Express

```ts
import express from "express";
import { createBot } from "@awadoc/whatsapp-cloud-api";
import { getExpressRoute } from "@awadoc/whatsapp-cloud-api/express";

const phoneId = process.env.PHONE_ID!;
const token = process.env.ACCESS_TOKEN!;
const webhookVerifyToken = process.env.WEBHOOK_VERIFY_TOKEN!;

const app = express();
const bot = createBot(phoneId, token);

// Register WhatsApp webhook route
app.use("/webhook", getExpressRoute(phoneId, { webhookVerifyToken }));

// Handle incoming messages
bot.on("message", async (msg) => {
  console.log(msg);
  if (msg.type === "text") {
    // msg.replyTarget works whether the sender was identified by phone
    // number or by BSUID (see the BSUID migration guide below).
    await bot.sendText(msg.replyTarget!, "Got your text!");
  }
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
```

---

## 📦 Usage with Next.js

### App Router (Next.js 13+)

```ts
// app/api/whatsapp/webhook/route.ts
import { createBot } from "@awadoc/whatsapp-cloud-api";
import { getNextAppRouteHandlers } from "@awadoc/whatsapp-cloud-api/next";

const phoneId = process.env.PHONE_ID!;
const bot = createBot(phoneId, process.env.ACCESS_TOKEN!);

export const { GET, POST } = getNextAppRouteHandlers(phoneId, {
  webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN,
});

bot.on("message", (msg) => console.log(msg));
```

### Pages Router

```ts
// pages/api/whatsapp/webhook.ts
import { createBot } from "@awadoc/whatsapp-cloud-api";
import { getNextPagesApiHandler } from "@awadoc/whatsapp-cloud-api/next";

const phoneId = process.env.PHONE_ID!;
const bot = createBot(phoneId, process.env.ACCESS_TOKEN!);

export default getNextPagesApiHandler(phoneId, {
  webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN,
});

bot.on("message", (msg) => console.log(msg));
```

---

## 💡 Features

- ✅ Send & receive all message types: text, media, location, contacts, templates, buttons, lists, CTA URLs, reactions.
- ✅ Delivery & read receipts via `bot.on('status', ...)`; `edit` / `revoke` events.
- ✅ Drop-in webhook support via Express or Next.js (App Router & Pages Router), with `X-Hub-Signature-256` verification.
- ✅ **BSUID & Username ready (Meta 2026)** — typed identities, migration guide, `user_id_update` handling.
- ✅ Account management: message templates, business username, business profile, block list.
- ✅ Full TypeScript typing & dev experience.
- ✅ **WhatsApp Flows** - Full support for creating, managing, and handling interactive flows.

See the [full API reference](./API.md).

---

## 📱 WhatsApp Flows

This library provides comprehensive support for WhatsApp Flows - interactive, form-based experiences within WhatsApp.

### Quick Example

```ts
import { createBot } from "@awadoc/whatsapp-cloud-api";
import { createFlowManager, FlowJSON, Screen, TextInput, Footer, CompleteAction } from "@awadoc/whatsapp-cloud-api/flows";

const bot = createBot(phoneId, accessToken);
const flows = createFlowManager(wabaId, accessToken);

// Create and configure a flow
const { id: flowId } = await flows.create({ name: "Feedback Form" });

const flowJson = new FlowJSON()
  .addScreen(
    new Screen("FEEDBACK")
      .setTitle("Share Feedback")
      .addComponent(new TextInput("feedback", "Your feedback"))
      .addComponent(new Footer("Submit", new CompleteAction()))
  );

await flows.updateJson(flowId, flowJson);
await flows.publish(flowId);

// Send the flow to a user
await bot.sendFlow(userPhone, flowId, "Give Feedback", {
  body: "We value your opinion!",
});

// Handle flow completion
bot.on("nfm_reply", (msg) => {
  console.log("Feedback received:", msg.data.response);
});
```

### Flows Documentation

- **[Overview](./docs/flows/README.md)** - Introduction to WhatsApp Flows
- **[Sending Flows](./docs/flows/sending-flows.md)** - Send flow messages to users
- **[Flow Management](./docs/flows/flow-management.md)** - Create, update, publish flows via API
- **[Flow JSON Builder](./docs/flows/flow-json-builder.md)** - Type-safe flow building
- **[Data Exchange Endpoint](./docs/flows/data-exchange-endpoint.md)** - Handle dynamic flow data
- **[Handling Responses](./docs/flows/handling-responses.md)** - Process flow completions

---

## 🆔 BSUID & Username Integration (April 2026)

This library is fully compliant with Meta's April 2026 requirements for **Business-Scoped User IDs (BSUID)** and **Usernames**.

### What you need to know:
- **Primary identifier**: as users adopt usernames, the phone number (`wa_id`) may be absent. Use `msg.from_user_id` / `msg.identity.key` (BSUID) as your primary user key.
- **Scoping**: a BSUID is unique to **your** business portfolio — the same person has a different BSUID with a different business.
- **Replying**: pass `msg.replyTarget` to any `send*` method; it's a phone number or BSUID, whichever WhatsApp gave you.
- **Keeping the mapping**: handle `bot.on('user_id_update', ...)` — a user's BSUID changes when they change phone number.

```ts
bot.on("text", async (msg) => {
  await bot.sendText(msg.replyTarget!, "Hello!");

  const { key, primary, phoneUnavailable, username } = msg.identity!;
  // key: stable DB key · primary: 'phone' | 'bsuid' · phoneUnavailable: boolean
});

bot.on("user_id_update", ({ data }) => {
  db.users.remap(data.previous, data.current);
});
```

**Start now.** A user who adopted a username more than 30 days ago will look like
a brand-new contact if your only key is their phone number. See the step-by-step
**[BSUID migration guide](./docs/BSUID_GUIDE.md)** — storage schema, resolve-or-create,
keeping the mapping fresh, and how to send.

---

## 📚 Examples

```ts
// Send an image
await bot.sendImage(to, "https://example.com/pic.jpg", {
  caption: "Look at this!",
});

// Send a location
await bot.sendLocation(to, 6.5244, 3.3792, { name: "Lagos, Nigeria" });

// Send a template message
await bot.sendTemplate(to, "hello_world", "en_US");
```

---

## 🔧 Custom Webhook Path or Middleware

`getExpressRoute` is a standalone export (not a method on `bot`) — mount it at
whatever path you like, and inject your own middleware ahead of the parser:

```ts
import { getExpressRoute } from "@awadoc/whatsapp-cloud-api/express";

app.use(
  "/custom-whatsapp-hook",
  getExpressRoute(phoneId, {
    webhookVerifyToken: "secret_token",
    appSecret: process.env.APP_SECRET,     // verifies X-Hub-Signature-256
    useMiddleware: (router) => router.use(myLoggingMiddleware),
  }),
);
```

---

## 🧪 Environment Setup (for local testing)

Create a `.env` file:

```env
FROM_PHONE_NUMBER_ID=""
ACCESS_TOKEN=""
VERSION=""
TO=""
WEBHOOK_VERIFY_TOKEN=""
WEBHOOK_PATH=""
```

---

## 🧪 Testing & Development

### Running Tests

To run the test suite, use the following command:

```bash
npm test
```

### Running the Demo Server

A demo server is included to help you test the integration locally.

1. Create a `.env` file from the template:
   ```bash
   cp .env.template .env
   ```
2. Fill in your WhatsApp Cloud API credentials in `.env`.
3. Start the demo server:
   ```bash
   npm run start:demo
   ```

---

## 🤝 Contributing

Forks, issues, and PRs are welcome.

- Improve modularity (e.g., router separation)
- Add support for more message types
- Improve webhook logic for other frameworks (e.g., Fastify, Hono)

---

## 🔗 Links

- [Meta WhatsApp API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api/)
- [Forked Source - Archived](https://github.com/tawn33y/whatsapp-cloud-api)

---

## 🧼 License

[GPL-3.0](./LICENSE)
