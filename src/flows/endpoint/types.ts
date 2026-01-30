/**
 * Types for WhatsApp Flows data exchange endpoint
 */
import type { FlowRequestAction, DecryptedFlowRequest } from '../crypto/types';

/**
 * Flow request object passed to the handler
 */
export interface FlowRequest {
  /** API version (e.g., "3.0") */
  readonly version: string;
  /** Action type that triggered the request */
  readonly action: FlowRequestAction;
  /** Current screen ID (may be undefined for INIT/BACK) */
  readonly screen?: string;
  /** Form data submitted by the user */
  readonly data: Record<string, unknown>;
  /** Flow token for session identification */
  readonly flowToken: string;
  /** Flow token signature (for flows version >= 7.3) */
  readonly flowTokenSignature?: string;

  /**
   * Create a response builder for this request
   *
   * Note: Data exchange responses are server-directed and not bound by the
   * flow's routing_model. You can return any valid screen from your endpoint.
   *
   * @example
   * ```typescript
   * // Navigate to a screen
   * return req.respond().goToScreen('NEXT_SCREEN', { data: 'value' });
   *
   * // Complete the flow
   * return req.respond().close({ result: 'success' });
   *
   * // Show validation error (stay on current screen)
   * // Note: req.screen is undefined for INIT/BACK actions
   * if (req.screen) {
   *   return req.respond().goToScreen(req.screen, req.data).withError('Invalid input');
   * }
   * ```
   */
  respond(): FlowResponseBuilder;
}

/**
 * Response builder for constructing flow responses
 */
export class FlowResponseBuilder {
  private responseData: {
    screen: string;
    data: Record<string, unknown>;
  } = { screen: '', data: {} };

  constructor(private readonly flowToken: string) {}

  /**
   * Navigate to a screen with optional data
   *
   * @param screenId - Target screen ID
   * @param data - Data to pass to the screen
   * @returns This builder for chaining
   */
  goToScreen(screenId: string, data?: Record<string, unknown>): this {
    this.responseData = {
      screen: screenId,
      data: data ?? {},
    };
    return this;
  }

  /**
   * Complete the flow and close it
   *
   * @param params - Optional parameters to include in the completion message
   * @returns This builder for chaining
   */
  close(params?: Record<string, unknown>): this {
    this.responseData = {
      screen: 'SUCCESS',
      data: {
        extension_message_response: {
          params: {
            flow_token: this.flowToken,
            ...params,
          },
        },
      },
    };
    return this;
  }

  /**
   * Add an error message to display as a snackbar
   *
   * @param errorMessage - Error message to display
   * @returns This builder for chaining
   */
  withError(errorMessage: string): this {
    this.responseData.data = {
      ...this.responseData.data,
      error_message: errorMessage,
    };
    return this;
  }

  /**
   * Build the response object
   * @internal
   */
  build(): object {
    return this.responseData;
  }
}

/**
 * Handler function type for processing flow requests
 */
export type FlowRequestHandler = (
  request: FlowRequest,
) => FlowResponseBuilder | Promise<FlowResponseBuilder>;

/**
 * Error handler function type
 */
export type FlowErrorHandler = (
  error: Error,
  request?: FlowRequest,
) => void;

/**
 * Options for creating a flow endpoint
 */
export interface FlowEndpointOptions {
  /**
   * Your RSA private key in PEM format for decrypting requests
   */
  privateKey: string;

  /**
   * Optional Meta app secret for validating request signatures
   */
  appSecret?: string;

  /**
   * Handler function for processing flow requests
   */
  onRequest: FlowRequestHandler;

  /**
   * Optional error handler for logging/monitoring
   */
  onError?: FlowErrorHandler;

  /**
   * Whether to acknowledge error notification requests automatically
   * @default true
   */
  acknowledgeErrors?: boolean;
}

/**
 * Create a FlowRequest object from decrypted data
 * @internal
 */
export function createFlowRequest(decrypted: DecryptedFlowRequest): FlowRequest {
  return {
    version: decrypted.version,
    action: decrypted.action,
    screen: decrypted.screen,
    data: decrypted.data,
    flowToken: decrypted.flow_token,
    flowTokenSignature: decrypted.flow_token_signature,
    respond() {
      return new FlowResponseBuilder(this.flowToken);
    },
  };
}

/**
 * Health check response for ping requests
 */
export const HEALTH_CHECK_RESPONSE = { data: { status: 'active' } };

/**
 * Error acknowledgment response
 */
export const ERROR_ACK_RESPONSE = { data: { acknowledged: true } };
