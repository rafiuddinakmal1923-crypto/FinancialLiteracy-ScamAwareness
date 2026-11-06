import { expect, test, type Page } from '@playwright/test';
import { playKelasRounds, seedGame } from './helpers';

test.use({ viewport: { width: 1920, height: 1080 } });

/** Elements (outside aria-hidden decoration) that stick out past the right edge of the viewport. */
async function overflowing(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('main *'))) {
      if (el.closest('[aria-hidden="true"], [data-testid="confetti"]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > window.innerWidth + 1) out.push(`${el.tagName} ${el.textContent?.trim().slice(0, 20)} ${Math.round(r.right)}`);
    }
    return out;
  });
}

test('Mod Kelas: no phone frame, 2 teams play 10 mixed rounds to a winner screen', async ({ page }) => {
  test.setTimeout(90_000);
  await seedGame(page);
  await page.goto('/#/kelas');
  const lobby = page.locator('[data-screen="kelas"]');
  await expect(lobby).toBeVisible();

  // Full-width class layout: no phone frame or desk, the screen spans the viewport.
  await expect(page.locator('.desk')).toHaveCount(0);
  const box = (await lobby.boundingBox())!;
  expect(box.width).toBe(1920);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1920);

  await expect(page.getByRole('textbox')).toHaveCount(2);
  await expect(page.getByRole('button', { name: /^Campur/ })).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Mula', exact: true }).click();
  await expect(page.getByText('Pusingan 1 / 10')).toBeVisible();

  // Card text and team toggles are at least 32 px, toggles at least 72 px tall.
  const sizes = await page.evaluate(() => {
    const own = (el: Element) => Array.from(el.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent!.trim()).join('');
    const inCard = Array.from(document.querySelectorAll('[data-card] *')).filter((e) => own(e).length > 20)
      .sort((a, b) => own(b).length - own(a).length)[0];
    const toggle = document.querySelector('[role="group"] button')!;
    return {
      card: parseFloat(getComputedStyle(inCard).fontSize),
      toggle: parseFloat(getComputedStyle(toggle.querySelector('span') ?? toggle).fontSize),
      toggleH: toggle.getBoundingClientRect().height,
    };
  });
  expect(sizes.card).toBeGreaterThanOrEqual(32);
  expect(sizes.toggle).toBeGreaterThanOrEqual(32);
  expect(sizes.toggleH).toBeGreaterThanOrEqual(72);
  expect(await overflowing(page)).toEqual([]);

  // Round 1 by hand: a tick shows once a team answered, and tapping again clears it.
  await page.getByRole('group', { name: 'Pasukan Merah' }).getByRole('button').first().click();
  await expect(page.getByText('1 daripada 2 pasukan sudah jawab')).toBeVisible();
  await page.getByRole('group', { name: 'Pasukan Merah' }).getByRole('button').first().click();
  await expect(page.getByText('0 daripada 2 pasukan sudah jawab')).toBeVisible();

  await page.goto('/#/home');
  await page.goto('/#/kelas');
  await playKelasRounds(page, 10);
  await expect(page.getByRole('heading', { name: /^(Seri! Pemenang|Pemenang): / })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Main lagi' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Selesai' })).toBeVisible();
  const scores = await page.getByTestId('score-row').locator('span[aria-label$="mata"]').allTextContents();
  expect(scores).toHaveLength(2);
  for (const s of scores) expect(Number(s) % 100).toBe(0);
  expect(await overflowing(page)).toEqual([]);

  await page.getByRole('button', { name: 'Main lagi' }).click();
  await expect(page.getByRole('button', { name: 'Mula', exact: true })).toBeVisible();
});

test('Mod Kelas: Keluar asks first, then returns home', async ({ page }) => {
  await seedGame(page);
  await page.goto('/#/kelas');
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await page.getByRole('button', { name: 'Teruskan main' }).click();
  await expect(page).toHaveURL(/#\/kelas$/);
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await page.getByRole('button', { name: 'Ya, tinggalkan' }).click();
  await expect(page).toHaveURL(/#\/home$/);
});

for (const vp of [{ width: 1920, height: 1080 }, { width: 1280, height: 720 }, { width: 360, height: 800 }]) {
  test(`Mod Kelas stays usable at ${vp.width}x${vp.height} with 6 teams`, async ({ page }) => {
    await page.setViewportSize(vp);
    await seedGame(page);
    await page.goto('/#/kelas');
    await expect(page.getByRole('button', { name: 'Mula', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Tambah pasukan' }).click();
    await page.getByRole('button', { name: 'Mula', exact: true }).click();
    await expect(page.getByRole('group')).toHaveCount(6);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    expect(await overflowing(page)).toEqual([]);
    await page.getByRole('button', { name: 'Dedahkan', exact: true }).scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Dedahkan', exact: true }).click();
    await expect(page.getByTestId('verdict')).toBeVisible();
    await page.screenshot({ path: `e2e/screens/kelas-6teams-${vp.width}.png`, fullPage: true });
    expect(await overflowing(page)).toEqual([]);
  });
}
