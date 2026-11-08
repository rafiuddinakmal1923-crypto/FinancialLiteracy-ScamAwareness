// Routes captured by screens.spec.ts. Later tasks append their screens here.
import type { Page } from '@playwright/test';
import { acceptMuleOffer, patchSavedGame, playHarianCards, playKelasRounds, playScenario1ToEnd, SAMPLE_TX } from './helpers';

/** A fresh Mod Kelas played up to the given state (Merah takes its first button, Biru its second). */
function kelasAt(state: 'question' | 'reveal' | 'scores' | 'winner') {
  return async (page: Page): Promise<void> => {
    await page.goto('/#/home');
    await page.goto('/#/kelas');
    if (state === 'winner') { await playKelasRounds(page, 10); return; }
    await page.getByRole('button', { name: 'Mula', exact: true }).click();
    if (state === 'question') return;
    await page.getByRole('group', { name: 'Pasukan Merah' }).getByRole('button').first().click();
    await page.getByRole('group', { name: 'Pasukan Biru' }).getByRole('button').nth(1).click();
    await page.getByRole('button', { name: 'Dedahkan', exact: true }).click();
    if (state === 'scores') await page.getByRole('button', { name: 'Papan skor', exact: true }).click();
  };
}

/** Confirms the starting split (Simpanan 10%, RM200: under the RM300 emergency target). */
async function confirmBudget(page: Page): Promise<void> {
  await page.goto('/#/dompet');
  await page.getByRole('button', { name: 'Sahkan bajet' }).click();
}

/** At the open week intro: Dompet, then Masuk on Amanah with Simpanan under RM300 shows Kancil's check. */
async function openEmergencyCheck(page: Page): Promise<void> {
  await page.goto('/#/dompet');
  await page.getByRole('article', { name: 'Amanah Cempaka' }).getByRole('button', { name: 'Masuk' }).click();
  await page.getByRole('dialog', { name: 'Dana kecemasan dulu' }).waitFor();
}

/** Puts the saved game at `week` (budget set, intro closed) and opens `path`. */
async function atWeek(page: Page, week: number, path: string): Promise<void> {
  await patchSavedGame(page, { week, onboarded: true, budget: { needs: 50, wants: 30, savings: 20 }, weekIntroOpen: false, lastEnded: null, active: null }, path);
}

/** Loads the finished-semester demo preset (week 12, results, cards, Kad Ilmu), then stays on its report. */
async function seedReport(page: Page): Promise<void> {
  await page.goto('/#/demo/report');
  await page.getByRole('heading', { name: 'Laporan semester' }).waitFor();
}

/** In the 997 drill: taps 9, 9, 7 on the dialler and waits for the call to connect. */
export async function dial997(page: Page): Promise<void> {
  for (const k of ['9', '9', '7']) await page.getByRole('button', { name: k, exact: true }).click();
  await page.getByRole('heading', { name: 'Kenapa minit pertama penting' }).waitFor();
}

/** In a connected 997 drill: ticks every step (they appear one by one) and every item to have ready. */
export async function finish997(page: Page): Promise<void> {
  const open = page.getByRole('checkbox', { checked: false });
  while (await open.count()) await open.first().click();
}

export interface ScreenRoute {
  path: string;
  name: string;
  /** Text to wait for before the screenshot (screens that build up over time, like a chat thread). */
  waitFor?: string | RegExp;
  /** The screen's data-screen value when it differs from `name` (one route captured in several states). */
  screen?: string;
  /** Drives the app to this route instead of a plain goto (screens that need game state first). */
  setup?: (page: Page) => Promise<void>;
}

export const ROUTES: ScreenRoute[] = [
  { path: '/', name: 'splash' },
  { path: '/onboarding', name: 'onboarding' },
  { path: '/home', name: 'home' },
  { path: '/settings', name: 'settings' },
  { path: '/sembang', name: 'sembang' },
  { path: '/sembang/kerja_sambilan', name: 'chat', waitFor: 'Minat! Macam mana nak mula?' },
  // Post-chat screens need an ended scenario: play scenario 1 (scammed path) first, then visit them in order.
  { path: '/semester/akibat/kerja_sambilan', name: 'akibat', waitFor: 'Apa patut buat', setup: playScenario1ToEnd },
  { path: '/semester/bendera/kerja_sambilan', name: 'bendera', waitFor: 'Tekan 3 bendera merah dalam perbualan ini.' },
  { path: '/semester/debrief/kerja_sambilan', name: 'debrief', waitFor: 'Apa patut buat' },
  // Dompet week 0 (no budget yet), then the weekly view, then the week intro it unlocks, then Labur at the intro.
  { path: '/dompet', name: 'dompet-bajet' },
  { path: '/dompet', name: 'dompet', setup: confirmBudget },
  // The ended scenario-1 chat above is still waiting for its debrief, which blocks a new week (Task 25): clear it first.
  {
    path: '/semester/minggu', name: 'minggu', waitFor: 'Baki Duit',
    setup: (page) => patchSavedGame(page, { week: 0, weekIntroOpen: false, lastEnded: null, active: null, budget: { needs: 50, wants: 30, savings: 20 } }, '/semester/minggu'),
  },
  { path: '/dompet', name: 'dompet-labur', screen: 'dompet', setup: openEmergencyCheck },
  // BankKu home with sample transactions, then frozen (last: the frozen account stays for the rest of the run).
  { path: '/bankku', name: 'bankku', setup: (page) => patchSavedGame(page, { txLog: SAMPLE_TX }, '/bankku') },
  { path: '/bankku', name: 'bankku-beku', setup: (page) => patchSavedGame(page, { meters: { akaun: 'Disekat' } }, '/bankku') },
  // Kalkulator: the three tabs.
  { path: '/kalkulator/masa', name: 'kalkulator-masa', screen: 'kalkulator', waitFor: 'RM8,775.28' },
  { path: '/kalkulator/pulangan', name: 'kalkulator-pulangan', screen: 'kalkulator', waitFor: 'Semak dulu: SC Investor Alert List' },
  { path: '/kalkulator/kos', name: 'kalkulator-kos', screen: 'kalkulator', waitFor: 'Jumlah bayar balik' },
  // Cek Harian: the 5-card round, then (after playing it) the 60-second round's ready screen.
  { path: '/harian', name: 'harian', waitFor: 'Cek Harian · 5 kad · ~2 minit' },
  { path: '/harian', name: 'harian-sebab', screen: 'harian', setup: async (page) => { await page.goto('/#/harian'); await playHarianCards(page, 1); } },
  { path: '/harian', name: 'harian-hasil', screen: 'harian', waitFor: 'Streak +1', setup: async (page) => { await page.goto('/#/home'); await page.goto('/#/harian'); await playHarianCards(page, 5, true); } },
  { path: '/harian', name: 'harian-esok', screen: 'harian', waitFor: 'Datang lagi esok', setup: async (page) => { await page.goto('/#/home'); await page.goto('/#/harian'); } },
  { path: '/swipe', name: 'swipe', waitFor: 'Mula' },
  { path: '/swipe', name: 'swipe-main', screen: 'swipe', waitFor: 'Skor 0', setup: async (page) => { await page.goto('/#/swipe'); await page.getByRole('button', { name: 'Mula' }).click(); } },
  // Mod Kelas (projector layout, no phone frame): lobby, a question, the reveal, the scoreboard, the winner.
  { path: '/kelas', name: 'kelas', waitFor: 'Pilih set kad' },
  { path: '/kelas', name: 'kelas-soalan', screen: 'kelas', waitFor: 'Pusingan 1 / 10', setup: kelasAt('question') },
  { path: '/kelas', name: 'kelas-dedah', screen: 'kelas', waitFor: 'Papan skor', setup: kelasAt('reveal') },
  { path: '/kelas', name: 'kelas-skor', screen: 'kelas', waitFor: 'Pusingan seterusnya', setup: kelasAt('scores') },
  { path: '/kelas', name: 'kelas-pemenang', screen: 'kelas', waitFor: 'Main lagi', setup: kelasAt('winner') },
  // In-game fake page on its own route (a link scenario opens the same page over the chat).
  { path: '/laman/kurierkilat-bayar.test', name: 'laman', screen: 'fakepage' },
  // The mule demo preset (resets the game): the chat with the urgency cue, then the BankKu transfer and its TAC.
  { path: '/demo/mule', name: 'chat-mule', screen: 'chat', waitFor: 'Serius RM1,500? Ok, macam mana?' },
  { path: '/demo/mule', name: 'bankku-transfer', setup: async (page) => { await page.goto('/#/demo/mule'); await acceptMuleOffer(page); } },
  { path: '/demo/mule', name: 'bankku-tac', setup: (page) => page.getByRole('button', { name: 'Sahkan' }).click() },
  // Task 25: the incoming call (ringing, then in the call), the new-message banner, the week-7 card and the report.
  { path: '/panggilan/panggilan_mahkamah', name: 'panggilan', waitFor: 'Panggilan masuk', setup: (page) => atWeek(page, 11, '/panggilan/panggilan_mahkamah') },
  {
    path: '/panggilan/panggilan_mahkamah', name: 'panggilan-aktif', screen: 'panggilan', waitFor: 'Hah? Saya tak pernah hantar apa-apa bungkusan.',
    setup: async (page) => { await atWeek(page, 11, '/panggilan/panggilan_mahkamah'); await page.getByRole('button', { name: 'Terima' }).click(); },
  },
  { path: '/semester/mesej/gaji_pertama', name: 'mesej', waitFor: 'Mesej baru dari Nurin', setup: (page) => atWeek(page, 4, '/semester/mesej/gaji_pertama') },
  { path: '/semester/cuti', name: 'cuti', waitFor: 'Minggu ini tiada XP dan tiada pilihan. Ambil masa untuk fikir.', setup: (page) => atWeek(page, 7, '/semester/cuti') },
  // Task 26: the report card, Kad book (both tabs, a tapped Red Flag card) and a Kad Ilmu, from the finished-semester preset.
  { path: '/semester/rapor', name: 'rapor', waitFor: 'Laporan semester', setup: seedReport },
  { path: '/kad', name: 'kad', waitFor: /^7 \/ \d+ kad$/, setup: async (page) => { await seedReport(page); await page.goto('/#/kad'); } },
  {
    path: '/kad', name: 'kad-ilmu-tab', screen: 'kad', waitFor: '4 / 6 kad',
    setup: async (page) => { await seedReport(page); await page.goto('/#/kad'); await page.getByRole('tab', { name: 'Kad Ilmu' }).click(); },
  },
  {
    path: '/kad', name: 'kad-kad', screen: 'kad', waitFor: 'Cara kesan',
    setup: async (page) => { await seedReport(page); await page.goto('/#/kad'); await page.getByRole('button', { name: /^Kad bendera merah/ }).first().click(); },
  },
  { path: '/kad/ilmu/bajet', name: 'kad-ilmu', screen: 'kad-ilmu', waitFor: 'Kad ini menerangkan', setup: async (page) => { await seedReport(page); await page.goto('/#/kad/ilmu/bajet'); } },
  // Task 27: Latihan menu, the 997 drill (dialler, then in the call, then finished), Semak sim (empty, then a reported account) and the checklist.
  { path: '/latihan', name: 'latihan', waitFor: 'Senarai tindakan' },
  { path: '/latihan/997', name: 'latihan-997', waitFor: 'Tekan 9, 9, 7 untuk mula panggilan simulasi.' },
  {
    path: '/latihan/997', name: 'latihan-997-panggilan', screen: 'latihan-997', waitFor: 'Kenapa minit pertama penting',
    setup: async (page) => { await page.goto('/#/latihan'); await page.goto('/#/latihan/997'); await dial997(page); },
  },
  {
    path: '/latihan/997', name: 'latihan-997-siap', screen: 'latihan-997', waitFor: 'Latihan selesai',
    setup: async (page) => { await page.goto('/#/latihan'); await page.goto('/#/latihan/997'); await dial997(page); await finish997(page); },
  },
  { path: '/latihan/semak', name: 'latihan-semak', waitFor: 'Buka Semak Mule sebenar' },
  {
    path: '/latihan/semak', name: 'latihan-semak-hasil', screen: 'latihan-semak', waitFor: 'Dilaporkan dalam 3 kes',
    setup: async (page) => { await page.goto('/#/latihan'); await page.goto('/#/latihan/semak'); await page.getByRole('button', { name: /Cuba: 0000-0000-0638/ }).click(); await page.getByRole('button', { name: 'Semak', exact: true }).click(); },
  },
  {
    path: '/latihan/semak', name: 'latihan-semak-bersih', screen: 'latihan-semak', waitFor: 'Tiada laporan setakat ini',
    setup: async (page) => { await page.goto('/#/latihan'); await page.goto('/#/latihan/semak'); await page.getByRole('button', { name: /Cuba: 0000-0000-0111/ }).click(); await page.getByRole('button', { name: 'Semak', exact: true }).click(); },
  },
  { path: '/latihan/senarai', name: 'latihan-senarai', waitFor: 'Ini untuk kamu sendiri — tiada siapa semak.' },
  {
    path: '/latihan/senarai', name: 'latihan-senarai-tick', screen: 'latihan-senarai', waitFor: '2 / 6 tindakan',
    setup: async (page) => { await page.goto('/#/latihan/senarai'); await page.getByRole('checkbox').nth(0).click(); await page.getByRole('checkbox').nth(4).click(); },
  },
];
