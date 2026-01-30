# Handling Flow Responses

When a user completes a WhatsApp Flow (via a `CompleteAction`), WhatsApp sends an `nfm_reply` message to your webhook. This document explains how to handle these flow completion responses.

## Listening for Flow Completions

Use the `nfm_reply` event to listen for flow completions:

```typescript
import { createBot } from '@awadoc/whatsapp-cloud-api';

const bot = createBot(phoneId, accessToken);

// Listen for flow completions
bot.on('nfm_reply', (msg) => {
  console.log('Flow completed!');
  console.log('From:', msg.from);
  console.log('Flow name:', msg.data.name);
  console.log('Response data:', msg.data.response);
});
```

## Message Structure

When a flow completes, the message has the following structure:

```typescript
interface FlowCompletionMessage {
  // Sender's phone number
  from: string;

  // User's BSUID (if available)
  from_user_id?: string;

  // Contact name
  name?: string;

  // Message ID
  id: string;

  // Timestamp
  timestamp: string;

  // Message type
  type: 'nfm_reply';

  // Flow data
  data: {
    // Raw JSON string (original from WhatsApp)
    response_json: string;

    // Body text from flow completion
    body: string;

    // Flow name
    name: string;

    // Parsed response data (automatically parsed by the library)
    response?: Record<string, unknown>;
  };

  // Contact information
  contact?: WebhookContact;
}
```

## Complete Example

### Flow JSON with CompleteAction

```typescript
import { FlowJSON, Screen, TextInput, RadioButtonsGroup, Footer, CompleteAction } from '@awadoc/whatsapp-cloud-api/flows';

const surveyFlow = new FlowJSON()
  .addScreen(
    new Screen('SURVEY')
      .setTitle('Quick Survey')
      .addComponent(
        new RadioButtonsGroup('satisfaction', 'How satisfied are you?', [
          { id: 'very_satisfied', title: 'Very Satisfied' },
          { id: 'satisfied', title: 'Satisfied' },
          { id: 'neutral', title: 'Neutral' },
          { id: 'dissatisfied', title: 'Dissatisfied' },
        ]).setRequired(true)
      )
      .addComponent(
        new TextInput('comments', 'Additional comments')
      )
      .addComponent(
        new Footer('Submit', new CompleteAction({
          // These values will be in msg.data.response
          satisfaction: '${form.satisfaction}',
          comments: '${form.comments}',
          submitted_at: new Date().toISOString(),
        }))
      )
  );
```

### Handling the Response

```typescript
bot.on('nfm_reply', async (msg) => {
  const { response, name: flowName } = msg.data;

  if (flowName === 'Quick Survey' && response) {
    // Access the submitted data
    const { satisfaction, comments, submitted_at } = response;

    console.log(`User ${msg.from} submitted survey:`);
    console.log(`- Satisfaction: ${satisfaction}`);
    console.log(`- Comments: ${comments || 'None'}`);
    console.log(`- Submitted at: ${submitted_at}`);

    // Store in database
    await saveSurveyResponse({
      phone: msg.from,
      satisfaction,
      comments,
      timestamp: submitted_at,
    });

    // Send confirmation
    await bot.sendText(msg.from, 'Thank you for your feedback!');
  }
});
```

## Handling Multiple Flows

When you have multiple flows, use the flow name to route responses:

```typescript
bot.on('nfm_reply', async (msg) => {
  const { response, name: flowName } = msg.data;

  switch (flowName) {
    case 'Feedback Survey':
      await handleFeedbackSurvey(msg.from, response);
      break;

    case 'Appointment Booking':
      await handleAppointmentBooking(msg.from, response);
      break;

    case 'Product Order':
      await handleProductOrder(msg.from, response);
      break;

    default:
      console.log('Unknown flow:', flowName);
  }
});

async function handleFeedbackSurvey(phone: string, data: any) {
  await saveFeedback(phone, data);
  await bot.sendText(phone, 'Thanks for your feedback!');
}

async function handleAppointmentBooking(phone: string, data: any) {
  const appointment = await createAppointment(data);
  await bot.sendText(phone, `Appointment confirmed for ${appointment.date}`);
}

async function handleProductOrder(phone: string, data: any) {
  const order = await processOrder(data);
  await bot.sendText(phone, `Order #${order.id} received!`);
}
```

## Using Flow Token for Context

If you pass a `flowToken` when sending the flow, you can retrieve context:

```typescript
// When sending the flow
await bot.sendFlow(userPhone, flowId, 'Start', {
  body: 'Complete your order',
  flowToken: JSON.stringify({
    orderId: 'order_123',
    userId: 'user_456',
  }),
});

// The flowToken is available in data exchange, but NOT directly in nfm_reply
// For nfm_reply, include any needed context in the CompleteAction payload
```

To pass context through to the completion:

```typescript
// In your flow JSON - include context from data exchange in the CompleteAction
new Footer('Submit', new CompleteAction({
  order_id: '${data.order_id}',
  form_data: '${form}',
}))

// In your data exchange endpoint - pass the context to screens
onRequest: (req) => {
  const context = JSON.parse(req.flowToken);
  return req.respond().goToScreen('CONFIRM', {
    order_id: context.orderId,
    // ... other data
  });
}
```

## Error Handling

Always handle potential missing or malformed data:

```typescript
bot.on('nfm_reply', async (msg) => {
  try {
    const { response, name: flowName } = msg.data;

    if (!response) {
      console.warn('Flow completed without response data:', flowName);
      return;
    }

    // Validate expected fields
    if (flowName === 'Order Form') {
      const { product_id, quantity } = response;

      if (!product_id || !quantity) {
        console.error('Invalid order data:', response);
        await bot.sendText(msg.from, 'There was an issue with your order. Please try again.');
        return;
      }

      await processOrder({ product_id, quantity, phone: msg.from });
    }
  } catch (error) {
    console.error('Error handling flow response:', error);
    await bot.sendText(msg.from, 'Something went wrong. Please try again later.');
  }
});
```

## Listening to All Messages

You can also use the generic `message` event to handle flow completions along with other message types:

```typescript
bot.on('message', async (msg) => {
  if (msg.type === 'nfm_reply') {
    // Handle flow completion
    const { response, name } = msg.data as {
      response?: Record<string, unknown>;
      name: string;
    };
    console.log(`Flow "${name}" completed:`, response);
  } else if (msg.type === 'text') {
    // Handle regular text messages
    console.log('Text message:', msg.data.text);
  }
});
```

## TypeScript Type Assertions

For full type safety, you can use type assertions:

```typescript
interface SurveyResponse {
  satisfaction: 'very_satisfied' | 'satisfied' | 'neutral' | 'dissatisfied';
  comments?: string;
}

bot.on('nfm_reply', (msg) => {
  if (msg.data.name === 'Customer Survey') {
    const response = msg.data.response as SurveyResponse | undefined;

    if (response) {
      // Now TypeScript knows the shape
      console.log(response.satisfaction);
      console.log(response.comments);
    }
  }
});
```

## Combining with Data Exchange

Flow responses work together with the data exchange endpoint:

1. **Send Flow** → User sees the flow
2. **Data Exchange** → Fetch data, validate inputs, navigate screens
3. **Complete** → Flow closes, `nfm_reply` sent to webhook
4. **Handle Response** → Process the completion in your bot

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Send Flow     │───>│ Data Exchange   │───>│  nfm_reply      │
│                 │    │ (dynamic data)  │    │  (completion)   │
│ bot.sendFlow()  │    │ /flow-endpoint  │    │  bot.on()       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Next Steps

- [Sending Flows](./sending-flows.md) - Learn how to trigger flows
- [Data Exchange Endpoint](./data-exchange-endpoint.md) - Handle dynamic data during flows
- [Flow JSON Builder](./flow-json-builder.md) - Build flows with CompleteAction
