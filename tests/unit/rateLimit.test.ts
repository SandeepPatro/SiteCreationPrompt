import { afterEach, describe, expect, it, vi } from 'vitest';
import { clientIp, hashIp, upstashRateLimit } from '../../api/_lib/rateLimit';

const req = (headers: Record<string, string>) => new Request('http://x/', { headers });

afterEach(() => vi.unstubAllEnvs());

describe('rate limit helpers', () => {
  it('reads the first x-forwarded-for entry, then x-real-ip', () => {
    expect(clientIp(req({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }))).toBe('1.2.3.4');
    expect(clientIp(req({ 'x-real-ip': '5.6.7.8' }))).toBe('5.6.7.8');
    expect(clientIp(req({}))).toBe('unknown');
  });

  it('hashes IPs with the salt so raw IPs never reach Redis', () => {
    vi.stubEnv('RATE_LIMIT_SALT', 'pepper');
    const hashed = hashIp('1.2.3.4');
    expect(hashed).toMatch(/^[0-9a-f]{32}$/);
    expect(hashed).not.toContain('1.2.3.4');
    expect(hashIp('1.2.3.4')).toBe(hashed);
    vi.stubEnv('RATE_LIMIT_SALT', 'other');
    expect(hashIp('1.2.3.4')).not.toBe(hashed);
  });

  it('allows requests when Upstash is not configured (local dev)', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const name of [
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN',
      'KV_REST_API_URL',
      'KV_REST_API_TOKEN',
    ]) {
      vi.stubEnv(name, undefined);
    }
    expect(await upstashRateLimit('1.2.3.4')).toEqual({ success: true, reset: 0 });
  });
});
