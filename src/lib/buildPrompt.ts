import type { Question, Step2Answer } from '../../shared/questionSchema';
import { PROJECT_TYPE_LABELS, type ProjectType, type Step1Answers } from '../../shared/step1Schema';
import type { Step2Answers } from './step2Answers';

/*
 * The kickoff prompt template. Pure function: same input → same Markdown.
 * Rules: sections with no content are omitted entirely (no empty headings), unanswered
 * follow-up questions are skipped, and user text is inserted as plain text.
 */

/** Project types with a user interface (responsive/accessibility notes apply). */
const HAS_UI: ReadonlySet<ProjectType> = new Set(['web', 'mobile', 'desktop', 'extension']);

const EXPERIENCE_NOTE = {
  beginner: 'Explain decisions in simple terms and avoid unnecessary complexity.',
  intermediate: 'Briefly explain non-obvious decisions; skip the basics.',
  senior: 'Be concise: state trade-offs and decisions, no tutorials.',
} as const;

/** Continuation lines of a multi-line value, indented so they stay inside a list item. */
function indent(text: string, spaces = 2): string {
  return text
    .trim()
    .split(/\r?\n/)
    .map((line, i) => (i === 0 ? line : `${' '.repeat(spaces)}${line}`.trimEnd()))
    .join('\n');
}

const bullets = (items: string[]) => items.map((item) => `- ${indent(item)}`).join('\n');
const numbered = (items: string[]) => items.map((item, i) => `${i + 1}. ${item}`).join('\n');

function formatAnswer(answer: Step2Answer): string {
  if (typeof answer === 'boolean') return answer ? 'Yes' : 'No';
  if (Array.isArray(answer)) return answer.join(', ');
  return answer.trim();
}

function section(title: string, body: string | null): string | null {
  return body && body.trim() ? `## ${title}\n\n${body.trim()}` : null;
}

function stackSection(step1: Step1Answers): string {
  if (step1.stack.mode === 'recommend') {
    // One line per paragraph: hard wraps look broken when pasted into a chat box.
    return [
      "I don't have a stack preference. Propose **2 stack options** suited to this project, with the",
      'trade-offs of each (cost, complexity, hosting, learning curve), and recommend one.',
      'Wait for my choice before setting anything up.',
    ].join(' ');
  }
  const quoted = step1.stack.notes
    .trim()
    .split(/\r?\n/)
    .map((line) => `> ${line}`.trimEnd())
    .join('\n');
  return `My preferences:\n\n${quoted}\n\nFlag any concerns with this stack before starting.`;
}

function additionalDetails(questions: Question[], answers: Step2Answers): string | null {
  const lines: string[] = [];
  for (const question of questions) {
    const answer = answers[question.id];
    if (answer === undefined) continue;
    const text = formatAnswer(answer);
    if (!text) continue;
    lines.push(`**${question.label}** ${text}`);
  }
  return lines.length ? bullets(lines) : null;
}

function nonFunctional(projectType: ProjectType): string {
  const notes: string[] = [];
  if (HAS_UI.has(projectType)) {
    notes.push(
      projectType === 'web'
        ? 'Responsive: works well on phones and desktop.'
        : 'Works well across the screen sizes and devices it targets.',
      'Accessibility: labels on all inputs, keyboard navigable, visible focus, sufficient contrast.',
    );
  }
  notes.push(
    'Handle errors gracefully with clear, user-friendly messages.',
    'Never commit secrets; use environment variables and keep them out of client code.',
  );
  return bullets(notes);
}

export function buildPrompt(
  step1: Step1Answers,
  questions: Question[],
  answers: Step2Answers,
): string {
  const name = step1.projectName.trim();

  const parts: (string | null)[] = [
    `# Project kickoff: ${name}`,
    'You are a senior software engineer working with me on a new project. Do NOT write any code yet.\nYour first job is to understand, question, and plan.',
    section(
      "What we're building",
      bullets([
        `**Project:** ${name}`,
        `**Description:** ${step1.description}`,
        `**Target users:** ${step1.audience}`,
        `**Project type:** ${PROJECT_TYPE_LABELS[step1.projectType]}`,
      ]),
    ),
    section('Scope (v1 must-haves)', bullets(step1.features)),
    section(
      'Out of scope for v1',
      step1.outOfScope.length
        ? `Do not build or "prepare for" these:\n\n${bullets(step1.outOfScope)}`
        : null,
    ),
    section('Tech stack', stackSection(step1)),
    section('Additional details', additionalDetails(questions, answers)),
    section('Non-functional notes', nonFunctional(step1.projectType)),
    section(
      'Engineering standards',
      bullets([
        'Small, focused commits with clear messages.',
        "Write tests for core logic; don't claim something works unless you ran it.",
        "Don't add a dependency without explaining why and what it replaces.",
        EXPERIENCE_NOTE[step1.experience],
      ]),
    ),
    section(
      'How we will work',
      numbered([
        "**Clarify**: ask me every question you need answered, grouped by topic. Don't assume.",
        '**Plan**: propose the architecture, data model, folder structure, risks, and a milestone plan of small, testable steps.',
        '**Wait for my approval** before writing code.',
        '**Build one milestone at a time**. After each one, run the app and tests, summarize what changed, and stop for my review.',
        '**Maintain `AGENTS.md`** (or `CLAUDE.md` / `.cursor/rules` for your tool) with the stack, commands, env vars, conventions, and key decisions. Read it at the start of every session.',
        "If you're unsure, blocked, or about to make an architectural decision, stop and ask.",
      ]),
    ),
    section(
      'Definition of done',
      bullets([
        'All v1 must-haves work end-to-end.',
        'Tests pass; no secrets in the repo or client code.',
        'A README covers setup, environment variables, and how to run and deploy.',
      ]),
    ),
    section(
      'Your first response',
      `Reply ONLY with:\n\n${numbered([
        'Your understanding of the project in 3–5 sentences',
        'Your clarifying questions (grouped by topic)',
        "Any red flags or things you'd push back on",
      ])}`,
    ),
  ];

  return `${parts.filter((p): p is string => p !== null).join('\n\n')}\n`;
}
