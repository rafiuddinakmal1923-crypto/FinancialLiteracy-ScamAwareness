// Scenario 2 (the video's hero): the sewa_akaun mule path from the demo preset to the debrief, then the same
// path captured at the three target viewports for review.
import { test, expect, type Page } from '@playwright/test';
import { acceptMuleOffer } from './helpers';

test.setTimeout(120_000);

const NODES = ['Mangsa', 'Akaun anda', 'Akaun lapis', 'Sindiket'];
const PENAL = /Seksyen 424A-424D Kanun Keseksaan/;

/** The four node labels, left to right on screen. */
async function nodeOrder(page: Page): Promise<string[]> {
  const items = page.getByRole('list', { name: /Rantaian duit/ }).getByRole('listitem');
  const boxes = await items.evaluateAll((els) => els.map((el) => ({ text: el.textContent!.trim(), x: el.getBoundingClientRect().x })));
  return boxes.sort((a, b) => a.x - b.x).map((b) => b.text);
}

test.describe('scenario 2 (sewa_akaun)', () => {
  test.use({ viewport: { width: 412, height: 915 } });

  test('demo preset -> urgency cue -> lend the account -> transfer + TAC -> money chain -> frozen -> flag hunt -> debrief', async ({ page }) => {
    await page.goto('/#/demo/mule');
    await expect(page).toHaveURL(/#\/sembang\/sewa_akaun$/);
    await expect(page.getByText('Terdesak?')).toBeVisible();
    await expect(page.getByLabel('Baki RM1,070')).toBeVisible();

    await acceptMuleOffer(page);
    // BankKu overlay: the transfer is pre-filled with the "akaun lapis" and RM1,400; then the TAC prompt.
    const transfer = page.locator('[data-screen="bankku-transfer"]');
    await expect(transfer).toBeVisible();
    await expect(transfer.getByText('RM1,400.00')).toBeVisible();
    await expect(transfer.getByText('Teratai Emas Enterprise')).toBeVisible();
    await expect(transfer.getByText('SIMULASI - bukan laman/aplikasi sebenar')).toBeVisible();
    await transfer.getByRole('button', { name: 'Sahkan' }).click();
    const tac = page.locator('[data-screen="bankku-tac"]');
    await expect(tac.getByText(/Jangan kongsi TAC dengan sesiapa/)).toBeVisible();
    await tac.getByRole('button', { name: 'Hantar TAC' }).click();

    const next = page.getByRole('button', { name: 'Lihat apa jadi seterusnya' });
    await expect(next).toBeVisible({ timeout: 20_000 });
    await next.click();
    await expect(page).toHaveURL(/#\/semester\/akibat\/sewa_akaun$/);

    // MoneyChain: the four nodes in order, then (only after the last hop) the police trace back to "Akaun anda".
    const chain = page.getByTestId('money-chain');
    await expect(chain).toBeVisible();
    expect(await nodeOrder(page)).toEqual(NODES);
    await expect(page.getByTestId('police-trace')).toHaveCount(0);
    await expect(chain).toHaveAttribute('data-phase', '3', { timeout: 6_000 });
    await expect(page.getByTestId('police-trace')).toBeVisible({ timeout: 4_000 });
    await expect(chain).toHaveAttribute('data-phase', 'done', { timeout: 5_000 });
    await expect(chain.locator('[data-traced]')).toContainText('Akaun anda');

    // Then the timeline: frozen account, Rekod Disiasat, and the Penal Code note last.
    const screen = page.locator('[data-screen="akibat"]');
    await expect(screen.getByText(/Akaun anda telah dibekukan/)).toBeVisible({ timeout: 10_000 });
    await expect(screen.getByText(/Disiasat/).first()).toBeVisible({ timeout: 10_000 });
    await expect(screen.getByText(PENAL)).toBeVisible({ timeout: 10_000 });
    await expect(screen.getByText(/997/).first()).toBeVisible();
    await expect(screen.getByRole('button', { name: 'Cuba lagi' })).toBeVisible();

    await screen.getByRole('button', { name: 'Kumpul bendera merah' }).click();
    await expect(page).toHaveURL(/#\/semester\/bendera\/sewa_akaun$/);
    const hunt = page.locator('[data-screen="bendera"]');
    const kad = page.getByTestId('kad-count');
    await hunt.getByRole('button', { name: /RM1,500/ }).first().click();
    await expect(kad).toHaveText('1');
    await hunt.getByRole('button', { name: /semua orang buat/ }).first().click();
    await expect(kad).toHaveText('2');
    await hunt.getByRole('button', { name: /jangan cerita kat orang/ }).first().click();
    await expect(kad).toHaveText('3');
    await hunt.getByRole('button', { name: 'Selesai' }).click();

    await expect(page).toHaveURL(/#\/semester\/debrief\/sewa_akaun$/);
    const debrief = page.locator('[data-screen="debrief"]');
    for (const name of ['Terlalu Lumayan', 'Rahsiakan']) await expect(debrief.getByText(name).first()).toBeVisible();
    await expect(debrief.getByText(/Jangan pinjam, sewa atau jual akaun bank/)).toBeVisible();
    await debrief.getByRole('button', { name: 'Faham, teruskan' }).click();
    await expect(page).toHaveURL(/#\/home$/);

    // BankKu stays frozen afterwards.
    await page.goto('/#/bankku');
    await expect(page.getByText('Akaun anda telah dibekukan')).toBeVisible();
  });

  test('Batal at the TAC still leaves a frozen account (the victim money already landed)', async ({ page }) => {
    await page.goto('/#/demo/mule');
    await acceptMuleOffer(page);
    await page.locator('[data-screen="bankku-transfer"]').getByRole('button', { name: 'Batal' }).click();
    const replies = page.getByRole('group', { name: 'Pilih balasan' });
    await expect(replies).toBeVisible({ timeout: 20_000 });
    await replies.getByRole('button').last().click();
    const next = page.getByRole('button', { name: 'Lihat apa jadi seterusnya' });
    await expect(next).toBeVisible({ timeout: 20_000 });
    await next.click();
    await expect(page.locator('[data-screen="akibat"]').getByRole('heading', { level: 1 })).toHaveText('Akaun bank kamu dibekukan');
  });

  test('an unknown demo scene goes home', async ({ page }) => {
    await page.goto('/#/demo/mule');
    await expect(page).toHaveURL(/#\/sembang\/sewa_akaun$/);
    await page.goto('/#/demo/tiada');
    await expect(page).toHaveURL(/#\/home$/);
  });
});

// Review screenshots of the mule path (chat, transfer, TAC, consequence, frozen BankKu, debrief) per viewport.
for (const vp of [{ width: 360, height: 800 }, { width: 412, height: 915 }, { width: 1920, height: 1080 }]) {
  test(`mule path screenshots at ${vp.width}x${vp.height}`, async ({ page }) => {
    await page.setViewportSize(vp);
    const dir = `e2e/screens/${vp.width}x${vp.height}`;
    await page.goto('/#/demo/mule');
    await acceptMuleOffer(page, `${dir}/mule-chat.png`);
    await page.screenshot({ path: `${dir}/mule-transfer.png` });
    await page.getByRole('button', { name: 'Sahkan' }).click();
    await page.screenshot({ path: `${dir}/mule-tac.png` });
    await page.getByRole('button', { name: 'Hantar TAC' }).click();
    const next = page.getByRole('button', { name: 'Lihat apa jadi seterusnya' });
    await expect(next).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${dir}/mule-chat-end.png` });
    await next.click();
    const chain = page.getByTestId('money-chain');
    await expect(chain).toHaveAttribute('data-phase', '2', { timeout: 6_000 });
    await page.waitForTimeout(450); // mid-hop: a coin on its way
    await page.screenshot({ path: `${dir}/mule-chain-moving.png` });
    await expect(chain).toHaveAttribute('data-phase', 'done', { timeout: 8_000 });
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${dir}/mule-chain.png` });
    await expect(page.getByText(PENAL)).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${dir}/mule-akibat.png`, fullPage: true });
    await page.getByText(PENAL).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${dir}/mule-akibat-end.png` });
    await page.goto('/#/bankku');
    await expect(page.getByText('Akaun anda telah dibekukan')).toBeVisible();
    await page.screenshot({ path: `${dir}/mule-bankku-beku.png` });
    await page.goto('/#/semester/bendera/sewa_akaun');
    await page.getByRole('button', { name: 'Selesai' }).or(page.getByText(/Tekan \d bendera merah/)).first().waitFor();
    await page.screenshot({ path: `${dir}/mule-bendera.png` });
    await page.goto('/#/semester/debrief/sewa_akaun');
    await expect(page.locator('[data-screen="debrief"]')).toBeVisible();
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${dir}/mule-debrief.png` });
  });
}
