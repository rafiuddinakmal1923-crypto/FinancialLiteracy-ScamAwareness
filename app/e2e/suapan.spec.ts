import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { seedGame } from './helpers';

const FEED = JSON.parse(readFileSync(new URL('../../content/feed.json', import.meta.url), 'utf8')) as {
  id: string; text: { ms: string }; author: { name: string; handle: string }; semak: { calc: string } | { kad: string };
}[];
const TWO_PERCENT = FEED.find((p) => /2% sehari/.test(p.text.ms));
const TWO_PERCENT_CALC = TWO_PERCENT && 'calc' in TWO_PERCENT.semak ? TWO_PERCENT : undefined;

async function openSuapan(page: import('@playwright/test').Page) {
  await seedGame(page);
  await page.goto('/#/home');
  await page.getByRole('navigation', { name: 'Aplikasi' }).getByRole('button', { name: 'Suapan', exact: true }).click();
  return page.locator('[data-screen="suapan"]');
}

// W1: the feed renders content/feed.json and scrolls without layout overflow at the three target viewports.
for (const vp of [{ width: 360, height: 800 }, { width: 412, height: 915 }, { width: 1920, height: 1080 }]) {
  test(`Suapan feed renders every post at ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp);
    const screen = await openSuapan(page);
    await expect(screen).toBeVisible();
    await expect(screen.getByRole('heading', { name: 'Suapan' })).toBeVisible();

    const posts = screen.locator('[data-post]');
    await expect(posts.first()).toBeVisible();
    await expect(posts).toHaveCount(FEED.length);
    await expect(posts.first()).toHaveAttribute('data-post', FEED[0].id);
    await expect(posts.first()).toContainText(FEED[0].author.name);
    await expect(posts.first()).toContainText(FEED[0].author.handle);

    // No card is wider than the screen, and the last post can be scrolled into view.
    const box = (await screen.boundingBox())!;
    for (const card of await posts.all()) {
      const b = (await card.boundingBox())!;
      expect(b.x).toBeGreaterThanOrEqual(box.x);
      expect(b.x + b.width).toBeLessThanOrEqual(box.x + box.width + 0.5);
    }
    await posts.last().scrollIntoViewIfNeeded();
    await expect(posts.last()).toBeInViewport();
    await page.screenshot({ path: `e2e/screens/suapan-feed-${vp.width}x${vp.height}.png` });
  });
}

test.describe('W2 calls', () => {
  test.use({ viewport: { width: 412, height: 915 } });

  test('a call is made once: Semak opens the debrief, then the Kad Ilmu or Kalkulator, and the post stays judged', async ({ page }) => {
    const screen = await openSuapan(page);
    const post = screen.locator(`[data-post="${FEED[0].id}"]`);
    await post.getByRole('button', { name: 'Semak' }).click();
    const sheet = page.getByRole('dialog', { name: 'Ulasan hantaran' });
    await expect(sheet).toContainText('Pilihan kamu: Semak');
    await page.screenshot({ path: 'e2e/screens/suapan-debrief-412x915.png' });
    const kad = 'kad' in FEED[0].semak;
    await sheet.getByRole('button', { name: kad ? 'Baca Kad Ilmu' : 'Buka Kalkulator' }).click();
    await expect(page.locator(`[data-screen="${kad ? 'kad-ilmu' : 'kalkulator'}"]`)).toBeVisible();
    await page.goto('/#/suapan');
    await expect(post.getByRole('button', { name: /Lihat semula/ })).toBeVisible();
    await expect(post.getByRole('button', { name: 'Percaya' })).toHaveCount(0);
  });

  // Done-when for W2 (plan): needs C1/C3 to point the "2% a day" post at a Semak Pulangan preset in content/feed.json.
  test('"2% a day" post: Semak opens Semak Pulangan with the Terlalu Lumayan flag, and back returns to the feed', async ({ page }) => {
    test.fixme(!TWO_PERCENT_CALC, 'waits for Danish: the "2% sehari" post in content/feed.json needs semak.calc and its preset');
    const screen = await openSuapan(page);
    await screen.locator(`[data-post="${TWO_PERCENT_CALC!.id}"]`).getByRole('button', { name: 'Semak' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Buka Kalkulator' }).click();
    await expect(page.getByText('Terlalu Lumayan', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Kembali' }).first().click();
    await expect(page.locator('[data-screen="suapan"]')).toBeVisible();
  });
});
