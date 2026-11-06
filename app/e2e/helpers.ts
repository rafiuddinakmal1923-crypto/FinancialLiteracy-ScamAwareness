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

/** From a seeded game: Sembang -> Kak Mira -> top-up path -> pays RM300 more (scammed, RM400 lost) -> consequence. */
export async function playScenario1ToEnd(page: Page, shot?: string): Promise<void> {
  await page.goto('/#/sembang');
  await page.getByRole('button', { name: /Kak Mira \(HR\)/ }).click();
  const replies = page.getByRole('group', { name: 'Pilih balasan' });
  const pick = async (name: string) => {
    const chip = replies.getByRole('button', { name });
    await expect(chip).toBeVisible({ timeout: 20_000 });
    await chip.click();
  };
  await pick('Minat! Macam mana nak mula?');
  await pick('Ok, saya top-up RM100.');
  await pick('Ok la, saya bayar RM300 lagi.');
  const next = page.getByRole('button', { name: 'Lihat apa jadi seterusnya' });
  await expect(next).toBeVisible({ timeout: 15_000 });
  if (shot) {
    await page.waitForTimeout(400); // let the end card settle before the review screenshot
    await page.screenshot({ path: shot });
  }
  await next.click();
}
