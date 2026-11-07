// W6 Kad Keputusan (FR-85, D40): on the report card, renders ResultCard off screen and turns it into a 1080 × 1350
// PNG with html-to-image (bundled, offline). Shares the file where the phone supports it, else downloads it.
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Share2 } from 'lucide-react';
import { toPng } from 'html-to-image';
import { useT } from '../../shell/i18n';
import { useGame } from '../../state/game';
import { PORTRAIT } from '../../ui/portraits';
import { toast } from '../../ui/Toast';
import { CARD_H, CARD_W, ResultCard } from './ResultCard';
import { useReport } from './useReport';

export const CARD_FILE = 'celik-kad-keputusan.png';

async function dataUrlToFile(url: string): Promise<File> {
  const blob = await (await fetch(url)).blob();
  return new File([blob], CARD_FILE, { type: 'image/png' });
}

/** Waits for every picture in the card, then two frames so layout and fonts settle. */
async function settle(node: HTMLElement): Promise<void> {
  await Promise.all([...node.querySelectorAll('img')].map((img) => img.decode().catch(() => undefined)));
  if (document.fonts?.ready) await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}

export function ShareButton() {
  const t = useT();
  const m = useReport();
  const name = useGame((s) => s.name);
  const character = useGame((s) => s.character);
  const [busy, setBusy] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const make = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // Let the off-screen card mount before drawing it.
      await new Promise((r) => setTimeout(r, 0));
      const node = cardRef.current;
      if (!node) throw new Error('card not mounted');
      await settle(node);
      const url = await toPng(node, { width: CARD_W, height: CARD_H, pixelRatio: 1, cacheBust: false });
      const file = await dataUrlToFile(url).catch(() => null);
      if (file && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: t('kongsi.shareTitle') }).catch(() => undefined);
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = CARD_FILE;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      toast(t('kongsi.done'), 'success');
    } catch {
      toast(t('kongsi.failed'), 'danger');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-slot="ShareButton">
      <button
        type="button"
        onClick={make}
        disabled={busy}
        aria-busy={busy}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-indigo px-4 text-base font-semibold text-paper active:scale-[.98] disabled:opacity-60"
      >
        <Share2 aria-hidden size={22} strokeWidth={1.75} />
        {busy ? t('kongsi.busy') : t('kongsi.button')}
      </button>
      {busy && createPortal(
        <div aria-hidden style={{ position: 'fixed', left: -20000, top: 0, pointerEvents: 'none' }}>
          <ResultCard ref={cardRef} m={m} name={name} portrait={PORTRAIT[character as keyof typeof PORTRAIT] ?? PORTRAIT.aina} />
        </div>,
        document.body,
      )}
    </div>
  );
}
