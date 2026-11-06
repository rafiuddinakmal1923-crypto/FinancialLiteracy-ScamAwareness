import type { ReactNode } from 'react';

export type MeterTone = 'kancil' | 'safe' | 'warning' | 'danger' | 'indigo';

const FILL: Record<MeterTone, string> = {
  kancil: 'bg-kancil', safe: 'bg-safe', warning: 'bg-warning', danger: 'bg-danger', indigo: 'bg-indigo',
};

/**
 * Label + bar + value (Duit, Tekanan, XP, success meter). `display` overrides the value text; `heading` replaces
 * the whole label/value row (e.g. one sentence like "Dana kecemasan: RM180 / RM300"), `label` still names the bar.
 */
export function MeterBar({ label, value, max, tone = 'kancil', display, heading, className = '' }: {
  label: string; value: number; max: number; tone?: MeterTone; display?: string; heading?: ReactNode; className?: string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={className}>
      {heading ?? (
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-base font-medium text-ink">{label}</span>
          <span className="font-mono text-base font-semibold text-ink">{display ?? `${value}/${max}`}</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={display}
        className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-indigo-soft"
      >
        <div className={`h-full rounded-full ${FILL[tone]} transition-[width] duration-300`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
