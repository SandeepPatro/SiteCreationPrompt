import { describe, expect, it } from 'vitest';
import type { Step1Answers } from '../../shared/step1Schema';
import { emptyStep1Form } from '../../src/lib/step1Form';
import {
  initialWizardState,
  progressStep,
  wizardReducer,
  type Phase,
  type WizardAction,
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
const form = { ...emptyStep1Form, projectName: 'Plantly' };
const submit: WizardAction = { type: 'step1Submitted', form, answers };

const at = (phase: Phase) => ({ ...initialWizardState, phase });
const run = (phase: Phase, action: WizardAction) => wizardReducer(at(phase), action).phase;

describe('wizardReducer', () => {
  it('walks the happy path step1 → loading → step2 → step3', () => {
    expect(run('step1', submit)).toBe('loading');
    expect(run('loading', { type: 'questionsLoaded' })).toBe('step2');
    expect(run('step2', { type: 'step2Submitted' })).toBe('step3');
  });

  it('stores raw form values and cleaned answers on Step 1 submit', () => {
    const next = wizardReducer(initialWizardState, submit);
    expect(next.step1Form).toBe(form);
    expect(next.step1).toBe(answers);
  });

  it('keeps Step 1 data when going back', () => {
    const loading = wizardReducer(initialWizardState, submit);
    const back = wizardReducer(loading, { type: 'back' });
    expect(back.phase).toBe('step1');
    expect(back.step1Form).toBe(form);
  });

  it('goes back one step, and from loading back to step1', () => {
    expect(run('step3', { type: 'back' })).toBe('step2');
    expect(run('step2', { type: 'back' })).toBe('step1');
    expect(run('loading', { type: 'back' })).toBe('step1');
    expect(run('step1', { type: 'back' })).toBe('step1');
  });

  it('ignores actions that do not apply to the current phase', () => {
    expect(run('step1', { type: 'questionsLoaded' })).toBe('step1');
    expect(run('step3', submit)).toBe('step3');
    expect(run('loading', { type: 'step2Submitted' })).toBe('loading');
  });

  it('start over resets from any phase', () => {
    for (const phase of ['step1', 'loading', 'step2', 'step3'] as const) {
      expect(wizardReducer(at(phase), { type: 'startOver' })).toEqual(initialWizardState);
    }
  });

  it('maps phases to progress steps', () => {
    const phases: Phase[] = ['step1', 'loading', 'step2', 'step3'];
    expect(phases.map(progressStep)).toEqual([1, 2, 2, 3]);
  });
});
