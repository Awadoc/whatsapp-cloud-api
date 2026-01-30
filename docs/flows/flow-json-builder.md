# Flow JSON Builder

The Flow JSON Builder provides type-safe classes to construct WhatsApp Flow JSON structures. Instead of writing raw JSON, you can use intuitive builder classes with method chaining.

## Import

```typescript
import {
  // Core builders
  FlowJSON,
  Screen,
  Layout,

  // Input components
  TextInput,
  TextArea,

  // Selection components
  Dropdown,
  RadioButtonsGroup,
  CheckboxGroup,

  // Picker components
  DatePicker,

  // Display components
  TextHeading,
  TextSubheading,
  TextBody,
  Image,

  // Navigation components
  Footer,
  EmbeddedLink,

  // Container components
  Form,

  // Actions
  NavigateAction,
  DataExchangeAction,
  CompleteAction,
  OpenUrlAction,
} from '@awadoc/whatsapp-cloud-api/flows';
```

## FlowJSON Builder

The `FlowJSON` class is the root builder for creating a complete flow definition.

```typescript
const flow = new FlowJSON()
  .setVersion('6.0')                    // Optional: defaults to '6.0'
  .setDataApiVersion('3.0')             // Optional: defaults to '3.0'
  .setRoutingModel({
    'SCREEN_1': ['SCREEN_2', 'SCREEN_3'],
    'SCREEN_2': ['SCREEN_3'],
  })
  .addScreen(screen1)
  .addScreen(screen2)
  .addScreen(screen3);

// Convert to JSON object
const json = flow.toJSON();

// Convert to JSON string (pretty printed)
const jsonString = flow.toString();
```

## Screen Builder

Screens are the pages users navigate through in a flow.

```typescript
const welcomeScreen = new Screen('WELCOME')
  .setTitle('Welcome!')              // Screen title
  .setTerminal(false)                // Can navigate away from this screen
  .setRefreshOnBack(true)            // Refresh data when navigating back
  .setData({                          // Initial screen data
    user_name: { type: 'string', __example__: 'John' },
  })
  .addComponent(new TextHeading('Hello!'))
  .addComponent(new TextBody('Welcome to our service.'))
  .addComponent(new Footer('Get Started', new NavigateAction('FORM')));

// Terminal screen (flow ends here)
const thankYouScreen = new Screen('THANK_YOU')
  .setTitle('Thank You')
  .setTerminal(true);                 // No navigation from this screen
```

## Input Components

### TextInput

Single-line text input with optional validation.

```typescript
// Basic text input
new TextInput('name', 'Full Name')
  .setRequired(true)

// Email input
new TextInput('email', 'Email Address')
  .setInputType('email')
  .setRequired(true)
  .setHelperText('We will send your confirmation here')

// Phone number with initial value
new TextInput('phone', 'Phone Number')
  .setInputType('phone')
  .setInitValue('${data.prefilled_phone}')

// Password input with constraints
new TextInput('password', 'Password')
  .setInputType('password')
  .setMinChars(8)
  .setMaxChars(50)
  .setRequired(true)
```

**Input Types:** `text`, `number`, `email`, `password`, `passcode`, `phone`

### TextArea

Multi-line text input.

```typescript
new TextArea('feedback', 'Your Feedback')
  .setMaxLength(500)
  .setHelperText('Share your thoughts with us')
  .setRequired(false)
```

## Selection Components

### Dropdown

Single selection from a dropdown list.

```typescript
// Static options
new Dropdown('country', 'Select Country', [
  { id: 'us', title: 'United States' },
  { id: 'uk', title: 'United Kingdom' },
  { id: 'ca', title: 'Canada' },
])
  .setRequired(true)
  .setInitValue('us')

// Dynamic options from data
new Dropdown('product', 'Select Product', '${data.products}')
```

### RadioButtonsGroup

Single selection with visible radio buttons.

```typescript
new RadioButtonsGroup('rating', 'Rate your experience', [
  { id: '5', title: 'Excellent', description: 'Best experience' },
  { id: '4', title: 'Good' },
  { id: '3', title: 'Average' },
  { id: '2', title: 'Poor' },
  { id: '1', title: 'Very Poor' },
])
  .setRequired(true)
```

### CheckboxGroup

Multiple selection with checkboxes.

```typescript
new CheckboxGroup('interests', 'Select your interests', [
  { id: 'tech', title: 'Technology' },
  { id: 'sports', title: 'Sports' },
  { id: 'music', title: 'Music' },
  { id: 'travel', title: 'Travel' },
])
  .setMinSelectedItems(1)
  .setMaxSelectedItems(3)
  .setRequired(true)
```

## Picker Components

### DatePicker

Date selection component.

```typescript
new DatePicker('appointment_date', 'Select Date')
  .setMinDate('2024-01-01')
  .setMaxDate('2024-12-31')
  .setUnavailableDates(['2024-12-25', '2024-01-01'])
  .setHelperText('Choose your preferred date')
  .setRequired(true)
```

## Display Components

### TextHeading

Large heading text.

```typescript
// Static heading
new TextHeading('Welcome to Our Store')

// Dynamic heading
new TextHeading('Hello, ${data.user_name}!')
```

### TextSubheading

Medium subheading text.

```typescript
new TextSubheading('Step 1 of 3: Personal Information')
```

### TextBody

Body text with formatting options.

```typescript
// Simple text
new TextBody('Please fill in all required fields.')

// Bold text
new TextBody('Important: This action cannot be undone')
  .setBold()

// Strikethrough for prices
new TextBody('$99.99')
  .setStrikethrough()
```

### Image

Display images in flows.

```typescript
// Basic image
new Image('https://example.com/logo.png')
  .setAltText('Company Logo')

// Image with dimensions
new Image('https://example.com/product.jpg')
  .setWidth(200)
  .setHeight(200)
  .setScaleType('cover')

// Dynamic image with aspect ratio
new Image('${data.product_image}')
  .setAspectRatio(16/9)
```

## Navigation Components

### Footer

The primary action button at the bottom of screens.

```typescript
// Navigate to another screen
new Footer('Next', new NavigateAction('NEXT_SCREEN'))

// Navigate with data
new Footer('Continue', new NavigateAction('DETAILS', {
  name: '${form.name}',
  email: '${form.email}',
}))

// Submit to data exchange endpoint
new Footer('Submit', new DataExchangeAction({
  name: '${form.name}',
  selection: '${form.selection}',
}))

// Complete the flow
new Footer('Finish', new CompleteAction({
  status: 'completed',
  form_data: '${form}',
}))

// With captions
new Footer('Book Now', new NavigateAction('CONFIRM'))
  .setLeftCaption('Step 2 of 3')
  .setCenterCaption('${data.price}')
  .setEnabled('${form.date}')  // Only enabled when date is selected
```

### EmbeddedLink

Inline clickable text for secondary actions.

```typescript
// Navigate to another screen
new EmbeddedLink('Skip this step', new NavigateAction('SKIP'))

// Open external URL
new EmbeddedLink('Terms & Conditions', new OpenUrlAction('https://example.com/terms'))

// Data exchange link
new EmbeddedLink('I already have an account', new DataExchangeAction({
  action: 'existing_user'
}))
```

## Container Components

### Form

Group form fields together (automatically wraps children in layout).

```typescript
const form = new Form()
  .addChild(new TextInput('name', 'Name'))
  .addChild(new TextInput('email', 'Email').setInputType('email'))
  .addChild(new Dropdown('country', 'Country', countries))
  .setInitValues({
    name: '${data.prefilled_name}',
  })
  .setErrorMessages({
    name: 'Please enter your name',
    email: 'Please enter a valid email',
  });
```

### Layout

Container for organizing components (SingleColumnLayout).

```typescript
const layout = new Layout()
  .addChild(new TextHeading('Welcome'))
  .addChild(new TextBody('Please provide your details'))
  .addChild(new TextInput('name', 'Name'));
```

## Actions

Actions define what happens when users interact with buttons and links.

### NavigateAction

Navigate to another screen within the flow.

```typescript
// Simple navigation
new NavigateAction('NEXT_SCREEN')

// Navigation with data
new NavigateAction('DETAILS', {
  orderId: '${data.order_id}',
  userName: '${form.name}',
})
```

### DataExchangeAction

Send data to your data exchange endpoint and receive a response.

```typescript
new DataExchangeAction({
  action: 'validate_form',
  name: '${form.name}',
  email: '${form.email}',
})
```

### CompleteAction

Complete the flow and send final data back to the webhook.

```typescript
// Complete with data
new CompleteAction({
  booking_confirmed: true,
  booking_id: '${data.booking_id}',
})

// Simple completion
new CompleteAction()
```

### OpenUrlAction

Open a URL in the user's browser.

```typescript
// Static URL
new OpenUrlAction('https://example.com/terms')

// Dynamic URL
new OpenUrlAction('${data.payment_url}')
```

## Dynamic References

Use template literals to reference dynamic data:

- `${data.field}` - Reference screen data
- `${form.field}` - Reference form field values

```typescript
// Reference data passed to the screen
new TextHeading('Hello, ${data.user_name}!')

// Reference form field values
new Footer('Submit', new NavigateAction('CONFIRM', {
  name: '${form.name}',
  email: '${form.email}',
}))

// Conditional visibility
new TextBody('${data.error_message}')
  .setVisible('${data.has_error}')
```

## Complete Example

```typescript
import {
  FlowJSON,
  Screen,
  TextHeading,
  TextBody,
  TextInput,
  TextArea,
  RadioButtonsGroup,
  Footer,
  EmbeddedLink,
  NavigateAction,
  CompleteAction,
  OpenUrlAction,
} from '@awadoc/whatsapp-cloud-api/flows';

const feedbackFlow = new FlowJSON()
  .setRoutingModel({
    'WELCOME': ['FEEDBACK'],
    'FEEDBACK': ['THANK_YOU'],
  })
  .addScreen(
    new Screen('WELCOME')
      .setTitle('Share Feedback')
      .addComponent(new TextHeading('We Value Your Opinion'))
      .addComponent(new TextBody('Help us improve by sharing your experience.'))
      .addComponent(new Footer('Start', new NavigateAction('FEEDBACK')))
  )
  .addScreen(
    new Screen('FEEDBACK')
      .setTitle('Your Feedback')
      .addComponent(
        new RadioButtonsGroup('rating', 'How would you rate us?', [
          { id: '5', title: 'Excellent' },
          { id: '4', title: 'Good' },
          { id: '3', title: 'Average' },
          { id: '2', title: 'Poor' },
          { id: '1', title: 'Very Poor' },
        ]).setRequired(true)
      )
      .addComponent(
        new TextArea('comments', 'Additional Comments')
          .setMaxLength(500)
      )
      .addComponent(
        new Footer('Submit', new CompleteAction({
          rating: '${form.rating}',
          comments: '${form.comments}',
        }))
      )
      .addComponent(
        new EmbeddedLink(
          'Privacy Policy',
          new OpenUrlAction('https://example.com/privacy')
        )
      )
  )
  .addScreen(
    new Screen('THANK_YOU')
      .setTitle('Thank You!')
      .setTerminal(true)
      .addComponent(new TextHeading('Thanks for your feedback!'))
      .addComponent(new TextBody('We appreciate you taking the time.'))
  );

// Use with FlowManager
await flows.updateJson(flowId, feedbackFlow);
```

## Using Raw JSON

If you prefer, you can also pass raw JSON objects or strings to `updateJson`:

```typescript
// Raw JSON object
await flows.updateJson(flowId, {
  version: '6.0',
  screens: [
    {
      id: 'WELCOME',
      title: 'Welcome',
      layout: {
        type: 'SingleColumnLayout',
        children: [/* ... */],
      },
    },
  ],
});

// JSON string (e.g., loaded from a file)
const jsonString = fs.readFileSync('flow.json', 'utf-8');
await flows.updateJson(flowId, jsonString);
```

## Next Steps

- [Flow Management](./flow-management.md) - Create and manage flows
- [Data Exchange Endpoint](./data-exchange-endpoint.md) - Handle dynamic data requests
