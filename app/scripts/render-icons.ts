// Renders public/icon.svg to the PWA PNG icons with Playwright's Chromium. Run: npx tsx scripts/render-icons.ts
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const pub = fileURLToPath(new URL('../public/', import.meta.url));
const svg = readFileSync(pub + 'icon.svg', 'utf8');

const outputs: { file: string; size: number }[] = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
  // Maskable: artwork already sits inside the 80% safe zone on a full-bleed background.
  { file: 'icon-maskable-512.png', size: 512 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const o of outputs) {
  await page.setViewportSize({ width: o.size, height: o.size });
  await page.setContent(
    `<html><body style="margin:0;background:#2D2A6E">` +
    `<div style="width:${o.size}px;height:${o.size}px">${svg.replace('<svg ', `<svg width="${o.size}" height="${o.size}" `)}</div></body></html>`,
  );
  await page.screenshot({ path: pub + o.file, omitBackground: false });
  console.log('wrote', o.file);
}
await browser.close();
