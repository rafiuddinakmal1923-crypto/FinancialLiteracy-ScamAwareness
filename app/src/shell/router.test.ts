import { describe, expect, it } from 'vitest';
import { isKnownPath, matchRoute, parseHash, resolveRoute, setRouteTable } from './router';

describe('matchRoute', () => {
  it('matches #/sembang/:id', () => {
    expect(matchRoute('#/sembang/:id', '#/sembang/kerja_sambilan')).toEqual({ id: 'kerja_sambilan' });
    expect(matchRoute('/sembang/:id', '/sembang/abc')).toEqual({ id: 'abc' });
  });

  it('returns null on mismatch', () => {
    expect(matchRoute('#/sembang/:id', '#/sembang')).toBeNull();
    expect(matchRoute('#/sembang/:id', '#/bankku/abc')).toBeNull();
    expect(matchRoute('#/home', '#/home/extra')).toBeNull();
  });

  it('matches static routes and the root', () => {
    expect(matchRoute('#/', '#/')).toEqual({});
    expect(matchRoute('/', '')).toEqual({});
    expect(matchRoute('#/home', '#/home/')).toEqual({});
  });

  it('decodes params', () => {
    expect(matchRoute('/demo/:scene', '/demo/kad%20baru')).toEqual({ scene: 'kad baru' });
  });
});

describe('parseHash', () => {
  it('normalises empty and query-bearing hashes', () => {
    expect(parseHash('')).toBe('/');
    expect(parseHash('#')).toBe('/');
    expect(parseHash('#/home')).toBe('/home');
    expect(parseHash('#/home?x=1')).toBe('/home');
    expect(parseHash('#home')).toBe('/home');
  });
});

describe('resolveRoute', () => {
  const table = [{ pattern: '/' }, { pattern: '/home' }, { pattern: '/demo/:scene' }];
  it('returns the first matching route with params', () => {
    expect(resolveRoute(table, '/demo/s1')).toEqual({ route: table[2], params: { scene: 's1' } });
  });
  it('returns null for unknown paths', () => {
    expect(resolveRoute(table, '/nope')).toBeNull();
  });
});

describe('isKnownPath', () => {
  it('checks the registered table', () => {
    setRouteTable([{ pattern: '/home' }, { pattern: '/sembang/:id' }]);
    expect(isKnownPath('/home')).toBe(true);
    expect(isKnownPath('#/sembang/x')).toBe(true);
    expect(isKnownPath('/kad')).toBe(false);
  });
});
