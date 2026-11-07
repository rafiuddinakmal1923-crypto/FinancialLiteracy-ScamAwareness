import { useEffect, useRef, type ReactNode } from 'react';
import { itemPrice } from '../../engine/shop';
import type { ShopItem } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { useSettings } from '../../state/settings';
import { CoachSheet } from '../../ui/CoachSheet';
import { formatMoney } from '../../ui/format';
import { instalmentTerms } from './terms';

const POT_KEY = { keperluan: 'dompet.pot.needs', kehendak: 'dompet.pot.wants' } as const;
const BTN_SOFT = 'min-h-12 rounded-2xl bg-white px-3 text-base font-semibold text-ink ring-1 ring-inset ring-ink/25 active:scale-[.98]';
const BTN_MAIN = 'min-h-12 rounded-2xl bg-ink px-3 text-base font-semibold text-paper active:scale-[.98]';

function Modal({ label, onClose, children }: { label: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return <div role="dialog" aria-modal="true" aria-label={label} className="absolute inset-0 z-30 flex flex-col justify-end bg-ink/40">{children}</div>;
}

/** Confirm sheet. An instalment item leads with what it really costs in total (FR-82). */
export function ConfirmSheet({ item, onConfirm, onCancel, onKos }: {
  item: ShopItem; onConfirm: () => void; onCancel: () => void; onKos: () => void;
}) {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { cancelRef.current?.focus(); }, []);
  const name = (lang === 'en' ? item.name.en : undefined) ?? item.name.ms;
  const price = itemPrice(item.id) ?? 0;
  const terms = instalmentTerms(item.id);
  const title = t('kedai.confirm.title', { name });
  return (
    <Modal label={title} onClose={onCancel}>
      <CoachSheet mood={terms ? 'worried' : 'neutral'} tone={terms ? 'warning' : 'tip'} title={title}>
        {terms ? (
          <div className="mt-1 flex flex-col gap-1 text-base leading-snug text-ink">
            <p className="font-semibold">{t('kedai.confirm.total', { total: formatMoney(terms.total) })}</p>
            <p>{t('kedai.confirm.terms', { monthly: formatMoney(terms.monthly), months: terms.months, cash: formatMoney(price), extra: formatMoney(terms.total - price) })}</p>
            <button type="button" onClick={onKos} className="mt-1 min-h-12 self-start text-base font-semibold text-indigo underline underline-offset-4">
              {t('kedai.confirm.kos')}
            </button>
          </div>
        ) : (
          <p className="mt-1 text-base leading-snug text-ink">
            {t('kedai.confirm.cash', { price: formatMoney(price), pot: t(POT_KEY[item.pot]) })}
          </p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button ref={cancelRef} type="button" onClick={onCancel} className={BTN_SOFT}>{t('kedai.confirm.cancel')}</button>
          <button type="button" onClick={onConfirm} className={BTN_MAIN}>{t('kedai.confirm.ok')}</button>
        </div>
      </CoachSheet>
    </Modal>
  );
}

/** After a purchase over BALANCE.kedai.tipAbove: Sang Kancil offers Mesin Masa (FR-82). */
export function BigBuyTip({ onMesinMasa, onClose }: { onMesinMasa: () => void; onClose: () => void }) {
  const t = useT();
  const title = t('kedai.kancil.title');
  return (
    <Modal label={title} onClose={onClose}>
      <CoachSheet mood="smile" title={title} text={t('kedai.kancil.text')}>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={onClose} className={BTN_SOFT}>{t('kedai.kancil.close')}</button>
          <button type="button" onClick={onMesinMasa} className={BTN_MAIN}>{t('kedai.kancil.go')}</button>
        </div>
      </CoachSheet>
    </Modal>
  );
}
