// Where a post's Semak leads (FR-81): the Kalkulator with the post's numbers, or the post's Kad Ilmu.
import type { FeedPost } from '../../engine/types';

export const SUAPAN_PATH = '/suapan';

/** The route Semak opens. Kalkulator presets come back to the feed with `back=`. */
export function semakPath(post: FeedPost): string {
  return 'calc' in post.semak
    ? `/kalkulator?preset=${encodeURIComponent(post.semak.calc)}&back=${SUAPAN_PATH}`
    : `/kad/ilmu/${post.semak.kad}`;
}
