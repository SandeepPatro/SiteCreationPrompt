import type { Question } from '../../shared/questionSchema';
import type { Step1Answers } from '../../shared/step1Schema';
import { normalizeKey } from '../lib/normalizeKey';
import { emptyStep1Form, type Step1FormValues } from '../lib/step1Form';
import { keepCompatibleAnswers, type Step2Answers } from '../lib/step2Answers';

/**
 * Wizard state machine: step1 → loading → step2 → step3.
 * Pure (no side effects) so it can be unit-tested. The API call lives in useFollowups.
 */
export type Phase = 'step1' | 'loading' | 'step2' | 'step3';

export const MAX_REGENERATIONS = 2;

/** Why Step 2 shows a notice above the questions. */
export type Step2Notice = 'fallback_error' | 'fallback_rate_limited' | 'regenerate_failed' | null;

export interface WizardState {
  phase: Phase;
  /** Raw form values, so going Back restores exactly what the user typed. */
  step1Form: Step1FormValues;
  /** Cleaned answers from the last successful Step 1 submit (null until then). */
  step1: Step1Answers | null;
  questions: Question[] | null;
  /** normalizeKey(step1) the current questions were generated for — the cache key. */
  questionsKey: string | null;
  questionsSource: 'ai' | 'fallback' | null;
  notice: Step2Notice;
  step2Answers: Step2Answers;
  regenCount: number;
  /** True while the current loading phase is a "Regenerate questions" request. */
  regenerating: boolean;
}

export type WizardAction =
  | { type: 'step1Submitted'; form: Step1FormValues; answers: Step1Answers }
  | { type: 'questionsLoaded'; key: string; questions: Question[] }
  | {
      type: 'questionsFailed';
      key: string;
      reason: 'error' | 'rate_limited';
      fallback: Question[];
    }
  | { type: 'regenerateRequested' }
  | { type: 'step2Changed'; answers: Step2Answers }
  | { type: 'step2Submitted'; answers: Step2Answers }
  | { type: 'back' }
  | { type: 'startOver' };

export const initialWizardState: WizardState = {
  phase: 'step1',
  step1Form: emptyStep1Form,
  step1: null,
  questions: null,
  questionsKey: null,
  questionsSource: null,
  notice: null,
  step2Answers: {},
  regenCount: 0,
  regenerating: false,
};

/** A response is only applied if we're still loading questions for the same Step 1 answers. */
function isCurrent(state: WizardState, key: string) {
  return state.phase === 'loading' && state.step1 !== null && normalizeKey(state.step1) === key;
}

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'step1Submitted': {
      if (state.phase !== 'step1') return state;
      const unchanged =
        state.questions !== null && normalizeKey(action.answers) === state.questionsKey;
      return {
        ...state,
        // Same answers as last time → reuse the questions, no API call.
        phase: unchanged ? 'step2' : 'loading',
        step1Form: action.form,
        step1: action.answers,
        regenerating: false,
      };
    }

    case 'questionsLoaded':
      if (!isCurrent(state, action.key)) return state; // stale (user went back / changed answers)
      return {
        ...state,
        phase: 'step2',
        questions: action.questions,
        questionsKey: action.key,
        questionsSource: 'ai',
        notice: null,
        step2Answers: keepCompatibleAnswers(action.questions, state.step2Answers),
        regenerating: false,
      };

    case 'questionsFailed': {
      if (!isCurrent(state, action.key)) return state;
      // A failed regeneration keeps the questions the user already has.
      if (state.regenerating && state.questions && state.questionsKey === action.key) {
        return { ...state, phase: 'step2', notice: 'regenerate_failed', regenerating: false };
      }
      return {
        ...state,
        phase: 'step2',
        questions: action.fallback,
        questionsKey: action.key,
        questionsSource: 'fallback',
        notice: action.reason === 'rate_limited' ? 'fallback_rate_limited' : 'fallback_error',
        step2Answers: keepCompatibleAnswers(action.fallback, state.step2Answers),
        regenerating: false,
      };
    }

    case 'regenerateRequested':
      if (state.phase !== 'step2' || state.regenCount >= MAX_REGENERATIONS) return state;
      return { ...state, phase: 'loading', regenerating: true, regenCount: state.regenCount + 1 };

    case 'step2Changed':
      return state.phase === 'step2' ? { ...state, step2Answers: action.answers } : state;

    case 'step2Submitted':
      return state.phase === 'step2'
        ? { ...state, phase: 'step3', step2Answers: action.answers }
        : state;

    case 'back':
      if (state.phase === 'loading' || state.phase === 'step2') {
        return { ...state, phase: 'step1', regenerating: false };
      }
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
