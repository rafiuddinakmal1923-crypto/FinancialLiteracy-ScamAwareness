// Flat dotted keys; `{var}` interpolation; EN falls back to MS, MS falls back to the key itself.
import { useCallback } from 'react';
import { useSettings } from '../../state/settings';
import ms from './ms.json';
import en from './en.json';

export type Lang = 'ms' | 'en';
export type Vars = Record<string, string | number>;

type Dict = Record<string, unknown>;

/** Merges per-mode dictionaries (each feature's i18n.ms.json / i18n.en.json) under a main one; main keys win. */
export function mergeDicts(main: Dict, parts: Dict[]): Dict {
  return Object.assign({}, ...parts, main) as Dict;
}

const parts = (modules: Record<string, { default: Dict }>): Dict[] => Object.values(modules).map((m) => m.default);

export const DICTS: Record<Lang, Dict> = {
  ms: mergeDicts(ms, parts(import.meta.glob<{ default: Dict }>('../../modes/*/i18n.ms.json', { eager: true }))),
  en: mergeDicts(en, parts(import.meta.glob<{ default: Dict }>('../../modes/*/i18n.en.json', { eager: true }))),
};

function lookup(lang: Lang, key: string): string {
  const v = DICTS[lang][key] ?? DICTS.ms[key];
  return typeof v === 'string' ? v : key;
}

export function translate(lang: Lang, key: string, vars?: Vars): string {
  const s = lookup(lang, key);
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

/** Translates with the current language (non-reactive; use useT() in components). */
export function t(key: string, vars?: Vars): string {
  return translate(useSettings.getState().lang, key, vars);
}

/** Like t(), but re-renders the component when the language changes. */
export function useT(): (key: string, vars?: Vars) => string {
  const lang = useSettings((s) => s.lang);
  return useCallback((key: string, vars?: Vars) => translate(lang, key, vars), [lang]);
}
