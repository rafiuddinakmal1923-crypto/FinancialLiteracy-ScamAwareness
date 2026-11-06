import { test, expect } from '@playwright/test';
import { patchSavedGame, SAMPLE_TX, seedGame } from './helpers';

test.use({ viewport: { width: 412, height: 915 } });

test('BankKu tile opens /bankku with the balance and read-only Pelaburan rows', async ({ page }) => {
  await seedGame(page);
  await page.getByRole('navigation', { name: 'Aplikasi' }).getByRole('button', { name: 'BankKu', exact: true }).click();
  await expect(page).toHaveURL(/#\/bankku$/);
  await expect(page.getByText('SIMULASI - bukan laman/aplikasi sebenar')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Baki tersedia' }).getByText(/^RM[\d,]+\.\d{2}$/)).toBeVisible();
  const invest = page.getByRole('region', { name: 'Pelaburan' });
  await expect(invest.getByText('Amanah Cempaka')).toBeVisible();
  await expect(invest.getByText('Dana Ekuiti Cempaka')).toBeVisible();
  await expect(invest.getByRole('button')).toHaveCount(0);
});

test('a frozen account shows the red banner and leads home when nothing is pending', async ({ page }) => {
  await seedGame(page);
  await patchSavedGame(page, { meters: { akaun: 'Disekat', duit: 0 }, txLog: SAMPLE_TX }, '/bankku');
  await expect(page.getByText('Akaun anda telah dibekukan')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Baki tersedia' }).getByText('RM0.00')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Transaksi terkini' }).getByRole('listitem')).toHaveCount(5);
  await page.getByRole('button', { name: 'Lihat apa jadi seterusnya' }).click();
  await expect(page).toHaveURL(/#\/home$/);
});
