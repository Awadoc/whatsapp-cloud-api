import isURL from 'validator/lib/isURL';
import PubSub from 'pubsub-js';
import * as fs from 'fs';
import * as path from 'path';
import mime from 'mime-types';
import FormData from 'form-data';
import { fileURLToPath } from 'url';
import { ICreateBot } from './createBot.types';
import {
  ContactMessage,
  InteractiveMessage,
  LocationMessage,
  MediaBase,
  MediaMessage,
  TemplateMessage,
  TextMessage,
  MarkAsRead,
  FlowMessage,
  FlowIdentifier,
} from './messages.types';
import {
  getMediaAxiosClient,
  getMessagesAxiosClient,
  sendRequestHelper,
} from './sendRequestHelper';
import { resolveRecipient } from './recipient';

interface PaylodBase {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  recipient?: string;
}

const payloadBase: PaylodBase = {
  messaging_product: 'whatsapp',
  recipient_type: 'individual',
};

export const createBot: ICreateBot = (fromPhoneNumberId, accessToken, opts) => {
  const messagesClient = getMessagesAxiosClient(
    fromPhoneNumberId,
    accessToken,
    opts?.version,
  );
  const mediaClient = getMediaAxiosClient(
    fromPhoneNumberId,
    accessToken,
    opts?.version,
  );
  const sendRequest = sendRequestHelper(messagesClient, 'messages');
  const uploadMediaRequest = sendRequestHelper(mediaClient, 'media');

  const getMediaPayload = (urlOrObjectId: string, options?: MediaBase) => ({
    ...(isURL(urlOrObjectId) ? { link: urlOrObjectId } : { id: urlOrObjectId }),
    caption: options?.caption,
    filename: options?.filename,
  });

  const getFlowIdentifier = (
    flowIdOrName: string | FlowIdentifier,
  ): FlowIdentifier => {
    if (typeof flowIdOrName === 'string') {
      return { flow_id: flowIdOrName };
    }
    return flowIdOrName;
  };

  return {
    on: (event, cb) => {
      const token = PubSub.subscribe(
        `bot-${fromPhoneNumberId}-${event}`,
        (_, data) => cb(data),
      );
      return token;
    },
    unsubscribe: (token) => PubSub.unsubscribe(token),

    sendText: (to, text, options) => {
      const recipientInfo = resolveRecipient(to, options?.recipient);
      return sendRequest<TextMessage>({
        ...payloadBase,
        to: recipientInfo.to,
        recipient: recipientInfo.recipient,
        type: 'text',
        text: {
          preview_url: options?.preview_url,
          body: text,
        },
        context: options?.context,
      });
    },

    sendMessage: (to, text, options) => {
      const recipientInfo = resolveRecipient(to, options?.recipient);
      return sendRequest<TextMessage>({
        ...payloadBase,
        to: recipientInfo.to,
        recipient: recipientInfo.recipient,
        type: 'text',
        text: {
          preview_url: options?.preview_url,
          body: text,
        },
        context: options?.context,
      });
    },

    sendImage: (to, urlOrObjectId, options) => {
      const recipientInfo = resolveRecipient(to, options?.recipient);
      return sendRequest<MediaMessage>({
        ...payloadBase,
        to: recipientInfo.to,
        recipient: recipientInfo.recipient,
        type: 'image',
        image: getMediaPayload(urlOrObjectId, options),
        context: options?.context,
      });
    },

    sendDocument: (to, urlOrObjectId, options) => {
      const recipientInfo = resolveRecipient(to, options?.recipient);
      return sendRequest<MediaMessage>({
        ...payloadBase,
        to: recipientInfo.to,
        recipient: recipientInfo.recipient,
        type: 'document',
        document: getMediaPayload(urlOrObjectId, options),
        context: options?.context,
      });
    },

    sendAudio: (to, urlOrObjectId, options) => {
      const recipientInfo = resolveRecipient(to, options?.recipient);
      return sendRequest<MediaMessage>({
        ...payloadBase,
        to: recipientInfo.to,
        recipient: recipientInfo.recipient,
        type: 'audio',
        audio: getMediaPayload(urlOrObjectId),
        context: options?.context,
      });
    },

    sendVideo: (to, urlOrObjectId, options) => {
      const recipientInfo = resolveRecipient(to, options?.recipient);
      return sendRequest<MediaMessage>({
        ...payloadBase,
        to: recipientInfo.to,
        recipient: recipientInfo.recipient,
        type: 'video',
        video: getMediaPayload(urlOrObjectId, options),
        context: options?.context,
      });
    },

    sendSticker: (to, urlOrObjectId, options) => {
      const recipientInfo = resolveRecipient(to, options?.recipient);
      return sendRequest<MediaMessage>({
        ...payloadBase,
        to: recipientInfo.to,
        recipient: recipientInfo.recipient,
        type: 'sticker',
        sticker: getMediaPayload(urlOrObjectId),
        context: options?.context,
      });
    },

    sendLocation: (to, latitude, longitude, options) => {
      const recipientInfo = resolveRecipient(to, options?.recipient);
      return sendRequest<LocationMessage>({
        ...payloadBase,
        to: recipientInfo.to,
        recipient: recipientInfo.recipient,
        type: 'location',
        location: {
          latitude,
          longitude,
          name: options?.name,
          address: options?.address,
        },
        context: options?.context,
      });
    },

    sendTemplate: (to, name, languageCode, components, options) => {
      const recipientInfo = resolveRecipient(to, options?.recipient);
      return sendRequest<TemplateMessage>({
        ...payloadBase,
        to: recipientInfo.to,
        recipient: recipientInfo.recipient,
        type: 'template',
        template: {
          name,
          language: { code: languageCode },
          components,
        },
        context: options?.context,
      });
    },

    sendContacts: (to, contacts, options) => {
      const recipientInfo = resolveRecipient(to, options?.recipient);
      return sendRequest<ContactMessage>({
        ...payloadBase,
        to: recipientInfo.to,
        recipient: recipientInfo.recipient,
        type: 'contacts',
        contacts,
        context: options?.context,
      });
    },

    sendReplyButtons: (to, bodyText, buttons, options) => {
      const recipientInfo = resolveRecipient(to, options?.recipient);
      return sendRequest<InteractiveMessage>({
        ...payloadBase,
        to: recipientInfo.to,
        recipient: recipientInfo.recipient,
        type: 'interactive',
        interactive: {
          body: { text: bodyText },
          ...(options?.footerText
            ? { footer: { text: options.footerText } }
            : {}),
          header: options?.header,
          type: 'button',
          action: {
            buttons: Object.keys(buttons).map((id) => ({
              type: 'reply',
              reply: { id, title: buttons[id] },
            })),
          },
        },
        context: options?.context,
      });
    },

    sendList: (to, buttonName, bodyText, sections, options) => {
      const recipientInfo = resolveRecipient(to, options?.recipient);
      return sendRequest<InteractiveMessage>({
        ...payloadBase,
        to: recipientInfo.to,
        recipient: recipientInfo.recipient,
        type: 'interactive',
        interactive: {
          body: { text: bodyText },
          ...(options?.footerText
            ? { footer: { text: options.footerText } }
            : {}),
          header: options?.header,
          type: 'list',
          action: {
            button: buttonName,
            sections: Object.keys(sections).map((title) => ({
              title,
              rows: sections[title].map((row) => ({
                id: row.id,
                title: row.title,
                description: row.description,
              })),
            })),
          },
        },
        context: options?.context,
      });
    },

    sendCTAUrl: (to, bodyText, display_text, url, options) => {
      const recipientInfo = resolveRecipient(to, options?.recipient);
      return sendRequest<InteractiveMessage>({
        ...payloadBase,
        to: recipientInfo.to,
        recipient: recipientInfo.recipient,
        type: 'interactive',
        interactive: {
          body: { text: bodyText },
          ...(options?.footerText
            ? { footer: { text: options.footerText } }
            : {}),
          header: options?.header,
          type: 'cta_url',
          action: {
            name: 'cta_url',
            parameters: { display_text, url },
          },
        },
        context: options?.context,
      });
    },

    sendFlow: (to, flowIdOrName, ctaText, options) => {
      const recipientInfo = resolveRecipient(to, options?.recipient);
      return sendRequest<FlowMessage>({
        ...payloadBase,
        to: recipientInfo.to,
        recipient: recipientInfo.recipient,
        type: 'interactive',
        context: options?.context,
        interactive: {
          body: {
            text: options.body,
          },
          ...(options?.footer
            ? {
              footer: { text: options.footer },
            }
            : {}),
          header: options?.header,
          type: 'flow',
          action: {
            name: 'flow',
            parameters: {
              flow_message_version: '3',
              ...getFlowIdentifier(flowIdOrName),
              flow_cta: ctaText,
              mode: options?.mode,
              flow_token: options?.flowToken,
              flow_action: options?.flowAction,
              flow_action_payload: options?.flowActionPayload,
            },
          },
        },
      });
    },
    markAsRead: (message_id, status, typing_indicator) => sendRequest<MarkAsRead>({
      ...payloadBase,
      status,
      message_id,
      typing_indicator,
    }),
    uploadMedia: async (filePathInput, mimeType, filename) => {
      let filePath: string | undefined;
      let fileBuffer: Buffer | undefined;
      let fileName: string = filename || 'file';

      // Handle different input types
      if (typeof filePathInput === 'string') {
        filePath = filePathInput;
        fileName = path.basename(filePath);
      } else if (filePathInput instanceof URL) {
        filePath = fileURLToPath(filePathInput);
        fileName = path.basename(filePath);
      } else if (Buffer.isBuffer(filePathInput)) {
        // Handle Buffer input directly
        fileBuffer = filePathInput;
        fileName = fileName !== 'file' ? fileName : 'buffer-file';
      } else {
        throw new Error(
          'Invalid file input type. Expected string path, URL, or Buffer.',
        );
      }

      // Auto-detect MIME type if not provided (only works for file paths)
      let detectedMimeType = mimeType;
      if (!detectedMimeType && filePath) {
        detectedMimeType = mime.lookup(filePath) || undefined;
      }

      if (!detectedMimeType) {
        throw new Error(
          `Could not determine MIME type for file${
            filePath ? `: ${filePath}` : ''
          }. Please provide mimeType explicitly.`,
        );
      }

      const formData = new FormData();
      formData.append('messaging_product', 'whatsapp');

      if (fileBuffer) {
        // Append buffer directly
        formData.append('file', fileBuffer, {
          contentType: detectedMimeType,
          filename: fileName,
        });
      } else if (filePath) {
        // Append file stream
        formData.append('file', fs.createReadStream(filePath), {
          contentType: detectedMimeType,
          filename: fileName,
        });
      }

      return uploadMediaRequest(formData);
    },
  };
};
