import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Info, Lock, Minus, Plus } from 'lucide-react';
import { BALANCE } from '../../engine/balance';
import type { LaburProduct } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { useGame } from '../../state/game';
import { CoachSheet } from '../../ui/CoachSheet';
import { formatMoney } from '../../ui/format';
import { toast } from '../../ui/Toast';

/** Labur amount stepper: RM10 steps, never below RM10. */
export const LABUR_STEP = 10;
export const LABUR_DEFAULT = 100;

/** Dana Ekuiti Cempaka's illustrative price index (100 at the start) after each week up to `week`. */
export function ekuitiIndex(week: number): number[] {
  const out = [100];
  const path = BALANCE.finance.ekuitiPath;
  for (let w = 1; w <= Math.min(week, path.length); w++) out.push(out[w - 1]! * (1 + path[w - 1]! / 100));
  return out;
}

const pct = (p: number) => `${p > 0 ? '+' : ''}${p.toLocaleString('en-MY', { maximumFractionDigits: 1 })}`;

const CHART_W = 240;
const CHART_H = 56;

/**
 * A product's price line over the semester so far (index 100 at the start). Both products share the x span (all
 * 12 weeks) and the y scale, so the steady fund reads flat beside the equity fund's ups and downs. The dashed line
 * is the starting price; the dot is this week.
 */
function PriceLine({ values, label }: { values: number[]; label?: string }) {
  const weeks = BALANCE.finance.ekuitiPath.length;
  const all = ekuitiIndex(weeks);
  const lo = Math.min(...all) - 1;
  const hi = Math.max(...all) + 1;
  const x = (i: number) => 6 + (i / weeks) * (CHART_W - 12);
  const y = (v: number) => 6 + ((hi - v) / (hi - lo)) * (CHART_H - 12);
  const pts = values.length > 1 ? values : [values[0] ?? 100, values[0] ?? 100];
  const line = pts.map((v, i) => `${x(values.length > 1 ? i : i * 0.25)},${y(v)}`).join(' ');
  const lastI = values.length > 1 ? values.length - 1 : 0.25;
  const last = pts[pts.length - 1]!;
  return (
    <svg
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      className="mt-2 h-14 w-full"
      preserveAspectRatio="none"
    >
      <line x1="0" x2={CHART_W} y1={y(100)} y2={y(100)} stroke="var(--color-ink-soft)" strokeWidth="1" strokeDasharray="4 4" opacity=".45" vectorEffect="non-scaling-stroke" />
      <polyline points={line} fill="none" stroke="var(--color-indigo)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={x(lastI)} cy={y(last)} r="4.5" fill="var(--color-kancil)" stroke="var(--color-indigo)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Dana Ekuiti Cempaka's illustrative price so far. */
function Sparkline({ week }: { week: number }) {
  const t = useT();
  const weeks = BALANCE.finance.ekuitiPath.length;
  const pts = ekuitiIndex(week);
  const now = pts[pts.length - 1]!.toLocaleString('en-MY', { maximumFractionDigits: 1 });
  return <PriceLine values={pts} label={t('labur.ekuiti.chart', { now, week: Math.max(0, Math.min(week, weeks)) })} />;
}

/** Amanah Cempaka: a fixed price, so its line stays flat. Decorative (the text says so). */
function FlatLine({ week }: { week: number }) {
  const n = Math.max(0, Math.min(week, BALANCE.finance.ekuitiPath.length));
  return <PriceLine values={Array.from({ length: n + 1 }, () => 100)} />;
}

function Product({ product, children, open, onMove }: {
  product: LaburProduct; children: ReactNode; open: boolean; onMove: (p: LaburProduct, dir: 1 | -1) => void;
}) {
  const t = useT();
  const id = useId();
  const balance = useGame((s) => s.meters.labur[product]);
  return (
    <article aria-labelledby={id} className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
      <div className="flex items-start justify-between gap-3">
        <h3 id={id} className="font-display text-base font-bold leading-tight text-ink">{t(`labur.${product}.name`)}</h3>
        <p className="shrink-0 text-right leading-tight">
          <span className="sr-only">{t('labur.balance')} </span>
          <span className="font-mono text-xl font-semibold text-ink">{formatMoney(balance)}</span>
        </p>
      </div>
      {children}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!open}
          onClick={() => onMove(product, 1)}
          className="min-h-12 rounded-2xl bg-ink px-3 text-base font-semibold text-paper active:scale-[.98] disabled:bg-indigo-soft disabled:text-ink-soft disabled:active:scale-100"
        >
          {t('labur.in')}
        </button>
        <button
          type="button"
          disabled={!open}
          onClick={() => onMove(product, -1)}
          className="min-h-12 rounded-2xl bg-white px-3 text-base font-semibold text-ink ring-1 ring-inset ring-ink/25 active:scale-[.98] disabled:text-ink-soft disabled:ring-indigo-soft disabled:active:scale-100"
        >
          {t('labur.out')}
        </button>
      </div>
    </article>
  );
}

/** "Dana kecemasan dulu" (D22): asked before money goes into Labur while Simpanan is under the target. */
function EmergencyCheck({ onGo, onCancel }: { onGo: () => void; onCancel: () => void }) {
  const t = useT();
  const simpanan = useGame((s) => s.meters.simpanan);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const title = t('labur.coach.title');
  useEffect(() => {
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="absolute inset-0 z-30 flex flex-col justify-end bg-ink/40">
      <CoachSheet
        mood="worried"
        tone="warning"
        title={title}
        text={t('labur.coach.text', { have: formatMoney(simpanan), target: formatMoney(BALANCE.finance.emergencyTarget) })}
      >
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onGo}
            className="min-h-12 rounded-2xl bg-white px-3 text-base font-semibold text-ink ring-1 ring-inset ring-ink/25 active:scale-[.98]"
          >
            {t('labur.coach.go')}
          </button>
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="min-h-12 rounded-2xl bg-ink px-3 text-base font-semibold text-paper active:scale-[.98]"
          >
            {t('labur.coach.cancel')}
          </button>
        </div>
      </CoachSheet>
    </div>
  );
}

/**
 * S12 Labur pot (D22): two fictional products. Money moves in or out only while a week intro is open; moving in
 * while Simpanan is under the emergency target asks first. `sheetHost` is where the confirmation sheet is drawn
 * (the screen's root, so it covers the whole phone screen rather than the scrolled card).
 */
export function LaburPot({ className = '', sheetHost }: { className?: string; sheetHost?: HTMLElement | null }) {
  const t = useT();
  const headingId = useId();
  const open = useGame((s) => s.weekIntroOpen);
  const week = useGame((s) => s.week);
  const moveLabur = useGame((s) => s.moveLabur);
  const [amount, setAmount] = useState(LABUR_DEFAULT);
  const [pending, setPending] = useState<LaburProduct | null>(null);

  const name = (p: LaburProduct) => t(`labur.${p}.name`);

  const move = (p: LaburProduct, delta: number) => {
    const r = moveLabur(p, delta);
    if ('error' in r) {
      const msg = r.error === 'not-week-intro' ? t('labur.locked') : delta > 0 ? t('labur.short.duit') : t('labur.short.pot', { product: name(p) });
      toast(msg, 'danger');
      return;
    }
    toast(t(delta > 0 ? 'labur.moved.in' : 'labur.moved.out', { amount: formatMoney(Math.abs(delta)), product: name(p) }), 'success');
    if (r.tip === 'kecemasan') toast(t('labur.moved.tekanan', { n: BALANCE.finance.laburBeforeEmergencyTekanan }), 'info');
  };

  const onMove = (p: LaburProduct, dir: 1 | -1) => {
    const m = useGame.getState().meters;
    if (dir === 1 && m.duit >= amount && m.simpanan < BALANCE.finance.emergencyTarget) {
      setPending(p);
      return;
    }
    move(p, dir * amount);
  };

  const cancel = () => setPending(null);
  const sheet = pending && (
    <EmergencyCheck
      onCancel={cancel}
      onGo={() => { const p = pending; setPending(null); move(p, amount); }}
    />
  );

  const thisWeek = BALANCE.finance.ekuitiPath[week - 1];
  return (
    <section aria-labelledby={headingId} className={`rounded-[20px] bg-indigo-soft p-4 ${className}`}>
      <h2 id={headingId} className="font-display text-xl font-bold text-ink">{t('labur.title')}</h2>
      <p className="mt-0.5 text-base leading-snug text-ink-soft">{t('labur.sub')}</p>

      {open ? (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2">
          <span className="text-base font-medium text-ink">{t('labur.amount')}</span>
          <span className="flex items-center gap-1">
            <button
              type="button"
              aria-label={t('labur.less', { step: LABUR_STEP })}
              disabled={amount <= LABUR_STEP}
              onClick={() => setAmount((a) => Math.max(LABUR_STEP, a - LABUR_STEP))}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-soft text-ink active:scale-95 disabled:opacity-40"
            >
              <Minus aria-hidden size={22} strokeWidth={2} />
            </button>
            <output aria-live="polite" className="min-w-[4.5rem] text-center font-mono text-xl font-semibold text-ink">{formatMoney(amount)}</output>
            <button
              type="button"
              aria-label={t('labur.more', { step: LABUR_STEP })}
              onClick={() => setAmount((a) => a + LABUR_STEP)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-soft text-ink active:scale-95"
            >
              <Plus aria-hidden size={22} strokeWidth={2} />
            </button>
          </span>
        </div>
      ) : (
        <p className="mt-3 flex items-center gap-2 rounded-2xl bg-white/70 px-3 py-2.5 text-base font-medium text-ink">
          <Lock aria-hidden size={20} strokeWidth={1.75} className="shrink-0 text-ink-soft" />
          {t('labur.locked')}
        </p>
      )}

      <div className="mt-3 flex flex-col gap-3">
        <Product product="amanah" open={open} onMove={onMove}>
          <p className="mt-1 text-base leading-snug text-ink-soft">
            {t('labur.amanah.desc', { rate: Math.round(BALANCE.finance.amanahYearly * 1000) / 10 })}
          </p>
          <FlatLine week={week} />
        </Product>
        <Product product="ekuiti" open={open} onMove={onMove}>
          <p className="mt-1 text-base leading-snug text-ink-soft">{t('labur.ekuiti.desc')}</p>
          <Sparkline week={week} />
          <p className="text-base text-ink-soft">
            {thisWeek !== undefined ? t('labur.ekuiti.week', { week, pct: pct(thisWeek) }) : t('labur.ekuiti.start')}
          </p>
        </Product>
      </div>

      <p className="mt-3 flex items-start gap-2 text-base leading-snug text-ink">
        <Info aria-hidden size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-indigo" />
        {t('labur.disclaimer')}
      </p>

      {sheet && (sheetHost ? createPortal(sheet, sheetHost) : sheet)}
    </section>
  );
}
