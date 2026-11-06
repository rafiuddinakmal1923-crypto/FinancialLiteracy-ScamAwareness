import { test, expect } from '@playwright/test';
import { seedGame } from './helpers';

test.use({ viewport: { width: 412, height: 915 } });

test('splash -> onboarding -> home', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Celik' })).toBeVisible();
  await expect(page.getByText('Bijak duit, kebal scam')).toBeVisible();
  await expect(page.getByText(/Semua nama bank, syarikat dan individu dalam permainan ini adalah rekaan/)).toBeVisible();
  await page.getByRole('button', { name: 'Mula' }).click();

  // Step 1: choose character; the name is fixed.
  await expect(page).toHaveURL(/#\/onboarding$/);
  const next = page.getByRole('button', { name: 'Seterusnya' });
  await expect(next).toBeDisabled();
  await page.getByRole('button', { name: /Aina/ }).click();
  await expect(page.getByRole('button', { name: /Aina/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByTestId('chosen-name')).toHaveText('Aina');
  await expect(page.getByRole('textbox')).toHaveCount(0);
  await next.click();

  // Step 2: situation.
  await expect(page.getByText(/Pelajar tahun 1, Universiti Cempaka Raya \(UCR\)/)).toBeVisible();
  await next.click();

  // Step 3: Sang Kancil.
  await expect(page.getByText(/Saya Sang Kancil\. Saya tahu semua helah\./)).toBeVisible();
  await page.getByRole('button', { name: 'Masuk semester' }).click();

  // Home v2 (S03).
  await expect(page).toHaveURL(/#\/home$/);
  await expect(page.getByRole('img', { name: /^Celik Kewangan \d+ daripada 100/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /^Imuniti \d+ daripada 100/ })).toBeVisible();
  await expect(page.getByText('Celik Kewangan', { exact: true })).toBeVisible();
  await expect(page.getByText('Imuniti', { exact: true })).toBeVisible();
  await expect(page.getByText('Pemula', { exact: true })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'XP' })).toBeVisible();
  await expect(page.getByText('Minggu 1 daripada 12')).toBeVisible();
  await expect(page.getByText('Nilai bersih RM2,000')).toBeVisible();
  const apps = page.getByRole('navigation', { name: 'Aplikasi' });
  for (const app of ['Sembang', 'BankKu', 'Dompet', 'Kalkulator', 'Kad', 'Latihan', 'Tetapan']) {
    await expect(apps.getByRole('button', { name: app, exact: true })).toBeVisible();
  }
  await expect(apps.getByRole('button')).toHaveCount(7);
  const dock = page.getByRole('region', { name: 'Mod permainan' });
  await expect(dock.getByRole('button', { name: /^Semester Pertama/ })).toBeVisible();
  await expect(dock.getByRole('button', { name: /^Cek Harian/ })).toContainText('hari ini: belum');
  await expect(dock.getByRole('button', { name: /^Mod Kelas/ })).toBeVisible();
  const sindiket = dock.getByText('Mod Sindiket').locator('xpath=ancestor::*[@data-locked][1]');
  await expect(sindiket).toContainText('Akan datang');
  await expect(sindiket).toHaveAttribute('aria-disabled', 'true');
  await expect(dock.getByRole('button')).toHaveCount(3);
  await page.screenshot({ path: 'e2e/screens/412x915/home-v2.png' });
  await expect(page.getByText('Isn, Minggu 1')).toBeVisible();
  await expect(page.getByTestId('demo-watermark')).toBeVisible();
});

test('settings toggle hides the DEMO watermark and it stays hidden after reload', async ({ page }) => {
  await seedGame(page);
  await expect(page.getByTestId('demo-watermark')).toBeVisible();
  await page.getByRole('button', { name: 'Tetapan', exact: true }).click();
  await expect(page).toHaveURL(/#\/settings$/);
  const demo = page.getByRole('switch', { name: /DEMO/ });
  await expect(demo).toHaveAttribute('aria-checked', 'true');
  await demo.click();
  await expect(demo).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByTestId('demo-watermark')).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('switch', { name: /DEMO/ })).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByTestId('demo-watermark')).toHaveCount(0);
});

test('saved game: Mula goes straight home; unknown routes go home', async ({ page }) => {
  await seedGame(page);
  await page.goto('/#/');
  await page.reload();
  await page.getByRole('button', { name: 'Mula' }).click();
  await expect(page).toHaveURL(/#\/home$/);
  await page.goto('/#/tiada-laluan');
  await expect(page).toHaveURL(/#\/home$/);
  await expect(page.getByText('Minggu 1 daripada 12')).toBeVisible();
});

test('tiles without a screen yet show an "Akan datang" toast', async ({ page }) => {
  await seedGame(page);
  await page.getByRole('button', { name: 'Kad', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Akan datang' })).toBeVisible();
  await expect(page).toHaveURL(/#\/home$/);
});

test('language toggle switches to English and back', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByText('Money-smart, scam-proof')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start' })).toBeVisible();
  await page.getByRole('button', { name: 'BM', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Mula' })).toBeVisible();
});

test('reset progress asks for confirmation and returns to the splash', async ({ page }) => {
  await seedGame(page);
  await page.goto('/#/settings');
  await page.getByRole('button', { name: 'Mula semula semester' }).click();
  await page.getByRole('button', { name: 'Ya, padam kemajuan' }).click();
  await expect(page).toHaveURL(/#\/$/);
  await page.getByRole('button', { name: 'Mula' }).click();
  await expect(page).toHaveURL(/#\/onboarding$/);
});

test('demo scene route renders a placeholder', async ({ page }) => {
  await page.goto('/#/demo/scam1');
  await expect(page.getByText('Akan datang')).toBeVisible();
});
