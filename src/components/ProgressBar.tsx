const STEPS = ['Project', 'Details', 'Prompt'] as const;

export function ProgressBar({ current }: { current: 1 | 2 | 3 }) {
  return (
    <nav aria-label="Progress">
      <ol className="flex items-center gap-2 text-sm">
        {STEPS.map((label, i) => {
          const step = i + 1;
          const done = step < current;
          const active = step === current;
          return (
            <li
              key={label}
              className="flex items-center gap-2"
              aria-current={active ? 'step' : undefined}
            >
              {i > 0 && (
                <span aria-hidden="true" className="text-slate-400 dark:text-slate-500">
                  →
                </span>
              )}
              <span
                aria-hidden="true"
                className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                  active
                    ? 'bg-brand-600 text-white'
                    : done
                      ? 'bg-brand-50 text-brand-700 dark:bg-slate-700 dark:text-white'
                      : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {done ? '✓' : step}
              </span>
              <span
                className={
                  active
                    ? 'font-semibold text-slate-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-300'
                }
              >
                {label}
                {done && <span className="sr-only"> (completed)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
