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
 *   appSecret: process.env.APP_SECRET,
 * });
 *
 * bot.on('message', (msg) => console.log(msg));
 * ```
 *
 * @example Pages Router
 * ```typescript
 * // pages/api/whatsapp/webhook.ts
 * import { getNextPagesApiHandler } from '@awadoc/whatsapp-cloud-api/next';
 *
 * export default getNextPagesApiHandler(phoneId, {
 *   webhookVerifyToken: process.env.VERIFY_TOKEN,
 * });
 * // Pages Router needs the raw body for signature checks:
 * export const config = { api: { bodyParser: false } };
 * ```
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import {
  WebhookOptions,
  verifyWebhookChallenge,
  handleWebhookPost,
} from './webhook';

export type NextServerOptions = WebhookOptions;

export interface NextAppRouteHandlers {
  GET: (request: NextRequest) => NextResponse;
  POST: (request: NextRequest) => Promise<NextResponse>;
}

export type NextPagesHandler = (
  req: NextApiRequest,
  res: NextApiResponse,
) => Promise<void>;

const readRawBody = (req: NextApiRequest): Promise<string> => {
  if (typeof req.body === 'string') return Promise.resolve(req.body);
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(JSON.stringify(req.body));
  }
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(
      typeof chunk === 'string' ? Buffer.from(chunk) : chunk,
    ));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
};

// ============================================================================
// App Router
// ============================================================================

export const getNextAppRouteHandlers = (
  fromPhoneNumberId: string,
  options?: NextServerOptions,
): NextAppRouteHandlers => ({
  GET: (request: NextRequest): NextResponse => {
    const url = new URL(request.url);
    const query = Object.fromEntries(url.searchParams.entries());
    const { status, body } = verifyWebhookChallenge(query, options?.webhookVerifyToken);
    return new NextResponse(body, {
      status,
      headers: status === 200 ? { 'content-type': 'text/plain' } : undefined,
    });
  },

  POST: async (request: NextRequest): Promise<NextResponse> => {
    try {
      const raw = await request.text();
      let body: unknown;
      try {
        body = JSON.parse(raw);
      } catch {
        return new NextResponse(null, { status: 404 });
      }
      const { status } = handleWebhookPost(
        body,
        fromPhoneNumberId,
        options,
        raw,
        request.headers.get('x-hub-signature-256') ?? undefined,
      );
      return new NextResponse(null, { status });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error processing webhook:', error);
      return new NextResponse(null, { status: 500 });
    }
  },
});

// ============================================================================
// Pages Router
// ============================================================================

export function getNextPagesApiHandler(
  fromPhoneNumberId: string,
  options?: NextServerOptions,
): NextPagesHandler {
  return async (req: NextApiRequest, res: NextApiResponse): Promise<void> => {
    if (req.method === 'GET') {
      const { status, body } = verifyWebhookChallenge(
        req.query as Record<string, string | string[] | undefined>,
        options?.webhookVerifyToken,
      );
      if (status === 200) res.setHeader('content-type', 'text/plain');
      res.status(status).send(body);
      return;
    }

    if (req.method === 'POST') {
      try {
        const raw = await readRawBody(req);
        let body: unknown;
        try {
          body = JSON.parse(raw);
        } catch {
          res.status(404).end();
          return;
        }
        const { status } = handleWebhookPost(
          body,
          fromPhoneNumberId,
          options,
          raw,
          (req.headers['x-hub-signature-256'] as string | undefined),
        );
        res.status(status).end();
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error processing webhook:', error);
        res.status(500).end();
      }
      return;
    }

    res.status(405).send('Method Not Allowed');
  };
}

// Re-export Next.js types for convenience
export type { NextApiRequest, NextApiResponse } from 'next';
export type { NextRequest } from 'next/server';
export { NextResponse } from 'next/server';
