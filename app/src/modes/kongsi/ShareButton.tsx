// Placeholder slot from the A1 contracts; Wafi replaces it (W6).
import { useT } from '../../shell/i18n';

export function ShareButton() {
  const t = useT();
  return <p data-slot="ShareButton" className="rounded-2xl bg-white px-4 py-2 text-center text-base text-ink-soft">{t('common.comingSoon')}</p>;
}
