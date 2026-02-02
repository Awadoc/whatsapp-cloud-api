import crypto from 'crypto';
import request from 'supertest';
import express, { Express } from 'express';
import { createFlowEndpoint } from '../../src/flows/endpoint/express';
import { generateKeyPair } from '../../src/flows/crypto';
import { FlowResponseBuilder, createFlowRequest } from '../../src/flows/endpoint/types';
import type { EncryptedFlowRequest, DecryptedFlowRequest } from '../../src/flows/crypto/types';

describe('Flow Endpoint', () => {
  // Generate a key pair for testing
  const { privateKey, publicKey } = generateKeyPair();
  const appSecret = 'test-app-secret';

  /**
   * Helper to encrypt a request (simulating WhatsApp's encryption)
   */
  function encryptRequest(
    data: DecryptedFlowRequest,
    publicKeyPem: string,
  ): { body: EncryptedFlowRequest; aesKey: Buffer; iv: Buffer } {
    const aesKey = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);

    // Encrypt payload with AES-GCM
    const cipher = crypto.createCipheriv('aes-128-gcm', aesKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(data), 'utf-8'),
      cipher.final(),
      cipher.getAuthTag(),
    ]);

    // Encrypt AES key with RSA-OAEP
    const encryptedAesKey = crypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256',
      },
      aesKey,
    );

    return {
      body: {
        encrypted_flow_data: encrypted.toString('base64'),
        encrypted_aes_key: encryptedAesKey.toString('base64'),
        initial_vector: iv.toString('base64'),
      },
      aesKey,
      iv,
    };
  }

  /**
   * Helper to decrypt a response (simulating WhatsApp's decryption)
   */
  function decryptResponse(
    encryptedResponse: string,
    aesKey: Buffer,
    iv: Buffer,
  ): object {
    const encrypted = Buffer.from(encryptedResponse, 'base64');

    // Flip IV
    const flippedIv = Buffer.alloc(iv.length);
    for (let i = 0; i < iv.length; i += 1) {
      // eslint-disable-next-line no-bitwise
      flippedIv[i] = iv[i] ^ 0xff;
    }

    const authTagLength = 16;
    const encryptedBody = encrypted.subarray(0, -authTagLength);
    const authTag = encrypted.subarray(-authTagLength);

    const decipher = crypto.createDecipheriv('aes-128-gcm', aesKey, flippedIv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encryptedBody),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf-8'));
  }

  /**
   * Helper to compute signature
   */
  function computeSignature(payload: string, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    return `sha256=${hmac.digest('hex')}`;
  }

  describe('Express Endpoint', () => {
    let app: Express;

    beforeEach(() => {
      app = express();
    });

    describe('Basic Request Handling', () => {
      it('should handle INIT action and return encrypted response', async () => {
        app.use('/flow', createFlowEndpoint({
          privateKey,
          onRequest: (req) => req.respond().goToScreen('WELCOME', { greeting: 'Hello!' }),
        }));

        const requestData: DecryptedFlowRequest = {
          version: '3.0',
          action: 'INIT',
          flow_token: 'test-token-123',
          data: {},
        };

        const { body, aesKey, iv } = encryptRequest(requestData, publicKey);

        const response = await request(app)
          .post('/flow')
          .send(body)
          .expect('Content-Type', /text\/plain/)
          .expect(200);

        const decrypted = decryptResponse(response.text, aesKey, iv) as any;

        expect(decrypted.screen).toBe('WELCOME');
        expect(decrypted.data.greeting).toBe('Hello!');
      });

      it('should handle data_exchange action', async () => {
        app.use('/flow', createFlowEndpoint({
          privateKey,
          onRequest: (req) => {
            const { name, email } = req.data as { name: string; email: string };
            return req.respond().goToScreen('CONFIRM', {
              name: name.toUpperCase(),
              email,
            });
          },
        }));

        const requestData: DecryptedFlowRequest = {
          version: '3.0',
          action: 'data_exchange',
          screen: 'USER_INFO',
          flow_token: 'test-token-123',
          data: {
            name: 'john',
            email: 'john@example.com',
          },
        };

        const { body, aesKey, iv } = encryptRequest(requestData, publicKey);

        const response = await request(app)
          .post('/flow')
          .send(body)
          .expect(200);

        const decrypted = decryptResponse(response.text, aesKey, iv) as any;

        expect(decrypted.screen).toBe('CONFIRM');
        expect(decrypted.data.name).toBe('JOHN');
        expect(decrypted.data.email).toBe('john@example.com');
      });

      it('should handle BACK action', async () => {
        app.use('/flow', createFlowEndpoint({
          privateKey,
          onRequest: (req) => {
            if (req.action === 'BACK') {
              return req.respond().goToScreen('PREVIOUS', { backPressed: true });
            }
            return req.respond().goToScreen('DEFAULT');
          },
        }));

        const requestData: DecryptedFlowRequest = {
          version: '3.0',
          action: 'BACK',
          flow_token: 'test-token-123',
          data: {},
        };

        const { body, aesKey, iv } = encryptRequest(requestData, publicKey);

        const response = await request(app)
          .post('/flow')
          .send(body)
          .expect(200);

        const decrypted = decryptResponse(response.text, aesKey, iv) as any;

        expect(decrypted.screen).toBe('PREVIOUS');
        expect(decrypted.data.backPressed).toBe(true);
      });

      it('should handle ping (health check)', async () => {
        app.use('/flow', createFlowEndpoint({
          privateKey,
          onRequest: () => {
            throw new Error('Should not reach handler for ping');
          },
        }));

        const requestData: DecryptedFlowRequest = {
          version: '3.0',
          action: 'ping',
          flow_token: 'test-token-123',
          data: {},
        };

        const { body, aesKey, iv } = encryptRequest(requestData, publicKey);

        const response = await request(app)
          .post('/flow')
          .send(body)
          .expect(200);

        const decrypted = decryptResponse(response.text, aesKey, iv) as any;

        expect(decrypted.data.status).toBe('active');
      });

      it('should handle error notification with acknowledgment', async () => {
        app.use('/flow', createFlowEndpoint({
          privateKey,
          acknowledgeErrors: true,
          onRequest: () => {
            throw new Error('Should not reach handler for error notification');
          },
        }));

        const requestData: DecryptedFlowRequest = {
          version: '3.0',
          action: 'data_exchange',
          screen: 'SOME_SCREEN',
          flow_token: 'test-token-123',
          data: {
            error: true,
            error_message: 'Something went wrong',
          },
        };

        const { body, aesKey, iv } = encryptRequest(requestData, publicKey);

        const response = await request(app)
          .post('/flow')
          .send(body)
          .expect(200);

        const decrypted = decryptResponse(response.text, aesKey, iv) as any;

        expect(decrypted.data.acknowledged).toBe(true);
      });
    });

    describe('Response Builder', () => {
      it('should build close response with flow completion', async () => {
        app.use('/flow', createFlowEndpoint({
          privateKey,
          onRequest: (req) => req.respond().close({
            booking_id: 'BOOK-123',
            confirmed: true,
          }),
        }));

        const requestData: DecryptedFlowRequest = {
          version: '3.0',
          action: 'data_exchange',
          screen: 'FINAL',
          flow_token: 'unique-flow-token-xyz',
          data: {},
        };

        const { body, aesKey, iv } = encryptRequest(requestData, publicKey);

        const response = await request(app)
          .post('/flow')
          .send(body)
          .expect(200);

        const decrypted = decryptResponse(response.text, aesKey, iv) as any;

        expect(decrypted.screen).toBe('SUCCESS');
        expect(decrypted.data.extension_message_response.params.flow_token).toBe('unique-flow-token-xyz');
        expect(decrypted.data.extension_message_response.params.booking_id).toBe('BOOK-123');
        expect(decrypted.data.extension_message_response.params.confirmed).toBe(true);
      });

      it('should add error message to response', async () => {
        app.use('/flow', createFlowEndpoint({
          privateKey,
          onRequest: (req) => req.respond()
            .goToScreen(req.screen!, req.data)
            .withError('Please enter a valid email address'),
        }));

        const requestData: DecryptedFlowRequest = {
          version: '3.0',
          action: 'data_exchange',
          screen: 'USER_INFO',
          flow_token: 'test-token',
          data: { email: 'invalid' },
        };

        const { body, aesKey, iv } = encryptRequest(requestData, publicKey);

        const response = await request(app)
          .post('/flow')
          .send(body)
          .expect(200);

        const decrypted = decryptResponse(response.text, aesKey, iv) as any;

        expect(decrypted.screen).toBe('USER_INFO');
        expect(decrypted.data.email).toBe('invalid');
        expect(decrypted.data.error_message).toBe('Please enter a valid email address');
      });

      it('should support async handlers', async () => {
        app.use('/flow', createFlowEndpoint({
          privateKey,
          onRequest: async (req) => {
            // Simulate async operation
            await new Promise((resolve) => { setTimeout(resolve, 10); });
            return req.respond().goToScreen('ASYNC_RESULT', { processed: true });
          },
        }));

        const requestData: DecryptedFlowRequest = {
          version: '3.0',
          action: 'INIT',
          flow_token: 'test-token',
          data: {},
        };

        const { body, aesKey, iv } = encryptRequest(requestData, publicKey);

        const response = await request(app)
          .post('/flow')
          .send(body)
          .expect(200);

        const decrypted = decryptResponse(response.text, aesKey, iv) as any;

        expect(decrypted.screen).toBe('ASYNC_RESULT');
        expect(decrypted.data.processed).toBe(true);
      });
    });

    describe('Signature Validation', () => {
      it('should accept valid signature', async () => {
        app.use('/flow', createFlowEndpoint({
          privateKey,
          appSecret,
          onRequest: (req) => req.respond().goToScreen('SIGNED', {}),
        }));

        const requestData: DecryptedFlowRequest = {
          version: '3.0',
          action: 'INIT',
          flow_token: 'test-token',
          data: {},
        };

        const { body, aesKey, iv } = encryptRequest(requestData, publicKey);
        const signature = computeSignature(JSON.stringify(body), appSecret);

        const response = await request(app)
          .post('/flow')
          .set('x-hub-signature-256', signature)
          .send(body)
          .expect(200);

        const decrypted = decryptResponse(response.text, aesKey, iv) as any;
        expect(decrypted.screen).toBe('SIGNED');
      });

      it('should reject invalid signature', async () => {
        app.use('/flow', createFlowEndpoint({
          privateKey,
          appSecret,
          onRequest: (req) => req.respond().goToScreen('SHOULD_NOT_REACH', {}),
        }));

        const requestData: DecryptedFlowRequest = {
          version: '3.0',
          action: 'INIT',
          flow_token: 'test-token',
          data: {},
        };

        const { body } = encryptRequest(requestData, publicKey);
        const wrongSignature = computeSignature(JSON.stringify(body), 'wrong-secret');

        await request(app)
          .post('/flow')
          .set('x-hub-signature-256', wrongSignature)
          .send(body)
          .expect(401);
      });

      it('should reject missing signature when appSecret is configured', async () => {
        app.use('/flow', createFlowEndpoint({
          privateKey,
          appSecret,
          onRequest: (req) => req.respond().goToScreen('SHOULD_NOT_REACH', {}),
        }));

        const requestData: DecryptedFlowRequest = {
          version: '3.0',
          action: 'INIT',
          flow_token: 'test-token',
          data: {},
        };

        const { body } = encryptRequest(requestData, publicKey);

        await request(app)
          .post('/flow')
          .send(body)
          .expect(401);
      });
    });

    describe('Error Handling', () => {
      it('should return 421 for decryption failure', async () => {
        app.use('/flow', createFlowEndpoint({
          privateKey,
          onRequest: (req) => req.respond().goToScreen('SHOULD_NOT_REACH', {}),
        }));

        // Send corrupted encrypted data
        const body: EncryptedFlowRequest = {
          encrypted_flow_data: 'invalid-base64-data',
          encrypted_aes_key: 'invalid-aes-key',
          initial_vector: 'invalid-iv',
        };

        await request(app)
          .post('/flow')
          .send(body)
          .expect(421);
      });

      it('should return 500 for handler errors', async () => {
        const errorHandler = jest.fn();

        app.use('/flow', createFlowEndpoint({
          privateKey,
          onError: errorHandler,
          onRequest: () => {
            throw new Error('Handler error');
          },
        }));

        const requestData: DecryptedFlowRequest = {
          version: '3.0',
          action: 'INIT',
          flow_token: 'test-token',
          data: {},
        };

        const { body } = encryptRequest(requestData, publicKey);

        await request(app)
          .post('/flow')
          .send(body)
          .expect(500);

        expect(errorHandler).toHaveBeenCalledWith(
          expect.any(Error),
          expect.objectContaining({ flowToken: 'test-token' }),
        );
      });

      it('should not expose error details to client', async () => {
        app.use('/flow', createFlowEndpoint({
          privateKey,
          onRequest: () => {
            throw new Error('Sensitive internal error details');
          },
        }));

        const requestData: DecryptedFlowRequest = {
          version: '3.0',
          action: 'INIT',
          flow_token: 'test-token',
          data: {},
        };

        const { body } = encryptRequest(requestData, publicKey);

        const response = await request(app)
          .post('/flow')
          .send(body)
          .expect(500);

        expect(response.text).toBe('Internal server error');
        expect(response.text).not.toContain('Sensitive');
      });
    });

    describe('Complex Flow Scenarios', () => {
      it('should handle multi-step form submission', async () => {
        const formData: Record<string, any> = {};

        app.use('/flow', createFlowEndpoint({
          privateKey,
          onRequest: (req) => {
            if (req.action === 'INIT') {
              return req.respond().goToScreen('STEP_1', { step: 1 });
            }

            if (req.screen === 'STEP_1') {
              formData.name = req.data.name;
              return req.respond().goToScreen('STEP_2', { step: 2, name: formData.name });
            }

            if (req.screen === 'STEP_2') {
              formData.email = req.data.email;
              return req.respond().goToScreen('STEP_3', { step: 3, ...formData });
            }

            if (req.screen === 'STEP_3') {
              formData.phone = req.data.phone;
              return req.respond().close({
                success: true,
                data: formData,
              });
            }

            return req.respond().goToScreen('ERROR', { message: 'Unknown screen' });
          },
        }));

        // Step 1: INIT
        let requestData: DecryptedFlowRequest = {
          version: '3.0',
          action: 'INIT',
          flow_token: 'multi-step-token',
          data: {},
        };
        let encrypted = encryptRequest(requestData, publicKey);
        let response = await request(app).post('/flow').send(encrypted.body).expect(200);
        let decrypted = decryptResponse(response.text, encrypted.aesKey, encrypted.iv) as any;
        expect(decrypted.screen).toBe('STEP_1');

        // Step 2: Submit name
        requestData = {
          version: '3.0',
          action: 'data_exchange',
          screen: 'STEP_1',
          flow_token: 'multi-step-token',
          data: { name: 'John Doe' },
        };
        encrypted = encryptRequest(requestData, publicKey);
        response = await request(app).post('/flow').send(encrypted.body).expect(200);
        decrypted = decryptResponse(response.text, encrypted.aesKey, encrypted.iv) as any;
        expect(decrypted.screen).toBe('STEP_2');
        expect(decrypted.data.name).toBe('John Doe');

        // Step 3: Submit email
        requestData = {
          version: '3.0',
          action: 'data_exchange',
          screen: 'STEP_2',
          flow_token: 'multi-step-token',
          data: { email: 'john@example.com' },
        };
        encrypted = encryptRequest(requestData, publicKey);
        response = await request(app).post('/flow').send(encrypted.body).expect(200);
        decrypted = decryptResponse(response.text, encrypted.aesKey, encrypted.iv) as any;
        expect(decrypted.screen).toBe('STEP_3');

        // Step 4: Submit phone and complete
        requestData = {
          version: '3.0',
          action: 'data_exchange',
          screen: 'STEP_3',
          flow_token: 'multi-step-token',
          data: { phone: '+1234567890' },
        };
        encrypted = encryptRequest(requestData, publicKey);
        response = await request(app).post('/flow').send(encrypted.body).expect(200);
        decrypted = decryptResponse(response.text, encrypted.aesKey, encrypted.iv) as any;
        expect(decrypted.screen).toBe('SUCCESS');
        expect(decrypted.data.extension_message_response.params.success).toBe(true);
      });

      it('should handle validation and error recovery', async () => {
        app.use('/flow', createFlowEndpoint({
          privateKey,
          onRequest: (req) => {
            if (req.action === 'INIT') {
              return req.respond().goToScreen('EMAIL_FORM', {});
            }

            const { email } = req.data as { email: string };

            // Simple email validation
            if (!email || !email.includes('@')) {
              return req.respond()
                .goToScreen('EMAIL_FORM', { email })
                .withError('Please enter a valid email address');
            }

            return req.respond().close({ email, validated: true });
          },
        }));

        // Submit invalid email
        let requestData: DecryptedFlowRequest = {
          version: '3.0',
          action: 'data_exchange',
          screen: 'EMAIL_FORM',
          flow_token: 'validation-token',
          data: { email: 'invalid-email' },
        };
        let encrypted = encryptRequest(requestData, publicKey);
        let response = await request(app).post('/flow').send(encrypted.body).expect(200);
        let decrypted = decryptResponse(response.text, encrypted.aesKey, encrypted.iv) as any;

        expect(decrypted.screen).toBe('EMAIL_FORM');
        expect(decrypted.data.error_message).toBe('Please enter a valid email address');
        expect(decrypted.data.email).toBe('invalid-email');

        // Submit valid email
        requestData = {
          version: '3.0',
          action: 'data_exchange',
          screen: 'EMAIL_FORM',
          flow_token: 'validation-token',
          data: { email: 'valid@example.com' },
        };
        encrypted = encryptRequest(requestData, publicKey);
        response = await request(app).post('/flow').send(encrypted.body).expect(200);
        decrypted = decryptResponse(response.text, encrypted.aesKey, encrypted.iv) as any;

        expect(decrypted.screen).toBe('SUCCESS');
        expect(decrypted.data.extension_message_response.params.validated).toBe(true);
      });
    });
  });

  describe('FlowResponseBuilder', () => {
    it('should build goToScreen response', () => {
      const builder = new FlowResponseBuilder('token-123');
      const response = builder.goToScreen('SCREEN_1', { key: 'value' }).build() as any;

      expect(response.screen).toBe('SCREEN_1');
      expect(response.data.key).toBe('value');
    });

    it('should build close response', () => {
      const builder = new FlowResponseBuilder('token-123');
      const response = builder.close({ result: 'success' }).build() as any;

      expect(response.screen).toBe('SUCCESS');
      expect(response.data.extension_message_response.params.flow_token).toBe('token-123');
      expect(response.data.extension_message_response.params.result).toBe('success');
    });

    it('should add error message', () => {
      const builder = new FlowResponseBuilder('token-123');
      const response = builder
        .goToScreen('FORM', { field: 'value' })
        .withError('Invalid input')
        .build() as any;

      expect(response.screen).toBe('FORM');
      expect(response.data.field).toBe('value');
      expect(response.data.error_message).toBe('Invalid input');
    });

    it('should support method chaining', () => {
      const builder = new FlowResponseBuilder('token-123');
      const result = builder.goToScreen('SCREEN', {});

      expect(result).toBe(builder);
    });
  });

  describe('createFlowRequest', () => {
    it('should create FlowRequest from decrypted data', () => {
      const decrypted: DecryptedFlowRequest = {
        version: '3.0',
        action: 'data_exchange',
        screen: 'TEST_SCREEN',
        flow_token: 'test-token-abc',
        data: { name: 'John' },
      };

      const flowRequest = createFlowRequest(decrypted);

      expect(flowRequest.version).toBe('3.0');
      expect(flowRequest.action).toBe('data_exchange');
      expect(flowRequest.screen).toBe('TEST_SCREEN');
      expect(flowRequest.flowToken).toBe('test-token-abc');
      expect(flowRequest.data.name).toBe('John');
      expect(typeof flowRequest.respond).toBe('function');
    });

    it('should create respond method that returns FlowResponseBuilder', () => {
      const decrypted: DecryptedFlowRequest = {
        version: '3.0',
        action: 'INIT',
        flow_token: 'token-xyz',
        data: {},
      };

      const flowRequest = createFlowRequest(decrypted);
      const responseBuilder = flowRequest.respond();

      expect(responseBuilder).toBeInstanceOf(FlowResponseBuilder);
    });
  });
});
