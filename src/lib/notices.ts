import type { Step2Notice } from '../state/wizardReducer';

/** Step 2 notices, shown above the questions and announced via aria-live. */
export const NOTICE_TEXT: Record<Exclude<Step2Notice, null>, string> = {
  fallback_error: "Couldn't generate tailored questions — here are some standard ones.",
  fallback_rate_limited:
    "You've reached the hourly limit for tailored questions — here are some standard ones.",
  regenerate_failed: "Couldn't get new questions right now — you can keep these.",
};
