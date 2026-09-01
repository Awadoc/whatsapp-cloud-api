import { resolveRecipient, Phone, UserId } from '../src/recipient';

let lastPost: { url: string; data: any } | undefined;

jest.mock('axios', () => {
  const client = () => ({
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    post: jest.fn((url: string, data: any) => {
      lastPost = { url, data };
      return Promise.resolve({
        data: {
          messaging_product: 'whatsapp',
          contacts: [{ input: data?.to ?? data?.recipient }],
          messages: [{ id: 'wamid.test' }],
        },
      });
    }),
    get: jest.fn(),
    delete: jest.fn(),
    defaults: { baseURL: '', headers: {} },
  });
  const mockAxios: any = jest.fn();
  mockAxios.create = jest.fn(client);
  return { __esModule: true, default: mockAxios };
});

// eslint-disable-next-line import/first, @typescript-eslint/no-var-requires
const { createBot } = require('../src/createBot');

describe('resolveRecipient', () => {
  it('plain string / Phone → { to }', () => {
    expect(resolveRecipient('234')).toEqual({ to: '234' });
    expect(resolveRecipient(Phone('234'))).toEqual({ to: '234' });
  });
  it('UserId → { recipient } with NO empty "to"', () => {
    const r = resolveRecipient(UserId('US.1'));
    expect(r).toEqual({ recipient: 'US.1' });
    expect('to' in r).toBe(false);
  });
});

describe('bot send methods', () => {
  const bot = createBot('PID', 'TOKEN');

  beforeEach(() => { lastPost = undefined; });

  it('sendText to a BSUID omits "to" and sets "recipient"', async () => {
    await bot.sendText(UserId('US.9'), 'hi');
    expect(lastPost?.data.recipient).toBe('US.9');
    expect(lastPost?.data.to).toBeUndefined();
  });

  it('sendReaction builds a reaction payload', async () => {
    await bot.sendReaction('234', 'wamid.1', '👍');
    expect(lastPost?.data).toMatchObject({
      type: 'reaction',
      reaction: { message_id: 'wamid.1', emoji: '👍' },
    });
  });

  it('sendReaction with no emoji removes a reaction', async () => {
    await bot.sendReaction('234', 'wamid.1');
    expect(lastPost?.data.reaction.emoji).toBe('');
  });

  it('sendRequestContactInfo builds the interactive payload', async () => {
    await bot.sendRequestContactInfo('234', 'Share your number?');
    expect(lastPost?.data.interactive).toMatchObject({
      type: 'request_contact_info',
      action: { name: 'request_contact_info' },
      body: { text: 'Share your number?' },
    });
  });

  it('markAsRead(id) sends status:read, no typing', async () => {
    await bot.markAsRead('wamid.1');
    expect(lastPost?.data).toMatchObject({ status: 'read', message_id: 'wamid.1' });
    expect(lastPost?.data.typing_indicator).toBeUndefined();
    expect(lastPost?.data.recipient_type).toBeUndefined();
  });

  it('markAsRead(id, true) adds the typing indicator', async () => {
    await bot.markAsRead('wamid.1', true);
    expect(lastPost?.data.typing_indicator).toEqual({ type: 'text' });
  });

  it('markAsRead(id, "read", { type: "text" }) legacy form still works', async () => {
    await bot.markAsRead('wamid.1', 'read', { type: 'text' });
    expect(lastPost?.data.typing_indicator).toEqual({ type: 'text' });
  });
});

describe('bot.templates without a wabaId', () => {
  it('throws a helpful error', async () => {
    const bot = createBot('PID', 'TOKEN');
    await expect(bot.templates.list()).rejects.toThrow(/wabaId/);
  });
});
