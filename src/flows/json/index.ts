/**
 * Flow JSON builder classes and types
 */

// Main classes
export { FlowJSON } from './FlowJSON';
export { Screen, type ScreenComponent } from './Screen';
export { Layout, type LayoutComponent } from './Layout';

// Components
export * from './components';

// Types
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

  // Data source types
  DataSourceType,
  DataSource,

  // Schema types
  FlowJSONSchema,
  ScreenSchema,
  LayoutSchema,
  ComponentSchema,

  // Component schema types
  FormSchema,
  TextInputSchema,
  TextAreaSchema,
  DropdownSchema,
  DropdownOptionSchema,
  RadioButtonsGroupSchema,
  RadioOptionSchema,
  CheckboxGroupSchema,
  CheckboxOptionSchema,
  DatePickerSchema,
  TextHeadingSchema,
  TextSubheadingSchema,
  TextBodySchema,
  ImageSchema,
  EmbeddedLinkSchema,
  FooterSchema,

  // Action schema types
  ActionSchema,
  ActionType,
  NavigateActionSchema,
  DataExchangeActionSchema,
  CompleteActionSchema,
  OpenUrlActionSchema,
} from './types';
