/**
 * Encryption and decryption utilities for WhatsApp Flows data exchange
 *
 * WhatsApp Flows use a combination of RSA and AES-GCM encryption:
 * - Request: AES key is encrypted with RSA-OAEP (SHA-256), payload is encrypted with AES-128-GCM
 * - Response: Encrypted with AES-128-GCM using flipped IV
 */
import crypto from 'crypto';
import type {
  EncryptedFlowRequest,
  DecryptedFlowRequest,
  DecryptionResult,
  FlowKeyPair,
} from './types';

const AES_ALGORITHM = 'aes-128-gcm' as const;
const AUTH_TAG_LENGTH = 16;

/**
 * Decrypt an incoming WhatsApp Flow request
 *
 * @param encryptedRequest - The encrypted request body from WhatsApp
 * @param privateKeyPem - Your RSA private key in PEM format
 * @returns Decryption result with decrypted data and keys for response encryption
 * @throws Error if decryption fails (caller should return HTTP 421)
 *
 * @example
 * ```typescript
 * try {
 *   const { decryptedData, aesKey, iv } = decryptRequest(body, privateKey);
 *   // Process decryptedData...
 * } catch (error) {
 *   // Return HTTP 421 to tell client to re-download public key
 *   res.status(421).send('Decryption failed');
 * }
 * ```
 */
export function decryptRequest(
  encryptedRequest: EncryptedFlowRequest,
  privateKeyPem: string,
): DecryptionResult {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { encrypted_flow_data, encrypted_aes_key, initial_vector } = encryptedRequest;

  // Decode base64 values
  const flowData = Buffer.from(encrypted_flow_data, 'base64');
  const iv = Buffer.from(initial_vector, 'base64');
  const encryptedKey = Buffer.from(encrypted_aes_key, 'base64');

  // Decrypt the AES key using RSA-OAEP with SHA-256
  const aesKey = crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    Uint8Array.from(encryptedKey),
  );

  // Decrypt the flow data using AES-128-GCM
  const encryptedBody = flowData.subarray(0, -AUTH_TAG_LENGTH);
  const authTag = flowData.subarray(-AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(
    AES_ALGORITHM,
    Uint8Array.from(aesKey),
    Uint8Array.from(iv),
  );
  decipher.setAuthTag(Uint8Array.from(authTag));

  const decrypted = Buffer.concat([
    decipher.update(Uint8Array.from(encryptedBody)),
    decipher.final(),
  ]);

  const decryptedData: DecryptedFlowRequest = JSON.parse(
    decrypted.toString('utf-8'),
  );

  return {
    decryptedData,
    aesKey,
    iv,
  };
}

/**
 * Encrypt a response to send back to WhatsApp
 *
 * @param response - The response object to encrypt
 * @param aesKey - AES key from decryption result
 * @param iv - Initialization vector from decryption result
 * @returns Base64-encoded encrypted response
 *
 * @example
 * ```typescript
 * const response = { screen: 'NEXT_SCREEN', data: { foo: 'bar' } };
 * const encrypted = encryptResponse(response, aesKey, iv);
 * res.type('text/plain').send(encrypted);
 * ```
 */
export function encryptResponse(
  response: object,
  aesKey: Buffer,
  iv: Buffer,
): string {
  // Flip the initialization vector (XOR each byte with 0xFF)
  const flippedIv = Buffer.alloc(iv.length);
  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < iv.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    flippedIv[i] = iv[i] ^ 0xff;
  }

  // Encrypt using AES-128-GCM
  const cipher = crypto.createCipheriv(
    AES_ALGORITHM,
    Uint8Array.from(aesKey),
    Uint8Array.from(flippedIv),
  );

  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(response), 'utf-8'),
    cipher.final(),
    cipher.getAuthTag(),
  ]);

  return encrypted.toString('base64');
}

/**
 * Generate a new RSA key pair for WhatsApp Flows encryption
 *
 * After generating, upload the public key to WhatsApp
 * using the FlowManager.setBusinessPublicKey() method.
 *
 * @returns Object containing privateKey and publicKey in PEM format
 *
 * @example
 * ```typescript
 * import { generateKeyPair } from '@awadoc/whatsapp-cloud-api/flows';
 *
 * const { privateKey, publicKey } = generateKeyPair();
 *
 * // Store privateKey securely (e.g., environment variable)
 * // Upload publicKey to WhatsApp
 * await flowManager.setBusinessPublicKey(publicKey);
 * ```
 */
export function generateKeyPair(): FlowKeyPair {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  });

  return { privateKey, publicKey };
}

/**
 * Validate request signature using app secret
 *
 * @param payload - Raw request body as string
 * @param signature - Value from X-Hub-Signature-256 header (with "sha256=" prefix)
 * @param appSecret - Your Meta app secret
 * @returns true if signature is valid
 *
 * @example
 * ```typescript
 * const rawBody = JSON.stringify(req.body);
 * const signature = req.headers['x-hub-signature-256'] as string;
 *
 * if (!validateSignature(rawBody, signature, appSecret)) {
 *   return res.status(401).send('Invalid signature');
 * }
 * ```
 */
export function validateSignature(
  payload: string,
  signature: string,
  appSecret: string,
): boolean {
  if (!signature || !signature.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = signature.slice(7); // Remove "sha256=" prefix
  const computedSignature = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(computedSignature),
  );
}
