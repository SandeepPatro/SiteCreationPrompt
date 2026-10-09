import { describe, expect, it } from 'vitest';
import type { Step1Answers } from '../../shared/step1Schema';
import { emptyStep1Form } from '../../src/lib/step1Form';
import { STORAGE_KEY, clearState, loadState, saveState } from '../../src/lib/storage';
import { initialWizardState, wizardReducer, type WizardState } from '../../src/state/wizardReducer';

function memoryStore(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

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

const midFlow: WizardState = {
  ...initialWizardState,
  phase: 'step3',
  step1Form: { ...emptyStep1Form, projectName: 'Plantly' },
  step1,
  questions: [{ id: 'a', type: 'boolean', label: 'A?' }],
  questionsKey: 'key',
  questionsSource: 'ai',
  step2Answers: { a: true },
  regenCount: 1,
};

describe('storage', () => {
  it('round-trips the wizard state, including the regeneration count', () => {
    const store = memoryStore();
    saveState(midFlow, store);
    expect(loadState(store)).toEqual(midFlow);
  });

  it('keeps incomplete Step 1 drafts', () => {
    const store = memoryStore();
    const draft = wizardReducer(initialWizardState, {
      type: 'step1Changed',
      form: { ...emptyStep1Form, projectName: 'Half-typed' },
    });
    saveState(draft, store);
    expect(loadState(store)?.step1Form.projectName).toBe('Half-typed');
  });

  it('returns null and removes data that is corrupt or from another version', () => {
    for (const raw of [
      '{not json',
      '"hello"',
      JSON.stringify({ version: 2 }),
      JSON.stringify({ ...midFlow, version: 1, regenCount: 99 }),
    ]) {
      const store = memoryStore({ [STORAGE_KEY]: raw });
      expect(loadState(store)).toBeNull();
    }
    const store = memoryStore({ [STORAGE_KEY]: JSON.stringify({ version: 1, phase: 'step2' }) });
    loadState(store);
    expect(store.data.has(STORAGE_KEY)).toBe(false);
  });

  it('rejects malicious question data (validated like API output)', () => {
    const tampered = {
      ...midFlow,
      version: 1,
      questions: [{ id: 'x', type: 'select', label: 'X', options: [] }],
    };
    expect(loadState(memoryStore({ [STORAGE_KEY]: JSON.stringify(tampered) }))).toBeNull();
  });

  it('repairs impossible phases instead of crashing', () => {
    const noStep1 = memoryStore();
    saveState({ ...midFlow, step1: null }, noStep1);
    expect(loadState(noStep1)?.phase).toBe('step1');

    const noQuestions = memoryStore();
    saveState({ ...midFlow, questions: null }, noQuestions);
    expect(loadState(noQuestions)?.phase).toBe('step1');
  });

  it('works when storage is unavailable or throws', () => {
    expect(loadState(null)).toBeNull();
    expect(() => saveState(midFlow, null)).not.toThrow();
    const broken = {
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    expect(loadState(broken)).toBeNull();
    expect(() => saveState(midFlow, broken)).not.toThrow();
    expect(() => clearState(broken)).not.toThrow();
  });

  it('clears saved progress', () => {
    const store = memoryStore();
    saveState(midFlow, store);
    clearState(store);
    expect(loadState(store)).toBeNull();
  });
});
