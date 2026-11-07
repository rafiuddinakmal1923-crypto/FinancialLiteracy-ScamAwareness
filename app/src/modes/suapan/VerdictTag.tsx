import { CircleCheck, CircleMinus, CircleX } from 'lucide-react';
import type { FeedVerdict } from '../../engine/feed';
import { useT } from '../../shell/i18n';

const STYLE: Record<FeedVerdict, { Icon: typeof CircleCheck; cls: string }> = {
  right: { Icon: CircleCheck, cls: 'text-safe' },
  wrong: { Icon: CircleX, cls: 'text-danger' },
  neutral: { Icon: CircleMinus, cls: 'text-ink-soft' },
};

/** A verdict as icon and word, never colour alone (UI-SPEC 7). */
export function VerdictTag({ verdict }: { verdict: FeedVerdict }) {
  const t = useT();
  const { Icon, cls } = STYLE[verdict];
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${cls}`}>
      <Icon aria-hidden size={18} strokeWidth={2} className="shrink-0" />
      {t(`suapan.verdict.${verdict}`)}
    </span>
  );
}
