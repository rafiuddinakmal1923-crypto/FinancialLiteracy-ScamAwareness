import { ShieldAlert } from 'lucide-react';
import { useT } from '../shell/i18n';

/** Yellow strip on every simulated bank / portal / 997 screen. */
export function SimulasiBanner() {
  const t = useT();
  return (
    <div role="note" className="flex items-center gap-2 bg-warning px-4 py-2 text-base font-semibold text-ink">
      <ShieldAlert aria-hidden size={20} strokeWidth={2} className="shrink-0" />
      <span>{t('simulasi.banner')}</span>
    </div>
  );
}
