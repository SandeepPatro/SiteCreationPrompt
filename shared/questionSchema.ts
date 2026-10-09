import { z } from 'zod';
import { LIMITS } from './limits.js';

export const FIELD_TYPES = ['text', 'textarea', 'select', 'multiselect', 'boolean'] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

/*
 * Wire format: what we ask Gemini to return. Flat (every field always present) so the
 * JSON Schema stays simple. Converted to the strict Question type by normalizeQuestions().
 */
export const wireQuestionSchema = z.object({
  id: z.string().describe('Unique snake_case identifier, e.g. "user_accounts"'),
  type: z.enum(FIELD_TYPES),
  label: z.string().describe(`The question in plain language, max ${LIMITS.label} characters`),
  help: z
    .string()
    .describe('One short sentence explaining why it matters or giving an example; "" if none'),
  options: z
    .array(z.string())
    .describe(
      `${LIMITS.minOptions}-${LIMITS.maxOptions} short choices for select/multiselect; [] for other types`,
    ),
});

export const wireResponseSchema = z.object({
  questions: z.array(wireQuestionSchema).min(LIMITS.minQuestions).max(LIMITS.maxQuestions),
});

/** JSON Schema sent to Gemini as `responseJsonSchema` (structured output). */
export const geminiResponseJsonSchema: Record<string, unknown> = (() => {
  const schema: Record<string, unknown> = { ...z.toJSONSchema(wireResponseSchema) };
  delete schema.$schema; // JSON Schema meta keyword; Gemini doesn't need it
  return schema;
})();

/* Strict app-side type: what the frontend renders. */
const base = {
  id: z
    .string()
    .regex(/^[a-z][a-z0-9_]*$/)
    .max(LIMITS.idLen),
  label: z.string().min(1).max(LIMITS.label),
  help: z.string().min(1).max(LIMITS.help).optional(),
};
const options = z
  .array(z.string().min(1).max(LIMITS.option))
  .min(LIMITS.minOptions)
  .max(LIMITS.maxOptions);

export const questionSchema = z.discriminatedUnion('type', [
  z.object({ ...base, type: z.literal('text') }),
  z.object({ ...base, type: z.literal('textarea') }),
  z.object({ ...base, type: z.literal('select'), options }),
  z.object({ ...base, type: z.literal('multiselect'), options }),
  z.object({ ...base, type: z.literal('boolean') }),
]);

export type Question = z.infer<typeof questionSchema>;
export type Step2Answer = string | string[] | boolean;
