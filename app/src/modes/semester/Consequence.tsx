import { useCallback, useEffect, useRef, useState } from 'react';
import { animate, motion } from 'framer-motion';
import { CircleQuestionMark, Flag, Lock, MessageCircle, Network, RotateCcw, Scale, ShieldCheck, ShieldX, TrendingDown, TrendingUp, Wallet, type LucideIcon } from 'lucide-react';
import { BALANCE } from '../../engine/balance';
import type { Outcome } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { ConsequenceTimeline } from '../../ui/ConsequenceTimeline';
import { formatRM } from '../../ui/format';
import { huntTactics } from './flagText';
import { consequenceBase, consequenceSteps, consequenceTone, useEnded } from './aftermath';
import { scenarioPath } from './loop';
import { MoneyChain } from './MoneyChain';

const HERO: Record<Outcome, { icon: LucideIcon; bg: string; badge: string; title: string }> = {
  scammed: { icon: ShieldX, bg: 'bg-danger-soft', badge: 'bg-danger text-paper', title: 'text-danger' },
  mule: { icon: Network, bg: 'bg-danger-soft', badge: 'bg-danger text-paper', title: 'text-danger' },
  frozen: { icon: Lock, bg: 'bg-danger-soft', badge: 'bg-danger text-paper', title: 'text-danger' },
  safe: { icon: ShieldCheck, bg: 'bg-safe-soft', badge: 'bg-safe text-paper', title: 'text-safe' },
  curiga: { icon: CircleQuestionMark, bg: 'bg-kancil-soft', badge: 'bg-kancil text-ink', title: 'text-ink' },
  // Finance outcomes (D23); their screens are designed in a later task.
  untung: { icon: TrendingUp, bg: 'bg-safe-soft', badge: 'bg-safe text-paper', title: 'text-safe' },
  rugi: { icon: TrendingDown, bg: 'bg-kancil-soft', badge: 'bg-kancil text-ink', title: 'text-ink' },
  hutang: { icon: Wallet, bg: 'bg-danger-soft', badge: 'bg-danger text-paper', title: 'text-danger' },
};

/** Hero colours for a variant with a softer tone (e.g. reported early): amber, not danger. */
const SOFT = { bg: 'bg-kancil-soft', badge: 'bg-kancil text-ink', title: 'text-ink' };

/** Counts from `from` to `to` once (ease-in-out); jumps straight there with reduced motion. */
function useCount(from: number, to: number): number {
  const reduced = useSettings((s) => s.reducedMotion);
  const [v, setV] = useState(reduced ? to : from);
  useEffect(() => {
    if (reduced || from === to) { setV(to); return; }
    const c = animate(from, to, { duration: BALANCE.aftermath.meterMs / 1000, ease: 'easeInOut', delay: 0.3, onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [from, to, reduced]);
  return v;
}

function MeterChange({ label, from, to, format, worse }: {
  label: string; from: number; to: number; format(n: number): string; worse: boolean;
}) {
  const t = useT();
  const v = useCount(from, to);
  const delta = to - from;
  return (
    <div
      role="group"
      aria-label={`${label}: ${t('akibat.from', { from: format(from), to: format(to) })}`}
      className="flex min-w-0 flex-1 flex-col rounded-2xl bg-white px-3 py-2 shadow-[0_2px_8px_rgba(28,27,58,.08)]"
    >
      <span aria-hidden="true" className="text-base font-medium text-ink-soft">{label}</span>
      <span aria-hidden="true" className="font-mono text-xl font-semibold text-ink">{format(v)}</span>
      {delta !== 0 && (
        <span aria-hidden="true" className={`mt-0.5 w-fit rounded-full px-2 font-mono text-base font-semibold ${worse ? 'bg-danger-soft text-danger' : 'bg-safe-soft text-safe'}`}>
          {delta > 0 ? '+' : '-'}{format(Math.abs(delta))}
        </span>
      )}
    </div>
  );
}

/**
 * Note after the timeline: the Penal Code after a mule (UI-SPEC S09, `legal.penalCode`) or where to get help after
 * a hutang outcome (`legal.akpk`). Both sentences are TODO-VERIFY.
 */
function LegalNote({ titleKey, bodyKey, noteKey = 'legal.unverified' }: { titleKey: string; bodyKey: string; noteKey?: string }) {
  const t = useT();
  const reduced = useSettings((s) => s.reducedMotion);
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    ref.current?.scrollIntoView?.({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
  }, [reduced]);
  return (
    <motion.aside
      ref={ref}
      role="note"
      aria-labelledby="legal-title"
      initial={{ opacity: 0, y: reduced ? 0 : 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.15 : 0.45, ease: 'easeInOut' }}
      className="mt-5 flex gap-3 rounded-2xl bg-indigo-soft p-4"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo text-paper">
        <Scale aria-hidden size={22} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 id="legal-title" className="font-display text-lg font-bold leading-tight text-ink">{t(titleKey)}</h3>
        <p className="mt-1 text-base font-medium leading-snug text-ink">{t(bodyKey)}</p>
        <p className="mt-1.5 text-base leading-snug text-ink-soft">{t(noteKey)}</p>
      </div>
    </motion.aside>
  );
}

/** S09: "Apa jadi seterusnya". The outcome, meter changes and a timeline; then the flag hunt or Cuba lagi. */
export function Consequence({ params }: { params: Record<string, string> }) {
  const id = params.id ?? '';
  const t = useT();
  const { ended, scenario, leave } = useEnded(id);
  const snapshot = useGame((s) => (s.active?.id === id ? s.active.snapshot : null));
  const meters = useGame((s) => s.meters);
  // Mule: the money chain plays first, then the timeline, then the Penal Code note.
  const [chainDone, setChainDone] = useState(false);
  const [timelineDone, setTimelineDone] = useState(false);
  const onChainDone = useCallback(() => setChainDone(true), []);
  const onTimelineDone = useCallback(() => setTimelineDone(true), []);
  const mule = ended?.outcome === 'mule';
  const hutang = ended?.outcome === 'hutang';
  if (!ended || !scenario) return null;

  const { outcome } = ended;
  const before = snapshot ?? meters;
  const amount = formatRM(Math.max(0, before.duit - meters.duit));
  const vars = {
    amount, balance: formatRM(meters.duit), missed: ended.missed !== undefined ? formatRM(ended.missed) : '{missed}',
    rekod: t(`rekod.${meters.rekod}`),
  };
  // A scenario may have its own copy for an outcome (sewa_akaun's early report) and a softer tone.
  const base = consequenceBase(t, id, outcome);
  const tone = consequenceTone(t, base, outcome);
  const steps = consequenceSteps(t, outcome, vars, base);
  const hero = tone === 'warning' && base !== `akibat.${outcome}` ? { ...HERO[outcome], ...SOFT } : HERO[outcome];
  const HeroIcon = hero.icon;
  const hasFlags = huntTactics(ended.transcript).length > 0;

  const retry = () => leave(() => {
    useGame.getState().retryScenario();
    navigate(scenarioPath(id));
  });
  const next = () => navigate(hasFlags ? `/semester/bendera/${id}` : `/semester/debrief/${id}`);

  return (
    <div data-screen="akibat" className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <section className={`${hero.bg} px-4 pb-5 pt-4`}>
          <div className="flex items-center gap-2 pr-16">
            <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${hero.badge}`}>
              <HeroIcon aria-hidden size={26} strokeWidth={1.75} />
            </span>
            <span className="flex min-w-0 items-center gap-1.5 text-base font-semibold text-ink-soft">
              <MessageCircle aria-hidden size={18} strokeWidth={1.75} className="shrink-0" />
              <span className="truncate">{scenario.meta.contact || scenario.meta.number}</span>
            </span>
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={`mt-3 text-balance font-display text-[28px] font-extrabold leading-[1.15] ${hero.title}`}
          >
            {t(`${base}.title`, vars)}
          </motion.h1>
          <p className="mt-1.5 text-base leading-snug text-ink">{t('akibat.lead')}</p>
          <div aria-label={t('akibat.changes')} role="group" className="mt-4 flex gap-2">
            <MeterChange label={t('meter.duit')} from={before.duit} to={meters.duit} format={formatRM} worse={meters.duit < before.duit && outcome !== 'untung'} />
            {before.tekanan !== meters.tekanan && (
              <MeterChange label={t('meter.tekanan')} from={before.tekanan} to={meters.tekanan} format={String} worse={meters.tekanan > before.tekanan} />
            )}
          </div>
        </section>

        {mule && (
          <section aria-label={t('moneyChain.title')} className="px-4 pt-5">
            <MoneyChain onDone={onChainDone} />
          </section>
        )}

        {(!mule || chainDone) && (
          <section className="px-4 pb-6 pt-5">
            <h2 className="mb-3 font-display text-xl font-bold text-ink">{t('akibat.timeline')}</h2>
            <ConsequenceTimeline steps={steps} tone={tone} label={t('akibat.timeline')} onDone={mule || hutang ? onTimelineDone : undefined} follow={mule} />
            {mule && timelineDone && <LegalNote titleKey="legal.title" bodyKey="legal.penalCode" />}
            {hutang && timelineDone && <LegalNote titleKey="legal.helpTitle" bodyKey="legal.akpk" noteKey="legal.helpUnverified" />}
          </section>
        )}
      </div>

      <div className="relative z-10 flex shrink-0 flex-col gap-2 rounded-t-[24px] bg-white px-3 pb-3 pt-3 shadow-[0_-8px_24px_rgba(28,27,58,.12)]">
        <button
          type="button"
          onClick={retry}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-base font-semibold text-ink ring-1 ring-ink/20 active:bg-indigo-soft"
        >
          <RotateCcw aria-hidden size={20} strokeWidth={1.75} />
          {t('akibat.retry')}
        </button>
        <button
          type="button"
          onClick={next}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-base font-semibold text-paper active:scale-[.98]"
        >
          <Flag aria-hidden size={20} strokeWidth={1.75} />
          {t(hasFlags ? 'akibat.collect' : 'akibat.toDebrief')}
        </button>
      </div>
    </div>
  );
}
