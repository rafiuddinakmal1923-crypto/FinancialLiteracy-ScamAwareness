import { useSettings } from '../state/settings';
import { useT } from './i18n';

/** BM | EN segmented toggle. */
export function LangToggle({ className = '' }: { className?: string }) {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const setLang = useSettings((s) => s.setLang);
  const opts = [
    { code: 'ms' as const, label: t('lang.ms'), name: t('lang.msName') },
    { code: 'en' as const, label: t('lang.en'), name: t('lang.enName') },
  ];
  return (
    <div role="group" aria-label={t('lang.label')} className={`inline-flex rounded-full bg-indigo-soft p-1 ${className}`}>
      {opts.map((o) => (
        <button
          key={o.code}
          type="button"
          lang={o.code}
          title={o.name}
          aria-pressed={lang === o.code}
          onClick={() => setLang(o.code)}
          className={`min-h-12 min-w-12 rounded-full px-3 text-base font-semibold transition-colors duration-150 ${
            lang === o.code ? 'bg-indigo text-paper' : 'text-indigo'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
