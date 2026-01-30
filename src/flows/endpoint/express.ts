/**
 * Express middleware for WhatsApp Flows data exchange endpoint
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { createFlowEndpoint } from '@awadoc/whatsapp-cloud-api/flows/endpoint/express';
 *
 * const app = express();
 *
 * app.use('/flow-endpoint', createFlowEndpoint({
 *   privateKey: process.env.FLOW_PRIVATE_KEY!,
 *   onRequest: async (req) => {
 *     if (req.action === 'INIT') {
 *       return req.respond().goToScreen('WELCOME', { user: 'Guest' });
 *     }
 *
 *     if (req.action === 'data_exchange') {
 *       // Process form data
 *       const { name, email } = req.data;
 *       return req.respond().close({ name, email });
 *     }
 *
 *     return req.respond().goToScreen('ERROR');
 *   },
 * }));
 *
 * app.listen(3000);
 * ```
 */
import express, { Router, Request, Response } from 'express';
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
 * Create an Express Router for handling WhatsApp Flows data exchange
 *
 * @param options - Endpoint configuration options
 * @returns Express Router
 */
export function createFlowEndpoint(options: FlowEndpointOptions): Router {
  const router = Router();

  // Use raw body parser for signature validation, then JSON parser
  router.use(express.json());

  router.post('/', async (req: Request, res: Response): Promise<void> => {
    let flowRequest: FlowRequest | undefined;

    try {
      const body = req.body as EncryptedFlowRequest;

      // Validate signature if app secret is provided
      if (options.appSecret) {
        const signature = req.headers['x-hub-signature-256'] as string;
        const rawBody = JSON.stringify(req.body);

        if (!validateSignature(rawBody, signature, options.appSecret)) {
          res.status(401).send('Invalid signature');
          return;
        }
      }

      // Decrypt the request
      let decryptionResult;
      try {
        decryptionResult = decryptRequest(body, options.privateKey);
      } catch (decryptError) {
        // Return 421 for decryption errors (tells client to re-download public key)
        res.status(421).send('Decryption failed');
        return;
      }

      const { decryptedData, aesKey, iv } = decryptionResult;

      // Handle health check (ping)
      if (decryptedData.action === 'ping') {
        const encrypted = encryptResponse(HEALTH_CHECK_RESPONSE, aesKey, iv);
        res.type('text/plain').send(encrypted);
        return;
      }

      // Create FlowRequest object
      flowRequest = createFlowRequest(decryptedData);

      // Handle error notification
      if (flowRequest.data.error && (options.acknowledgeErrors !== false)) {
        const encrypted = encryptResponse(ERROR_ACK_RESPONSE, aesKey, iv);
        res.type('text/plain').send(encrypted);
        return;
      }

      // Call user's handler
      const responseBuilder = await options.onRequest(flowRequest);
      const responseData = responseBuilder.build();

      // Encrypt and send response
      const encryptedResponse = encryptResponse(responseData, aesKey, iv);
      res.type('text/plain').send(encryptedResponse);
    } catch (error) {
      // Call error handler if provided
      options.onError?.(error as Error, flowRequest);

      // Don't expose error details to client
      res.status(500).send('Internal server error');
    }
  });

  return router;
}

// Re-export types for convenience
export type {
  FlowEndpointOptions, FlowRequest, FlowRequestHandler, FlowErrorHandler,
} from './types';
export { FlowResponseBuilder } from './types';
