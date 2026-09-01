import { AxiosInstance } from 'axios';
import { graphRequest } from '../sendRequestHelper';

/**
 * Business username management (Meta 2026).
 *
 * A business username is mapped 1:1 to a business phone number. Adopting one does
 * NOT hide your phone number in the app. All calls here act on the phone number id
 * you passed to `createBot`.
 */

export type UsernameStatus = 'approved' | 'reserved';

export interface UsernameApi {
  /** Current username + status, or `{ status }` only if none is set. */
  get(): Promise<{ username?: string; status?: UsernameStatus }>;
  /**
   * Adopt or change the business username.
   * @param transferAction `force_transfer` moves the username off another of your
   *        phone numbers in the same portfolio (error `147005` otherwise).
   */
  set(
    username: string,
    transferAction?: 'none' | 'force_transfer',
  ): Promise<{ status: UsernameStatus }>;
  /** Delete the business username. */
  remove(): Promise<{ success: boolean }>;
  /** Usernames Meta has reserved for your portfolio (higher approval chance). */
  suggestions(): Promise<string[]>;
}

export const createUsernameApi = (
  client: AxiosInstance,
  phoneNumberId: string,
): UsernameApi => ({
  get: () => graphRequest(() => client.get(`/${phoneNumberId}/username`)),

  set: (username, transferAction) => graphRequest(() => client.post(`/${phoneNumberId}/username`, {
    username,
    ...(transferAction ? { transfer_action: transferAction } : {}),
  })),

  remove: () => graphRequest<{ success: boolean }>(
    () => client.delete(`/${phoneNumberId}/username`),
  ),

  suggestions: async () => {
    const data = await graphRequest<{
      data?: { username_suggestions?: string[] }[];
    }>(() => client.get(`/${phoneNumberId}/username_suggestions`));
    return data.data?.[0]?.username_suggestions ?? [];
  },
});
