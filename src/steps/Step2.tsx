import type { FormEvent } from 'react';
import { Skeleton } from '../components/Skeleton';
import { StepHeading } from '../components/StepHeading';

export const STEP2_FORM_ID = 'step2-form';

// Placeholder shell — dynamic AI questions arrive in M5.
export function Step2({ loading, onSubmit }: { loading: boolean; onSubmit: () => void }) {
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!loading) onSubmit();
  }

  return (
    <form id={STEP2_FORM_ID} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <StepHeading>A few more questions</StepHeading>
      {loading ? (
        <>
          <p className="text-slate-600 dark:text-slate-300">Thinking about your project…</p>
          <Skeleton />
        </>
      ) : (
        <p className="text-slate-600 dark:text-slate-300">Follow-up questions go here.</p>
      )}
    </form>
  );
}
