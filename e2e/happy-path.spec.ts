import { expect, test } from '@playwright/test';
import {
  aiQuestions,
  expectStepHeadingFocused,
  fillStep1,
  mockFollowups,
  next,
  promptBox,
} from './helpers';

test('happy path: Step 1 → AI questions → prompt, then copy and download', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const requests = await mockFollowups(page, 200, { questions: aiQuestions });
  await page.goto('/');

  // Step 1
  await expect(
    page.getByRole('heading', { level: 2, name: 'Tell us about your project' }),
  ).toBeVisible();
  await fillStep1(page);
  await next(page);

  // Step 2: AI questions rendered from the (mocked) API response
  await expectStepHeadingFocused(page, 'A few more questions');
  await expect(page.getByLabel('How should reminders arrive?')).toBeVisible();
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({ step1: { projectName: 'Plantly', projectType: 'web' } });

  await page.getByLabel('How should reminders arrive?').selectOption('Push notifications');
  await page.getByRole('radio', { name: 'Yes' }).check();
  await page.getByLabel('Plant database').check();
  await next(page);

  // Step 3: the prompt contains Step 1 data and the answered follow-ups only
  await expectStepHeadingFocused(page, 'Your prompt');
  const prompt = (await promptBox(page).textContent()) ?? '';
  expect(prompt).toContain('# Project kickoff: Plantly');
  expect(prompt).toContain('- **How should reminders arrive?** Push notifications');
  expect(prompt).toContain('- **Can users add plant photos?** Yes');
  expect(prompt).toContain('- **Which extras matter for v1?** Plant database');
  expect(prompt).not.toContain('Anything the agent should know');
  expect(prompt).toContain('Explain decisions in simple terms'); // beginner rule

  // Copy
  await page.getByRole('button', { name: 'Copy' }).click();
  await expect(page.getByRole('button', { name: 'Copied ✓' })).toBeVisible();
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboard.replace(/\r\n/g, '\n')).toBe(prompt); // Windows clipboard uses CRLF
  await expect(page.getByRole('button', { name: 'Copy', exact: true })).toBeVisible({
    timeout: 4000,
  });

  // Download
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Download .md' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('plantly-kickoff-prompt.md');

  // Going back keeps answers; returning with unchanged Step 1 reuses the questions
  await page.getByRole('button', { name: '← Back' }).click();
  await expect(page.getByLabel('How should reminders arrive?')).toHaveValue('Push notifications');
  await page.getByRole('button', { name: '← Back' }).click();
  await next(page);
  await expect(page.getByLabel('How should reminders arrive?')).toBeVisible();
  expect(requests).toHaveLength(1);

  // No horizontal page scroll at any viewport
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
