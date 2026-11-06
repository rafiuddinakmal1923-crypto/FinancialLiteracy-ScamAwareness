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

/**
 * Edits the saved game in IndexedDB, then reopens the app at `path`. The edit runs on a static asset page of the
 * same origin, so the app's own pagehide save cannot overwrite it.
 */
export async function patchSavedGame(page: Page, patch: Record<string, unknown>, path: string): Promise<void> {
  await page.goto('/icon.svg');
  await page.evaluate(async (p) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('celik');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const store = db.transaction('save', 'readwrite').objectStore('save');
    const row = await new Promise<{ id: string; data: { game: Record<string, unknown> } }>((resolve, reject) => {
      const req = store.get('main');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const game = row.data.game;
    for (const [k, v] of Object.entries(p)) {
      game[k] = k === 'meters' ? { ...(game.meters as object), ...(v as object) } : v;
    }
    await new Promise<void>((resolve, reject) => {
      const req = store.put(row);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    db.close();
  }, patch);
  await page.goto(`/#${path}`);
}

/** A few BankKu transactions (income, week costs, a transfer) for the screenshots. */
export const SAMPLE_TX = [
  { id: 1, week: 1, label: 'Buku rujukan', amount: -45 },
  { id: 2, week: 2, label: 'Makan seminggu', amount: -80 },
  { id: 3, week: 3, label: 'Abang Zul', amount: 500 },
  { id: 4, week: 3, label: 'Abang Zul', amount: -500 },
  { id: 5, week: 4, label: 'bankku.tx.income', amount: 400 },
  { id: 6, week: 4, label: 'Tambah nilai telefon', amount: -10.5 },
];

/**
 * In the sewa_akaun chat (after `#/demo/mule`): accepts Abang Zul's offer and lends the account, waits for the
 * transfer card, optionally screenshots the chat, then opens the BankKu transfer overlay.
 */
export async function acceptMuleOffer(page: Page, shot?: string): Promise<void> {
  await expect(page).toHaveURL(/#\/sembang\/sewa_akaun$/);
  const replies = page.getByRole('group', { name: 'Pilih balasan' });
  const pick = async (name: string) => {
    const chip = replies.getByRole('button', { name });
    await expect(chip).toBeVisible({ timeout: 20_000 });
    await chip.click();
  };
  await pick('Serius RM1,500? Ok, macam mana?');
  await pick('Ok bang, ambil la nombor akaun saya.');
  const open = page.getByRole('button', { name: 'Buka BankKu' });
  await expect(open).toBeVisible({ timeout: 20_000 });
  if (shot) {
    await page.waitForTimeout(400);
    await page.screenshot({ path: shot });
  }
  await open.click();
  await expect(page.locator('[data-screen="bankku-transfer"]')).toBeVisible();
}
