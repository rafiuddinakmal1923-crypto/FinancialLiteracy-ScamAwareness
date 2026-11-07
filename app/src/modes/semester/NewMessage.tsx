// The notification a chat scenario arrives with: "Mesej baru dari <contact>" for a moment, then the chat opens.
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { scenarios } from 'virtual:celik-content';
import sembang from '../../../../assets/app-sembang.svg';
import { BALANCE } from '../../engine/balance';
import { useT } from '../../shell/i18n';
import { replaceRoute } from '../../shell/router';
import { useSettings } from '../../state/settings';
import { Avatar } from '../../ui/Avatar';
import { previewOf } from './ChatList';
import { localScenario } from './localScenario';
import { scenarioPath } from './loop';

/** Route /semester/mesej/:id. Tapping the banner opens the chat at once; otherwise it opens after BALANCE.loop.bannerMs. */
export function NewMessage({ params }: { params: Record<string, string> }) {
  const t = useT();
  const id = params.id ?? '';
  const lang = useSettings((x) => x.lang);
  const s = scenarios[id];
  useEffect(() => {
    if (!s) { replaceRoute('/home'); return; }
    const timer = setTimeout(() => replaceRoute(scenarioPath(id)), BALANCE.loop.bannerMs);
    return () => clearTimeout(timer);
  }, [id, s]);
  if (!s) return null;
  const local = localScenario(s, lang);
  const { meta } = local;
  const name = meta.contact || meta.number || '';
  return (
    <div data-screen="mesej" className="songket flex min-h-0 flex-1 flex-col bg-indigo px-4 pt-6">
      <motion.button
        type="button"
        onClick={() => replaceRoute(scenarioPath(id))}
        initial={{ y: -48, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 26 }}
        className="flex min-h-16 w-full items-center gap-3 rounded-[20px] bg-white p-3 text-left shadow-[0_8px_24px_rgba(0,0,0,.3)]"
      >
        <img src={sembang} alt="" width={40} height={40} className="h-10 w-10 shrink-0" draggable={false} />
        <span className="min-w-0 flex-1">
          <span className="block text-base text-ink-soft">{t('loop.banner.app')}</span>
          <span className="block truncate font-display text-base font-extrabold text-ink">{t('loop.banner.title', { name })}</span>
          <span className="block truncate text-base text-ink-soft">{previewOf(local)}</span>
        </span>
        <Avatar name={name} size={40} />
      </motion.button>
      <p className="mt-4 text-center text-base text-paper/80">{t('loop.banner.open')}</p>
    </div>
  );
}
