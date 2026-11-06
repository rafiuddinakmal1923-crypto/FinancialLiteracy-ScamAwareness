import { useSettings } from '../state/settings';
import { useT } from './i18n';

/** "DEMO" mark, top right at 40% opacity, for every screen used in the competition video. */
export function DemoWatermark({ belowStatusBar = false }: { belowStatusBar?: boolean }) {
  const t = useT();
  const demo = useSettings((s) => s.demo);
  if (!demo) return null;
  return (
    <div
      data-testid="demo-watermark"
      aria-hidden="true"
      className={`pointer-events-none absolute right-3 ${belowStatusBar ? 'top-14' : 'top-2'} z-50 select-none rounded-md bg-ink px-2 py-0.5 font-display text-base font-extrabold tracking-wider text-paper opacity-40`}
    >
      {t('watermark')}
    </div>
  );
}
