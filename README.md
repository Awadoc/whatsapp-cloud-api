# whatsapp-cloud-api

A modern Node.js wrapper for [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/) with full TypeScript support. Built to send and receive messages, handle webhooks via Express or Next.js, and scale cleanly in your apps.

> **Forked from:** [tawn33y/whatsapp-cloud-api](https://github.com/tawn33y/whatsapp-cloud-api) _(Archived)_\
> Maintained with extended support, modular routing, and Next.js support.

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
    await bot.sendText(msg.from, "Got your text!");
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

- ✅ Send & receive all message types: text, image, video, audio, location, templates, buttons.
- ✅ Drop-in webhook support via Express or Next.js (App Router & Pages Router).
- ✅ Full TypeScript typing & dev experience.
- ✅ Custom routing support for integration with existing apps.

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

You can easily change the webhook route or plug into your existing middleware:

```ts
app.use(
  "/custom-whatsapp-hook",
  bot.getExpressRoute({ webhookVerifyToken: "secret_token" }),
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

MIT
