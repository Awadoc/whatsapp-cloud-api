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

interface PaylodBase {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
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

    sendText: (to, text, options) => sendRequest<TextMessage>({
      ...payloadBase,
      to,
      type: 'text',
      text: {
        body: text,
        preview_url: options?.preview_url,
      },
      context: options?.context,
    }),
    sendMessage(to, text, options) {
      return this.sendText(to, text, options);
    },
    sendImage: (to, urlOrObjectId, options) => sendRequest<MediaMessage>({
      ...payloadBase,
      to,
      type: 'image',
      image: getMediaPayload(urlOrObjectId, options),
      context: options?.context,
    }),
    sendDocument: (to, urlOrObjectId, options) => sendRequest<MediaMessage>({
      ...payloadBase,
      to,
      type: 'document',
      document: getMediaPayload(urlOrObjectId, options),
      context: options?.context,
    }),
    sendAudio: (to, urlOrObjectId, options) => sendRequest<MediaMessage>({
      ...payloadBase,
      to,
      type: 'audio',
      audio: getMediaPayload(urlOrObjectId),
      context: options?.context,
    }),
    sendVideo: (to, urlOrObjectId, options) => sendRequest<MediaMessage>({
      ...payloadBase,
      to,
      type: 'video',
      video: getMediaPayload(urlOrObjectId, options),

      context: options?.context,
    }),
    sendSticker: (to, urlOrObjectId, options) => sendRequest<MediaMessage>({
      ...payloadBase,
      to,
      type: 'sticker',
      sticker: getMediaPayload(urlOrObjectId),
      context: options?.context,
    }),
    sendLocation: (to, latitude, longitude, options) => sendRequest<LocationMessage>({
      ...payloadBase,
      to,
      type: 'location',
      location: {
        latitude,
        longitude,
        name: options?.name,
        address: options?.address,
      },
      context: options?.context,
    }),
    sendTemplate: (to, name, languageCode, components, options) => sendRequest<TemplateMessage>({
      ...payloadBase,
      to,
      type: 'template',
      template: {
        name,
        language: {
          code: languageCode,
        },
        components,
      },
      context: options?.context,
    }),
    sendContacts: (to, contacts, options) => sendRequest<ContactMessage>({
      ...payloadBase,
      to,
      type: 'contacts',
      contacts,
      context: options?.context,
    }),
    sendReplyButtons: (to, bodyText, buttons, options) => sendRequest<InteractiveMessage>({
      ...payloadBase,
      to,
      type: 'interactive',
      context: options?.context,
      interactive: {
        body: {
          text: bodyText,
        },
        ...(options?.footerText
          ? {
            footer: { text: options?.footerText },
          }
          : {}),
        header: options?.header,
        type: 'button',
        action: {
          buttons: Object.entries(buttons).map(([key, value]) => ({
            type: 'reply',
            reply: {
              title: value,
              id: key,
            },
          })),
        },
      },
    }),
    sendList: (to, buttonName, bodyText, sections, options) => sendRequest<InteractiveMessage>({
      ...payloadBase,
      to,
      type: 'interactive',
      context: options?.context,
      interactive: {
        body: {
          text: bodyText,
        },
        ...(options?.footerText
          ? {
            footer: { text: options?.footerText },
          }
          : {}),
        header: options?.header,
        type: 'list',
        action: {
          button: buttonName,
          sections: Object.entries(sections).map(([key, value]) => ({
            title: key,
            rows: value,
          })),
        },
      },
    }),
    sendCTAUrl: (to, bodyText, display_text, url, options) => sendRequest<InteractiveMessage>({
      ...payloadBase,
      to,
      type: 'interactive',
      context: options?.context,
      interactive: {
        body: {
          text: bodyText,
        },
        ...(options?.footerText
          ? {
            footer: { text: options?.footerText },
          }
          : {}),
        header: options?.header,
        type: 'cta_url',
        action: {
          name: 'cta_url',
          parameters: {
            display_text,
            url,
          },
        },
      },
    }),
    sendFlow: (to, flowIdOrName, ctaText, options) => sendRequest<FlowMessage>({
      ...payloadBase,
      to,
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
    }),
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
