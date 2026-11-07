// W7 Tonton (FR-86, D41): the concept's explainer inside Kad Ilmu, as a frame player. Tap the picture or Seterusnya
// to step; Main plays the frames on a timer. Reduced motion swaps the slide for an instant change. No video or audio.
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play, Clapperboard } from 'lucide-react';
import { explainers } from 'virtual:celik-content';
import type { Concept } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { useSettings } from '../../state/settings';
import { FRAME_URL } from './frames';

/** How long each frame shows while playing. */
export const FRAME_MS = 3500;

export function ExplainerSlot({ concept }: { concept: Concept }) {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const reduced = useSettings((s) => s.reducedMotion);
  const ex = explainers?.find((e) => e.concept === concept);
  const frames = (ex?.frames ?? []).filter((f) => FRAME_URL[f.svg]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const last = frames.length - 1;

  useEffect(() => {
    if (!playing) return;
    if (i >= last) { setPlaying(false); return; }
    const id = setTimeout(() => setI((n) => Math.min(n + 1, last)), FRAME_MS);
    return () => clearTimeout(id);
  }, [playing, i, last]);

  if (!ex || frames.length === 0) return null;
  const frame = frames[i];
  const caption = (lang === 'en' ? frame.caption.en : undefined) ?? frame.caption.ms;
  const go = (n: number) => { setI(Math.max(0, Math.min(last, n))); };
  const toggle = () => {
    if (playing) { setPlaying(false); return; }
    if (i >= last) setI(0);
    setPlaying(true);
  };

  return (
    <section data-slot="ExplainerSlot" data-concept={concept} aria-labelledby={`tonton-${ex.id}`} className="mt-4 rounded-[24px] bg-white p-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
      <h2 id={`tonton-${ex.id}`} className="flex items-center gap-2 font-display text-lg font-extrabold text-ink">
        <Clapperboard aria-hidden size={22} strokeWidth={1.75} className="shrink-0 text-kancil" />
        {t('tonton.title')}
      </h2>
      <button
        type="button"
        onClick={() => { setPlaying(false); go(i < last ? i + 1 : 0); }}
        aria-label={t('tonton.tapNext')}
        className="mt-3 block w-full overflow-hidden rounded-2xl bg-paper"
      >
        <img
          key={frame.svg}
          src={FRAME_URL[frame.svg]}
          alt=""
          width={300}
          height={200}
          draggable={false}
          className={`aspect-[3/2] w-full ${reduced ? 'animate-[fade-in_150ms_ease-in-out]' : 'animate-[fade-in_250ms_ease-in-out]'}`}
        />
      </button>
      <p aria-live="polite" className="mt-3 min-h-[3.25rem] text-base leading-snug text-ink">{caption}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <button type="button" onClick={() => { setPlaying(false); go(i - 1); }} disabled={i === 0} aria-label={t('tonton.prev')} className="flex h-12 w-12 items-center justify-center rounded-full text-ink ring-1 ring-inset ring-ink/20 disabled:opacity-40">
          <ChevronLeft aria-hidden size={24} strokeWidth={1.75} />
        </button>
        <div className="flex flex-1 flex-col items-center gap-1">
          <button type="button" onClick={toggle} className="flex min-h-12 items-center gap-2 rounded-full bg-ink px-5 text-base font-semibold text-paper active:scale-[.98]">
            {playing ? <Pause aria-hidden size={20} strokeWidth={2} /> : <Play aria-hidden size={20} strokeWidth={2} />}
            {t(playing ? 'tonton.pause' : i >= last ? 'tonton.replay' : 'tonton.play')}
          </button>
          <span className="font-mono text-base font-semibold text-ink-soft">{t('tonton.counter', { n: i + 1, total: frames.length })}</span>
        </div>
        <button type="button" onClick={() => { setPlaying(false); go(i + 1); }} disabled={i === last} aria-label={t('tonton.next')} className="flex h-12 w-12 items-center justify-center rounded-full text-ink ring-1 ring-inset ring-ink/20 disabled:opacity-40">
          <ChevronRight aria-hidden size={24} strokeWidth={1.75} />
        </button>
      </div>
    </section>
  );
}
