import { test, expect, type Page } from '@playwright/test';
import { playScenario1ToEnd, seedGame } from './helpers';

test.use({ viewport: { width: 412, height: 915 } });
test.setTimeout(90_000);

const DANGER = 'rgb(229, 72, 77)';

async function toConsequence(page: Page, shot?: string): Promise<void> {
  await seedGame(page);
  await playScenario1ToEnd(page, shot);
  await expect(page).toHaveURL(/#\/semester\/akibat\/kerja_sambilan$/);
}

test('scenario 1 end to end: top-up path -> consequence -> flag hunt -> debrief -> home', async ({ page }) => {
  await toConsequence(page);

  const screen = page.locator('[data-screen="akibat"]');
  const title = screen.getByRole('heading', { level: 1 });
  await expect(title).toBeVisible();
  await expect(title).toHaveCSS('color', DANGER);
  await expect(page.getByLabel('Baki RM1,600')).toBeVisible();
  await expect(screen.getByText('5 minit kemudian')).toBeVisible({ timeout: 10_000 });
  await expect(screen.getByRole('button', { name: 'Cuba lagi' })).toBeVisible();
  await screen.getByRole('button', { name: 'Kumpul bendera merah' }).click();

  await expect(page).toHaveURL(/#\/semester\/bendera\/kerja_sambilan$/);
  const hunt = page.locator('[data-screen="bendera"]');
  await expect(hunt.getByText('Tekan 3 bendera merah dalam perbualan ini.')).toBeVisible();
  const kad = page.getByTestId('kad-count');
  await expect(kad).toHaveText('0');

  // A wrong tap shakes gently and awards nothing.
  await hunt.getByRole('button', { name: 'Salam', exact: true }).click();
  await expect(kad).toHaveText('0');

  await hunt.getByRole('button', { name: /RM300 sehari/ }).click();
  await expect(kad).toHaveText('1');
  await hunt.getByRole('button', { name: /slot tinggal 3/i }).click();
  await expect(kad).toHaveText('2');
  await hunt.getByRole('button', { name: /top-up RM100/ }).click();
  await expect(kad).toHaveText('3');
  await expect(hunt.getByText('Kamu jumpa 3 daripada 3 bendera merah.')).toBeVisible();
  await page.waitForTimeout(900); // let the last card land
  await page.screenshot({ path: 'e2e/screens/412x915/bendera-found.png' });
  await hunt.getByRole('button', { name: 'Selesai' }).click();

  await expect(page).toHaveURL(/#\/semester\/debrief\/kerja_sambilan$/);
  const debrief = page.locator('[data-screen="debrief"]');
  await expect(debrief.getByText(/Taktik yang digunakan/)).toBeVisible();
  for (const name of ['Terlalu Lumayan', 'Desakan Masa', 'Bayar Dulu']) {
    await expect(debrief.getByText(name).first()).toBeVisible();
  }
  await expect(debrief.getByText(/Jangan bayar yuran, top-up atau deposit untuk dapat kerja/)).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/412x915/debrief-cards.png' });
  await debrief.getByRole('button', { name: 'Faham, teruskan' }).click();

  await expect(page).toHaveURL(/#\/home$/);
  await expect(page.getByText(/\+\d+ XP/)).toBeVisible();
  const xp = page.getByRole('progressbar', { name: 'XP' });
  expect(Number(await xp.getAttribute('aria-valuenow'))).toBeGreaterThan(0);

  // R8: the finished chat shows Selesai and opens read-only (no reply chips).
  await page.getByRole('button', { name: 'Sembang', exact: true }).click();
  const row = page.getByRole('button', { name: /Kak Mira \(HR\)/ });
  await expect(row).toContainText('Selesai');
  await page.screenshot({ path: 'e2e/screens/412x915/sembang-done.png' });
  await row.click();
  await expect(page.getByText('Perbualan ini sudah selesai.')).toBeVisible();
  await page.screenshot({ path: 'e2e/screens/412x915/chat-readonly.png' });
  await expect(page.getByRole('group', { name: 'Pilih balasan' })).toHaveCount(0);
});

test('Cuba lagi restores the RM balance and restarts the chat', async ({ page }) => {
  await toConsequence(page, 'e2e/screens/412x915/chat-ended.png');
  await expect(page.getByLabel('Baki RM1,600')).toBeVisible();
  await page.getByRole('button', { name: 'Cuba lagi' }).click();
  await expect(page).toHaveURL(/#\/sembang\/kerja_sambilan$/);
  await expect(page.getByLabel('Baki RM2,000')).toBeVisible();
  await expect(page.getByText('Salam dik 😊 Akak Mira, HR dari Bintang Digital Sdn Bhd.')).toBeVisible({ timeout: 5_000 });
});
