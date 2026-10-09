import { expect, type Page } from '@playwright/test';

export const aiQuestions = [
  {
    id: 'reminders',
    type: 'select',
    label: 'How should reminders arrive?',
    help: 'Pick the channel people check most.',
    options: ['Email', 'Push notifications'],
  },
  { id: 'photos', type: 'boolean', label: 'Can users add plant photos?' },
  {
    id: 'extras',
    type: 'multiselect',
    label: 'Which extras matter for v1?',
    options: ['Plant database', 'Calendar sync'],
  },
  { id: 'notes', type: 'textarea', label: 'Anything else the agent should know?' },
];

/** Mock POST /api/followups (the real endpoint calls Gemini; e2e must not). */
export async function mockFollowups(page: Page, status: number, body: unknown) {
  const requests: unknown[] = [];
  await page.route('**/api/followups', async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({ status, json: body });
  });
  return requests;
}

export async function fillStep1(page: Page) {
  await page.getByLabel('Project name').fill('Plantly');
  await page
    .getByLabel('What are you building?')
    .fill('A web app that reminds people when to water their houseplants.');
  await page.getByLabel('Who is it for?').fill('Apartment dwellers who forget to water plants');
  await page.getByLabel('Web app').check();
  await page.getByLabel('Feature 1', { exact: true }).fill('Add plants with a watering interval');
  await page.getByLabel('Beginner').check();
}

export const next = (page: Page) => page.getByRole('button', { name: 'Next →' }).click();

export async function expectStepHeadingFocused(page: Page, name: string) {
  await expect(page.getByRole('heading', { level: 2, name })).toBeFocused();
}

export const promptBox = (page: Page) =>
  page.getByRole('region', { name: 'Generated kickoff prompt' });
