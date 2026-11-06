// Mesin Masa chart, drawn by hand in SVG: what you saved (indigo) with the growth on top (amber), one point a year.
// The age labels are HTML under the SVG so they stay at 16 px whatever the width.
import { useT } from '../../shell/i18n';

export interface GrowthPoint { age: number; contributed: number; value: number }

const W = 320;
const H = 168;
const PAD_TOP = 10;

/** Up to 5 ages along the axis (first, last and evenly between, whole years). */
export function axisAges(first: number, last: number, max = 5): number[] {
  const span = last - first;
  if (span <= 0) return [first];
  const n = Math.min(max, span + 1);
  const ages = new Set<number>();
  for (let i = 0; i < n; i++) ages.add(Math.round(first + (span * i) / (n - 1)));
  return [...ages];
}

export function GrowthChart({ series, label }: { series: GrowthPoint[]; label: string }) {
  const t = useT();
  const first = series[0]!;
  const last = series[series.length - 1]!;
  const top = Math.max(last.value, 1);
  const x = (age: number) => ((age - first.age) / Math.max(1, last.age - first.age)) * W;
  const y = (v: number) => PAD_TOP + (1 - v / top) * (H - PAD_TOP);
  const line = (pick: (p: GrowthPoint) => number) => series.map((p) => `${x(p.age).toFixed(1)},${y(pick(p)).toFixed(1)}`);
  const contributedTop = line((p) => p.contributed);
  const valueTop = line((p) => p.value);
  const base = `${W},${H} 0,${H}`;
  const savedArea = `M${contributedTop.join(' L')} L${base} Z`;
  // Growth sits between the contributed line and the value line.
  const growthArea = `M${valueTop.join(' L')} L${[...contributedTop].reverse().join(' L')} Z`;
  const ages = axisAges(first.age, last.age);
  return (
    <figure className="mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} className="block h-auto w-full overflow-visible">
        <line x1="0" x2={W} y1={H} y2={H} stroke="var(--color-ink-soft)" strokeWidth="1.5" />
        <path data-area="saved" d={savedArea} fill="var(--color-indigo)" fillOpacity="0.9" />
        <path data-area="growth" d={growthArea} fill="var(--color-kancil)" fillOpacity="0.95" />
        <polyline points={valueTop.join(' ')} fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={W} cy={y(last.value)} r="4.5" fill="var(--color-paper)" stroke="var(--color-ink)" strokeWidth="2" />
        {ages.map((a) => <line key={a} x1={x(a)} x2={x(a)} y1={H} y2={H + 5} stroke="var(--color-ink-soft)" strokeWidth="1.5" />)}
      </svg>
      <div aria-hidden className="relative mt-1.5 h-6 font-mono text-base font-semibold text-ink-soft">
        {ages.map((a, i) => {
          const pos = (x(a) / W) * 100;
          const edge = i === 0 ? '0%' : i === ages.length - 1 ? '-100%' : '-50%';
          return <span key={a} className="absolute top-0 whitespace-nowrap" style={{ left: `${pos}%`, transform: `translateX(${edge})` }}>{a}</span>;
        })}
      </div>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-base text-ink">
        <span className="flex items-center gap-1.5"><span aria-hidden className="h-3.5 w-3.5 rounded-sm bg-indigo" />{t('kalkulator.masa.legend.saved')}</span>
        <span className="flex items-center gap-1.5"><span aria-hidden className="h-3.5 w-3.5 rounded-sm bg-kancil" />{t('kalkulator.masa.legend.growth')}</span>
      </figcaption>
    </figure>
  );
}
