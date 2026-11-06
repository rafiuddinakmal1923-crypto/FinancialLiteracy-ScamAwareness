// Hash router: '#/home', '#/sembang/:id'. Pure helpers are unit-tested; useRoute subscribes to hashchange.
import { useSyncExternalStore } from 'react';

function clean(p: string): string[] {
  const path = p.replace(/^#/, '').split('?')[0];
  return path.split('/').filter(Boolean);
}

/** '#/home?x=1' -> '/home'; '' or '#' -> '/'. */
export function parseHash(hash: string): string {
  return '/' + clean(hash).join('/');
}

/** Params for `pattern` ('/sembang/:id', '#' optional) against `path`, or null when it does not match. */
export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const ps = clean(pattern);
  const xs = clean(path);
  if (ps.length !== xs.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < ps.length; i++) {
    if (ps[i].startsWith(':')) {
      let v = xs[i];
      try { v = decodeURIComponent(v); } catch { /* keep raw */ }
      params[ps[i].slice(1)] = v;
    } else if (ps[i] !== xs[i]) {
      return null;
    }
  }
  return params;
}

/** First route in `table` whose pattern matches `path`. */
export function resolveRoute<T extends { pattern: string }>(
  table: readonly T[], path: string,
): { route: T; params: Record<string, string> } | null {
  for (const route of table) {
    const params = matchRoute(route.pattern, path);
    if (params) return { route, params };
  }
  return null;
}

/** '#/x?a=1&b=a%20b' -> { a: '1', b: 'a b' } (Kalkulator presets); {} when there is no query. */
export function parseQuery(hash: string): Record<string, string> {
  const i = hash.indexOf('?');
  const out: Record<string, string> = {};
  if (i < 0) return out;
  for (const part of hash.slice(i + 1).split('&')) {
    if (!part) continue;
    const [k, v = ''] = part.split('=');
    try { out[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' ')); } catch { out[k] = v; }
  }
  return out;
}

/** The hash a path maps to, keeping its query string ('/kalkulator/kos?preset=x' -> '#/kalkulator/kos?preset=x'). */
function toHash(path: string): string {
  const i = path.indexOf('?');
  return '#' + parseHash(path) + (i < 0 ? '' : path.slice(i));
}

export function navigate(path: string): void {
  const target = toHash(path);
  if (window.location.hash !== target) window.location.hash = target;
}

/** Swaps the current history entry (used for redirects so Back does not bounce). */
export function replaceRoute(path: string): void {
  const target = toHash(path);
  if (window.location.hash === target) return;
  history.replaceState(history.state, '', target);
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

let table: readonly { pattern: string }[] = [];

/** Registers the app's route table (shell/routes.tsx) so useRoute() and isKnownPath() can see it. */
export function setRouteTable(t: readonly { pattern: string }[]): void {
  table = t;
}

/** True when some registered route matches `path` (tiles use it to decide between navigating and a toast). */
export function isKnownPath(path: string): boolean {
  return resolveRoute(table, parseHash(path)) !== null;
}

function subscribe(cb: () => void): () => void {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

const currentHash = () => window.location.hash;

/** Current path, the params of the registered route that matches it, and the query string's values. */
export function useRoute(): { path: string; params: Record<string, string>; query: Record<string, string> } {
  const hash = useSyncExternalStore(subscribe, currentHash, () => '');
  const path = parseHash(hash);
  return { path, params: resolveRoute(table, path)?.params ?? {}, query: parseQuery(hash) };
}
