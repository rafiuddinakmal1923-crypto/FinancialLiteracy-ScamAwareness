// Build-time content pipeline: compiles content/scenarios/*.ink, validates registered JSON files,
// scans every content file for real brands/URLs/phone numbers (real scheme names only in concepts.json, D27)
// and unmarked rates in concepts.json, and serves the result as the
// virtual module "virtual:celik-content". Any problem throws, failing dev and build.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import type { Plugin } from 'vite';
import { compileScenario } from '../src/engine/compile';
import { CONTENT_FILES, ContentError, parseContent } from '../src/engine/schemas';
import type { CompiledScenario } from '../src/engine/types';

export const VIRTUAL_ID = 'virtual:celik-content';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
const BANNED_FILE = 'banned-names.txt';
/** Real scheme and agency names allowed only in REAL_NAMES_FILE (D27); banned everywhere else. */
export const ALLOWED_FILE = 'allowed-real-names.txt';
export const REAL_NAMES_FILE = 'concepts.json';
const SCANNED_EXT = /\.(ink|json|txt|md)$/i;

/** Named JSON exports of the virtual module, each backed by `<name>.json` in content/. */
export const JSON_EXPORTS = ['tactics', 'cards', 'concepts', 'sindiket', 'drills', 'semester', 'pages'] as const;
export type JsonExport = (typeof JSON_EXPORTS)[number];

export type CelikContent = { scenarios: Record<string, CompiledScenario> } & Record<JsonExport, unknown>;

export interface LoadResult {
  data: CelikContent;
  /** Every file read, for the watch list. */
  files: string[];
  problems: string[];
}

export function readText(path: string): string {
  const s = readFileSync(path, 'utf8');
  return s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

export function readBannedNames(path: string): string[] {
  if (!existsSync(path)) return [];
  return readText(path)
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
}

// Dotted tokens such as "kedai.com.my", "bayar.kurierkilat.test" or "RM1.50"; judged by isRealDomain.
const DOTTED_RE = /[\w-]+(?:\.[\w-]+)+/g;
const URL_ALLOWED = 'semakmule.rmp.gov.my';
const SCHEME_RE = /https?:\/\//gi;
const SCHEME_ALLOWED = /^https:\/\/semakmule\.rmp\.gov\.my\/?(?![\w./-])/i;
// Mobile and landline numbers, with or without +6 / 6 and any of "-", " ", "." between groups.
const PHONE_RE = /(?<![\d+])(?:\+?6)?0\d{1,2}[-\s.]?\d{3,4}[-\s.]?\d{4}(?!\d)/g;
// 1-300 / 1-800 hotlines.
const HOTLINE_RE = /(?<!\d)1[-\s]?[38]00[-\s]?\d{2}[-\s]?\d{4}(?!\d)/g;
const PHONE_ALLOWED = /^01\d-0000 0\d{3}$/;
// NSRC is only allowed right next to 997 ("NSRC 997", "997 (NSRC)").
const NSRC_RE = /(?<![\p{L}\p{N}_])NSRC(?![\p{L}\p{N}_])/giu;
const NSRC_WINDOW = 8;
// Separators inside banned names that writers may vary: spaces, straight/curly apostrophes, hyphens.
const NAME_SEP = /[\s'‘’`-]+/;
const NAME_SEP_RE = "[\\s'\\u2018\\u2019`\\-]*";

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** A dotted token is a real-world domain when a label after the first is alphabetic, unless it is a .test host. */
function isRealDomain(token: string): boolean {
  const t = token.toLowerCase();
  if (t === URL_ALLOWED) return false;
  const labels = t.split('.');
  if (labels[labels.length - 1] === 'test') return false;
  return labels.slice(1).some((l) => /^[a-z]{2,}$/.test(l));
}

function nameRegex(name: string): RegExp {
  const body = name.split(NAME_SEP).filter(Boolean).map(escapeRe).join(NAME_SEP_RE);
  return new RegExp(`(?<![\\p{L}\\p{N}_])${body}(?![\\p{L}\\p{N}_])`, 'giu');
}

function lineOf(text: string, index: number): number {
  let n = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

/** Returns one problem string per real-world URL, scheme, phone number or banned name in `text`. */
export function scanText(text: string, file: string, banned: string[]): string[] {
  const problems: string[] = [];
  const add = (index: number, what: string, found: string) =>
    problems.push(`${file}:${lineOf(text, index)}: ${what} "${found}"`);

  for (const m of text.matchAll(SCHEME_RE)) {
    if (!SCHEME_ALLOWED.test(text.slice(m.index))) add(m.index, 'URL scheme not allowed (use name.test/path)', m[0]);
  }
  for (const m of text.matchAll(DOTTED_RE)) {
    if (isRealDomain(m[0])) add(m.index, 'real-looking domain not allowed (use name.test/path)', m[0]);
  }
  for (const m of text.matchAll(PHONE_RE)) {
    if (!PHONE_ALLOWED.test(m[0])) add(m.index, 'phone number not allowed (use 01X-0000 0NNN)', m[0]);
  }
  for (const m of text.matchAll(HOTLINE_RE)) add(m.index, 'hotline number not allowed', m[0]);
  for (const m of text.matchAll(NSRC_RE)) {
    const around = text.slice(Math.max(0, m.index - NSRC_WINDOW), m.index + m[0].length + NSRC_WINDOW);
    if (!around.includes('997')) add(m.index, 'NSRC is only allowed together with 997', m[0]);
  }
  for (const name of banned) {
    for (const m of text.matchAll(nameRegex(name))) add(m.index, `real name "${name}" not allowed`, m[0]);
  }
  return problems;
}

/**
 * The names banned in the content file at `relPath` (relative to content/, "/" separated): allowlisted real
 * names are lifted only in concepts.json and are banned everywhere else, even if banned-names.txt misses them.
 */
export function namesFor(relPath: string, banned: string[], allowed: string[]): string[] {
  if (relPath === REAL_NAMES_FILE) {
    const lift = new Set(allowed.map((n) => n.toLowerCase()));
    return banned.filter((n) => !lift.has(n.toLowerCase()));
  }
  const have = new Set(banned.map((n) => n.toLowerCase()));
  return [...banned, ...allowed.filter((n) => !have.has(n.toLowerCase()))];
}

// A percentage figure such as "5%", "4.5 %" or "30%".
const PERCENT_RE = /\d(?:[.,]\d+)?\s?%/;

/**
 * CLAUDE.md rule 11: every object in `data` that holds a `rate` field or a string with a % figure must carry
 * `"verify": "TODO-VERIFY"` or a non-empty `source`. Returns one problem per unmarked object, with its path.
 */
export function rateMarkerProblems(data: unknown, file: string): string[] {
  const problems: string[] = [];
  const visit = (node: unknown, path: string[]): void => {
    if (Array.isArray(node)) {
      node.forEach((v, i) => visit(v, [...path, String(i)]));
      return;
    }
    if (!node || typeof node !== 'object') return;
    const o = node as Record<string, unknown>;
    const hasFigure = 'rate' in o || Object.values(o).some((v) => typeof v === 'string' && PERCENT_RE.test(v));
    const marked = o.verify === 'TODO-VERIFY' || (typeof o.source === 'string' && o.source.trim() !== '');
    if (hasFigure && !marked) {
      problems.push(`${file}: ${path.join('.') || '(root)'} has a rate or % figure without "verify": "TODO-VERIFY" or a "source"`);
    }
    for (const [k, v] of Object.entries(o)) visit(v, [...path, k]);
  };
  visit(data, []);
  return problems;
}

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}

function message(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

/** Loads, compiles, validates and scans everything in `contentDir`. Never throws on content problems. */
export function loadCelikContent(contentDir: string): LoadResult {
  const dir = resolve(contentDir);
  const files = listFiles(dir);
  const problems: string[] = [];
  const banned = readBannedNames(join(dir, BANNED_FILE));
  const allowed = readBannedNames(join(dir, ALLOWED_FILE));
  const rel = (p: string) => relative(dir, p).split(sep).join('/');

  for (const f of files) {
    const r = rel(f);
    if (r === BANNED_FILE || r === ALLOWED_FILE || !SCANNED_EXT.test(f)) continue;
    problems.push(...scanText(readText(f), r, namesFor(r, banned, allowed)));
  }

  const conceptsPath = join(dir, REAL_NAMES_FILE);
  if (existsSync(conceptsPath)) {
    try {
      problems.push(...rateMarkerProblems(JSON.parse(readText(conceptsPath)), REAL_NAMES_FILE));
    } catch {
      // Invalid JSON is reported once, by the schema step below.
    }
  }

  const scenarios: Record<string, CompiledScenario> = {};
  const scenarioDir = join(dir, 'scenarios');
  for (const f of files.filter((p) => p.startsWith(scenarioDir + sep) && p.endsWith('.ink'))) {
    try {
      const c = compileScenario(readText(f), rel(f));
      if (scenarios[c.meta.id]) problems.push(`${rel(f)}: duplicate scenario id "${c.meta.id}"`);
      scenarios[c.meta.id] = c;
    } catch (e) {
      problems.push(e instanceof ContentError ? e.message : `${rel(f)}: ${message(e)}`);
    }
  }

  const data = { scenarios } as CelikContent;
  for (const name of JSON_EXPORTS) {
    const fileName = `${name}.json`;
    const schema = CONTENT_FILES[fileName];
    const path = join(dir, fileName);
    data[name] = null;
    if (!schema || !existsSync(path)) continue;
    try {
      data[name] = parseContent(schema, JSON.parse(readText(path)), fileName);
    } catch (e) {
      problems.push(e instanceof ContentError ? e.message : `${fileName}: ${message(e)}`);
    }
  }

  return { data, files, problems };
}

/** Source code for the virtual module. */
export function generateModule(data: CelikContent): string {
  const lines = [`export const scenarios = ${JSON.stringify(data.scenarios)};`];
  for (const name of JSON_EXPORTS) lines.push(`export const ${name} = ${JSON.stringify(data[name] ?? null)};`);
  return lines.join('\n') + '\n';
}

function fail(problems: string[]): never {
  throw new ContentError(`Content check failed (${problems.length}):\n  ${problems.join('\n  ')}`);
}

export function celikContent(options: { contentDir?: string } = {}): Plugin {
  let contentDir = options.contentDir ? resolve(options.contentDir) : '';
  let cached: LoadResult | null = null;

  const load = (): LoadResult => (cached ??= loadCelikContent(contentDir));
  const inContent = (p: string) => resolve(p).startsWith(contentDir + sep);

  return {
    name: 'celik-content',
    configResolved(config) {
      if (!contentDir) contentDir = resolve(config.root, '..', 'content');
    },
    buildStart() {
      // Vitest also runs this config; content tests cover the same checks there.
      if (process.env.VITEST) return;
      cached = null;
      const r = load();
      for (const f of r.files) this.addWatchFile(f);
      if (r.problems.length) fail(r.problems);
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return undefined;
      const r = load();
      for (const f of r.files) this.addWatchFile(f);
      if (r.problems.length) fail(r.problems);
      return generateModule(r.data);
    },
    configureServer(server) {
      server.watcher.add(contentDir);
      const onChange = (path: string) => {
        if (!inContent(path)) return;
        cached = null;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', onChange);
      server.watcher.on('change', onChange);
      server.watcher.on('unlink', onChange);
    },
  };
}
