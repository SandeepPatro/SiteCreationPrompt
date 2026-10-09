import type { Question, Step2Answer } from '../../shared/questionSchema';

export type Step2Answers = Record<string, Step2Answer>;
/** What React Hook Form holds: booleans are 'yes' / 'no' / '' radio values. */
export type Step2FormValues = Record<string, string | string[]>;

export const STEP2_TEXT_MAX = 500;

/** The answer if it still fits the question (same id AND compatible type/options), else undefined. */
function compatible(question: Question, answer: Step2Answer | undefined): Step2Answer | undefined {
  switch (question.type) {
    case 'text':
    case 'textarea':
      return typeof answer === 'string' && answer.trim() ? answer : undefined;
    case 'select':
      return typeof answer === 'string' && question.options.includes(answer) ? answer : undefined;
    case 'multiselect': {
      if (!Array.isArray(answer)) return undefined;
      const kept = answer.filter((a) => question.options.includes(a));
      return kept.length ? kept : undefined;
    }
    case 'boolean':
      return typeof answer === 'boolean' ? answer : undefined;
  }
}

/** Keep previous answers only for questions that still exist with a compatible shape. */
export function keepCompatibleAnswers(questions: Question[], answers: Step2Answers): Step2Answers {
  const kept: Step2Answers = {};
  for (const question of questions) {
    const answer = compatible(question, answers[question.id]);
    if (answer !== undefined) kept[question.id] = answer;
  }
  return kept;
}

export function toStep2FormValues(questions: Question[], answers: Step2Answers): Step2FormValues {
  const values: Step2FormValues = {};
  for (const q of questions) {
    const a = answers[q.id];
    if (q.type === 'multiselect') values[q.id] = Array.isArray(a) ? a : [];
    else if (q.type === 'boolean') values[q.id] = a === true ? 'yes' : a === false ? 'no' : '';
    else values[q.id] = typeof a === 'string' ? a : '';
  }
  return values;
}

/** Form values → answers. Empty answers are dropped (all AI questions are optional). */
export function fromStep2FormValues(questions: Question[], values: Step2FormValues): Step2Answers {
  const answers: Step2Answers = {};
  for (const q of questions) {
    const v = values[q.id];
    if (q.type === 'boolean') {
      if (v === 'yes') answers[q.id] = true;
      else if (v === 'no') answers[q.id] = false;
    } else if (q.type === 'multiselect') {
      // RHF gives `false` for an empty checkbox group and a string for a single checked box.
      const list = Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : [];
      if (list.length) answers[q.id] = list;
    } else if (typeof v === 'string' && v.trim()) {
      answers[q.id] = v.trim().slice(0, STEP2_TEXT_MAX);
    }
  }
  return keepCompatibleAnswers(questions, answers);
}
