import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import PubSub from 'pubsub-js';
import { getExpressRoute } from '../src/express';
import { parseWebhookPayload } from '../src/webhook';
import { getRecipientIdentity } from '../src/recipient';

const phoneId = '123456789';

const baseWebhook = (changes: any) => ({
  object: 'whatsapp_business_account',
  entry: [{
    changes: [{
      value: { metadata: { phone_number_id: phoneId }, ...changes },
      ...(changes.field ? { field: changes.field } : {}),
    }],
  }],
});

const makeApp = (opts?: any) => {
  const app = express();
  app.use('/webhook', getExpressRoute(phoneId, { webhookVerifyToken: 'vt', ...opts }));
  return app;
};

beforeEach(() => {
  PubSub.clearAllSubscriptions();
  jest.clearAllMocks();
});

describe('HTTP status contract', () => {
  it('returns 200 (not 400) for a status-only webhook so Meta does not retry', async () => {
    const payload = baseWebhook({
      statuses: [{
        id: 'wamid.1', status: 'read', timestamp: '1', recipient_id: '234',
      }],
    });
    await request(makeApp()).post('/webhook').send(payload).expect(200);
  });

  it('returns 404 when the body has no "object" field at all', async () => {
    await request(makeApp()).post('/webhook').send({ entry: [] }).expect(404);
  });

  it('does not hard-fail on an unexpected "object" value (any truthy value passes through)', async () => {
    // Meta always sends `whatsapp_business_account`, but this library doesn't use the
    // exact value — only require it to be present, matching the pre-existing contract.
    await request(makeApp())
      .post('/webhook')
      .send({
        object: 'not-the-real-value',
        entry: [{ changes: [{ value: { messages: [], metadata: { phone_number_id: phoneId } } }] }],
      })
      .expect(200);
  });

  it('returns 200 for an empty entry list', async () => {
    await request(makeApp())
      .post('/webhook')
      .send({ object: 'whatsapp_business_account', entry: [] })
      .expect(200);
  });
});

describe('status events', () => {
  it.each(['sent', 'delivered', 'read', 'failed'] as const)(
    'publishes a "status" event for %s',
    (status) => new Promise<void>((done, fail) => {
      const app = makeApp();
      PubSub.subscribe(`bot-${phoneId}-status`, (_t, msg: any) => {
        try {
          expect(msg.data.status).toBe(status);
          expect(msg.data.recipient_user_id).toBe('US.123');
          expect(msg.from_user_id).toBe('US.123');
          done();
        } catch (e) { fail(e); }
      });
      const payload = baseWebhook({
        statuses: [{
          id: 'wamid.x',
          status,
          timestamp: '1',
          recipient_id: '234',
          recipient_user_id: 'US.123',
        }],
      });
      request(app).post('/webhook').send(payload).end(() => {});
    }),
  );
});

describe('edit + revoke webhooks', () => {
  it('publishes an "edit" event', () => new Promise<void>((done, fail) => {
    PubSub.subscribe(`bot-${phoneId}-edit`, (_t, msg: any) => {
      try {
        expect(msg.data.original_message_id).toBe('wamid.old');
        expect(msg.data.message.type).toBe('text');
        done();
      } catch (e) { fail(e); }
    });
    const payload = baseWebhook({
      contacts: [{ wa_id: '234', user_id: 'US.1' }],
      messages: [{
        from: '234',
        id: 'wamid.new',
        timestamp: '1',
        type: 'edit',
        edit: { original_message_id: 'wamid.old', message: { type: 'text', text: { body: 'fixed' } } },
      }],
    });
    request(makeApp()).post('/webhook').send(payload).end(() => {});
  }));

  it('publishes a "revoke" event', () => new Promise<void>((done, fail) => {
    PubSub.subscribe(`bot-${phoneId}-revoke`, (_t, msg: any) => {
      try {
        expect(msg.data.original_message_id).toBe('wamid.gone');
        done();
      } catch (e) { fail(e); }
    });
    const payload = baseWebhook({
      messages: [{
        from: '234',
        id: 'wamid.r',
        timestamp: '1',
        type: 'revoke',
        revoke: { original_message_id: 'wamid.gone' },
      }],
    });
    request(makeApp()).post('/webhook').send(payload).end(() => {});
  }));
});

describe('signature verification', () => {
  const secret = 'app_secret_123';
  const body = JSON.stringify(baseWebhook({
    statuses: [{
      id: 'w', status: 'read', timestamp: '1', recipient_id: '1',
    }],
  }));
  const sign = (b: string, s: string) => `sha256=${crypto.createHmac('sha256', s).update(b).digest('hex')}`;

  it('rejects a missing/invalid signature with 401', async () => {
    await request(makeApp({ appSecret: secret }))
      .post('/webhook')
      .set('content-type', 'application/json')
      .send(body)
      .expect(401);
  });

  it('accepts a valid signature', async () => {
    await request(makeApp({ appSecret: secret }))
      .post('/webhook')
      .set('content-type', 'application/json')
      .set('x-hub-signature-256', sign(body, secret))
      .send(body)
      .expect(200);
  });
});

describe('user_id_update (Meta 2026 shape)', () => {
  it('parses the nested user_id.previous/current shape', () => {
    const res = parseWebhookPayload({
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          field: 'user_id_update',
          value: {
            metadata: { phone_number_id: phoneId },
            user_id_update: [{
              wa_id: '234',
              user_id: { previous: 'US.old', current: 'US.new' },
            }],
          },
        }],
      }],
    }, phoneId);
    expect(res.status).toBe(200);
    expect(res.events[0].event).toBe('user_id_update');
    expect(res.events[0].payload.data).toMatchObject({
      previous: 'US.old', current: 'US.new', old_user_id: 'US.old', new_user_id: 'US.new',
    });
  });
});

describe('system user_changed_user_id', () => {
  it('publishes a system event with the new BSUID', () => new Promise<void>((done, fail) => {
    PubSub.subscribe(`bot-${phoneId}-system`, (_t, msg: any) => {
      try {
        expect(msg.data.type).toBe('user_changed_user_id');
        expect(msg.data.user_id).toBe('US.new');
        done();
      } catch (e) { fail(e); }
    });
    const payload = baseWebhook({
      messages: [{
        from: '234',
        id: 'w',
        timestamp: '1',
        type: 'system',
        system: { body: 'User changed', type: 'user_changed_user_id', user_id: 'US.new' },
      }],
    });
    request(makeApp()).post('/webhook').send(payload).end(() => {});
  }));
});

describe('getRecipientIdentity', () => {
  it('prefers phone when available', () => {
    const id = getRecipientIdentity({ wa_id: '234', user_id: 'US.1', username: 'jo' });
    expect(id).toMatchObject({
      primary: 'phone', key: 'US.1', phoneUnavailable: false, username: 'jo',
    });
    expect(id.replyTarget).toEqual({ kind: 'phone', value: '234' });
  });
  it('falls back to BSUID when phone is unavailable', () => {
    const id = getRecipientIdentity({ user_id: 'US.1' });
    expect(id).toMatchObject({ primary: 'bsuid', key: 'US.1', phoneUnavailable: true });
    expect(id.replyTarget).toEqual({ kind: 'user_id', value: 'US.1' });
  });
});

describe('multiple messages in one payload', () => {
  it('dispatches every message, not just the first', () => {
    const res = parseWebhookPayload(baseWebhook({
      contacts: [{ wa_id: '234' }],
      messages: [
        {
          from: '234', id: 'a', timestamp: '1', type: 'text', text: { body: 'one' },
        },
        {
          from: '234', id: 'b', timestamp: '2', type: 'text', text: { body: 'two' },
        },
      ],
    }), phoneId);
    expect(res.events).toHaveLength(2);
  });
});
