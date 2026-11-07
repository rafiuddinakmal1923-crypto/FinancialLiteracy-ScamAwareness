// W8: screenshots of every finalist screen at the three target viewports, with the same layout checks as
// screens.spec.ts (no sideways scroll, text 16 px or more, tap targets 48 px or more).
import { test, expect, type Page } from '@playwright/test';
import { seedGame } from './helpers';

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 412, height: 915 },
  { width: 1920, height: 1080 },
];

async function smallText(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
      const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent!.trim() !== '');
      if (!own || el.closest('[aria-hidden="true"]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      if (size < 16) out.push(`${el.tagName} "${el.textContent!.trim().slice(0, 30)}" ${size}px`);
    }
    return out;
  });
}

async function smallTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('button, a[href], [role="switch"]'))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.width < 47.5 || r.height < 47.5) out.push(`${el.tagName} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
    }
    return out;
  });
}

const tile = (page: Page, name: string) => page.getByRole('navigation', { name: 'Aplikasi' }).getByRole('button', { name, exact: true }).click();
const pitch = async (page: Page) => { await page.goto('/#/demo/pitch'); await page.locator('[data-screen="home"]').waitFor(); };
const report = async (page: Page) => { await page.goto('/#/demo/report'); await page.getByRole('heading', { name: 'Laporan semester' }).waitFor(); };

const SHOTS: { name: string; screen: string; setup: (page: Page) => Promise<void> }[] = [
  // First, on the fresh game from seedGame: the week-0 split, then the goal picker.
  {
    name: 'matlamat-picker', screen: 'dompet', setup: async (p) => {
      await p.goto('/#/dompet');
      await p.getByRole('button', { name: 'Sahkan bajet' }).click();
      await p.locator('[data-slot="GoalPicker"]').waitFor();
    },
  },
  { name: 'suapan', screen: 'suapan', setup: async (p) => { await pitch(p); await tile(p, 'Suapan'); } },
  {
    name: 'suapan-debrief', screen: 'suapan', setup: async (p) => {
      await pitch(p); await tile(p, 'Suapan');
      await p.locator('[data-post]').first().getByRole('button', { name: 'Semak' }).click();
      await p.getByRole('dialog').waitFor();
    },
  },
  { name: 'kedai', screen: 'kedai', setup: async (p) => { await pitch(p); await tile(p, 'Kedai'); } },
  {
    name: 'kedai-confirm', screen: 'kedai', setup: async (p) => {
      await pitch(p); await tile(p, 'Kedai');
      await p.locator('[data-item]').getByRole('button', { name: 'Beli', exact: true }).first().click();
      await p.getByRole('dialog').waitFor();
    },
  },
  { name: 'matlamat-bar', screen: 'dompet', setup: async (p) => { await pitch(p); await p.goto('/#/dompet'); await p.locator('[data-slot="GoalBar"]').waitFor(); } },
  { name: 'rapor-goal-share', screen: 'rapor', setup: async (p) => { await report(p); await p.locator('[data-slot="ShareButton"]').scrollIntoViewIfNeeded(); } },
  { name: 'papan', screen: 'papan', setup: async (p) => { await report(p); await p.goto('/#/papan'); } },
  { name: 'tonton', screen: 'kad-ilmu', setup: async (p) => { await report(p); await p.goto('/#/kad/ilmu/kompaun'); await p.locator('[data-slot="ExplainerSlot"]').scrollIntoViewIfNeeded(); } },
];

for (const vp of VIEWPORTS) {
  test(`finalist screens at ${vp.width}x${vp.height}`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize(vp);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seedGame(page);
    for (const shot of SHOTS) {
      await test.step(shot.name, async () => {
        await shot.setup(page);
        await expect(page.locator(`[data-screen="${shot.screen}"]`)).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(300);
        await page.screenshot({ path: `e2e/screens/finalist/${vp.width}x${vp.height}/${shot.name}.png` });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${shot.name} overflows horizontally`).toBeLessThanOrEqual(0);
        expect(await smallText(page), `${shot.name} text under 16 px`).toEqual([]);
        expect(await smallTargets(page), `${shot.name} targets under 48 px`).toEqual([]);
      });
    }
  });
}
