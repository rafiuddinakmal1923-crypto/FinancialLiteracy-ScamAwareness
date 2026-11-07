// The Suapan feed (FR-80, FR-81). W1: posts from content/feed.json in file order. W2: Percaya / Semak / Lapor, each
// post judged once (judgeFeed), a debrief sheet, and Semak opening the Kalkulator preset or the Kad Ilmu.
import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { feed } from 'virtual:celik-content';
import type { FeedCall, FeedPost } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useGame } from '../../state/game';
import { DebriefSheet } from './DebriefSheet';
import { PostCard } from './PostCard';
import { semakPath } from './semak';

export function Suapan() {
  const t = useT();
  const posts = feed ?? [];
  const calls = useGame((s) => s.feed);
  const [open, setOpen] = useState<FeedPost | null>(null);
  const openCall = open ? calls[open.id] : undefined;

  const judge = (post: FeedPost, call: FeedCall) => {
    useGame.getState().judgeFeed(post, call);
    setOpen(post);
  };
  const goSemak = (post: FeedPost) => {
    // Reading the post's Kad Ilmu earns it (the card screen only opens earned cards).
    if ('kad' in post.semak) useGame.getState().awardKadIlmu([post.semak.kad]);
    navigate(semakPath(post));
  };

  return (
    <div data-screen="suapan" className="relative flex min-h-0 flex-1 flex-col bg-paper">
      <header className="flex items-center gap-1 px-4 pt-1">
        <button type="button" aria-label={t('common.back')} onClick={() => navigate('/home')} className="-ml-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-ink">
          <ArrowLeft aria-hidden size={24} strokeWidth={1.75} />
        </button>
        <div className="min-w-0 pr-16">
          <h1 className="font-display text-xl font-extrabold text-ink">{t('suapan.app')}</h1>
          <p className="text-base font-medium text-ink-soft">{t('suapan.subtitle')}</p>
        </div>
      </header>
      {posts.length === 0 ? (
        <p className="mt-6 px-4 text-center text-base text-ink-soft">{t('suapan.empty')}</p>
      ) : (
        <ol aria-label={t('suapan.feedLabel')} className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 pb-6">
          {posts.map((p) => (
            <li key={p.id}>
              <PostCard post={p} call={calls[p.id]} onCall={(c) => judge(p, c)} onReview={() => setOpen(p)} />
            </li>
          ))}
        </ol>
      )}
      {open && openCall && (
        <DebriefSheet post={open} call={openCall} onClose={() => setOpen(null)} onSemak={() => goSemak(open)} />
      )}
    </div>
  );
}
