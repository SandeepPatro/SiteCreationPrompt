import type { ReactNode } from 'react';
import { AnimatedHeight } from './AnimatedHeight';

interface CardProps {
  progress: ReactNode;
  footer: ReactNode;
  /** Changes on every step so the new content fades in. */
  stepKey: string;
  children: ReactNode;
}

export function Card({ progress, footer, stepKey, children }: CardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-4 py-3 sm:px-6 dark:border-slate-800">
        {progress}
      </div>
      <AnimatedHeight>
        <div key={stepKey} className="animate-step-in px-4 py-6 motion-reduce:animate-none sm:px-6">
          {children}
        </div>
      </AnimatedHeight>
      <div className="flex items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:px-6 dark:border-slate-800">
        {footer}
      </div>
    </section>
  );
}
