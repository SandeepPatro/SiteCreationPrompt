import { z } from 'zod';

/** Step 1 length caps. Keep the request body well under LIMITS.maxBodyBytes. */
export const STEP1_LIMITS = {
  name: 120,
  short: 200,
  long: 500,
  listItems: 10,
  listItem: 200,
} as const;

export const PROJECT_TYPES = [
  'web',
  'mobile',
  'api',
  'desktop',
  'cli',
  'extension',
  'other',
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  web: 'Web app',
  mobile: 'Mobile app',
  api: 'Backend / API',
  desktop: 'Desktop app',
  cli: 'Command-line tool (CLI)',
  extension: 'Browser extension',
  other: 'Other',
};

export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'senior'] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  senior: 'Senior',
};

const text = (max: number) => z.string().trim().min(1).max(max);

/**
 * Canonical, cleaned Step 1 answers. This is what the API receives and what buildPrompt uses.
 * (The form has its own looser shape — see src/lib/step1Form.ts.)
 */
export const step1Schema = z.object({
  projectName: text(STEP1_LIMITS.name),
  description: text(STEP1_LIMITS.long),
  audience: text(STEP1_LIMITS.short),
  projectType: z.enum(PROJECT_TYPES),
  features: z.array(text(STEP1_LIMITS.listItem)).min(1).max(STEP1_LIMITS.listItems),
  outOfScope: z.array(text(STEP1_LIMITS.listItem)).max(STEP1_LIMITS.listItems),
  stack: z.discriminatedUnion('mode', [
    z.object({ mode: z.literal('recommend') }),
    z.object({ mode: z.literal('preferences'), notes: text(STEP1_LIMITS.long) }),
  ]),
  experience: z.enum(EXPERIENCE_LEVELS),
});

export type Step1Answers = z.infer<typeof step1Schema>;
