// Route table: path pattern -> screen. Later tasks add their screens here (e.g. '/sembang', '/semester');
// home tiles pointing at a path with no entry show an "Akan datang" toast instead.
import type { ComponentType } from 'react';
import type { KancilMood } from '../ui/Kancil';
import { ChatList } from '../modes/semester/ChatList';
import { ChatThread } from '../modes/semester/ChatThread';
import { ComingSoon } from './ComingSoon';
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
  /** Redirect to the splash when no game has started yet (week < 1). */
  needsGame?: boolean;
  /** i18n key for the desktop Kancil tip panel, and his mood there. */
  tip: string;
  mood?: KancilMood;
}

export const ROUTE_TABLE: RouteDef[] = [
  { pattern: '/', name: 'splash', component: Splash, tip: 'side.tip.splash', mood: 'smile' },
  { pattern: '/onboarding', name: 'onboarding', component: Onboarding, tip: 'side.tip.onboarding', mood: 'neutral' },
  { pattern: '/home', name: 'home', component: HomeScreen, statusBar: 'dark', needsGame: true, tip: 'side.tip.home', mood: 'smile' },
  { pattern: '/settings', name: 'settings', component: Settings, statusBar: 'light', tip: 'side.tip.settings', mood: 'neutral' },
  { pattern: '/sembang', name: 'sembang', component: ChatList, statusBar: 'light', needsGame: true, tip: 'side.tip.sembang', mood: 'neutral' },
  { pattern: '/sembang/:id', name: 'chat', component: ChatThread, statusBar: 'light', needsGame: true, tip: 'side.tip.chat', mood: 'worried' },
  { pattern: '/demo/:scene', name: 'demo', component: ComingSoon, statusBar: 'light', tip: 'side.tip.demo', mood: 'neutral' },
];

export const FALLBACK_PATH = '/home';

setRouteTable(ROUTE_TABLE);
