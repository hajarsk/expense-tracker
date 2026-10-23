import { ExecutionContext } from '@nestjs/common';
import { DemoRateLimitGuard } from './demo-rate-limit.guard';

function makeContext(
  method: string,
  clientIp: string,
  forwardedFor = '198.51.100.99',
): ExecutionContext {
  const request = {
    method,
    headers: {
      'cf-connecting-ip': clientIp,
      'x-forwarded-for': forwardedFor,
    },
    ip: '127.0.0.1',
    socket: { remoteAddress: '127.0.0.1' },
  };
  const response = { setHeader: jest.fn() };
  return {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  } as unknown as ExecutionContext;
}

describe('DemoRateLimitGuard', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    process.env.NODE_ENV = 'production';
  });

  afterAll(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it('shares the write bucket across methods and ignores X-Forwarded-For', () => {
    const guard = new DemoRateLimitGuard();
    for (let index = 0; index < 15; index += 1) {
      expect(
        guard.canActivate(
          makeContext(
            index % 2 === 0 ? 'POST' : 'PATCH',
            '203.0.113.7',
            `192.0.2.${index}`,
          ),
        ),
      ).toBe(true);
    }

    expect(() =>
      guard.canActivate(makeContext('DELETE', '203.0.113.7', '192.0.2.200')),
    ).toThrow('writes request limit');
  });

  it('keeps separate buckets for separate Cloudflare client IP values', () => {
    const guard = new DemoRateLimitGuard();
    for (let index = 0; index < 15; index += 1) {
      guard.canActivate(makeContext('POST', '203.0.113.7'));
    }

    expect(guard.canActivate(makeContext('POST', '203.0.113.8'))).toBe(true);
  });

  it('enforces the overall 120-request bucket for each client IP', () => {
    const guard = new DemoRateLimitGuard();
    for (let index = 0; index < 120; index += 1) {
      expect(guard.canActivate(makeContext('GET', '203.0.113.9'))).toBe(true);
    }
    expect(() => guard.canActivate(makeContext('GET', '203.0.113.9'))).toThrow(
      'overall request limit',
    );
  });

  it('rejects missing or invalid production client IP headers', () => {
    const guard = new DemoRateLimitGuard();
    expect(() => guard.canActivate(makeContext('GET', 'not-an-ip'))).toThrow(
      'A valid client IP could not be determined',
    );
  });
});
