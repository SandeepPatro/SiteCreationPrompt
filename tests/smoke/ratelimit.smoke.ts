/**
 * Live check of the Upstash rate limiter (no Gemini calls).
 * Run: npm run smoke:api — needs KV_REST_API_URL / KV_REST_API_TOKEN (or UPSTASH_*) in .env.local.
 */
import { describe, expect, it } from 'vitest';
import { upstashRateLimit } from '../../api/_lib/rateLimit';

const configured = Boolean(process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL);

describe.skipIf(!configured)('live Upstash rate limit', () => {
  it('allows 10 requests per hour per IP, then blocks', { timeout: 30_000 }, async () => {
    const ip = `smoke-test-${Date.now()}-${Math.random()}`; // fresh identity each run
    const results = [];
    for (let i = 0; i < 11; i++) results.push(await upstashRateLimit(ip));
    console.log('success flags:', results.map((r) => r.success).join(' '));
    expect(results.slice(0, 10).every((r) => r.success)).toBe(true);
    expect(results[10]?.success).toBe(false);
    expect(results[10]?.reset).toBeGreaterThan(Date.now());
  });
});
