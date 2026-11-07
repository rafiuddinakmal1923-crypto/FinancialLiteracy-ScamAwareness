// W4: the picked goal's progress in Dompet (goalProgress from engine/goals.ts). At week 0 the goal can still change.
import { goalProgress } from '../../engine/goals';
import { useT } from '../../shell/i18n';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { formatMoney } from '../../ui/format';
import { MeterBar } from '../../ui/MeterBar';
import { goalName } from './goalName';

export function GoalBar() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const goal = useGame((s) => s.goal);
  const meters = useGame((s) => s.meters);
  const week = useGame((s) => s.week);
  const p = goalProgress({ goal, meters });
  if (!p) return null;
  const name = goalName(p.goal, lang);
  return (
    <section data-slot="GoalBar" className="mx-4 mb-3 rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
      <MeterBar
        label={t('matlamat.bar.label', { name })}
        value={Math.min(p.value, p.target)}
        max={p.target}
        tone="kancil"
        heading={(
          <div className="flex items-baseline justify-between gap-2">
            <span className="min-w-0 text-base font-semibold text-ink">{t('matlamat.bar.label', { name })}</span>
            <span className="shrink-0 font-mono text-base font-semibold text-ink">
              {formatMoney(p.value)} / {formatMoney(p.target)}
            </span>
          </div>
        )}
      />
      {week === 0 && (
        <button type="button" onClick={() => useGame.getState().setGoal(null)} className="mt-1 min-h-12 text-base font-semibold text-indigo underline underline-offset-4">
          {t('matlamat.bar.change')}
        </button>
      )}
    </section>
  );
}
