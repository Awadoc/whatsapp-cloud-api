# WhatsApp BSUID & Username Integration Guide (April 2026 Compliance)

Starting in late 2026, WhatsApp is introducing **Usernames**, which allows users to message businesses without sharing their phone numbers. This transition requires a shift from phone-based identity (`wa_id`) to **Business-Scoped User IDs (BSUID)**.

## What is a BSUID?

A **Business-Scoped User ID (BSUID)** is a unique, stable identifier for a WhatsApp user that is specific to your **Business Portfolio**.

- **Scoped**: The same user will have different BSUIDs across different business portfolios.
- **Persistent**: The BSUID remains constant for that user within your business portfolio.
- **Privacy-First**: It allows users to communicate with businesses using usernames while maintaining a stable identifier for the business to track interactions.

## Key Changes in this Library

### 1. Identifying Users
In previous versions, `msg.from` (the phone number/wa_id) was the primary way to identify users. In the new world:
- `msg.from_user_id` (BSUID) is now the primary stable identifier.
- `msg.from` may be an **empty string** if the user is using a username and has not shared their phone number.

**Best Practice:** Always use `from_user_id` as the primary key in your database.

### 2. Sending Messages
The library now uses a `RecipientTarget` pattern. You can wrap your target in `Phone()` or `UserId()` to be explicit, or simply pass the `replyTarget` from an incoming message.

```javascript
import { Phone, UserId } from '@awadoc/whatsapp-cloud-api';

// Recommended: Replying to an incoming message
bot.on('text', async (msg) => {
  await bot.sendText(msg.replyTarget, 'Hello back!');
});

// Explicit Targeting
await bot.sendText(Phone('1234567890'), 'Targeting by Phone');
await bot.sendText(UserId('user.abc123bsuid'), 'Targeting by BSUID');

// Backward Compatibility
await bot.sendText('1234567890', 'Still works (defaults to Phone)');
```

### 3. Contact Profiles & Events
The contact profile information in webhooks has been updated:
- `contact.profile.username`: The user's WhatsApp username (if available).
- `contact.profile.name`: The user's display name.
- `wa_id`: The phone number (may be absent for username users).

#### Compliance Events
You should listen for these events to keep your database synced:
```javascript
bot.on('user_id_update', ({ data }) => {
  console.log(`Migrating user from ${data.old_user_id} to ${data.new_user_id}`);
});

bot.on('business_username_update', (msg) => {
  console.log(`User ${msg.from_user_id} updated their profile/username`);
});
```

### 4. Linked Portfolios (Parent BSUID)
For businesses with multiple accounts linked to a single portfolio:
- `from_parent_user_id`: The BSUID scoped to the parent portfolio.
- `parent_user_id`: Available in contact metadata.

## Transition Strategy

1. **Update Database Schema**: Add a `bsuid` column (string) and index it.
2. **Backfill**: As users message you, capture their `from_user_id` and link it to their existing record (using `wa_id`).
3. **Handle Empty Phone Numbers**: Update your logic to handle `msg.from === ''`.
4. **Primary Key Swap**: Eventually, move your primary interaction logic to use BSUID for all lookups and replies.

## Technical Support
For more details, refer to the [official Meta documentation on BSUIDs](https://developers.facebook.com/docs/whatsapp/cloud-api/overview/business-scoped-user-ids).
