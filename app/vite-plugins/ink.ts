// Build-time content pipeline: compiles content/scenarios/*.ink, validates registered JSON files,
// scans every content file for real brands/URLs/phone numbers, and serves the result as the
// virtual module "virtual:celik-content". Any problem throws, failing dev and build.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, relative, resolve, sep } from 'node:path';
import type { Plugin } from 'vite';
import { compileScenario } from '../src/engine/compile';
import { CONTENT_FILES, ContentError, parseContent } from '../src/engine/schemas';
import type { CompiledScenario } from '../src/engine/types';

export const VIRTUAL_ID = 'virtual:celik-content';
const RESOLVED_ID = '\0' + VIRTUAL_ID;
const BANNED_FILE = 'banned-names.txt';
const SCANNED_EXT = /\.(ink|json|txt|md)$/i;

/** Named JSON exports of the virtual module, each backed by `<name>.json` in content/. */
export const JSON_EXPORTS = ['tactics', 'cards', 'sindiket', 'drills', 'semester', 'pages'] as const;
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

const URL_RE = /\b[\w-]+\.(?!test\b)[a-z]{2,}(?:\.[a-z]{2,})*\b/g;
const URL_ALLOWED = new Set(['semakmule.rmp.gov.my']);
const SCHEME_RE = /https?:\/\//gi;
const PHONE_RE = /\b0\d{1,2}-?\d{3,4}\s?\d{4}\b/g;
const PHONE_ALLOWED = /^01\d-0000 0\d{3}$/;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

  for (const m of text.matchAll(SCHEME_RE)) add(m.index, 'URL scheme not allowed (use name.test/path)', m[0]);
  for (const m of text.matchAll(URL_RE)) {
    if (!URL_ALLOWED.has(m[0])) add(m.index, 'real-looking domain not allowed (use name.test/path)', m[0]);
  }
  for (const m of text.matchAll(PHONE_RE)) {
    if (!PHONE_ALLOWED.test(m[0])) add(m.index, 'phone number not allowed (use 01X-0000 0NNN)', m[0]);
  }
  for (const name of banned) {
    const body = name.split(/\s+/).map(escapeRe).join('\\s+');
    const re = new RegExp(`(?<![\\p{L}\\p{N}_])${body}(?![\\p{L}\\p{N}_])`, 'giu');
    for (const m of text.matchAll(re)) add(m.index, `real brand "${name}" not allowed`, m[0]);
  }
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
  const rel = (p: string) => relative(dir, p).split(sep).join('/');

  for (const f of files) {
    if (basename(f) === BANNED_FILE || !SCANNED_EXT.test(f)) continue;
    problems.push(...scanText(readText(f), rel(f), banned));
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
