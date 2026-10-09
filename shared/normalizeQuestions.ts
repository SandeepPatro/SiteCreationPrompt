import { z } from 'zod';
import { LIMITS } from './limits.js';
import { FIELD_TYPES, questionSchema, type Question } from './questionSchema.js';

/** Lenient parse of one model question: tolerate missing help/options, ignore extra keys. */
const looseQuestion = z.object({
  id: z.string().optional(),
  type: z.enum(FIELD_TYPES),
  label: z.string(),
  help: z.string().optional(),
  options: z.array(z.string()).optional(),
});

const clean = (s: string, max: number) => s.replace(/\s+/g, ' ').trim().slice(0, max).trim();

function slugify(raw: string | undefined, fallback: string) {
  let id = (raw ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!id) id = fallback;
  if (!/^[a-z]/.test(id)) id = `q_${id}`;
  return id.slice(0, LIMITS.idLen - 3); // leave room for a dedupe suffix
}

/**
 * Turn untrusted model output into a safe list of Questions.
 * Bad individual questions are dropped; returns null if fewer than LIMITS.minQuestions survive.
 */
export function normalizeQuestions(raw: unknown): Question[] | null {
  const envelope = z.object({ questions: z.array(z.unknown()) }).safeParse(raw);
  if (!envelope.success) return null;

  const seenIds = new Set<string>();
  const seenLabels = new Set<string>();
  const result: Question[] = [];

  for (const [index, item] of envelope.data.questions.entries()) {
    if (result.length >= LIMITS.maxQuestions) break;
    const parsed = looseQuestion.safeParse(item);
    if (!parsed.success) continue;
    const q = parsed.data;

    const label = clean(q.label, LIMITS.label);
    if (!label || seenLabels.has(label.toLowerCase())) continue;

    let id = slugify(q.id, `question_${index + 1}`);
    for (let n = 2; seenIds.has(id); n++) id = `${slugify(q.id, `question_${index + 1}`)}_${n}`;

    const help = q.help ? clean(q.help, LIMITS.help) : '';
    const candidate: Record<string, unknown> = { id, type: q.type, label };
    if (help) candidate.help = help;

    if (q.type === 'select' || q.type === 'multiselect') {
      const unique = new Map<string, string>();
      for (const option of q.options ?? []) {
        const value = clean(option, LIMITS.option);
        if (value && !unique.has(value.toLowerCase())) unique.set(value.toLowerCase(), value);
      }
      candidate.options = [...unique.values()].slice(0, LIMITS.maxOptions);
    }

    const strict = questionSchema.safeParse(candidate);
    if (!strict.success) continue; // e.g. a select with fewer than 2 usable options

    seenIds.add(id);
    seenLabels.add(label.toLowerCase());
    result.push(strict.data);
  }

  return result.length >= LIMITS.minQuestions ? result : null;
}
