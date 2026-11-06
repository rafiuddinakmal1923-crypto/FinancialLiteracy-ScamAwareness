// Money cards of Cek Harian: BETUL / SALAH for true-false, two A / B tiles for "pick the better".
import type { MoneyCard } from '../../engine/schemas';
import { useT } from '../../shell/i18n';
import { PANEL, useConceptName, useLoc, Verdict } from './shared';

export type MoneyChoice = boolean | 0 | 1;

/** Front face: the question with a "Contoh sahaja" caption (any figure on a money card is an example). */
export function MoneyFront({ card }: { card: MoneyCard }) {
  const t = useT();
  const loc = useLoc();
  const concept = useConceptName();
  return (
    <div className="px-1 pb-3 pt-1">
      <div className={`${PANEL} flex min-h-[260px] flex-col gap-4 p-5`}>
        <p className="text-base font-semibold text-ink-soft">{t(`harian.q.${card.kind}`)}</p>
        <p className="font-display text-[22px] font-extrabold leading-snug text-ink">{loc(card.text)}</p>
        <div className="mt-auto flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-kancil-soft px-3 py-1 text-base font-semibold text-ink ring-1 ring-kancil/50">{concept(card.concept)}</span>
          <span className="text-base text-ink-soft">{t('harian.example')}</span>
        </div>
      </div>
    </div>
  );
}

/** What the right answer is, as words. */
export function moneyAnswerLabel(card: MoneyCard, t: (k: string, v?: Record<string, string | number>) => string, loc: (l: MoneyCard['text']) => string): string {
  if (card.kind === 'truefalse') return t(card.answer ? 'harian.true' : 'harian.false');
  return `${card.better === 0 ? 'A' : 'B'}: ${loc(card.options[card.better])}`;
}

export function MoneyBack({ card, right }: { card: MoneyCard; right: boolean }) {
  const t = useT();
  const loc = useLoc();
  return (
    <div className="px-1 pb-3 pt-1">
      <Verdict right={right} answer={moneyAnswerLabel(card, t, loc)} why={loc(card.why)} />
    </div>
  );
}

/** BETUL / SALAH buttons, or the A / B option tiles. */
export function MoneyButtons({ card, onAnswer, disabled }: { card: MoneyCard; onAnswer(c: MoneyChoice): void; disabled?: boolean }) {
  const t = useT();
  const loc = useLoc();
  if (card.kind === 'truefalse') {
    const base = 'flex min-h-14 items-center justify-center rounded-2xl border-2 border-indigo bg-white px-3 font-display text-xl font-extrabold text-indigo active:translate-y-px disabled:opacity-60';
    return (
      <div className="grid grid-cols-2 gap-3">
        <button type="button" disabled={disabled} onClick={() => onAnswer(true)} className={base}>{t('harian.true')}</button>
        <button type="button" disabled={disabled} onClick={() => onAnswer(false)} className={base}>{t('harian.false')}</button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2.5">
      {card.options.map((o, i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onClick={() => onAnswer(i as 0 | 1)}
          className="flex min-h-14 items-center gap-3 rounded-2xl border-2 border-indigo bg-white px-3 py-2 text-left active:translate-y-px disabled:opacity-60"
        >
          <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo font-display text-lg font-extrabold text-paper">{i === 0 ? 'A' : 'B'}</span>
          <span className="sr-only">{`${i === 0 ? 'A' : 'B'}: `}</span>
          <span className="text-lg font-semibold leading-snug text-ink">{loc(o)}</span>
        </button>
      ))}
    </div>
  );
}
