// The language version of a scenario, and of a chat already played in it.
import { replayTranscript } from '../../engine/story';
import type { ChatMessage, CompiledScenario, TrailStep } from '../../engine/types';
import type { Lang } from '../../shell/i18n';

/** The scenario in `lang`; EN falls back to BM when it has no English version. */
export function localScenario(s: CompiledScenario, lang: Lang): CompiledScenario {
  return lang === 'en' && s.en ? s.en : s;
}

/**
 * A played chat in the language of `scenario`, rebuilt from the path taken. Older saves have no trail, and a trail
 * that no longer fits the content gives nothing back: those keep the words they were played in.
 */
export function localTranscript(
  scenario: CompiledScenario, trail: readonly TrailStep[] | undefined, stored: ChatMessage[],
): ChatMessage[] {
  if (!trail) return stored;
  const rebuilt = replayTranscript(scenario, trail);
  return rebuilt.length ? rebuilt : stored;
}
