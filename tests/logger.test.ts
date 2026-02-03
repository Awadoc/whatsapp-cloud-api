import { DebugLogger } from '../src/utils/logger';

describe('DebugLogger', () => {
  const originalEnv = process.env;
  let consoleLogSpy: jest.SpyInstance;
  let consoleDirSpy: jest.SpyInstance;
  // let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleDirSpy = jest.spyOn(console, 'dir').mockImplementation(() => {});
    // consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  it('should not log when env var is not set', () => {
    delete process.env.DEBUG_WHATSAPP_CLOUD_API;
    DebugLogger.logIncomingWebhook({});
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('should log when env var is "true"', () => {
    process.env.DEBUG_WHATSAPP_CLOUD_API = 'true';
    const payload = { test: 'data' };
    DebugLogger.logIncomingWebhook(payload);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Incoming Webhook]'),
    );
    expect(consoleDirSpy).toHaveBeenCalledWith(payload, expect.anything());
  });

  it('should log outgoing requests', () => {
    process.env.DEBUG_WHATSAPP_CLOUD_API = 'true';
    const req = { method: 'post', url: '/test', data: { foo: 'bar' } };
    DebugLogger.logOutgoingRequest(req);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Outgoing Request] POST /test'),
    );
    expect(consoleDirSpy).toHaveBeenCalledWith(req.data, expect.anything());
  });
});
