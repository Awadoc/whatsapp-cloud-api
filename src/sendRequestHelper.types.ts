// sendRequestHelper.types.ts

// User-facing result types
export interface SendMessageResult {
  messageId: string;
  phoneNumber: string;
  whatsappId: string;
  success?: boolean;
}

export interface UploadMediaResult {
  id: string;
}

// Official API response types
export interface OfficialSendMessageResult {
  success: true;
  messaging_product: 'whatsapp';
  contacts: {
    input: string;
    wa_id: string;
  }[];
  messages: {
    id: string;
  }[];
}

export interface OfficialUploadMediaResult {
  id: string;
}

// Generic structure for path responses
export type PathResponse<TOfficial, TTransformed> = {
  official: TOfficial;
  transformed: TTransformed;
};

// Map of API paths to their response types
export type ApiPathResponseMap = {
  messages: PathResponse<OfficialSendMessageResult, SendMessageResult>;
  media: PathResponse<OfficialUploadMediaResult, UploadMediaResult>;
};
