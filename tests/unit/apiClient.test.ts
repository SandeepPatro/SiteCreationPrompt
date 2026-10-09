import { describe, expect, it, vi } from 'vitest';
import type { Step1Answers } from '../../shared/step1Schema';
import { fetchFollowups } from '../../src/lib/apiClient';
import { normalizeKey } from '../../src/lib/normalizeKey';

const step1: Step1Answers = {
  projectName: 'Plantly',
  description: 'Plant reminders',
  audience: 'Plant owners',
  projectType: 'web',
  features: ['Add plants'],
  outOfScope: [],
  stack: { mode: 'recommend' },
  experience: 'beginner',
};
const questions = [
  { id: 'a', type: 'text', label: 'A?' },
  { id: 'b', type: 'boolean', label: 'B?' },
  { id: 'c', type: 'select', label: 'C?', options: ['x', 'y'] },
];

const respond = (status: number, body: unknown) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe('fetchFollowups', () => {
  it('returns validated questions on success and posts the Step 1 answers', async () => {
    const fetchImpl = respond(200, { questions });
    expect(await fetchFollowups({ step1 }, { fetchImpl })).toEqual({ ok: true, questions });
    const [url, init] = vi.mocked(fetchImpl).mock.calls[0]!;
    expect(url).toBe('/api/followups');
    expect(JSON.parse(init!.body as string)).toEqual({ step1 });
  });

  it('maps 429 to rate_limited and other failures to error', async () => {
    expect(await fetchFollowups({ step1 }, { fetchImpl: respond(429, {}) })).toEqual({
      ok: false,
      reason: 'rate_limited',
    });
    for (const status of [400, 413, 500, 503]) {
      expect(await fetchFollowups({ step1 }, { fetchImpl: respond(status, {}) })).toEqual({
        ok: false,
        reason: 'error',
      });
    }
  });

  it('rejects a 200 whose body does not match the schema', async () => {
    const bad = [{ id: 'x', type: 'select', label: 'No options' }];
    expect(
      await fetchFollowups({ step1 }, { fetchImpl: respond(200, { questions: bad }) }),
    ).toEqual({ ok: false, reason: 'error' });
    const notJson = vi.fn(async () => new Response('<html>', { status: 200 }));
    expect(await fetchFollowups({ step1 }, { fetchImpl: notJson as typeof fetch })).toEqual({
      ok: false,
      reason: 'error',
    });
  });

  it('gives up after the timeout and on network errors', async () => {
    const hang = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) =>
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason)),
        ),
    ) as unknown as typeof fetch;
    expect(await fetchFollowups({ step1 }, { fetchImpl: hang, timeoutMs: 20 })).toEqual({
      ok: false,
      reason: 'error',
    });
    const offline = vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    expect(await fetchFollowups({ step1 }, { fetchImpl: offline })).toEqual({
      ok: false,
      reason: 'error',
    });
  });
});

describe('normalizeKey', () => {
  it('ignores whitespace differences but not content changes', () => {
    const spaced = { ...step1, projectName: '  Plantly ', features: ['Add   plants'] };
    expect(normalizeKey(spaced)).toBe(normalizeKey(step1));
    expect(normalizeKey({ ...step1, projectName: 'Plantly 2' })).not.toBe(normalizeKey(step1));
    expect(normalizeKey({ ...step1, experience: 'senior' })).not.toBe(normalizeKey(step1));
  });
});
