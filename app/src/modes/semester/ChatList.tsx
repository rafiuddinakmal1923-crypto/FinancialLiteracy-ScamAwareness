import { ArrowLeft, Search } from 'lucide-react';
import { scenarios } from 'virtual:celik-content';
import { StoryRunner } from '../../engine/story';
import type { CompiledScenario } from '../../engine/types';
import { useT } from '../../shell/i18n';
import { navigate } from '../../shell/router';
import { useGame } from '../../state/game';
import { Avatar } from '../../ui/Avatar';

/** The scenario on offer until the week logic (Task 20) decides availability. */
export const FIRST_SCENARIO = 'kerja_sambilan';

const previews = new Map<string, string>();

/** First non-empty line of a scenario, used as the "last message" preview. */
export function previewOf(s: CompiledScenario): string {
  const cached = previews.get(s.meta.id);
  if (cached !== undefined) return cached;
  const r = new StoryRunner(s);
  let text = '';
  for (let step = r.next(); step.kind === 'line'; step = r.next()) {
    if (step.text) { text = step.text; break; }
  }
  previews.set(s.meta.id, text);
  return text;
}

/** Chats to list: finished and started scenarios plus the one on offer; unplayed first. */
export function chatIds(results: { id: string }[], activeId: string | null, available: string[] = [FIRST_SCENARIO]): string[] {
  const played = [...results.map((r) => r.id)].reverse();
  const ids = [...available, ...(activeId ? [activeId] : []), ...played];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const s = scenarios[id];
    if (!s || s.meta.ui !== 'chat' || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  const unread = (id: string) => !played.includes(id) && id !== activeId;
  return [...out.filter(unread), ...out.filter((id) => !unread(id))];
}

function ChatRow({ id, unread }: { id: string; unread: boolean }) {
  const t = useT();
  const { meta } = scenarios[id];
  // Unknown numbers show the number, never a made-up name.
  const name = meta.contact || meta.number || '';
  const sub = meta.contact && meta.number ? meta.number : null;
  return (
    <li>
      <button
        type="button"
        onClick={() => navigate(`/sembang/${id}`)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-150 active:bg-indigo-soft/60"
      >
        <Avatar name={name} size={52} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline justify-between gap-2">
            <span className={`truncate text-base text-ink ${unread ? 'font-bold' : 'font-semibold'}`}>{name}</span>
            <span className={`shrink-0 text-base ${unread ? 'font-semibold text-indigo' : 'text-ink-soft'}`}>
              {t(unread ? 'sembang.time.new' : 'sembang.time.old')}
            </span>
          </span>
          {sub && <span className="block truncate text-base text-ink-soft">{sub}</span>}
          <span className="mt-0.5 flex items-center gap-2">
            <span className={`line-clamp-1 flex-1 text-base ${unread ? 'text-ink' : 'text-ink-soft'}`}>{previewOf(scenarios[id])}</span>
            {unread && (
              <span className="flex shrink-0 items-center">
                <span aria-hidden="true" className="h-3 w-3 rounded-full bg-kancil ring-2 ring-kancil-soft" />
                <span className="sr-only">{t('sembang.unread')}</span>
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  );
}

/** S05: Sembang chat list. */
export function ChatList() {
  const t = useT();
  const results = useGame((s) => s.results);
  const activeId = useGame((s) => s.active?.id ?? null);
  const ids = chatIds(results, activeId);
  const played = new Set(results.map((r) => r.id));
  return (
    <div data-screen="sembang" className="flex flex-1 flex-col pb-6">
      <div className="flex items-center gap-1 px-4 pt-1">
        <button
          type="button"
          aria-label={t('common.back')}
          onClick={() => navigate('/home')}
          className="-ml-2 flex h-12 w-12 items-center justify-center rounded-full text-ink"
        >
          <ArrowLeft aria-hidden size={24} strokeWidth={1.75} />
        </button>
        <h1 className="font-display text-2xl font-bold text-ink">{t('app.sembang')}</h1>
      </div>

      {/* Decorative search bar: there is nothing to search yet, and no free-text inputs are allowed. */}
      <div aria-hidden="true" className="mx-4 mt-2 flex h-12 items-center gap-2 rounded-full bg-indigo-soft px-4 text-ink-soft">
        <Search size={20} strokeWidth={1.75} />
        <span className="text-base">{t('sembang.search')}</span>
      </div>

      {ids.length === 0 ? (
        <p className="px-6 py-10 text-center text-base text-ink-soft">{t('sembang.empty')}</p>
      ) : (
        <ul aria-label={t('sembang.listLabel')} className="mt-3 divide-y divide-indigo-soft">
          {ids.map((id) => <ChatRow key={id} id={id} unread={!played.has(id) && id !== activeId} />)}
        </ul>
      )}
    </div>
  );
}
