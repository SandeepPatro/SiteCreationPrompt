import { describe, expect, it } from 'vitest';
import {
  initialWizardState,
  progressStep,
  wizardReducer,
  type Phase,
  type WizardAction,
} from '../../src/state/wizardReducer';

const at = (phase: Phase) => ({ ...initialWizardState, phase });
const run = (phase: Phase, action: WizardAction) => wizardReducer(at(phase), action).phase;

describe('wizardReducer', () => {
  it('walks the happy path step1 → loading → step2 → step3', () => {
    expect(run('step1', { type: 'step1Submitted' })).toBe('loading');
    expect(run('loading', { type: 'questionsLoaded' })).toBe('step2');
    expect(run('step2', { type: 'step2Submitted' })).toBe('step3');
  });

  it('goes back one step, and from loading back to step1', () => {
    expect(run('step3', { type: 'back' })).toBe('step2');
    expect(run('step2', { type: 'back' })).toBe('step1');
    expect(run('loading', { type: 'back' })).toBe('step1');
    expect(run('step1', { type: 'back' })).toBe('step1');
  });

  it('ignores actions that do not apply to the current phase', () => {
    expect(run('step1', { type: 'questionsLoaded' })).toBe('step1');
    expect(run('step3', { type: 'step1Submitted' })).toBe('step3');
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
