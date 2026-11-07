import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Banknote, TrendingDown, TrendingUp, TriangleAlert } from 'lucide-react';
import { BALANCE } from '../../engine/balance';
import { LABUR_PRODUCTS, type LaburProduct } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { navigate, replaceRoute } from '../../shell/router';
import { tekananLevel } from '../../shell/StatusBar';
import { weekCosts } from '../../engine/week';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { formatMoney, formatSignedMoney } from '../../ui/format';
import { Kancil } from '../../ui/Kancil';
import { MeterBar } from '../../ui/MeterBar';
import { richT } from './rich';
import { afterIntroPath, canBeginWeek, loopState, nextStep, withBanner } from './loop';
import { loc, weekDef, WEEKS } from './weeks';

/**
 * Labur growth of each opened week, kept for this session so the card can be shown again after a trip to
 * Dompet. After a reload it is unknown and the Labur line is left out (everything else comes from the save).
 */
const growthByWeek = new Map<number, Record<LaburProduct, number>>();

/** Week tiles at the top of the card: weeks done, this week (ringed), weeks to come. */
function WeekTrack({ week }: { week: number }) {
  return (
    <div aria-hidden className="mt-3 flex gap-1">
      {Array.from({ length: BALANCE.semesterWeeks }, (_, i) => (
        <span
          key={i}
          className={`h-2 flex-1 rounded-full ${i < week - 1 ? 'bg-kancil' : i === week - 1 ? 'bg-paper' : 'bg-paper/20'}`}
        />
      ))}
    </div>
  );
}

function SemesterDone() {
  const t = useT();
  return (
    <div data-screen="minggu" className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-10 text-center">
      <Kancil mood="proud" size={140} decorative />
      <h1 className="font-display text-[28px] font-extrabold text-ink">{t('minggu.done.title')}</h1>
      <p className="text-base leading-snug text-ink">{t('minggu.done.body')}</p>
      <button
        type="button"
        onClick={() => navigate('/semester/rapor')}
        className="mt-3 min-h-12 w-full rounded-2xl bg-ink px-4 text-base font-semibold text-paper active:scale-[.98]"
      >
        {t('minggu.report')}
      </button>
      <button
        type="button"
        onClick={() => navigate('/home')}
        className="min-h-12 w-full rounded-2xl bg-white px-4 text-base font-semibold text-ink ring-1 ring-inset ring-ink/25 active:scale-[.98]"
      >
        {t('common.toHome')}
      </button>
    </div>
  );
}

/**
 * S04 week intro. Opening the route starts the next week once (beginWeek: income, costs, Labur growth,
 * desperation) unless an intro is already open. Labur moves are allowed in Dompet while it stays open.
 */
export function WeekIntro() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const week = useGame((s) => s.week);
  const open = useGame((s) => s.weekIntroOpen);
  const meters = useGame((s) => s.meters);
  const closeWeekIntro = useGame((s) => s.closeWeekIntro);
  const started = useRef(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    // StrictMode runs effects twice; the ref keeps this to one beginWeek per visit.
    if (started.current) return;
    started.current = true;
    const g = useGame.getState();
    if (g.weekIntroOpen || g.week >= BALANCE.semesterWeeks) return;
    if (!g.budget) { replaceRoute('/dompet'); return; }
    // R8 / D20: a week cannot start before the last scenario is finished (or while an aftermath is pending).
    if (!canBeginWeek(loopState(g))) { replaceRoute(nextStep(loopState(g))); return; }
    const def = WEEKS[g.week];
    if (!def) return;
    const summary = g.beginWeek(def);
    if (summary) {
      growthByWeek.set(def.week, summary.laburGrowth);
      setTick((n) => n + 1);
    }
  }, []);

  if (!open) {
    if (week >= BALANCE.semesterWeeks) return <SemesterDone />;
    return <div data-screen="minggu" className="flex-1 bg-indigo" />;
  }

  const def = weekDef(week);
  const costs = def ? weekCosts(def, useGame.getState().purchases) : [];
  const totalCosts = costs.reduce((s, c) => s + c.amount, 0);
  const income = (BALANCE.incomeWeeks as readonly number[]).includes(week) ? BALANCE.income : 0;
  const growth = growthByWeek.get(week);
  const laburDelta = growth ? LABUR_PRODUCTS.reduce((s, p) => s + growth[p], 0) : 0;
  const desperate = meters.tekanan >= BALANCE.desperation.cueAt;
  const level = tekananLevel(meters.tekanan);

  const teruskan = () => {
    closeWeekIntro();
    navigate(withBanner(afterIntroPath(week)));
  };

  return (
    <div data-screen="minggu" className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-indigo">
      <div className="songket px-5 pb-10 pt-4 text-paper">
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.25 }}>
          <div className="flex items-baseline gap-3">
            <h1 className="font-display text-[44px] font-extrabold leading-none">{t('minggu.title', { week })}</h1>
            <span className="text-base text-paper/80">{t('minggu.of', { total: BALANCE.semesterWeeks })}</span>
          </div>
          <WeekTrack week={week} />
          {def && <p className="mt-4 text-lg leading-snug">{loc(def.context, lang)}</p>}
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="-mt-5 flex flex-1 flex-col rounded-t-[24px] bg-paper px-4 pt-5 shadow-[0_-8px_24px_rgba(28,27,58,.12)]"
      >
        <h2 className="font-display text-xl font-bold text-ink">{t('minggu.costs')}</h2>
        <ul aria-label={t('minggu.costs')} className="mt-2 divide-y divide-indigo-soft rounded-2xl bg-white px-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
          {costs.map((c, i) => (
            <li key={i} className="flex min-h-12 items-center justify-between gap-3 py-2">
              <span className="text-base text-ink">{'labelKey' in c ? t(c.labelKey) : loc(c.label, lang)}</span>
              <span className="font-mono text-base font-semibold text-ink">{formatMoney(-c.amount)}</span>
            </li>
          ))}
        </ul>
        {costs.length > 1 && (
          <p className="mt-2 flex justify-between px-4 text-base text-ink-soft">
            <span>{t('dompet.split.total')}</span>
            <span className="font-mono font-semibold">{formatMoney(-totalCosts)}</span>
          </p>
        )}

        <div className="mt-3 flex flex-col gap-2">
          {income > 0 && (
            <p className="flex min-h-12 items-center gap-2 rounded-2xl bg-safe-soft px-4 text-base font-semibold text-ink">
              <Banknote aria-hidden size={22} strokeWidth={1.75} className="shrink-0 text-safe" />
              <span>{richT(t, 'minggu.income', { amount: formatSignedMoney(income) })}</span>
            </p>
          )}
          {laburDelta !== 0 && (
            <p className="flex min-h-12 items-center gap-2 rounded-2xl bg-indigo-soft px-4 text-base font-semibold text-ink">
              {laburDelta > 0
                ? <TrendingUp aria-hidden size={22} strokeWidth={1.75} className="shrink-0 text-safe" />
                : <TrendingDown aria-hidden size={22} strokeWidth={1.75} className="shrink-0 text-danger" />}
              <span>{richT(t, 'minggu.labur', { amount: formatSignedMoney(Math.round(laburDelta * 100) / 100) })}</span>
            </p>
          )}
          <p className="px-1 text-base font-semibold text-ink">{richT(t, 'minggu.duit', { amount: formatMoney(meters.duit) })}</p>
        </div>

        <MeterBar
          className="mt-4"
          label={t('meter.tekanan')}
          value={meters.tekanan}
          max={100}
          display={`${meters.tekanan} (${t(`status.tekanan.${level}`)})`}
          tone={level === 'low' ? 'safe' : level === 'mid' ? 'warning' : 'danger'}
        />
        {desperate && (
          <p role="note" className="mt-3 flex items-start gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-base leading-snug text-ink">
            <TriangleAlert aria-hidden size={22} strokeWidth={1.75} className="mt-0.5 shrink-0 text-danger" />
            {t('minggu.desperate')}
          </p>
        )}

        <div className="mt-auto flex items-end gap-2 pt-6">
          <Kancil mood={desperate ? 'worried' : 'neutral'} size={60} decorative className="shrink-0" />
          <p className="flex-1 rounded-[18px] rounded-bl-[4px] bg-kancil-soft px-4 py-3 text-base leading-snug text-ink">{t('minggu.tip')}</p>
        </div>

        <div className="sticky bottom-0 grid grid-cols-2 gap-2 bg-paper pb-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/dompet')}
            className="min-h-12 rounded-2xl bg-white px-3 text-base font-semibold text-ink ring-1 ring-inset ring-ink/25 active:scale-[.98]"
          >
            {t('minggu.dompet')}
          </button>
          <button
            type="button"
            onClick={teruskan}
            className="min-h-12 rounded-2xl bg-ink px-3 text-base font-semibold text-paper active:scale-[.98]"
          >
            {t('minggu.next')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
