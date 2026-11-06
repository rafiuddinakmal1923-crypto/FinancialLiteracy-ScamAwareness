// Routes captured by screens.spec.ts. Later tasks append their screens here.
import type { Page } from '@playwright/test';
import { acceptMuleOffer, patchSavedGame, playScenario1ToEnd, SAMPLE_TX } from './helpers';

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

export interface ScreenRoute {
  path: string;
  name: string;
  /** Text to wait for before the screenshot (screens that build up over time, like a chat thread). */
  waitFor?: string;
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
  { path: '/semester/minggu', name: 'minggu', waitFor: 'Baki Duit' },
  { path: '/dompet', name: 'dompet-labur', screen: 'dompet', setup: openEmergencyCheck },
  // BankKu home with sample transactions, then frozen (last: the frozen account stays for the rest of the run).
  { path: '/bankku', name: 'bankku', setup: (page) => patchSavedGame(page, { txLog: SAMPLE_TX }, '/bankku') },
  { path: '/bankku', name: 'bankku-beku', setup: (page) => patchSavedGame(page, { meters: { akaun: 'Disekat' } }, '/bankku') },
  // Kalkulator: the three tabs.
  { path: '/kalkulator/masa', name: 'kalkulator-masa', screen: 'kalkulator', waitFor: 'RM8,775.28' },
  { path: '/kalkulator/pulangan', name: 'kalkulator-pulangan', screen: 'kalkulator', waitFor: 'Semak dulu: SC Investor Alert List' },
  { path: '/kalkulator/kos', name: 'kalkulator-kos', screen: 'kalkulator', waitFor: 'Jumlah bayar balik' },
  // In-game fake page on its own route (a link scenario opens the same page over the chat).
  { path: '/laman/kurierkilat-bayar.test', name: 'laman', screen: 'fakepage' },
  // The mule demo preset (resets the game): the chat with the urgency cue, then the BankKu transfer and its TAC.
  { path: '/demo/mule', name: 'chat-mule', screen: 'chat', waitFor: 'Serius RM1,500? Ok, macam mana?' },
  { path: '/demo/mule', name: 'bankku-transfer', setup: async (page) => { await page.goto('/#/demo/mule'); await acceptMuleOffer(page); } },
  { path: '/demo/mule', name: 'bankku-tac', setup: (page) => page.getByRole('button', { name: 'Sahkan' }).click() },
];
