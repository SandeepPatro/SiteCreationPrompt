import { createHash } from 'node:crypto';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimitResult {
  success: boolean;
  /** Unix ms when the window resets. */
  reset: number;
}
export type RateLimiter = (ip: string) => Promise<RateLimitResult>;

let limiter: Ratelimit | null | undefined;

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;
  // Names differ depending on how Upstash was connected (direct vs Vercel Marketplace).
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (!url || !token) {
    console.warn('[followups] Upstash not configured — rate limiting disabled');
    limiter = null;
  } else {
    limiter = new Ratelimit({
      redis: new Redis({ url, token }),
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      prefix: 'promptforge:followups',
    });
  }
  return limiter;
}

/** Salted hash so raw IP addresses never reach Redis. */
export function hashIp(ip: string): string {
  const salt = process.env.RATE_LIMIT_SALT ?? '';
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);
}

/** 10 requests per IP per hour. Fails open if Upstash is missing or down (Gemini quota is the backstop). */
export const upstashRateLimit: RateLimiter = async (ip) => {
  const rl = getLimiter();
  if (!rl) return { success: true, reset: 0 };
  try {
    const { success, reset } = await rl.limit(hashIp(ip));
    return { success, reset };
  } catch (error) {
    console.error('[followups] rate limiter error', error instanceof Error ? error.message : error);
    return { success: true, reset: 0 };
  }
};

/** Client IP as seen by Vercel's edge (first x-forwarded-for entry). */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'unknown';
}
