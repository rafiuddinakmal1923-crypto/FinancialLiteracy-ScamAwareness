import { Flag } from 'lucide-react';
import type { Family, Tactic } from '../engine/types';
import { useT } from '../shell/i18n';
import { TACTIC_ICON, useTactic } from './tactics';

export type CardState = 'locked' | 'new' | 'collected';

/**
 * Red Flag card: a red header with the tactic icon and a pennant, then the BM tactic name, the scam family and
 * (optionally) the short cue. Locked cards show a silhouette and "???"; new cards glow in kancil amber.
 */
export function CardTile({ tactic, family, cue, state = 'collected', className = '' }: {
  tactic: Tactic; family: Family; cue?: string; state?: CardState; className?: string;
}) {
  const t = useT();
  const tn = useTactic();
  const Icon = TACTIC_ICON[tactic];
  const locked = state === 'locked';
  const name = tn(tactic);
  return (
    <div
      role="img"
      aria-label={locked ? t('card.locked') : t('card.label', { tactic: name, family: t(`family.${family}`) })}
      className={`flex flex-col overflow-hidden rounded-2xl ${locked ? 'bg-indigo-soft' : 'bg-white'} shadow-[0_2px_8px_rgba(28,27,58,.08)] ${state === 'new' ? 'ring-2 ring-kancil shadow-[0_0_0_4px_rgba(244,163,64,.25),0_2px_8px_rgba(28,27,58,.08)]' : 'ring-1 ring-indigo-soft'} ${className}`}
    >
      <div aria-hidden="true" className={`relative flex h-16 items-center justify-center ${locked ? 'bg-ink-soft/15' : 'songket bg-danger'}`}>
        <span className={`flex h-11 w-11 items-center justify-center rounded-full ${locked ? 'bg-ink-soft/20 text-ink-soft/50' : 'bg-paper text-danger'}`}>
          <Icon size={24} strokeWidth={1.75} />
        </span>
        {!locked && <Flag size={18} strokeWidth={2} className="absolute right-2 top-2 fill-paper text-paper" />}
      </div>
      <div aria-hidden="true" className="flex flex-1 flex-col gap-0.5 px-2.5 pb-2.5 pt-2">
        <span className="font-display text-base font-bold leading-tight text-ink">{locked ? '???' : name}</span>
        {!locked && <span className="text-base leading-tight text-ink-soft">{t(`family.${family}`)}</span>}
        {!locked && cue && <span className="mt-1 line-clamp-2 text-base leading-tight text-ink">“{cue}”</span>}
      </div>
    </div>
  );
}
