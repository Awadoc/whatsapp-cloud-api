/* eslint-disable no-console */
import express from 'express';
import dotenv from 'dotenv';
import { getExpressRoute } from './src/express';

// Load env vars
dotenv.config();

// Enable Debug Logger
process.env.DEBUG_WHATSAPP_CLOUD_API = 'true';

const start = async () => {
  console.log('--- Starting Debug Logger Demo ---');
  console.log('Environment variable DEBUG_WHATSAPP_CLOUD_API set to "true"\n');

  const phoneId = process.env.FROM_PHONE_NUMBER_ID;
  const accessToken = process.env.ACCESS_TOKEN;
  const to = process.env.TO;

  if (!phoneId || !accessToken || !to) {
    console.error(
      '❌ Missing .env variables: FROM_PHONE_NUMBER_ID, ACCESS_TOKEN, or TO',
    );
    process.exit(1);
  }

  // 1. Setup Bot
  // const bot = createBot(phoneId, accessToken);

  // 2. Setup Server
  const app = express();
  app.use(
    '/webhook',
    getExpressRoute(phoneId, {
      webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN || 'demo',
    }),
  );

  app.listen(3000, () => {
    console.log(
      `Server listening on port 3000 (Webhook token: ${process.env.WEBHOOK_VERIFY_TOKEN || 'demo'})`,
    );
  });

  //   // 3. Send a Message
  //   console.log(`\n--- Sending Message to ${to} ---`);
  //   console.log("(This should trigger [Outgoing Request] and [Response] logs)");

  //   try {
  //     await bot.sendText(to, "Hello Debug Logger! 🐞");
  //   } catch (err: any) {
  //     console.log("\n❌ Error sending message (Check logs above for details)");
  //   }

  //   server.close(() => {
  //     console.log("\n--- Demo Finished ---");
  //   });
};

start();
