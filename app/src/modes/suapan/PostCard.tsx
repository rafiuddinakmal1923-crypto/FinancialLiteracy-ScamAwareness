// W1: one Suapan post. The card never shows the post's kind: judging it is the player's job (W2 adds the calls).
import type { FeedPost } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { useSettings } from '../../state/settings';
import { Avatar } from '../../ui/Avatar';

export function PostCard({ post }: { post: FeedPost }) {
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
          <p className="truncate text-sm font-medium text-ink-soft">
            {post.author.handle}
            <span aria-hidden> · </span>
            {t('suapan.followers', { n: post.author.followers })}
          </p>
        </div>
      </header>
      <p className="mt-3 whitespace-pre-line break-words text-base leading-relaxed text-ink">{body}</p>
    </article>
  );
}
