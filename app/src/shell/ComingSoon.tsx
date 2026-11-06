import { Hourglass } from 'lucide-react';
import { Kancil } from '../ui/Kancil';
import { useT } from './i18n';
import { navigate } from './router';

/** Placeholder for #/demo/:scene until Task 13 adds the demo scenes. */
export function ComingSoon({ params }: { params: Record<string, string> }) {
  const t = useT();
  return (
    <div data-screen="demo" className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <Kancil mood="neutral" size={140} decorative />
      <h1 className="inline-flex items-center gap-2 font-display text-2xl font-bold text-ink">
        <Hourglass aria-hidden size={24} strokeWidth={1.75} />
        {t('demo.title')}
      </h1>
      <p className="text-base text-ink-soft">{t('demo.body', { scene: params.scene ?? '' })}</p>
      <button type="button" onClick={() => navigate('/home')} className="min-h-12 rounded-2xl bg-ink px-6 text-base font-semibold text-paper">
        {t('common.toHome')}
      </button>
    </div>
  );
}
