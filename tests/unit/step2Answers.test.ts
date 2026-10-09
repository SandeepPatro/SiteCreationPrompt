import { describe, expect, it } from 'vitest';
import type { Question } from '../../shared/questionSchema';
import {
  fromStep2FormValues,
  keepCompatibleAnswers,
  toStep2FormValues,
} from '../../src/lib/step2Answers';

const questions: Question[] = [
  { id: 'name', type: 'text', label: 'Name?' },
  { id: 'notes', type: 'textarea', label: 'Notes?' },
  { id: 'plan', type: 'select', label: 'Plan?', options: ['Free', 'Pro'] },
  { id: 'devices', type: 'multiselect', label: 'Devices?', options: ['Phone', 'Desktop'] },
  { id: 'offline', type: 'boolean', label: 'Offline?' },
];

describe('step2 answers', () => {
  it('round-trips answers through the form shape', () => {
    const answers = { name: 'Ann', plan: 'Pro', devices: ['Phone'], offline: false };
    expect(fromStep2FormValues(questions, toStep2FormValues(questions, answers))).toEqual(answers);
  });

  it('gives every question an empty form value when unanswered', () => {
    expect(toStep2FormValues(questions, {})).toEqual({
      name: '',
      notes: '',
      plan: '',
      devices: [],
      offline: '',
    });
  });

  it('drops empty answers and trims text', () => {
    expect(
      fromStep2FormValues(questions, {
        name: '  Ann ',
        notes: '   ',
        plan: '',
        devices: [],
        offline: '',
      }),
    ).toEqual({ name: 'Ann' });
  });

  it('keeps only answers compatible with the new questions', () => {
    const next: Question[] = [
      { id: 'name', type: 'boolean', label: 'Name now boolean?' },
      { id: 'plan', type: 'select', label: 'Plan?', options: ['Free', 'Team'] },
      { id: 'devices', type: 'multiselect', label: 'Devices?', options: ['Phone', 'Watch'] },
      { id: 'offline', type: 'boolean', label: 'Offline?' },
    ];
    expect(
      keepCompatibleAnswers(next, {
        name: 'Ann',
        plan: 'Pro',
        devices: ['Phone', 'Desktop'],
        offline: true,
        gone: 'x',
      }),
    ).toEqual({ devices: ['Phone'], offline: true });
  });
});
