import axios, { AxiosError, AxiosInstance } from 'axios';
import * as http from 'http';
import * as https from 'https';
import {
  ApiPathResponseMap,
  OfficialSendMessageResult,
  OfficialUploadMediaResult,
} from './sendRequestHelper.types';
import { DebugLogger } from './utils/logger';

// https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages

// Base client without path-specific baseURL
const getBaseAxiosClient = (
  fromPhoneNumberId: string,
  accessToken: string,
  version: string = 'v20.0',
): AxiosInstance => {
  const client = axios.create({
    baseURL: `https://graph.facebook.com/${version}/${fromPhoneNumberId}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    // Force IPv4 to avoid EAI_AGAIN/ETIMEDOUT issues
    httpAgent: new http.Agent({ family: 4 }),
    httpsAgent: new https.Agent({ family: 4 }),
  });

  client.interceptors.request.use((config) => {
    DebugLogger.logOutgoingRequest(config);
    return config;
  });

  client.interceptors.response.use(
    (response) => {
      DebugLogger.logResponse(response);
      return response;
    },
    (error) => {
      DebugLogger.logError(error);
      return Promise.reject(error);
    },
  );

  return client;
};

// Client for messages endpoint
export const getMessagesAxiosClient = (
  fromPhoneNumberId: string,
  accessToken: string,
  version: string = 'v20.0',
): AxiosInstance => {
  const client = getBaseAxiosClient(fromPhoneNumberId, accessToken, version);
  client.defaults.baseURL = `${client.defaults.baseURL}/messages`;
  return client;
};

// Client for media endpoint
export const getMediaAxiosClient = (
  fromPhoneNumberId: string,
  accessToken: string,
  version: string = 'v20.0',
): AxiosInstance => {
  const client = getBaseAxiosClient(fromPhoneNumberId, accessToken, version);
  client.defaults.baseURL = `${client.defaults.baseURL}/media`;
  // For media uploads, we need multipart/form-data
  client.defaults.headers['Content-Type'] = 'multipart/form-data';
  return client;
};

/// a function getAxiosClient that get the right client based on the path
export const getAxiosClient = (
  fromPhoneNumberId: string,
  accessToken: string,
  version: string = 'v20.0',
  path: keyof ApiPathResponseMap = 'messages',
): AxiosInstance => {
  if (path === 'messages') {
    return getMessagesAxiosClient(fromPhoneNumberId, accessToken, version);
  }
  if (path === 'media') {
    return getMediaAxiosClient(fromPhoneNumberId, accessToken, version);
  }
  throw new Error(`Unknown path: ${path}`);
};

// Transform official API response to user-facing format
const transformResponse = <K extends keyof ApiPathResponseMap>(
  path: K,
  data: unknown,
): ApiPathResponseMap[K]['transformed'] => {
  if (path === 'messages') {
    const result = data as OfficialSendMessageResult;
    return {
      messageId: result?.messages?.[0]?.id,
      phoneNumber: result?.contacts?.[0]?.input,
      whatsappId: result?.contacts?.[0]?.wa_id,
      success: result?.success,
    };
  }
  if (path === 'media') {
    const result = data as OfficialUploadMediaResult;
    return {
      id: result.id,
    };
  }

  throw new Error(`Unknown path: ${path}`);
};

export const sendRequestHelper = <K extends keyof ApiPathResponseMap>(axiosClient: AxiosInstance, path: K) => async <T>(data: T): Promise<ApiPathResponseMap[K]['transformed']> => {
  try {
    const { data: rawResult } = await axiosClient.post('/', data);
    return transformResponse(path, rawResult);
  } catch (err: unknown) {
    if ((err as any).response) {
      throw (err as AxiosError)?.response?.data;
    }
    if (err instanceof Error) {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw err;
    }
    throw err;
  }
};
