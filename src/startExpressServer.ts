import express, { Router } from 'express';
import PubSub from 'pubsub-js';
import { FreeFormObject } from './utils/misc';
import { PubSubEvent, PubSubEvents } from './utils/pubSub';
import { Message } from './createBot.types';

export interface ServerOptions {
  useMiddleware?: (app: Router) => void;
  webhookVerifyToken?: string;
}

export const getExpressRoute = (options?: ServerOptions): Router => {
  const router = Router();
  router.use(express.json());

  if (options?.useMiddleware) {
    options.useMiddleware(router);
  }

  const webhookPath = '/';

  if (options?.webhookVerifyToken) {
    router.get(webhookPath, (req, res) => {
      if (!req.query) {
        res.sendStatus(403);
        return;
      }

      const mode = req.query['hub.mode'];
      const verifyToken = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

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

  router.post(webhookPath, async (req, res) => {
    if (
      !req.body.object
      || !req.body.entry?.[0]?.changes?.[0]?.value
      || req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.length < 1
    ) {
      res.sendStatus(400);
      return;
    }
    if (req.body?.entry?.[0]?.changes?.[0]?.value?.statuses) {
      res.sendStatus(202);
      return;
    }

    const {
      from, id, timestamp, type, ...rest
    } = req.body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0] ?? {};
    const fromPhoneNumberId = req.body.entry[0].changes[0].value?.metadata?.phone_number_id;

    let event: PubSubEvent | undefined;
    let data: FreeFormObject<typeof event> | undefined;

    switch (type) {
      case 'text':
        event = PubSubEvents.text;
        data = { text: rest.text?.body };
        break;

      case 'image':
      case 'document':
      case 'audio':
      case 'video':
      case 'sticker':
      case 'location':
      case 'contacts':
        event = PubSubEvents[type as PubSubEvent];
        data = rest[type];
        break;

      case 'interactive':
        event = rest.interactive.type;
        data = {
          ...(rest.interactive.list_reply
            || rest.interactive.button_reply
            || rest.interactive?.nfm_reply),
        };
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

    if (rest.context) {
      data = {
        ...data,
        context: rest.context,
      };
    }

    // In startExpressServer.ts - Around line 85-90, replace the name assignment
    const isSystemMessage = type === 'system';
    const name = isSystemMessage
      ? undefined
      : req.body.entry[0].changes[0].value.contacts?.[0]?.profile?.name
        ?? undefined;

    if (event && data) {
      const payload: Message<typeof event> = {
        from,
        name,
        id,
        timestamp,
        type: event,
        data: rest.context ? { ...data, context: rest.context } : data,
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
