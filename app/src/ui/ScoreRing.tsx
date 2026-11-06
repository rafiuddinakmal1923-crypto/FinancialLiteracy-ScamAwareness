import { useT } from '../shell/i18n';

/** Mean of `values` over `keys`, rounded, 0-100 (Celik Kewangan over 6 concepts, Imuniti over 7 tactics). */
export function meanScore<K extends string>(values: Record<K, number>, keys: readonly K[]): number {
  if (keys.length === 0) return 0;
  const sum = keys.reduce((a, k) => a + Math.max(0, Math.min(100, values[k] ?? 0)), 0);
  return Math.round(sum / keys.length);
}

export type RingTone = 'kancil' | 'indigo';

const ARC: Record<RingTone, string> = { kancil: 'var(--color-kancil)', indigo: 'var(--color-indigo)' };
const SEG: Record<RingTone, string> = { kancil: '#D9822B', indigo: 'var(--color-indigo)' };

const R_MAIN = 46;
const R_SEG = 60;
const C_MAIN = 2 * Math.PI * R_MAIN;
const C_SEG = 2 * Math.PI * R_SEG;
const SEG_GAP = 7;

/**
 * One home score (S03 v2): the overall score in a ring, one small segment per part around it (6 concepts or
 * 7 tactics, brighter when higher) and the name underneath, so colour is never the only signal.
 */
export function ScoreRing({ name, score, parts, tone, size = 84 }: {
  name: string; score: number; parts: number[]; tone: RingTone; size?: number;
}) {
  const t = useT();
  const segLen = C_SEG / Math.max(1, parts.length) - SEG_GAP;
  return (
    <div className="flex min-w-0 flex-col items-center">
      <div role="img" aria-label={t('ring.label', { name, score })} className="relative shrink-0" style={{ width: size, height: size }}>
        <svg aria-hidden viewBox="0 0 136 136" width={size} height={size} className="-rotate-90">
          <circle cx="68" cy="68" r={R_MAIN} fill="none" stroke="var(--color-indigo-soft)" strokeWidth="12" />
          <circle
            cx="68" cy="68" r={R_MAIN} fill="none" stroke={ARC[tone]} strokeWidth="12" strokeLinecap="round"
            strokeDasharray={`${(Math.max(0, Math.min(100, score)) / 100) * C_MAIN} ${C_MAIN}`}
          />
          {parts.map((v, i) => (
            <circle
              key={i} cx="68" cy="68" r={R_SEG} fill="none" strokeWidth="7" strokeLinecap="round"
              stroke={SEG[tone]} opacity={0.18 + 0.82 * (Math.max(0, Math.min(100, v)) / 100)}
              strokeDasharray={`${segLen} ${C_SEG}`}
              strokeDashoffset={-(i * C_SEG) / parts.length - SEG_GAP / 2}
            />
          ))}
        </svg>
        <span aria-hidden className="absolute inset-0 flex items-center justify-center font-mono text-[26px] font-semibold leading-none text-ink">
          {score}
        </span>
      </div>
      <span aria-hidden className="mt-1 text-balance text-center font-display text-base font-bold leading-tight text-ink">{name}</span>
    </div>
  );
}
