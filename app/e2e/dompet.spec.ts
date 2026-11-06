import { test, expect, type Page } from '@playwright/test';
import { seedGame } from './helpers';

test.use({ viewport: { width: 412, height: 915 } });

async function sliderValues(page: Page): Promise<number[]> {
  const out: number[] = [];
  for (const name of ['Keperluan', 'Kehendak', 'Simpanan']) {
    out.push(Number(await page.getByRole('slider', { name }).inputValue()));
  }
  return out;
}

/** Week 0 in Dompet: Kancil's 50/30/20, then Simpanan down to 10% (RM200, under the RM300 emergency target). */
async function confirmBudget(page: Page): Promise<void> {
  await page.goto('/#/dompet');
  await page.getByRole('button', { name: 'Guna 50 / 30 / 20' }).click();
  const simpanan = page.getByRole('slider', { name: 'Simpanan' });
  await simpanan.focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(simpanan).toHaveValue('10');
  await page.getByRole('button', { name: 'Sahkan bajet' }).click();
}

test('Dompet week 0: three sliders, donut and Kancil 50/30/20; confirming sets Simpanan', async ({ page }) => {
  await seedGame(page);
  await page.getByRole('navigation', { name: 'Aplikasi' }).getByRole('button', { name: 'Dompet', exact: true }).click();
  await expect(page).toHaveURL(/#\/dompet$/);

  await expect(page.getByRole('slider')).toHaveCount(3);
  await expect(page.getByRole('img', { name: /^Carta bajet/ })).toBeVisible();
  await expect(page.getByText('Cadangan Sang Kancil')).toBeVisible();

  // Kancil's suggestion applies 50 / 30 / 20 with RM values for RM2,000.
  await page.getByRole('button', { name: 'Guna 50 / 30 / 20' }).click();
  expect(await sliderValues(page)).toEqual([50, 30, 20]);
  const rows = page.getByRole('group', { name: 'Pecahan bajet' });
  await expect(rows.getByText('RM1,000')).toBeVisible();
  await expect(rows.getByText('RM600')).toBeVisible();
  await expect(rows.getByText('RM400')).toBeVisible();

  // Moving one slider rebalances the other two; the sum stays 100.
  const simpanan = page.getByRole('slider', { name: 'Simpanan' });
  await simpanan.focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  const v = await sliderValues(page);
  expect(v[2]).toBe(10);
  expect(v[0] + v[1] + v[2]).toBe(100);
  expect(v.every((x) => x % 5 === 0)).toBe(true);

  await page.getByRole('button', { name: 'Sahkan bajet' }).click();

  // Weekly view.
  await expect(page.getByRole('slider')).toHaveCount(0);
  await expect(page.getByText('Dana kecemasan: RM200 / RM300')).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Dana kecemasan' })).toHaveAttribute('aria-valuenow', '200');
  await expect(page.getByText('Nilai bersih RM2,000 (Duit RM2,000 + Labur RM0)')).toBeVisible();

  const labur = page.getByRole('region', { name: 'Labur' });
  await expect(labur.getByRole('heading', { name: 'Amanah Cempaka' })).toBeVisible();
  await expect(labur.getByRole('heading', { name: 'Dana Ekuiti Cempaka' })).toBeVisible();
  await expect(labur.getByRole('img', { name: /^Graf harga Dana Ekuiti Cempaka/ })).toBeVisible();
  await expect(labur.getByText('Contoh sahaja, bukan nasihat pelaburan')).toBeVisible();
  await expect(labur.getByText(/contoh 4% setahun/)).toBeVisible();

  // Pindah (Masuk / Keluar) only at a week intro.
  await expect(labur.getByText('Boleh pindah pada awal minggu')).toBeVisible();
  for (const b of await labur.getByRole('button', { name: /^(Masuk|Keluar)$/ }).all()) await expect(b).toBeDisabled();
  await expect(labur.getByRole('button', { name: /^(Masuk|Keluar)$/ })).toHaveCount(4);

  // Lihat 10 tahun lagi opens /kalkulator/masa; until Task 18 registers it, the "Akan datang" toast shows.
  await page.getByRole('button', { name: 'Lihat 10 tahun lagi' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Akan datang' })).toBeVisible();
  await expect(page).toHaveURL(/#\/dompet$/);

  // Saved: still the weekly view after a reload.
  await page.reload();
  await expect(page.getByText('Dana kecemasan: RM200 / RM300')).toBeVisible();
});

test('Semester Pertama before a budget opens Dompet for the split', async ({ page }) => {
  await seedGame(page);
  await page.getByRole('region', { name: 'Mod permainan' }).getByRole('button', { name: /^Semester Pertama/ }).click();
  await expect(page).toHaveURL(/#\/dompet$/);
  await expect(page.getByRole('slider')).toHaveCount(3);
});

test('week intro: card, Labur moves with the emergency-fund check, Teruskan', async ({ page }) => {
  await seedGame(page);
  await confirmBudget(page);
  await page.goto('/#/home');
  const semester = page.getByRole('region', { name: 'Mod permainan' }).getByRole('button', { name: /^Semester Pertama/ });
  await semester.click();
  await expect(page).toHaveURL(/#\/semester\/minggu$/);

  // Week 2 (onboarding starts the game in week 1): context, costs, Tekanan.
  const card = page.locator('[data-screen="minggu"]');
  await expect(card.getByRole('heading', { name: 'Minggu 2' })).toBeVisible();
  await expect(card.getByText('Kelas mula padat. Kamu cuba atur duit supaya cukup sampai hujung bulan.')).toBeVisible();
  const costs = card.getByRole('list', { name: 'Kos minggu ini' });
  await expect(costs.getByRole('listitem')).toHaveCount(2);
  await expect(costs.getByRole('listitem').filter({ hasText: 'Makan' })).toContainText('-RM80');
  await expect(costs.getByRole('listitem').filter({ hasText: 'Pengangkutan' })).toContainText('-RM20');
  await expect(card.getByText(/^Gaji sambilan/)).toHaveCount(0);
  await expect(card.getByRole('progressbar', { name: 'Tekanan' })).toBeVisible();
  await expect(card.getByText('Baki Duit RM1,900')).toBeVisible();

  // Reloading the open intro does not start another week.
  await page.reload();
  await expect(card.getByRole('heading', { name: 'Minggu 2' })).toBeVisible();

  // Buka Dompet: Labur moves are allowed during the intro.
  await page.getByRole('button', { name: 'Buka Dompet' }).click();
  await expect(page).toHaveURL(/#\/dompet$/);
  await expect(page.getByText('Nilai bersih RM1,900 (Duit RM1,900 + Labur RM0)')).toBeVisible();
  const labur = page.getByRole('region', { name: 'Labur' });
  await expect(labur.getByText('Boleh pindah pada awal minggu')).toHaveCount(0);
  await expect(labur.getByText('RM100', { exact: true })).toBeVisible();
  const amanah = labur.getByRole('article', { name: 'Amanah Cempaka' });
  await expect(amanah.getByRole('button', { name: 'Masuk' })).toBeEnabled();

  // Emergency fund below RM300: Kancil asks first. Batal changes nothing.
  await amanah.getByRole('button', { name: 'Masuk' }).click();
  const sheet = page.getByRole('dialog', { name: 'Dana kecemasan dulu' });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole('button', { name: 'Tetap labur' })).toBeVisible();
  await sheet.getByRole('button', { name: 'Batal' }).click();
  await expect(sheet).toHaveCount(0);
  await expect(page.getByText('Nilai bersih RM1,900 (Duit RM1,900 + Labur RM0)')).toBeVisible();

  // Tetap labur moves RM100; net worth is unchanged.
  await amanah.getByRole('button', { name: 'Masuk' }).click();
  await sheet.getByRole('button', { name: 'Tetap labur' }).click();
  await expect(page.getByText('Nilai bersih RM1,900 (Duit RM1,800 + Labur RM100)')).toBeVisible();
  await expect(amanah.getByText('RM100', { exact: true })).toBeVisible();

  // Taking out more than the pot holds: toast, nothing moves.
  await labur.getByRole('button', { name: 'Tambah RM10' }).click();
  await expect(labur.getByText('RM110', { exact: true })).toBeVisible();
  await amanah.getByRole('button', { name: 'Keluar' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Baki Amanah Cempaka tak cukup' })).toBeVisible();
  await expect(page.getByText('Nilai bersih RM1,900 (Duit RM1,800 + Labur RM100)')).toBeVisible();

  // Back to the intro, Teruskan closes it and goes home.
  await page.getByRole('button', { name: 'Kembali' }).click();
  await expect(page).toHaveURL(/#\/semester\/minggu$/);
  await expect(card.getByRole('heading', { name: 'Minggu 2' })).toBeVisible();
  await page.getByRole('button', { name: 'Teruskan' }).click();
  await expect(page).toHaveURL(/#\/home$/);
  await expect(page.getByText('Minggu 2 daripada 12')).toBeVisible();

  // Outside the intro the Labur buttons lock again.
  await page.goto('/#/dompet');
  await expect(page.getByRole('region', { name: 'Labur' }).getByText('Boleh pindah pada awal minggu')).toBeVisible();

  // Week 3: Labur growth on Amanah (RM100 x contoh 4% / 52 weeks).
  await page.goto('/#/home');
  await semester.click();
  await expect(card.getByRole('heading', { name: 'Minggu 3' })).toBeVisible();
  await expect(card.getByText('Labur +RM0.08')).toBeVisible();
  await expect(costs.getByRole('listitem').filter({ hasText: 'Yuran asrama' })).toContainText('-RM600');
  await page.getByRole('button', { name: 'Teruskan' }).click();

  // Week 4: part-time pay arrives.
  await semester.click();
  await expect(card.getByRole('heading', { name: 'Minggu 4' })).toBeVisible();
  await expect(card.getByText('Gaji sambilan +RM400')).toBeVisible();
});
