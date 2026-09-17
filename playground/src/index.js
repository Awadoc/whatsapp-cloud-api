require('dotenv').config({ path: '../.env' });

const express = require('express');
const { createBot, Phone, UserId } = require('whatsapp-cloud-api');
const { getExpressRoute } = require('whatsapp-cloud-api/express');

/**
 * WHATSAPP BSUID & USERNAME INTEGRATION EXAMPLES (APRIL 2026 COMPLIANCE)
 * 
 * BSUID (Business-Scoped User ID) is the new primary identifier for WhatsApp users.
 * Unlike phone numbers (wa_id), BSUIDs are unique to YOUR business. 
 */

(async () => {
  try {
    const fromPhoneNumberId = process.env['FROM_PHONE_NUMBER_ID'];
    const accessToken = process.env['ACCESS_TOKEN'];
    const webhookVerifyToken = process.env['WEBHOOK_VERIFY_TOKEN'];

    if (!fromPhoneNumberId || !accessToken || !webhookVerifyToken) {
      throw new Error('Missing env variables. Please check your .env file.');
    }

    // 1. Initialize the bot
    const bot = createBot(fromPhoneNumberId, accessToken);

    // 2. Setup Express Server (Modern Modular Approach)
    const app = express();
    app.use(express.json());

    // Use getExpressRoute to handle verification and incoming messages
    app.use('/webhook', getExpressRoute(fromPhoneNumberId, {
      webhookVerifyToken,
    }));

    app.listen(3000, () => {
      console.log('--- Bot is listening on port 3000 ---');
      console.log('--- Configure your webhook URL to: http://your-domain.com/webhook ---');
    });

    /**
     * HANDLING INCOMING MESSAGES (The 2026 Way)
     */
    bot.on('text', async (msg) => {
      console.log('\n--- Incoming Message ---');
      console.log(`From (Phone): ${msg.from || 'Hidden (Username User)'}`);
      console.log(`BSUID: ${msg.from_user_id}`);
      console.log(`Text: ${msg.data.text}`);

      /**
       * BEST PRACTICE: Use 'msg.replyTarget'.
       * It's a pre-computed target that works regardless of whether the user
       * messaged you via phone number or username (BSUID).
       */
      await bot.sendText(msg.replyTarget, `Received! Your unique ID for this business is: ${msg.from_user_id}`);

      // You can also use the wrappers explicitly:
      // await bot.sendText(Phone('1234567890'), 'Hello via Phone wrapper');
      // await bot.sendText(UserId(msg.from_user_id), 'Hello via BSUID wrapper');
    });

    /**
     * NEW COMPLIANCE EVENTS
     */

    // Handle BSUID Updates (Migration/Business Update)
    bot.on('user_id_update', async (event) => {
      const { old_user_id, new_user_id } = event.data;
      console.log(`User migrated from ${old_user_id} to ${new_user_id}`);
      // UPDATE YOUR DATABASE HERE
    });

    // Handle Username Updates
    bot.on('business_username_update', async (event) => {
      console.log(`User ${event.from_user_id} updated their username/profile`);
    });

    console.log('Playground is active! Send a message to your bot to test.');

  } catch (err) {
    console.error('Failed to start playground:', err.message);
  }
})();
