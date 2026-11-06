// Screenshot runner: every route in ROUTES x every target viewport, with layout checks.
import { test, expect, type Page } from '@playwright/test';
import { ROUTES } from './routes';
import { seedGame } from './helpers';

const VIEWPORTS = [
  { width: 360, height: 800 },
  { width: 412, height: 915 },
  { width: 1920, height: 1080 },
];

/** Visible elements with their own text smaller than 16 px (UI-SPEC section 7). */
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

/**
 * Visible buttons, links and switches smaller than 48 x 48 px. Inline targets inside a sentence (the flag hunt's
 * tappable words, marked data-inline-target) are exempt, as in WCAG 2.5.8.
 */
async function smallTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('button:not([data-inline-target]), a[href], [role="switch"]'))) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (r.width < 47.5 || r.height < 47.5) {
        out.push(`${el.tagName} "${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    return out;
  });
}

for (const vp of VIEWPORTS) {
  test(`screens at ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await seedGame(page);
    for (const route of ROUTES) {
      await test.step(route.name, async () => {
        if (route.setup) await route.setup(page);
        else await page.goto(`/#${route.path}`);
        await expect(page.locator(`[data-screen="${route.name}"]`)).toBeVisible();
        if (route.name === 'splash') await expect(page.getByRole('button', { name: 'Mula' })).toBeVisible();
        if (route.waitFor) await expect(page.getByText(route.waitFor)).toBeVisible({ timeout: 15_000 });
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(300);
        await page.screenshot({ path: `e2e/screens/${vp.width}x${vp.height}/${route.name}.png` });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${route.name} overflows horizontally`).toBeLessThanOrEqual(0);
        expect(await smallText(page), `${route.name} text under 16 px`).toEqual([]);
        expect(await smallTargets(page), `${route.name} targets under 48 px`).toEqual([]);
      });
    }
  });
}
