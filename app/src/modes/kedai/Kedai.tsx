// Placeholder from the A1 contracts; Wafi replaces it (W3).
import { ArrowLeft } from 'lucide-react';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';

export function Kedai() {
  const t = useT();
  return (
    <div data-screen="kedai" className="flex flex-1 flex-col bg-paper px-4">
      <div className="flex items-center gap-1 pt-1">
        <button type="button" aria-label={t('common.back')} onClick={() => navigate('/home')} className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full text-ink">
          <ArrowLeft aria-hidden size={24} strokeWidth={1.75} />
        </button>
        <h1 className="font-display text-xl font-extrabold text-ink">{t('kedai.app')}</h1>
      </div>
      <p className="mt-6 text-center text-base text-ink-soft">{t('common.comingSoon')}</p>
    </div>
  );
}
