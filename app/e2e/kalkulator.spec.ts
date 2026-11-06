import { expect, test } from '@playwright/test';
import { seedGame } from './helpers';

test.use({ viewport: { width: 412, height: 915 } });

const STRIP = 'Contoh sahaja, bukan nasihat pelaburan';

test('Kalkulator: home tile, three tabs with the strip, and the worked numbers', async ({ page }) => {
  await seedGame(page);
  await page.goto('/#/home');
  await page.getByRole('button', { name: 'Kalkulator' }).click();
  await expect(page).toHaveURL(/#\/kalkulator$/);

  // Mesin Masa (default tab): RM50 / 5% / 19 to 30.
  await expect(page.getByRole('tab', { name: 'Mesin Masa' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText(STRIP)).toBeVisible();
  await expect(page.getByText('RM8,775.28')).toBeVisible();
  await expect(page.getByText('Anda simpan RM6,600, pertumbuhan RM2,175.28')).toBeVisible();
  await expect(page.getByText('Mula awal, walaupun sedikit.')).toBeVisible();
  await page.getByRole('button', { name: '55' }).click();
  await expect(page.getByText('RM60,324.80')).toBeVisible();

  // Semak Pulangan: 10% a month.
  await page.getByRole('tab', { name: 'Semak Pulangan' }).click();
  await expect(page).toHaveURL(/#\/kalkulator\/pulangan$/);
  await expect(page.getByText(STRIP)).toBeVisible();
  await page.getByRole('textbox', { name: 'Janji pulangan (%)' }).fill('10');
  await page.getByRole('radio', { name: 'bulan' }).click();
  await expect(page.getByText('= 213.8% setahun')).toBeVisible();
  await expect(page.getByText('Terlalu Lumayan', { exact: true })).toBeVisible();
  await expect(page.getByText('Tiada pelaburan sah boleh jamin pulangan begini.')).toBeVisible();
  await expect(page.getByText('Semak dulu: SC Investor Alert List')).toBeVisible();
  await page.getByRole('textbox', { name: 'Janji pulangan (%)' }).fill('');
  await expect(page.getByText('Isi semua nombor')).toBeVisible();

  // Kos Sebenar: RM1,000 / 18% / 12 months.
  await page.getByRole('tab', { name: 'Kos Sebenar' }).click();
  await expect(page.getByText(STRIP)).toBeVisible();
  const results = page.getByRole('region', { name: 'Hasil' });
  await expect(results.getByText('RM98.33')).toBeVisible();
  await expect(results.getByText('RM1,180.00')).toBeVisible();
  await expect(results.getByText('RM180.00')).toBeVisible();
  await expect(results.getByText(/^31\.\d%$/)).toBeVisible();
});

test('a preset in the URL pre-fills the tab (hash router query)', async ({ page }) => {
  await seedGame(page);
  await page.goto('/#/kalkulator/pulangan?preset=naga30w');
  await expect(page.getByRole('textbox', { name: 'Janji pulangan (%)' })).toHaveValue('30');
  await expect(page.getByRole('radio', { name: 'minggu' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('Terlalu Lumayan', { exact: true })).toBeVisible();
  await expect(page.getByText(/CryptoNaga/)).toBeVisible();
  // Opened from the home screen, not a chat: no way back to a conversation, no XP award.
  await expect(page.getByRole('button', { name: 'Kembali ke perbualan' })).toHaveCount(0);

  await page.goto('/#/kalkulator/kos?preset=bayar1000');
  await expect(page.getByText('RM1,180.00')).toBeVisible();
  await page.goto('/#/kalkulator/masa?preset=labur50');
  await expect(page.getByText('RM8,775.28')).toBeVisible();
});
