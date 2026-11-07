// W6: the Kad Keputusan picture (FR-85), laid out at exactly 1080 × 1350 px. Only report numbers, the character's
// name and fixed copy appear on it; there is no text input (CLAUDE.md rule 2) and it always carries SIMULASI.
import { forwardRef } from 'react';
import type { GradeLetter } from '../../engine/grade';
import type { ReportModel } from '../../engine/report';
import { useT } from '../../shell/i18n';
import { formatMoney } from '../../ui/format';
import { useTactic } from '../../ui/tactics';
import { useConceptName } from '../harian/shared';
import { goalName } from '../matlamat/goalName';
import { useSettings } from '../../state/settings';

export const CARD_W = 1080;
export const CARD_H = 1350;

const STAMP: Record<GradeLetter, string> = {
  A: 'border-safe text-safe bg-safe-soft', B: 'border-indigo text-indigo bg-indigo-soft',
  C: 'border-kancil text-ink bg-kancil-soft', D: 'border-danger text-danger-ink bg-danger-soft',
};

function Bar({ label, value, tone }: { label: string; value: number; tone: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3 text-[26px] text-ink">
        <span className="truncate">{label}</span>
        <span className="font-mono font-semibold">{pct}%</span>
      </div>
      <div className="h-3.5 rounded-full bg-indigo-soft"><div className={`h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export const ResultCard = forwardRef<HTMLDivElement, { m: ReportModel; name: string; portrait: string }>(
  function ResultCard({ m, name, portrait }, ref) {
    const t = useT();
    const lang = useSettings((s) => s.lang);
    const tactic = useTactic();
    const conceptName = useConceptName();
    const goal = m.goal;
    return (
      <div
        ref={ref}
        data-card="kad-keputusan"
        style={{ width: CARD_W, height: CARD_H }}
        className="flex flex-col overflow-hidden bg-paper font-body text-ink"
      >
        <div className="flex items-center justify-between bg-indigo px-16 py-10 text-paper">
          <div>
            <p className="font-display text-[72px] font-extrabold leading-none">Celik</p>
            <p className="mt-2 text-[30px]">{t('app.tagline')}</p>
          </div>
          <p className="rounded-2xl bg-warning px-6 py-3 font-display text-[30px] font-extrabold tracking-wider text-ink">{t('kongsi.card.simulasi')}</p>
        </div>

        <div className="flex items-center gap-10 px-16 pt-12">
          <img src={portrait} alt="" width={180} height={180} className="h-[180px] w-[180px] rounded-full bg-kancil-soft" />
          <div className="min-w-0 flex-1">
            <p className="text-[30px] text-ink-soft">{t('kongsi.card.report')}</p>
            <p className="font-display text-[64px] font-extrabold leading-tight">{name}</p>
            <p className="mt-1 font-mono text-[32px] font-semibold">{t('rapor.score', { score: m.score })}</p>
          </div>
          <div className={`flex h-[190px] w-[190px] shrink-0 -rotate-6 items-center justify-center rounded-[36px] border-[10px] border-double ${STAMP[m.grade]}`}>
            <span className="font-display text-[120px] font-extrabold leading-none">{m.grade}</span>
          </div>
        </div>

        <div className="mt-12 grid flex-1 grid-cols-2 gap-x-14 px-16">
          <section className="flex flex-col gap-5">
            <h2 className="font-display text-[34px] font-bold">{t('kongsi.card.celik')}</h2>
            {m.celik.map((c) => <Bar key={c.code} label={conceptName(c.code)} value={c.value} tone="bg-kancil" />)}
          </section>
          <section className="flex flex-col gap-5">
            <h2 className="font-display text-[34px] font-bold">{t('kongsi.card.imuniti')}</h2>
            {m.imuniti.map((c) => <Bar key={c.code} label={tactic(c.code)} value={c.value} tone="bg-indigo" />)}
          </section>
        </div>

        <div className="mx-16 mb-8 mt-8 rounded-[28px] bg-white px-10 py-7 text-[30px] leading-snug shadow-[0_2px_8px_rgba(28,27,58,.08)]">
          {goal
            ? t(goal.reached ? 'kongsi.card.goalReached' : 'kongsi.card.goalNotYet', {
              name: goalName(goal.goal, lang), value: formatMoney(goal.value), target: formatMoney(goal.target),
            })
            : t('kongsi.card.noGoal')}
        </div>

        <div className="flex items-center justify-between bg-ink px-16 py-7 text-[28px] text-paper">
          <span className="font-semibold">{t('kongsi.card.footer')}</span>
          <span className="opacity-80">{t('kongsi.card.fictional')}</span>
        </div>
      </div>
    );
  },
);
