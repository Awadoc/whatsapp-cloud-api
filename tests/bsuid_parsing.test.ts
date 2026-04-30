import express from 'express';
import request from 'supertest';
import PubSub from 'pubsub-js';
import { getExpressRoute } from '../src/express';
import { createBot } from '../src/createBot';
import { Message } from '../src/createBot.types';

// Mock axios with factory to ensure interceptors exist
jest.mock('axios', () => {
  // Helper to create a mock client with interceptors
  const createMockClient = () => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    post: jest.fn().mockResolvedValue({ data: {} }),
    defaults: { baseURL: '', headers: {} },
  });

  // Default export (axios function) needs to have create property
  const mockAxios: any = jest.fn();
  mockAxios.create = jest.fn(() => createMockClient());
  mockAxios.post = jest.fn().mockResolvedValue({ data: {} });
  return {
    __esModule: true,
    default: mockAxios,
  };
});

// Access the mocked axios for assertions
// const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BSUID Parsing & Handling', () => {
  const phoneId = '123456789';
  const token = 'secret_token';
  const webhookToken = 'webhook_token';
  let app: express.Application;
  let bot: ReturnType<typeof createBot>;

  beforeEach(() => {
    PubSub.clearAllSubscriptions();
    // Clear mock calls
    jest.clearAllMocks();

    app = express();
    bot = createBot(phoneId, token);
    app.use(
      '/webhook',
      getExpressRoute(phoneId, { webhookVerifyToken: webhookToken }),
    );
  });

  // Helper to create basic Webhook structure
  const baseWebhook = (changes: any) => ({
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: phoneId },
              ...changes,
            },
          },
        ],
      },
    ],
  });

  // 1. Parse all new fields correctly
  it('Exposes from_user_id from incoming messages', (done) => {
    const bsuid = 'user.abc123bsuid';
    const payload = baseWebhook({
      messages: [
        {
          from: '',
          id: 'wamid.123',
          timestamp: '1600000000',
          type: 'text',
          text: { body: 'Hello' },
          from_user_id: bsuid,
        },
      ],
      contacts: [
        {
          wa_id: '',
          user_id: bsuid,
        },
      ],
    });

    bot.on('message', (msg: Message) => {
      try {
        // @ts-ignore
        expect(msg.from_user_id).toBe(bsuid);
        expect(msg.from).toBe(''); // Can be empty now
        expect(msg.replyTarget).toEqual({ kind: 'user_id', value: bsuid });
        done();
      } catch (err) {
        done(err);
      }
    });

    request(app).post('/webhook').send(payload).expect(200)
      .catch(done);
  });

  // 2. Handle empty strings (breaking change!)
  it('Handles empty "from" field without breaking', (done) => {
    const payload = baseWebhook({
      messages: [
        {
          from: '', // Empty string
          id: 'wamid.123',
          timestamp: '1600000000',
          type: 'text',
          text: { body: 'Hello' },
          from_user_id: 'user.123',
        },
      ],
      contacts: [{ wa_id: '', user_id: 'user.123' }],
    });

    bot.on('message', (msg: Message) => {
      try {
        expect(msg.from).toBe(''); // Not undefined, not null
        // @ts-ignore
        expect(msg.from_user_id).toBeDefined();
        done();
      } catch (err) {
        done(err);
      }
    });

    request(app).post('/webhook').send(payload).expect(200)
      .catch(done);
  });

  // 3. Expose contact metadata
  it('Exposes username and country_code from contacts', (done) => {
    const payload = baseWebhook({
      messages: [
        {
          from: '',
          id: 'wamid.123',
          timestamp: '1600000000',
          type: 'text',
          text: { body: 'Hello' },
          from_user_id: 'user.123',
          contacts: [
            {
              // Some implementations might carry it here, but typically in 'contacts' array
              profile: { name: 'John Doe' },
            },
          ],
        },
      ],
      contacts: [
        {
          wa_id: '',
          user_id: 'user.123',
          profile: {
            name: 'John Doe',
            username: '@johndoe',
            country_code: 'US',
          },
        },
      ],
    });

    bot.on('message', (msg: Message) => {
      try {
        const fullMsg = msg as any;
        expect(fullMsg.contact?.profile?.username).toBe('@johndoe');
        expect(fullMsg.contact?.profile?.country_code).toBe('US');
        done();
      } catch (err) {
        done(err);
      }
    });

    request(app).post('/webhook').send(payload).expect(200)
      .catch(done);
  });

  // 4. Handle from_parent_user_id
  it('Exposes from_parent_user_id from incoming messages', (done) => {
    const parentBsuid = 'parent.123';
    const payload = baseWebhook({
      messages: [
        {
          from: '',
          id: 'wamid.123',
          timestamp: '1600000000',
          type: 'text',
          text: { body: 'Hello' },
          from_user_id: 'user.123',
          from_parent_user_id: parentBsuid,
        },
      ],
      contacts: [{ wa_id: '', user_id: 'user.123', parent_user_id: parentBsuid }],
    });

    bot.on('message', (msg: Message) => {
      try {
        expect(msg.from_parent_user_id).toBe(parentBsuid);
        expect(msg.replyTarget).toEqual({ kind: 'user_id', value: 'user.123' });
        done();
      } catch (err) {
        done(err);
      }
    });

    request(app).post('/webhook').send(payload).expect(200)
      .catch(done);
  });

  // 5. Missing wa_id in contact
  it('Handles missing wa_id in contact without crashing', (done) => {
    const payload = baseWebhook({
      messages: [
        {
          from: '',
          id: 'wamid.123',
          timestamp: '1600000000',
          type: 'text',
          text: { body: 'Hello' },
          from_user_id: 'user.123',
        },
      ],
      contacts: [{ user_id: 'user.123' }], // NO wa_id
    });

    bot.on('message', (msg: Message) => {
      try {
        expect(msg.from).toBe('');
        expect(msg.contact?.wa_id).toBeUndefined();
        done();
      } catch (err) {
        done(err);
      }
    });

    request(app).post('/webhook').send(payload).expect(200)
      .catch(done);
  });

  it('Computes Phone replyTarget when from is present', (done) => {
    const from = '1234567890';
    const payload = baseWebhook({
      messages: [
        {
          from,
          id: 'wamid.123',
          timestamp: '1600000000',
          type: 'text',
          text: { body: 'Hello' },
          from_user_id: 'user.123',
        },
      ],
      contacts: [{ wa_id: from, user_id: 'user.123' }],
    });

    bot.on('message', (msg: Message) => {
      try {
        expect(msg.from).toBe(from);
        expect(msg.replyTarget).toEqual({ kind: 'phone', value: from });
        done();
      } catch (err) {
        done(err);
      }
    });

    request(app).post('/webhook').send(payload).expect(200)
      .catch(done);
  });

  it('Publishes user_id_update event', (done) => {
    const oldId = 'old.123';
    const newId = 'new.123';
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          field: 'user_id_update',
          value: {
            messaging_product: 'whatsapp',
            metadata: { phone_number_id: phoneId },
            old_user_id: oldId,
            new_user_id: newId,
          },
        }],
      }],
    };

    bot.on('user_id_update', (msg) => {
      try {
        expect(msg.data.old_user_id).toBe(oldId);
        expect(msg.data.new_user_id).toBe(newId);
        done();
      } catch (err) {
        done(err);
      }
    });

    request(app).post('/webhook').send(payload).expect(200)
      .catch(done);
  });

  it('Publishes business_username_update event', (done) => {
    const bsuid = 'user.123';
    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          field: 'business_username_update',
          value: {
            messaging_product: 'whatsapp',
            metadata: { phone_number_id: phoneId },
            user_id: bsuid,
          },
        }],
      }],
    };

    bot.on('business_username_update', (msg) => {
      try {
        expect(msg.from_user_id).toBe(bsuid);
        done();
      } catch (err) {
        done(err);
      }
    });

    request(app).post('/webhook').send(payload).expect(200)
      .catch(done);
  });
});
