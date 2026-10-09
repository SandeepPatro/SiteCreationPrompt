import { expect, test } from '@playwright/test';
import { expectStepHeadingFocused, fillStep1, mockFollowups, next, promptBox } from './helpers';

test('API failure: fallback questions appear and the user can still finish', async ({ page }) => {
  await mockFollowups(page, 503, { error: 'upstream_unavailable' });
  await page.goto('/');

  await fillStep1(page);
  await next(page);

  await expectStepHeadingFocused(page, 'A few more questions');
  await expect(
    page
      .locator('#step2-form')
      .getByText("Couldn't generate tailored questions — here are some standard ones."),
  ).toBeVisible();

  // Rule-based questions for a web app
  await expect(page.getByLabel('Do people need to sign in?')).toBeVisible();
  await page.getByLabel('Do people need to sign in?').selectOption('Email and password');
  await page.getByLabel('Phone browsers').check();
  await next(page);

  await expectStepHeadingFocused(page, 'Your prompt');
  const prompt = (await promptBox(page).textContent()) ?? '';
  expect(prompt).toContain('- **Do people need to sign in?** Email and password');
  expect(prompt).toContain('- **Which devices should it work well on?** Phone browsers');
  await expect(page.getByRole('button', { name: 'Download .md' })).toBeEnabled();
});

test('rate limited: a specific notice is shown with fallback questions', async ({ page }) => {
  await mockFollowups(page, 429, { error: 'rate_limited' });
  await page.goto('/');
  await fillStep1(page);
  await next(page);
  await expect(
    page.locator('#step2-form').getByText("You've reached the hourly limit"),
  ).toBeVisible();
  await expect(page.getByLabel('Do people need to sign in?')).toBeVisible();
});

test('invalid API data is treated as a failure, never rendered', async ({ page }) => {
  await mockFollowups(page, 200, {
    questions: [{ id: 'x', type: 'select', label: '<img src=x onerror=alert(1)>', options: [] }],
  });
  await page.goto('/');
  await fillStep1(page);
  await next(page);
  await expect(
    page.locator('#step2-form').getByText("Couldn't generate tailored questions"),
  ).toBeVisible();
  await expect(page.locator('img[src="x"]')).toHaveCount(0);
});
