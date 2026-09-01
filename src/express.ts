/**
 * Express webhook handler for WhatsApp Cloud API
 *
 * @example
 * ```typescript
 * import express from 'express';
 * import { createBot } from '@awadoc/whatsapp-cloud-api';
 * import { getExpressRoute } from '@awadoc/whatsapp-cloud-api/express';
 *
 * const phoneId = process.env.PHONE_ID!;
 * const bot = createBot(phoneId, process.env.TOKEN!);
 *
 * const app = express();
 * app.use('/webhook', getExpressRoute(phoneId, {
 *   webhookVerifyToken: process.env.VERIFY_TOKEN,
 *   appSecret: process.env.APP_SECRET, // enables X-Hub-Signature-256 verification
 * }));
 *
 * bot.on('message', (msg) => console.log(msg));
 * bot.on('status', (s) => console.log(s.data.status)); // sent | delivered | read | failed
 * app.listen(3000);
 * ```
 */
import express, { Router, Request, Response } from 'express';
import {
  WebhookOptions,
  verifyWebhookChallenge,
  handleWebhookPost,
} from './webhook';

export interface ExpressServerOptions extends WebhookOptions {
  useMiddleware?: (app: Router) => void;
}

/**
 * Creates an Express Router configured to handle WhatsApp webhooks.
 */
export const getExpressRoute = (
  fromPhoneNumberId: string,
  options?: ExpressServerOptions,
): Router => {
  const router = Router();

  // Capture the raw body so we can verify X-Hub-Signature-256 against the exact bytes.
  router.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
      },
    }),
  );

  if (options?.useMiddleware) {
    options.useMiddleware(router);
  }

  // GET - Webhook verification handshake
  router.get('/', (req: Request, res: Response): void => {
    const { status, body } = verifyWebhookChallenge(
      req.query as Record<string, string | string[] | undefined>,
      options?.webhookVerifyToken,
    );
    if (status === 200) {
      // eslint-disable-next-line no-console
      console.log('✔️ Webhook verified');
      res.setHeader('content-type', 'text/plain');
      res.send(body);
      return;
    }
    res.status(status).send(body);
  });

  // POST - incoming messages, statuses and change notifications
  router.post('/', (req: Request, res: Response): void => {
    const { status } = handleWebhookPost(
      req.body,
      fromPhoneNumberId,
      options,
      (req as Request & { rawBody?: Buffer }).rawBody,
      req.header('x-hub-signature-256'),
    );
    res.sendStatus(status);
  });

  return router;
};

// Re-export Express types for convenience
export type { Router, Request, Response } from 'express';
