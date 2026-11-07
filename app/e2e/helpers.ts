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
  // The save is debounced: a reload before it lands would lose the game.
  await page.waitForFunction(() => new Promise<boolean>((resolve) => {
    const open = indexedDB.open('celik');
    open.onerror = () => resolve(false);
    open.onsuccess = () => {
      const db = open.result;
      if (!db.objectStoreNames.contains('save')) { db.close(); resolve(false); return; }
      const get = db.transaction('save', 'readonly').objectStore('save').get('main');
      get.onerror = () => { db.close(); resolve(false); };
      get.onsuccess = () => { db.close(); resolve(get.result?.data?.game?.onboarded === true); };
    };
  }));
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
    type Row = { id: string; data: { game: Record<string, unknown> } };
    const read = () => new Promise<Row | undefined>((resolve, reject) => {
      const req = db.transaction('save', 'readonly').objectStore('save').get('main');
      req.onsuccess = () => resolve(req.result as Row | undefined);
      req.onerror = () => reject(req.error);
    });
    // The app's pagehide save (from leaving the app page) can still be committing: wait for the row instead of racing it.
    let row = await read();
    for (let i = 0; !row && i < 50; i++) { await new Promise((r) => setTimeout(r, 100)); row = await read(); }
    if (!row) throw new Error('patchSavedGame: no saved game in IndexedDB');
    const store = db.transaction('save', 'readwrite').objectStore('save');
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

/**
 * The SIMULASI banner sits below the phone status bar (y >= 48) and fully inside the viewport, and so does the
 * screen's primary button. `toBeVisible()` alone passes even when a scrolled ancestor pushes the banner under the
 * status bar.
 */
export async function expectBannerInView(page: Page, primary: string): Promise<void> {
  const vh = page.viewportSize()!.height;
  const banner = (await page.getByText('SIMULASI - bukan laman/aplikasi sebenar').boundingBox())!;
  expect(banner.y, 'banner under the status bar').toBeGreaterThanOrEqual(48);
  expect(banner.y + banner.height, 'banner inside the viewport').toBeLessThanOrEqual(vh);
  const button = (await page.getByRole('button', { name: primary }).boundingBox())!;
  expect(button.y, `${primary} inside the viewport`).toBeGreaterThanOrEqual(48);
  expect(button.y + button.height, `${primary} inside the viewport`).toBeLessThanOrEqual(vh);
}

/**
 * On /harian: answers cards by their buttons (Scam / BETUL / tile A, whichever the card offers) until card number
 * `until` has been answered, waiting for its reason each time. Cards before it are moved past with Seterusnya.
 * With `finish` it also presses Lihat keputusan after the fifth card.
 */
export async function playHarianCards(page: Page, until: number, finish = false): Promise<void> {
  for (;;) {
    const counter = page.getByText(/^Kad \d daripada 5$/);
    await expect(counter).toBeVisible();
    const n = Number((await counter.textContent())!.match(/\d/)![0]);
    const scam = page.getByRole('button', { name: 'Scam', exact: true });
    const betul = page.getByRole('button', { name: 'BETUL', exact: true });
    const tileA = page.getByRole('button', { name: /^A: / });
    await expect(scam.or(betul).or(tileA).first()).toBeVisible();
    if (await scam.count()) await scam.click();
    else if (await betul.count()) await betul.click();
    else await tileA.click();
    await expect(page.locator('[data-verdict]')).toBeVisible();
    if (n >= until) {
      if (n === 5 && finish) await page.getByRole('button', { name: 'Lihat keputusan' }).click();
      return;
    }
    await page.getByRole('button', { name: 'Seterusnya' }).click();
  }
}

/**
 * Mod Kelas, from the lobby (default Campur, 2 teams): Mula, then plays `rounds` rounds. Pasukan Merah always takes
 * its first button and Pasukan Biru its second, so the scores depend on the cards but stay in multiples of 100.
 * Stops on the scoreboard of the last round played unless `through` is set; then it moves on past it.
 */
export async function playKelasRounds(page: Page, rounds: number, through = true): Promise<void> {
  await page.getByRole('button', { name: 'Mula', exact: true }).click();
  for (let r = 1; r <= rounds; r++) {
    await expect(page.getByText(`Pusingan ${r} / 10`)).toBeVisible();
    await page.getByRole('group', { name: 'Pasukan Merah' }).getByRole('button').first().click();
    await page.getByRole('group', { name: 'Pasukan Biru' }).getByRole('button').nth(1).click();
    await page.getByRole('button', { name: 'Dedahkan', exact: true }).click();
    await page.getByRole('button', { name: 'Papan skor', exact: true }).click();
    if (r < rounds || through) {
      await page.getByRole('button', { name: r === 10 ? 'Lihat pemenang' : 'Pusingan seterusnya', exact: true }).click();
    }
  }
}
