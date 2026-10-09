/**
 * Live smoke test against the real Gemini API (costs one or two requests of free-tier quota).
 * Run: npm run smoke:api   — reads GEMINI_API_KEY / GEMINI_MODEL from .env.local.
 */
import { describe, expect, it } from 'vitest';
import { POST } from '../../api/followups';
import { followupsResponseSchema } from '../../shared/followupsApi';
import type { Step1Answers } from '../../shared/step1Schema';

const step1: Step1Answers = {
  projectName: 'Plantly',
  description: 'A web app that reminds people when to water their houseplants.',
  audience: 'Apartment dwellers with a few houseplants who keep forgetting to water them',
  projectType: 'web',
  features: ['Add plants with a watering interval', 'Dashboard of plants due today'],
  outOfScope: ['Social features'],
  stack: { mode: 'recommend' },
  experience: 'beginner',
};

const request = () =>
  new Request('http://localhost/api/followups', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-forwarded-for': '127.0.0.1' },
    body: JSON.stringify({ step1 }),
  });

const hasKey = Boolean(process.env.GEMINI_API_KEY);

describe.skipIf(!hasKey)(`live /api/followups (model: ${process.env.GEMINI_MODEL})`, () => {
  it('returns valid tailored questions', { timeout: 20_000 }, async () => {
    const started = Date.now();
    const res = await POST(request());
    const body: unknown = await res.json();
    console.log(
      `status ${res.status} in ${Date.now() - started} ms\n`,
      JSON.stringify(body, null, 2),
    );
    expect(res.status).toBe(200);
    expect(followupsResponseSchema.safeParse(body).success).toBe(true);
  });

  it('maps an unknown model to 503', { timeout: 20_000 }, async () => {
    const original = process.env.GEMINI_MODEL;
    process.env.GEMINI_MODEL = 'gemini-model-that-does-not-exist';
    try {
      const res = await POST(request());
      expect(res.status).toBe(503);
    } finally {
      process.env.GEMINI_MODEL = original;
    }
  });
});

it.runIf(!hasKey)('skipped: no GEMINI_API_KEY in .env.local', () => {
  console.warn('Add GEMINI_API_KEY and GEMINI_MODEL to .env.local to run the live smoke test.');
});
