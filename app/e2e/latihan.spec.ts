import { expect, test, type Page } from '@playwright/test';
import { dial997, finish997 } from './routes';
import { seedGame } from './helpers';

/** XP shown on the home screen's XP bar ("130 / 200"). */
async function homeXp(page: Page): Promise<number> {
  await page.goto('/#/home');
  const bar = page.getByRole('progressbar', { name: 'XP' });
  await expect(bar).toBeVisible();
  return Number.parseInt((await bar.getAttribute('aria-valuetext')) ?? '', 10);
}

async function do997(page: Page): Promise<void> {
  await page.goto('/#/latihan');
  await page.getByRole('button', { name: /Hubungi 997/ }).click();
  await expect(page.getByRole('note')).toContainText('SIMULASI');
  await dial997(page);
  await finish997(page);
  await expect(page.getByText('Latihan selesai')).toBeVisible();
}

async function doSemak(page: Page): Promise<void> {
  await page.goto('/#/latihan');
  await page.getByRole('button', { name: /Semak akaun/ }).click();
  await page.getByRole('button', { name: /Cuba: 0000-0000-0638/ }).click();
  await page.getByRole('button', { name: 'Semak', exact: true }).click();
  await expect(page.getByText('Dilaporkan dalam 3 kes')).toBeVisible();
  const real = page.getByRole('link', { name: 'Buka Semak Mule sebenar' });
  await expect(real).toHaveAttribute('href', 'https://semakmule.rmp.gov.my');
  await expect(real).toHaveAttribute('target', '_blank');
}

test('Latihan: 997 drill, Semak sim and two checklist ticks give XP once, also after a reload', async ({ page }) => {
  await seedGame(page);
  const before = await homeXp(page);

  await do997(page);
  await doSemak(page);
  await page.goto('/#/latihan/senarai');
  await page.getByRole('checkbox').nth(0).click();
  await page.getByRole('checkbox').nth(1).click();
  await expect(page.getByText('2 / 6 tindakan')).toBeVisible();
  expect(await homeXp(page)).toBe(before + 40 + 40 + 25 * 2);

  // Reload: the progress is saved, and doing it all again (and unticking / re-ticking) pays nothing more.
  await page.reload();
  await page.goto('/#/latihan/senarai');
  await expect(page.getByRole('checkbox').nth(0)).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByText('2 / 6 tindakan')).toBeVisible();
  await page.getByRole('checkbox').nth(0).click();
  await page.getByRole('checkbox').nth(0).click();
  await do997(page);
  await doSemak(page);
  expect(await homeXp(page)).toBe(before + 130);
});

test('Latihan: the 997 drill has no tel: link and no real-number link', async ({ page }) => {
  await seedGame(page);
  await page.goto('/#/latihan/997');
  await dial997(page);
  expect(await page.locator('a[href^="tel:"]').count()).toBe(0);
  expect(await page.locator('a[href]').count()).toBe(0);
});
