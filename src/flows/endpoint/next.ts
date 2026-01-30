/**
 * Next.js handlers for WhatsApp Flows data exchange endpoint
 *
 * @example App Router (Next.js 13+)
 * ```typescript
 * // app/api/flow/route.ts
 * import { createFlowEndpointHandlers } from '@awadoc/whatsapp-cloud-api/flows/endpoint/next';
 *
 * export const { POST } = createFlowEndpointHandlers({
 *   privateKey: process.env.FLOW_PRIVATE_KEY!,
 *   onRequest: async (req) => {
 *     if (req.action === 'INIT') {
 *       return req.respond().goToScreen('WELCOME', { user: 'Guest' });
 *     }
 *
 *     if (req.action === 'data_exchange') {
 *       const { name, email } = req.data;
 *       return req.respond().close({ name, email });
 *     }
 *
 *     return req.respond().goToScreen('ERROR');
 *   },
 * });
 * ```
 *
 * @example Pages Router
 * ```typescript
 * // pages/api/flow.ts
 * import { createFlowEndpointPagesHandler } from '@awadoc/whatsapp-cloud-api/flows/endpoint/next';
 *
 * export default createFlowEndpointPagesHandler({
 *   privateKey: process.env.FLOW_PRIVATE_KEY!,
 *   onRequest: async (req) => {
 *     // ... same handler logic
 *   },
 * });
 * ```
 */
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import type { NextApiRequest, NextApiResponse } from 'next';
import { decryptRequest, encryptResponse, validateSignature } from '../crypto/encryption';
import type { EncryptedFlowRequest } from '../crypto/types';
import {
  createFlowRequest,
  HEALTH_CHECK_RESPONSE,
  ERROR_ACK_RESPONSE,
  type FlowEndpointOptions,
  type FlowRequest,
} from './types';

/**
 * Return type for App Router handlers
 */
export interface FlowEndpointAppHandlers {
  POST: (request: NextRequest) => Promise<NextResponse>;
}

/**
 * Return type for Pages Router handler
 */
export type FlowEndpointPagesHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
) => Promise<void>;

/**
 * Create App Router handlers for WhatsApp Flows data exchange
 *
 * @param options - Endpoint configuration options
 * @returns Object with POST handler for route.ts
 */
export function createFlowEndpointHandlers(
  options: FlowEndpointOptions,
): FlowEndpointAppHandlers {
  return {
    async POST(request: NextRequest): Promise<NextResponse> {
      let flowRequest: FlowRequest | undefined;

      try {
        const body = (await request.json()) as EncryptedFlowRequest;

        // Validate signature if app secret is provided
        if (options.appSecret) {
          const signature = request.headers.get('x-hub-signature-256');
          const rawBody = JSON.stringify(body);

          if (!signature || !validateSignature(rawBody, signature, options.appSecret)) {
            return new NextResponse('Invalid signature', { status: 401 });
          }
        }

        // Decrypt the request
        let decryptionResult;
        try {
          decryptionResult = decryptRequest(body, options.privateKey);
        } catch {
          return new NextResponse('Decryption failed', { status: 421 });
        }

        const { decryptedData, aesKey, iv } = decryptionResult;

        // Handle health check (ping)
        if (decryptedData.action === 'ping') {
          const encrypted = encryptResponse(HEALTH_CHECK_RESPONSE, aesKey, iv);
          return new NextResponse(encrypted, {
            headers: { 'Content-Type': 'text/plain' },
          });
        }

        // Create FlowRequest object
        flowRequest = createFlowRequest(decryptedData);

        // Handle error notification
        if (flowRequest.data.error && (options.acknowledgeErrors !== false)) {
          const encrypted = encryptResponse(ERROR_ACK_RESPONSE, aesKey, iv);
          return new NextResponse(encrypted, {
            headers: { 'Content-Type': 'text/plain' },
          });
        }

        // Call user's handler
        const responseBuilder = await options.onRequest(flowRequest);
        const responseData = responseBuilder.build();

        // Encrypt and send response
        const encryptedResponse = encryptResponse(responseData, aesKey, iv);
        return new NextResponse(encryptedResponse, {
          headers: { 'Content-Type': 'text/plain' },
        });
      } catch (error) {
        options.onError?.(error as Error, flowRequest);
        return new NextResponse('Internal server error', { status: 500 });
      }
    },
  };
}

/**
 * Create Pages Router handler for WhatsApp Flows data exchange
 *
 * @param options - Endpoint configuration options
 * @returns Handler function for pages/api route
 */
export function createFlowEndpointPagesHandler(
  options: FlowEndpointOptions,
): FlowEndpointPagesHandler {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    // Only accept POST requests
    if (req.method !== 'POST') {
      res.status(405).send('Method not allowed');
      return;
    }

    let flowRequest: FlowRequest | undefined;

    try {
      const body = req.body as EncryptedFlowRequest;

      // Validate signature if app secret is provided
      if (options.appSecret) {
        const signature = req.headers['x-hub-signature-256'] as string;
        const rawBody = JSON.stringify(body);

        if (!signature || !validateSignature(rawBody, signature, options.appSecret)) {
          res.status(401).send('Invalid signature');
          return;
        }
      }

      // Decrypt the request
      let decryptionResult;
      try {
        decryptionResult = decryptRequest(body, options.privateKey);
      } catch {
        res.status(421).send('Decryption failed');
        return;
      }

      const { decryptedData, aesKey, iv } = decryptionResult;

      // Handle health check (ping)
      if (decryptedData.action === 'ping') {
        const encrypted = encryptResponse(HEALTH_CHECK_RESPONSE, aesKey, iv);
        res.setHeader('Content-Type', 'text/plain');
        res.send(encrypted);
        return;
      }

      // Create FlowRequest object
      flowRequest = createFlowRequest(decryptedData);

      // Handle error notification
      if (flowRequest.data.error && (options.acknowledgeErrors !== false)) {
        const encrypted = encryptResponse(ERROR_ACK_RESPONSE, aesKey, iv);
        res.setHeader('Content-Type', 'text/plain');
        res.send(encrypted);
        return;
      }

      // Call user's handler
      const responseBuilder = await options.onRequest(flowRequest);
      const responseData = responseBuilder.build();

      // Encrypt and send response
      const encryptedResponse = encryptResponse(responseData, aesKey, iv);
      res.setHeader('Content-Type', 'text/plain');
      res.send(encryptedResponse);
    } catch (error) {
      options.onError?.(error as Error, flowRequest);
      res.status(500).send('Internal server error');
    }
  };
}

// Re-export types for convenience
export type {
  FlowEndpointOptions, FlowRequest, FlowRequestHandler, FlowErrorHandler,
} from './types';
export { FlowResponseBuilder } from './types';
