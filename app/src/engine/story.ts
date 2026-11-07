import { Story } from 'inkjs';
import { parseLineTags } from './tags';
import type { ChatMessage, CompiledScenario, Effect, Flag, Outcome, ScenarioMeta, TrailStep, UiDirective } from './types';

export type StoryStep =
  | { kind: 'line'; speaker: string | null; text: string; flags: Flag[]; effects: Effect[]; ui?: UiDirective }
  | { kind: 'choices'; choices: { index: number; text: string }[] }
  | { kind: 'end'; outcome: Outcome; missed?: number };

type LineStep = Extract<StoryStep, { kind: 'line' }>;

export function splitSpeaker(raw: string): { speaker: string | null; text: string } {
  const i = raw.indexOf(': ');
  if (i > 0) {
    const prefix = raw.slice(0, i);
    if (!prefix.includes('.test')) return { speaker: prefix.trim(), text: raw.slice(i + 2).trim() };
  }
  return { speaker: null, text: raw.trim() };
}

/** Wraps the inkjs runtime into a typed stream of lines, choices and one final end step. */
export class StoryRunner {
  readonly meta: ScenarioMeta;
  readonly transcript: LineStep[] = [];
  private readonly story: Story;
  private readonly id: string;
  private outcome?: Outcome;
  private missed?: number;
  private ended?: StoryStep;
  private pending?: StoryStep;

  constructor(s: CompiledScenario) {
    this.meta = s.meta;
    this.id = s.meta.id;
    this.story = new Story(s.json);
  }

  next(): StoryStep {
    if (this.ended) return this.ended;
    if (this.pending) return this.pending;
    const story = this.story;
    while (story.canContinue) {
      const raw = story.Continue() ?? '';
      const tags = [...(story.currentTags ?? [])];
      const parsed = parseLineTags(tags);
      if (parsed.outcome) this.outcome = parsed.outcome;
      if (parsed.missed !== undefined) this.missed = parsed.missed;
      if (!raw.trim() && tags.length === 0) continue;
      const { speaker, text } = splitSpeaker(raw);
      const step: LineStep = { kind: 'line', speaker, text, flags: parsed.flags, effects: parsed.effects };
      if (parsed.ui) step.ui = parsed.ui;
      this.transcript.push(step);
      return step;
    }
    if (story.currentChoices.length > 0) {
      this.pending = {
        kind: 'choices',
        choices: story.currentChoices.map((c, i) => ({ index: i, text: c.text })),
      };
      return this.pending;
    }
    if (!this.outcome) throw new Error(`Scenario "${this.id}" ended without an outcome tag`);
    const end: StoryStep = { kind: 'end', outcome: this.outcome };
    if (this.missed !== undefined) end.missed = this.missed;
    this.ended = end;
    return end;
  }

  /**
   * Hands the result of a `ui:` pause (Hantar TAC / page button = true, Batal / close = false) to the ink as
   * the global `ui_ok`, so a scenario can branch on it. A no-op when the story does not declare `VAR ui_ok`.
   */
  setUiResult(ok: boolean): void {
    const vars = this.story.variablesState;
    if (vars.GlobalVariableExistsWithName('ui_ok')) vars.$('ui_ok', ok);
  }

  choose(index: number): void {
    const p = this.pending;
    if (!p || p.kind !== 'choices') throw new Error('No choices are pending');
    if (!Number.isInteger(index) || index < 0 || index >= p.choices.length) {
      throw new Error(`Choice index ${index} out of range (0-${p.choices.length - 1})`);
    }
    this.story.ChooseChoiceIndex(index);
    this.pending = undefined;
  }
}

/**
 * Rebuilds the chat a player saw from the path they took, without touching the meters. The trail holds choice
 * indexes, so it replays in any language version of the scenario. Stops early if the trail runs out.
 */
export function replayTranscript(s: CompiledScenario, trail: readonly TrailStep[]): ChatMessage[] {
  const runner = new StoryRunner(s);
  const steps = [...trail];
  const out: ChatMessage[] = [];
  const push = (m: Omit<ChatMessage, 'id'>) => out.push({ ...m, id: out.length + 1 });
  for (;;) {
    const step = runner.next();
    if (step.kind === 'end') return out;
    if (step.kind === 'choices') {
      const next = steps.shift();
      if (!next || !('c' in next)) return out;
      const choice = step.choices.find((c) => c.index === next.c);
      if (!choice) return out;
      runner.choose(choice.index);
      push({ from: 'me', speaker: null, text: choice.text, flags: [] });
      continue;
    }
    if (step.text !== '') {
      push({ from: step.speaker !== null ? 'them' : 'system', speaker: step.speaker, text: step.text, flags: step.flags });
    }
    if (step.ui) {
      const next = steps.shift();
      if (!next || !('u' in next)) return out;
      runner.setUiResult(next.u);
    }
  }
}
