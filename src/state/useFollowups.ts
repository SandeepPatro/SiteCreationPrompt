import { useEffect, type Dispatch } from 'react';
import { fetchFollowups } from '../lib/apiClient';
import { selectFallbackQuestions } from '../lib/fallbackQuestions';
import { normalizeKey } from '../lib/normalizeKey';
import type { WizardAction, WizardState } from './wizardReducer';

/**
 * Side effect for the loading phase: calls /api/followups and reports back.
 * Leaving the loading phase (Back, Start over) aborts the request.
 */
export function useFollowups(state: WizardState, dispatch: Dispatch<WizardAction>) {
  const { phase, step1, regenerating, questions } = state;

  useEffect(() => {
    if (phase !== 'loading' || !step1) return;
    const controller = new AbortController();
    const key = normalizeKey(step1);
    const avoid = regenerating ? questions?.map((q) => q.label) : undefined;

    void fetchFollowups(
      { step1, ...(regenerating && { regenerate: true, avoid }) },
      { signal: controller.signal },
    ).then((result) => {
      if (controller.signal.aborted) return;
      if (result.ok) {
        dispatch({ type: 'questionsLoaded', key, questions: result.questions });
      } else {
        dispatch({
          type: 'questionsFailed',
          key,
          reason: result.reason,
          fallback: selectFallbackQuestions(step1.projectType),
        });
      }
    });

    return () => controller.abort();
  }, [phase, step1, regenerating, questions, dispatch]);
}
