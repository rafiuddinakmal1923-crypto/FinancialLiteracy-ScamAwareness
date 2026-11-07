// D4: scores the before/after test from scores.csv and prints the tables for results.md.
// Run from the repo root: node research/validation/analyse.mjs
// scores.csv: one row per random code (never a name), each answer as the letter the student chose (A-D),
// or blank if they skipped it. Only codes with both a pre and a post answer sheet are counted.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const KEY = ['B', 'C', 'D', 'A', 'C', 'B', 'D', 'A', 'C', 'B', 'D', 'A']; // research/validation/test.md answer key
const MONEY = [0, 1, 2, 3, 4, 5];
const SCAM = [6, 7, 8, 9, 10, 11];

const file = join(dirname(fileURLToPath(import.meta.url)), 'scores.csv');
const [head, ...rows] = readFileSync(file, 'utf8').trim().split(/\r?\n/);
const cols = head.split(',');
const idx = (name) => cols.indexOf(name);

const people = rows.filter((r) => r.trim()).map((r) => {
  const c = r.split(',').map((s) => s.trim().toUpperCase());
  const ans = (phase) => KEY.map((_, q) => c[idx(`${phase}_q${q + 1}`)] ?? '');
  return { code: c[0], pre: ans('pre'), post: ans('post') };
});
const complete = people.filter((p) => p.pre.some(Boolean) && p.post.some(Boolean));
const right = (ans, qs) => qs.filter((q) => ans[q] === KEY[q]).length;
const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const f = (n) => n.toFixed(2);

const n = complete.length;
console.log(`Sheets: ${people.length}, with both tests (n): ${n}`);
if (n === 0) { console.log('No complete rows yet.'); process.exit(0); }

const part = (qs, name, max) => {
  const pre = complete.map((p) => right(p.pre, qs)), post = complete.map((p) => right(p.post, qs));
  const gains = post.map((v, i) => v - pre[i]);
  const up = gains.filter((g) => g > 0).length, same = gains.filter((g) => g === 0).length, down = gains.filter((g) => g < 0).length;
  return `| ${name} | ${f(mean(pre))} / ${max} | ${f(mean(post))} / ${max} | ${gains.length ? (mean(gains) >= 0 ? '+' : '') + f(mean(gains)) : '-'} | ${up} / ${same} / ${down} |`;
};
console.log('\n| Part | Before (mean) | After (mean) | Change | Up / same / down |\n| --- | --- | --- | --- | --- |');
console.log(part(MONEY, 'Money (Q1-6)', 6));
console.log(part(SCAM, 'Scam (Q7-12)', 6));
console.log(part([...MONEY, ...SCAM], 'Total', 12));

console.log('\n| Q | Right before | Right after |\n| --- | --- | --- |');
KEY.forEach((_, q) => {
  const b = complete.filter((p) => p.pre[q] === KEY[q]).length, a = complete.filter((p) => p.post[q] === KEY[q]).length;
  console.log(`| ${q + 1} | ${b} / ${n} | ${a} / ${n} |`);
});
