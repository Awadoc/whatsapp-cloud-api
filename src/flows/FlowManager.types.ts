/**
 * Types for WhatsApp Flows Management API
 */

/**
 * Flow categories for organizing flows
 */
export type FlowCategory =
  | 'SIGN_UP'
  | 'SIGN_IN'
  | 'APPOINTMENT_BOOKING'
  | 'LEAD_GENERATION'
  | 'CONTACT_US'
  | 'CUSTOMER_SUPPORT'
  | 'SURVEY'
  | 'OTHER';

/**
 * Flow status states
 */
export type FlowStatus =
  | 'DRAFT'
  | 'PUBLISHED'
  | 'DEPRECATED'
  | 'BLOCKED'
  | 'THROTTLED';

/**
 * Flow validation error from WhatsApp
 */
export interface FlowValidationError {
  /** Error code */
  error: string;
  /** Error type category */
  error_type: string;
  /** Human-readable error message */
  message: string;
  /** Starting line number in Flow JSON */
  line_start?: number;
  /** Ending line number in Flow JSON */
  line_end?: number;
  /** Starting column number */
  column_start?: number;
  /** Ending column number */
  column_end?: number;
}

/**
 * Flow preview information
 */
export interface FlowPreview {
  /** URL to preview the flow */
  preview_url: string;
  /** ISO timestamp when preview expires */
  expires_at: string;
}

/**
 * Detailed flow information returned by the API
 */
export interface FlowDetails {
  /** Unique flow ID */
  id: string;
  /** Flow name */
  name: string;
  /** Current flow status */
  status: FlowStatus;
  /** Assigned categories */
  categories: FlowCategory[];
  /** Validation errors (if any) */
  validation_errors?: FlowValidationError[];
  /** Flow JSON version */
  json_version?: string;
  /** Data API version */
  data_api_version?: string;
  /** Data exchange endpoint URI */
  endpoint_uri?: string;
  /** Preview information */
  preview?: FlowPreview;
  /** Associated WhatsApp Business Account */
  whatsapp_business_account?: {
    id: string;
  };
  /** Associated Meta application */
  application?: {
    id: string;
  };
}

/**
 * Options for creating a new flow
 */
export interface CreateFlowOptions {
  /** Flow name (max 128 characters) */
  name: string;
  /** Categories to assign to the flow */
  categories?: FlowCategory[];
  /** Clone from an existing flow ID */
  cloneFlowId?: string;
  /** Data exchange endpoint URI */
  endpointUri?: string;
}

/**
 * Result of creating a flow
 */
export interface CreateFlowResult {
  /** Newly created flow ID */
  id: string;
}

/**
 * Options for updating flow metadata
 */
export interface UpdateFlowMetadataOptions {
  /** New flow name */
  name?: string;
  /** New categories */
  categories?: FlowCategory[];
  /** New endpoint URI */
  endpointUri?: string;
  /** Application ID to associate with the flow */
  applicationId?: string;
}

/**
 * Result of updating flow JSON
 */
export interface UpdateFlowJsonResult {
  /** Whether the update was successful */
  success: boolean;
  /** Validation errors (if any) */
  validation_errors?: FlowValidationError[];
}

/**
 * Basic success result
 */
export interface FlowSuccessResult {
  /** Whether the operation was successful */
  success: boolean;
}

/**
 * List of flows result
 */
export interface FlowListResult {
  /** Array of flow details */
  data: FlowDetails[];
  /** Pagination cursors */
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
}

/**
 * Available fields to request when fetching flow details
 */
export type FlowField =
  | 'id'
  | 'name'
  | 'status'
  | 'categories'
  | 'validation_errors'
  | 'json_version'
  | 'data_api_version'
  | 'endpoint_uri'
  | 'preview'
  | 'whatsapp_business_account'
  | 'application';

/**
 * Default fields to fetch when getting flow details
 */
export const DEFAULT_FLOW_FIELDS: FlowField[] = [
  'id',
  'name',
  'status',
  'categories',
  'validation_errors',
  'json_version',
  'data_api_version',
  'endpoint_uri',
];

/**
 * Options for FlowManager creation
 */
export interface FlowManagerOptions {
  /** Graph API version (default: 'v20.0') */
  version?: string;
}
