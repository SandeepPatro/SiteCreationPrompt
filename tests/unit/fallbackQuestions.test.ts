import { describe, expect, it } from 'vitest';
import { LIMITS } from '../../shared/limits';
import { questionSchema } from '../../shared/questionSchema';
import { PROJECT_TYPES } from '../../shared/step1Schema';
import { selectFallbackQuestions } from '../../src/lib/fallbackQuestions';

describe('selectFallbackQuestions', () => {
  it.each(PROJECT_TYPES)('returns a valid question set for %s', (type) => {
    const questions = selectFallbackQuestions(type);
    expect(questions.length).toBeGreaterThanOrEqual(LIMITS.minQuestions);
    expect(questions.length).toBeLessThanOrEqual(LIMITS.maxQuestions);
    for (const q of questions) {
      const result = questionSchema.safeParse(q);
      expect(result.success, `${type}/${q.id}: ${result.error?.message}`).toBe(true);
    }
    const ids = questions.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tailors questions to the project type', () => {
    const ids = (type: (typeof PROJECT_TYPES)[number]) =>
      selectFallbackQuestions(type).map((q) => q.id);
    expect(ids('mobile')).toContain('platforms');
    expect(ids('extension')).toContain('browsers');
    expect(ids('api')).toContain('api_auth');
    expect(ids('web')).not.toEqual(ids('cli'));
  });
});
