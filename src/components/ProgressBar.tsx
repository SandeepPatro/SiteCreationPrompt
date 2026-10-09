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
                <span aria-hidden="true" className="text-muted">
                  →
                </span>
              )}
              <span
                aria-hidden="true"
                className={`flex size-6 items-center justify-center rounded-full text-xs font-semibold ${
                  active
                    ? 'bg-accent text-on-accent'
                    : done
                      ? 'border-accent text-accent border'
                      : 'border-line text-muted border'
                }`}
              >
                {done ? '✓' : step}
              </span>
              <span className={active ? 'text-ink font-semibold' : 'text-muted'}>
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
