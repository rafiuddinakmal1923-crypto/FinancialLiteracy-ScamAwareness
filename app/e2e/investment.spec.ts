// Task 19 (milestone 4 gate): real vs fake investment and the costly BNPL, played in the chat with the Kalkulator.
// Seeds a saved game, moves it to the scenario's week, and plays each scenario to its consequence at 360x800
// (screenshots of the three finance consequences for review).
import { test, expect, type Page } from '@playwright/test';
import { patchSavedGame, seedGame } from './helpers';

test.use({ viewport: { width: 360, height: 800 } });
test.setTimeout(120_000);

const SHOTS = 'e2e/screens/360x800';

/** Opens a scenario's chat at its own week (the chat list rule: kawan_labur 5, crypto_naga 8, bayar_nanti 9). */
async function openChat(page: Page, id: string, week: number): Promise<void> {
  await seedGame(page);
  await patchSavedGame(page, { week, onboarded: true }, `/sembang/${id}`);
  await expect(page).toHaveURL(new RegExp(`#/sembang/${id}$`));
}

const replies = (page: Page) => page.getByRole('group', { name: 'Pilih balasan' });

async function pick(page: Page, name: string): Promise<void> {
  const chip = replies(page).getByRole('button', { name });
  await expect(chip).toBeVisible({ timeout: 25_000 });
  await chip.click();
}

/** From the end of the chat to the consequence screen. */
async function toConsequence(page: Page): Promise<void> {
  const next = page.getByRole('button', { name: 'Lihat apa jadi seterusnya' });
  await expect(next).toBeVisible({ timeout: 25_000 });
  await next.click();
  await expect(page.locator('[data-screen="akibat"]')).toBeVisible();
}

/** Opens the Kalkulator from the chat card and checks the preset URL. */
async function openCalc(page: Page, route: RegExp): Promise<void> {
  const open = page.getByRole('button', { name: 'Buka Kalkulator' });
  await expect(open).toBeVisible({ timeout: 25_000 });
  await open.click();
  await expect(page).toHaveURL(route);
}

test('sembang offers each scenario from its own week', async ({ page }) => {
  await seedGame(page);
  await patchSavedGame(page, { week: 4, onboarded: true }, '/sembang');
  await expect(page.getByRole('button', { name: /Kak Sofea/ })).toHaveCount(0);
  await patchSavedGame(page, { week: 9, onboarded: true }, '/sembang');
  for (const name of [/Kak Sofea/, /Group CryptoNaga/, /BayarNanti/]) {
    await expect(page.getByRole('button', { name })).toBeVisible();
  }
});

test('kawan_labur: check the licence first, put in RM100 -> untung', async ({ page }) => {
  await openChat(page, 'kawan_labur', 5);
  await expect(page.getByText(/Dana Ekuiti Cempaka/).first()).toBeVisible({ timeout: 25_000 });
  await pick(page, 'Macam mana nak tahu dana ni sah, kak?');
  await pick(page, 'Ok kak. Saya masukkan RM100 dulu, duit kecemasan saya tak usik.');
  await toConsequence(page);

  const screen = page.locator('[data-screen="akibat"]');
  await expect(screen.getByRole('heading', { level: 1 })).toHaveText('Kamu semak dulu, baru putuskan');
  await expect(screen.getByText(/Mesin Masa di Kalkulator/)).toBeVisible({ timeout: 10_000 });
  await expect(screen.getByText(/Kad Ilmu/).first()).toBeVisible({ timeout: 10_000 });
  await expect(screen.getByRole('button', { name: 'Cuba lagi' })).toBeVisible();
  // RM100 left Duit for Labur: the meter shows it, and it is not styled as a loss.
  await expect(screen.getByRole('group', { name: /^Duit/ })).toBeVisible();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/akibat-untung.png`, fullPage: true });
});

test('kawan_labur: skipping the check and paying the RM50 "ejen" fee -> rugi', async ({ page }) => {
  await openChat(page, 'kawan_labur', 5);
  await pick(page, 'Ejen kat kafe tu tawar daftar terus, yuran RM50 je. Saya bayar la.');
  await pick(page, 'Belum. Tapi dia kata RM50 je, lepas tu boleh masuk berapa pun. Saya bayar la.');
  await toConsequence(page);
  const screen = page.locator('[data-screen="akibat"]');
  await expect(screen.getByRole('heading', { level: 1 })).toHaveText('Pilihan itu kos kamu RM50');
  await expect(screen.getByText(/Kalau kamu semak senarai pemegang lesen/)).toBeVisible({ timeout: 10_000 });
  await expect(screen.getByRole('button', { name: 'Cuba lagi' })).toBeVisible();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/akibat-rugi.png`, fullPage: true });
});

test('crypto_naga: Kira dulu -> Semak Pulangan prefilled -> back -> refuse -> safe', async ({ page }) => {
  await openChat(page, 'crypto_naga', 8);
  await expect(page.getByText(/30% seminggu, confirm/)).toBeVisible({ timeout: 25_000 });
  await pick(page, 'Kira dulu berapa setahun');
  await openCalc(page, /#\/kalkulator\/pulangan\?preset=naga30w/);

  await expect(page.getByRole('textbox', { name: 'Janji pulangan (%)' })).toHaveValue('30');
  await expect(page.getByRole('radio', { name: 'minggu' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('Terlalu Lumayan', { exact: true })).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/crypto-naga-kalkulator.png` });
  await page.getByRole('button', { name: 'Kembali ke perbualan' }).click();

  // The chat resumes where it paused (no duplicated bubbles) and offers deposit or refuse.
  await expect(page).toHaveURL(/#\/sembang\/crypto_naga$/);
  await expect(page.getByText(/Dah kira\?/)).toBeVisible({ timeout: 25_000 });
  await expect(page.getByText(/30% seminggu, confirm/)).toHaveCount(1);
  await pick(page, 'Kalkulator kata mustahil. Saya tak masuk.');
  await toConsequence(page);
  await expect(page.locator('[data-screen="akibat"]').getByRole('heading', { level: 1 })).toHaveText('Kamu selamat');
});

test('crypto_naga: depositing RM500 after the calculator -> scammed', async ({ page }) => {
  await openChat(page, 'crypto_naga', 8);
  await pick(page, 'Kira dulu berapa setahun');
  await openCalc(page, /#\/kalkulator\/pulangan\?preset=naga30w/);
  await page.getByRole('button', { name: 'Kembali ke perbualan' }).click();
  await pick(page, 'Walaupun macam tu, saya deposit RM500 jugak.');
  await toConsequence(page);
  await expect(page.locator('[data-screen="akibat"]').getByRole('heading', { level: 1 })).toHaveText('RM500 hilang kepada penipu');
});

test('bayar_nanti: Kira dulu -> Kos Sebenar prefilled -> back -> take it -> hutang', async ({ page }) => {
  await openChat(page, 'bayar_nanti', 9);
  await expect(page.getByText(/Tiada faedah/)).toBeVisible({ timeout: 25_000 });
  await pick(page, 'Kira dulu');
  await openCalc(page, /#\/kalkulator\/kos\?preset=bayar1000/);

  const results = page.getByRole('region', { name: 'Hasil' });
  await expect(results.getByText('RM98.33')).toBeVisible();
  await expect(results.getByText('RM1,180.00')).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/bayar-nanti-kalkulator.png` });
  await page.getByRole('button', { name: 'Kembali ke perbualan' }).click();

  await expect(page).toHaveURL(/#\/sembang\/bayar_nanti$/);
  await pick(page, 'Saya faham jumlahnya. Telefon lama dah rosak, saya ambil jugak.');
  await toConsequence(page);

  const screen = page.locator('[data-screen="akibat"]');
  await expect(screen.getByRole('heading', { level: 1 })).toHaveText('Ansuran makan bajet mingguan kamu');
  await expect(screen.getByText(/RM1,180.00/)).toBeVisible({ timeout: 10_000 });
  // The help note (a legal.* key, TODO-VERIFY) follows the timeline.
  await expect(screen.getByRole('heading', { name: 'Di mana boleh dapat bantuan' })).toBeVisible({ timeout: 15_000 });
  await expect(screen.getByRole('button', { name: 'Cuba lagi' })).toBeVisible();
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${SHOTS}/akibat-hutang.png`, fullPage: true });
});

test('bayar_nanti: waiting and saving instead -> untung', async ({ page }) => {
  await openChat(page, 'bayar_nanti', 9);
  await pick(page, 'Tak apa, saya kumpul duit dulu.');
  await toConsequence(page);
  await expect(page.locator('[data-screen="akibat"]').getByRole('heading', { level: 1 })).toHaveText('Kamu tangguh dan duit kamu selamat');
});
