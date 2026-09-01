type Call = { method: string; url: string; data?: any; config?: any };
let calls: Call[] = [];

jest.mock('axios', () => {
  const respond = () => Promise.resolve({ data: { data: [], success: true } });
  const client = () => ({
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    get: jest.fn((url: string, config: any) => {
      calls.push({ method: 'GET', url, config });
      return Promise.resolve({
        data: {
          data: [{ username_suggestions: ['acme_shop'] }],
          username: 'acme',
          status: 'approved',
          message_template_namespace: 'ns_1',
        },
      });
    }),
    post: jest.fn((url: string, data: any) => {
      calls.push({ method: 'POST', url, data });
      return Promise.resolve({ data: { id: 't1', status: 'PENDING', success: true } });
    }),
    delete: jest.fn((url: string, config: any) => {
      calls.push({ method: 'DELETE', url, config });
      return respond();
    }),
    defaults: { baseURL: '', headers: {} },
  });
  const mockAxios: any = jest.fn();
  mockAxios.create = jest.fn(client);
  return { __esModule: true, default: mockAxios };
});

/* eslint-disable @typescript-eslint/no-var-requires, global-require */
const { createBot } = require('../src/createBot');
const { UserId } = require('../src/recipient');

beforeEach(() => { calls = []; });

describe('bot.templates', () => {
  const bot = createBot('PID', 'TOKEN', { wabaId: 'WABA' });

  it('list hits the WABA message_templates endpoint', async () => {
    await bot.templates.list({ status: 'APPROVED', limit: 10 });
    expect(calls[0]).toMatchObject({ method: 'GET', url: '/WABA/message_templates' });
    expect(calls[0].config.params).toMatchObject({ status: 'APPROVED', limit: 10 });
  });

  it('create posts the component payload', async () => {
    const res = await bot.templates.create({
      name: 'x', language: 'en_US', category: 'UTILITY', components: [{ type: 'BODY', text: 'hi' }],
    });
    expect(res).toMatchObject({ id: 't1', status: 'PENDING' });
    expect(calls[0]).toMatchObject({ method: 'POST', url: '/WABA/message_templates' });
  });

  it('namespace unwraps the field', async () => {
    expect(await bot.templates.namespace()).toBe('ns_1');
  });
});

describe('bot.username', () => {
  const bot = createBot('PID', 'TOKEN');

  it('get / set / remove target the phone-number username endpoint', async () => {
    await bot.username.get();
    await bot.username.set('acme_shop', 'force_transfer');
    await bot.username.remove();
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      'GET /PID/username',
      'POST /PID/username',
      'DELETE /PID/username',
    ]);
    expect(calls[1].data).toEqual({ username: 'acme_shop', transfer_action: 'force_transfer' });
  });

  it('suggestions unwraps the nested array', async () => {
    expect(await bot.username.suggestions()).toEqual(['acme_shop']);
  });
});

describe('bot.blockUsers', () => {
  const bot = createBot('PID', 'TOKEN');

  it('maps phone strings and BSUID targets to the right keys', async () => {
    await bot.blockUsers.block(['234', UserId('US.9')]);
    expect(calls[0]).toMatchObject({ method: 'POST', url: '/PID/block_users' });
    expect(calls[0].data.block_users).toEqual([{ user: '234' }, { user_id: 'US.9' }]);
  });
});

describe('bot.profile', () => {
  const bot = createBot('PID', 'TOKEN');

  it('update posts messaging_product + fields', async () => {
    await bot.profile.update({ about: 'hi' });
    expect(calls[0]).toMatchObject({
      method: 'POST',
      url: '/PID/whatsapp_business_profile',
      data: { messaging_product: 'whatsapp', about: 'hi' },
    });
  });
});
