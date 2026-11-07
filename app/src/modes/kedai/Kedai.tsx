// W3 Kedai Kampus (FR-82, D37): a shelf of items paid from Duit. Cash items open a confirm sheet; an instalment item
// opens Kos Sebenar first and confirms on the way back. Any purchase over BALANCE.kedai.tipAbove ends with a Kancil
// tip that offers Mesin Masa. Prices and terms come from balance.ts; buying is the engine's job (buyItem).
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { shop } from 'virtual:celik-content';
import { BALANCE } from '../../engine/balance';
import { itemPrice } from '../../engine/shop';
import type { ShopItem } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { formatMoney } from '../../ui/format';
import { toast } from '../../ui/Toast';
import { BigBuyTip, ConfirmSheet } from './KedaiSheets';
import { ItemCard } from './ItemCard';
import { KEDAI_PATH, instalmentPresetPath, setPendingInstalment, takePendingInstalment } from './kedaiFlow';

export function Kedai() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const items = shop ?? [];
  const duit = useGame((s) => s.meters.duit);
  const purchases = useGame((s) => s.purchases);
  const [confirm, setConfirm] = useState<ShopItem | null>(null);
  const [bigBuy, setBigBuy] = useState(false);

  useEffect(() => {
    const back = takePendingInstalment(items);
    if (back) setConfirm(back);
  }, [items]);

  const pick = (item: ShopItem) => {
    if (item.effect === 'instalment') {
      setPendingInstalment(item.id);
      navigate(instalmentPresetPath(item.id));
    } else setConfirm(item);
  };

  const buy = (item: ShopItem) => {
    const r = useGame.getState().buyItem(item.id);
    setConfirm(null);
    if ('error' in r) { toast(t(`kedai.error.${r.error}`), 'danger'); return; }
    const name = (lang === 'en' ? item.name.en : undefined) ?? item.name.ms;
    toast(t('kedai.bought', { name }), 'success');
    if ((itemPrice(item.id) ?? 0) > BALANCE.kedai.tipAbove) setBigBuy(true);
  };

  return (
    <div data-screen="kedai" className="relative flex min-h-0 flex-1 flex-col bg-paper">
      <header className="flex items-center gap-1 px-4 pt-1">
        <button type="button" aria-label={t('common.back')} onClick={() => navigate('/home')} className="-ml-2 flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-ink">
          <ArrowLeft aria-hidden size={24} strokeWidth={1.75} />
        </button>
        <div className="min-w-0 pr-16">
          <h1 className="font-display text-xl font-extrabold text-ink">{t('kedai.app')}</h1>
          <p className="text-base font-medium text-ink-soft">{t('kedai.duit', { amount: formatMoney(duit) })}</p>
        </div>
      </header>
      {items.length === 0 ? (
        <p className="mt-6 px-4 text-center text-base text-ink-soft">{t('kedai.empty')}</p>
      ) : (
        <ul aria-label={t('kedai.shelf')} className="mt-3 grid min-h-0 flex-1 auto-rows-min grid-cols-1 gap-3 overflow-y-auto px-4 pb-6 min-[400px]:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <ItemCard item={item} duit={duit} bought={purchases.some((p) => p.item === item.id)} onBuy={() => pick(item)} />
            </li>
          ))}
        </ul>
      )}
      {confirm && (
        <ConfirmSheet
          item={confirm}
          onConfirm={() => buy(confirm)}
          onCancel={() => setConfirm(null)}
          onKos={() => { setPendingInstalment(confirm.id); navigate(instalmentPresetPath(confirm.id)); }}
        />
      )}
      {bigBuy && (
        <BigBuyTip onMesinMasa={() => navigate(`/kalkulator/masa?back=${KEDAI_PATH}`)} onClose={() => setBigBuy(false)} />
      )}
    </div>
  );
}
