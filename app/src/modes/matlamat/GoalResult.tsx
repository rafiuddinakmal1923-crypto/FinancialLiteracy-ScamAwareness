// W4: the goal line on the report card (S13). Reached gives BALANCE.matlamat.xpReached XP (awarded by the engine, A4).
import { CircleCheck, Target } from 'lucide-react';
import { BALANCE } from '../../engine/balance';
import { goalProgress, goalReached } from '../../engine/goals';
import { useT } from '../../shell/i18n';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { formatMoney } from '../../ui/format';
import { goalName } from './goalName';

export function GoalResult() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const goal = useGame((s) => s.goal);
  const meters = useGame((s) => s.meters);
  const p = goalProgress({ goal, meters });
  if (!p) return null;
  const reached = goalReached({ goal, meters });
  const name = goalName(p.goal, lang);
  const Icon = reached ? CircleCheck : Target;
  return (
    <section data-slot="GoalResult" aria-label={t('matlamat.result.title')} className={`rounded-2xl p-4 shadow-[0_2px_8px_rgba(28,27,58,.08)] ${reached ? 'bg-safe-soft' : 'bg-white'}`}>
      <h2 className="font-display text-lg font-bold text-ink">{t('matlamat.result.title')}</h2>
      <p className="mt-1 flex items-start gap-2 text-base leading-snug text-ink">
        <Icon aria-hidden size={22} strokeWidth={1.75} className={`mt-0.5 shrink-0 ${reached ? 'text-safe' : 'text-kancil'}`} />
        <span>
          {reached
            ? t('matlamat.result.reached', { name, target: formatMoney(p.target), xp: BALANCE.matlamat.xpReached })
            : t('matlamat.result.notYet', { name, value: formatMoney(p.value), target: formatMoney(p.target) })}
        </span>
      </p>
    </section>
  );
}
