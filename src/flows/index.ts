/**
 * WhatsApp Flows module
 *
 * This module provides comprehensive support for WhatsApp Flows:
 * - Flow management (create, update, publish, deprecate, delete)
 * - Type-safe Flow JSON builders
 * - Data exchange endpoint middleware
 * - Encryption utilities
 *
 * @example Sending a Flow
 * ```typescript
 * import { createBot } from '@awadoc/whatsapp-cloud-api';
 *
 * const bot = createBot(phoneId, accessToken);
 *
 * await bot.sendFlow(userPhone, flowId, 'Start', {
 *   body: 'Click below to begin',
 *   flowAction: 'navigate',
 *   flowActionPayload: { screen: 'WELCOME' },
 * });
 * ```
 *
 * @example Managing Flows
 * ```typescript
 * import { createFlowManager, FlowJSON, Screen } from '@awadoc/whatsapp-cloud-api/flows';
 *
 * const flows = createFlowManager(wabaId, accessToken);
 *
 * // Create and upload a flow
 * const { id } = await flows.create({ name: 'My Flow' });
 * await flows.updateJson(id, new FlowJSON().addScreen(...));
 * await flows.publish(id);
 * ```
 *
 * @example Data Exchange Endpoint
 * ```typescript
 * // Express
 * import { createFlowEndpoint } from '@awadoc/whatsapp-cloud-api/flows/endpoint/express';
 *
 * app.use('/flow', createFlowEndpoint({
 *   privateKey: process.env.FLOW_PRIVATE_KEY!,
 *   onRequest: (req) => req.respond().goToScreen('NEXT'),
 * }));
 *
 * // Next.js
 * import { createFlowEndpointHandlers } from '@awadoc/whatsapp-cloud-api/flows/endpoint/next';
 *
 * export const { POST } = createFlowEndpointHandlers({
 *   privateKey: process.env.FLOW_PRIVATE_KEY!,
 *   onRequest: (req) => req.respond().goToScreen('NEXT'),
 * });
 * ```
 */

// Flow Manager
export { createFlowManager, type FlowManager } from './FlowManager';
export type {
  FlowCategory,
  FlowStatus,
  FlowDetails,
  FlowValidationError,
  FlowPreview,
  CreateFlowOptions,
  CreateFlowResult,
  UpdateFlowMetadataOptions,
  UpdateFlowJsonResult,
  FlowSuccessResult,
  FlowListResult,
  FlowField,
  FlowManagerOptions,
} from './FlowManager.types';

// Flow JSON Builders
export {
  FlowJSON,
  Screen,
  Layout,
  // Components
  TextInput,
  TextArea,
  Dropdown,
  RadioButtonsGroup,
  CheckboxGroup,
  DatePicker,
  TextHeading,
  TextSubheading,
  TextBody,
  Image,
  Footer,
  EmbeddedLink,
  Form,
  // Actions
  NavigateAction,
  DataExchangeAction,
  CompleteAction,
  OpenUrlAction,
} from './json';

export type {
  // Version types
  FlowVersion,
  DataApiVersion,
  // Reference types
  ScreenDataRef,
  FormRef,
  ScreenRef,
  DynamicRef,
  DynamicValue,
  // Schema types
  FlowJSONSchema,
  ScreenSchema,
  LayoutSchema,
  ComponentSchema,
  // Component schema types
  DropdownOptionSchema,
  RadioOptionSchema,
  CheckboxOptionSchema,
  // Action types
  ActionSchema,
  Action,
  TextInputType,
  ScreenComponent,
  LayoutComponent,
  FormComponent,
} from './json';

// Crypto utilities
export {
  generateKeyPair,
  decryptRequest,
  encryptResponse,
  validateSignature,
} from './crypto';

export type {
  FlowKeyPair,
  EncryptedFlowRequest,
  DecryptedFlowRequest,
  DecryptionResult,
  FlowRequestAction,
} from './crypto';

// Endpoint types (for use with Express/Next handlers)
export {
  FlowResponseBuilder,
} from './endpoint';

export type {
  FlowRequest,
  FlowRequestHandler,
  FlowErrorHandler,
  FlowEndpointOptions,
} from './endpoint';
