import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

test.use({ viewport: { width: 412, height: 915 } });

/** Width and height from a PNG's IHDR chunk. */
function pngSize(buf: Buffer): { width: number; height: number } {
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// W6 done-when: downloads a PNG with the SIMULASI label and the character's name, and nothing to type into.
test('Kad Keputusan: the report card downloads a 1080 x 1350 PNG', async ({ page }) => {
  await page.goto('/#/demo/report');
  await page.getByRole('heading', { name: 'Laporan semester' }).waitFor();
  const share = page.locator('[data-slot="ShareButton"]');
  await expect(share.locator('input, textarea')).toHaveCount(0);

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    share.getByRole('button', { name: 'Kongsi Kad Keputusan' }).click(),
  ]);
  expect(download.suggestedFilename()).toBe('celik-kad-keputusan.png');
  const file = await download.path();
  const buf = readFileSync(file);
  expect(buf.subarray(1, 4).toString()).toBe('PNG');
  expect(pngSize(buf)).toEqual({ width: 1080, height: 1350 });
  await download.saveAs('e2e/screens/kad-keputusan.png');
  await expect(page.getByText('Kad Keputusan disimpan.')).toBeVisible();
});

test('Kad Keputusan: the card itself carries SIMULASI and the character name', async ({ page }) => {
  await page.goto('/#/demo/report');
  await page.getByRole('heading', { name: 'Laporan semester' }).waitFor();
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Kongsi Kad Keputusan' }).click();
  const card = page.locator('[data-card="kad-keputusan"]');
  await expect(card).toContainText('SIMULASI');
  await expect(card).toContainText('Aina');
  await expect(card).toContainText('Kenali jerat sebelum terjerat');
  await downloading;
});
