/**
 * Types for WhatsApp Flows encryption/decryption
 */

/**
 * Encrypted request body from WhatsApp
 */
export interface EncryptedFlowRequest {
  /** Base64-encoded encrypted flow data */
  encrypted_flow_data: string;
  /** Base64-encoded AES key encrypted with RSA */
  encrypted_aes_key: string;
  /** Base64-encoded initialization vector */
  initial_vector: string;
}

/**
 * Action types for flow requests
 */
export type FlowRequestAction = 'INIT' | 'BACK' | 'data_exchange' | 'ping';

/**
 * Decrypted flow request payload
 */
export interface DecryptedFlowRequest {
  /** API version (e.g., "3.0") */
  version: string;
  /** Action type that triggered the request */
  action: FlowRequestAction;
  /** Current screen ID (may be undefined for INIT/BACK) */
  screen?: string;
  /** Form data submitted by the user */
  data: Record<string, unknown>;
  /** Flow token for session identification */
  flow_token: string;
  /** Flow token signature (for flows version >= 7.3 and data_api_version >= 4.0) */
  flow_token_signature?: string;
}

/**
 * Decryption result with keys for response encryption
 */
export interface DecryptionResult {
  /** Decrypted request payload */
  decryptedData: DecryptedFlowRequest;
  /** AES key for encrypting response */
  aesKey: Buffer;
  /** Initialization vector for encrypting response */
  iv: Buffer;
}

/**
 * RSA key pair for flow encryption
 */
export interface FlowKeyPair {
  /** Private key in PEM format */
  privateKey: string;
  /** Public key in PEM format */
  publicKey: string;
}
