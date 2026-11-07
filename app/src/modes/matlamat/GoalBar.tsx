// Placeholder slot from the A1 contracts; Wafi replaces it (W4).
import { useT } from '../../shell/i18n';

export function GoalBar() {
  const t = useT();
  return <p data-slot="GoalBar" className="mx-4 mb-3 rounded-2xl bg-white px-4 py-2 text-center text-base text-ink-soft">{t('common.comingSoon')}</p>;
}
