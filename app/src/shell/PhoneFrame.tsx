import type { ReactNode } from 'react';
import { ToastHost } from '../ui/Toast';
import type { KancilMood } from '../ui/Kancil';
import { DemoWatermark } from './DemoWatermark';
import { MetersPanel, TipPanel } from './SidePanels';
import { StatusBar } from './StatusBar';

/**
 * Below 768 px: the screen fills the viewport, no frame.
 * 768-1279 px: a 390 x 844 phone frame centred on the desk.
 * 1280 px and up: the frame plus SidePanels (Kancil tip left, live meters right).
 */
export function PhoneFrame({ children, statusBar = null, tipKey, mood = 'neutral', bg = 'bg-paper' }: {
  children: ReactNode; statusBar?: 'dark' | 'light' | null; tipKey: string; mood?: KancilMood; bg?: string;
}) {
  return (
    <div className="desk min-h-dvh w-full md:flex md:items-center md:justify-center md:gap-12 md:p-6">
      <TipPanel tipKey={tipKey} mood={mood} />
      <div
        className={`relative flex h-dvh w-full flex-col overflow-hidden ${bg} md:box-content md:h-[844px] md:w-[390px] md:shrink-0 md:rounded-[48px] md:border-[10px] md:border-ink md:shadow-[0_24px_60px_rgba(0,0,0,.35)]`}
      >
        {statusBar && (
          <div className={statusBar === 'dark' ? 'bg-indigo' : ''}>
            <StatusBar tone={statusBar} />
          </div>
        )}
        <div className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">{children}</div>
        <DemoWatermark belowStatusBar={statusBar !== null} />
        <ToastHost />
      </div>
      <MetersPanel />
    </div>
  );
}
