import { describe, expect, it } from 'vitest';
import { LIMITS } from '../../shared/limits';
import { GET } from '../../api/health';

describe('scaffold', () => {
  it('shares limits between api and frontend', async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, maxQuestions: LIMITS.maxQuestions });
  });
});
