import { expect, type Page } from '@playwright/test';

/** Drives splash -> onboarding (Aina) -> home once, so a saved game exists. */
export async function seedGame(page: Page): Promise<void> {
  await page.goto('/#/');
  await page.getByRole('button', { name: 'Mula' }).click();
  await page.getByRole('button', { name: /Aina/ }).click();
  await page.getByRole('button', { name: 'Seterusnya' }).click();
  await page.getByRole('button', { name: 'Seterusnya' }).click();
  await page.getByRole('button', { name: 'Masuk semester' }).click();
  await expect(page.getByText('Minggu 1 daripada 12')).toBeVisible();
}
