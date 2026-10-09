import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { aiQuestions, fillStep1, mockFollowups, next } from './helpers';

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function expectNoViolations(page: Page) {
  // Let the step fade-in finish so contrast is measured at full opacity.
  await page.waitForTimeout(300);
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze();
  expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(', ')}`)).toEqual([]);
}

for (const colorScheme of ['light', 'dark'] as const) {
  test(`no WCAG AA violations on any step (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await mockFollowups(page, 200, { questions: aiQuestions });
    await page.goto('/');
    await expectNoViolations(page);

    await next(page); // validation errors
    await expectNoViolations(page);

    await fillStep1(page);
    await next(page);
    await expect(page.getByLabel('How should reminders arrive?')).toBeVisible();
    await expectNoViolations(page);

    await next(page);
    await expect(page.getByRole('heading', { name: 'Your prompt' })).toBeVisible();
    await expectNoViolations(page);

    await page.getByRole('button', { name: 'Start over' }).click();
    await expect(page.getByRole('dialog', { name: 'Start over?' })).toBeVisible();
    await expectNoViolations(page);
  });
}
