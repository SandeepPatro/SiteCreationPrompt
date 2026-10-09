import { useEffect, useRef } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import type { Question } from '../../shared/questionSchema';
import { Button } from '../components/Button';
import { DynamicField } from '../components/DynamicField';
import { Skeleton } from '../components/Skeleton';
import { StepHeading } from '../components/StepHeading';
import {
  fromStep2FormValues,
  toStep2FormValues,
  type Step2Answers,
  type Step2FormValues,
} from '../lib/step2Answers';
import { NOTICE_TEXT } from '../lib/notices';
import type { Step2Notice } from '../state/wizardReducer';

export const STEP2_FORM_ID = 'step2-form';

interface Step2Props {
  loading: boolean;
  questions: Question[] | null;
  answers: Step2Answers;
  notice: Step2Notice;
  regenerationsLeft: number;
  onChange: (answers: Step2Answers) => void;
  onRegenerate: () => void;
  onSubmit: (answers: Step2Answers) => void;
}

export function Step2(props: Step2Props) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <StepHeading>A few more questions</StepHeading>
        <p className="text-muted">
          {props.loading
            ? 'Thinking about your project…'
            : 'All optional — answer what you can, skip the rest.'}
        </p>
      </div>
      {props.loading || !props.questions ? (
        <Skeleton />
      ) : (
        // key: a new question set gets a fresh form with the right default values.
        <QuestionsForm
          key={props.questions.map((q) => q.id).join()}
          {...props}
          questions={props.questions}
        />
      )}
    </div>
  );
}

function QuestionsForm({
  questions,
  answers,
  notice,
  regenerationsLeft,
  onChange,
  onRegenerate,
  onSubmit,
}: Step2Props & { questions: Question[] }) {
  const methods = useForm<Step2FormValues>({
    defaultValues: toStep2FormValues(questions, answers),
  });

  // Keep answers in wizard state as the user types, so Back/Next never loses them.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });
  useEffect(
    () =>
      methods.subscribe({
        formState: { values: true },
        callback: ({ values }) => onChangeRef.current(fromStep2FormValues(questions, values)),
      }),
    [methods, questions],
  );

  return (
    <FormProvider {...methods}>
      <form
        id={STEP2_FORM_ID}
        noValidate
        className="flex flex-col gap-6"
        onSubmit={methods.handleSubmit((values) =>
          onSubmit(fromStep2FormValues(questions, values)),
        )}
      >
        {notice && (
          <p className="rounded-control border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
            {NOTICE_TEXT[notice]}
          </p>
        )}
        {questions.map((question) => (
          <DynamicField key={question.id} question={question} />
        ))}
        <div>
          <Button
            variant="ghost"
            className="-ml-2 px-2"
            disabled={regenerationsLeft === 0}
            onClick={onRegenerate}
          >
            ↻ Regenerate questions
            <span className="text-muted font-normal">({regenerationsLeft} left)</span>
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
