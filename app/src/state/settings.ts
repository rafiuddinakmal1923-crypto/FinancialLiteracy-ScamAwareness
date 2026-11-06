import { create } from 'zustand';

export interface SettingsData { lang: 'ms' | 'en'; sound: boolean; reducedMotion: boolean; demo: boolean }

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function defaultSettings(): SettingsData {
  return { lang: 'ms', sound: true, reducedMotion: prefersReducedMotion(), demo: true };
}

interface SettingsActions {
  setLang(lang: 'ms' | 'en'): void;
  toggle(key: 'sound' | 'reducedMotion' | 'demo'): void;
  hydrate(d: SettingsData | null): void;
}

export const useSettings = create<SettingsData & SettingsActions>()((set) => ({
  ...defaultSettings(),
  setLang: (lang) => set({ lang }),
  toggle: (key) => set((s) => ({ [key]: !s[key] })),
  hydrate: (d) => set(d ? { ...defaultSettings(), ...d } : defaultSettings()),
}));

export function settingsData(s: SettingsData): SettingsData {
  return { lang: s.lang, sound: s.sound, reducedMotion: s.reducedMotion, demo: s.demo };
}
