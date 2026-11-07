import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { seedGame } from './helpers';

const FEED = JSON.parse(readFileSync(new URL('../../content/feed.json', import.meta.url), 'utf8')) as { id: string; author: { name: string; handle: string } }[];

// W1: the feed renders content/feed.json and scrolls without layout overflow at the three target viewports.
for (const vp of [{ width: 360, height: 800 }, { width: 412, height: 915 }, { width: 1920, height: 1080 }]) {
  test(`Suapan feed renders every post at ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp);
    await seedGame(page);
    await page.goto('/#/home');
    await page.getByRole('navigation', { name: 'Aplikasi' }).getByRole('button', { name: 'Suapan', exact: true }).click();
    const screen = page.locator('[data-screen="suapan"]');
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
