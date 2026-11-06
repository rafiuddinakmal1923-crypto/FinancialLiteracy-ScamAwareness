import { semester } from 'virtual:celik-content';
import type { Localized, WeekDef } from '../../engine/schemas';
import type { Lang } from '../../shell/i18n';

/** The 12 semester weeks from content/semester.json (index 0 = week 1). */
export const WEEKS: readonly WeekDef[] = semester?.weeks ?? [];

/** That week's content (1..12), or null. */
export function weekDef(week: number): WeekDef | null {
  return WEEKS[week - 1] ?? null;
}

/** Content text in the current language; EN falls back to MS. */
export function loc(l: Localized, lang: Lang): string {
  return (lang === 'en' ? l.en : undefined) ?? l.ms;
}
