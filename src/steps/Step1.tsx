import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm, useWatch, type FieldErrors } from 'react-hook-form';
import {
  EXPERIENCE_LABELS,
  EXPERIENCE_LEVELS,
  PROJECT_TYPE_LABELS,
  PROJECT_TYPES,
  STEP1_LIMITS,
  type Step1Answers,
} from '../../shared/step1Schema';
import { RepeatableList } from '../components/RepeatableList';
import { describedBy, inputClass, radioTileClass } from '../components/fieldStyles';
import { StepHeading } from '../components/StepHeading';
import { Field, RadioGroup } from '../components/fields';
import { step1FormSchema, toStep1Answers, type Step1FormValues } from '../lib/step1Form';

export const STEP1_FORM_ID = 'step1-form';

interface Step1Props {
  defaultValues: Step1FormValues;
  /** Called on every edit with the raw draft, for autosave. */
  onChange: (form: Step1FormValues) => void;
  onSubmit: (form: Step1FormValues, answers: Step1Answers) => void;
}

/** Focus and scroll to the first invalid control in DOM (= visual) order. */
function focusFirstInvalid(form: HTMLFormElement | null) {
  // Wait one frame so React has rendered aria-invalid onto the fields.
  requestAnimationFrame(() => {
    const el = form?.querySelector<HTMLElement>('[aria-invalid="true"]');
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.focus({ preventScroll: true });
    el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  });
}

function countErrors(errors: FieldErrors<Step1FormValues>) {
  return Object.keys(errors).length;
}

export function Step1({ defaultValues, onChange, onSubmit }: Step1Props) {
  const methods = useForm<Step1FormValues>({
    resolver: zodResolver(step1FormSchema),
    defaultValues,
    shouldFocusError: false, // we focus in DOM order ourselves (field arrays/radios have no single ref)
  });
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = methods;
  const [errorSummary, setErrorSummary] = useState('');
  const stackMode = useWatch({ control, name: 'stackMode' });

  // Report drafts upward so they survive a refresh (see useAutosave).
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(
    () =>
      methods.subscribe({
        formState: { values: true },
        // Copy: RHF reuses its internal values object between updates.
        callback: ({ values }) => onChangeRef.current(structuredClone(values)),
      }),
    [methods],
  );

  const submit = handleSubmit(
    (values) => {
      setErrorSummary('');
      onSubmit(values, toStep1Answers(values));
    },
    (invalid) => {
      const n = countErrors(invalid);
      setErrorSummary(`Please fix ${n} highlighted ${n === 1 ? 'field' : 'fields'}.`);
      focusFirstInvalid(document.getElementById(STEP1_FORM_ID) as HTMLFormElement | null);
    },
  );

  return (
    <FormProvider {...methods}>
      <form id={STEP1_FORM_ID} onSubmit={submit} noValidate className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <StepHeading>Tell us about your project</StepHeading>
          <p className="text-muted">
            A few basics first. Plain language is fine — there are no wrong answers.
          </p>
        </div>

        <Field
          id="step1-projectName"
          label="Project name"
          help="A working title is fine."
          error={errors.projectName?.message}
        >
          <input
            id="step1-projectName"
            type="text"
            autoComplete="off"
            maxLength={STEP1_LIMITS.name}
            className={inputClass}
            placeholder="e.g. Plantly"
            {...describedBy('step1-projectName', true, errors.projectName?.message)}
            {...register('projectName')}
          />
        </Field>

        <Field
          id="step1-description"
          label="What are you building?"
          help="One or two sentences: what it does and the main problem it solves."
          error={errors.description?.message}
        >
          <textarea
            id="step1-description"
            rows={3}
            maxLength={STEP1_LIMITS.long}
            className={inputClass}
            placeholder="e.g. A web app that reminds people when to water their houseplants."
            {...describedBy('step1-description', true, errors.description?.message)}
            {...register('description')}
          />
        </Field>

        <Field
          id="step1-audience"
          label="Who is it for?"
          help="Describe your main users — who they are and what they need."
          error={errors.audience?.message}
        >
          <input
            id="step1-audience"
            type="text"
            maxLength={STEP1_LIMITS.short}
            className={inputClass}
            placeholder="e.g. Busy apartment dwellers with a few houseplants"
            {...describedBy('step1-audience', true, errors.audience?.message)}
            {...register('audience')}
          />
        </Field>

        <RadioGroup
          id="step1-projectType"
          legend="Project type"
          error={errors.projectType?.message}
          columns="grid-cols-2"
        >
          {PROJECT_TYPES.map((type) => (
            <label key={type} className={radioTileClass}>
              <input
                type="radio"
                value={type}
                className="accent-ink size-4 shrink-0"
                {...describedBy('step1-projectType', false, errors.projectType?.message)}
                {...register('projectType')}
              />
              <span className="text-sm">{PROJECT_TYPE_LABELS[type]}</span>
            </label>
          ))}
        </RadioGroup>

        <RepeatableList
          name="features"
          label="Must-have features for v1"
          itemLabel="Feature"
          help="The few things the first version can't ship without. Press Enter to add another."
          placeholder="e.g. Add a plant with a watering schedule"
        />

        <RepeatableList
          name="outOfScope"
          label="Anything explicitly out of scope?"
          itemLabel="Item"
          help="Things the AI agent should NOT build yet. This stops it from over-building."
          placeholder="e.g. Social features"
          optional
        />

        <div className="flex flex-col gap-3">
          <RadioGroup id="step1-stack" legend="Tech stack">
            <label className={radioTileClass}>
              <input
                type="radio"
                value="recommend"
                className="accent-ink size-4 shrink-0"
                {...register('stackMode')}
              />
              <span className="text-sm">Recommend a stack for me</span>
            </label>
            <label className={radioTileClass}>
              <input
                type="radio"
                value="preferences"
                className="accent-ink size-4 shrink-0"
                {...register('stackMode')}
              />
              <span className="text-sm">I have preferences</span>
            </label>
          </RadioGroup>
          {stackMode === 'preferences' && (
            <Field
              id="step1-stackNotes"
              label="Your stack preferences"
              help="Languages, frameworks, hosting, database — anything you want or want to avoid."
              error={errors.stackNotes?.message}
            >
              <textarea
                id="step1-stackNotes"
                rows={3}
                maxLength={STEP1_LIMITS.long}
                className={inputClass}
                placeholder="e.g. React + TypeScript, deploy on Vercel, avoid paid services"
                {...describedBy('step1-stackNotes', true, errors.stackNotes?.message)}
                {...register('stackNotes')}
              />
            </Field>
          )}
        </div>

        <RadioGroup
          id="step1-experience"
          legend="Your experience level"
          help="We use this to set how much the AI agent explains its decisions."
          error={errors.experience?.message}
          columns="sm:grid-cols-3"
        >
          {EXPERIENCE_LEVELS.map((level) => (
            <label key={level} className={radioTileClass}>
              <input
                type="radio"
                value={level}
                className="accent-ink size-4 shrink-0"
                {...describedBy('step1-experience', true, errors.experience?.message)}
                {...register('experience')}
              />
              <span className="text-sm">{EXPERIENCE_LABELS[level]}</span>
            </label>
          ))}
        </RadioGroup>

        <p className="rounded-control border-line bg-ground text-muted border px-3 py-2 text-sm">
          <span aria-hidden="true">🔒 </span>
          Your Step 1 answers are sent to Google&apos;s Gemini API to generate follow-up questions.
          We don&apos;t store them, but Google may retain and use them under its free-tier terms —
          please don&apos;t enter anything confidential.
        </p>

        <p aria-live="polite" className="sr-only">
          {errorSummary}
        </p>
      </form>
    </FormProvider>
  );
}
