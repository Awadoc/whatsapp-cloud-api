import * as crypto from 'crypto';

/**
 * Verify a WhatsApp webhook `X-Hub-Signature-256` header.
 *
 * Meta signs the raw request body with HMAC-SHA256 keyed by your app secret and
 * sends it as `sha256=<hex>`. Always verify against the *raw* body bytes — a
 * re-serialised JSON object will not match.
 */
export const verifyWebhookSignature = (
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  appSecret: string,
): boolean => {
  if (!signatureHeader || !signatureHeader.startsWith('sha256=')) return false;

  const received = signatureHeader.slice('sha256='.length);
  const expected = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  const a = Buffer.from(received, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};
