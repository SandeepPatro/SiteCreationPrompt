import type { FormEvent } from 'react';
import { StepHeading } from '../components/StepHeading';

export const STEP1_FORM_ID = 'step1-form';

// Placeholder shell — the real form (fields, validation) arrives in M3.
export function Step1({ onSubmit }: { onSubmit: () => void }) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form id={STEP1_FORM_ID} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <StepHeading>Tell us about your project</StepHeading>
      <p className="text-slate-600 dark:text-slate-300">Project questions go here.</p>
    </form>
  );
}
