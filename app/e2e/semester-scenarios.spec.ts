// Task 24: two of the five remaining semester scenarios, played to their consequence screen at 360x800.
import { test, expect, type Page } from '@playwright/test';
import { patchSavedGame, seedGame } from './helpers';

test.use({ viewport: { width: 360, height: 800 } });
test.setTimeout(120_000);

async function openChat(page: Page, id: string, week: number): Promise<void> {
  await seedGame(page);
  await patchSavedGame(page, { week, onboarded: true }, `/sembang/${id}`);
  await expect(page).toHaveURL(new RegExp(`#/sembang/${id}$`));
}

async function pick(page: Page, name: string): Promise<void> {
  const chip = page.getByRole('group', { name: 'Pilih balasan' }).getByRole('button', { name });
  await expect(chip).toBeVisible({ timeout: 25_000 });
  await chip.click();
}

async function toConsequence(page: Page): Promise<void> {
  const next = page.getByRole('button', { name: 'Lihat apa jadi seterusnya' });
  await expect(next).toBeVisible({ timeout: 25_000 });
  await next.click();
  await expect(page.locator('[data-screen="akibat"]')).toBeVisible();
}

test('sembang lists the new chats from their own weeks', async ({ page }) => {
  await seedGame(page);
  await patchSavedGame(page, { week: 6, onboarded: true }, '/sembang');
  await expect(page.getByRole('button', { name: /Hafiz/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /BankKu/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Farhan/ })).toHaveCount(0);
});

test('alert_bankku: call the number on the card -> safe', async ({ page }) => {
  await openChat(page, 'alert_bankku', 6);
  await expect(page.getByText(/RM89\.90/).first()).toBeVisible({ timeout: 25_000 });
  await pick(page, 'Telefon nombor di belakang kad aku.');
  await toConsequence(page);
  await expect(page.locator('[data-screen="akibat"]').getByRole('heading', { level: 1 })).toHaveText('Kamu selamat');
});

test('alert_bankku: blocking the real alert unread -> curiga', async ({ page }) => {
  await openChat(page, 'alert_bankku', 6);
  await pick(page, 'Mesti scam! Aku sekat BankKu, tak payah tengok apa-apa.');
  await toConsequence(page);
  await expect(page.locator('[data-screen="akibat"]').getByRole('heading', { level: 1 })).toHaveText('Amaran itu sebenar, tapi tak disemak');
});

test('panggilan_mahkamah: ask, then check it yourself -> safe', async ({ page }) => {
  await openChat(page, 'panggilan_mahkamah', 11);
  await expect(page.getByText(/waran tangkap/).first()).toBeVisible({ timeout: 25_000 });
  await pick(page, 'Hah? Saya tak pernah hantar apa-apa bungkusan.');
  await pick(page, 'Minta nama dan nombor Inspektor. Saya semak sendiri dulu.');
  await toConsequence(page);
  await expect(page.locator('[data-screen="akibat"]').getByRole('heading', { level: 1 })).toHaveText('Kamu selamat');
});

test('panggilan_mahkamah: following the "Inspektor" -> RM300 lost, its own consequence copy', async ({ page }) => {
  await openChat(page, 'panggilan_mahkamah', 11);
  await pick(page, 'Baik, Inspektor. Saya akan ikut arahan.');
  await toConsequence(page);
  await expect(page.locator('[data-screen="akibat"]').getByRole('heading', { level: 1 })).toHaveText('RM300 dipindahkan kerana ugutan');
});
