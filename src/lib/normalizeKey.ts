import type { Step1Answers } from '../../shared/step1Schema';

const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

/**
 * Cache key for "did Step 1 change?". Whitespace-only edits produce the same key,
 * so they don't trigger another (quota-spending) API call.
 */
export function normalizeKey(step1: Step1Answers): string {
  return JSON.stringify([
    squash(step1.projectName),
    squash(step1.description),
    squash(step1.audience),
    step1.projectType,
    step1.features.map(squash),
    step1.outOfScope.map(squash),
    step1.stack.mode === 'preferences' ? squash(step1.stack.notes) : null,
    step1.experience,
  ]);
}
