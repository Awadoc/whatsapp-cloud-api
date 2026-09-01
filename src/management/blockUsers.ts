import { AxiosInstance } from 'axios';
import { graphRequest } from '../sendRequestHelper';
import { RecipientTarget, isRecipientTarget } from '../recipient';

/**
 * Block Users API (Meta 2026). Accepts a phone number string, a `Phone(...)` or a
 * `UserId(...)` target. Parent BSUIDs are NOT supported for blocking.
 */

export interface BlockedUser {
  wa_id?: string;
  user_id?: string;
  parent_user_id?: string;
}

export interface BlockUsersApi {
  block(
    users: Array<string | RecipientTarget>,
  ): Promise<{ addedCount: number; failed: unknown[] }>;
  unblock(
    users: Array<string | RecipientTarget>,
  ): Promise<{ removedCount: number; failed: unknown[] }>;
  list(
    params?: { limit?: number; after?: string },
  ): Promise<{ data: BlockedUser[]; after?: string }>;
}

const toEntry = (u: string | RecipientTarget): Record<string, string> => {
  if (isRecipientTarget(u)) {
    return u.kind === 'user_id' ? { user_id: u.value } : { user: u.value };
  }
  return { user: u };
};

export const createBlockUsersApi = (
  client: AxiosInstance,
  phoneNumberId: string,
): BlockUsersApi => ({
  block: async (users) => {
    const data = await graphRequest<{
      block_users?: { added_users?: unknown[]; failed_users?: unknown[] };
    }>(() => client.post(`/${phoneNumberId}/block_users`, {
      messaging_product: 'whatsapp',
      block_users: users.map(toEntry),
    }));
    return {
      addedCount: data.block_users?.added_users?.length ?? 0,
      failed: data.block_users?.failed_users ?? [],
    };
  },

  unblock: async (users) => {
    const data = await graphRequest<{
      block_users?: { removed_users?: unknown[]; failed_users?: unknown[] };
    }>(() => client.delete(`/${phoneNumberId}/block_users`, {
      data: {
        messaging_product: 'whatsapp',
        block_users: users.map(toEntry),
      },
    }));
    return {
      removedCount: data.block_users?.removed_users?.length ?? 0,
      failed: data.block_users?.failed_users ?? [],
    };
  },

  list: async (params) => {
    const data = await graphRequest<{
      data: BlockedUser[];
      paging?: { cursors?: { after?: string } };
    }>(() => client.get(`/${phoneNumberId}/block_users`, {
      params: {
        ...(params?.limit ? { limit: params.limit } : {}),
        ...(params?.after ? { after: params.after } : {}),
      },
    }));
    return { data: data.data, after: data.paging?.cursors?.after };
  },
});
