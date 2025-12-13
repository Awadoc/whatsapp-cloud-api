/**
 * Next.js webhook handlers for WhatsApp Cloud API
 *
 * @example App Router (Next.js 13+)
 * ```typescript
 * // app/api/whatsapp/webhook/route.ts
 * import { createBot } from '@awadoc/whatsapp-cloud-api';
 * import { getNextAppRouteHandlers } from '@awadoc/whatsapp-cloud-api/next';
 *
 * const phoneId = process.env.PHONE_ID!;
 * const bot = createBot(phoneId, process.env.TOKEN!);
 *
 * export const { GET, POST } = getNextAppRouteHandlers(phoneId, {
 *   webhookVerifyToken: process.env.VERIFY_TOKEN,
 * });
 *
 * bot.on('message', (msg) => console.log(msg));
 * ```
 *
 * @example Pages Router
 * ```typescript
 * // pages/api/whatsapp/webhook.ts
 * import { createBot } from '@awadoc/whatsapp-cloud-api';
 * import { getNextPagesApiHandler } from '@awadoc/whatsapp-cloud-api/next';
 *
 * const phoneId = process.env.PHONE_ID!;
 * const bot = createBot(phoneId, process.env.TOKEN!);
 *
 * export default getNextPagesApiHandler(phoneId, {
 *   webhookVerifyToken: process.env.VERIFY_TOKEN,
 * });
 *
 * bot.on('message', (msg) => console.log(msg));
 * ```
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import PubSub from 'pubsub-js';
import { FreeFormObject } from './utils/misc';
import { PubSubEvent, PubSubEvents } from './utils/pubSub';
import { Message } from './createBot.types';

// ============================================================================
// Types
// ============================================================================

export interface NextServerOptions {
  webhookVerifyToken?: string;
}

export interface NextAppRouteHandlers {
  GET: (request: NextRequest) => NextResponse;
  POST: (request: NextRequest) => Promise<NextResponse>;
}

export type NextPagesHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
) => Promise<void>;

// ============================================================================
// Webhook Body Types
// ============================================================================

interface WebhookMessagePayload {
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
}

interface WebhookBody {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: {
        metadata?: { phone_number_id?: string };
        contacts?: Array<{ profile?: { name?: string } }>;
        messages?: WebhookMessagePayload[];
        statuses?: unknown[];
      };
    }>;
  }>;
}

// ============================================================================
// Webhook Processing
// ============================================================================

function processWebhookBody(
  body: WebhookBody,
  fromPhoneNumberId: string,
): { event: PubSubEvent; payload: Message } | null {
  if (
    !body.object
    || !body.entry?.[0]?.changes?.[0]?.value
    || !body.entry?.[0]?.changes?.[0]?.value?.messages?.length
  ) {
    return null;
  }

  // Status updates - acknowledge but don't process
  if (body.entry?.[0]?.changes?.[0]?.value?.statuses) {
    return null;
  }

  const messageData = body.entry[0].changes[0].value.messages?.[0];
  if (!messageData) return null;

  const {
    from, id, timestamp, type, context, ...rest
  } = messageData;
  const phoneNumberId = body.entry[0].changes[0].value?.metadata?.phone_number_id;

  // Only process messages for this bot's phone number
  if (phoneNumberId !== fromPhoneNumberId) {
    return null;
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
    : body.entry[0].changes[0].value?.contacts?.[0]?.profile?.name;

  if (event && data) {
    const payload: Message = {
      from,
      name,
      id,
      timestamp,
      type: event,
      data: context ? { ...data, context } : data,
    };

    return { event, payload };
  }

  return null;
}

function publishWebhook(fromPhoneNumberId: string, event: PubSubEvent, payload: Message): void {
  [
    `bot-${fromPhoneNumberId}-message`,
    `bot-${fromPhoneNumberId}-${event}`,
  ].forEach((e) => PubSub.publish(e, payload));
}

// ============================================================================
// App Router Handlers (Next.js 13+)
// ============================================================================

/**
 * Creates route handlers for Next.js App Router.
 *
 * @param fromPhoneNumberId - Your WhatsApp Business phone number ID
 * @param options - Server configuration options
 * @returns Object with GET and POST handlers for route.ts
 */
export const getNextAppRouteHandlers = (
  fromPhoneNumberId: string,
  options?: NextServerOptions,
): NextAppRouteHandlers => ({
  GET: (request: NextRequest): NextResponse => {
    if (!options?.webhookVerifyToken) {
      return new NextResponse('Webhook verification not configured', { status: 500 });
    }

    const url = new URL(request.url);
    const mode = url.searchParams.get('hub.mode');
    const token = url.searchParams.get('hub.verify_token');
    const challenge = url.searchParams.get('hub.challenge');

    if (!mode || !token || !challenge) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    if (mode === 'subscribe' && token === options.webhookVerifyToken) {
      // eslint-disable-next-line no-console
      console.log('✔️ Webhook verified');
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'content-type': 'text/plain' },
      });
    }

    return new NextResponse('Forbidden', { status: 403 });
  },

  POST: async (request: NextRequest): Promise<NextResponse> => {
    try {
      const body = await request.json() as WebhookBody;

      // Check for status updates (acknowledged but not processed)
      if (body.entry?.[0]?.changes?.[0]?.value?.statuses) {
        return new NextResponse(null, { status: 202 });
      }

      const result = processWebhookBody(body, fromPhoneNumberId);

      if (!result) {
        return new NextResponse('Bad Request', { status: 400 });
      }

      publishWebhook(fromPhoneNumberId, result.event, result.payload);

      return new NextResponse(null, { status: 200 });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error processing webhook:', error);
      return new NextResponse('Internal Server Error', { status: 500 });
    }
  },
});

// ============================================================================
// Pages Router Handler
// ============================================================================

/**
 * Creates an API handler for Next.js Pages Router.
 *
 * @param fromPhoneNumberId - Your WhatsApp Business phone number ID
 * @param options - Server configuration options
 * @returns Handler function for pages/api route
 */
export const getNextPagesApiHandler = (
  fromPhoneNumberId: string,
  options?: NextServerOptions,
): NextPagesHandler => async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
  // Handle GET request (webhook verification)
  if (req.method === 'GET') {
    if (!options?.webhookVerifyToken) {
      res.status(500).send('Webhook verification not configured');
      return;
    }

    const mode = req.query['hub.mode'] as string | undefined;
    const token = req.query['hub.verify_token'] as string | undefined;
    const challenge = req.query['hub.challenge'] as string | undefined;

    if (!mode || !token || !challenge) {
      res.status(403).send('Forbidden');
      return;
    }

    if (mode === 'subscribe' && token === options.webhookVerifyToken) {
      // eslint-disable-next-line no-console
      console.log('✔️ Webhook verified');
      res.setHeader('content-type', 'text/plain');
      res.status(200).send(challenge);
      return;
    }

    res.status(403).send('Forbidden');
    return;
  }

  // Handle POST request (incoming messages)
  if (req.method === 'POST') {
    try {
      const body = req.body as WebhookBody;

      // Check for status updates (acknowledged but not processed)
      if (body.entry?.[0]?.changes?.[0]?.value?.statuses) {
        res.status(202).end();
        return;
      }

      const result = processWebhookBody(body, fromPhoneNumberId);

      if (!result) {
        res.status(400).send('Bad Request');
        return;
      }

      publishWebhook(fromPhoneNumberId, result.event, result.payload);

      res.status(200).end();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error processing webhook:', error);
      res.status(500).send('Internal Server Error');
    }
    return;
  }

  // Method not allowed
  res.status(405).send('Method Not Allowed');
};

// Re-export Next.js types for convenience
export type { NextApiRequest, NextApiResponse } from 'next';
export type { NextRequest } from 'next/server';
export { NextResponse } from 'next/server';
