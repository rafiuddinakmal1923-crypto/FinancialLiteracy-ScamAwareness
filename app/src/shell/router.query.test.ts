// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { navigate, parseHash, parseQuery, replaceRoute } from './router';

describe('query strings (Kalkulator presets)', () => {
  it('parseQuery reads ?a=1&b=x from a hash', () => {
    expect(parseQuery('#/kalkulator/pulangan?preset=naga30w&x=a%20b')).toEqual({ preset: 'naga30w', x: 'a b' });
    expect(parseQuery('#/home')).toEqual({});
    expect(parseQuery('')).toEqual({});
  });

  it('navigate and replaceRoute keep the query part; the path still matches without it', () => {
    navigate('/kalkulator/kos?preset=bayar1000');
    expect(window.location.hash).toBe('#/kalkulator/kos?preset=bayar1000');
    expect(parseHash(window.location.hash)).toBe('/kalkulator/kos');
    expect(parseQuery(window.location.hash)).toEqual({ preset: 'bayar1000' });
    replaceRoute('/kalkulator/masa?preset=labur50');
    expect(window.location.hash).toBe('#/kalkulator/masa?preset=labur50');
  });
});
