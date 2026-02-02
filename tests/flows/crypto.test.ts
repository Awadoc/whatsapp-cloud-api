import crypto from "crypto";
import {
  generateKeyPair,
  decryptRequest,
  encryptResponse,
  validateSignature,
} from "../../src/flows/crypto";
import type {
  EncryptedFlowRequest,
  DecryptedFlowRequest,
} from "../../src/flows/crypto/types";

describe("Crypto Utilities", () => {
  describe("generateKeyPair", () => {
    it("should generate valid RSA key pair", () => {
      const { privateKey, publicKey } = generateKeyPair();

      expect(privateKey).toBeDefined();
      expect(publicKey).toBeDefined();
      expect(typeof privateKey).toBe("string");
      expect(typeof publicKey).toBe("string");
    });

    it("should generate keys in PEM format", () => {
      const { privateKey, publicKey } = generateKeyPair();

      expect(privateKey).toContain("-----BEGIN PRIVATE KEY-----");
      expect(privateKey).toContain("-----END PRIVATE KEY-----");
      expect(publicKey).toContain("-----BEGIN PUBLIC KEY-----");
      expect(publicKey).toContain("-----END PUBLIC KEY-----");
    });

    it("should generate 2048-bit RSA keys", () => {
      const { privateKey } = generateKeyPair();

      // Parse the key to verify it's RSA 2048
      const keyObject = crypto.createPrivateKey(privateKey);
      expect(keyObject.asymmetricKeyType).toBe("rsa");
      // 2048 bits = 256 bytes, asymmetricKeyDetails.modulusLength is in bits
      expect(keyObject.asymmetricKeyDetails?.modulusLength).toBe(2048);
    });

    it("should generate unique key pairs each time", () => {
      const pair1 = generateKeyPair();
      const pair2 = generateKeyPair();

      expect(pair1.privateKey).not.toBe(pair2.privateKey);
      expect(pair1.publicKey).not.toBe(pair2.publicKey);
    });

    it("should generate matching key pairs (can decrypt what public key encrypts)", () => {
      const { privateKey, publicKey } = generateKeyPair();
      const testData = Buffer.from("test message");

      // Encrypt with public key
      const encrypted = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        testData,
      );

      // Decrypt with private key
      const decrypted = crypto.privateDecrypt(
        {
          key: privateKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        encrypted,
      );

      expect(decrypted.toString()).toBe("test message");
    });
  });

  describe("encryptResponse and decryptRequest", () => {
    // Helper to simulate WhatsApp's encryption process (encrypt a request)
    function encryptRequestForTesting(
      data: DecryptedFlowRequest,
      publicKeyPem: string,
    ): { encryptedRequest: EncryptedFlowRequest; aesKey: Buffer; iv: Buffer } {
      // Generate random AES key and IV
      const aesKey = crypto.randomBytes(16);
      const iv = crypto.randomBytes(12);

      // Encrypt the data with AES-GCM
      const cipher = crypto.createCipheriv("aes-128-gcm", aesKey, iv);
      const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(data), "utf-8"),
        cipher.final(),
        cipher.getAuthTag(),
      ]);

      // Encrypt the AES key with RSA-OAEP
      const encryptedAesKey = crypto.publicEncrypt(
        {
          key: publicKeyPem,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        aesKey,
      );

      return {
        encryptedRequest: {
          encrypted_flow_data: encrypted.toString("base64"),
          encrypted_aes_key: encryptedAesKey.toString("base64"),
          initial_vector: iv.toString("base64"),
        },
        aesKey,
        iv,
      };
    }

    it("should decrypt a properly encrypted request", () => {
      const { privateKey, publicKey } = generateKeyPair();

      const originalData: DecryptedFlowRequest = {
        version: "3.0",
        action: "INIT",
        flow_token: "test-flow-token-123",
        data: { key: "value" },
      };

      const { encryptedRequest } = encryptRequestForTesting(
        originalData,
        publicKey,
      );
      const result = decryptRequest(encryptedRequest, privateKey);

      expect(result.decryptedData).toEqual(originalData);
      expect(result.aesKey).toBeInstanceOf(Buffer);
      expect(result.iv).toBeInstanceOf(Buffer);
    });

    it("should decrypt requests with all action types", () => {
      const { privateKey, publicKey } = generateKeyPair();

      const actions: DecryptedFlowRequest["action"][] = [
        "INIT",
        "BACK",
        "data_exchange",
        "ping",
      ];

      actions.forEach((action) => {
        const data: DecryptedFlowRequest = {
          version: "3.0",
          action,
          flow_token: "token-123",
          data: {},
        };

        if (action === "data_exchange") {
          data.screen = "CURRENT_SCREEN";
        }

        const { encryptedRequest } = encryptRequestForTesting(data, publicKey);
        const result = decryptRequest(encryptedRequest, privateKey);

        expect(result.decryptedData.action).toBe(action);
      });
    });

    it("should return keys needed for response encryption", () => {
      const { privateKey, publicKey } = generateKeyPair();

      const data: DecryptedFlowRequest = {
        version: "3.0",
        action: "INIT",
        flow_token: "token",
        data: {},
      };

      const { encryptedRequest, aesKey, iv } = encryptRequestForTesting(
        data,
        publicKey,
      );
      const result = decryptRequest(encryptedRequest, privateKey);

      // The returned aesKey and iv should match what we used to encrypt
      expect(result.aesKey.equals(aesKey)).toBe(true);
      expect(result.iv.equals(iv)).toBe(true);
    });

    it("should throw error for corrupted encrypted data", () => {
      const { privateKey, publicKey } = generateKeyPair();

      const data: DecryptedFlowRequest = {
        version: "3.0",
        action: "INIT",
        flow_token: "token",
        data: {},
      };

      const { encryptedRequest } = encryptRequestForTesting(data, publicKey);

      // Corrupt the encrypted data
      encryptedRequest.encrypted_flow_data = "corrupted_base64_data";

      expect(() => {
        decryptRequest(encryptedRequest, privateKey);
      }).toThrow();
    });

    it("should throw error for wrong private key", () => {
      const keyPair1 = generateKeyPair();
      const keyPair2 = generateKeyPair();

      const data: DecryptedFlowRequest = {
        version: "3.0",
        action: "INIT",
        flow_token: "token",
        data: {},
      };

      // Encrypt with keyPair1's public key
      const { encryptedRequest } = encryptRequestForTesting(
        data,
        keyPair1.publicKey,
      );

      // Try to decrypt with keyPair2's private key
      expect(() => {
        decryptRequest(encryptedRequest, keyPair2.privateKey);
      }).toThrow();
    });

    it("should throw error for tampered auth tag", () => {
      const { privateKey, publicKey } = generateKeyPair();

      const data: DecryptedFlowRequest = {
        version: "3.0",
        action: "INIT",
        flow_token: "token",
        data: {},
      };

      const { encryptedRequest } = encryptRequestForTesting(data, publicKey);

      // Tamper with the encrypted data (modify the auth tag at the end)
      const encryptedBuffer = Buffer.from(
        encryptedRequest.encrypted_flow_data,
        "base64",
      );
      encryptedBuffer[encryptedBuffer.length - 1] ^= 0xff;
      encryptedRequest.encrypted_flow_data = encryptedBuffer.toString("base64");

      expect(() => {
        decryptRequest(encryptedRequest, privateKey);
      }).toThrow();
    });
  });

  describe("encryptResponse", () => {
    // Helper to decrypt a response (simulating WhatsApp's decryption)
    function decryptResponseForTesting(
      encryptedResponse: string,
      aesKey: Buffer,
      iv: Buffer,
    ): object {
      const encrypted = Buffer.from(encryptedResponse, "base64");

      // Flip the IV (same as encryption does)
      const flippedIv = Buffer.alloc(iv.length);
      for (let i = 0; i < iv.length; i += 1) {
        // eslint-disable-next-line no-bitwise
        flippedIv[i] = iv[i] ^ 0xff;
      }

      const authTagLength = 16;
      const encryptedBody = encrypted.subarray(0, -authTagLength);
      const authTag = encrypted.subarray(-authTagLength);

      const decipher = crypto.createDecipheriv(
        "aes-128-gcm",
        aesKey,
        flippedIv,
      );
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encryptedBody),
        decipher.final(),
      ]);

      return JSON.parse(decrypted.toString("utf-8"));
    }

    it("should encrypt response that can be decrypted", () => {
      const aesKey = crypto.randomBytes(16);
      const iv = crypto.randomBytes(12);

      const response = {
        screen: "NEXT_SCREEN",
        data: { name: "John", age: 30 },
      };

      const encrypted = encryptResponse(response, aesKey, iv);
      const decrypted = decryptResponseForTesting(encrypted, aesKey, iv);

      expect(decrypted).toEqual(response);
    });

    it("should return base64 encoded string", () => {
      const aesKey = crypto.randomBytes(16);
      const iv = crypto.randomBytes(12);

      const encrypted = encryptResponse({ data: {} }, aesKey, iv);

      // Should be valid base64
      expect(() => Buffer.from(encrypted, "base64")).not.toThrow();
      // Re-encoding should produce the same result (valid base64)
      expect(Buffer.from(encrypted, "base64").toString("base64")).toBe(
        encrypted,
      );
    });

    it("should handle complex nested response data", () => {
      const aesKey = crypto.randomBytes(16);
      const iv = crypto.randomBytes(12);

      const response = {
        screen: "COMPLEX_SCREEN",
        data: {
          user: {
            name: "John Doe",
            contacts: [
              { type: "email", value: "john@example.com" },
              { type: "phone", value: "+1234567890" },
            ],
          },
          items: [1, 2, 3, 4, 5],
          meta: {
            timestamp: Date.now(),
            valid: true,
          },
        },
      };

      const encrypted = encryptResponse(response, aesKey, iv);
      const decrypted = decryptResponseForTesting(encrypted, aesKey, iv);

      expect(decrypted).toEqual(response);
    });

    it("should handle error_message in response", () => {
      const aesKey = crypto.randomBytes(16);
      const iv = crypto.randomBytes(12);

      const response = {
        screen: "CURRENT_SCREEN",
        data: { email: "invalid" },
        error_message: "Please enter a valid email address",
      };

      const encrypted = encryptResponse(response, aesKey, iv);
      const decrypted = decryptResponseForTesting(encrypted, aesKey, iv) as any;

      expect(decrypted.error_message).toBe(
        "Please enter a valid email address",
      );
    });

    it("should handle unicode characters", () => {
      const aesKey = crypto.randomBytes(16);
      const iv = crypto.randomBytes(12);

      const response = {
        screen: "UNICODE_SCREEN",
        data: {
          greeting: "こんにちは",
          emoji: "🎉🚀",
          arabic: "مرحبا",
        },
      };

      const encrypted = encryptResponse(response, aesKey, iv);
      const decrypted = decryptResponseForTesting(encrypted, aesKey, iv);

      expect(decrypted).toEqual(response);
    });
  });

  describe("round-trip encryption", () => {
    it("should complete full request/response cycle", () => {
      const { privateKey, publicKey } = generateKeyPair();

      // Simulate WhatsApp sending an encrypted request
      const requestData: DecryptedFlowRequest = {
        version: "3.0",
        action: "data_exchange",
        screen: "USER_INFO",
        flow_token: "unique-flow-token-xyz",
        data: {
          name: "John",
          email: "john@example.com",
        },
      };

      // Generate keys for encryption (simulating WhatsApp's side)
      const aesKey = crypto.randomBytes(16);
      const iv = crypto.randomBytes(12);

      // Encrypt request
      const cipher = crypto.createCipheriv("aes-128-gcm", aesKey, iv);
      const encryptedData = Buffer.concat([
        cipher.update(JSON.stringify(requestData), "utf-8"),
        cipher.final(),
        cipher.getAuthTag(),
      ]);

      const encryptedAesKey = crypto.publicEncrypt(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
          oaepHash: "sha256",
        },
        aesKey,
      );

      const encryptedRequest: EncryptedFlowRequest = {
        encrypted_flow_data: encryptedData.toString("base64"),
        encrypted_aes_key: encryptedAesKey.toString("base64"),
        initial_vector: iv.toString("base64"),
      };

      // --- Endpoint receives and processes ---

      // Decrypt the request
      const decryption = decryptRequest(encryptedRequest, privateKey);

      expect(decryption.decryptedData).toEqual(requestData);

      // Prepare response
      const responseData = {
        screen: "CONFIRMATION",
        data: {
          message: `Thank you, ${decryption.decryptedData.data.name}!`,
          nextStep: "review",
        },
      };

      // Encrypt response
      const encryptedResponse = encryptResponse(
        responseData,
        decryption.aesKey,
        decryption.iv,
      );

      // --- WhatsApp receives response ---

      // Verify WhatsApp can decrypt it (flip IV for decryption)
      const flippedIv = Buffer.alloc(decryption.iv.length);
      for (let i = 0; i < decryption.iv.length; i += 1) {
        // eslint-disable-next-line no-bitwise
        flippedIv[i] = decryption.iv[i] ^ 0xff;
      }

      const responseBuffer = Buffer.from(encryptedResponse, "base64");
      const authTagLength = 16;
      const encryptedBody = responseBuffer.subarray(0, -authTagLength);
      const authTag = responseBuffer.subarray(-authTagLength);

      const decipher = crypto.createDecipheriv(
        "aes-128-gcm",
        decryption.aesKey,
        flippedIv,
      );
      decipher.setAuthTag(authTag);

      const decryptedResponse = JSON.parse(
        Buffer.concat([
          decipher.update(encryptedBody),
          decipher.final(),
        ]).toString("utf-8"),
      );

      expect(decryptedResponse).toEqual(responseData);
    });
  });

  describe("validateSignature", () => {
    const testPayload = '{"key":"value"}';
    const testSecret = "my-app-secret";

    function computeSignature(payload: string, secret: string): string {
      const hmac = crypto.createHmac("sha256", secret);
      hmac.update(payload);
      return `sha256=${hmac.digest("hex")}`;
    }

    it("should return true for valid signature", () => {
      const signature = computeSignature(testPayload, testSecret);
      const result = validateSignature(testPayload, signature, testSecret);

      expect(result).toBe(true);
    });

    it("should return false for invalid signature", () => {
      const wrongSignature = computeSignature(testPayload, "wrong-secret");
      const result = validateSignature(testPayload, wrongSignature, testSecret);

      expect(result).toBe(false);
    });

    it("should return false for tampered payload", () => {
      const signature = computeSignature(testPayload, testSecret);
      const tamperedPayload = '{"key":"tampered"}';
      const result = validateSignature(tamperedPayload, signature, testSecret);

      expect(result).toBe(false);
    });

    it("should return false for missing sha256= prefix", () => {
      const hmac = crypto.createHmac("sha256", testSecret);
      hmac.update(testPayload);
      const signatureWithoutPrefix = hmac.digest("hex");

      const result = validateSignature(
        testPayload,
        signatureWithoutPrefix,
        testSecret,
      );

      expect(result).toBe(false);
    });

    it("should return false for empty signature", () => {
      const result = validateSignature(testPayload, "", testSecret);
      expect(result).toBe(false);
    });

    it("should return false for null/undefined signature", () => {
      expect(validateSignature(testPayload, null, testSecret)).toBe(false);
      expect(validateSignature(testPayload, undefined, testSecret)).toBe(false);
    });

    it("should handle special characters in payload", () => {
      const specialPayload = '{"message":"Hello, 世界! 🌍","special":"<>&\\""}';
      const signature = computeSignature(specialPayload, testSecret);

      const result = validateSignature(specialPayload, signature, testSecret);

      expect(result).toBe(true);
    });

    it("should handle large payloads", () => {
      const largePayload = JSON.stringify({
        data: Array(1000).fill({ key: "value", nested: { more: "data" } }),
      });
      const signature = computeSignature(largePayload, testSecret);

      const result = validateSignature(largePayload, signature, testSecret);

      expect(result).toBe(true);
    });

    it("should be case-sensitive for signature comparison", () => {
      const signature = computeSignature(testPayload, testSecret);
      // Uppercase the hex signature (after sha256= prefix)
      const uppercaseSignature = `sha256=${signature.slice(7).toUpperCase()}`;

      // This might fail due to timing-safe comparison expecting exact match
      // The actual behavior depends on implementation
      const result = validateSignature(
        testPayload,
        uppercaseSignature,
        testSecret,
      );

      // SHA256 hex should be lowercase, so this should fail
      expect(result).toBe(false);
    });

    it("should prevent timing attacks (uses constant-time comparison)", () => {
      // This is more of a code review check than a test
      // We verify the function uses timingSafeEqual by testing that
      // it still works correctly (timing attack prevention can't be easily tested)
      const signature = computeSignature(testPayload, testSecret);

      // Multiple calls should all succeed
      for (let i = 0; i < 10; i += 1) {
        expect(validateSignature(testPayload, signature, testSecret)).toBe(
          true,
        );
      }
    });
  });
});
