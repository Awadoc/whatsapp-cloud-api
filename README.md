# whatsapp-cloud-api

A modern Node.js wrapper for [WhatsApp Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api/) with full TypeScript support. Built to send and receive messages, handle webhooks via Express, and scale cleanly in your apps.

> **Forked from:** [tawn33y/whatsapp-cloud-api](https://github.com/tawn33y/whatsapp-cloud-api) *(Archived)*\
> Maintained and updated with extended support and modular Express routing.

---

## 🚀 Install

```bash
npm install @awadoc/whatsapp-cloud-api
```

or

```bash
yarn add @awadoc/whatsapp-cloud-api
```

---

## 📦 Usage (with custom Express server)

```ts
import express from 'express';
import { createBot } from 'whatsapp-cloud-api';

(async () => {
  const from = 'YOUR_WHATSAPP_PHONE_NUMBER_ID';
  const token = 'YOUR_ACCESS_TOKEN';
  const to = 'RECIPIENT_PHONE_NUMBER';
  const webhookVerifyToken = 'YOUR_WEBHOOK_VERIFICATION_TOKEN';
  const webhookPath = '/webhook/whatsapp';

  const app = express();

  const bot = createBot(from, token);

  // Optional: Send a message on startup
  await bot.sendText(to, 'Hello world!');

  // Register WhatsApp webhook route
  app.use(webhookPath, bot.getExpressRoute({ webhookVerifyToken }));

  // Handle incoming messages
  bot.on('message', async (msg) => {
    console.log(msg);
    if (msg.type === 'text') {
      await bot.sendText(msg.from, 'Got your text!');
    } else if (msg.type === 'image') {
      await bot.sendText(msg.from, 'Nice image!');
    }
  });

  app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
  });
})();
```

---

## 💡 Features

- ✅ Send & receive all message types: text, image, video, audio, location, templates, buttons.
- ✅ Drop-in webhook support via Express.
- ✅ Full TypeScript typing & dev experience.
- ✅ Custom routing support for integration with existing Express apps.

---

## 📚 Examples

```ts
// Send an image
await bot.sendImage(to, 'https://example.com/pic.jpg', { caption: 'Look at this!' });

// Send a location
await bot.sendLocation(to, 6.5244, 3.3792, { name: 'Lagos, Nigeria' });

// Send a template message
await bot.sendTemplate(to, 'hello_world', 'en_US');
```

---

## 🔧 Custom Webhook Path or Middleware

You can easily change the webhook route or plug into your existing middleware:

```ts
app.use('/custom-whatsapp-hook', bot.getExpressRoute({ webhookVerifyToken: 'secret_token' }));
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

