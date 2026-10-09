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
    <section className="rounded-card border-line bg-surface border shadow-sm">
      <div className="border-line border-b px-4 py-3 sm:px-6">{progress}</div>
      <AnimatedHeight>
        <div key={stepKey} className="animate-step-in px-4 py-6 motion-reduce:animate-none sm:px-6">
          {children}
        </div>
      </AnimatedHeight>
      <div className="border-line flex items-center justify-between gap-3 border-t px-4 py-3 sm:px-6">
        {footer}
      </div>
    </section>
  );
}
