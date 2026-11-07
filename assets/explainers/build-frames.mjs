// Generates the Tonton explainer frames (D5, D41) as plain SVG: no text in the art, no fonts, no images.
// Run from the repo root: node assets/explainers/build-frames.mjs
// Numbers come from the same formulas as app/src/engine/finance.ts (futureValue, loanCost); captions with the
// figures live in content/explainers.json. Colours are UI-SPEC tokens.
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = dirname(fileURLToPath(import.meta.url));
const C = {
  ink: '#1C1B3A', inkSoft: '#5E5C7A', indigo: '#2D2A6E', indigoSoft: '#E9E8F7', kancil: '#F4A340',
  kancilSoft: '#FFF1DC', white: '#FFFFFF', danger: '#E5484D', dangerSoft: '#FDECEC', safe: '#30A46C', safeSoft: '#E6F6EE',
};
const r1 = (n) => Math.round(n * 10) / 10;

// --- maths (mirror of finance.ts) ---
const fv = (pmt, yearly, months) => {
  const i = yearly / 12;
  return pmt * ((1 + i) ** months - 1) / i;
};

// --- primitives ---
const svg = (title, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" role="img"><title>${title}</title>${body}</svg>\n`;
const rect = (x, y, w, h, fill, rx = 4, extra = '') =>
  `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="${rx}" fill="${fill}"${extra}/>`;
const circle = (cx, cy, r, fill, extra = '') => `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" fill="${fill}"${extra}/>`;
const line = (x1, y1, x2, y2, stroke, w = 2, extra = '') =>
  `<line x1="${r1(x1)}" y1="${r1(y1)}" x2="${r1(x2)}" y2="${r1(y2)}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"${extra}/>`;
const path = (d, fill, stroke = 'none', w = 0, extra = '') =>
  `<path d="${d}" fill="${fill}"${stroke !== 'none' ? ` stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"` : ''}${extra}/>`;
const axis = (y = 172) => line(20, y, 280, y, C.inkSoft, 2);
const person = (cx, cy, fill, s = 1) =>
  circle(cx, cy - 22 * s, 9 * s, fill) + path(`M${cx - 15 * s} ${cy + 6 * s}a${15 * s} ${16 * s} 0 0 1 ${30 * s} 0z`, fill);
const coin = (cx, cy, r = 9) => circle(cx, cy, r, C.kancil) + circle(cx, cy, r * 0.6, 'none', ` stroke="${C.kancilSoft}" stroke-width="1.6"`);
const jar = (x, y, w, h) =>
  rect(x + w * 0.15, y - 8, w * 0.7, 10, C.indigo, 3) + rect(x, y, w, h, C.indigoSoft, 12, ` stroke="${C.indigo}" stroke-width="3"`);
const arrow = (x1, y1, x2, y2, stroke = C.inkSoft) => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 8;
  const p1 = [x2 - h * Math.cos(a - 0.5), y2 - h * Math.sin(a - 0.5)], p2 = [x2 - h * Math.cos(a + 0.5), y2 - h * Math.sin(a + 0.5)];
  return line(x1, y1, x2, y2, stroke, 3) + path(`M${r1(p1[0])} ${r1(p1[1])}L${x2} ${y2}L${r1(p2[0])} ${r1(p2[1])}`, 'none', stroke, 3);
};
const phone = (x, y, w = 56, h = 96) =>
  rect(x, y, w, h, C.indigo, 10) + rect(x + 5, y + 10, w - 10, h - 24, C.indigoSoft, 4) + circle(x + w / 2, y + h - 7, 3.5, C.indigoSoft);
const tag = (x, y, fill = C.kancil) =>
  path(`M${x} ${y}h44l14 14-14 14h-44z`, fill) + circle(x + 47, y + 14, 3.5, C.kancilSoft);
const calendar = (x, y, cols, rows, cell, fillFn) => {
  let s = rect(x - 6, y - 16, cols * cell + 12, rows * cell + 22, C.indigoSoft, 8) + rect(x - 6, y - 16, cols * cell + 12, 10, C.indigo, 4);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) s += rect(x + c * cell + 2, y + r * cell + 2, cell - 4, cell - 4, fillFn(r * cols + c), 3);
  return s;
};
const check = (cx, cy, r = 16) => circle(cx, cy, r, C.safe) + path(`M${cx - r * 0.45} ${cy}l${r * 0.32} ${r * 0.32} ${r * 0.6}-${r * 0.62}`, 'none', '#FFFFFF', 3.5);

// --- Kompaun: RM50 a month from age 19, example 5% a year ---
const RATE = 0.05;
const years = Array.from({ length: 10 }, (_, i) => i + 1).map((y) => ({ y, paid: 600 * y, value: fv(50, RATE, 12 * y) }));
const maxV = years.at(-1).value;
const bars = (capsUpTo, highlightLast = false) => {
  let s = axis();
  for (const { y, paid, value } of years) {
    const x = 28 + (y - 1) * 25.5, w = 18;
    const hp = (paid / maxV) * 140, hv = (value / maxV) * 140;
    s += rect(x, 172 - hp, w, hp, C.indigo, 3);
    if (y <= capsUpTo) s += rect(x, 172 - hv, w, hv - hp + 3, C.kancil, 3);
    if (highlightLast && y === 10) s += rect(x - 4, 172 - hv - 4, w + 8, hv + 8, 'none', 6, ` stroke="${C.kancil}" stroke-width="2.5" stroke-dasharray="5 4"`);
  }
  return s;
};

const kompaun = [
  // 1. Aina drops RM50 into a jar each month.
  person(70, 130, C.indigo, 1.6) + coin(150, 70, 12) + arrow(150, 88, 190, 112, C.kancil) + jar(190, 110, 70, 62) + coin(225, 150, 11) + axis(),
  // 2. Savings only: +RM600 a year (straight steps).
  bars(0),
  // 3. Returns start to appear (orange caps, first years).
  bars(4),
  // 4. Ten years: the cap keeps growing (returns on returns).
  bars(10, true),
  // 5. Age 19 to 55: value curve pulls away from the straight savings line.
  (() => {
    const pts = [], paid = [];
    const maxA = fv(50, RATE, 36 * 12);
    for (let a = 0; a <= 36; a++) {
      const x = 28 + (a / 36) * 244;
      pts.push([x, 172 - (fv(50, RATE, a * 12 || 1e-9) / maxA) * 145]);
      paid.push([x, 172 - ((600 * a) / maxA) * 145]);
    }
    const d = (p) => p.map(([x, y], i) => `${i ? 'L' : 'M'}${r1(x)} ${r1(y)}`).join('');
    const area = d(pts) + paid.slice().reverse().map(([x, y]) => `L${r1(x)} ${r1(y)}`).join('') + 'z';
    return axis() + path(area, C.kancilSoft) + path(d(paid), 'none', C.indigo, 4) + path(d(pts), 'none', C.kancil, 4) +
      circle(pts.at(-1)[0], pts.at(-1)[1], 6, C.kancil) + circle(paid.at(-1)[0], paid.at(-1)[1], 6, C.indigo);
  })(),
  // 6. Start at 19 vs start at 29, both to 55.
  (() => {
    const a = { paid: 21600, value: fv(50, RATE, 36 * 12) }, b = { paid: 15600, value: fv(50, RATE, 26 * 12) };
    const sc = 120 / a.value;
    const stack = (x, v) => rect(x, 150 - v.paid * sc, 50, v.paid * sc, C.indigo, 4) + rect(x, 150 - v.value * sc, 50, (v.value - v.paid) * sc + 4, C.kancil, 4);
    const timeline = (x, start) => line(x, 186, x + 70, 186, C.indigoSoft, 6) + line(x + ((start - 19) / 36) * 70, 186, x + 70, 186, C.indigo, 6);
    return line(20, 150, 280, 150, C.inkSoft, 2) + stack(70, a) + stack(180, b) +
      person(45, 178, C.indigo, 0.8) + person(155, 178, C.inkSoft, 0.8) + timeline(70, 19) + timeline(180, 29);
  })(),
  // 7. Example only: real values go up and down; check the licence first.
  (() => {
    const wave = 'M28 140C55 120 70 150 95 118S140 128 160 96S205 110 225 78S260 70 272 52';
    return axis() + path(wave, 'none', C.kancil, 4, ' stroke-dasharray="2 0"') +
      circle(200, 110, 26, 'none', ` stroke="${C.indigo}" stroke-width="6"`) + line(219, 129, 246, 156, C.indigo, 9) +
      check(250, 40, 16);
  })(),
];

// --- Hutang: RM1,000 phone, flat 10% a year, 12 months ---
const hutang = [
  // 1. A RM1,000 phone.
  phone(110, 40) + tag(176, 60) + axis(),
  // 2. "Pay later": 12 monthly slots.
  phone(40, 50) + arrow(108, 98, 140, 98) + calendar(156, 60, 4, 3, 30, () => C.white),
  // 3. Each month an instalment; the total is RM1,000 + RM100 cost.
  calendar(30, 70, 4, 3, 26, () => C.indigo) + arrow(150, 108, 176, 108) +
    rect(200, 172 - 120, 56, 120, C.indigo, 4) + rect(200, 172 - 132, 56, 16, C.danger, 4) + axis(),
  // 4. Flat rate: charged on the full RM1,000 each month while the balance shrinks.
  (() => {
    let s = axis();
    for (let m = 0; m < 12; m++) {
      const h = ((12 - m) / 12) * 120, x = 30 + m * 20.5;
      s += rect(x, 172 - h, 14, h, C.indigo, 3) + rect(x, 172 - 132, 14, 7, C.danger, 2);
    }
    return s + line(24, 52, 276, 52, C.danger, 2, ' stroke-dasharray="6 5"');
  })(),
  // 5. Stated 10% vs about 18% effective a year.
  axis() + rect(70, 172 - 60, 60, 60, C.kancil, 6) + rect(170, 172 - 108, 60, 108, C.danger, 6) +
    circle(200, 40, 18, C.dangerSoft) + path('M200 28v14', 'none', C.danger, 4) + circle(200, 50, 2.6, C.danger),
  // 6. 24 months: smaller instalment, bigger total.
  (() => {
    const strip = (x, n) => { let s = ''; for (let i = 0; i < n; i++) s += rect(x + (i % 12) * 9, 18 + Math.floor(i / 12) * 9, 7, 7, C.indigo, 1.5); return s; };
    return axis() + strip(50, 12) + strip(170, 24) +
      rect(60, 172 - 110, 70, 110, C.indigo, 4) + rect(60, 172 - 121, 70, 15, C.danger, 4) +
      rect(180, 172 - 110, 70, 110, C.indigo, 4) + rect(180, 172 - 132, 70, 26, C.danger, 4);
  })(),
  // 7. Late payment: extra charges can pile up.
  path('M70 40L112 112H28z', C.kancil) + path('M70 64v24', 'none', C.ink, 6) + circle(70, 100, 3.6, C.ink) +
    calendar(150, 60, 3, 2, 30, (i) => (i === 4 ? C.dangerSoft : C.indigo)) +
    path('M188 98l14 14M202 98l-14 14', 'none', C.danger, 4) +
    rect(160, 150, 30, 10, C.danger, 3) + rect(196, 142, 30, 18, C.danger, 3) + rect(232, 130, 30, 30, C.danger, 3) + axis(172),
  // 8. Or save first: 11 months of RM91.67, then buy in cash with no extra cost.
  (() => {
    let s = jar(30, 70, 90, 92);
    for (let i = 0; i < 11; i++) s += coin(48 + (i % 4) * 18, 150 - Math.floor(i / 4) * 20, 8);
    return s + arrow(134, 116, 170, 116) + phone(186, 60) + check(252, 58, 16) + axis();
  })(),
];

const write = (prefix, frames, title) =>
  frames.forEach((body, i) => writeFileSync(join(OUT, `${prefix}-${i + 1}.svg`), svg(`${title}, frame ${i + 1}`, body)));
write('kompaun', kompaun, 'Compound growth example');
write('hutang', hutang, 'Cost of debt example');
console.log(`wrote ${kompaun.length} kompaun and ${hutang.length} hutang frames`);
