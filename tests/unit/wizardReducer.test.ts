import { describe, expect, it } from 'vitest';
import type { Question } from '../../shared/questionSchema';
import type { Step1Answers } from '../../shared/step1Schema';
import { normalizeKey } from '../../src/lib/normalizeKey';
import { emptyStep1Form } from '../../src/lib/step1Form';
import {
  MAX_REGENERATIONS,
  initialWizardState,
  progressStep,
  wizardReducer,
  type Phase,
  type WizardAction,
  type WizardState,
} from '../../src/state/wizardReducer';

const answers: Step1Answers = {
  projectName: 'Plantly',
  description: 'Plant watering reminders',
  audience: 'Apartment dwellers',
  projectType: 'web',
  features: ['Add plants'],
  outOfScope: [],
  stack: { mode: 'recommend' },
  experience: 'beginner',
};
const key = normalizeKey(answers);
const form = { ...emptyStep1Form, projectName: 'Plantly' };

const aiQuestions: Question[] = [
  { id: 'accounts', type: 'boolean', label: 'Accounts?' },
  { id: 'channel', type: 'select', label: 'Channel?', options: ['Email', 'Push'] },
  { id: 'notes', type: 'text', label: 'Notes?' },
];
const fallback: Question[] = [
  { id: 'accounts', type: 'text', label: 'Accounts (text now)?' },
  { id: 'deadline', type: 'select', label: 'Deadline?', options: ['Soon', 'Later'] },
  { id: 'devices', type: 'multiselect', label: 'Devices?', options: ['Phone', 'Desktop'] },
];

const submit = (a: Step1Answers = answers): WizardAction => ({
  type: 'step1Submitted',
  form,
  answers: a,
});
const loaded = (questions = aiQuestions, k = key): WizardAction => ({
  type: 'questionsLoaded',
  key: k,
  questions,
});
const failed = (reason: 'error' | 'rate_limited' = 'error', k = key): WizardAction => ({
  type: 'questionsFailed',
  key: k,
  reason,
  fallback,
});

const apply = (...actions: WizardAction[]) =>
  actions.reduce<WizardState>(wizardReducer, initialWizardState);
const at = (phase: Phase): WizardState => ({ ...initialWizardState, phase, step1: answers });

describe('wizardReducer: navigation', () => {
  it('walks the happy path step1 → loading → step2 → step3', () => {
    const s = apply(submit(), loaded(), { type: 'step2Submitted', answers: { notes: 'hi' } });
    expect(s.phase).toBe('step3');
    expect(s.step2Answers).toEqual({ notes: 'hi' });
  });

  it('goes back one step, and from loading back to step1', () => {
    expect(wizardReducer(at('step3'), { type: 'back' }).phase).toBe('step2');
    expect(wizardReducer(at('step2'), { type: 'back' }).phase).toBe('step1');
    expect(wizardReducer(at('loading'), { type: 'back' }).phase).toBe('step1');
    expect(wizardReducer(at('step1'), { type: 'back' }).phase).toBe('step1');
  });

  it('keeps Step 1 form values when going back', () => {
    const s = apply(submit(), { type: 'back' });
    expect(s.phase).toBe('step1');
    expect(s.step1Form).toBe(form);
  });

  it('ignores actions that do not apply to the current phase', () => {
    expect(wizardReducer(at('step3'), submit()).phase).toBe('step3');
    expect(wizardReducer(at('loading'), { type: 'step2Submitted', answers: {} }).phase).toBe(
      'loading',
    );
    expect(wizardReducer(at('step1'), { type: 'step2Changed', answers: { a: 'b' } })).toEqual(
      at('step1'),
    );
  });

  it('start over resets everything from any phase', () => {
    const s = apply(submit(), loaded(), { type: 'regenerateRequested' });
    expect(wizardReducer(s, { type: 'startOver' })).toEqual(initialWizardState);
  });

  it('maps phases to progress steps', () => {
    const phases: Phase[] = ['step1', 'loading', 'step2', 'step3'];
    expect(phases.map(progressStep)).toEqual([1, 2, 2, 3]);
  });
});

describe('wizardReducer: questions', () => {
  it('stores AI questions with their cache key', () => {
    const s = apply(submit(), loaded());
    expect(s).toMatchObject({
      phase: 'step2',
      questions: aiQuestions,
      questionsKey: key,
      questionsSource: 'ai',
      notice: null,
    });
  });

  it('reuses questions without a new request when Step 1 is unchanged', () => {
    const s = apply(submit(), loaded(), { type: 'back' }, submit());
    expect(s.phase).toBe('step2'); // straight to step2, no loading phase
    expect(s.questions).toBe(aiQuestions);
  });

  it('treats whitespace-only edits as unchanged', () => {
    const s = apply(
      submit(),
      loaded(),
      { type: 'back' },
      submit({ ...answers, audience: ' Apartment   dwellers ' }),
    );
    expect(s.phase).toBe('step2');
  });

  it('fetches again when Step 1 changed, keeping compatible answers by id', () => {
    const changed = { ...answers, description: 'Something else' };
    let s = apply(submit(), loaded(), {
      type: 'step2Changed',
      answers: { accounts: true, channel: 'Email', notes: 'keep?' },
    });
    s = wizardReducer(s, { type: 'back' });
    s = wizardReducer(s, submit(changed));
    expect(s.phase).toBe('loading');
    s = wizardReducer(
      s,
      loaded(
        [aiQuestions[0]!, { id: 'other', type: 'text', label: 'Other?' }, aiQuestions[1]!],
        normalizeKey(changed),
      ),
    );
    expect(s.step2Answers).toEqual({ accounts: true, channel: 'Email' }); // 'notes' question is gone
  });

  it('drops answers whose question kept its id but changed type', () => {
    const s = apply(
      submit(),
      loaded(),
      { type: 'step2Changed', answers: { accounts: true } },
      { type: 'back' },
      submit({ ...answers, description: 'changed' }),
      failed('error', normalizeKey({ ...answers, description: 'changed' })),
    );
    expect(s.questionsSource).toBe('fallback');
    expect(s.step2Answers).toEqual({}); // 'accounts' is now a text question; a boolean doesn't fit
  });

  it('ignores responses for outdated Step 1 answers', () => {
    const s = apply(submit(), loaded(aiQuestions, 'some-old-key'));
    expect(s.phase).toBe('loading');
    expect(s.questions).toBeNull();
  });

  it('ignores a response that arrives after the user went back', () => {
    const s = apply(submit(), { type: 'back' }, loaded());
    expect(s.phase).toBe('step1');
    expect(s.questions).toBeNull();
  });
});

describe('wizardReducer: fallback', () => {
  it('shows fallback questions with an error notice when the API fails', () => {
    expect(apply(submit(), failed('error'))).toMatchObject({
      phase: 'step2',
      questions: fallback,
      questionsSource: 'fallback',
      notice: 'fallback_error',
    });
  });

  it('uses a rate-limit notice for 429s', () => {
    expect(apply(submit(), failed('rate_limited')).notice).toBe('fallback_rate_limited');
  });

  it('clears the notice once AI questions arrive', () => {
    const s = apply(submit(), failed(), { type: 'regenerateRequested' }, loaded());
    expect(s.notice).toBeNull();
    expect(s.questionsSource).toBe('ai');
  });
});

describe('wizardReducer: regenerate', () => {
  it(`allows at most ${MAX_REGENERATIONS} regenerations`, () => {
    let s = apply(submit(), loaded());
    for (let i = 0; i < MAX_REGENERATIONS; i++) {
      s = wizardReducer(s, { type: 'regenerateRequested' });
      expect(s).toMatchObject({ phase: 'loading', regenerating: true, regenCount: i + 1 });
      s = wizardReducer(s, loaded());
    }
    const blocked = wizardReducer(s, { type: 'regenerateRequested' });
    expect(blocked).toBe(s);
  });

  it('keeps the current questions if a regeneration fails', () => {
    const s = apply(submit(), loaded(), { type: 'regenerateRequested' }, failed());
    expect(s).toMatchObject({
      phase: 'step2',
      questions: aiQuestions,
      questionsSource: 'ai',
      notice: 'regenerate_failed',
      regenerating: false,
    });
  });
});
