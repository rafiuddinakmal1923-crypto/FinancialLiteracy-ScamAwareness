import { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { BALANCE } from '../../engine/balance';
import type { CalcPreset } from '../../engine/schemas';
import { useT } from '../../shell/i18n';
import { formatBank } from '../../ui/format';
import { kosResult } from './calcModel';
import { Choice, InputCard, Invalid, NumberField } from './fields';
import { formatPct } from './SemakPulangan';

const D = BALANCE.finance.calc.defaults;
const CARD = 'rounded-2xl bg-white p-3 shadow-[0_2px_8px_rgba(28,27,58,.08)]';

/** Kos Sebenar (S19 tab 3): the true cost of a loan or BNPL. */
export function KosSebenar({ preset }: { preset?: Extract<CalcPreset, { tab: 'kos' }> }) {
  const t = useT();
  const p = preset?.inputs;
  const [amount, setAmount] = useState(String(p?.amount ?? D.amount));
  const [mode, setMode] = useState<'flat' | 'fee'>(p?.fee !== undefined ? 'fee' : 'flat');
  const [flat, setFlat] = useState(String(p?.flat ?? D.flatPct));
  const [fee, setFee] = useState(String(p?.fee ?? D.fee));
  const [months, setMonths] = useState(String(p?.months ?? D.months));
  const r = kosResult({ amount, mode, flat, fee, months });

  return (
    <>
      <InputCard>
        <NumberField label={t('kalkulator.kos.amount')} value={amount} onChange={setAmount} step={100} />
        <Choice
          label={t('kalkulator.kos.mode')}
          value={mode}
          options={[{ value: 'flat' as const, label: t('kalkulator.kos.flat') }, { value: 'fee' as const, label: t('kalkulator.kos.fee') }]}
          onChange={(v: 'flat' | 'fee') => setMode(v)}
        />
        {mode === 'flat'
          ? <NumberField label={t('kalkulator.kos.flat')} value={flat} onChange={setFlat} step={1} />
          : <NumberField label={t('kalkulator.kos.fee')} value={fee} onChange={setFee} step={10} />}
        <NumberField label={t('kalkulator.kos.months')} value={months} onChange={setMonths} inputMode="numeric" />
      </InputCard>

      {!r ? <Invalid /> : (
        <section aria-label={t('kalkulator.results')} className="mx-4 mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className={CARD}>
              <p className="text-base text-ink-soft">{t('kalkulator.kos.instalment')}</p>
              <p className="break-words font-mono text-xl font-semibold text-ink">{formatBank(r.instalment)}</p>
            </div>
            <div className={CARD}>
              <p className="text-base text-ink-soft">{t('kalkulator.kos.total')}</p>
              <p className="break-words font-mono text-xl font-semibold text-ink">{formatBank(r.total)}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-danger-soft p-3 ring-1 ring-danger/50">
            <p className="flex items-center gap-1.5 text-base font-semibold text-ink">
              <CircleAlert aria-hidden size={20} strokeWidth={2} className="text-danger" />
              {t('kalkulator.kos.cost')}
            </p>
            <p className="break-words font-mono text-[28px] font-semibold leading-tight text-danger-ink">{formatBank(r.cost)}</p>
          </div>
          <div className={CARD}>
            <p className="text-base text-ink-soft">{t('kalkulator.kos.effective')}</p>
            <p className="font-mono text-[28px] font-semibold leading-tight text-ink">{`${formatPct(Math.round(r.effectivePct * 10) / 10)}%`}</p>
            <p className="mt-1 text-base leading-snug text-ink">
              {r.cost <= 0 ? t('kalkulator.kos.why.none') : t(`kalkulator.kos.why.${mode}`)}
            </p>
          </div>
        </section>
      )}
    </>
  );
}
