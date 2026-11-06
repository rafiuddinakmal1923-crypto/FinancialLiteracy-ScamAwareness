import neutral from '../../../assets/kancil-neutral.svg';
import smile from '../../../assets/kancil-smile.svg';
import worried from '../../../assets/kancil-worried.svg';
import proud from '../../../assets/kancil-proud.svg';
import shocked from '../../../assets/kancil-shocked.svg';
import { useT } from '../shell/i18n';

export type KancilMood = 'neutral' | 'smile' | 'worried' | 'proud' | 'shocked';

const SRC: Record<KancilMood, string> = { neutral, smile, worried, proud, shocked };

/** Sang Kancil, the coach. `size` is the width in px (height is 1.1x). Pass decorative when text nearby names him. */
export function Kancil({ mood = 'neutral', size = 96, decorative = false, className = '' }: {
  mood?: KancilMood; size?: number; decorative?: boolean; className?: string;
}) {
  const t = useT();
  return (
    <img
      src={SRC[mood]}
      width={size}
      height={Math.round(size * 1.1)}
      alt={decorative ? '' : t(`kancil.alt.${mood}`)}
      draggable={false}
      className={`select-none ${className}`}
    />
  );
}
