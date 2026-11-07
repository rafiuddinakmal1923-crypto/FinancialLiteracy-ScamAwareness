// W1: the Suapan feed (FR-80). Posts come from content/feed.json in file order; W2 adds Percaya / Semak / Lapor.
import { ArrowLeft } from 'lucide-react';
import { feed } from 'virtual:celik-content';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { PostCard } from './PostCard';

export function Suapan() {
  const t = useT();
  const posts = feed ?? [];
  return (
    <div data-screen="suapan" className="flex min-h-0 flex-1 flex-col bg-paper">
      <header className="flex items-center gap-1 px-4 pt-1">
        <button type="button" aria-label={t('common.back')} onClick={() => navigate('/home')} className="-ml-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-ink">
          <ArrowLeft aria-hidden size={24} strokeWidth={1.75} />
        </button>
        <div className="min-w-0 pr-16">
          <h1 className="font-display text-xl font-extrabold text-ink">{t('suapan.app')}</h1>
          <p className="text-sm font-medium text-ink-soft">{t('suapan.subtitle')}</p>
        </div>
      </header>
      {posts.length === 0 ? (
        <p className="mt-6 px-4 text-center text-base text-ink-soft">{t('suapan.empty')}</p>
      ) : (
        <ol aria-label={t('suapan.feedLabel')} className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6">
          {posts.map((p) => (
            <li key={p.id}><PostCard post={p} /></li>
          ))}
        </ol>
      )}
    </div>
  );
}
