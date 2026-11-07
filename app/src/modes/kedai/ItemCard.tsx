import { Check } from 'lucide-react';
import { itemPrice } from '../../engine/shop';
import type { ShopItem } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { useSettings } from '../../state/settings';
import { formatMoney } from '../../ui/format';
import { instalmentTerms } from './terms';

const POT_KEY = { keperluan: 'dompet.pot.needs', kehendak: 'dompet.pot.wants' } as const;

/** One shelf item: name, price (or instalment terms), pot and tip. Buy is disabled when Duit is short (SDS 5.9). */
export function ItemCard({ item, duit, bought, onBuy }: { item: ShopItem; duit: number; bought: boolean; onBuy: () => void }) {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const name = (lang === 'en' ? item.name.en : undefined) ?? item.name.ms;
  const tip = (lang === 'en' ? item.tip.en : undefined) ?? item.tip.ms;
  const price = itemPrice(item.id);
  const terms = instalmentTerms(item.id);
  const short = !terms && price !== null && price > duit;
  const titleId = `kedai-${item.id}-name`;
  return (
    <article data-item={item.id} aria-labelledby={titleId} className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(28,27,58,.08)]">
      <div className="flex items-start justify-between gap-2">
        <h2 id={titleId} className="font-display text-base font-bold leading-snug text-ink">{name}</h2>
        <span className="shrink-0 rounded-full bg-indigo-soft px-2.5 py-0.5 text-base font-medium text-indigo">{t(POT_KEY[item.pot])}</span>
      </div>
      <p className="mt-1 font-mono text-lg font-semibold text-ink">
        {terms ? t('kedai.perMonth', { monthly: formatMoney(terms.monthly), months: terms.months }) : price !== null ? formatMoney(price) : '-'}
      </p>
      <p className="mt-1 flex-1 text-base leading-snug text-ink-soft">{tip}</p>
      {bought ? (
        <p className="mt-3 flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-safe-soft text-base font-semibold text-ink">
          <Check aria-hidden size={20} strokeWidth={2} className="text-safe" />
          {t('kedai.boughtTag')}
        </p>
      ) : (
        <>
          <button
            type="button"
            onClick={onBuy}
            disabled={short || price === null}
            className="mt-3 min-h-12 rounded-xl bg-ink px-3 text-base font-semibold text-paper active:scale-[.98] disabled:bg-ink/30 disabled:text-ink"
          >
            {terms ? t('kedai.buyInstalment') : t('kedai.buy')}
          </button>
          {short && <p className="mt-1 text-center text-base font-medium text-ink-soft">{t('kedai.short')}</p>}
        </>
      )}
    </article>
  );
}
