// Shared form-control classes and aria helpers (kept out of fields.tsx so Fast Refresh works).

export const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-500 focus-visible:border-brand-600 focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-brand-600 aria-invalid:border-red-600 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400 dark:aria-invalid:border-red-400';

/** ids for a field's help and error text, plus the matching aria props for the control. */
export function describedBy(id: string, hasHelp: boolean, error?: string) {
  const ids = [hasHelp && `${id}-help`, error && `${id}-error`].filter(Boolean).join(' ');
  return {
    'aria-describedby': ids || undefined,
    'aria-invalid': error ? true : undefined,
  } as const;
}

export const radioTileClass =
  'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-300 px-3 py-2 has-checked:border-brand-600 has-checked:bg-brand-50 has-focus-visible:outline-2 has-focus-visible:outline-brand-600 dark:border-slate-600 dark:has-checked:border-brand-300 dark:has-checked:bg-slate-800';
