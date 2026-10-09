import { useEffect, useRef } from 'react';
import { clearState, saveState } from '../lib/storage';
import { initialWizardState, type WizardState } from './wizardReducer';

const DEBOUNCE_MS = 300;

function persist(state: WizardState) {
  // Start over returns the initial state object itself: nothing worth keeping.
  if (state === initialWizardState) clearState();
  else saveState(state);
}

/** Debounced save to localStorage, flushed immediately when the page is hidden or closed. */
export function useAutosave(state: WizardState) {
  const latest = useRef(state);

  useEffect(() => {
    latest.current = state;
    const timer = setTimeout(() => persist(state), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    const flush = () => persist(latest.current);
    window.addEventListener('pagehide', flush);
    return () => window.removeEventListener('pagehide', flush);
  }, []);
}
