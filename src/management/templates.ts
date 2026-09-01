import { AxiosInstance } from 'axios';
import { graphRequest } from '../sendRequestHelper';
import { TemplateComponent } from '../messages.types';

/**
 * Message-template management for a WhatsApp Business Account (WABA).
 *
 * Templates belong to the WABA, not to a phone number, so every call here needs the
 * `wabaId` you pass to `createBot(phoneId, token, { wabaId })`. Sending an approved
 * template is `bot.sendTemplate(...)` — this API is for creating, listing and
 * deleting the templates themselves.
 */

export type TemplateCategory = 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
export type TemplateStatus =
  | 'APPROVED' | 'PENDING' | 'REJECTED' | 'PAUSED' | 'DISABLED' | 'IN_APPEAL';

export interface MessageTemplateSummary {
  id: string;
  name: string;
  language: string;
  status: TemplateStatus;
  category: TemplateCategory;
  components?: unknown[];
}

export interface CreateTemplateInput {
  name: string;
  language: string;
  category: TemplateCategory;
  /**
   * Raw component definitions as documented by Meta (BODY / HEADER / BUTTONS / FOOTER).
   * Button types include `REQUEST_CONTACT_INFO` (Meta 2026) for asking a user to
   * share their phone number.
   */
  components: Record<string, unknown>[];
  /** Only for AUTHENTICATION templates. */
  message_send_ttl_seconds?: number;
}

export interface TemplatesApi {
  /** List templates on the WABA. Paginate with the returned `after` cursor. */
  list(params?: {
    limit?: number;
    after?: string;
    status?: TemplateStatus;
    name?: string;
  }): Promise<{ data: MessageTemplateSummary[]; after?: string }>;
  /** Fetch one template by its Meta id. */
  get(templateId: string, fields?: string[]): Promise<MessageTemplateSummary>;
  /** Create (submit for approval) a new template. */
  create(input: CreateTemplateInput): Promise<{
    id: string;
    status: TemplateStatus;
    category: TemplateCategory;
  }>;
  /** Edit an unapproved / approved template's components. */
  update(
    templateId: string,
    components: Record<string, unknown>[],
  ): Promise<{ success: boolean }>;
  /** Delete by name (removes every language) or by name + id (one language). */
  delete(params: { name: string; hsmId?: string }): Promise<{ success: boolean }>;
  /** The WABA's template namespace (needed by some send paths). */
  namespace(): Promise<string>;
}

/**
 * Build the `components` array for an AUTHENTICATION (OTP) template send.
 *
 * Meta requires the code in the body **and** on the URL/copy-code button — passing
 * only the body fails with a `132000` parameter-count mismatch.
 */
export const authTemplateComponents = (
  otpCode: string,
  buttonIndex: string = '0',
): TemplateComponent[] => [
  { type: 'body', parameters: [{ type: 'text', text: otpCode }] } as TemplateComponent,
  {
    type: 'button',
    sub_type: 'url',
    index: buttonIndex as never,
    parameters: [{ type: 'text', text: otpCode } as never],
  } as TemplateComponent,
];

export const createTemplatesApi = (
  client: AxiosInstance,
  wabaId: string | undefined,
): TemplatesApi => {
  const requireWaba = (): string => {
    if (!wabaId) {
      throw new Error(
        'Template management requires a WABA id: createBot(phoneId, token, { wabaId }).',
      );
    }
    return wabaId;
  };

  return {
    list: async (params) => {
      const data = await graphRequest<{
        data: MessageTemplateSummary[];
        paging?: { cursors?: { after?: string } };
      }>(() => client.get(`/${requireWaba()}/message_templates`, {
        params: {
          ...(params?.limit ? { limit: params.limit } : {}),
          ...(params?.after ? { after: params.after } : {}),
          ...(params?.status ? { status: params.status } : {}),
          ...(params?.name ? { name: params.name } : {}),
        },
      }));
      return { data: data.data, after: data.paging?.cursors?.after };
    },

    get: (templateId, fields) => graphRequest<MessageTemplateSummary>(() => client.get(`/${templateId}`, {
      ...(fields?.length ? { params: { fields: fields.join(',') } } : {}),
    })),

    create: (input) => graphRequest(() => client.post(`/${requireWaba()}/message_templates`, {
      name: input.name,
      language: input.language,
      category: input.category,
      components: input.components,
      ...(input.message_send_ttl_seconds
        ? { message_send_ttl_seconds: input.message_send_ttl_seconds }
        : {}),
    })),

    update: (templateId, components) => graphRequest<{ success: boolean }>(
      () => client.post(`/${templateId}`, { components }),
    ),

    delete: (params) => graphRequest<{ success: boolean }>(() => client.delete(`/${requireWaba()}/message_templates`, {
      params: {
        name: params.name,
        ...(params.hsmId ? { hsm_id: params.hsmId } : {}),
      },
    })),

    namespace: async () => {
      const data = await graphRequest<{ message_template_namespace: string }>(
        () => client.get(`/${requireWaba()}`, {
          params: { fields: 'message_template_namespace' },
        }),
      );
      return data.message_template_namespace;
    },
  };
};
