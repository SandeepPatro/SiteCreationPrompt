import type { Step1Answers } from '../../shared/step1Schema';
import { emptyStep1Form, type Step1FormValues } from '../lib/step1Form';

/**
 * Wizard state machine: step1 → loading → step2 → step3.
 * Pure (no side effects) so it can be unit-tested; more data fields are added in later milestones.
 */
export type Phase = 'step1' | 'loading' | 'step2' | 'step3';

export interface WizardState {
  phase: Phase;
  /** Raw form values, so going Back restores exactly what the user typed. */
  step1Form: Step1FormValues;
  /** Cleaned answers from the last successful Step 1 submit (null until then). */
  step1: Step1Answers | null;
}

export type WizardAction =
  | { type: 'step1Submitted'; form: Step1FormValues; answers: Step1Answers }
  | { type: 'questionsLoaded' }
  | { type: 'step2Submitted' }
  | { type: 'back' }
  | { type: 'startOver' };

export const initialWizardState: WizardState = {
  phase: 'step1',
  step1Form: emptyStep1Form,
  step1: null,
};

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'step1Submitted':
      return state.phase === 'step1'
        ? { ...state, phase: 'loading', step1Form: action.form, step1: action.answers }
        : state;
    case 'questionsLoaded':
      // Ignore late responses, e.g. the user pressed Back while loading.
      return state.phase === 'loading' ? { ...state, phase: 'step2' } : state;
    case 'step2Submitted':
      return state.phase === 'step2' ? { ...state, phase: 'step3' } : state;
    case 'back':
      if (state.phase === 'loading' || state.phase === 'step2') return { ...state, phase: 'step1' };
      if (state.phase === 'step3') return { ...state, phase: 'step2' };
      return state;
    case 'startOver':
      return initialWizardState;
  }
}

/** Which of the 3 progress steps a phase belongs to. */
export function progressStep(phase: Phase): 1 | 2 | 3 {
  if (phase === 'step1') return 1;
  if (phase === 'step3') return 3;
  return 2;
}
