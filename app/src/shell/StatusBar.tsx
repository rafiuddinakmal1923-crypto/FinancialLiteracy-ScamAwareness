import { Signal } from 'lucide-react';
import { useGame } from '../state/game';
import { formatRM } from '../ui/format';
import { useT } from './i18n';

export type TekananLevel = 'low' | 'mid' | 'high';

/** Tekanan bands for the battery icon: under 40 low, under 70 mid, else high. */
export function tekananLevel(v: number): TekananLevel {
  return v < 40 ? 'low' : v < 70 ? 'mid' : 'high';
}

const BATTERY_FILL: Record<TekananLevel, string> = {
  low: 'var(--color-safe)', mid: 'var(--color-warning)', high: 'var(--color-danger)',
};

function TekananBattery({ value, tone }: { value: number; tone: 'dark' | 'light' }) {
  const t = useT();
  const level = tekananLevel(value);
  const w = Math.max(2, Math.round((Math.min(100, value) / 100) * 20));
  const stroke = tone === 'dark' ? 'var(--color-paper)' : 'var(--color-ink)';
  return (
    <svg role="img" aria-label={t('status.tekanan', { level: t(`status.tekanan.${level}`), value })} width="34" height="18" viewBox="0 0 34 18">
      <rect x="1" y="2" width="27" height="14" rx="4" fill="none" stroke={stroke} strokeWidth="1.75" />
      <rect x="29.5" y="6" width="3" height="6" rx="1.2" fill={stroke} />
      <rect x="4" y="5" width={w} height="8" rx="2" fill={BATTERY_FILL[level]} />
      {level === 'high' && <path d="M15 4.5 12 9.5h3l-1 4 4-5.5h-3l1-3.5Z" fill={stroke} />}
    </svg>
  );
}

/** Phone status bar: in-game day and week on the left; Tekanan battery, signal and RM chip on the right. */
export function StatusBar({ tone = 'light' }: { tone?: 'dark' | 'light' }) {
  const t = useT();
  const week = useGame((s) => s.week);
  const tekanan = useGame((s) => s.meters.tekanan);
  const duit = useGame((s) => s.meters.duit);
  const text = tone === 'dark' ? 'text-paper' : 'text-ink';
  const chip = tone === 'dark' ? 'bg-paper/15 text-paper' : 'bg-indigo-soft text-ink';
  return (
    <header className={`flex h-12 shrink-0 items-center justify-between gap-2 px-4 ${text}`}>
      <span className="truncate text-base font-semibold">{t('status.day', { week: Math.max(1, week) })}</span>
      <div className="flex items-center gap-2">
        <TekananBattery value={tekanan} tone={tone} />
        <Signal role="img" aria-label={t('status.signal')} size={18} strokeWidth={2} />
        <span aria-label={t('status.balance', { amount: formatRM(duit) })} className={`rounded-full px-2.5 py-0.5 font-mono text-base font-semibold ${chip}`}>
          {formatRM(duit)}
        </span>
      </div>
    </header>
  );
}
