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

/**
 * Upstash REST credentials from the environment. Names differ depending on how Upstash was
 * connected (direct: UPSTASH_REDIS_REST_*, Vercel Marketplace: KV_REST_API_*).
 * `||`, not `??`: an empty variable (e.g. copied from .env.example) must fall through too.
 */
export function redisConfig(env: NodeJS.ProcessEnv = process.env) {
  const url = env.UPSTASH_REDIS_REST_URL?.trim() || env.KV_REST_API_URL?.trim();
  const token = env.UPSTASH_REDIS_REST_TOKEN?.trim() || env.KV_REST_API_TOKEN?.trim();
  return url && token ? { url, token } : null;
}

function getLimiter(): Ratelimit | null {
  if (limiter !== undefined) return limiter;
  const config = redisConfig();
  if (!config) {
    console.warn('[followups] Upstash not configured — rate limiting disabled');
    limiter = null;
  } else {
    limiter = new Ratelimit({
      redis: new Redis(config),
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
