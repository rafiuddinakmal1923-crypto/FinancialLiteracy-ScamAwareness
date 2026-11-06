import { test, expect } from '@playwright/test';

test('app loads offline after first visit', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // ensure the worker controls the page (autoUpdate may claim on activation)
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Celik' })).toBeVisible();
});
