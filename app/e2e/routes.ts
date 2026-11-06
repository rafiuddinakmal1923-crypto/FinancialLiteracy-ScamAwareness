// Routes captured by screens.spec.ts. Later tasks append their screens here.
import type { Page } from '@playwright/test';
import { playScenario1ToEnd } from './helpers';

export interface ScreenRoute {
  path: string;
  name: string;
  /** Text to wait for before the screenshot (screens that build up over time, like a chat thread). */
  waitFor?: string;
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
];
