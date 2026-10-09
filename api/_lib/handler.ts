import {
  followupsRequestSchema,
  type FollowupsErrorCode,
  type FollowupsRequest,
  type FollowupsResponse,
} from '../../shared/followupsApi.js';
import { LIMITS } from '../../shared/limits.js';
import { normalizeQuestions } from '../../shared/normalizeQuestions.js';
import { UpstreamError } from './gemini.js';
import { clientIp, type RateLimiter } from './rateLimit.js';

export interface FollowupsDeps {
  generate: (request: FollowupsRequest) => Promise<unknown>;
  rateLimit: RateLimiter;
  model: () => string | undefined;
  /** Metadata only — never user answers. */
  log: (entry: Record<string, unknown>) => void;
  now?: () => number;
}

const NO_STORE = { 'cache-control': 'no-store' };

const json = (
  body: FollowupsResponse | { error: FollowupsErrorCode },
  status: number,
  headers = {},
) => Response.json(body, { status, headers: { ...NO_STORE, ...headers } });

/** Builds the POST /api/followups handler. Dependencies are injected so tests can fake them. */
export function createFollowupsHandler(deps: FollowupsDeps) {
  const now = deps.now ?? Date.now;

  return async function POST(request: Request): Promise<Response> {
    const started = now();
    const finish = (response: Response, error?: string) => {
      deps.log({
        event: 'followups',
        status: response.status,
        latencyMs: now() - started,
        model: deps.model(),
        ...(error && { error }),
      });
      return response;
    };

    // 1. Size cap (header first, then the real byte length — the header can lie or be absent).
    const declared = Number(request.headers.get('content-length') ?? 0);
    if (declared > LIMITS.maxBodyBytes) {
      return finish(json({ error: 'payload_too_large' }, 413), 'payload_too_large');
    }
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > LIMITS.maxBodyBytes) {
      return finish(json({ error: 'payload_too_large' }, 413), 'payload_too_large');
    }

    // 2. Validate.
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return finish(json({ error: 'bad_request' }, 400), 'invalid_json');
    }
    const parsed = followupsRequestSchema.safeParse(body);
    if (!parsed.success) return finish(json({ error: 'bad_request' }, 400), 'invalid_body');

    // 3. Rate limit (after validation, so malformed requests don't burn the user's quota).
    const limit = await deps.rateLimit(clientIp(request));
    if (!limit.success) {
      const retryAfter = Math.max(1, Math.ceil((limit.reset - now()) / 1000));
      return finish(
        json({ error: 'rate_limited' }, 429, { 'retry-after': String(retryAfter) }),
        'rate_limited',
      );
    }

    // 4. Gemini → 5. normalize. Any upstream problem is a 503 so the frontend shows fallbacks.
    try {
      const questions = normalizeQuestions(await deps.generate(parsed.data));
      if (!questions) {
        return finish(json({ error: 'upstream_unavailable' }, 503), 'invalid_output');
      }
      return finish(json({ questions }, 200));
    } catch (error) {
      const code = error instanceof UpstreamError ? error.code : 'unexpected';
      if (!(error instanceof UpstreamError)) {
        console.error('[followups] unexpected error', error instanceof Error ? error.name : error);
      }
      return finish(json({ error: 'upstream_unavailable' }, 503), code);
    }
  };
}
