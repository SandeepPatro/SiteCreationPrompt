import { describe, expect, it } from 'vitest';
import { LIMITS } from '../../shared/limits';
import { normalizeQuestions } from '../../shared/normalizeQuestions';
import { questionSchema } from '../../shared/questionSchema';

const q = (overrides: Record<string, unknown> = {}) => ({
  id: 'user_accounts',
  type: 'boolean',
  label: 'Do users need accounts?',
  help: 'Accounts let people keep their data across devices.',
  options: [],
  ...overrides,
});

const three = [
  q(),
  q({
    id: 'reminders',
    type: 'multiselect',
    label: 'How should reminders arrive?',
    options: ['Email', 'Push'],
  }),
  q({ id: 'notes', type: 'textarea', label: 'Anything else?', help: '' }),
];

describe('normalizeQuestions', () => {
  it('accepts valid wire output and returns strict questions', () => {
    const result = normalizeQuestions({ questions: three });
    expect(result).toHaveLength(3);
    for (const question of result ?? [])
      expect(questionSchema.safeParse(question).success).toBe(true);
    expect(result?.[0]).toEqual({
      id: 'user_accounts',
      type: 'boolean',
      label: 'Do users need accounts?',
      help: 'Accounts let people keep their data across devices.',
    });
  });

  it('omits empty help and strips options from non-select types', () => {
    const result = normalizeQuestions({ questions: three });
    expect(result?.[2]).toEqual({ id: 'notes', type: 'textarea', label: 'Anything else?' });
    expect(result?.[0]).not.toHaveProperty('options');
  });

  it('returns null for non-object or malformed envelopes', () => {
    expect(normalizeQuestions(null)).toBeNull();
    expect(normalizeQuestions('hello')).toBeNull();
    expect(normalizeQuestions({ items: three })).toBeNull();
  });

  it('returns null when fewer than the minimum valid questions survive', () => {
    expect(normalizeQuestions({ questions: three.slice(0, 2) })).toBeNull();
    expect(
      normalizeQuestions({ questions: [...three.slice(0, 2), { type: 'banana', label: 'x' }] }),
    ).toBeNull();
  });

  it('drops individual bad questions but keeps the rest', () => {
    const result = normalizeQuestions({
      questions: [
        ...three,
        { type: 'select', label: 'Pick one', options: ['Only one'] }, // < 2 options
        { type: 'text', label: '   ' }, // empty label
        42,
      ],
    });
    expect(result?.map((x) => x.id)).toEqual(['user_accounts', 'reminders', 'notes']);
  });

  it('caps the count at the maximum', () => {
    const many = Array.from({ length: 10 }, (_, i) => q({ id: `q${i}`, label: `Question ${i}?` }));
    expect(normalizeQuestions({ questions: many })).toHaveLength(LIMITS.maxQuestions);
  });

  it('truncates long text and collapses whitespace', () => {
    const result = normalizeQuestions({
      questions: [
        q({ label: `  Very\n\n long   ${'x'.repeat(300)}`, help: 'h'.repeat(500) }),
        ...three.slice(1),
      ],
    });
    expect(result?.[0]?.label.startsWith('Very long xxx')).toBe(true);
    expect(result?.[0]?.label.length).toBeLessThanOrEqual(LIMITS.label);
    expect(result?.[0]?.help?.length).toBeLessThanOrEqual(LIMITS.help);
  });

  it('dedupes options case-insensitively and caps them', () => {
    const options = [
      'Email',
      'email',
      ' Push ',
      ...Array.from({ length: 12 }, (_, i) => `Opt ${i}`),
    ];
    const result = normalizeQuestions({
      questions: [q({ type: 'select', options }), ...three.slice(1)],
    });
    const first = result?.[0];
    expect(first?.type).toBe('select');
    if (first?.type === 'select') {
      expect(first.options.slice(0, 2)).toEqual(['Email', 'Push']);
      expect(first.options).toHaveLength(LIMITS.maxOptions);
    }
  });

  it('slugifies, fills in and dedupes ids', () => {
    const result = normalizeQuestions({
      questions: [
        q({ id: 'User Accounts!', label: 'A?' }),
        q({ id: 'user_accounts', label: 'B?' }),
        q({ id: undefined, label: 'C?' }),
        q({ id: '123', label: 'D?' }),
      ],
    });
    expect(result?.map((x) => x.id)).toEqual([
      'user_accounts',
      'user_accounts_2',
      'question_3',
      'q_123',
    ]);
  });

  it('drops duplicate questions with the same label', () => {
    const result = normalizeQuestions({
      questions: [...three, q({ id: 'other', label: 'do users need ACCOUNTS?' })],
    });
    expect(result).toHaveLength(3);
  });
});
