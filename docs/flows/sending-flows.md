# Sending Flows

Once you have a Flow created and published (or in draft mode for testing), you can send it to users using the `sendFlow` method.

## Basic Usage

```typescript
import { createBot } from '@awadoc/whatsapp-cloud-api';

const bot = createBot(phoneId, accessToken);

// Send a flow by ID
await bot.sendFlow(userPhone, 'YOUR_FLOW_ID', 'Get Started', {
  body: 'Click below to begin',
});
```

## Method Signature

```typescript
bot.sendFlow(
  to: string,                           // Recipient phone number
  flowIdOrName: string | FlowIdentifier, // Flow ID, name, or identifier object
  ctaText: string,                      // Call-to-action button text
  options: SendFlowOptions              // Additional options
): Promise<SendMessageResult>
```

## Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `body` | `string` | Yes | Message body text |
| `header` | `InteractiveHeader` | No | Optional header (text or image) |
| `footer` | `string` | No | Optional footer text |
| `mode` | `'draft' \| 'published'` | No | Flow mode (defaults to published) |
| `flowToken` | `string` | No | Custom token passed to data exchange endpoint |
| `flowAction` | `'navigate' \| 'data_exchange'` | No | How the flow starts |
| `flowActionPayload` | `FlowActionPayload` | No | Initial screen and data |

## Examples

### Basic Flow Message

```typescript
await bot.sendFlow(userPhone, 'FLOW_ID', 'Start Survey', {
  body: 'We value your feedback! Click below to share your thoughts.',
});
```

### With Header and Footer

```typescript
await bot.sendFlow(userPhone, 'FLOW_ID', 'Book Now', {
  header: { type: 'text', text: 'Appointment Booking' },
  body: 'Schedule your next appointment with us.',
  footer: 'Available 24/7',
});
```

### Using Flow Name Instead of ID

```typescript
// By name
await bot.sendFlow(userPhone, { flow_name: 'feedback_form' }, 'Give Feedback', {
  body: 'Share your experience with us',
});

// By ID (explicit)
await bot.sendFlow(userPhone, { flow_id: '1234567890' }, 'Start', {
  body: 'Begin the process',
});
```

### Testing with Draft Mode

```typescript
// Send unpublished flow for testing
await bot.sendFlow(userPhone, 'FLOW_ID', 'Test Flow', {
  body: 'Testing the flow before publishing',
  mode: 'draft',
});
```

### Navigate to Specific Screen

Use `flowAction: 'navigate'` to start the flow on a specific screen with pre-filled data:

```typescript
await bot.sendFlow(userPhone, 'FLOW_ID', 'Continue', {
  body: 'Continue where you left off',
  flowAction: 'navigate',
  flowActionPayload: {
    screen: 'ORDER_DETAILS',
    data: {
      orderId: '12345',
      customerName: 'John Doe',
    },
  },
});
```

### Data Exchange Mode

Use `flowAction: 'data_exchange'` when your flow needs to fetch initial data from your server:

```typescript
await bot.sendFlow(userPhone, 'FLOW_ID', 'View Products', {
  body: 'Browse our latest products',
  flowAction: 'data_exchange',
  flowActionPayload: {
    screen: 'PRODUCT_LIST',
  },
  flowToken: 'user_session_token_123', // Passed to your endpoint
});
```

### With Custom Flow Token

The `flowToken` is passed to your data exchange endpoint, useful for identifying users or sessions:

```typescript
await bot.sendFlow(userPhone, 'FLOW_ID', 'Check Status', {
  body: 'View your order status',
  flowToken: JSON.stringify({
    userId: 'user_123',
    orderId: 'order_456',
  }),
});
```

## Flow Actions

### `navigate` (default)

The flow starts directly on the specified screen. Use when:
- You have all the data needed to display the first screen
- The flow doesn't need to fetch data from your server initially

### `data_exchange`

The flow calls your data exchange endpoint before showing the first screen. Use when:
- You need to fetch dynamic data (product lists, user details, etc.)
- The initial screen content depends on server-side data

## Best Practices

1. **Keep CTA text short** - The button text should be concise and action-oriented (e.g., "Start", "Book Now", "Get Quote")

2. **Use descriptive body text** - Explain what the user will do in the flow

3. **Test in draft mode first** - Always test flows before publishing to production

4. **Use flow tokens wisely** - Pass context your endpoint needs, but keep it minimal

5. **Handle errors gracefully** - Wrap `sendFlow` calls in try-catch to handle API errors

## Error Handling

```typescript
try {
  await bot.sendFlow(userPhone, 'FLOW_ID', 'Start', {
    body: 'Begin the process',
  });
} catch (error) {
  console.error('Failed to send flow:', error);
  // Fallback to regular message
  await bot.sendText(userPhone, 'Sorry, please try again later.');
}
```

## Next Steps

- [Flow Management](./flow-management.md) - Learn how to create and manage flows
- [Handling Flow Responses](./handling-responses.md) - Process user responses when flows complete
