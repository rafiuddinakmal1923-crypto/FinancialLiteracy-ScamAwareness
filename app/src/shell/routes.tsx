// Route table: path pattern -> screen. Later tasks add their screens here (e.g. '/sembang', '/semester');
// home tiles pointing at a path with no entry show an "Akan datang" toast instead.
import type { ComponentType } from 'react';
import type { KancilMood } from '../ui/Kancil';
import { BankKuScreen } from '../modes/semester/BankKu';
import { ChatList } from '../modes/semester/ChatList';
import { ChatThread } from '../modes/semester/ChatThread';
import { Consequence } from '../modes/semester/Consequence';
import { Debrief } from '../modes/semester/Debrief';
import { Dompet } from '../modes/semester/Dompet';
import { FakePageScreen } from '../modes/semester/FakePageScreen';
import { FlagHunt } from '../modes/semester/FlagHunt';
import { WeekIntro } from '../modes/semester/WeekIntro';
import { IncomingCall } from '../modes/semester/IncomingCall';
import { NewMessage } from '../modes/semester/NewMessage';
import { Cuti } from '../modes/semester/Cuti';
import { ReportCard } from '../modes/semester/ReportCard';
import { KadBook } from '../modes/kad/KadBook';
import { KadIlmu } from '../modes/kad/KadIlmu';
import { Kalkulator } from '../modes/kalkulator/Kalkulator';
import { CekHarian } from '../modes/harian/CekHarian';
import { SwipeGame } from '../modes/harian/SwipeGame';
import { ClassMode } from '../modes/classmode/ClassMode';
import { Checklist } from '../modes/drills/Checklist';
import { Drill997 } from '../modes/drills/Drill997';
import { Latihan } from '../modes/drills/Latihan';
import { SemakSim } from '../modes/drills/SemakSim';
import { DemoScene } from './DemoScene';
import { HomeScreen } from './HomeScreen';
import { Onboarding } from './Onboarding';
import { setRouteTable } from './router';
import { Settings } from './Settings';
import { Splash } from './Splash';

export interface RouteDef {
  pattern: string;
  name: string;
  component: ComponentType<{ params: Record<string, string> }>;
  /** Phone status bar style; null hides it (splash, onboarding). */
  statusBar?: 'dark' | 'light' | null;
  /** Redirect to the splash when no game has started yet (not onboarded). */
  needsGame?: boolean;
  /** i18n key for the desktop Kancil tip panel, and his mood there. */
  tip: string;
  mood?: KancilMood;
  /** 'full' renders the screen on its own, with no phone frame or side panels (Mod Kelas on a projector). */
  layout?: 'phone' | 'full';
}

export const ROUTE_TABLE: RouteDef[] = [
  { pattern: '/', name: 'splash', component: Splash, tip: 'side.tip.splash', mood: 'smile' },
  { pattern: '/onboarding', name: 'onboarding', component: Onboarding, tip: 'side.tip.onboarding', mood: 'neutral' },
  { pattern: '/home', name: 'home', component: HomeScreen, statusBar: 'dark', needsGame: true, tip: 'side.tip.home', mood: 'smile' },
  { pattern: '/settings', name: 'settings', component: Settings, statusBar: 'light', tip: 'side.tip.settings', mood: 'neutral' },
  { pattern: '/sembang', name: 'sembang', component: ChatList, statusBar: 'light', needsGame: true, tip: 'side.tip.sembang', mood: 'neutral' },
  { pattern: '/sembang/:id', name: 'chat', component: ChatThread, statusBar: 'light', needsGame: true, tip: 'side.tip.chat', mood: 'worried' },
  { pattern: '/semester/akibat/:id', name: 'akibat', component: Consequence, statusBar: 'light', needsGame: true, tip: 'side.tip.akibat', mood: 'worried' },
  { pattern: '/semester/bendera/:id', name: 'bendera', component: FlagHunt, statusBar: 'light', needsGame: true, tip: 'side.tip.bendera', mood: 'neutral' },
  { pattern: '/semester/debrief/:id', name: 'debrief', component: Debrief, statusBar: 'light', needsGame: true, tip: 'side.tip.debrief', mood: 'proud' },
  { pattern: '/bankku', name: 'bankku', component: BankKuScreen, statusBar: 'dark', needsGame: true, tip: 'side.tip.bankku', mood: 'neutral' },
  { pattern: '/dompet', name: 'dompet', component: Dompet, statusBar: 'dark', needsGame: true, tip: 'side.tip.dompet', mood: 'smile' },
  { pattern: '/kalkulator', name: 'kalkulator', component: Kalkulator, statusBar: 'dark', needsGame: true, tip: 'side.tip.kalkulator', mood: 'smile' },
  { pattern: '/kalkulator/:tab', name: 'kalkulator-tab', component: Kalkulator, statusBar: 'dark', needsGame: true, tip: 'side.tip.kalkulator', mood: 'smile' },
  { pattern: '/harian', name: 'harian', component: CekHarian, statusBar: 'dark', needsGame: true, tip: 'side.tip.harian', mood: 'smile' },
  { pattern: '/swipe', name: 'swipe', component: SwipeGame, statusBar: 'dark', needsGame: true, tip: 'side.tip.swipe', mood: 'neutral' },
  { pattern: '/kelas', name: 'kelas', component: ClassMode, layout: 'full', tip: 'side.tip.home' },
  { pattern: '/semester/minggu', name: 'minggu', component: WeekIntro, statusBar: 'dark', needsGame: true, tip: 'side.tip.minggu', mood: 'neutral' },
  { pattern: '/semester/mesej/:id', name: 'mesej', component: NewMessage, statusBar: 'dark', needsGame: true, tip: 'side.tip.mesej', mood: 'neutral' },
  { pattern: '/panggilan/:id', name: 'panggilan', component: IncomingCall, statusBar: 'dark', needsGame: true, tip: 'side.tip.panggilan', mood: 'worried' },
  { pattern: '/semester/cuti', name: 'cuti', component: Cuti, statusBar: 'dark', needsGame: true, tip: 'side.tip.cuti', mood: 'smile' },
  { pattern: '/semester/rapor', name: 'rapor', component: ReportCard, statusBar: 'light', needsGame: true, tip: 'side.tip.rapor', mood: 'proud' },
  { pattern: '/kad', name: 'kad', component: KadBook, statusBar: 'dark', needsGame: true, tip: 'side.tip.kad', mood: 'smile' },
  { pattern: '/kad/ilmu/:code', name: 'kad-ilmu', component: KadIlmu, statusBar: 'dark', needsGame: true, tip: 'side.tip.kad', mood: 'smile' },
  { pattern: '/latihan', name: 'latihan', component: Latihan, statusBar: 'light', needsGame: true, tip: 'side.tip.latihan', mood: 'smile' },
  { pattern: '/latihan/997', name: 'latihan-997', component: Drill997, statusBar: 'light', needsGame: true, tip: 'side.tip.latihan997', mood: 'worried' },
  { pattern: '/latihan/semak', name: 'latihan-semak', component: SemakSim, statusBar: 'light', needsGame: true, tip: 'side.tip.latihanSemak', mood: 'neutral' },
  { pattern: '/latihan/senarai', name: 'latihan-senarai', component: Checklist, statusBar: 'light', needsGame: true, tip: 'side.tip.latihanSenarai', mood: 'proud' },
  { pattern: '/laman/:url', name: 'laman', component: FakePageScreen, statusBar: 'light', needsGame: true, tip: 'side.tip.laman', mood: 'worried' },
  { pattern: '/demo/:scene', name: 'demo', component: DemoScene, statusBar: 'light', tip: 'side.tip.demo', mood: 'neutral' },
];

export const FALLBACK_PATH = '/home';

setRouteTable(ROUTE_TABLE);
