import { expect, test } from '@playwright/test';

// spec 001 REQ-2.2 – REQ-2.4: the app loads and the sign-in page renders,
// with empty storage and no backend.
test('the app loads and shows the sign-in page', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });

  // No backend: every API request fails, whatever is running on this machine.
  await page.route(/\/api\/v1\//, (route) => route.abort());

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Se connecter' })).toBeVisible();
  await expect(page.locator('input#username')).toBeVisible();
  await expect(page.locator('input#password')).toBeVisible();
  expect(errors).toEqual([]);
});
