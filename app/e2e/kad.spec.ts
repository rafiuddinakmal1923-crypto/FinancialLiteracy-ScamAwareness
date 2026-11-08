import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 412, height: 915 } });

test('report card, Kad book and a Kad Ilmu from a finished semester', async ({ page }) => {
  await page.goto('/#/demo/report');
  await expect(page).toHaveURL(/#\/semester\/rapor$/);
  await expect(page.getByRole('heading', { name: 'Laporan semester' })).toBeVisible();
  await expect(page.getByRole('img', { name: /^Gred semester: [ABCD]/ })).toBeVisible();
  await expect(page.getByText('Paling perlu dilatih:', { exact: false })).toBeVisible();
  await expect(page.getByText('Celik Kewangan setiap konsep')).toBeVisible();
  await expect(page.getByText('Imuniti setiap helah')).toBeVisible();
  await expect(page.getByRole('progressbar')).toHaveCount(13);
  await expect(page.getByText('Semester belum tamat')).toHaveCount(0);

  await page.goto('/#/kad');
  // The total comes from the content (FR-71), so optional scenarios such as raya_duit can add cards.
  await expect(page.getByText(/^7 \/ \d+ kad$/)).toBeVisible();
  await expect(page.getByText('???').first()).toBeVisible();
  await page.getByRole('button', { name: /^Kad bendera merah/ }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Tutup' }).click();

  await page.getByRole('tab', { name: 'Kad Ilmu' }).click();
  await expect(page.getByText('4 / 6 kad')).toBeVisible();
  await page.getByRole('button', { name: 'Kad Ilmu: Bajet' }).click();
  await expect(page).toHaveURL(/#\/kad\/ilmu\/bajet$/);
  await expect(page.getByRole('heading', { name: 'Apa itu' })).toBeVisible();
  await expect(page.getByText('Kad ini menerangkan, bukan mengesyorkan.')).toBeVisible();
});

test('an unearned Kad Ilmu code goes back to the Kad book', async ({ page }) => {
  await page.goto('/#/demo/report');
  await expect(page.getByRole('heading', { name: 'Laporan semester' })).toBeVisible();
  await page.goto('/#/kad/ilmu/semak');
  await expect(page).toHaveURL(/#\/kad$/);
});
