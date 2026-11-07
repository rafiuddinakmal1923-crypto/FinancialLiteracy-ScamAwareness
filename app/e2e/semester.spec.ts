// Task 25: the whole Semester Pertama. Onboard, set the budget split, play all 12 weeks always taking the first
// reply chip, and end on the report route. Reduced motion is emulated so typing pauses are short.
import { test, expect, type Page } from '@playwright/test';
import { patchSavedGame, seedGame } from './helpers';

test.use({ viewport: { width: 412, height: 915 }, reducedMotion: 'reduce' });

/** The saved game from IndexedDB (the autosave is debounced, so wait a moment first). */
async function savedGame(page: Page): Promise<Record<string, unknown>> {
  await page.waitForTimeout(700);
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open('celik');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    const row = await new Promise<{ data: { game: Record<string, unknown> } }>((resolve, reject) => {
      const req = db.transaction('save').objectStore('save').get('main');
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return row.data.game;
  });
}

/** The TAC / link overlay on top of a chat: Sahkan, Hantar TAC, or the page's own button (never the close icon). */
async function finishOverlay(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 4 && (await dialog.count()) > 0; i++) {
    const tac = dialog.getByRole('button', { name: 'Hantar TAC' });
    const sahkan = dialog.getByRole('button', { name: 'Sahkan', exact: true });
    if (await tac.count()) await tac.click();
    else if (await sahkan.count()) await sahkan.click();
    else await dialog.getByRole('button').filter({ hasNot: page.getByLabel('Tutup laman') }).last().click();
    await page.waitForTimeout(250);
  }
  await expect(dialog).toHaveCount(0);
}

/**
 * Plays the open chat or call to its end: takes the first reply chip each time (not "Tanya Kancil"), handles the
 * BankKu / fake page overlay and the Kalkulator hook ("Buka Kalkulator" -> "Kembali ke perbualan"), and stops
 * after "Lihat apa jadi seterusnya" is pressed.
 */
async function playToConsequence(page: Page): Promise<void> {
  const next = page.getByRole('button', { name: 'Lihat apa jadi seterusnya' });
  const chip = page.getByRole('group', { name: 'Pilih balasan' }).getByRole('button').filter({ hasNotText: 'Tanya Kancil' }).first();
  const bank = page.getByRole('button', { name: 'Buka BankKu' });
  const link = page.getByRole('button', { name: 'Buka pautan' });
  const calc = page.getByRole('button', { name: 'Buka Kalkulator' });
  for (let step = 0; step < 40; step++) {
    await expect(next.or(chip).or(bank).or(link).or(calc).first()).toBeVisible({ timeout: 40_000 });
    if (await next.count()) { await next.click(); return; }
    if (await bank.count() || await link.count()) {
      await (await bank.count() ? bank : link).click();
      await finishOverlay(page);
    } else if (await calc.count()) {
      await calc.click();
      await page.getByRole('button', { name: 'Kembali ke perbualan' }).click();
    } else {
      const label = (await chip.innerText()).trim();
      await chip.click();
      await expect(page.getByRole('group', { name: 'Pilih balasan' }).getByRole('button', { name: label, exact: true })).toHaveCount(0);
    }
  }
  throw new Error('scenario did not end');
}

/** Consequence -> flag hunt (skipped by route) -> debrief -> home. */
async function afterScenario(page: Page, id: string): Promise<void> {
  await expect(page.locator('[data-screen="akibat"]')).toBeVisible();
  await page.locator('[data-screen="akibat"] button').last().click();
  if (/#\/semester\/bendera\//.test(page.url())) {
    await expect(page.locator('[data-screen="bendera"]')).toBeVisible();
    await page.evaluate((i) => { window.location.hash = `#/semester/debrief/${i}`; }, id);
  }
  await expect(page).toHaveURL(new RegExp(`#/semester/debrief/${id}$`));
  await page.getByRole('button', { name: 'Faham, teruskan' }).click();
  await expect(page).toHaveURL(/#\/home$/);
}

const SCENARIO_WEEKS: [number, string, 'chat' | 'call'][] = [
  [1, 'kerja_sambilan', 'chat'], [2, 'dompet_minggu0', 'chat'], [3, 'sewa_akaun', 'chat'], [4, 'gaji_pertama', 'chat'],
  [5, 'kawan_labur', 'chat'], [6, 'alert_bankku', 'chat'], [8, 'crypto_naga', 'chat'], [9, 'bayar_nanti', 'chat'],
  [10, 'buku_terpakai', 'chat'], [11, 'panggilan_mahkamah', 'call'],
];

test('the whole semester: 12 weeks, 10 scenarios, ends on the report', async ({ page }) => {
  test.setTimeout(600_000);
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await seedGame(page);
  await page.goto('/#/home');
  const tile = page.getByRole('button', { name: /^Semester Pertama/ });
  await expect(tile).toContainText('Mula Minggu 1');
  await tile.click();
  await expect(page).toHaveURL(/#\/dompet$/);
  await page.getByRole('button', { name: 'Sahkan bajet' }).click();

  for (let week = 1; week <= 12; week++) {
    await page.goto('/#/home');
    if (week === 1) await page.getByRole('button', { name: /^Semester Pertama/ }).click();
    else await page.getByRole('button', { name: 'Minggu seterusnya' }).click();
    await expect(page).toHaveURL(/#\/semester\/minggu$/);
    await expect(page.getByRole('heading', { name: `Minggu ${week}`, exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Teruskan', exact: true }).click();

    const sc = SCENARIO_WEEKS.find(([w]) => w === week);
    if (sc) {
      const [, id, kind] = sc;
      if (kind === 'chat') {
        await expect(page.getByText(/^Mesej baru dari/)).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`#/sembang/${id}$`));
      } else {
        await expect(page).toHaveURL(new RegExp(`#/panggilan/${id}$`));
        await page.getByRole('button', { name: 'Terima' }).click();
      }
      await playToConsequence(page);
      await afterScenario(page, id);
      // The week is done: the tile moves on and the same scenario cannot be played again.
      await expect(page.getByRole('button', { name: /^Semester Pertama/ })).toContainText(week === 11 ? 'Teruskan Minggu 12' : `Teruskan Minggu ${week + 1}`);
    } else if (week === 7) {
      await expect(page.getByRole('heading', { name: 'Cuti pertengahan semester' })).toBeVisible();
      await page.getByRole('button', { name: 'Kira dengan Mesin Masa' }).click();
      await expect(page).toHaveURL(/#\/kalkulator\/masa\?preset=labur50$/);
      await page.goBack();
      await page.getByRole('button', { name: 'Teruskan', exact: true }).click();
      await expect(page).toHaveURL(/#\/home$/);
    } else {
      await expect(page).toHaveURL(/#\/semester\/rapor$/);
      await expect(page.getByRole('heading', { name: 'Laporan semester' })).toBeVisible();
    }
  }

  const game = await savedGame(page);
  expect((game.results as unknown[]).length).toBe(10);
  expect(game.week).toBe(12);
  await page.goto('/#/home');
  await expect(page.getByText('Minggu 12 daripada 12')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a finished chat cannot be played again, and a call id is not a chat', async ({ page }) => {
  test.setTimeout(120_000);
  await seedGame(page);
  await patchSavedGame(page, {
    week: 1, onboarded: true, budget: { needs: 50, wants: 30, savings: 20 },
    results: [{ id: 'kerja_sambilan', outcome: 'safe', right: true, flagsFound: 0, flagsTotal: 3, tactics: ['greed'], family: 'job', concepts: [] }],
    transcripts: { kerja_sambilan: [{ id: 1, from: 'them', speaker: 'Kak Mira (HR)', text: 'Kerja senang.', flags: [] }] },
  }, '/sembang/kerja_sambilan');
  await expect(page.getByText('Kerja senang.')).toBeVisible();
  await expect(page.getByRole('group', { name: 'Pilih balasan' })).toHaveCount(0);
  await page.goto('/#/sembang/panggilan_mahkamah');
  await expect(page).toHaveURL(/#\/sembang$/);
});

test('a typed URL cannot play a scenario before its week (A6)', async ({ page }) => {
  await seedGame(page);
  await page.goto('/#/sembang/sewa_akaun');
  await expect(page).toHaveURL(/#\/sembang$/);
  await page.goto('/#/panggilan/panggilan_mahkamah');
  await expect(page).toHaveURL(/#\/home$/);
});
