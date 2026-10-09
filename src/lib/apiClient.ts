import { followupsResponseSchema, type FollowupsRequest } from '../../shared/followupsApi';
import type { Question } from '../../shared/questionSchema';

export const CLIENT_TIMEOUT_MS = 15_000;

export type FollowupsResult =
  { ok: true; questions: Question[] } | { ok: false; reason: 'rate_limited' | 'error' };

interface Options {
  /** Aborted when the user leaves the loading step. */
  signal?: AbortSignal;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/** POST /api/followups. Never throws: every failure becomes { ok: false } so the UI can fall back. */
export async function fetchFollowups(
  body: FollowupsRequest,
  { signal, timeoutMs = CLIENT_TIMEOUT_MS, fetchImpl = fetch }: Options = {},
): Promise<FollowupsResult> {
  const timeout = AbortSignal.timeout(timeoutMs);
  try {
    const response = await fetchImpl('/api/followups', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
    if (response.status === 429) return { ok: false, reason: 'rate_limited' };
    if (!response.ok) return { ok: false, reason: 'error' };
    // The network is untrusted too: re-validate before rendering anything.
    const parsed = followupsResponseSchema.safeParse(await response.json());
    return parsed.success
      ? { ok: true, questions: parsed.data.questions }
      : { ok: false, reason: 'error' };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
