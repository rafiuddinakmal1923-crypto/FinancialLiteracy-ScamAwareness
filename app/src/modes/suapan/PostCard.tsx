// One Suapan post (W1) with its three calls (W2). The kind and the debrief stay hidden until the post is judged.
import { Flag, Search, ThumbsUp, type LucideIcon } from 'lucide-react';
import { judgePost } from '../../engine/feed';
import type { FeedCall, FeedPost } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { useSettings } from '../../state/settings';
import { Avatar } from '../../ui/Avatar';
import { VerdictTag } from './VerdictTag';

export const CALL_ICONS: Record<FeedCall, LucideIcon> = { percaya: ThumbsUp, semak: Search, lapor: Flag };
const CALLS: FeedCall[] = ['percaya', 'semak', 'lapor'];

export function PostCard({ post, call, onCall, onReview }: {
  post: FeedPost; call?: FeedCall | undefined; onCall?: (call: FeedCall) => void; onReview?: () => void;
}) {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const body = (lang === 'en' ? post.text.en : undefined) ?? post.text.ms;
  const titleId = `suapan-${post.id}-author`;
  return (
    <article
      data-post={post.id}
      aria-labelledby={titleId}
      className="rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]"
    >
      <header className="flex items-center gap-3">
        <Avatar name={post.author.name} size={44} />
        <div className="min-w-0 flex-1">
          <p id={titleId} className="truncate font-display text-base font-bold text-ink">{post.author.name}</p>
          <p className="truncate text-base font-medium text-ink-soft">
            {post.author.handle}
            <span aria-hidden> · </span>
            {t('suapan.followers', { n: post.author.followers })}
          </p>
        </div>
      </header>
      <p className="mt-3 whitespace-pre-line break-words text-base leading-relaxed text-ink">{body}</p>
      {call ? (
        <button
          type="button"
          onClick={onReview}
          className="mt-3 flex min-h-12 w-full items-center justify-between gap-2 rounded-xl bg-indigo-soft px-3 text-left text-base text-ink active:scale-[.98]"
        >
          <span className="flex min-w-0 flex-wrap items-center gap-x-2">
            <span className="font-semibold">{t(`suapan.call.${call}`)}</span>
            <VerdictTag verdict={judgePost(post, call).verdict} />
          </span>
          <span className="shrink-0 text-base font-semibold text-indigo">{t('suapan.review')}</span>
        </button>
      ) : onCall && (
        <div role="group" aria-label={t('suapan.callsLabel')} className="mt-3 grid grid-cols-3 gap-2">
          {CALLS.map((c) => {
            const Icon = CALL_ICONS[c];
            return (
              <button
                key={c}
                type="button"
                onClick={() => onCall(c)}
                className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-paper px-2 text-base font-semibold text-ink ring-1 ring-inset ring-ink/20 active:scale-[.98]"
              >
                <Icon aria-hidden size={20} strokeWidth={1.75} className="shrink-0" />
                {t(`suapan.call.${c}`)}
              </button>
            );
          })}
        </div>
      )}
    </article>
  );
}
