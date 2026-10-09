import { useFormContext } from 'react-hook-form';
import type { Question } from '../../shared/questionSchema';
import { STEP2_TEXT_MAX, type Step2FormValues } from '../lib/step2Answers';
import { describedBy, inputClass, radioTileClass } from './fieldStyles';
import { Field, RadioGroup } from './fields';

/**
 * Renders one follow-up question (AI or fallback). Labels/options are model output, so they
 * are only ever rendered as React text — never as HTML.
 */
export function DynamicField({ question }: { question: Question }) {
  const { register } = useFormContext<Step2FormValues>();
  const id = `q-${question.id}`;
  const hasHelp = Boolean(question.help);
  const aria = describedBy(id, hasHelp);

  switch (question.type) {
    case 'text':
      return (
        <Field id={id} label={question.label} help={question.help} optional>
          <input
            id={id}
            type="text"
            maxLength={STEP2_TEXT_MAX}
            className={inputClass}
            {...aria}
            {...register(question.id)}
          />
        </Field>
      );

    case 'textarea':
      return (
        <Field id={id} label={question.label} help={question.help} optional>
          <textarea
            id={id}
            rows={3}
            maxLength={STEP2_TEXT_MAX}
            className={inputClass}
            {...aria}
            {...register(question.id)}
          />
        </Field>
      );

    case 'select':
      return (
        <Field id={id} label={question.label} help={question.help} optional>
          <select id={id} className={inputClass} {...aria} {...register(question.id)}>
            <option value="">Choose an option…</option>
            {question.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      );

    case 'multiselect':
      return (
        <RadioGroup
          id={id}
          legend={<OptionalLegend label={question.label} hint="choose any" />}
          help={question.help}
        >
          {question.options.map((option) => (
            <label key={option} className={radioTileClass}>
              <input
                type="checkbox"
                value={option}
                className="accent-brand-600 size-4 shrink-0"
                {...aria}
                {...register(question.id)}
              />
              <span className="text-sm">{option}</span>
            </label>
          ))}
        </RadioGroup>
      );

    case 'boolean':
      return (
        <RadioGroup
          id={id}
          legend={<OptionalLegend label={question.label} />}
          help={question.help}
          columns="grid-cols-2"
        >
          {(['yes', 'no'] as const).map((value) => (
            <label key={value} className={radioTileClass}>
              <input
                type="radio"
                value={value}
                className="accent-brand-600 size-4 shrink-0"
                {...aria}
                {...register(question.id)}
              />
              <span className="text-sm">{value === 'yes' ? 'Yes' : 'No'}</span>
            </label>
          ))}
        </RadioGroup>
      );
  }
}

function OptionalLegend({ label, hint = 'optional' }: { label: string; hint?: string }) {
  return (
    <>
      {label}
      <span className="font-normal text-slate-600 dark:text-slate-400"> ({hint})</span>
    </>
  );
}
