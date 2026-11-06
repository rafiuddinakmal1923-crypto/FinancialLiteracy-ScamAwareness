import {
  TACTICS, FAMILIES,
  type Tactic, type Family, type Outcome, type Akaun, type Rekod,
  type Effect, type Flag, type UiDirective, type ScenarioMeta,
} from './types';

export class TagError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TagError';
  }
}

const GLOBAL_KEYS = ['id', 'type', 'family', 'tactics', 'contact', 'number', 'ui', 'hint', 'apa_patut'];
const OUTCOMES: readonly Outcome[] = ['scammed', 'mule', 'frozen', 'safe', 'curiga'];
const AKAUN: readonly Akaun[] = ['Aktif', 'Disekat', 'Ditutup'];
const REKOD: readonly Rekod[] = ['Bersih', 'Disiasat', 'Didakwa'];
const LINK_RE = /^[a-z0-9-]+\.test(\/[^\s]*)?$/;
const NUMBER_RE = /^01\d-0000 0\d{3}$/;

function split(tag: string): [string, string] {
  const t = tag.trim();
  const i = t.indexOf(':');
  return i < 0 ? [t, ''] : [t.slice(0, i).trim(), t.slice(i + 1).trim()];
}

function tactic(s: string, tag: string): Tactic {
  if (!(TACTICS as readonly string[]).includes(s)) throw new TagError(`Unknown tactic "${s}" in tag "${tag}"`);
  return s as Tactic;
}

function int(s: string, tag: string): number {
  if (!/^[+-]?\d+$/.test(s)) throw new TagError(`Expected integer in tag "${tag}"`);
  return parseInt(s, 10);
}

function oneOf<T extends string>(s: string, list: readonly T[], tag: string): T {
  if (!(list as readonly string[]).includes(s)) throw new TagError(`Invalid value "${s}" in tag "${tag}"`);
  return s as T;
}

function parseEffect(rest: string, tag: string): Effect {
  const [kind, value] = split(rest);
  switch (kind) {
    case 'duit':
    case 'tekanan':
      return { kind, delta: int(value, tag) };
    case 'akaun':
      return { kind, value: oneOf(value, AKAUN, tag) };
    case 'rekod':
      return { kind, value: oneOf(value, REKOD, tag) };
    default:
      throw new TagError(`Unknown effect in tag "${tag}"`);
  }
}

function parseUi(rest: string, tag: string): UiDirective {
  const [kind, value] = split(rest);
  if (kind === 'transfer') {
    const amount = int(value, tag);
    if (amount <= 0 || value.startsWith('+') || value.startsWith('-')) {
      throw new TagError(`Transfer amount must be a positive integer in tag "${tag}"`);
    }
    return { kind: 'transfer', amount };
  }
  if (kind === 'link') {
    if (!LINK_RE.test(value)) throw new TagError(`Link must be <name>.test/<path> with no scheme in tag "${tag}"`);
    return { kind: 'link', url: value };
  }
  throw new TagError(`Unknown ui directive in tag "${tag}"`);
}

export function parseLineTags(tags: string[]): {
  flags: Flag[]; effects: Effect[]; outcome?: Outcome; missed?: number; ui?: UiDirective;
} {
  const out: ReturnType<typeof parseLineTags> = { flags: [], effects: [] };
  for (const raw of tags) {
    const tag = raw.trim();
    if (!tag) continue;
    const [key, rest] = split(tag);
    if (key === 'ui' && rest === 'call') continue; // global tag repeated by inkjs
    if (GLOBAL_KEYS.includes(key) && key !== 'ui') continue;
    switch (key) {
      case 'flag': {
        const [t, phrase] = split(rest);
        if (!phrase) throw new TagError(`Flag needs a phrase in tag "${tag}"`);
        out.flags.push({ tactic: tactic(t, tag), phrase });
        break;
      }
      case 'effect':
        out.effects.push(parseEffect(rest, tag));
        break;
      case 'outcome':
        out.outcome = oneOf(rest, OUTCOMES, tag);
        break;
      case 'missed': {
        const n = int(rest, tag);
        if (n < 0 || rest.startsWith('-')) throw new TagError(`missed must be non-negative in tag "${tag}"`);
        out.missed = n;
        break;
      }
      case 'ui':
        out.ui = parseUi(rest, tag);
        break;
      default:
        throw new TagError(`Unknown tag "${tag}"`);
    }
  }
  return out;
}

export function parseMeta(globalTags: string[]): ScenarioMeta {
  const m: Partial<ScenarioMeta> & { apaPatut: string[]; ui: 'chat' | 'call' } = { apaPatut: [], ui: 'chat' };
  for (const raw of globalTags) {
    const tag = raw.trim();
    if (!tag) continue;
    const [key, value] = split(tag);
    switch (key) {
      case 'id': m.id = value; break;
      case 'type': m.type = oneOf(value, ['scam', 'legit'] as const, tag); break;
      case 'family': m.family = oneOf<Family>(value, FAMILIES, tag); break;
      case 'tactics':
        m.tactics = value.split(',').map((s) => s.trim()).filter(Boolean).map((s) => tactic(s, tag));
        break;
      case 'contact': m.contact = value; break;
      case 'number':
        if (!NUMBER_RE.test(value)) throw new TagError(`Number must look like 01X-0000 0NNN in tag "${tag}"`);
        m.number = value;
        break;
      case 'ui':
        if (value !== 'call') throw new TagError(`Unknown global ui value in tag "${tag}"`);
        m.ui = 'call';
        break;
      case 'hint': m.hint = value; break;
      case 'apa_patut': m.apaPatut.push(value); break;
      default: throw new TagError(`Unknown global tag "${tag}"`);
    }
  }
  for (const k of ['id', 'type', 'family', 'tactics', 'contact'] as const) {
    if (m[k] === undefined || m[k] === '') throw new TagError(`Missing required global tag "${k}"`);
  }
  return m as ScenarioMeta;
}
