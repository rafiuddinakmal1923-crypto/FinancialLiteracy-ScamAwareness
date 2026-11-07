// Build-time only: compiles a scenario .ink file and validates it. Not imported by the app bundle.
import { Compiler } from 'inkjs/compiler/Compiler';
import { Story } from 'inkjs';
import { ContentError } from './schemas';
import { splitSpeaker } from './story';
import { parseLineTags, parseMeta, TagError } from './tags';
import {
  OUTCOMES_BY_TYPE, rightOutcomes, wrongOutcomes, type CompiledScenario, type Flag, type Outcome, type Tactic,
} from './types';

/** Finance right calls and wrong calls (SDS 5.4), derived from types.ts like isRight. */
const FINANCE_RIGHT = rightOutcomes('finance');
const FINANCE_WRONG = wrongOutcomes('finance');

/** One line of output on a path through a scenario. */
export interface WalkLine { text: string; tags: string[] }
/** One complete path: the choice indexes taken and every line shown. */
export interface WalkPath { choices: number[]; lines: WalkLine[] }

const MAX_DEPTH = 50;
/** The longest speaker name; a longer prefix before ": " is a narration line split by mistake. */
const MAX_SPEAKER = 30;

function stripBom(s: string): string {
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function baseName(file: string): string {
  return (file.split(/[\\/]/).pop() ?? file).replace(/\.ink$/, '');
}

function tagErr<T>(file: string, where: string, fn: () => T): T {
  try {
    return fn();
  } catch (e) {
    if (e instanceof TagError) throw new ContentError(`${file}: ${e.message}${where ? ` (${where})` : ''}`);
    throw e;
  }
}

/** True for a line that pauses for a ui overlay (`ui:transfer`, `ui:link`, `ui:calc`). */
const isUiPause = (tags: string[]) => tags.some((t) => /^\s*ui\s*:/.test(t) && t.trim() !== 'ui:call');

/**
 * Walks every path through a compiled story with a depth-first search. The story state is saved
 * before each choice and restored for the next sibling. A ui pause in a story that declares `VAR ui_ok`
 * forks too: once as Hantar TAC / the page's button (true), once as Batal (false), so both branches are checked.
 * Throws ContentError past `limit` paths.
 */
export function walkScenario(json: string, limit = 200): WalkPath[] {
  const story = new Story(json);
  const paths: WalkPath[] = [];
  const hasUiOk = story.variablesState.GlobalVariableExistsWithName('ui_ok');

  const visit = (choices: number[], lines: WalkLine[]): void => {
    const here = [...lines];
    while (story.canContinue) {
      const text = (story.Continue() ?? '').trim();
      const tags = [...(story.currentTags ?? [])];
      if (text || tags.length) here.push({ text, tags });
      if (hasUiOk && isUiPause(tags)) {
        const saved = story.state.ToJson();
        for (const ok of [true, false]) {
          story.state.LoadJson(saved);
          story.variablesState.$('ui_ok', ok);
          visit(choices, here);
        }
        return;
      }
    }
    const options = story.currentChoices;
    if (options.length === 0) {
      if (paths.length >= limit) throw new ContentError(`too many paths (more than ${limit})`);
      paths.push({ choices, lines: here });
      return;
    }
    if (choices.length >= MAX_DEPTH) {
      throw new ContentError(`path deeper than ${MAX_DEPTH} choices (loop?) after choices [${choices.join(',')}]`);
    }
    for (const c of options) {
      if (c.tags && c.tags.length) {
        throw new ContentError(`tags are not allowed on choices ("${c.text}"); put them on the last content line`);
      }
    }
    const saved = story.state.ToJson();
    for (let i = 0; i < options.length; i++) {
      story.state.LoadJson(saved);
      story.ChooseChoiceIndex(i);
      visit([...choices, i], here);
    }
  };

  visit([], []);
  return paths;
}

/** Every path through a compiled scenario with the outcome its lines carry. */
export function enumeratePaths(json: string, limit = 200): { outcome?: Outcome; choices: number[] }[] {
  return walkScenario(json, limit).map((p) => {
    let outcome: Outcome | undefined;
    for (const line of p.lines) {
      const o = parseLineTags(line.tags).outcome;
      if (o) outcome = o;
    }
    return { outcome, choices: p.choices };
  });
}

/** Compiles one scenario and checks it against the content rules (SDS 4.2, D14-D16, D23, D29). */
export function compileScenario(source: string, file: string): CompiledScenario {
  // No CompilerOptions: giving a sourceFilename makes inkjs demand a FileHandler.
  const compiler = new Compiler(stripBom(source));
  let json: string;
  try {
    json = compiler.Compile().ToJson() as string;
  } catch (e) {
    const errs = compiler.errors.length ? compiler.errors : [(e as Error).message];
    throw new ContentError(`${file}: ink compile failed:\n  ${errs.join('\n  ')}`);
  }
  if (compiler.errors.length) {
    throw new ContentError(`${file}: ink compile failed:\n  ${compiler.errors.join('\n  ')}`);
  }

  const meta = tagErr(file, 'global tags', () => parseMeta(new Story(json).globalTags ?? []));
  const expectedId = baseName(file);
  if (meta.id !== expectedId) {
    throw new ContentError(`${file}: id "${meta.id}" must match the file name "${expectedId}"`);
  }

  let paths: WalkPath[];
  try {
    paths = walkScenario(json);
  } catch (e) {
    if (e instanceof ContentError) throw new ContentError(`${file}: ${e.message}`);
    throw e;
  }

  // A narration line with ": " would be split into a speaker and a bubble (see splitSpeaker).
  for (const path of paths) {
    for (const line of path.lines) {
      const { speaker } = splitSpeaker(line.text);
      if (speaker !== null && speaker.length > MAX_SPEAKER) {
        throw new ContentError(`${file}: narration must not contain ": " ("${line.text}"); it would show as a speaker`);
      }
    }
  }

  const flags: Flag[] = [];
  const seen = new Set<string>();
  const outcomes = new Set<Outcome>();

  for (const path of paths) {
    const route = `choices [${path.choices.join(',')}]`;
    let outcome: Outcome | undefined;
    path.lines.forEach((line, i) => {
      const parsed = tagErr(file, `line "${line.text}"`, () => parseLineTags(line.tags));
      for (const f of parsed.flags) {
        if (!line.text.includes(f.phrase)) {
          throw new ContentError(`${file}: flag phrase "${f.phrase}" is not in its line "${line.text}"`);
        }
        const key = `${f.tactic}|${f.phrase}`;
        if (!seen.has(key)) {
          seen.add(key);
          flags.push(f);
        }
      }
      if (parsed.outcome) {
        if (outcome) throw new ContentError(`${file}: more than one outcome on path ${route}`);
        if (i !== path.lines.length - 1) {
          throw new ContentError(`${file}: outcome must be on the last line of a branch ("${line.text}", ${route})`);
        }
        outcome = parsed.outcome;
      }
    });
    if (!outcome) throw new ContentError(`${file}: path ${route} ends without an outcome tag`);
    if (!OUTCOMES_BY_TYPE[meta.type].includes(outcome)) {
      throw new ContentError(
        `${file}: outcome "${outcome}" is not allowed in a ${meta.type} scenario (${route}); use ${OUTCOMES_BY_TYPE[meta.type].join(', ')}`,
      );
    }
    outcomes.add(outcome);
  }

  if (meta.type === 'scam') {
    const flagged = new Set<Tactic>(flags.map((f) => f.tactic));
    const missing = meta.tactics.filter((t) => !flagged.has(t));
    if (missing.length) {
      throw new ContentError(`${file}: tactics listed but never flagged: ${missing.join(', ')}`);
    }
    if (!outcomes.has('safe')) throw new ContentError(`${file}: a scam scenario needs at least one safe path`);
  } else if (meta.type === 'legit') {
    for (const need of ['safe', 'curiga'] as const) {
      if (!outcomes.has(need)) throw new ContentError(`${file}: a legit scenario needs a ${need} path`);
    }
  } else {
    if (!FINANCE_RIGHT.some((o) => outcomes.has(o))) {
      throw new ContentError(`${file}: a finance scenario needs at least one right path (${FINANCE_RIGHT.join(' or ')})`);
    }
    if (!FINANCE_WRONG.some((o) => outcomes.has(o))) {
      throw new ContentError(`${file}: a finance scenario needs at least one wrong path (${FINANCE_WRONG.join(', ')})`);
    }
  }

  return { meta, json, flags };
}

/** False for the global tags on the first line: those are compared as metadata, and hint and apa_patut are translated. */
const isLineTag = (tag: string) => !/^s*(id|type|family|tactics|concepts|contact|number|hint|apa_patut)s*:|^s*uis*:s*(call|chat)s*$/.test(tag);

/** A tag with the translated part removed: a flag keeps its tactic only, the rest must match exactly. */
function neutralTag(tag: string): string {
  const t = tag.trim();
  const m = /^flag\s*:\s*([^:]+):/.exec(t);
  return m ? `flag:${m[1].trim()}` : t;
}

/**
 * Checks that an English scenario is the same game as its BM original: same metadata, same paths through it, and
 * on every path the same lines with the same tags (the same effects, outcomes and flag tactics). Only the words
 * may differ. Saved games store choice indexes, so a mismatch here would break replay and scoring.
 */
export function scenarioParityProblems(ms: CompiledScenario, en: CompiledScenario, file: string): string[] {
  const out: string[] = [];
  const a = ms.meta;
  const b = en.meta;
  for (const k of ['type', 'family', 'ui', 'number'] as const) {
    if (a[k] !== b[k]) out.push(`${file}: ${k} is "${b[k]}", BM has "${a[k]}"`);
  }
  for (const k of ['tactics', 'concepts'] as const) {
    if (a[k].join() !== b[k].join()) out.push(`${file}: ${k} differ from the BM file`);
  }
  if (a.apaPatut.length !== b.apaPatut.length) out.push(`${file}: ${b.apaPatut.length} apa_patut lines, BM has ${a.apaPatut.length}`);
  if (!!a.hint !== !!b.hint) out.push(`${file}: hint is on one version only`);
  if (a.contact && !b.contact) out.push(`${file}: contact is missing`);

  const flagKeys = (s: CompiledScenario) => s.flags.map((f) => f.tactic).join();
  if (flagKeys(ms) !== flagKeys(en)) out.push(`${file}: flags differ, [${flagKeys(en)}] vs BM [${flagKeys(ms)}]`);

  const pa = walkScenario(ms.json);
  const pb = walkScenario(en.json);
  if (pa.length !== pb.length) {
    out.push(`${file}: ${pb.length} paths, BM has ${pa.length}`);
    return out;
  }
  pa.forEach((p, i) => {
    const q = pb[i];
    const route = `choices [${p.choices.join(',')}]`;
    if (p.choices.join() !== q.choices.join()) { out.push(`${file}: path ${i} takes other choices than BM ${route}`); return; }
    if (p.lines.length !== q.lines.length) { out.push(`${file}: ${route} has ${q.lines.length} lines, BM has ${p.lines.length}`); return; }
    p.lines.forEach((l, j) => {
      const m = q.lines[j];
      const ta = l.tags.filter(isLineTag).map(neutralTag).join(' | ');
      const tb = m.tags.filter(isLineTag).map(neutralTag).join(' | ');
      if (ta !== tb) out.push(`${file}: ${route} line ${j + 1} tags "${tb}", BM has "${ta}"`);
      if ((splitSpeaker(l.text).speaker === null) !== (splitSpeaker(m.text).speaker === null)) {
        out.push(`${file}: ${route} line ${j + 1} ("${m.text}") must match BM on having a speaker`);
      }
    });
  });
  return out;
}
