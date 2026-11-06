// Tactic names, cues and tips from content/tactics.json, plus one lucide icon per tactic.
import { useCallback } from 'react';
import { BadgeDollarSign, EyeOff, HandCoins, Hourglass, Landmark, Siren, Users, type LucideIcon } from 'lucide-react';
import { tactics } from 'virtual:celik-content';
import type { TacticInfo } from '../engine/schemas';
import type { Tactic } from '../engine/types';
import { useSettings } from '../state/settings';

export const TACTIC_ICON: Record<Tactic, LucideIcon> = {
  greed: BadgeDollarSign,
  urgency: Hourglass,
  authority: Landmark,
  fear: Siren,
  secrecy: EyeOff,
  social: Users,
  payfirst: HandCoins,
};

type Field = 'name' | 'does' | 'cue' | 'tip';

/** Reads one field of a tactic in the current language (EN falls back to BM; the code when content is missing). */
export function useTactic(): (code: Tactic, field?: Field) => string {
  const lang = useSettings((s) => s.lang);
  return useCallback((code: Tactic, field: Field = 'name') => {
    const info: TacticInfo | undefined = tactics?.find((x) => x.code === code);
    if (!info) return code;
    const v = info[field];
    return (lang === 'en' ? v.en : undefined) ?? v.ms;
  }, [lang]);
}
