import { z } from 'zod';
import {
  EXPERIENCE_LEVELS,
  PROJECT_TYPES,
  STEP1_LIMITS,
  step1Schema,
  type Step1Answers,
} from '../../shared/step1Schema';

/*
 * Form-shaped Step 1 values. Differs from the canonical Step1Answers because:
 * - React Hook Form field arrays need objects ({ value }), not plain strings;
 * - unanswered radios are '' rather than undefined;
 * - stack is two flat fields so the textarea can show/hide.
 * Every field is a plain string/array so all checks are "continuable": Zod reports every
 * error at once instead of stopping at the first type mismatch.
 */
const tooLong = (max: number) => `Keep this under ${max} characters`;
const row = z.object({
  value: z.string().max(STEP1_LIMITS.listItem, tooLong(STEP1_LIMITS.listItem)),
});
const required = (message: string, max: number) =>
  z.string().trim().min(1, message).max(max, tooLong(max));
const oneOf = (values: readonly string[], message: string) =>
  z.string().refine((v) => values.includes(v), message);

export const step1FormSchema = z
  .object({
    projectName: required('Give your project a name', STEP1_LIMITS.name),
    description: required("Describe what you're building in a sentence or two", STEP1_LIMITS.long),
    audience: required("Tell us who it's for", STEP1_LIMITS.short),
    projectType: oneOf(PROJECT_TYPES, 'Choose a project type'),
    features: z
      .array(row)
      .max(STEP1_LIMITS.listItems)
      .refine((rows) => rows.some((r) => r.value.trim()), 'Add at least one must-have feature'),
    outOfScope: z.array(row).max(STEP1_LIMITS.listItems),
    stackMode: z.enum(['recommend', 'preferences']),
    stackNotes: z.string().max(STEP1_LIMITS.long, tooLong(STEP1_LIMITS.long)),
    experience: oneOf(EXPERIENCE_LEVELS, 'Choose your experience level'),
  })
  .superRefine((v, ctx) => {
    if (v.stackMode === 'preferences' && !v.stackNotes.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['stackNotes'],
        message: 'Describe your preferences, or choose "Recommend a stack for me"',
      });
    }
  });

export type Step1FormValues = z.input<typeof step1FormSchema>;

export const emptyStep1Form: Step1FormValues = {
  projectName: '',
  description: '',
  audience: '',
  projectType: '',
  features: [{ value: '' }],
  outOfScope: [{ value: '' }],
  stackMode: 'recommend',
  stackNotes: '',
  experience: '',
};

const cleanList = (rows: { value: string }[]) =>
  rows.map((r) => r.value.trim()).filter((v) => v.length > 0);

/** Convert validated form values to canonical answers. Throws if the form wasn't validated first. */
export function toStep1Answers(form: Step1FormValues): Step1Answers {
  return step1Schema.parse({
    projectName: form.projectName,
    description: form.description,
    audience: form.audience,
    projectType: form.projectType,
    features: cleanList(form.features),
    outOfScope: cleanList(form.outOfScope),
    stack:
      form.stackMode === 'preferences'
        ? { mode: 'preferences', notes: form.stackNotes }
        : { mode: 'recommend' },
    experience: form.experience,
  });
}
