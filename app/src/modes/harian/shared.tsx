// Pieces shared by Cek Harian and Sahih atau Scam: localized text, the flip card, the verdict panel, the header.
import { useCallback, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CircleCheck, CircleX } from 'lucide-react';
import { concepts } from 'virtual:celik-content';
import type { Localized } from '../../engine/schemas';
import type { Concept } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useSettings } from '../../state/settings';
import { useTactic } from '../../ui/tactics';
import type { Tactic } from '../../engine/types';

/** Reads a Localized string in the current language (EN falls back to BM). */
export function useLoc(): (l: Localized) => string {
  const lang = useSettings((s) => s.lang);
  return useCallback((l: Localized) => (lang === 'en' ? l.en : undefined) ?? l.ms, [lang]);
}

/** BM/EN name of a concept (the code when content is missing). */
export function useConceptName(): (code: Concept) => string {
  const loc = useLoc();
  return useCallback((code: Concept) => {
    const c = concepts?.find((x) => x.code === code);
    return c ? loc(c.name) : code;
  }, [loc]);
}

export function useReducedMotion(): boolean {
  return useSettings((s) => s.reducedMotion);
}

export const PANEL = 'rounded-[28px] bg-white shadow-[0_8px_24px_rgba(28,27,58,.14)] ring-1 ring-indigo-soft';

/**
 * A card with a front and, once `flipped`, a back (the reason). The back is only rendered after the flip so the
 * reason is not in the page before the answer. Reduced motion swaps faces with a short fade instead of turning.
 */
export function FlipCard({ flipped, front, back, className = '' }: {
  flipped: boolean; front: ReactNode; back: ReactNode; className?: string;
}) {
  const reduced = useReducedMotion();
  if (reduced) {
    return (
      <div className={`grid ${className}`}>
        <div className={`[grid-area:1/1] transition-opacity duration-150 ${flipped ? 'pointer-events-none opacity-0' : 'opacity-100'}`} aria-hidden={flipped}>{front}</div>
        {flipped && <div className="animate-[fade-in_150ms_ease-out] [grid-area:1/1]">{back}</div>}
      </div>
    );
  }
  return (
    <div className={`[perspective:1200px] ${className}`}>
      <motion.div
        className="grid [transform-style:preserve-3d]"
        initial={false}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
      >
        <div className={`[backface-visibility:hidden] [grid-area:1/1] ${flipped ? 'pointer-events-none' : ''}`} aria-hidden={flipped}>{front}</div>
        {flipped && <div className="[backface-visibility:hidden] [grid-area:1/1] [transform:rotateY(180deg)]">{back}</div>}
      </motion.div>
    </div>
  );
}

/** The back of a card: right or wrong marked with an icon and a word, the answer, the one-line reason, tactic chips. */
export function Verdict({ right, answer, why, tactics = [], tag }: {
  right: boolean; answer: string; why: string; tactics?: Tactic[]; tag?: ReactNode;
}) {
  const t = useT();
  const tactic = useTactic();
  const Icon = right ? CircleCheck : CircleX;
  return (
    <div
      data-verdict={right ? 'right' : 'wrong'}
      className={`flex h-full flex-col gap-3 rounded-[28px] p-5 shadow-[0_8px_24px_rgba(28,27,58,.14)] ring-2 ${right ? 'bg-safe-soft ring-safe' : 'bg-danger-soft ring-danger'}`}
    >
      <p className="flex items-center gap-2 font-display text-2xl font-extrabold text-ink">
        <Icon aria-hidden size={30} strokeWidth={2.25} className={right ? 'text-safe' : 'text-danger'} />
        {t(right ? 'harian.right' : 'harian.wrong')}
      </p>
      <p className="text-base font-semibold text-ink">{t('harian.answerIs', { answer })}</p>
      <p className="text-lg leading-snug text-ink">{why}</p>
      {tactics.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {tactics.map((k) => (
            <li key={k} className="rounded-full bg-white px-3 py-1 text-base font-semibold text-ink ring-1 ring-ink/15">{tactic(k)}</li>
          ))}
        </ul>
      )}
      {tag}
    </div>
  );
}

/** Indigo songket header with a back arrow, shared by both games. */
export function GameHeader({ title, children, backTo = '/home' }: { title: string; children?: ReactNode; backTo?: string }) {
  const t = useT();
  return (
    <div className="songket shrink-0 bg-indigo px-4 pb-3 text-paper">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={t('common.back')}
          onClick={() => navigate(backTo)}
          className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full"
        >
          <ArrowLeft aria-hidden size={24} strokeWidth={1.75} />
        </button>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
      </div>
      {children}
    </div>
  );
}

/** Friendly stop when the card content is not there (Kad belum tersedia). */
export function Unavailable({ title }: { title: string }) {
  const t = useT();
  return (
    <div data-screen="harian-unavailable" className="flex min-h-0 flex-1 flex-col">
      <GameHeader title={title} />
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
        <h2 className="font-display text-2xl font-extrabold text-ink">{t('harian.unavailable')}</h2>
        <p className="text-lg text-ink-soft">{t('harian.unavailable.sub')}</p>
      </div>
    </div>
  );
}

export const BTN_PRIMARY =
  'flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-indigo px-4 font-display text-lg font-extrabold text-paper shadow-[0_3px_0_rgba(28,27,58,.35)] active:translate-y-px active:shadow-[0_2px_0_rgba(28,27,58,.35)]';
export const BTN_SECONDARY =
  'flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 font-display text-lg font-extrabold text-indigo ring-2 ring-indigo active:translate-y-px';
