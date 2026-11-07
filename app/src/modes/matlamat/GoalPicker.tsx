// W4 (FR-83, D38): after the week-0 split, the player picks one semester goal. Shown in Dompet at week 0 until a
// goal is picked; the targets come from balance.ts.
import { Target } from 'lucide-react';
import { goals } from 'virtual:celik-content';
import { BALANCE } from '../../engine/balance';
import { useT } from '../../shell/i18n';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { formatMoney } from '../../ui/format';

export function GoalPicker() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const week = useGame((s) => s.week);
  const goal = useGame((s) => s.goal);
  const list = goals ?? [];
  if (week !== 0 || goal || list.length === 0) return null;
  return (
    <section data-slot="GoalPicker" aria-labelledby="goal-picker-title" className="mx-4 mb-3 rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
      <h2 id="goal-picker-title" className="flex items-center gap-2 font-display text-lg font-bold text-ink">
        <Target aria-hidden size={22} strokeWidth={1.75} className="shrink-0 text-kancil" />
        {t('matlamat.pick.title')}
      </h2>
      <p className="mt-1 text-base text-ink-soft">{t('matlamat.pick.body')}</p>
      <div className="mt-3 grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
        {list.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => useGame.getState().setGoal(g.id)}
            className="flex min-h-12 flex-col items-start justify-center rounded-xl bg-paper px-3 py-2 text-left ring-1 ring-inset ring-ink/20 active:scale-[.98]"
          >
            <span className="text-base font-semibold text-ink">{(lang === 'en' ? g.name.en : undefined) ?? g.name.ms}</span>
            <span className="font-mono text-base font-semibold text-ink-soft">{formatMoney(BALANCE.matlamat.targets[g.id])}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
