// The English toggle across the whole app: every screen and every scenario end to end, checked for leftover BM
// in visible text and in screen-reader labels. Runs at desktop width so the side panels are on screen too.
import { expect, test, type Page } from '@playwright/test';
import { patchSavedGame } from './helpers';

/** Fictional names and real items that are the same in both languages; removed before looking for BM words. */
const NAMES = [
  'Amanah Cempaka', 'Dana Ekuiti Cempaka', 'Universiti Cempaka Raya', 'Kafe Cempaka', 'Teratai Emas Enterprise', 'Bintang Digital Sdn Bhd',
  'BayarNanti', 'BankKu', 'KedaiOnline', 'KurierKilat', 'Semak Mule', 'Bahasa Melayu', 'Sang Kancil', 'Abang Zul', 'Kak Mira', 'Kak Sofea', 'Kak Wani',
];
/** Common BM words that are not English words. */
const BM = /(?<![\p{L}\p{N}_.-])(dan|yang|untuk|kamu|anda|dengan|tidak|tak|duit|akaun|semak|kira|sahaja|lagi|minggu|bayar|pindah|simpan|kad|mesej|belum|sudah|dah|atau|jangan|kalau|boleh|ini|itu|ada|pasukan|merah|biru|kuning|hijau|ungu|jingga|kelas|bajet|hutang|labur|dompet|sembang|keluar|masuk|pilih|mula|selesai|tiada|rakan|kawan|gaji|yuran|belanja|makan|tekanan|pengangkutan|keperluan|kehendak|simpanan|kalkulator|latihan|tetapan|laporan|bendera|contoh|hari|bulan|tahun|mesin|masa)(?![\p{L}\p{N}_-])/giu;

const seen = new Map<string, string[]>();

/** Records BM words on the current screen, in visible text and in accessible names. */
async function scan(page: Page, where: string): Promise<void> {
  await page.waitForTimeout(150);
  const text = await page.evaluate(() => {
    const labels = Array.from(document.querySelectorAll('[aria-label],[alt],[title],[placeholder]')).flatMap((el) =>
      ['aria-label', 'alt', 'title', 'placeholder'].map((a) => el.getAttribute(a) ?? ''));
    const hidden = Array.from(document.querySelectorAll('.sr-only')).map((el) => el.textContent ?? '');
    return [document.body.innerText, ...labels, ...hidden].join('\n');
  });
  for (let line of text.split('\n')) {
    for (const n of NAMES) line = line.split(n).join(' ');
    const words = [...line.matchAll(BM)].map((m) => m[0]);
    if (words.length) {
      const key = `${where}: [${[...new Set(words)].join(', ')}] ${line.trim().slice(0, 110)}`;
      seen.set(key, words);
    }
  }
}

async function seedEnglish(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await scan(page, 'splash');
  await page.getByRole('button', { name: 'Start' }).click();
  await scan(page, 'onboarding-1');
  await page.getByRole('button', { name: /Aina/ }).click();
  await scan(page, 'onboarding-chosen');
  await page.getByRole('button', { name: 'Next' }).click();
  await scan(page, 'onboarding-2');
  await page.getByRole('button', { name: 'Next' }).click();
  await scan(page, 'onboarding-3');
  await page.getByRole('button', { name: 'Enter the semester' }).click();
  await expect(page.getByText('Week 1 of 12')).toBeVisible();
}

async function visit(page: Page, path: string, where = path): Promise<void> {
  await page.goto(`/#${path}`);
  await page.waitForTimeout(250);
  await scan(page, where);
}

test.beforeEach(() => seen.clear());

test('every screen is in English', async ({ page }) => {
  test.setTimeout(240_000);
  await seedEnglish(page);
  await scan(page, 'home');
  for (const p of ['/settings', '/sembang', '/kalkulator/masa', '/kalkulator/pulangan', '/kalkulator/kos', '/kad', '/latihan', '/latihan/semak', '/latihan/senarai', '/laman/kurierkilat-bayar.test', '/semester/cuti', '/semester/mesej/gaji_pertama']) {
    await visit(page, p);
  }

  // Wallet: budget split, then the weekly view.
  await visit(page, '/dompet', 'dompet-split');
  await page.getByRole('button', { name: 'Confirm budget' }).click();
  await scan(page, 'dompet');

  // Week intro with its costs, each week.
  for (const week of [3, 5, 9]) {
    await patchSavedGame(page, { week, weekIntroOpen: true }, '/semester/minggu');
    await scan(page, `minggu-${week}`);
  }

  // BankKu with real labels from play, in BM as stored.
  await patchSavedGame(page, {
    txLog: [
      { id: 1, week: 1, label: 'Makan', amount: -80 }, { id: 2, week: 1, label: 'Pengangkutan', amount: -20 },
      { id: 3, week: 3, label: 'Yuran asrama', amount: -600 }, { id: 4, week: 4, label: 'bankku.tx.income', amount: 400 },
      { id: 5, week: 11, label: 'Pegawai Mahkamah', amount: -300, scenario: 'panggilan_mahkamah' },
      { id: 6, week: 2, label: 'Hafiz (Rakan Serumah)', amount: -10, scenario: 'dompet_minggu0' },
      { id: 7, week: 5, label: 'bankku.tx.labur.amanah', amount: -50 },
    ],
    weekIntroOpen: false,
  }, '/bankku');
  await scan(page, 'bankku');
  await expect(page.getByText('Court Officer')).toBeVisible();
  await expect(page.getByText('Hostel fee')).toBeVisible();
  await patchSavedGame(page, { meters: { akaun: 'Disekat', rekod: 'Disiasat' } }, '/bankku');
  await scan(page, 'bankku-frozen');
  await patchSavedGame(page, { meters: { akaun: 'Aktif', rekod: 'Bersih' } }, '/home');

  // Daily Check: all five cards, with the reason shown after each.
  await visit(page, '/harian', 'harian-card');
  for (let i = 0; i < 5; i++) {
    const answer = page.getByRole('button', { name: /^(Scam$|TRUE$|A: )/ }).first();
    await answer.click();
    await scan(page, `harian-why-${i}`);
    await page.getByRole('button', { name: /^(Next|See results)$/ }).click();
    await scan(page, `harian-next-${i}`);
  }
  await visit(page, '/harian', 'harian-comeback');

  // Legit or Scam: intro and a round.
  await visit(page, '/swipe', 'swipe-intro');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await scan(page, 'swipe-round');

  // Drills: the 997 call.
  await visit(page, '/latihan/997', 'latihan-997');
  for (const k of ['9', '9', '7']) await page.getByRole('button', { name: k, exact: true }).click();
  await page.getByRole('heading', { name: 'Why the first minutes matter' }).waitFor();
  await scan(page, 'latihan-997-connected');
  const open = page.getByRole('checkbox', { checked: false });
  while (await open.count()) await open.first().click();
  await scan(page, 'latihan-997-finished');

  // Account check, reported and clean.
  await visit(page, '/latihan/semak', 'semak');
  await page.getByRole('button', { name: /^Try: / }).first().click();
  await page.getByRole('button', { name: 'Check', exact: true }).click();
  await scan(page, 'semak-result');

  // Report card, cards and knowledge cards (the demo scene seeds a full semester).
  await visit(page, '/demo/report', 'rapor');
  await page.getByRole('heading', { name: 'Semester report' }).waitFor();
  await scan(page, 'rapor');
  await visit(page, '/kad', 'kad-flags');
  await page.getByRole('tab', { name: 'Knowledge Cards' }).click();
  await scan(page, 'kad-ilmu-tab');
  for (const c of ['bajet', 'kecemasan', 'kompaun', 'risiko', 'semak', 'hutang']) await visit(page, `/kad/ilmu/${c}`, `ilmu-${c}`);
  await visit(page, '/kad', 'kad-flags-open');
  await page.getByRole('tab', { name: 'Red Flags' }).click();
  const card = page.getByRole('button', { name: /^Red flag card/ }).first();
  await card.click();
  await scan(page, 'kad-detail');
  expect([...seen.keys()]).toEqual([]);
});

test('Class Mode is in English, round to winner', async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seedEnglish(page);
  await visit(page, '/kelas', 'kelas-lobby');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  for (let round = 1; round <= 10; round++) {
    await scan(page, `kelas-q${round}`);
    await page.getByRole('group', { name: 'Red Team' }).getByRole('button').first().click();
    await page.getByRole('group', { name: 'Blue Team' }).getByRole('button').nth(1).click();
    await page.getByRole('button', { name: 'Reveal', exact: true }).click();
    await scan(page, `kelas-reveal${round}`);
    await page.getByRole('button', { name: 'Scoreboard', exact: true }).click();
    await scan(page, `kelas-score${round}`);
    await page.getByRole('button', { name: round === 10 ? 'See the winner' : 'Next round', exact: true }).click();
  }
  await scan(page, 'kelas-winner');
  expect([...seen.keys()]).toEqual([]);
});

/** Plays a scenario, always taking the reply at position `pick` (or the last one offered), through to its aftermath. */
async function play(page: Page, id: string, week: number, pick: 'first' | 'last'): Promise<void> {
  const call = id === 'panggilan_mahkamah';
  await patchSavedGame(page, { week, results: [], active: null, lastEnded: null, calcResume: null, weekIntroOpen: false }, call ? `/panggilan/${id}` : `/sembang/${id}`);
  const tag = `${id}-${pick}`;
  if (call) {
    await scan(page, `${tag}-ringing`);
    await page.getByRole('button', { name: 'Answer' }).click();
  }
  const replies = page.getByRole('group', { name: 'Choose a reply' });
  const next = page.getByRole('button', { name: 'See what happens next' });
  const bank = page.getByRole('button', { name: 'Open BankKu' });
  const calc = page.getByRole('button', { name: 'Open Calculator' });
  const deadline = Date.now() + 90_000;
  for (let turn = 0; ; turn++) {
    expect(Date.now(), `${tag} never ended`).toBeLessThan(deadline);
    await expect(replies.or(next).or(bank).or(calc).first()).toBeVisible({ timeout: 30_000 });
    await scan(page, `${tag}-${turn}`);
    if (await next.isVisible()) break;
    if (await bank.isVisible()) {
      await bank.click();
      await scan(page, `${tag}-transfer`);
      await page.getByRole('button', { name: 'Confirm', exact: true }).click();
      await scan(page, `${tag}-tac`);
      await page.getByRole('button', { name: 'Send TAC' }).click();
      continue;
    }
    if (await calc.isVisible()) {
      await calc.click();
      await scan(page, `${tag}-calc`);
      await page.getByRole('button', { name: 'Back to the chat' }).click();
      continue;
    }
    const chips = replies.getByRole('button');
    // The hint chip sits with the replies and costs XP; it does not move the chat on.
    const texts = (await chips.allTextContents()).map((s) => s.trim());
    const real = texts.map((s, i) => [s, i] as const).filter(([s]) => !s.startsWith('Ask Kancil'));
    const chosen = pick === 'first' ? real[0] : real[real.length - 1];
    await chips.nth(chosen[1]).click();
  }
  await next.click();
  await page.waitForTimeout(400);
  await scan(page, `${tag}-consequence`);
  await visit(page, `/semester/bendera/${id}`, `${tag}-flags`);
  await visit(page, `/semester/debrief/${id}`, `${tag}-debrief`);
}

const PLAYS: [string, number][] = [
  ['kerja_sambilan', 1], ['dompet_minggu0', 2], ['sewa_akaun', 3], ['gaji_pertama', 4], ['kawan_labur', 5],
  ['alert_bankku', 6], ['crypto_naga', 8], ['bayar_nanti', 9], ['buku_terpakai', 10], ['panggilan_mahkamah', 11],
];

for (const pick of ['first', 'last'] as const) {
  test(`all ten scenarios in English, taking the ${pick} reply`, async ({ page }) => {
    test.setTimeout(420_000);
    await seedEnglish(page);
    for (const [id, week] of PLAYS) await play(page, id, week, pick);
    expect([...seen.keys()]).toEqual([]);
  });
}

test('a chat finished in English reads in BM after switching language, and back', async ({ page }) => {
  test.setTimeout(120_000);
  await seedEnglish(page);
  await play(page, 'sewa_akaun', 3, 'last');
  await page.getByRole('button', { name: 'Got it, continue' }).click();
  await page.goto('/#/sembang/sewa_akaun');
  await expect(page.getByText('Engineering senior', { exact: false })).toBeVisible();
  await page.goto('/#/settings');
  await page.getByRole('button', { name: 'BM', exact: true }).click();
  await page.goto('/#/sembang/sewa_akaun');
  await expect(page.getByText('senior Kejuruteraan', { exact: false })).toBeVisible();
  await expect(page.getByText('Engineering senior', { exact: false })).toHaveCount(0);
});

// English copy is often longer than BM: the phone layouts must still hold at the primary sizes.
for (const vp of [{ width: 360, height: 800 }, { width: 412, height: 915 }]) {
  test(`English fits at ${vp.width}x${vp.height}`, async ({ page }) => {
    test.setTimeout(180_000);
    await seedEnglish(page);
    await page.setViewportSize(vp);
    const dir = `e2e/screens/en-${vp.width}x${vp.height}`;
    const check = async (name: string) => {
      await page.waitForTimeout(350);
      await page.screenshot({ path: `${dir}/${name}.png` });
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(over, `${name} overflows horizontally`).toBeLessThanOrEqual(0);
    };
    for (const [name, path] of [
      ['home', '/home'], ['settings', '/settings'], ['sembang', '/sembang'], ['dompet', '/dompet'], ['bankku', '/bankku'],
      ['masa', '/kalkulator/masa'], ['pulangan', '/kalkulator/pulangan'], ['kos', '/kalkulator/kos'], ['harian', '/harian'], ['swipe', '/swipe'],
      ['latihan', '/latihan'], ['semak', '/latihan/semak'], ['senarai', '/latihan/senarai'], ['997', '/latihan/997'], ['kad', '/kad'], ['ilmu', '/kad/ilmu/kompaun'],
      ['cuti', '/semester/cuti'], ['laman', '/laman/kurierkilat-bayar.test'], ['rapor', '/demo/report'],
    ] as const) {
      await page.goto(`/#${path}`);
      await check(name);
    }
    await patchSavedGame(page, { week: 3, results: [], lastEnded: null, active: null, weekIntroOpen: true }, '/semester/minggu');
    await check('minggu');
    await patchSavedGame(page, { week: 3, results: [], lastEnded: null, active: null, weekIntroOpen: false }, '/sembang/sewa_akaun');
    await expect(page.getByRole('group', { name: 'Choose a reply' })).toBeVisible({ timeout: 30_000 });
    await check('chat');
    await patchSavedGame(page, { week: 11, results: [], lastEnded: null, active: null }, '/panggilan/panggilan_mahkamah');
    await check('call');
  });
}
