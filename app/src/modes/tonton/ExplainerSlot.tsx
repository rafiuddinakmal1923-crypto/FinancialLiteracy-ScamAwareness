// Placeholder slot from the A1 contracts; Wafi replaces it (W7).
import type { Concept } from '../../engine/types';
import { useT } from '../../shell/i18n';

export function ExplainerSlot({ concept }: { concept: Concept }) {
  const t = useT();
  return <p data-slot="ExplainerSlot" data-concept={concept} className="mt-4 rounded-2xl bg-white px-4 py-2 text-center text-base text-ink-soft">{t('common.comingSoon')}</p>;
}
