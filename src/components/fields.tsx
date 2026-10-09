import type { ReactNode } from 'react';

export function FieldLabel({
  htmlFor,
  optional,
  children,
}: {
  htmlFor: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="font-medium">
      {children}
      {optional && <span className="text-muted font-normal"> (optional)</span>}
    </label>
  );
}

export function FieldHelp({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={`${id}-help`} className="text-muted text-sm">
      {children}
    </p>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={`${id}-error`} className="text-sm font-medium text-red-700 dark:text-red-400">
      {message}
    </p>
  );
}

/** Label + help + control + error, stacked. */
export function Field({
  id,
  label,
  help,
  error,
  optional,
  children,
}: {
  id: string;
  label: ReactNode;
  help?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel htmlFor={id} optional={optional}>
        {label}
      </FieldLabel>
      {help && <FieldHelp id={id}>{help}</FieldHelp>}
      {children}
      <FieldError id={id} message={error} />
    </div>
  );
}

/** A radio group: <fieldset> + <legend>, options laid out as selectable tiles. */
export function RadioGroup({
  id,
  legend,
  help,
  error,
  columns = 'sm:grid-cols-2',
  children,
}: {
  id: string;
  legend: ReactNode;
  help?: ReactNode;
  error?: string;
  columns?: string;
  children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 font-medium">{legend}</legend>
      {help && <FieldHelp id={id}>{help}</FieldHelp>}
      <div className={`grid grid-cols-1 gap-2 ${columns}`}>{children}</div>
      <FieldError id={id} message={error} />
    </fieldset>
  );
}
