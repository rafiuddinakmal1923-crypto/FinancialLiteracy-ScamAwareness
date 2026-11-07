import { useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowLeft, CalendarClock, CircleCheck, Telescope } from 'lucide-react';
import { BALANCE } from '../../engine/balance';
import { netWorth } from '../../engine/meters';
import { weekCosts, type BudgetSplit } from '../../engine/week';
import { FINALIST } from '../../shell/features';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useSettings } from '../../state/settings';
import { useGame } from '../../state/game';
import { formatMoney } from '../../ui/format';
import { Kancil } from '../../ui/Kancil';
import { MeterBar } from '../../ui/MeterBar';
import { GoalBar } from '../matlamat/GoalBar';
import { GoalPicker } from '../matlamat/GoalPicker';
import { LaburPot } from './LaburPot';
import { richT } from './rich';
import { DEFAULT_SPLIT, rebalance, SPLIT_KEYS, SPLIT_STEP, SUGGESTED_SPLIT, type SplitKey } from './split';
import { loc, weekDef } from './weeks';

/** Pot colours: the donut, slider fills and the split bar share them; every pot is also named in text. */
export const POT_COLOR: Record<SplitKey, string> = {
  needs: 'var(--color-indigo)', wants: 'var(--color-kancil)', savings: 'var(--color-safe)',
};
const POT_KEY: Record<SplitKey, string> = { needs: 'dompet.pot.needs', wants: 'dompet.pot.wants', savings: 'dompet.pot.savings' };

/**
 * Mesin Masa (S19). Lihat 10 tahun lagi opens it with the Kalkulator's default saving (RM50 a month, 19 to 30):
 * Dompet has no monthly income to derive a saving from (Simpanan is a balance, not a monthly amount).
 */
export const MESIN_MASA_PATH = '/kalkulator/masa';

function Header({ children }: { children?: ReactNode }) {
  const t = useT();
  const introOpen = useGame((s) => s.weekIntroOpen);
  return (
    <div className="songket bg-indigo px-4 pb-6 text-paper">
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={t('common.back')}
          onClick={() => navigate(introOpen ? '/semester/minggu' : '/home')}
          className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full"
        >
          <ArrowLeft aria-hidden size={24} strokeWidth={1.75} />
        </button>
        <h1 className="font-display text-2xl font-bold">{t('app.dompet')}</h1>
      </div>
      {children}
    </div>
  );
}

/** Hand-drawn donut: one arc per pot, small gaps between them; the total sits in the middle. */
function Donut({ split, total }: { split: BudgetSplit; total: number }) {
  const t = useT();
  const r = 46;
  const c = 2 * Math.PI * r;
  const gap = 1.6;
  let offset = 0;
  const arcs = SPLIT_KEYS.map((k) => {
    const len = (split[k] / 100) * c;
    const arc = { k, len, offset };
    offset += len;
    return arc;
  });
  const shown = arcs.filter((a) => a.len > 0).length;
  return (
    <div className="relative mx-auto h-[160px] w-[160px]">
      <svg viewBox="0 0 120 120" role="img" aria-label={t('dompet.split.donut', { ...split })} className="h-full w-full -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-indigo-soft)" strokeWidth="18" />
        {arcs.map(({ k, len, offset: o }) => len > 0 && (
          <circle
            key={k}
            cx="60" cy="60" r={r} fill="none" stroke={POT_COLOR[k]} strokeWidth="18"
            strokeDasharray={`${Math.max(0.01, len - (shown > 1 ? gap : 0))} ${c}`}
            strokeDashoffset={-o}
            className="transition-[stroke-dasharray,stroke-dashoffset] duration-200"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-base text-ink-soft">{t('dompet.split.total')}</span>
        <span className="font-mono text-xl font-semibold text-ink">{formatMoney(total)}</span>
      </div>
    </div>
  );
}

function SliderRow({ k, value, total, onChange }: { k: SplitKey; value: number; total: number; onChange: (v: number) => void }) {
  const t = useT();
  const id = `split-${k}`;
  const rm = formatMoney((total * value) / 100);
  return (
    <div className="py-1.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <label htmlFor={id} className="flex items-center gap-2 text-base font-semibold text-ink">
            <span aria-hidden className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: POT_COLOR[k] }} />
            {t(POT_KEY[k])}
          </label>
          <p id={`${id}-hint`} className="pl-[22px] text-base leading-tight text-ink-soft">{t(`${POT_KEY[k]}.hint`)}</p>
        </div>
        <p className="shrink-0 text-right leading-tight">
          <span className="block font-mono text-xl font-semibold text-ink">{value}%</span>
          <span className="block font-mono text-base font-semibold text-ink-soft">{rm}</span>
        </p>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={100}
        step={SPLIT_STEP}
        value={value}
        aria-describedby={`${id}-hint`}
        aria-valuetext={`${value}%, ${rm}`}
        onChange={(e) => onChange(Number(e.target.value))}
        className="budget-range mt-0.5"
        style={{ '--fill': POT_COLOR[k], '--pct': `${value}%` } as CSSProperties}
      />
    </div>
  );
}

/** S12 week 0: the Needs / Wants / Savings split. */
function SplitView() {
  const t = useT();
  const duit = useGame((s) => s.meters.duit);
  const setBudget = useGame((s) => s.setBudget);
  const [split, setSplit] = useState<BudgetSplit>(DEFAULT_SPLIT);
  const suggested = SPLIT_KEYS.every((k) => split[k] === SUGGESTED_SPLIT[k]);
  return (
    <div data-screen="dompet-bajet" className="flex flex-1 flex-col">
      <Header>
        <h2 className="mt-2 font-display text-[22px] font-extrabold leading-tight">{t('dompet.split.title')}</h2>
        <p className="mt-1 text-base leading-snug text-paper/90">{richT(t, 'dompet.split.body', { duit: formatMoney(duit) })}</p>
      </Header>

      <section aria-label={t('dompet.suggest.title')} className="relative z-10 mx-4 -mt-3 flex items-start gap-3 rounded-2xl bg-kancil-soft p-3 pl-2 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
        <Kancil mood="smile" size={56} decorative className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-bold text-ink">{t('dompet.suggest.title')}</p>
          <p className="text-base leading-snug text-ink">{t('dompet.suggest.body')}</p>
          <button
            type="button"
            onClick={() => setSplit({ ...SUGGESTED_SPLIT })}
            aria-pressed={suggested}
            className={`mt-2 min-h-12 rounded-full px-4 text-base font-semibold ring-1 ring-inset transition-colors duration-150 active:scale-[.98] ${
              suggested ? 'bg-kancil text-ink ring-kancil' : 'bg-white text-ink ring-kancil/60'
            }`}
          >
            {t('dompet.suggest.apply')}
          </button>
        </div>
      </section>

      <section className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
        <Donut split={split} total={duit} />
        <div role="group" aria-label={t('dompet.split.group')} className="mt-3 divide-y divide-indigo-soft">
          {SPLIT_KEYS.map((k) => (
            <SliderRow key={k} k={k} value={split[k]} total={duit} onChange={(v) => setSplit((s) => rebalance(s, k, v))} />
          ))}
        </div>
      </section>

      <div className="sticky bottom-0 z-10 mt-auto bg-paper/95 px-4 pb-4 pt-3">
        <button
          type="button"
          onClick={() => setBudget(split)}
          className="min-h-12 w-full rounded-2xl bg-ink px-4 text-base font-semibold text-paper active:scale-[.98]"
        >
          {t('dompet.split.confirm')}
        </button>
      </div>
    </div>
  );
}

/** A jar that fills toward the emergency target; the line marks the target. Decorative (the bar carries the value). */
function Jar({ fill }: { fill: number }) {
  const h = 46 * Math.max(0, Math.min(1, fill));
  return (
    <svg aria-hidden viewBox="0 0 56 72" className="h-[72px] w-14 shrink-0">
      <defs>
        <clipPath id="jar-body"><path d="M10 20 Q6 22 6 30 V62 Q6 68 12 68 H44 Q50 68 50 62 V30 Q50 22 46 20 Z" /></clipPath>
      </defs>
      <rect x="14" y="8" width="28" height="9" rx="3" fill="var(--color-kancil)" />
      <g clipPath="url(#jar-body)">
        <rect x="0" y="0" width="56" height="72" fill="var(--color-safe-soft)" />
        <rect x="0" y={68 - h} width="56" height={h} fill="var(--color-safe)" className="transition-[y,height] duration-300" />
      </g>
      <path d="M10 20 Q6 22 6 30 V62 Q6 68 12 68 H44 Q50 68 50 62 V30 Q50 22 46 20 Z" fill="none" stroke="var(--color-ink)" strokeWidth="2" />
      <path d="M12 17 H44 V20 H12 Z" fill="var(--color-ink)" />
      <line x1="6" x2="50" y1="22" y2="22" stroke="var(--color-ink)" strokeWidth="1.5" strokeDasharray="3 3" opacity=".5" />
    </svg>
  );
}

/** Weekly saving (D46): at a week intro, money moves in or out of Simpanan. Duit stays the same. */
function SaveButtons() {
  const t = useT();
  const open = useGame((s) => s.weekIntroOpen);
  const simpanan = useGame((s) => s.meters.simpanan);
  const duit = useGame((s) => s.meters.duit);
  const moveSimpanan = useGame((s) => s.moveSimpanan);
  if (!open) return null;
  const step = BALANCE.finance.simpananStep;
  const amount = formatMoney(step);
  const cls = 'min-h-12 rounded-2xl px-2 text-base font-semibold active:scale-[.98] disabled:opacity-50';
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <button type="button" disabled={simpanan < step} onClick={() => moveSimpanan(-step)} className={`${cls} bg-white text-ink ring-1 ring-inset ring-ink/25`}>
        {t('dompet.save.out', { amount })}
      </button>
      <button type="button" disabled={simpanan + step > duit} onClick={() => moveSimpanan(step)} className={`${cls} bg-ink text-paper`}>
        {t('dompet.save.in', { amount })}
      </button>
    </div>
  );
}

function EmergencyFund() {
  const t = useT();
  const simpanan = useGame((s) => s.meters.simpanan);
  const target = BALANCE.finance.emergencyTarget;
  const full = simpanan >= target;
  const text = t('dompet.emergency', { have: formatMoney(simpanan), target: formatMoney(target) });
  return (
    <section aria-label={t('dompet.emergency.label')} className="relative z-10 mx-4 -mt-3 rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
      <div className="flex items-center gap-3">
        <Jar fill={simpanan / target} />
        <div className="min-w-0 flex-1">
          <p className="text-base text-ink-soft">{t('meter.simpanan')}</p>
          <p className="font-mono text-2xl font-semibold text-ink">{formatMoney(simpanan)}</p>
        </div>
      </div>
      <MeterBar
        className="mt-3"
        label={t('dompet.emergency.label')}
        value={Math.min(simpanan, target)}
        max={target}
        display={text}
        tone={full ? 'safe' : 'kancil'}
        heading={
          <div className="flex items-center justify-between gap-2">
            <p className="text-base font-semibold text-ink">{text}</p>
            {full && (
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-safe-soft px-2.5 py-0.5 text-base font-semibold text-safe">
                <CircleCheck aria-hidden size={18} strokeWidth={2} />
                {t('dompet.emergency.full')}
              </span>
            )}
          </div>
        }
      />
      <p className="mt-2 text-base leading-snug text-ink-soft">
        {full ? t('dompet.emergency.done') : t('dompet.emergency.short', { amount: formatMoney(target - simpanan) })}
      </p>
      {FINALIST && <SaveButtons />}
    </section>
  );
}

function BudgetBar({ split }: { split: BudgetSplit }) {
  const t = useT();
  return (
    <section aria-label={t('dompet.budget')} className="mx-4 mt-4">
      <h2 className="font-display text-xl font-bold text-ink">{t('dompet.budget')}</h2>
      <div aria-hidden className="mt-2 flex h-3 gap-0.5 overflow-hidden rounded-full">
        {SPLIT_KEYS.map((k) => split[k] > 0 && <span key={k} style={{ width: `${split[k]}%`, background: POT_COLOR[k] }} />)}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {SPLIT_KEYS.map((k) => (
          <li key={k} className="flex items-center gap-1.5 text-base text-ink">
            <span aria-hidden className="h-3 w-3 rounded-full" style={{ background: POT_COLOR[k] }} />
            {t(POT_KEY[k])} <span className="font-mono font-semibold">{split[k]}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function WeekCosts({ week }: { week: number }) {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const def = weekDef(week);
  const costs = def ? weekCosts(def, useGame.getState().purchases) : [];
  if (costs.length === 0) return null;
  return (
    <section aria-label={t('dompet.costs', { week })} className="mx-4 mt-5">
      <h2 className="font-display text-xl font-bold text-ink">{t('dompet.costs', { week })}</h2>
      <ul className="mt-2 divide-y divide-indigo-soft rounded-2xl bg-white px-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
        {costs.map((c, i) => (
          <li key={i} className="flex min-h-12 items-center gap-3 py-2">
            <CircleCheck aria-hidden size={22} strokeWidth={1.75} className="shrink-0 text-safe" />
            <span className="flex-1 text-base text-ink">
              {'labelKey' in c ? t(c.labelKey) : loc(c.label, lang)}
              <span className="sr-only">, {t('dompet.costs.paid')}</span>
            </span>
            <span className="font-mono text-base font-semibold text-ink">{formatMoney(-c.amount)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** S12 weekly view: net worth, emergency fund jar, this week's costs, the Labur pot and Mesin Masa. */
function WeeklyView({ split }: { split: BudgetSplit }) {
  const t = useT();
  const meters = useGame((s) => s.meters);
  const week = useGame((s) => s.week);
  const introOpen = useGame((s) => s.weekIntroOpen);
  const labur = meters.labur.amanah + meters.labur.ekuiti;
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const openFuture = () => navigate(MESIN_MASA_PATH);
  return (
    <div ref={setRoot} data-screen="dompet" className="relative flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-6">
        <Header>
          <p className="mt-2">
            <span className="block font-display text-[26px] font-extrabold leading-tight">
              {richT(t, 'dompet.netWorth', { total: formatMoney(netWorth(meters)) }, 'font-mono font-semibold')}
            </span>{' '}
            <span className="mt-0.5 block text-base text-paper/90">
              {richT(t, 'dompet.netWorthParts', { duit: formatMoney(meters.duit), labur: formatMoney(labur) })}
            </span>
          </p>
        </Header>

        {introOpen && (
          <p className="relative z-20 mx-4 -mt-3 mb-5 flex items-center gap-2 rounded-2xl bg-kancil px-4 py-2.5 text-base font-semibold text-ink shadow-[0_2px_8px_rgba(28,27,58,.08)]">
            <CalendarClock aria-hidden size={22} strokeWidth={1.75} className="shrink-0" />
            {t('dompet.intro', { week })}
          </p>
        )}

        {FINALIST && <GoalPicker />}
        {FINALIST && <GoalBar />}
        <EmergencyFund />
        <BudgetBar split={split} />
        <WeekCosts week={week} />
        <LaburPot className="mx-4 mt-5" sheetHost={root} />

        <div className="mx-4 mt-5">
          <button
            type="button"
            onClick={openFuture}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-base font-semibold text-indigo ring-1 ring-inset ring-indigo/30 active:scale-[.98]"
          >
            <Telescope aria-hidden size={22} strokeWidth={1.75} />
            {t('dompet.future')}
          </button>
        </div>
      </div>
    </div>
  );
}

/** S12 Dompet: the week-0 budget split until a budget is set, then the weekly view. */
export function Dompet() {
  const budget = useGame((s) => s.budget);
  return budget ? <WeeklyView split={budget} /> : <SplitView />;
}
