// Plays one ink scenario as a chat: typing delays, bubbles, reply choices, ui pauses, hint. On the end it
// records the outcome and transcript in the store (lastEnded); ChatThread then offers "Lihat apa jadi seterusnya".
import { useCallback, useEffect, useRef, useState } from 'react';
import { scenarios } from 'virtual:celik-content';
import { BALANCE } from '../../engine/balance';
import { StoryRunner } from '../../engine/story';
import type { ChatMessage, Outcome, ScenarioMeta, UiDirective } from '../../engine/types';
import { useGame, type CalcResume, type TrailStep } from '../../state/game';
import { useSettings } from '../../state/settings';
import { localScenario } from './localScenario';

export type { ChatMessage };

export interface ScenarioOptions {
  /** Waits `ms` before an incoming line (tests pass their own). Default: setTimeout. */
  delay?: (ms: number) => Promise<void>;
  /** 0..1 source for the typing delay. Default: Math.random. */
  random?: () => number;
}

export interface ScenarioView {
  meta: ScenarioMeta;
  messages: ChatMessage[];
  choices: { index: number; text: string }[] | null;
  typing: boolean;
  choose(i: number): void;
  ended: { outcome: Outcome; missed?: number } | null;
  hint(): string | null;
  pendingUi: UiDirective | null;
  resolveUi(ok: boolean): void;
  /** Opens the Kalkulator: remembers the path so far so the chat is rebuilt at this point on return (also after a reload). */
  suspend(): void;
}

/** Reduced motion shortens typing pauses to this share of the normal delay. */
const REDUCED_TYPING = 0.3;

const sleep = (ms: number) => new Promise<void>((resolve) => { setTimeout(resolve, ms); });

/** Typing pause before an incoming line: min + r x (max - min), x0.3 with reduced motion. */
export function typingDelay(r: number, reduced: boolean): number {
  const { minMs, maxMs } = BALANCE.typing;
  const ms = minMs + r * (maxMs - minMs);
  return reduced ? ms * REDUCED_TYPING : ms;
}

export function useScenario(id: string, opts?: ScenarioOptions): ScenarioView {
  const lang = useSettings((s) => s.lang);
  const base = scenarios[id];
  if (!base) throw new Error(`Unknown scenario "${id}"`);
  const compiled = localScenario(base, lang);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [choices, setChoices] = useState<{ index: number; text: string }[] | null>(null);
  const [typing, setTyping] = useState(false);
  const [ended, setEnded] = useState<{ outcome: Outcome; missed?: number } | null>(null);
  const [pendingUi, setPendingUi] = useState<UiDirective | null>(null);

  const optsRef = useRef(opts);
  optsRef.current = opts;
  const runnerRef = useRef<StoryRunner | null>(null);
  /** Bumped on every (re)mount; a pump whose generation is stale stops. */
  const genRef = useRef(0);
  /** True from a tap on a chip until the story offers the next choices (double-tap guard). */
  const choosingRef = useRef(false);
  const pendingChoicesRef = useRef<{ index: number; text: string }[] | null>(null);
  const uiResolverRef = useRef<(() => void) | null>(null);
  const hintUsedRef = useRef(false);
  const nextIdRef = useRef(1);
  /** Mirror of `messages` for the transcript handed to the store on the end. */
  const logRef = useRef<ChatMessage[]>([]);
  /** Replies and ui results so far, to rebuild the chat after the Kalkulator. */
  const trailRef = useRef<TrailStep[]>([]);
  /** While set, the pump replays this path instantly (no typing pauses) instead of waiting for the player. */
  const replayRef = useRef<{ trail: TrailStep[]; returned: boolean } | null>(null);

  const push = useCallback((m: Omit<ChatMessage, 'id'>) => {
    const msg = { ...m, id: nextIdRef.current++ };
    logRef.current = [...logRef.current, msg];
    setMessages(logRef.current);
  }, []);

  /** Advances the story until it needs the player (choices, ui) or ends. */
  const pump = useCallback(async (gen: number) => {
    const runner = runnerRef.current;
    if (!runner) return;
    const live = () => genRef.current === gen;
    const { apply } = useGame.getState();
    while (live()) {
      const step = runner.next();
      const replay = replayRef.current;
      if (step.kind === 'choices' && replay) {
        const next = replay.trail[0];
        if (next && 'c' in next) {
          replay.trail.shift();
          const choice = step.choices.find((c) => c.index === next.c);
          if (choice) {
            runner.choose(choice.index);
            trailRef.current = [...trailRef.current, next];
            push({ from: 'me', speaker: null, text: choice.text, flags: [] });
            continue;
          }
        }
        replayRef.current = null;
      }
      if (step.kind === 'choices') {
        pendingChoicesRef.current = step.choices;
        choosingRef.current = false;
        setChoices(step.choices);
        return;
      }
      if (step.kind === 'end') {
        const end: { outcome: Outcome; missed?: number } = { outcome: step.outcome };
        if (step.missed !== undefined) end.missed = step.missed;
        setEnded(end);
        useGame.getState().endScenario({ id, ...end, transcript: logRef.current, trail: trailRef.current });
        return;
      }
      if (step.text !== '') {
        if (step.speaker !== null && replayRef.current) {
          push({ from: 'them', speaker: step.speaker, text: step.text, flags: step.flags });
        } else if (step.speaker !== null) {
          const o = optsRef.current;
          const ms = typingDelay((o?.random ?? Math.random)(), useSettings.getState().reducedMotion);
          setTyping(true);
          await (o?.delay ?? sleep)(ms);
          if (!live()) return;
          setTyping(false);
          push({ from: 'them', speaker: step.speaker, text: step.text, flags: step.flags });
        } else {
          push({ from: 'system', speaker: null, text: step.text, flags: step.flags });
        }
      }
      // BankKu logs each Duit change under the scenario contact (S08); the BM name is stored and shown translated.
      if (step.effects.length) apply(step.effects, base.meta.contact || base.meta.number);
      if (step.ui && replayRef.current) {
        const rp = replayRef.current;
        const next = rp.trail[0];
        if (next && 'u' in next) {
          rp.trail.shift();
          trailRef.current = [...trailRef.current, next];
          runnerRef.current?.setUiResult(next.u);
          continue;
        }
        // The end of the recorded path: the pause the chat left from.
        replayRef.current = null;
        if (rp.returned) {
          trailRef.current = [...trailRef.current, { u: true }];
          runnerRef.current?.setUiResult(true);
          useGame.getState().calcDone();
          continue;
        }
      }
      if (step.ui) {
        const ui = step.ui;
        setPendingUi(ui);
        await new Promise<void>((resolve) => { uiResolverRef.current = resolve; });
        if (!live()) return;
        setPendingUi(null);
      }
    }
  }, [id, push, base]);

  useEffect(() => {
    const gen = ++genRef.current;
    runnerRef.current = new StoryRunner(compiled);
    choosingRef.current = false;
    pendingChoicesRef.current = null;
    uiResolverRef.current = null;
    hintUsedRef.current = false;
    nextIdRef.current = 1;
    logRef.current = [];
    trailRef.current = [];
    const saved: CalcResume | null = useGame.getState().calcResume;
    replayRef.current = saved && saved.id === id ? { trail: [...saved.trail], returned: saved.returned } : null;
    setMessages([]);
    setChoices(null);
    setTyping(false);
    setEnded(null);
    setPendingUi(null);
    useGame.getState().startScenario(id);
    void pump(gen);
    return () => {
      genRef.current++;
      const resolve = uiResolverRef.current;
      uiResolverRef.current = null;
      resolve?.();
    };
  }, [id, pump, compiled]);

  const choose = useCallback((i: number) => {
    const runner = runnerRef.current;
    const pending = pendingChoicesRef.current;
    if (choosingRef.current || !runner || !pending) return;
    const choice = pending.find((c) => c.index === i);
    if (!choice) return;
    choosingRef.current = true;
    pendingChoicesRef.current = null;
    runner.choose(i);
    trailRef.current = [...trailRef.current, { c: i }];
    setChoices(null);
    push({ from: 'me', speaker: null, text: choice.text, flags: [] });
    void pump(genRef.current);
  }, [pump, push]);

  /**
   * Ends a ui pause: ok = Hantar TAC / the page's button, false = Batal / close. The ink sees it as `ui_ok` and
   * decides the branch (and any money moved, through its effect tags); BankKu never changes the meters itself.
   */
  const resolveUi = useCallback((ok: boolean) => {
    const resolve = uiResolverRef.current;
    uiResolverRef.current = null;
    if (!resolve) return;
    runnerRef.current?.setUiResult(ok);
    trailRef.current = [...trailRef.current, { u: ok }];
    setPendingUi(null);
    resolve();
  }, []);

  const hint = useCallback((): string | null => {
    const text = compiled.meta.hint;
    if (!text || hintUsedRef.current) return null;
    hintUsedRef.current = true;
    return useGame.getState().useHint() ? text : null;
  }, [compiled]);

  const suspend = useCallback(() => {
    useGame.getState().calcOpen({ id, family: compiled.meta.family, trail: trailRef.current });
  }, [id, compiled]);

  return { meta: compiled.meta, messages, choices, typing, choose, ended, hint, pendingUi, resolveUi, suspend };
}
