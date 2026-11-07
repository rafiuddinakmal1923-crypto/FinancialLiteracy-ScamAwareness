// W2: what a call meant (D36). Hype and scam posts show their debrief; Semak offers the tool that checks the post.
import { useEffect, useRef } from 'react';
import { judgePost } from '../../engine/feed';
import { BALANCE } from '../../engine/balance';
import type { FeedCall, FeedPost } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { useSettings } from '../../state/settings';
import { CoachSheet } from '../../ui/CoachSheet';
import type { KancilMood } from '../../ui/Kancil';
import { VerdictTag } from './VerdictTag';

const MOOD: Record<string, KancilMood> = { right: 'proud', wrong: 'worried', neutral: 'neutral' };

export function DebriefSheet({ post, call, onSemak, onClose }: {
  post: FeedPost; call: FeedCall; onSemak: () => void; onClose: () => void;
}) {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const { verdict } = judgePost(post, call);
  const closeRef = useRef<HTMLButtonElement>(null);
  const title = t('suapan.debrief.title');
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const debrief = post.debrief && ((lang === 'en' ? post.debrief.en : undefined) ?? post.debrief.ms);
  const semakLabel = t('calc' in post.semak ? 'suapan.open.calc' : 'suapan.open.kad');
  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="absolute inset-0 z-30 flex flex-col justify-end bg-ink/40">
      <CoachSheet mood={MOOD[verdict]} tone={verdict === 'right' ? 'praise' : 'tip'} title={title}>
        <div className="mt-1 flex flex-col gap-2 text-base leading-snug text-ink">
          <p>
            {t('suapan.debrief.youChose', { call: t(`suapan.call.${call}`) })}
            <span aria-hidden> · </span>
            <VerdictTag verdict={verdict} />
            {verdict === 'right' && <span className="ml-1 font-mono font-semibold">{t('suapan.xp', { n: BALANCE.suapan.xpRight })}</span>}
          </p>
          <p className="font-semibold">{t(`suapan.kind.${post.kind}`)}</p>
          {debrief && <p>{debrief}</p>}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="min-h-12 rounded-2xl bg-white px-3 text-base font-semibold text-ink ring-1 ring-inset ring-ink/25 active:scale-[.98]"
          >
            {t('suapan.close')}
          </button>
          <button
            type="button"
            onClick={onSemak}
            className="min-h-12 rounded-2xl bg-ink px-3 text-base font-semibold text-paper active:scale-[.98]"
          >
            {semakLabel}
          </button>
        </div>
      </CoachSheet>
    </div>
  );
}
