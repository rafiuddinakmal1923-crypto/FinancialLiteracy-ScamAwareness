import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { seedGame } from './helpers';

type Item = { id: string; name: { ms: string }; effect: string };
const SHOP = JSON.parse(readFileSync(new URL('../../content/shop.json', import.meta.url), 'utf8')) as Item[];
const PRESETS = JSON.parse(readFileSync(new URL('../../content/calc-presets.json', import.meta.url), 'utf8')) as { id: string }[];
const PHONE = SHOP.find((i) => i.effect === 'instalment');
const PHONE_READY = PHONE && PRESETS.some((p) => p.id === `kedai-${PHONE.id}`) ? PHONE : undefined;

async function openKedai(page: import('@playwright/test').Page) {
  await seedGame(page);
  await page.goto('/#/home');
  await page.getByRole('navigation', { name: 'Aplikasi' }).getByRole('button', { name: 'Kedai', exact: true }).click();
  return page.locator('[data-screen="kedai"]');
}

for (const vp of [{ width: 360, height: 800 }, { width: 412, height: 915 }, { width: 1920, height: 1080 }]) {
  test(`Kedai shelf shows every item without overflow at ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp);
    const screen = await openKedai(page);
    await expect(screen.getByText('Duit kamu: RM2,000')).toBeVisible();
    const items = screen.locator('[data-item]');
    await expect(items).toHaveCount(SHOP.length);
    const box = (await screen.boundingBox())!;
    for (const card of await items.all()) {
      const b = (await card.boundingBox())!;
      expect(b.x + b.width).toBeLessThanOrEqual(box.x + box.width + 0.5);
    }
    await page.screenshot({ path: `e2e/screens/kedai-shelf-${vp.width}x${vp.height}.png` });
  });
}

test.describe('buying', () => {
  test.use({ viewport: { width: 412, height: 915 } });

  test('a cash item opens a confirm sheet that names the price and pot', async ({ page }) => {
    const cash = SHOP.find((i) => i.effect !== 'instalment')!;
    const screen = await openKedai(page);
    await screen.locator(`[data-item="${cash.id}"]`).getByRole('button', { name: 'Beli' }).click();
    const sheet = page.getByRole('dialog', { name: `Beli ${cash.name.ms}?` });
    await expect(sheet).toContainText('dibayar dari Duit');
    await page.screenshot({ path: 'e2e/screens/kedai-confirm-412x915.png' });
    await sheet.getByRole('button', { name: 'Tak jadi' }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  // W3 done-when (plan): needs C3 (the phone in content/shop.json and its kedai-<id> preset in calc-presets.json).
  test('buying the phone shows Kos Sebenar before the confirm sheet', async ({ page }) => {
    test.fixme(!PHONE_READY, 'waits for Danish (C3): an instalment item in content/shop.json and its kedai-<id> preset');
    const screen = await openKedai(page);
    await screen.locator(`[data-item="${PHONE_READY!.id}"]`).getByRole('button', { name: 'Beli ansuran' }).click();
    await expect(page).toHaveURL(/#\/kalkulator.*preset=kedai-/);
    await expect(page.getByRole('tab', { name: 'Kos Sebenar', selected: true })).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Kembali' }).first().click();
    const sheet = page.getByRole('dialog', { name: `Beli ${PHONE_READY!.name.ms}?` });
    await expect(sheet).toContainText('Jumlah sebenar: RM1,320');
  });
});
