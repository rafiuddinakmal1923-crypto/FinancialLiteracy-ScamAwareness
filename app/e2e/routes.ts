// Routes captured by screens.spec.ts. Later tasks append their screens here.
export interface ScreenRoute { path: string; name: string }

export const ROUTES: ScreenRoute[] = [
  { path: '/', name: 'splash' },
  { path: '/onboarding', name: 'onboarding' },
  { path: '/home', name: 'home' },
  { path: '/settings', name: 'settings' },
];
