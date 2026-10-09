import { describe, expect, it } from 'vitest';
import type { Question } from '../../shared/questionSchema';
import type { Step1Answers } from '../../shared/step1Schema';
import { buildPrompt } from '../../src/lib/buildPrompt';
import { promptFilename } from '../../src/lib/download';

const step1: Step1Answers = {
  projectName: 'Plantly',
  description: 'A web app that reminds people when to water their houseplants.',
  audience: 'Apartment dwellers with a few houseplants who keep forgetting to water them.',
  projectType: 'web',
  features: [
    'Add plants with a name, photo, and watering interval',
    'Dashboard showing which plants need water today',
    'Mark a plant as watered',
  ],
  outOfScope: ['Social features / sharing', 'Native mobile apps'],
  stack: { mode: 'recommend' },
  experience: 'beginner',
};

const questions: Question[] = [
  {
    id: 'accounts',
    type: 'select',
    label: 'Do users need accounts?',
    options: ['Yes, sign-in with email', 'No'],
  },
  {
    id: 'channels',
    type: 'multiselect',
    label: 'How should reminders reach users?',
    options: ['Email', 'Browser notifications', 'SMS'],
  },
  { id: 'intervals', type: 'boolean', label: 'Suggest watering intervals for common plants?' },
  { id: 'skipped', type: 'text', label: 'Anything else?' },
  { id: 'notes', type: 'textarea', label: 'Design notes?' },
];

const answers = {
  accounts: 'Yes, sign-in with email',
  channels: ['Email', 'Browser notifications'],
  intervals: true,
  notes: 'Calm greens.\nLarge buttons.',
};

/** Headings whose next non-blank line is another heading (or nothing) = empty section. */
function emptyHeadings(md: string): string[] {
  const lines = md.split('\n');
  return lines.filter((line, i) => {
    if (!/^#{1,6} /.test(line)) return false;
    const next = lines.slice(i + 1).find((l) => l.trim() !== '');
    return next === undefined || /^#{1,6} /.test(next);
  });
}

describe('buildPrompt', () => {
  const prompt = buildPrompt(step1, questions, answers);

  it('matches the reference prompt', () => {
    expect(prompt).toMatchSnapshot();
  });

  it('has no empty sections and never prints undefined/null', () => {
    const minimal = buildPrompt({ ...step1, outOfScope: [] }, [], {});
    for (const md of [prompt, minimal]) {
      expect(emptyHeadings(md)).toEqual([]);
      expect(md).not.toMatch(/undefined|null|\[object Object\]/);
    }
    expect(minimal).not.toContain('## Out of scope');
    expect(minimal).not.toContain('## Additional details');
  });

  it('lists answered follow-ups as question → answer and skips unanswered ones', () => {
    expect(prompt).toContain('- **Do users need accounts?** Yes, sign-in with email');
    expect(prompt).toContain(
      '- **How should reminders reach users?** Email, Browser notifications',
    );
    expect(prompt).toContain('- **Suggest watering intervals for common plants?** Yes');
    expect(prompt).not.toContain('Anything else?');
    expect(buildPrompt(step1, questions, { intervals: false })).toContain('common plants?** No');
  });

  it('keeps multi-line answers inside their list item', () => {
    expect(prompt).toContain('- **Design notes?** Calm greens.\n  Large buttons.');
  });

  it('ignores answers to questions that are not in the list', () => {
    expect(buildPrompt(step1, [], { ghost: 'boo' })).not.toContain('boo');
  });

  it('adds the beginner instruction only for beginners', () => {
    const line = 'Explain decisions in simple terms and avoid unnecessary complexity.';
    expect(prompt).toContain(line);
    expect(buildPrompt({ ...step1, experience: 'senior' }, [], {})).not.toContain(line);
  });

  it('asks for 2 stack options when "Recommend" is chosen', () => {
    expect(prompt).toContain('Propose **2 stack options**');
    expect(prompt).toContain('trade-offs');
  });

  it('quotes stack preferences instead when given', () => {
    const md = buildPrompt(
      { ...step1, stack: { mode: 'preferences', notes: 'React + TS\nDeploy on Vercel' } },
      [],
      {},
    );
    expect(md).toContain('> React + TS\n> Deploy on Vercel');
    expect(md).toContain('Flag any concerns with this stack');
    expect(md).not.toContain('2 stack options');
  });

  it('includes UI-only notes for UI project types only', () => {
    expect(prompt).toContain('Accessibility:');
    expect(buildPrompt({ ...step1, projectType: 'cli' }, [], {})).not.toContain('Accessibility:');
    expect(buildPrompt({ ...step1, projectType: 'api' }, [], {})).toContain('Never commit secrets');
  });

  it('follows the kickoff process and stays agent-neutral', () => {
    for (const heading of [
      "## What we're building",
      '## Scope (v1 must-haves)',
      '## Tech stack',
      '## How we will work',
      '## Definition of done',
      '## Your first response',
    ]) {
      expect(prompt).toContain(heading);
    }
    expect(prompt).toContain('**Wait for my approval**');
    expect(prompt).toContain('**Maintain `AGENTS.md`** (or `CLAUDE.md` / `.cursor/rules`');
  });
});

describe('promptFilename', () => {
  it('slugifies the project name', () => {
    expect(promptFilename('Plantly')).toBe('plantly-kickoff-prompt.md');
    expect(promptFilename('  My App: v2 / Beta! ')).toBe('my-app-v2-beta-kickoff-prompt.md');
    expect(promptFilename('Café Ünïcode 日本')).toBe('café-ünïcode-日本-kickoff-prompt.md');
  });

  it('falls back when nothing usable is left and caps the length', () => {
    expect(promptFilename('???')).toBe('project-kickoff-prompt.md');
    expect(promptFilename('a'.repeat(200))).toBe(`${'a'.repeat(60)}-kickoff-prompt.md`);
    expect(promptFilename('con<>:"/\\|?*')).toBe('con-kickoff-prompt.md');
  });
});
