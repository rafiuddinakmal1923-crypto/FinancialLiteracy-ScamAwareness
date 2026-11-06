import { useId, useState, type ReactNode } from 'react';
import { ChevronUp } from 'lucide-react';
import { Kancil, type KancilMood } from './Kancil';
import { useT } from '../shell/i18n';

export type CoachTone = 'tip' | 'warning' | 'praise';

const TONE_BG: Record<CoachTone, string> = {
  tip: 'bg-kancil-soft', warning: 'bg-danger-soft', praise: 'bg-safe-soft',
};

/**
 * Sang Kancil bottom sheet: tip text (and/or richer `children`, e.g. the debrief) and at most one button.
 * `peek` starts collapsed to one line; tapping the header opens it.
 */
export function CoachSheet({ mood, text, children, button, onButton, title, tone = 'tip', peek = false, className = '' }: {
  mood: KancilMood; text?: string; children?: ReactNode; button?: string; onButton?: () => void;
  title?: string; tone?: CoachTone; peek?: boolean; className?: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(!peek);
  const bodyId = useId();
  const heading = title ?? t('coach.title');
  return (
    <section
      aria-label={heading}
      className={`relative rounded-t-[24px] ${TONE_BG[tone]} px-4 shadow-[0_-8px_24px_rgba(28,27,58,.12)] ${open ? 'pb-4 pt-3' : 'py-2'} ${className}`}
    >
      <div className="flex items-start gap-3">
        <Kancil
          mood={mood}
          size={open ? 64 : 52}
          decorative
          className={`${open ? '-mt-9' : '-mt-6'} shrink-0 drop-shadow-[0_2px_2px_rgba(28,27,58,.15)]`}
        />
        <div className="min-w-0 flex-1">
          {peek ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={bodyId}
              onClick={() => setOpen((o) => !o)}
              className="flex min-h-12 w-full items-center justify-between gap-2 text-left"
            >
              {open ? (
                <span className="font-display text-base font-bold text-ink">{heading}</span>
              ) : (
                <span className="line-clamp-1 text-base text-ink">
                  <span className="font-display font-bold">{heading}: </span>
                  {text}
                </span>
              )}
              <ChevronUp aria-hidden size={24} strokeWidth={1.75} className={`shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <p className="flex min-h-12 items-center font-display text-base font-bold text-ink">{heading}</p>
          )}
          {open && text && <p id={bodyId} className="text-base leading-snug text-ink">{text}</p>}
        </div>
      </div>
      {open && children}
      {button && open && (
        <button
          type="button"
          onClick={onButton}
          className="mt-3 min-h-12 w-full rounded-2xl bg-ink px-4 text-base font-semibold text-paper active:scale-[.98]"
        >
          {button}
        </button>
      )}
    </section>
  );
}
