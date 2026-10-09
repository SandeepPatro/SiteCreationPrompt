import { z } from 'zod';
import { LIMITS } from '../../shared/limits';
import { questionSchema } from '../../shared/questionSchema';
import { step1Schema } from '../../shared/step1Schema';
import { MAX_REGENERATIONS, type WizardState } from '../state/wizardReducer';

/** Bump the version (and key) whenever the persisted shape changes incompatibly. */
export const STORAGE_KEY = 'promptforge:v1';

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** localStorage, or null when it's unavailable (private mode, disabled cookies, SSR…). */
function defaultStore(): KeyValueStore | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/*
 * Persisted data is untrusted (old versions, manual edits, other tabs): validate the shape.
 * Drafts are allowed to be incomplete, so Step 1 form fields are only checked structurally.
 */
const text = z.string().max(5_000);
const formRows = z.array(z.object({ value: text })).max(50);
const persistedSchema = z.object({
  version: z.literal(1),
  phase: z.enum(['step1', 'loading', 'step2', 'step3']),
  step1Form: z.object({
    projectName: text,
    description: text,
    audience: text,
    projectType: text,
    features: formRows,
    outOfScope: formRows,
    stackMode: z.enum(['recommend', 'preferences']),
    stackNotes: text,
    experience: text,
  }),
  step1: step1Schema.nullable(),
  questions: z.array(questionSchema).max(LIMITS.maxQuestions).nullable(),
  questionsKey: z.string().nullable(),
  questionsSource: z.enum(['ai', 'fallback']).nullable(),
  notice: z.enum(['fallback_error', 'fallback_rate_limited', 'regenerate_failed']).nullable(),
  step2Answers: z.record(z.string(), z.union([text, z.array(text), z.boolean()])),
  regenCount: z.number().int().min(0).max(MAX_REGENERATIONS),
  regenerating: z.boolean(),
});

/** Restore saved progress, or null if there is none / it's unusable. Never throws. */
export function loadState(store: KeyValueStore | null = defaultStore()): WizardState | null {
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = persistedSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      store.removeItem(STORAGE_KEY);
      return null;
    }
    const { version, ...state } = parsed.data;
    // Repair impossible combinations instead of crashing (e.g. step3 without questions).
    if (state.phase !== 'step1' && !state.step1) state.phase = 'step1';
    if ((state.phase === 'step2' || state.phase === 'step3') && !state.questions) {
      state.phase = 'step1';
    }
    return state;
  } catch {
    return null;
  }
}

export function saveState(state: WizardState, store: KeyValueStore | null = defaultStore()): void {
  try {
    store?.setItem(STORAGE_KEY, JSON.stringify({ version: 1, ...state }));
  } catch {
    // Quota exceeded / storage disabled: the app keeps working without persistence.
  }
}

export function clearState(store: KeyValueStore | null = defaultStore()): void {
  try {
    store?.removeItem(STORAGE_KEY);
  } catch {
    // Ignore — see saveState.
  }
}
