import type { Concept } from '../engine/types';
import { useT } from '../shell/i18n';
import { CONCEPT_ART } from './cardArt';

/** First sentence of a text (the one-line "apa" on a Kad Ilmu tile). */
export function firstSentence(s: string): string {
  const m = /^.*?[.!?](?=\s|$)/s.exec(s.trim());
  return (m ? m[0] : s).trim();
}

/**
 * Kad Ilmu tile (S11): kancil amber frame, the concept picture, its BM name and a one-line "apa". Locked tiles are a
 * grey silhouette of the picture with "???". Tapping an earned tile opens its card (the parent handles the tap).
 */
export function KadTile({ concept, name, apa, locked = false, className = '' }: {
  concept: Concept; name: string; apa?: string; locked?: boolean; className?: string;
}) {
  const t = useT();
  return (
    <div
      role="img"
      aria-label={locked ? t('kad.ilmu.locked') : t('kad.ilmu.label', { name })}
      className={`flex h-full flex-col overflow-hidden rounded-2xl border-[3px] ${locked ? 'border-ink-soft/25 bg-indigo-soft' : 'border-kancil bg-kancil-soft'} ${className}`}
    >
      <div aria-hidden="true" className="flex h-20 items-center justify-center">
        <img
          src={CONCEPT_ART[concept]} alt="" width={56} height={56} draggable={false}
          className={locked ? 'h-14 w-14 opacity-30 brightness-0' : 'h-14 w-14'}
        />
      </div>
      <div aria-hidden="true" className="flex flex-1 flex-col gap-1 px-3 pb-3">
        <span className="font-display text-base font-bold leading-tight text-ink">{locked ? '???' : name}</span>
        {!locked && apa && <span className="line-clamp-4 text-base leading-snug text-ink-soft">{apa}</span>}
      </div>
    </div>
  );
}
