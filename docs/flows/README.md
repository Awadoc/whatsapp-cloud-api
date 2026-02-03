# WhatsApp Flows

WhatsApp Flows allow you to create interactive, structured experiences within WhatsApp. Users can fill out forms, make selections, and navigate through multi-screen experiences without leaving the chat.

This library provides comprehensive support for WhatsApp Flows:

- **[Sending Flows](./sending-flows.md)** - Send Flow messages to users
- **[Flow Management](./flow-management.md)** - Create, update, publish, and manage Flows via API
- **[Flow JSON Builder](./flow-json-builder.md)** - Build Flow JSON with type-safe builders
- **[Data Exchange Endpoint](./data-exchange-endpoint.md)** - Handle Flow data requests with encryption
- **[Handling Flow Responses](./handling-responses.md)** - Process Flow completions in your webhooks

## Quick Start

### 1. Send a Flow to a User

```typescript
import { createBot } from '@awadoc/whatsapp-cloud-api';

const bot = createBot(phoneId, accessToken);

// Send a published flow
await bot.sendFlow(userPhone, 'FLOW_ID', 'Start Survey', {
  body: 'Click below to begin the survey',
});
```

### 2. Handle Flow Responses

```typescript
// Listen for flow completions
bot.on('nfm_reply', (msg) => {
  console.log('Flow completed:', msg.data.response);
});
```

### 3. Create and Manage Flows Programmatically

```typescript
import { createFlowManager, FlowJSON, Screen, TextInput, Footer } from '@awadoc/whatsapp-cloud-api/flows';

const flows = createFlowManager(wabaId, accessToken);

// Create a new flow
const { id } = await flows.create({ name: 'Feedback Form' });

// Build and upload the flow JSON
const flowJson = new FlowJSON()
  .setRoutingModel({ FEEDBACK: ['THANK_YOU'] })
  .addScreen(
    new Screen('FEEDBACK')
      .setTitle('Share Feedback')
      .addComponent(new TextInput('feedback', 'Your feedback'))
      .addComponent(new Footer('Submit', new CompleteAction()))
  )
  .addScreen(
    new Screen('THANK_YOU')
      .setTitle('Thank You!')
      .setTerminal(true)
  );

await flows.updateJson(id, flowJson);
await flows.publish(id);
```

### 4. Set Up Data Exchange Endpoint

```typescript
// Express
import { createFlowEndpoint } from '@awadoc/whatsapp-cloud-api/flows/endpoint/express';

app.use('/flow-endpoint', createFlowEndpoint({
  privateKey: process.env.FLOW_PRIVATE_KEY!,
  onRequest: (req) => {
    // Handle flow data requests
    return req.respond().goToScreen('NEXT_SCREEN', { name: req.data.name });
  },
}));
```

## Prerequisites

Before using WhatsApp Flows, ensure you have:

1. A WhatsApp Business Account (WABA)
2. A registered phone number with WhatsApp Business API access
3. An access token with the necessary permissions
4. For data exchange: An RSA-2048 key pair for encryption

## Flow Lifecycle

1. **Create** - Register a new flow with WhatsApp
2. **Upload JSON** - Define the flow's screens and components
3. **Test** - Send the flow in draft mode to test
4. **Publish** - Make the flow available for production use
5. **Send** - Trigger the flow for users via interactive messages
6. **Handle** - Process user responses and data exchange requests
7. **Deprecate/Delete** - Retire flows when no longer needed

## Next Steps

Start with [Sending Flows](./sending-flows.md) to learn how to trigger flows for users, or jump to [Flow JSON Builder](./flow-json-builder.md) if you need to create custom flows programmatically.
