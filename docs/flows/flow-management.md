# Flow Management

The `FlowManager` provides a complete API for managing WhatsApp Flows programmatically. You can create, update, publish, deprecate, and delete flows without using the WhatsApp Business Manager UI.

## Creating a Flow Manager

```typescript
import { createFlowManager } from '@awadoc/whatsapp-cloud-api/flows';

const flows = createFlowManager(
  'YOUR_WABA_ID',      // WhatsApp Business Account ID
  'YOUR_ACCESS_TOKEN', // Access token with flows permissions
  { version: 'v20.0' } // Optional: API version
);
```

## Flow Lifecycle

```
DRAFT → PUBLISHED → DEPRECATED
  ↓         ↓
DELETE   DELETE
```

- **DRAFT** - Initial state, can be edited and tested
- **PUBLISHED** - Live and available to users
- **DEPRECATED** - No longer available for new sends, existing instances continue working
- **BLOCKED/THROTTLED** - Meta-imposed restrictions

## API Reference

### Create a Flow

```typescript
const { id } = await flows.create({
  name: 'My Flow',                    // Required: Flow name (max 128 chars)
  categories: ['CUSTOMER_SUPPORT'],   // Optional: Categorization
  endpointUri: 'https://...',         // Optional: Data exchange endpoint
  cloneFlowId: 'EXISTING_FLOW_ID',    // Optional: Clone from existing flow
});
```

**Categories:**
- `SIGN_UP`
- `SIGN_IN`
- `APPOINTMENT_BOOKING`
- `LEAD_GENERATION`
- `CONTACT_US`
- `CUSTOMER_SUPPORT`
- `SURVEY`
- `OTHER`

### Get Flow Details

```typescript
// Get a single flow
const flow = await flows.get('FLOW_ID');

console.log(flow.name);      // Flow name
console.log(flow.status);    // DRAFT, PUBLISHED, etc.
console.log(flow.categories);

// Request specific fields only
const minimal = await flows.get('FLOW_ID', ['id', 'name', 'status']);
```

**Available Fields:**
- `id` - Flow ID
- `name` - Flow name
- `status` - Current status
- `categories` - Assigned categories
- `validation_errors` - Any validation issues
- `json_version` - Flow JSON version
- `data_api_version` - Data API version
- `endpoint_uri` - Data exchange endpoint
- `preview` - Preview URL information
- `whatsapp_business_account` - Associated WABA
- `application` - Associated Meta app

### List All Flows

```typescript
const result = await flows.list();

for (const flow of result.data) {
  console.log(`${flow.id}: ${flow.name} (${flow.status})`);
}

// With specific fields
const result = await flows.list(['id', 'name', 'status']);
```

### Update Flow JSON

Upload the flow definition. Accepts:
- A `FlowJSON` builder instance
- A raw JSON object
- A JSON string

```typescript
import { FlowJSON, Screen, TextInput, Footer, CompleteAction } from '@awadoc/whatsapp-cloud-api/flows';

// Using builders
const flowJson = new FlowJSON()
  .addScreen(
    new Screen('WELCOME')
      .setTitle('Welcome')
      .addComponent(new TextInput('name', 'Your Name'))
      .addComponent(new Footer('Submit', new CompleteAction()))
  );

const result = await flows.updateJson('FLOW_ID', flowJson);

if (!result.success) {
  console.error('Validation errors:', result.validation_errors);
}

// Using raw JSON object
await flows.updateJson('FLOW_ID', {
  version: '6.0',
  screens: [/* ... */],
});

// Using JSON string
await flows.updateJson('FLOW_ID', '{"version":"6.0","screens":[...]}');
```

### Update Flow Metadata

```typescript
await flows.updateMetadata('FLOW_ID', {
  name: 'Updated Flow Name',
  categories: ['SURVEY'],
  endpointUri: 'https://example.com/flow-endpoint',
  applicationId: 'META_APP_ID',
});
```

### Publish a Flow

Publishing makes a flow available for production use. The flow must pass validation.

```typescript
const result = await flows.publish('FLOW_ID');

if (result.success) {
  console.log('Flow published successfully');
}
```

> **Note:** Published flows cannot have their JSON updated. To make changes, you must deprecate and create a new flow.

### Deprecate a Flow

Deprecating prevents new sends but allows existing flow instances to complete.

```typescript
await flows.deprecate('FLOW_ID');
```

### Delete a Flow

Permanently removes a flow. Only DRAFT and DEPRECATED flows can be deleted.

```typescript
await flows.delete('FLOW_ID');
```

### Get Flow Preview

Get a preview URL for testing flows.

```typescript
const preview = await flows.getPreview('FLOW_ID');

console.log(preview.preview_url); // URL to preview
console.log(preview.expires_at);  // When the preview expires
```

### Set Business Public Key

Required for data exchange encryption. Upload your RSA public key.

```typescript
const publicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----`;

await flows.setBusinessPublicKey(publicKey);
```

See [Data Exchange Endpoint](./data-exchange-endpoint.md) for key generation.

## Complete Example

```typescript
import {
  createFlowManager,
  FlowJSON,
  Screen,
  Layout,
  TextInput,
  TextArea,
  RadioButtonsGroup,
  Footer,
  NavigateAction,
  CompleteAction
} from '@awadoc/whatsapp-cloud-api/flows';

const flows = createFlowManager(wabaId, accessToken);

// 1. Create a new flow
const { id: flowId } = await flows.create({
  name: 'Customer Feedback',
  categories: ['SURVEY'],
});

// 2. Build and upload the flow JSON
const flowJson = new FlowJSON()
  .setRoutingModel({
    'RATING': ['COMMENTS', 'THANK_YOU'],
    'COMMENTS': ['THANK_YOU'],
  })
  .addScreen(
    new Screen('RATING')
      .setTitle('Rate Us')
      .addComponent(
        new RadioButtonsGroup('rating', 'How would you rate our service?', [
          { id: '5', title: 'Excellent' },
          { id: '4', title: 'Good' },
          { id: '3', title: 'Average' },
          { id: '2', title: 'Poor' },
          { id: '1', title: 'Very Poor' },
        ]).setRequired(true)
      )
      .addComponent(
        new Footer('Next', new NavigateAction('COMMENTS'))
      )
  )
  .addScreen(
    new Screen('COMMENTS')
      .setTitle('Additional Feedback')
      .addComponent(
        new TextArea('comments', 'Any additional comments?')
      )
      .addComponent(
        new Footer('Submit', new CompleteAction())
      )
  )
  .addScreen(
    new Screen('THANK_YOU')
      .setTitle('Thank You!')
      .setTerminal(true)
  );

const updateResult = await flows.updateJson(flowId, flowJson);

if (!updateResult.success) {
  console.error('Flow has errors:', updateResult.validation_errors);
  await flows.delete(flowId);
  process.exit(1);
}

// 3. Test in draft mode (optional)
const preview = await flows.getPreview(flowId);
console.log('Preview URL:', preview.preview_url);

// 4. Publish when ready
await flows.publish(flowId);
console.log('Flow published! ID:', flowId);
```

## Error Handling

```typescript
try {
  await flows.publish('FLOW_ID');
} catch (error) {
  if (error.response?.data?.error) {
    const { message, code, error_subcode } = error.response.data.error;
    console.error(`Flow API Error [${code}]: ${message}`);
  } else {
    throw error;
  }
}
```

## Validation Errors

When updating flow JSON, validation errors indicate issues with your flow structure:

```typescript
const result = await flows.updateJson(flowId, flowJson);

if (result.validation_errors?.length) {
  for (const error of result.validation_errors) {
    console.error(`${error.error_type}: ${error.message}`);
    if (error.line_start) {
      console.error(`  at line ${error.line_start}`);
    }
  }
}
```

## Next Steps

- [Flow JSON Builder](./flow-json-builder.md) - Learn to build flow JSON with type-safe builders
- [Data Exchange Endpoint](./data-exchange-endpoint.md) - Set up encryption for dynamic flows
