// In utils/misc.ts - Complete type definitions
export interface FreeFormObjectMap {
  // message: MessageDataWithContext;
  text: { text: string };
  image: {
    caption?: string;
    mime_type: string;
    sha256: string;
    id: string;
  };
  document: {
    caption?: string;
    filename?: string;
    mime_type: string;
    sha256: string;
    id: string;
  };
  audio: {
    mime_type: string;
    sha256: string;
    id: string;
    voice?: boolean;
  };
  video: {
    caption?: string;
    mime_type: string;
    sha256: string;
    id: string;
  };
  sticker: {
    mime_type: string;
    sha256: string;
    id: string;
  };
  location: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contacts: Array<{
    /** vCard string — present when the user shared a contact directly (Meta 2026). */
    vcard?: string;
    /** `contact_request` (tapped a REQUEST_CONTACT_INFO button) or `other`. */
    origin?: 'contact_request' | 'other';
    addresses?: Array<{
      city?: string;
      country?: string;
      country_code?: string;
      state?: string;
      street?: string;
      type?: 'HOME' | 'WORK';
      zip?: string;
    }>;
    birthday?: string;
    emails?: Array<{
      email?: string;
      type?: 'WORK' | 'HOME';
    }>;
    name?: {
      formatted_name?: string;
      first_name?: string;
      last_name?: string;
      middle_name?: string;
      suffix?: string;
      prefix?: string;
    };
    org?: {
      company?: string;
      department?: string;
      title?: string;
    };
    phones?: Array<{
      phone?: string;
      wa_id?: string;
      type?: 'HOME' | 'WORK';
    }>;
    urls?: Array<{
      url?: string;
      type?: 'HOME' | 'WORK';
    }>;
  }>;
  button_reply: {
    id: string;
    title: string;
  };
  list_reply: {
    id: string;
    title: string;
    description?: string;
  };
  /** Quick-reply button tap on a template message. */
  button: {
    text: string;
    payload?: string;
  };
  user_changed_number: {
    body: string;
    new_wa_id: string;
    type: 'user_changed_number';
  };
  nfm_reply: {
    /** JSON string containing flow response data from CompleteAction */
    response_json: string;
    /** Body text from the flow completion message */
    body: string;
    /** Flow name */
    name: string;
    /** Parsed response data (populated by webhook handler) */
    response?: Record<string, unknown>;
  };
  reaction: {
    message_id: string;
    emoji: string;
  };
  order: {
    catalog_id: string;
    product_items: Array<{
      product_retailer_id: string;
      quantity: string;
      item_price: string;
      currency: string;
    }>;
    text?: string;
  };
  system: {
    /** Human-readable description of the change. */
    body: string;
    /** Legacy: new phone number when a user changed number (pre-username era). */
    new_wa_id?: string;
    /**
     * `customer_changed_number` | `customer_identity_changed` |
     * `user_changed_user_id` (BSUID regenerated after a phone-number change).
     */
    type: string;
    /** New wa_id (phone) after the change, when available. */
    wa_id?: string;
    /** New BSUID after the change (`user_changed_user_id`). */
    user_id?: string;
    /** New parent BSUID after the change, if parent BSUIDs are enabled. */
    parent_user_id?: string;
  };
  status: {
    id: string;
    /** `sent` | `delivered` | `read` | `failed` */
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    /** Recipient phone number. Omitted when sent to a BSUID with no phone available. */
    recipient_id?: string;
    /** Recipient BSUID. Always present for delivered/read; omitted on `failed` sent-to-phone. */
    recipient_user_id?: string;
    /** Recipient parent BSUID, when parent BSUIDs are enabled. */
    recipient_parent_user_id?: string;
    conversation?: {
      id: string;
      origin?: { type: string };
      expiration_timestamp?: string;
    };
    pricing?: {
      billable?: boolean;
      pricing_model?: string;
      category?: string;
      type?: string;
    };
    errors?: Array<{
      code: number;
      title: string;
      message?: string;
      error_data?: { details?: string };
      href?: string;
    }>;
  };
  /** A message the user edited on their device (`edit` webhook). */
  edit: {
    /** wamid of the original message that was edited. */
    original_message_id: string;
    /** The new message content, in the same shape as an incoming message. */
    message: Record<string, unknown> & { type: string };
  };
  /** A message the user deleted for everyone (`revoke` webhook). */
  revoke: {
    /** wamid of the message that was revoked. */
    original_message_id: string;
  };
  /** A message type this library does not (yet) model. Carries the raw object. */
  unsupported: {
    raw: Record<string, unknown>;
    errors?: Array<{ code: number; title: string; message?: string }>;
  };
  /**
   * A WhatsApp user's BSUID changed (`user_id_update` webhook). Persist the mapping
   * from `previous` to `current` so you keep conversation continuity.
   */
  user_id_update: {
    /** Phone number, if still available. */
    wa_id?: string;
    detail?: string;
    previous: string;
    current: string;
    parent_previous?: string;
    parent_current?: string;
    /** @deprecated use `previous` */
    old_user_id?: string;
    /** @deprecated use `current` */
    new_user_id?: string;
  };
  /** A business username status change (`business_username_updates` webhook). */
  business_username_updates: {
    display_phone_number?: string;
    username?: string;
    /** `approved` | `deleted` | `reserved` */
    status: 'approved' | 'deleted' | 'reserved';
  };
  /** @deprecated alias kept for backwards compatibility; use `business_username_updates`. */
  business_username_update: {
    user_id?: string;
    username?: string;
    status?: string;
  };
}

// Create a conditional type for better constraint handling
export type FreeFormObject<K extends keyof FreeFormObjectMap> =
  FreeFormObjectMap[K] & { context?: any };

// Union type for all specific message data types (excluding 'message')
export type SpecificMessageData = FreeFormObjectMap[keyof Omit<
FreeFormObjectMap,
'message'
>];

// Message data with context for the generic 'message' type
// type MessageDataWithContext = SpecificMessageData & { context?: any };

// Keep the existing MessageData export
export type MessageData = FreeFormObject<keyof FreeFormObjectMap>;
