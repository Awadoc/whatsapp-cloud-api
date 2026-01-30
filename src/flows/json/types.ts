/**
 * Types for WhatsApp Flow JSON schema
 *
 * These types provide strict typing for Flow JSON structures
 * as defined by the WhatsApp Flows specification.
 */

/**
 * Supported Flow JSON versions
 */
export type FlowVersion = '3.0' | '3.1' | '4.0' | '5.0';

/**
 * Supported data API versions for data exchange
 */
export type DataApiVersion = '3.0' | '4.0';

// ============================================================================
// Reference Types (for type-safe data binding)
// ============================================================================

/**
 * Reference to screen data passed via navigate/data_exchange
 */
export type ScreenDataRef<K extends string = string> = `\${data.${K}}`;

/**
 * Reference to form field value
 */
export type FormRef<K extends string = string> = `\${form.${K}}`;

/**
 * Reference to data from another screen
 */
export type ScreenRef<
  S extends string = string,
  K extends string = string,
> = `\${screen.${S}.data.${K}}`;

/**
 * Any dynamic value reference
 */
export type DynamicRef = ScreenDataRef | FormRef | ScreenRef;

/**
 * Value that can be static or dynamic
 */
export type DynamicValue<T = string> = T | DynamicRef;

// ============================================================================
// Data Source Types
// ============================================================================

/**
 * Data source type for screen data declarations
 */
export type DataSourceType = 'string' | 'number' | 'boolean' | 'object' | 'array';

/**
 * Data source declaration for screen data
 */
export interface DataSource {
  /** Data type */
  type: DataSourceType;
  /** Example value for validation/preview */
  __example__?: unknown;
}

// ============================================================================
// Component Schema Types
// ============================================================================

/**
 * Base properties shared by all components
 */
export interface BaseComponentSchema {
  /** Component type identifier */
  type: string;
  /** Component name (for form fields) */
  name?: string;
  /** Visibility condition */
  visible?: boolean | DynamicRef;
}

/**
 * Form component schema
 */
export interface FormSchema extends BaseComponentSchema {
  type: 'Form';
  name: string;
  children: ComponentSchema[];
  'init-values'?: Record<string, unknown>;
  'error-messages'?: Record<string, string | DynamicRef>;
}

/**
 * TextInput component schema
 */
export interface TextInputSchema extends BaseComponentSchema {
  type: 'TextInput';
  name: string;
  label: string | DynamicRef;
  required?: boolean;
  'input-type'?: 'text' | 'number' | 'email' | 'password' | 'passcode' | 'phone';
  'min-chars'?: number;
  'max-chars'?: number;
  'helper-text'?: string | DynamicRef;
  enabled?: boolean | DynamicRef;
  'init-value'?: string | DynamicRef;
  'error-message'?: string | DynamicRef;
}

/**
 * TextArea component schema
 */
export interface TextAreaSchema extends BaseComponentSchema {
  type: 'TextArea';
  name: string;
  label: string | DynamicRef;
  required?: boolean;
  'max-length'?: number;
  'helper-text'?: string | DynamicRef;
  enabled?: boolean | DynamicRef;
  'init-value'?: string | DynamicRef;
  'error-message'?: string | DynamicRef;
}

/**
 * Dropdown option
 */
export interface DropdownOptionSchema {
  id: string;
  title: string;
  description?: string;
  enabled?: boolean;
}

/**
 * Dropdown component schema
 */
export interface DropdownSchema extends BaseComponentSchema {
  type: 'Dropdown';
  name: string;
  label: string | DynamicRef;
  required?: boolean;
  'data-source': DynamicRef | DropdownOptionSchema[];
  enabled?: boolean | DynamicRef;
  'init-value'?: string | DynamicRef;
  'error-message'?: string | DynamicRef;
}

/**
 * Radio button option
 */
export interface RadioOptionSchema {
  id: string;
  title: string;
  description?: string;
}

/**
 * RadioButtonsGroup component schema
 */
export interface RadioButtonsGroupSchema extends BaseComponentSchema {
  type: 'RadioButtonsGroup';
  name: string;
  label: string | DynamicRef;
  required?: boolean;
  'data-source': DynamicRef | RadioOptionSchema[];
  enabled?: boolean | DynamicRef;
  'init-value'?: string | DynamicRef;
  'error-message'?: string | DynamicRef;
}

/**
 * Checkbox option
 */
export interface CheckboxOptionSchema {
  id: string;
  title: string;
  description?: string;
}

/**
 * CheckboxGroup component schema
 */
export interface CheckboxGroupSchema extends BaseComponentSchema {
  type: 'CheckboxGroup';
  name: string;
  label: string | DynamicRef;
  required?: boolean;
  'min-selected-items'?: number;
  'max-selected-items'?: number;
  'data-source': DynamicRef | CheckboxOptionSchema[];
  enabled?: boolean | DynamicRef;
  'init-value'?: string[] | DynamicRef;
  'error-message'?: string | DynamicRef;
}

/**
 * DatePicker component schema
 */
export interface DatePickerSchema extends BaseComponentSchema {
  type: 'DatePicker';
  name: string;
  label: string | DynamicRef;
  required?: boolean;
  'min-date'?: string | DynamicRef;
  'max-date'?: string | DynamicRef;
  'unavailable-dates'?: string[] | DynamicRef;
  'helper-text'?: string | DynamicRef;
  enabled?: boolean | DynamicRef;
  'init-value'?: string | DynamicRef;
  'error-message'?: string | DynamicRef;
}

/**
 * TextHeading component schema
 */
export interface TextHeadingSchema extends BaseComponentSchema {
  type: 'TextHeading';
  text: string | DynamicRef;
}

/**
 * TextSubheading component schema
 */
export interface TextSubheadingSchema extends BaseComponentSchema {
  type: 'TextSubheading';
  text: string | DynamicRef;
}

/**
 * TextBody component schema
 */
export interface TextBodySchema extends BaseComponentSchema {
  type: 'TextBody';
  text: string | DynamicRef;
  'font-weight'?: 'normal' | 'bold';
  strikethrough?: boolean;
}

/**
 * Image component schema
 */
export interface ImageSchema extends BaseComponentSchema {
  type: 'Image';
  src: string | DynamicRef;
  width?: number;
  height?: number;
  'scale-type'?: 'cover' | 'contain';
  'aspect-ratio'?: number;
  'alt-text'?: string;
}

/**
 * EmbeddedLink component schema
 */
export interface EmbeddedLinkSchema extends BaseComponentSchema {
  type: 'EmbeddedLink';
  text: string | DynamicRef;
  'on-click-action': ActionSchema;
}

/**
 * Action types for on-click-action
 */
export type ActionType = 'navigate' | 'data_exchange' | 'complete' | 'open_url';

/**
 * Navigate action schema
 */
export interface NavigateActionSchema {
  name: 'navigate';
  next: {
    type: 'screen';
    name: string;
  };
  payload?: Record<string, unknown>;
}

/**
 * Data exchange action schema
 */
export interface DataExchangeActionSchema {
  name: 'data_exchange';
  payload?: Record<string, unknown>;
}

/**
 * Complete action schema
 */
export interface CompleteActionSchema {
  name: 'complete';
  payload?: Record<string, unknown>;
}

/**
 * Open URL action schema
 */
export interface OpenUrlActionSchema {
  name: 'open_url';
  url: string | DynamicRef;
}

/**
 * Any action schema
 */
export type ActionSchema =
  | NavigateActionSchema
  | DataExchangeActionSchema
  | CompleteActionSchema
  | OpenUrlActionSchema;

/**
 * Footer component schema
 */
export interface FooterSchema extends BaseComponentSchema {
  type: 'Footer';
  label: string | DynamicRef;
  'on-click-action': ActionSchema;
  'left-caption'?: string | DynamicRef;
  'center-caption'?: string | DynamicRef;
  enabled?: boolean | DynamicRef;
}

/**
 * Union of all component schemas
 */
export type ComponentSchema =
  | FormSchema
  | TextInputSchema
  | TextAreaSchema
  | DropdownSchema
  | RadioButtonsGroupSchema
  | CheckboxGroupSchema
  | DatePickerSchema
  | TextHeadingSchema
  | TextSubheadingSchema
  | TextBodySchema
  | ImageSchema
  | EmbeddedLinkSchema
  | FooterSchema;

// ============================================================================
// Layout and Screen Types
// ============================================================================

/**
 * Layout type (currently only SingleColumnLayout is supported)
 */
export type LayoutType = 'SingleColumnLayout';

/**
 * Layout schema
 */
export interface LayoutSchema {
  type: LayoutType;
  children: ComponentSchema[];
}

/**
 * Screen schema
 */
export interface ScreenSchema {
  /** Unique screen identifier */
  id: string;
  /** Screen title displayed in header */
  title?: string;
  /** Whether this is a terminal screen */
  terminal?: boolean;
  /** Whether to refresh data when user presses back */
  refresh_on_back?: boolean;
  /** Data declarations for the screen */
  data?: Record<string, DataSource>;
  /** Screen layout */
  layout: LayoutSchema;
}

// ============================================================================
// Flow JSON Schema
// ============================================================================

/**
 * Complete Flow JSON schema
 */
export interface FlowJSONSchema {
  /** Flow JSON version */
  version: FlowVersion;
  /** Data API version for data exchange */
  data_api_version?: DataApiVersion;
  /** Routing model for screen navigation */
  routing_model?: Record<string, string[]>;
  /** Array of screens */
  screens: ScreenSchema[];
}
