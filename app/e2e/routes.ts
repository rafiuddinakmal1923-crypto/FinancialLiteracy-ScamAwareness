// Routes captured by screens.spec.ts. Later tasks append their screens here.
export interface ScreenRoute {
  path: string;
  name: string;
  /** Text to wait for before the screenshot (screens that build up over time, like a chat thread). */
  waitFor?: string;
}

export const ROUTES: ScreenRoute[] = [
  { path: '/', name: 'splash' },
  { path: '/onboarding', name: 'onboarding' },
  { path: '/home', name: 'home' },
  { path: '/settings', name: 'settings' },
  { path: '/sembang', name: 'sembang' },
  { path: '/sembang/kerja_sambilan', name: 'chat', waitFor: 'Minat! Macam mana nak mula?' },
];
