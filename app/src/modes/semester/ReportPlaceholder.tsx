// Placeholder for /semester/rapor until Task 26 builds the report card.
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { Kancil } from '../../ui/Kancil';

export function ReportPlaceholder() {
  const t = useT();
  return (
    <div data-screen="rapor" className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-10 text-center">
      <Kancil mood="proud" size={120} decorative />
      <h1 className="font-display text-[28px] font-extrabold text-ink">{t('rapor.title')}</h1>
      <p className="text-base leading-snug text-ink">{t('rapor.soon')}</p>
      <button type="button" onClick={() => navigate('/home')} className="mt-3 min-h-12 w-full rounded-2xl bg-ink px-4 text-base font-semibold text-paper active:scale-[.98]">
        {t('common.toHome')}
      </button>
    </div>
  );
}
