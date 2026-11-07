import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 412, height: 915 } });

// W5 done-when: the player's row is highlighted among 10.
test('Papan Markah: the player is one highlighted row among 10', async ({ page }) => {
  await page.goto('/#/demo/report');
  await page.getByRole('heading', { name: 'Laporan semester' }).waitFor();
  await page.goto('/#/home');
  await page.getByRole('navigation', { name: 'Aplikasi' }).getByRole('button', { name: 'Papan', exact: true }).click();
  const screen = page.locator('[data-screen="papan"]');
  const rows = screen.getByRole('list', { name: 'Kedudukan kelas' }).getByRole('listitem');
  await expect(rows).toHaveCount(10);
  const mine = screen.locator('li[aria-current="true"]');
  await expect(mine).toHaveCount(1);
  await expect(mine).toContainText('Aina (kamu)');
  const place = Number(await mine.locator('span').first().textContent());
  await expect(screen.getByText(`Kamu di tempat ke-${place} daripada 10.`)).toBeVisible();
  await expect(mine).toHaveCSS('background-color', 'rgb(45, 42, 110)');
});
