import { test, expect, type Page } from '@playwright/test';

test.use({ viewport: { width: 412, height: 915 } });

/** Counts AudioContexts made and oscillators started, before the app loads. */
async function watchAudio(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __audio: { ctx: number; osc: number } };
    w.__audio = { ctx: 0, osc: 0 };
    const AC = window.AudioContext;
    window.AudioContext = class extends AC {
      constructor(o?: AudioContextOptions) { super(o); w.__audio.ctx++; }
      createOscillator() { w.__audio.osc++; return super.createOscillator(); }
    } as typeof AudioContext;
  });
}
const audio = (page: Page) => page.evaluate(() => (window as unknown as { __audio: { ctx: number; osc: number } }).__audio);

test('sound: nothing before the first tap, then taps and music play', async ({ page }) => {
  await watchAudio(page);
  await page.goto('/#/demo/report');
  await page.getByRole('heading', { name: 'Laporan semester' }).waitFor();
  expect(await audio(page)).toEqual({ ctx: 0, osc: 0 });
  await page.getByRole('button', { name: 'Kembali' }).click();
  await page.getByRole('navigation', { name: 'Aplikasi' }).waitFor();
  await expect.poll(async () => (await audio(page)).ctx).toBe(1);
  const before = (await audio(page)).osc;
  await expect.poll(async () => (await audio(page)).osc).toBeGreaterThan(before + 2);
});

test('sound: the Sound switch off keeps it silent', async ({ page }) => {
  await watchAudio(page);
  await page.goto('/#/demo/report');
  await page.getByRole('heading', { name: 'Laporan semester' }).waitFor();
  await page.goto('/#/settings');
  await page.getByRole('switch', { name: 'Bunyi' }).click();
  await expect(page.getByRole('switch', { name: 'Bunyi' })).toHaveAttribute('aria-checked', 'false');
  const n = (await audio(page)).osc;
  await page.waitForTimeout(800);
  await page.getByRole('switch', { name: 'Bunyi' }).focus();
  expect((await audio(page)).osc).toBe(n);
});
