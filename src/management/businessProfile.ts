import { AxiosInstance } from 'axios';
import { graphRequest } from '../sendRequestHelper';

/** Business profile shown to users in the chat "business info" panel. */
export interface BusinessProfile {
  about?: string;
  address?: string;
  description?: string;
  email?: string;
  profile_picture_url?: string;
  websites?: string[];
  vertical?: string;
}

export interface BusinessProfileApi {
  get(fields?: string[]): Promise<BusinessProfile>;
  update(profile: Partial<BusinessProfile>): Promise<{ success: boolean }>;
}

const DEFAULT_FIELDS = [
  'about', 'address', 'description', 'email',
  'profile_picture_url', 'websites', 'vertical',
];

export const createBusinessProfileApi = (
  client: AxiosInstance,
  phoneNumberId: string,
): BusinessProfileApi => ({
  get: async (fields) => {
    const data = await graphRequest<{ data: BusinessProfile[] }>(
      () => client.get(`/${phoneNumberId}/whatsapp_business_profile`, {
        params: { fields: (fields ?? DEFAULT_FIELDS).join(',') },
      }),
    );
    return data.data?.[0] ?? {};
  },

  update: (profile) => graphRequest<{ success: boolean }>(
    () => client.post(`/${phoneNumberId}/whatsapp_business_profile`, {
      messaging_product: 'whatsapp',
      ...profile,
    }),
  ),
});
