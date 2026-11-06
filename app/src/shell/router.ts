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

export function navigate(path: string): void {
  const target = '#' + parseHash(path);
  if (window.location.hash !== target) window.location.hash = target;
}

/** Swaps the current history entry (used for redirects so Back does not bounce). */
export function replaceRoute(path: string): void {
  const target = '#' + parseHash(path);
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

/** Current path and the params of the registered route that matches it. */
export function useRoute(): { path: string; params: Record<string, string> } {
  const hash = useSyncExternalStore(subscribe, currentHash, () => '');
  const path = parseHash(hash);
  return { path, params: resolveRoute(table, path)?.params ?? {} };
}
