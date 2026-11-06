import { test, expect } from '@playwright/test';

test('splash shows logo and tagline', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Celik' })).toBeVisible();
  await expect(page.getByText('Bijak duit, kebal scam')).toBeVisible();
});
