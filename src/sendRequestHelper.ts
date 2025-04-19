import axios, { AxiosError, AxiosInstance } from 'axios';

// https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages
interface OfficialSendMessageResult {
  success:true
  messaging_product: 'whatsapp';
  contacts: {
    input: string;
    wa_id: string;
  }[];
  messages: {
    id: string;
  }[];
}

export interface SendMessageResult {
  messageId: string;
  phoneNumber: string;
  whatsappId: string;
  success?: boolean;
}

export const getAxiosClient = (
  fromPhoneNumberId: string,
  accessToken: string,
  version: string = 'v20.0',
) : AxiosInstance => axios.create({
  baseURL: `https://graph.facebook.com/${version}/${fromPhoneNumberId}/messages`,
  headers: {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

export const sendRequestHelper = (
  axiosClient: AxiosInstance,
) => async <T>(data: T): Promise<SendMessageResult> => {
  try {
    const { data: rawResult } = await axiosClient.post('/', data);
    const result = rawResult as OfficialSendMessageResult;

    return {
      messageId: result?.messages?.[0]?.id,
      phoneNumber: result?.contacts?.[0]?.input,
      whatsappId: result?.contacts?.[0]?.wa_id,
      success: result?.success,
    };
  } catch (err: unknown) {
    if ((err as any).response) {
      throw (err as AxiosError)?.response?.data;
    // } else if ((err as any).request) {
    //   throw (err as AxiosError)?.request;
    } else if (err instanceof Error) {
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw (err as Error).message;
    } else {
      throw err;
    }
  }
};
