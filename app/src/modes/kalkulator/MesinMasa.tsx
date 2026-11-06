import { useState } from 'react';
import { BALANCE } from '../../engine/balance';
import type { CalcPreset } from '../../engine/schemas';
import { useT } from '../../shell/i18n';
import { formatBank, formatMoney } from '../../ui/format';
import { Kancil } from '../../ui/Kancil';
import { agesOutOfOrder, masaResult } from './calcModel';
import { Chips, InputCard, Invalid, NumberField } from './fields';
import { GrowthChart } from './GrowthChart';

const D = BALANCE.finance.calc.defaults;

/** Mesin Masa (S19 tab 1): what a monthly saving grows to between two ages. */
export function MesinMasa({ preset }: { preset?: Extract<CalcPreset, { tab: 'masa' }> }) {
  const t = useT();
  const p = preset?.inputs;
  const [monthly, setMonthly] = useState(String(p?.monthly ?? D.monthly));
  const [rate, setRate] = useState(String(p?.rate ?? D.ratePct));
  const [startAge, setStartAge] = useState(String(p?.startAge ?? D.startAge));
  const [endAge, setEndAge] = useState(String(p?.endAge ?? D.endAge));
  const input = { monthly, rate, startAge, endAge };
  const r = masaResult(input);
  const { rateChips, endAgeChips } = BALANCE.finance.calc;

  return (
    <>
      {!r ? (
        <Invalid extra={agesOutOfOrder(input) ? t('kalkulator.invalid.ages') : undefined} />
      ) : (
        <section aria-label={t('kalkulator.results')} className="mx-4 mt-4 rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
          <p className="text-base text-ink-soft">{t('kalkulator.masa.big', { age: r.endAge })}</p>
          <p className="break-words font-mono text-[32px] font-semibold leading-tight text-ink">{formatBank(r.value)}</p>
          <p className="mt-1 text-base text-ink">
            {t('kalkulator.masa.you', { saved: formatMoney(r.contributed), growth: formatMoney(r.growth) })}
          </p>
          <GrowthChart
            series={r.series}
            label={t('kalkulator.masa.chart', {
              from: r.startAge, to: r.endAge, saved: formatMoney(r.contributed), growth: formatMoney(r.growth),
            })}
          />
        </section>
      )}

      <InputCard>
        <NumberField label={t('kalkulator.masa.monthly')} value={monthly} onChange={setMonthly} step={10} />
        <div>
          <NumberField label={t('kalkulator.masa.rate')} value={rate} onChange={setRate} step={0.5} />
          <Chips
            columns={2}
            label={t('kalkulator.masa.rateChips')}
            items={rateChips.map((c) => ({
              key: String(c.pct), pressed: rate === String(c.pct),
              text: `${t(`kalkulator.band.${c.band}`)} ${c.pct}%`,
            }))}
            onPick={setRate}
          />
        </div>
        <NumberField label={t('kalkulator.masa.start')} value={startAge} onChange={setStartAge} inputMode="numeric" />
        <div>
          <NumberField label={t('kalkulator.masa.end')} value={endAge} onChange={setEndAge} inputMode="numeric" />
          <Chips
            label={t('kalkulator.masa.endChips')}
            items={endAgeChips.map((a) => ({ key: String(a), text: String(a), pressed: endAge === String(a) }))}
            onPick={setEndAge}
          />
        </div>
      </InputCard>

      <div className="mx-4 mt-4 flex items-center gap-3 rounded-2xl bg-kancil-soft p-3 pl-2">
        <Kancil mood="smile" size={52} decorative className="shrink-0" />
        <p className="min-w-0 flex-1 font-display text-base font-bold leading-snug text-ink">{t('kalkulator.masa.kancil')}</p>
      </div>
    </>
  );
}
