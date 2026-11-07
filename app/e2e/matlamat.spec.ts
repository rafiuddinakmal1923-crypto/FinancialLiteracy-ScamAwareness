import { test, expect } from '@playwright/test';
import { seedGame } from './helpers';

test.use({ viewport: { width: 412, height: 915 } });

// W4 done-when: pick a goal at week 0, the bar is visible in Dompet, and the pick survives a reload.
test('Matlamat: pick a goal after the week-0 split; its bar shows in Dompet', async ({ page }) => {
  await seedGame(page);
  await page.goto('/#/dompet');
  await page.getByRole('button', { name: 'Guna 50 / 30 / 20' }).click();
  await page.getByRole('button', { name: 'Sahkan bajet' }).click();

  const picker = page.locator('[data-slot="GoalPicker"]');
  await expect(picker.getByRole('heading', { name: 'Pilih matlamat semester' })).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/matlamat-picker-412x915.png' });
  await picker.getByRole('button', { name: /Dana kecemasan/ }).click();

  await expect(picker).toHaveCount(0);
  const bar = page.locator('[data-slot="GoalBar"]');
  await expect(bar.getByText('Matlamat: Dana kecemasan')).toBeVisible();
  await expect(bar.getByRole('progressbar', { name: 'Matlamat: Dana kecemasan' })).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/matlamat-bar-412x915.png' });

  await page.reload();
  await expect(page.locator('[data-slot="GoalBar"]').getByText('Matlamat: Dana kecemasan')).toBeVisible();
});
