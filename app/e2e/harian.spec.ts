import { expect, test } from '@playwright/test';
import { playHarianCards, seedGame } from './helpers';

test.use({ viewport: { width: 412, height: 915 } });

test('Cek Harian: 5 cards by buttons, results with the streak, then Datang lagi esok after a reload', async ({ page }) => {
  await seedGame(page);
  await page.goto('/#/home');
  await page.getByRole('button', { name: /Cek Harian/ }).click();
  await expect(page).toHaveURL(/#\/harian$/);
  await expect(page.getByText('Cek Harian · 5 kad · ~2 minit')).toBeVisible();
  await expect(page.getByText('Kad 1 daripada 5')).toBeVisible();
  // No timer on this screen.
  await expect(page.getByRole('progressbar')).toHaveCount(0);

  await playHarianCards(page, 5, true);
  await expect(page.getByText(/^\d \/ 5$/)).toBeVisible();
  await expect(page.getByText('Streak +1')).toBeVisible();
  await expect(page.getByText('1 hari berturut')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Main 60 saat' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Selesai' })).toBeVisible();

  // A reload (and a replay) the same day: no cards, no scoring.
  await page.reload();
  await expect(page.getByText('Datang lagi esok')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Scam', exact: true })).toHaveCount(0);
  await expect(page.getByTestId('streak-day')).toHaveCount(7);
});

test('Cek Harian: a reload in the middle of a round resumes at the same card', async ({ page }) => {
  await seedGame(page);
  await page.goto('/#/harian');
  await playHarianCards(page, 2);
  await page.getByRole('button', { name: 'Seterusnya' }).click();
  await expect(page.getByText('Kad 3 daripada 5')).toBeVisible();
  await page.waitForTimeout(500); // the debounced save
  await page.reload();
  await expect(page.getByText('Kad 3 daripada 5')).toBeVisible();
});

test('Sahih atau Scam: the clock pauses during the reason and the round ends with results', async ({ page }) => {
  await seedGame(page);
  await page.goto('/#/harian');
  await playHarianCards(page, 5, true);
  await page.getByRole('button', { name: 'Main 60 saat' }).click();
  await expect(page).toHaveURL(/#\/swipe$/);
  await page.getByRole('button', { name: 'Mula' }).click();

  const seconds = page.getByTestId('seconds');
  await expect(seconds).toHaveText('60');
  await page.waitForTimeout(2300);
  expect(Number(await seconds.textContent())).toBeLessThanOrEqual(58);

  await page.getByRole('button', { name: 'Scam', exact: true }).click();
  const reason = page.locator('[data-verdict]');
  await expect(reason).toBeVisible();
  const before = Number(await seconds.textContent());
  // While the reason shows (1.5 s) the displayed seconds must not drop.
  for (let i = 0; i < 4; i++) {
    expect(Number(await seconds.textContent())).toBe(before);
    await page.waitForTimeout(250);
  }
  await expect(reason).toBeHidden({ timeout: 3000 });

  for (let i = 0; i < 9; i++) {
    await page.getByRole('button', { name: 'Sahih', exact: true }).click();
    await expect(reason).toBeVisible();
    await expect(reason).toBeHidden({ timeout: 3000 });
  }
  await expect(page.getByText('Semua kad dijawab')).toBeVisible();
  await expect(page.getByText(/^\d+ \/ 10$/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Main lagi' })).toBeVisible();
});
