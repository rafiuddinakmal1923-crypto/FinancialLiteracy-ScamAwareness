import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 412, height: 915 } });

// W7 done-when: the example explainer plays offline inside Kad Ilmu.
test('Tonton: Kuasa Kompaun plays its frames inside Kad Ilmu, offline', async ({ page, context }) => {
  await page.goto('/#/demo/report');
  await page.getByRole('heading', { name: 'Laporan semester' }).waitFor();
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);

  await page.goto('/#/kad/ilmu/kompaun');
  const slot = page.locator('[data-slot="ExplainerSlot"]');
  await expect(slot.getByRole('heading', { name: 'Tonton' })).toBeVisible();
  const img = slot.locator('img');
  const total = Number((await slot.getByText(/^1 \/ \d+$/).textContent())!.split('/')[1]);
  expect(total).toBeGreaterThanOrEqual(6);
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);

  await slot.getByRole('button', { name: 'Seterusnya', exact: true }).click();
  await expect(slot.getByText(`2 / ${total}`)).toBeVisible();
  await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: 'e2e/screens/tonton-412x915.png' });

  await slot.getByRole('button', { name: 'Main' }).click();
  await expect(slot.getByText(`3 / ${total}`)).toBeVisible({ timeout: 6000 });
  await slot.getByRole('button', { name: 'Jeda' }).click();
  await expect(slot.getByRole('button', { name: 'Main' })).toBeVisible();
});
