import { useEffect, useState } from 'react';
import { ArrowRight, Flag, Search } from 'lucide-react';
import { BALANCE } from '../../engine/balance';
import type { Period } from '../../engine/finance';
import type { CalcPreset } from '../../engine/schemas';
import { useT } from '../../shell/i18n';
import { pulanganResult, type PulanganResult } from './calcModel';
import { Choice, InputCard, Invalid, NumberField } from './fields';

const CALC = BALANCE.finance.calc;
const BAND_ORDER = ['simpanan', 'simpananTetap', 'hargaTetap', 'unitAmanah'] as const;
const PERIODS: Period[] = ['hari', 'minggu', 'bulan', 'tahun'];
const { minPct, maxPct } = CALC.scale;
const pos = (pct: number) => Math.max(0, Math.min(1, (pct - minPct) / (maxPct - minPct))) * 100;
const HATCH = 'repeating-linear-gradient(135deg, rgb(229 72 77 / 0.16) 0 6px, transparent 6px 12px)';

/** "213.8", "4", "10,000,000": one decimal at most, no trailing ".0". */
export function formatPct(n: number): string {
  return n.toLocaleString('en-MY', { maximumFractionDigits: 1 });
}

/** Grey example ranges on a shared scale, the red zone from the flag threshold, and the promised rate as a red pin. */
function BandChart({ r }: { r: PulanganResult }) {
  const t = useT();
  const pct = formatPct(r.pct);
  const off = r.pct > maxPct;
  const at = pos(r.pct);
  const threshold = BALANCE.finance.unrealisticAbove * 100;
  const zoneFrom = pos(threshold);
  const pinValue = r.capped ? `>${pct}%` : `${pct}%`;
  const chartLabel = t('kalkulator.pulangan.chart', { pct, capped: off ? t('kalkulator.pulangan.chart.capped') : '' });
  // The pill hangs left of the pin near the right end so it never runs off the card.
  const shift = at > 62 ? '-100%' : at < 14 ? '0%' : '-50%';
  return (
    <div className="mt-4">
      <p className="text-base font-semibold text-ink">{t('kalkulator.pulangan.ranges')}</p>
      <div className="relative mt-2">
        <div className="relative h-9">
          <span
            role="img"
            aria-label={chartLabel}
            className="absolute top-0 flex min-h-9 items-center gap-1 whitespace-nowrap rounded-full bg-danger-soft px-3 text-base font-bold text-ink ring-2 ring-danger"
            style={{ left: `${at}%`, transform: `translateX(${shift})` }}
          >
            {t('kalkulator.pulangan.pin')}: <span className="font-mono">{pinValue}</span>
            {off && <ArrowRight aria-hidden size={18} strokeWidth={2.25} className="text-danger" />}
          </span>
        </div>
        <div className="relative">
          {BAND_ORDER.map((k) => {
            const b = BALANCE.finance.bands[k];
            return (
              <div key={k} className="pb-3">
                <p className="text-base leading-tight text-ink">
                  {t(`kalkulator.band.${k}`)}{' '}
                  <span className="font-mono font-semibold text-ink-soft">{formatPct(b.min * 100)}% – {formatPct(b.max * 100)}%</span>
                </p>
                <div className="relative mt-1 h-3.5 rounded-full bg-indigo-soft">
                  <span aria-hidden className="absolute -inset-y-1 right-0 border-l-2 border-dashed border-danger" style={{ left: `${zoneFrom}%`, backgroundImage: HATCH }} />
                  <span
                    className="absolute inset-y-0 rounded-full bg-ink-soft/60"
                    style={{ left: `${pos(b.min * 100)}%`, width: `${pos(b.max * 100) - pos(b.min * 100)}%` }}
                  />
                  <span aria-hidden className="absolute -inset-y-1.5 z-10 w-1 -translate-x-1/2 rounded-full bg-danger" style={{ left: `${at}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div aria-hidden className="relative h-6 font-mono text-base font-semibold text-ink-soft">
          {[minPct, 0, threshold, maxPct].map((v, i, all) => (
            <span
              key={v}
              className="absolute top-0 whitespace-nowrap"
              style={{ left: `${pos(v)}%`, transform: `translateX(${i === 0 ? '0%' : i === all.length - 1 ? '-100%' : '-50%'})` }}
            >
              {v}%{i === all.length - 1 ? '+' : ''}
            </span>
          ))}
        </div>
        <p className="mt-1 flex items-center gap-2 text-base text-ink">
          <span aria-hidden className="h-4 w-6 shrink-0 rounded-sm border-2 border-dashed border-danger" style={{ backgroundImage: HATCH }} />
          {t('kalkulator.pulangan.zone', { pct: formatPct(threshold) })}
        </p>
      </div>
    </div>
  );
}

function BandSentence({ r }: { r: PulanganResult }) {
  const t = useT();
  if (r.band === 'atas') return <p className="mt-2 text-base text-ink">{t('kalkulator.pulangan.above')}</p>;
  if (!r.band.contains) return <p className="mt-2 text-base text-ink">{t('kalkulator.pulangan.noBand')}</p>;
  return (
    <p className="mt-2 text-base text-ink">
      {t('kalkulator.pulangan.inBand', { name: t(`kalkulator.band.${r.band.key}`), min: formatPct(r.band.min * 100), max: formatPct(r.band.max * 100) })}
    </p>
  );
}

/** Semak Pulangan (S19 tab 2): is a promised return realistic? `onUnrealistic` fires when the result is flagged. */
export function SemakPulangan({ preset, onUnrealistic }: { preset?: Extract<CalcPreset, { tab: 'pulangan' }>; onUnrealistic?: () => void }) {
  const t = useT();
  const [promised, setPromised] = useState(String(preset?.inputs.promised ?? CALC.defaults.promisedPct));
  const [period, setPeriod] = useState<Period>(preset?.inputs.period ?? CALC.defaults.period);
  const r = pulanganResult({ promised, period });
  const unrealistic = !!r?.unrealistic;
  useEffect(() => {
    if (unrealistic) onUnrealistic?.();
  }, [unrealistic, onUnrealistic]);

  return (
    <>
      <InputCard>
        <NumberField label={t('kalkulator.pulangan.promised')} value={promised} onChange={setPromised} step={1} />
        <Choice
          label={t('kalkulator.pulangan.period')}
          value={period}
          options={PERIODS.map((p) => ({ value: p, label: t(`kalkulator.pulangan.period.${p}`) }))}
          onChange={(v: Period) => setPeriod(v)}
        />
      </InputCard>

      {!r ? <Invalid /> : (
        <section aria-label={t('kalkulator.results')} className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
          <p className="break-words font-mono text-[28px] font-semibold leading-tight text-ink">
            {r.capped
              ? t('kalkulator.pulangan.yearly.capped', { pct: formatPct(r.pct) })
              : t('kalkulator.pulangan.yearly', { pct: formatPct(r.pct) })}
          </p>
          {r.unrealistic ? (
            <div className="mt-2">
              <p className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-danger-soft px-3 text-base font-bold text-ink ring-2 ring-danger">
                <Flag aria-hidden size={18} strokeWidth={2.25} className="text-danger" />
                {t('kalkulator.pulangan.flag')}
              </p>
              <p className="mt-2 text-base font-semibold text-ink">{t('kalkulator.pulangan.noLegit')}</p>
            </div>
          ) : null}
          <BandSentence r={r} />
          <BandChart r={r} />
        </section>
      )}

      <section className="mx-4 mt-4 flex items-start gap-3 rounded-2xl bg-indigo-soft p-4">
        <Search aria-hidden size={22} strokeWidth={1.75} className="mt-0.5 shrink-0 text-indigo" />
        <div className="min-w-0">
          <p className="text-base font-semibold text-ink">{t('kalkulator.pulangan.check')}</p>
          <p className="text-base leading-snug text-ink-soft">{t('kalkulator.pulangan.checkWhy')}</p>
        </div>
      </section>
    </>
  );
}
