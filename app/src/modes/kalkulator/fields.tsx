// Shared inputs for the Kalkulator tabs: a stepper that takes numbers only (never below 0), a radio-style segmented
// choice and a row of chips. Everything is at least 48 px tall (UI-SPEC section 7).
import { useId, type ReactNode } from 'react';
import { Minus, Plus } from 'lucide-react';
import { BALANCE } from '../../engine/balance';
import { useT } from '../../shell/i18n';
import { parseNum } from './calcModel';

const MAX_DIGITS = BALANCE.finance.calc.maxDigits;

/** Keeps digits and one decimal point; anything else (letters, minus, exponents) is dropped. */
export function sanitize(raw: string): string {
  let out = raw.replace(/[^\d.]/g, '');
  const dot = out.indexOf('.');
  if (dot >= 0) out = out.slice(0, dot + 1) + out.slice(dot + 1).replace(/\./g, '');
  return out.slice(0, MAX_DIGITS);
}

/** value +/- step, never below 0, without float noise (0.1 + 0.2). */
export function stepped(value: string, delta: number): string {
  const n = parseNum(value) ?? 0;
  return String(Math.max(0, Math.round((n + delta) * 1000) / 1000));
}

const BTN = 'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-soft text-indigo active:scale-95 disabled:opacity-40';

export function NumberField({ label, value, onChange, step = 1, inputMode = 'decimal', hint }: {
  label: string; value: string; onChange(v: string): void; step?: number; inputMode?: 'decimal' | 'numeric'; hint?: ReactNode;
}) {
  const t = useT();
  const id = useId();
  const atZero = (parseNum(value) ?? 0) <= 0;
  return (
    <div>
      <label htmlFor={id} className="block text-base font-semibold text-ink">{label}</label>
      <div className="mt-1 flex items-center gap-2">
        <button type="button" aria-label={t('kalkulator.dec', { label })} disabled={atZero} onClick={() => onChange(stepped(value, -step))} className={BTN}>
          <Minus aria-hidden size={22} strokeWidth={2} />
        </button>
        <input
          id={id}
          type="text"
          inputMode={inputMode}
          autoComplete="off"
          value={value}
          onChange={(e) => onChange(sanitize(e.target.value))}
          className="h-12 min-w-0 flex-1 rounded-xl bg-white px-2 text-center font-mono text-xl font-semibold text-ink ring-1 ring-inset ring-indigo/25 focus:ring-2 focus:ring-indigo"
        />
        <button type="button" aria-label={t('kalkulator.inc', { label })} onClick={() => onChange(stepped(value, step))} className={BTN}>
          <Plus aria-hidden size={22} strokeWidth={2} />
        </button>
      </div>
      {hint}
    </div>
  );
}

/** One-of-N choice shown as pills (radiogroup). */
export function Choice<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; label: string }[]; onChange(v: T): void;
}) {
  const id = useId();
  return (
    <div>
      <p id={id} className="text-base font-semibold text-ink">{label}</p>
      <div role="radiogroup" aria-labelledby={id} className="mt-1 grid gap-1.5 rounded-2xl bg-indigo-soft p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => {
          const on = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(o.value)}
              className={`min-h-12 rounded-xl px-1 text-base font-semibold leading-tight transition-colors duration-150 ${on ? 'bg-indigo text-paper shadow-[0_2px_6px_rgba(28,27,58,.2)]' : 'text-indigo'}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Quick-pick chips under a field; the chip that matches the current value is pressed. */
export function Chips({ label, items, onPick, columns }: {
  columns?: 2;
  label: string; items: { key: string; text: string; pressed: boolean; name?: string }[]; onPick(key: string): void;
}) {
  return (
    <div role="group" aria-label={label} className={`mt-2 ${columns === 2 ? 'grid grid-cols-2' : 'flex flex-wrap'} gap-2`}>
      {items.map((c) => (
        <button
          key={c.key}
          type="button"
          aria-pressed={c.pressed}
          aria-label={c.name}
          onClick={() => onPick(c.key)}
          className={`min-h-12 min-w-12 rounded-full px-3 text-base font-semibold leading-tight ring-1 ring-inset transition-colors duration-150 active:scale-[.98] ${
            c.pressed ? 'bg-kancil text-ink ring-kancil' : 'bg-white text-ink ring-kancil/60'
          }`}
        >
          {c.text}
        </button>
      ))}
    </div>
  );
}

/** The grey card every tab uses for "enter numbers here". */
export function InputCard({ children }: { children: ReactNode }) {
  return <section className="mx-4 mt-4 flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">{children}</section>;
}

/** "Isi semua nombor" (and an optional extra line) where a result would be. */
export function Invalid({ extra }: { extra?: string }) {
  const t = useT();
  return (
    <section role="status" className="mx-4 mt-4 rounded-2xl bg-danger-soft p-4 text-base font-semibold text-ink ring-1 ring-danger/40">
      <p>{t('kalkulator.invalid')}</p>
      {extra && <p className="mt-1 font-normal">{extra}</p>}
    </section>
  );
}
