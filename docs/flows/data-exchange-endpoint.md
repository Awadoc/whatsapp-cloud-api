# Data Exchange Endpoint

WhatsApp Flows can communicate with your server through a Data Exchange endpoint. This allows flows to fetch dynamic data, validate inputs, and make decisions based on user interactions.

All communication between WhatsApp and your endpoint is encrypted using RSA-OAEP + AES-128-GCM encryption. This library handles encryption automatically.

## Quick Setup

### Express

```typescript
import express from 'express';
import { createFlowEndpoint } from '@awadoc/whatsapp-cloud-api/flows/endpoint/express';

const app = express();

app.use('/flow-endpoint', createFlowEndpoint({
  privateKey: process.env.FLOW_PRIVATE_KEY!,
  onRequest: (req) => {
    console.log('Flow action:', req.action);
    console.log('Current screen:', req.screen);
    console.log('Form data:', req.data);

    // Navigate to next screen
    return req.respond().goToScreen('NEXT_SCREEN', {
      user_name: req.data.name,
    });
  },
}));

app.listen(3000);
```

### Next.js (App Router)

```typescript
// app/api/flow/route.ts
import { createFlowEndpointHandlers } from '@awadoc/whatsapp-cloud-api/flows/endpoint/next';

export const { POST } = createFlowEndpointHandlers({
  privateKey: process.env.FLOW_PRIVATE_KEY!,
  onRequest: (req) => {
    return req.respond().goToScreen('NEXT_SCREEN', {
      data: req.data,
    });
  },
});
```

### Next.js (Pages Router)

```typescript
// pages/api/flow.ts
import { createFlowEndpointPagesHandler } from '@awadoc/whatsapp-cloud-api/flows/endpoint/next';

export default createFlowEndpointPagesHandler({
  privateKey: process.env.FLOW_PRIVATE_KEY!,
  onRequest: (req) => {
    return req.respond().goToScreen('NEXT_SCREEN');
  },
});
```

## Generating RSA Keys

Generate a key pair for encryption:

```typescript
import { generateKeyPair, createFlowManager } from '@awadoc/whatsapp-cloud-api/flows';

// Generate key pair
const { privateKey, publicKey } = generateKeyPair();

// Store privateKey securely (environment variable, secrets manager, etc.)
console.log('Private Key (keep secret!):\n', privateKey);

// Upload public key to WhatsApp
const flows = createFlowManager(wabaId, accessToken);
await flows.setBusinessPublicKey(publicKey);
```

Store the private key in an environment variable:

```bash
# .env
FLOW_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASC...
-----END PRIVATE KEY-----"
```

## Configuration Options

```typescript
interface FlowEndpointOptions {
  // Required: Your RSA private key in PEM format
  privateKey: string;

  // Optional: Meta app secret for signature validation
  appSecret?: string;

  // Required: Handler for processing requests
  onRequest: FlowRequestHandler;

  // Optional: Error handler for logging/monitoring
  onError?: FlowErrorHandler;

  // Optional: Auto-acknowledge error notifications (default: true)
  acknowledgeErrors?: boolean;
}
```

## Request Object

The `FlowRequest` object provides access to the incoming request data:

```typescript
interface FlowRequest {
  // API version (e.g., "3.0")
  version: string;

  // Action that triggered this request
  action: 'INIT' | 'BACK' | 'data_exchange' | 'ping';

  // Current screen ID (undefined for INIT/BACK)
  screen?: string;

  // Form data submitted by the user
  data: Record<string, unknown>;

  // Flow token for session identification
  flowToken: string;

  // Create a response builder
  respond(): FlowResponseBuilder;
}
```

### Action Types

| Action | When Triggered |
|--------|----------------|
| `INIT` | Flow is opened with `data_exchange` flow action |
| `BACK` | User navigates back in the flow |
| `data_exchange` | User triggers a `DataExchangeAction` (e.g., submits a form) |
| `ping` | Health check from WhatsApp (automatically handled) |

## Response Builder

Use the response builder to construct responses:

### Navigate to Screen

```typescript
onRequest: (req) => {
  // Navigate with data
  return req.respond().goToScreen('DETAILS_SCREEN', {
    user_name: req.data.name,
    products: [
      { id: '1', title: 'Product A', price: '$10' },
      { id: '2', title: 'Product B', price: '$20' },
    ],
  });
}
```

### Complete the Flow

```typescript
onRequest: (req) => {
  // Process and complete
  const orderId = processOrder(req.data);

  return req.respond().close({
    order_id: orderId,
    status: 'confirmed',
  });
}
```

### Show Error Message

Data exchange responses are **server-directed** and not bound by the flow's `routing_model`. You can return any valid screen, including the current one for validation errors.

```typescript
onRequest: (req) => {
  if (!isValidEmail(req.data.email)) {
    // Stay on current screen with error (req.screen is defined for data_exchange actions)
    if (req.screen) {
      return req.respond()
        .goToScreen(req.screen, req.data)
        .withError('Please enter a valid email address');
    }
  }

  return req.respond().goToScreen('NEXT_SCREEN');
}
```

## Complete Example

```typescript
import { createFlowEndpoint } from '@awadoc/whatsapp-cloud-api/flows/endpoint/express';

app.use('/flow-endpoint', createFlowEndpoint({
  privateKey: process.env.FLOW_PRIVATE_KEY!,
  appSecret: process.env.META_APP_SECRET, // Optional but recommended

  onRequest: async (req) => {
    // Handle different flow screens
    switch (req.screen) {
      case undefined: // INIT action
        // Fetch initial data for the flow
        const user = await getUser(req.flowToken);
        return req.respond().goToScreen('WELCOME', {
          user_name: user.name,
          user_email: user.email,
        });

      case 'WELCOME':
        // User submitted the welcome form
        return req.respond().goToScreen('PRODUCT_SELECT', {
          products: await getAvailableProducts(),
        });

      case 'PRODUCT_SELECT':
        // Validate product selection
        const productId = req.data.product as string;
        if (!await isProductAvailable(productId)) {
          return req.respond()
            .goToScreen('PRODUCT_SELECT', {
              products: await getAvailableProducts(),
            })
            .withError('This product is no longer available');
        }

        // Move to confirmation
        const product = await getProduct(productId);
        return req.respond().goToScreen('CONFIRM', {
          product_name: product.name,
          product_price: product.price,
        });

      case 'CONFIRM':
        // Process the order
        const order = await createOrder({
          userId: req.flowToken,
          productId: req.data.product_id,
        });

        // Complete the flow
        return req.respond().close({
          order_id: order.id,
          message: 'Order placed successfully!',
        });

      default:
        return req.respond().goToScreen('ERROR', {
          message: 'Unknown screen',
        });
    }
  },

  onError: (error, req) => {
    console.error('Flow error:', error);
    console.error('Request:', req);
    // Send to error tracking service
  },
}));
```

## Using Flow Token

The `flowToken` is passed from `sendFlow` and can be used for session management:

```typescript
// When sending the flow
await bot.sendFlow(userPhone, flowId, 'Start', {
  body: 'Begin the process',
  flowToken: JSON.stringify({
    userId: 'user_123',
    sessionId: 'session_456',
  }),
});

// In your endpoint
onRequest: (req) => {
  const { userId, sessionId } = JSON.parse(req.flowToken);
  // Use for session management, user lookup, etc.
}
```

## Security Considerations

### Signature Validation

Enable signature validation by providing your Meta app secret:

```typescript
createFlowEndpoint({
  privateKey: process.env.FLOW_PRIVATE_KEY!,
  appSecret: process.env.META_APP_SECRET!, // Validates X-Hub-Signature-256
  onRequest: (req) => { /* ... */ },
});
```

### HTTPS Required

Your endpoint must be served over HTTPS in production. WhatsApp will not communicate with HTTP endpoints.

### Key Rotation

To rotate your encryption keys:

1. Generate a new key pair
2. Upload the new public key to WhatsApp
3. Update your endpoint with the new private key
4. Old keys remain valid for a short period during transition

## Error Handling

The endpoint automatically handles:

- **Ping requests** - Returns `{ data: { status: 'active' } }`
- **Error notifications** - Returns acknowledgment (configurable with `acknowledgeErrors`)
- **Decryption failures** - Returns HTTP 421 to trigger key re-download

For custom error handling:

```typescript
createFlowEndpoint({
  privateKey,
  onRequest: async (req) => {
    try {
      return await handleRequest(req);
    } catch (error) {
      // Log the error
      console.error('Request failed:', error);

      // Return error to user
      return req.respond()
        .goToScreen(req.screen || 'ERROR', req.data)
        .withError('Something went wrong. Please try again.');
    }
  },
  onError: (error, req) => {
    // Additional error logging/monitoring
    Sentry.captureException(error, { extra: { flowRequest: req } });
  },
});
```

## Crypto Utilities

The library exports crypto utilities for advanced use cases:

```typescript
import {
  generateKeyPair,
  decryptRequest,
  encryptResponse,
  validateSignature,
} from '@awadoc/whatsapp-cloud-api/flows';

// Generate keys
const { privateKey, publicKey } = generateKeyPair();

// Manual decryption (usually not needed)
const { decryptedData, aesKey, iv } = decryptRequest(encryptedBody, privateKey);

// Manual encryption (usually not needed)
const encrypted = encryptResponse(responseObject, aesKey, iv);

// Validate signature
const isValid = validateSignature(rawBody, signatureHeader, appSecret);
```

## Configuring Flow Endpoint URI

After setting up your endpoint, configure it in WhatsApp:

```typescript
import { createFlowManager } from '@awadoc/whatsapp-cloud-api/flows';

const flows = createFlowManager(wabaId, accessToken);

// Set during flow creation
await flows.create({
  name: 'My Flow',
  endpointUri: 'https://your-server.com/flow-endpoint',
});

// Or update later
await flows.updateMetadata(flowId, {
  endpointUri: 'https://your-server.com/flow-endpoint',
});
```

## Next Steps

- [Flow JSON Builder](./flow-json-builder.md) - Build flows with `DataExchangeAction`
- [Handling Flow Responses](./handling-responses.md) - Process completed flows in webhooks
