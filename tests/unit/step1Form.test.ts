import { describe, expect, it } from 'vitest';
import { step1Schema } from '../../shared/step1Schema';
import {
  emptyStep1Form,
  step1FormSchema,
  toStep1Answers,
  type Step1FormValues,
} from '../../src/lib/step1Form';

const valid: Step1FormValues = {
  projectName: '  Plantly ',
  description: 'Reminds people to water plants.',
  audience: 'Apartment dwellers',
  projectType: 'web',
  features: [{ value: ' Add plants ' }, { value: '' }, { value: 'Dashboard' }],
  outOfScope: [{ value: '' }],
  stackMode: 'recommend',
  stackNotes: 'ignored when recommending',
  experience: 'beginner',
};

const errorPaths = (values: Step1FormValues) => {
  const result = step1FormSchema.safeParse(values);
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
};

describe('step1FormSchema', () => {
  it('accepts a valid form', () => {
    expect(errorPaths(valid)).toEqual([]);
  });

  it('reports every missing required field at once', () => {
    expect(errorPaths(emptyStep1Form).sort()).toEqual(
      ['audience', 'description', 'experience', 'features', 'projectName', 'projectType'].sort(),
    );
  });

  it('treats whitespace-only answers as empty', () => {
    expect(errorPaths({ ...valid, projectName: '   ', features: [{ value: '  ' }] })).toEqual([
      'projectName',
      'features',
    ]);
  });

  it('requires stack notes only when "I have preferences" is chosen', () => {
    expect(errorPaths({ ...valid, stackMode: 'preferences', stackNotes: ' ' })).toEqual([
      'stackNotes',
    ]);
    expect(errorPaths({ ...valid, stackMode: 'recommend', stackNotes: '' })).toEqual([]);
  });

  it('rejects unknown project types and over-long text', () => {
    expect(errorPaths({ ...valid, projectType: 'spaceship' })).toEqual(['projectType']);
    expect(errorPaths({ ...valid, projectName: 'x'.repeat(121) })).toEqual(['projectName']);
  });
});

describe('toStep1Answers', () => {
  it('trims, drops empty list rows and shapes the stack', () => {
    const answers = toStep1Answers(valid);
    expect(answers).toEqual({
      projectName: 'Plantly',
      description: 'Reminds people to water plants.',
      audience: 'Apartment dwellers',
      projectType: 'web',
      features: ['Add plants', 'Dashboard'],
      outOfScope: [],
      stack: { mode: 'recommend' },
      experience: 'beginner',
    });
    expect(step1Schema.safeParse(answers).success).toBe(true);
  });

  it('keeps stack notes when preferences are chosen', () => {
    const answers = toStep1Answers({ ...valid, stackMode: 'preferences', stackNotes: ' Go ' });
    expect(answers.stack).toEqual({ mode: 'preferences', notes: 'Go' });
  });
});
