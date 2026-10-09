import type { ReactNode } from 'react';

/** Step title. Receives focus on every step change (see App) so screen readers announce it. */
export function StepHeading({ children }: { children: ReactNode }) {
  return (
    <h2
      tabIndex={-1}
      data-step-heading
      className="font-display scroll-mt-4 text-xl font-bold tracking-tight outline-none sm:text-2xl"
    >
      {children}
    </h2>
  );
}
