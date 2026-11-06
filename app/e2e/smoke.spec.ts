import { test, expect } from '@playwright/test';

test('splash shows logo and tagline', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Celik', { exact: true })).toBeVisible();
  await expect(page.getByText('Bijak duit, kebal scam')).toBeVisible();
});
