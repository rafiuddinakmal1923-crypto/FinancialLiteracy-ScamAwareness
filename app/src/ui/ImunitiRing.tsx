import { TACTICS, type Tactic } from '../engine/types';
import { useT } from '../shell/i18n';

/** Overall Imuniti score: the mean of the seven tactic scores, 0-100. */
export function imunitiScore(imuniti: Record<Tactic, number>): number {
  const vals = TACTICS.map((k) => imuniti[k] ?? 0);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

const R_MAIN = 46;
const R_SEG = 60;
const C_MAIN = 2 * Math.PI * R_MAIN;
const C_SEG = 2 * Math.PI * R_SEG;
const SEG_GAP = 7;

/** Circular Imuniti score with the level name inside and one small segment per tactic around it. */
export function ImunitiRing({ imuniti, level, size = 136 }: {
  imuniti: Record<Tactic, number>; level: string; size?: number;
}) {
  const t = useT();
  const score = imunitiScore(imuniti);
  const segLen = C_SEG / TACTICS.length - SEG_GAP;
  return (
    <div role="img" aria-label={t('imuniti.label', { score, level })} className="relative shrink-0" style={{ width: size, height: size }}>
      <svg aria-hidden viewBox="0 0 136 136" width={size} height={size} className="-rotate-90">
        <circle cx="68" cy="68" r={R_MAIN} fill="none" stroke="var(--color-indigo-soft)" strokeWidth="11" />
        <circle
          cx="68" cy="68" r={R_MAIN} fill="none" stroke="var(--color-kancil)" strokeWidth="11" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * C_MAIN} ${C_MAIN}`}
        />
        {TACTICS.map((k, i) => {
          const v = Math.max(0, Math.min(100, imuniti[k] ?? 0));
          return (
            <circle
              key={k} cx="68" cy="68" r={R_SEG} fill="none" strokeWidth="6" strokeLinecap="round"
              stroke="var(--color-indigo)" opacity={0.18 + 0.82 * (v / 100)}
              strokeDasharray={`${segLen} ${C_SEG}`}
              strokeDashoffset={-(i * C_SEG) / TACTICS.length - SEG_GAP / 2}
            />
          );
        })}
      </svg>
      <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center px-7 text-center">
        <span className="font-mono text-[28px] font-semibold leading-none text-ink">{score}</span>
        <span className="mt-1 font-display text-base font-bold leading-tight text-indigo">{level}</span>
      </div>
    </div>
  );
}
