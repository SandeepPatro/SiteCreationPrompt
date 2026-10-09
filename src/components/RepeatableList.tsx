import type { KeyboardEvent } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import type { Step1FormValues } from '../lib/step1Form';
import { STEP1_LIMITS } from '../../shared/step1Schema';
import { Button } from './Button';
import { FieldError, FieldHelp } from './fields';
import { inputClass } from './fieldStyles';

interface RepeatableListProps {
  name: 'features' | 'outOfScope';
  label: string;
  itemLabel: string;
  help?: string;
  placeholder?: string;
  optional?: boolean;
}

/** A list of single-line text inputs with Add / Remove. Enter in a filled row adds a new row. */
export function RepeatableList({
  name,
  label,
  itemLabel,
  help,
  placeholder,
  optional,
}: RepeatableListProps) {
  const {
    register,
    control,
    setFocus,
    getValues,
    formState: { errors },
  } = useFormContext<Step1FormValues>();
  const { fields, append, remove } = useFieldArray({ control, name });
  const id = `step1-${name}`;
  const listError = errors[name]?.root?.message ?? errors[name]?.message;
  const canAdd = fields.length < STEP1_LIMITS.listItems;

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>, index: number) {
    if (e.key !== 'Enter') return;
    e.preventDefault(); // don't submit the whole step
    if (index === fields.length - 1) {
      if (canAdd && getValues(`${name}.${index}.value`).trim()) append({ value: '' });
    } else {
      setFocus(`${name}.${index + 1}.value`);
    }
  }

  function handleRemove(index: number) {
    remove(index);
    // Keep focus in the list instead of dropping it to <body>.
    requestAnimationFrame(() => setFocus(`${name}.${Math.max(0, index - 1)}.value`));
  }

  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 font-medium">
        {label}
        {optional && (
          <span className="font-normal text-slate-600 dark:text-slate-400"> (optional)</span>
        )}
      </legend>
      {help && <FieldHelp id={id}>{help}</FieldHelp>}
      <ul className="flex flex-col gap-2">
        {fields.map((field, index) => {
          const inputId = `${id}-${index}`;
          const rowError = errors[name]?.[index]?.value?.message;
          // The list-level error ("add at least one") is attached to the first row so it can be focused.
          const showsListError = index === 0 && Boolean(listError);
          const describedIds =
            [help && `${id}-help`, rowError && `${inputId}-error`, showsListError && `${id}-error`]
              .filter(Boolean)
              .join(' ') || undefined;
          return (
            <li key={field.id} className="flex flex-col gap-1">
              <div className="flex gap-2">
                <label htmlFor={inputId} className="sr-only">
                  {itemLabel} {index + 1}
                </label>
                <input
                  id={inputId}
                  type="text"
                  className={inputClass}
                  placeholder={index === 0 ? placeholder : undefined}
                  maxLength={STEP1_LIMITS.listItem}
                  aria-describedby={describedIds}
                  aria-invalid={rowError || showsListError ? true : undefined}
                  {...register(`${name}.${index}.value`)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                />
                <Button
                  variant="ghost"
                  className="shrink-0 px-3"
                  aria-label={`Remove ${itemLabel.toLowerCase()} ${index + 1}`}
                  disabled={fields.length === 1}
                  onClick={() => handleRemove(index)}
                >
                  <span aria-hidden="true">✕</span>
                </Button>
              </div>
              {rowError && <FieldError id={inputId} message={rowError} />}
            </li>
          );
        })}
      </ul>
      <FieldError id={id} message={listError} />
      <div>
        <Button
          variant="ghost"
          className="-ml-2 px-2"
          disabled={!canAdd}
          onClick={() => append({ value: '' })}
        >
          + Add {itemLabel.toLowerCase()}
        </Button>
      </div>
    </fieldset>
  );
}
