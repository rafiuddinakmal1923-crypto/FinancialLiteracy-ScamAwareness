import { test, expect } from '@playwright/test';
import { seedGame } from './helpers';

test.use({ viewport: { width: 412, height: 915 } });

test('home -> Sembang -> Kak Mira thread shows the first message and reply chips', async ({ page }) => {
  await seedGame(page);
  await page.getByRole('button', { name: 'Sembang', exact: true }).click();
  await expect(page).toHaveURL(/#\/sembang$/);
  await expect(page.locator('[data-screen="sembang"]')).toBeVisible();

  const row = page.getByRole('button', { name: /Kak Mira \(HR\)/ });
  await expect(row).toContainText('011-0000 0123');
  await expect(row).toContainText('Belum dibaca');
  await row.click();

  await expect(page).toHaveURL(/#\/sembang\/kerja_sambilan$/);
  const thread = page.locator('[data-screen="chat"]');
  await expect(thread.getByRole('heading', { name: 'Kak Mira (HR)' })).toBeVisible();
  await expect(thread.getByText('dalam talian')).toBeVisible();
  await expect(thread.getByText('Salam dik 😊 Akak Mira, HR dari Bintang Digital Sdn Bhd.')).toBeVisible({ timeout: 5_000 });

  const replies = page.getByRole('group', { name: 'Pilih balasan' });
  await expect(replies.getByRole('button', { name: 'Minat! Macam mana nak mula?' })).toBeVisible({ timeout: 15_000 });
  await expect(replies.getByRole('button')).toHaveCount(4); // Tanya Kancil + 3 replies
  await expect(page.getByRole('button', { name: /Tanya Kancil/ })).toBeVisible();

  // Reply chips sit in the bottom 40% of the screen.
  const vh = page.viewportSize()!.height;
  const box = (await replies.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(vh * 0.6 - 1);

  // Never a verified tick in the header.
  await expect(thread.locator('[aria-label*="verified" i], [aria-label*="disahkan" i]')).toHaveCount(0);

  // Ask Kancil once: the hint shows and the chip goes away.
  await page.getByRole('button', { name: /Tanya Kancil/ }).click();
  await expect(page.getByText('Syarikat sebenar tak minta bayaran untuk mula kerja.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Tanya Kancil/ })).toHaveCount(0);

  // Choosing adds the player's bubble and the story continues.
  await replies.getByRole('button', { name: 'Minat! Macam mana nak mula?' }).click();
  await expect(thread.getByRole('log').getByText('Minat! Macam mana nak mula?')).toBeVisible();
  await expect(page.getByRole('status', { name: 'Kak Mira (HR) sedang menaip' })).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/412x915/chat-typing.png' });
  await expect(thread.getByText('Ok bagus! Akak terangkan sistem dia ya.')).toBeVisible({ timeout: 5_000 });
  await expect(replies.getByRole('button', { name: 'Ok, saya top-up RM100.' })).toBeVisible({ timeout: 15_000 });
  await page.screenshot({ path: 'e2e/screens/412x915/chat-reply.png' });
});
