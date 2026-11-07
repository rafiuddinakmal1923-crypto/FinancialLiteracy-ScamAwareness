// A fake in-game web page (`ui:link:<name>.test/<path>`), drawn inside the phone with a browser bar and the
// SIMULASI banner. Content comes from content/pages.json by host; fields are pre-filled fake data, read-only.
// The page's button resolves true (via the BankKu TAC screen when `asksTac`); closing or Batal resolves false.
import { useRef, useState } from 'react';
import { Globe, X } from 'lucide-react';
import { pages } from 'virtual:celik-content';
import type { Localized } from '../../engine/schemas';
import { useT, type Lang } from '../../shell/i18n';
import { useSettings } from '../../state/settings';
import { SimulasiBanner } from '../../ui/SimulasiBanner';
import { TacScreen, useOnce } from './BankKu';

/** Page text in the current language; EN falls back to MS. */
function loc(l: Localized, lang: Lang): string {
  return (lang === 'en' ? l.en : undefined) ?? l.ms;
}

/** "kurierkilat-bayar.test/alamat" -> "kurierkilat-bayar.test". */
export function hostOf(url: string): string {
  return url.split('/')[0]!.toLowerCase();
}

export function FakePage({ url, onDone }: { url: string; onDone(ok: boolean): void }) {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const page = pages?.[hostOf(url)] ?? null;
  const finish = useOnce(onDone);
  const [tac, setTac] = useState(false);
  const pressed = useRef(false);

  if (tac) return <TacScreen seed={url} finish={finish} />;

  const press = () => {
    if (pressed.current || !page) return;
    pressed.current = true;
    if (page.asksTac) setTac(true);
    else finish(true);
  };

  return (
    <div data-screen="fakepage" className="flex min-h-0 flex-1 flex-col bg-white">
      {/* Browser bar: close, then the address (no scheme, no padlock: nothing here says "safe"). */}
      <div className="flex min-h-16 shrink-0 items-center gap-1 border-b border-indigo-soft bg-indigo-soft/60 py-2 pl-1 pr-20">
        <button
          type="button"
          aria-label={t('fakepage.close')}
          onClick={() => finish(false)}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-ink"
        >
          <X aria-hidden size={24} strokeWidth={1.75} />
        </button>
        <p aria-label={t('fakepage.address')} className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl bg-white px-3 py-2 ring-1 ring-indigo-soft">
          <Globe aria-hidden size={18} strokeWidth={1.75} className="shrink-0 text-ink-soft" />
          {/* Never truncated: the full address is the clue. */}
          <span className="min-w-0 break-words text-base leading-snug text-ink">
            {url.split('/').map((part, i) => (i === 0 ? part : <span key={i}>/<wbr />{part}</span>))}
          </span>
        </p>
      </div>
      <SimulasiBanner />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-5">
        {page ? (
          <>
            <h2 className="font-display text-[22px] font-extrabold leading-tight text-ink">{loc(page.title, lang)}</h2>
            <p className="mt-2 text-base leading-relaxed text-ink">{loc(page.body, lang)}</p>
            {page.fields.length > 0 && (
              <dl className="mt-4 flex flex-col gap-3">
                {page.fields.map((f, i) => (
                  <div key={i}>
                    <dt className="text-base font-medium text-ink-soft">{loc(f.label, lang)}</dt>
                    <dd className="mt-1 rounded-xl border border-dashed border-ink-soft/50 bg-paper px-3 py-2.5 font-mono text-base font-semibold text-ink">
                      {typeof f.value === 'string' ? f.value : loc(f.value, lang)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center pt-10 text-center">
            <Globe aria-hidden size={48} strokeWidth={1.5} className="text-ink-soft" />
            <h2 className="mt-3 font-display text-xl font-bold text-ink">{t('fakepage.notFound.title')}</h2>
            <p className="mt-2 max-w-[30ch] text-base leading-snug text-ink-soft">{t('fakepage.notFound.body')}</p>
          </div>
        )}
      </div>
      {page && (
        <div className="shrink-0 border-t border-indigo-soft px-5 pb-4 pt-3">
          <button
            type="button"
            onClick={press}
            className="min-h-12 w-full rounded-xl bg-indigo px-4 text-base font-semibold text-paper active:scale-[.98]"
          >
            {loc(page.button, lang)}
          </button>
        </div>
      )}
    </div>
  );
}
