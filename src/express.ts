/**
 * Express webhook handlers for WhatsApp Cloud API
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
 * app.use('/webhook', getExpressRoute(phoneId, { webhookVerifyToken: 'secret' }));
 *
 * bot.on('message', (msg) => console.log(msg));
 * app.listen(3000);
 * ```
 */
import express, { Router, Request, Response } from 'express';
import PubSub from 'pubsub-js';
import { FreeFormObject } from './utils/misc';
import { PubSubEvent, PubSubEvents } from './utils/pubSub';
import { Message } from './createBot.types';

// ============================================================================
// Types
// ============================================================================

export interface ExpressServerOptions {
  useMiddleware?: (app: Router) => void;
  webhookVerifyToken?: string;
}

// ============================================================================
// Express Route Handler
// ============================================================================

/**
 * Creates an Express Router configured to handle WhatsApp webhooks.
 *
 * @param fromPhoneNumberId - Your WhatsApp Business phone number ID
 * @param options - Server configuration options
 * @returns Express Router
 */
export const getExpressRoute = (
  fromPhoneNumberId: string,
  options?: ExpressServerOptions,
): Router => {
  const router = Router();
  router.use(express.json());

  if (options?.useMiddleware) {
    options.useMiddleware(router);
  }

  // GET - Webhook verification
  if (options?.webhookVerifyToken) {
    router.get('/', (req: Request, res: Response): void => {
      if (!req.query) {
        res.sendStatus(403);
        return;
      }

      const mode = req.query['hub.mode'] as string | undefined;
      const verifyToken = req.query['hub.verify_token'] as string | undefined;
      const challenge = req.query['hub.challenge'] as string | undefined;

      if (!mode || !verifyToken || !challenge) {
        res.sendStatus(403);
        return;
      }

      if (mode === 'subscribe' && verifyToken === options.webhookVerifyToken) {
        // eslint-disable-next-line no-console
        console.log('✔️ Webhook verified');
        res.setHeader('content-type', 'text/plain');
        res.send(challenge);
        return;
      }

      res.sendStatus(403);
    });
  }

  // POST - Incoming messages
  router.post('/', (req: Request, res: Response): void => {
    const body = req.body as Record<string, unknown>;

    // Validate body structure
    const typedBody = body as {
      object?: string;
      entry?: Array<{
        changes?: Array<{
          value?: {
            metadata?: { phone_number_id?: string };
            contacts?: Array<{ profile?: { name?: string } }>;
            messages?: Array<{
              from: string;
              id: string;
              timestamp: string;
              type: string;
              text?: { body: string };
              image?: Record<string, unknown>;
              document?: Record<string, unknown>;
              audio?: Record<string, unknown>;
              video?: Record<string, unknown>;
              sticker?: Record<string, unknown>;
              location?: Record<string, unknown>;
              contacts?: Record<string, unknown>;
              interactive?: {
                type: string;
                list_reply?: Record<string, unknown>;
                button_reply?: Record<string, unknown>;
                nfm_reply?: Record<string, unknown>;
              };
              reaction?: Record<string, unknown>;
              order?: Record<string, unknown>;
              system?: Record<string, unknown>;
              context?: Record<string, unknown>;
            }>;
            statuses?: unknown[];
          };
        }>;
      }>;
    };

    if (
      !typedBody.object
      || !typedBody.entry?.[0]?.changes?.[0]?.value
      || !typedBody.entry?.[0]?.changes?.[0]?.value?.messages?.length
    ) {
      res.sendStatus(400);
      return;
    }

    // Status updates - acknowledge but don't process
    if (typedBody.entry?.[0]?.changes?.[0]?.value?.statuses) {
      res.sendStatus(202);
      return;
    }

    const messageData = typedBody.entry[0].changes[0].value.messages?.[0];
    if (!messageData) {
      res.sendStatus(400);
      return;
    }

    const {
      from, id, timestamp, type, context, ...rest
    } = messageData;
    const phoneNumberId = typedBody.entry[0].changes[0].value?.metadata?.phone_number_id;

    // Only process messages for this bot's phone number
    if (phoneNumberId !== fromPhoneNumberId) {
      res.sendStatus(200); // Acknowledge but don't process
      return;
    }

    let event: PubSubEvent | undefined;
    let data: FreeFormObject<PubSubEvent> | undefined;

    switch (type) {
      case 'text':
        event = PubSubEvents.text;
        data = { text: rest.text?.body } as FreeFormObject<'text'>;
        break;

      case 'image':
      case 'document':
      case 'audio':
      case 'video':
      case 'sticker':
      case 'location':
      case 'contacts':
        event = PubSubEvents[type as PubSubEvent];
        data = rest[type as keyof typeof rest] as FreeFormObject<PubSubEvent>;
        break;

      case 'interactive':
        if (rest.interactive) {
          event = rest.interactive.type as PubSubEvent;
          data = {
            ...(rest.interactive.list_reply
              || rest.interactive.button_reply
              || rest.interactive.nfm_reply),
          } as FreeFormObject<PubSubEvent>;
        }
        break;

      case 'reaction':
        event = PubSubEvents.reaction;
        data = rest.reaction as FreeFormObject<'reaction'>;
        break;

      case 'order':
        event = PubSubEvents.order;
        data = rest.order as FreeFormObject<'order'>;
        break;

      case 'system':
        event = PubSubEvents.system;
        data = rest.system as FreeFormObject<'system'>;
        break;

      default:
        break;
    }

    if (context) {
      data = { ...data, context } as FreeFormObject<PubSubEvent>;
    }

    const isSystemMessage = type === 'system';
    const name = isSystemMessage
      ? undefined
      : typedBody.entry[0].changes[0].value?.contacts?.[0]?.profile?.name;

    if (event && data) {
      const payload: Message = {
        from,
        name,
        id,
        timestamp,
        type: event,
        data: context ? { ...data, context } : data,
      };

      [
        `bot-${fromPhoneNumberId}-message`,
        `bot-${fromPhoneNumberId}-${event}`,
      ].forEach((e) => PubSub.publish(e, payload));
    }

    res.sendStatus(200);
  });

  return router;
};

// Re-export Express types for convenience
export type { Router, Request, Response } from 'express';
