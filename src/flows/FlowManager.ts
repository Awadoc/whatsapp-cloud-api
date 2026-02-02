/**
 * FlowManager for WhatsApp Flows CRUD operations
 *
 * @example
 * ```typescript
 * import { createFlowManager } from '@awadoc/whatsapp-cloud-api/flows';
 *
 * const flows = createFlowManager(wabaId, accessToken);
 *
 * // Create a new flow
 * const { id } = await flows.create({ name: 'My Flow' });
 *
 * // Upload flow JSON
 * await flows.updateJson(id, './flow.json');
 *
 * // Publish the flow
 * await flows.publish(id);
 *
 * // Send flow to user (using bot.sendFlow)
 * await bot.sendFlow(userPhone, id, 'Start', { body: 'Click to begin' });
 * ```
 */
import axios, { AxiosInstance, AxiosError } from "axios";
import * as fs from "fs";
import FormData from "form-data";
import type {
  FlowDetails,
  FlowField,
  FlowListResult,
  CreateFlowOptions,
  CreateFlowResult,
  UpdateFlowMetadataOptions,
  UpdateFlowJsonResult,
  FlowSuccessResult,
  FlowPreview,
  FlowManagerOptions,
} from "./FlowManager.types";
import { DEFAULT_FLOW_FIELDS } from "./FlowManager.types";

/**
 * Interface for objects that can be converted to Flow JSON
 */
interface FlowJSONConvertible {
  toJSON(): object;
}

/**
 * Check if an object has a toJSON method
 */
function hasToJSON(obj: unknown): obj is FlowJSONConvertible {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "toJSON" in obj &&
    typeof (obj as FlowJSONConvertible).toJSON === "function"
  );
}

/**
 * Create a FlowManager instance for managing WhatsApp Flows
 *
 * @param wabaId - WhatsApp Business Account ID
 * @param accessToken - Meta API access token
 * @param options - Optional configuration
 * @returns FlowManager instance
 */
export function createFlowManager(
  wabaId: string,
  accessToken: string,
  options?: FlowManagerOptions,
) {
  const version = options?.version ?? "v20.0";

  const client: AxiosInstance = axios.create({
    baseURL: `https://graph.facebook.com/${version}`,
    timeout: 60000,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    // Force IPv4 to avoid EAI_AGAIN/ETIMEDOUT issues
    httpAgent: new (require("http").Agent)({ family: 4 }),
    httpsAgent: new (require("https").Agent)({ family: 4 }),
  });

  /**
   * Handle API errors consistently
   */
  const handleError = (error: unknown): never => {
    // Debug logging
    if (axios.isAxiosError(error)) {
      console.error("[FlowManager] API Request Failed:", {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        method: error.config?.method,
        baseURL: error.config?.baseURL,
        requestData: error.config?.data,
        responseStatus: error.response?.status,
        responseData: error.response?.data,
      });

      if (error.response?.data) {
        throw error.response.data;
      }
    } else {
      console.error("[FlowManager] Unknown Error:", error);
    }

    throw error;
  };

  return {
    /**
     * Create a new flow
     *
     * @param createOptions - Flow creation options
     * @returns Created flow ID
     *
     * @example
     * ```typescript
     * const { id } = await flows.create({
     *   name: 'Customer Feedback',
     *   categories: ['SURVEY'],
     * });
     * ```
     */
    async create(createOptions: CreateFlowOptions): Promise<CreateFlowResult> {
      try {
        const { data } = await client.post(`/${wabaId}/flows`, {
          name: createOptions.name,
          categories: createOptions.categories,
          clone_flow_id: createOptions.cloneFlowId,
          endpoint_uri: createOptions.endpointUri,
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    /**
     * Get flow details by ID
     *
     * @param flowId - Flow ID to fetch
     * @param fields - Fields to include in response
     * @returns Flow details
     *
     * @example
     * ```typescript
     * const flow = await flows.get(flowId);
     * console.log(flow.name, flow.status);
     * ```
     */
    async get(flowId: string, fields?: FlowField[]): Promise<FlowDetails> {
      try {
        const { data } = await client.get(`/${flowId}`, {
          params: {
            fields: (fields ?? DEFAULT_FLOW_FIELDS).join(","),
          },
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    /**
     * List all flows for the WhatsApp Business Account
     *
     * @param fields - Fields to include in response
     * @returns List of flows with pagination
     *
     * @example
     * ```typescript
     * const { data: flowList } = await flows.list();
     * flowList.forEach(flow => console.log(flow.name));
     * ```
     */
    async list(fields?: FlowField[]): Promise<FlowListResult> {
      try {
        const { data } = await client.get(`/${wabaId}/flows`, {
          params: {
            fields: (fields ?? DEFAULT_FLOW_FIELDS).join(","),
          },
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    /**
     * Update flow JSON definition (draft flows only)
     *
     * Accepts multiple input formats:
     * - FlowJSON builder instance (calls toJSON())
     * - Plain object (converted to JSON string)
     * - JSON string
     * - File path ending in .json
     *
     * @param flowId - Flow ID to update
     * @param flowJson - Flow JSON in any supported format
     * @returns Update result with validation errors if any
     *
     * @example
     * ```typescript
     * // From file
     * await flows.updateJson(flowId, './flow.json');
     *
     * // From builder
     * const flow = new FlowJSON().addScreen(screen);
     * await flows.updateJson(flowId, flow);
     *
     * // From object
     * await flows.updateJson(flowId, { version: '3.0', screens: [...] });
     * ```
     */
    async updateJson(
      flowId: string,
      flowJson: FlowJSONConvertible | object | string,
    ): Promise<UpdateFlowJsonResult> {
      try {
        let jsonString: string;

        if (typeof flowJson === "string") {
          // Check if it's a file path
          if (flowJson.endsWith(".json") && fs.existsSync(flowJson)) {
            jsonString = fs.readFileSync(flowJson, "utf-8");
          } else {
            // Assume it's a JSON string
            jsonString = flowJson;
          }
        } else if (hasToJSON(flowJson)) {
          // FlowJSON builder or similar
          jsonString = JSON.stringify(flowJson.toJSON());
        } else {
          // Plain object
          jsonString = JSON.stringify(flowJson);
        }

        const formData = new FormData();
        formData.append("file", Buffer.from(jsonString), {
          filename: "flow.json",
          contentType: "application/json",
        });
        formData.append("name", "flow.json");
        formData.append("asset_type", "FLOW_JSON");

        const { data } = await client.post(`/${flowId}/assets`, formData, {
          headers: {
            ...formData.getHeaders(),
          },
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    /**
     * Update flow metadata
     *
     * @param flowId - Flow ID to update
     * @param updateOptions - Metadata to update
     * @returns Success result
     *
     * @example
     * ```typescript
     * await flows.updateMetadata(flowId, {
     *   name: 'Updated Flow Name',
     *   categories: ['CUSTOMER_SUPPORT'],
     *   endpointUri: 'https://my-server.com/flow',
     * });
     * ```
     */
    async updateMetadata(
      flowId: string,
      updateOptions: UpdateFlowMetadataOptions,
    ): Promise<FlowSuccessResult> {
      try {
        const { data } = await client.post(`/${flowId}`, {
          name: updateOptions.name,
          categories: updateOptions.categories,
          endpoint_uri: updateOptions.endpointUri,
          application_id: updateOptions.applicationId,
        });
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    /**
     * Publish a flow (irreversible)
     *
     * Once published, a flow cannot be edited. To make changes,
     * you must create a new flow or use a draft version.
     *
     * @param flowId - Flow ID to publish
     * @returns Success result
     *
     * @example
     * ```typescript
     * await flows.publish(flowId);
     * // Flow is now live and cannot be edited
     * ```
     */
    async publish(flowId: string): Promise<FlowSuccessResult> {
      try {
        const { data } = await client.post(`/${flowId}/publish`);
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    /**
     * Deprecate a published flow
     *
     * Deprecated flows cannot be sent to new users but existing
     * conversations using the flow will continue to work.
     *
     * @param flowId - Flow ID to deprecate
     * @returns Success result
     */
    async deprecate(flowId: string): Promise<FlowSuccessResult> {
      try {
        const { data } = await client.post(`/${flowId}/deprecate`);
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    /**
     * Delete a draft flow
     *
     * Only draft flows can be deleted. Published flows must be
     * deprecated first.
     *
     * @param flowId - Flow ID to delete
     * @returns Success result
     */
    async delete(flowId: string): Promise<FlowSuccessResult> {
      try {
        const { data } = await client.delete(`/${flowId}`);
        return data;
      } catch (error) {
        return handleError(error);
      }
    },

    /**
     * Get flow preview URL
     *
     * @param flowId - Flow ID to preview
     * @returns Preview URL and expiration time
     *
     * @example
     * ```typescript
     * const { preview_url, expires_at } = await flows.getPreview(flowId);
     * console.log(`Preview: ${preview_url} (expires ${expires_at})`);
     * ```
     */
    async getPreview(flowId: string): Promise<FlowPreview> {
      try {
        const { data } = await client.get(`/${flowId}`, {
          params: { fields: "preview" },
        });
        return data.preview;
      } catch (error) {
        return handleError(error);
      }
    },

    /**
     * Upload/register business public key for flow encryption
     *
     * This key is used by WhatsApp to encrypt data exchange requests.
     * You must keep the corresponding private key secure.
     *
     * @param publicKey - RSA public key in PEM format
     * @returns Success result
     *
     * @example
     * ```typescript
     * import { generateKeyPair } from '@awadoc/whatsapp-cloud-api/flows';
     *
     * const { privateKey, publicKey } = generateKeyPair();
     *
     * // Store privateKey securely (e.g., environment variable)
     * await flows.setBusinessPublicKey(publicKey);
     * ```
     */
    async setBusinessPublicKey(publicKey: string): Promise<FlowSuccessResult> {
      try {
        const { data } = await client.post(
          `/${wabaId}/whatsapp_business_encryption`,
          {
            business_public_key: publicKey,
          },
        );
        return data;
      } catch (error) {
        return handleError(error);
      }
    },
  };
}

/**
 * Type for the FlowManager instance
 */
export type FlowManager = ReturnType<typeof createFlowManager>;
