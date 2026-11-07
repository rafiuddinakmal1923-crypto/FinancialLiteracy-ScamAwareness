// Shared by the post-chat screens (Consequence, FlagHunt, Debrief): the ended scenario from the store, the
// redirect when there is none, and the consequence template lookup.
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { scenarios } from 'virtual:celik-content';
import { isRight } from '../../engine/meters';
import type { CompiledScenario, EndedScenario, Outcome } from '../../engine/types';
import type { Vars } from '../../shell/i18n';
import { replaceRoute } from '../../shell/router';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { localScenario, localTranscript } from './localScenario';
import type { TimelineStep, TimelineTone } from '../../ui/ConsequenceTimeline';

export const MAX_STEPS = 5;

/** Safe for right calls (safe, untung), amber for "too suspicious" and a poor money choice, danger for losses and debt. */
export function outcomeTone(o: Outcome): TimelineTone {
  return isRight(o) ? 'safe' : o === 'curiga' || o === 'rugi' ? 'warning' : 'danger';
}

/**
 * Consequence steps from the copy keys `<prefix>.<n>.{icon,time,text}` (prefix defaults to `akibat.<outcome>`;
 * see consequenceBase; n = 1..5, stops at the first
 * missing text). A step whose text still has an unfilled `{var}` (e.g. no `missed` amount) is left out.
 */
export function consequenceSteps(
  t: (key: string, vars?: Vars) => string, outcome: Outcome, vars: Vars, prefix = `akibat.${outcome}`,
): TimelineStep[] {
  const out: TimelineStep[] = [];
  for (let n = 1; n <= MAX_STEPS; n++) {
    const base = `${prefix}.${n}`;
    const text = t(`${base}.text`, vars);
    if (text === `${base}.text`) break;
    if (/\{\w+\}/.test(text)) continue;
    out.push({ icon: t(`${base}.icon`), time: t(`${base}.time`), text });
  }
  return out;
}

/**
 * The ended scenario for route `id`, or null (then it redirects to Sembang). Call `leave(fn)` around actions
 * that clear `lastEnded` and navigate away, so the redirect does not race the navigation.
 */
export function useEnded(id: string): { ended: EndedScenario | null; scenario: CompiledScenario | null; leave(fn: () => void): void } {
  const ended = useGame((s) => (s.lastEnded?.id === id ? s.lastEnded : null));
  const lang = useSettings((s) => s.lang);
  const base = scenarios[id];
  const scenario = base ? localScenario(base, lang) : null;
  const transcript = useMemo(
    () => (ended && scenario ? localTranscript(scenario, ended.trail, ended.transcript) : []),
    [ended, scenario],
  );
  const leaving = useRef(false);
  const ok = !!ended && !!scenario;
  useEffect(() => {
    if (!ok && !leaving.current) replaceRoute('/sembang');
  }, [ok]);
  const leave = useCallback((fn: () => void) => {
    leaving.current = true;
    fn();
  }, []);
  const localEnded = useMemo(() => (ended ? { ...ended, transcript } : null), [ended, transcript]);
  return { ended: ok ? localEnded : null, scenario: ok ? scenario : null, leave };
}

/**
 * Copy prefix for a consequence: a scenario's own variant `akibat.<id>.<outcome>` when it has a title (e.g.
 * sewa_akaun's early report, a `frozen` that followed the right action), otherwise `akibat.<outcome>`.
 */
export function consequenceBase(t: (key: string) => string, id: string, outcome: Outcome): string {
  const variant = `akibat.${id}.${outcome}`;
  return t(`${variant}.title`) === `${variant}.title` ? `akibat.${outcome}` : variant;
}

const TONES: readonly TimelineTone[] = ['danger', 'safe', 'warning'];

/** A variant may soften its tone with `<prefix>.tone` (danger, safe or warning); otherwise outcomeTone. */
export function consequenceTone(t: (key: string) => string, prefix: string, outcome: Outcome): TimelineTone {
  const tone = t(`${prefix}.tone`) as TimelineTone;
  return TONES.includes(tone) ? tone : outcomeTone(outcome);
}
