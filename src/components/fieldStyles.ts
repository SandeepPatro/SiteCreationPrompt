// Shared form-control classes and aria helpers (kept out of fields.tsx so Fast Refresh works).

export const inputClass =
  'w-full rounded-control border border-line bg-surface px-3 py-2 text-base text-ink placeholder:text-muted focus-visible:border-accent focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-accent aria-invalid:border-red-600 dark:aria-invalid:border-red-400';

/** ids for a field's help and error text, plus the matching aria props for the control. */
export function describedBy(id: string, hasHelp: boolean, error?: string) {
  const ids = [hasHelp && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ');
  return {
    'aria-describedby': ids || undefined,
    'aria-invalid': error ? true : undefined,
  } as const;
}

/** Selected tiles use ink (not accent): accent is reserved for primary actions and progress. */
export const radioTileClass =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-control border border-line bg-surface px-3 py-2 text-ink has-checked:border-ink has-checked:bg-ground has-checked:font-medium has-focus-visible:outline-2 has-focus-visible:outline-accent';

/** Native radio/checkbox colour. */
export const choiceInputClass = 'size-4 shrink-0 accent-ink';
