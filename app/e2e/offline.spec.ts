import { test, expect, type Page } from '@playwright/test';
import { seedGame } from './helpers';
import { ROUTES } from './routes';

/** The game under the service worker: first load done, worker controlling the page. */
async function controlled(page: Page): Promise<void> {
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
}

test('app loads offline after first visit', async ({ page, context }) => {
  await page.goto('/');
  await controlled(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Celik' })).toBeVisible();
});

test('offline: every route renders without the error screen and no request fails', async ({ page, context }) => {
  test.setTimeout(240_000);
  await seedGame(page);
  await controlled(page);
  const failed: string[] = [];
  await context.setOffline(true);
  page.on('requestfailed', (r) => {
    if (!/^(data|blob):/.test(r.url())) failed.push(`${r.method()} ${r.url()} ${r.failure()?.errorText ?? ''}`);
  });
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));

  // Reload offline on the home screen (a real document load from the service worker cache), then walk the routes.
  await page.goto('/#/home');
  await page.reload();
  await expect(page.locator('[data-screen]').first()).toBeVisible();

  // Every captured route, driven exactly as the screenshot runner does (setups play chats and patch the saved game),
  // but with the network off. Each must show its own screen, not the error screen.
  for (const route of ROUTES) {
    await test.step(route.name, async () => {
      if (route.setup) await route.setup(page);
      else await page.goto(`/#${route.path}`);
      await expect(page.locator(`[data-screen="${route.screen ?? route.name}"]`), `${route.name} renders its screen`).toBeVisible();
      if (route.waitFor) await expect(page.getByText(route.waitFor)).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('Kancil tersadung'), `${route.name} shows the error screen`).toHaveCount(0);
      await expect(page.locator('[data-screen="error"]'), `${route.name} shows the error screen`).toHaveCount(0);
    });
  }

  // A deep route survives a full reload offline too.
  await page.goto('/#/latihan/semak');
  await page.reload();
  await expect(page.locator('[data-screen="latihan-semak"]')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Buka Semak Mule sebenar' })).toBeVisible();

  expect(errors, 'uncaught page errors while offline').toEqual([]);
  expect(failed, 'requests that failed while offline').toEqual([]);
});
