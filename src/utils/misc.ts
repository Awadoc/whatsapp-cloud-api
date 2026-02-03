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
    body: string;
    new_wa_id?: string;
    type: string;
    user_id?: string; // BSUID update
  };
  status: {
    id: string;
    status: string;
    timestamp: string;
    recipient_id: string;
    recipient_user_id?: string;
    errors?: any[];
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
