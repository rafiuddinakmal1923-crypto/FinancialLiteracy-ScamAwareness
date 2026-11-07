import { describe, expect, it } from 'vitest';
import { WEEKS } from './weeks';
import { afterIntroPath, canBeginWeek, homeTile, nextStep, scenarioPath, withBanner, type LoopState } from './loop';

const base: LoopState = { week: 0, budget: true, weekIntroOpen: false, lastEnded: null, active: null, results: [] };
const done = (upTo: number): { id: string }[] => WEEKS.slice(0, upTo).filter((w) => w.scenario).map((w) => ({ id: w.scenario! }));
const at = (week: number, over: Partial<LoopState> = {}): LoopState => ({ ...base, week, results: done(week - 1), ...over });

describe('scenarioPath', () => {
  it('chat scenarios open in Sembang, the call in the call screen', () => {
    expect(scenarioPath('kerja_sambilan')).toBe('/sembang/kerja_sambilan');
    expect(scenarioPath('panggilan_mahkamah')).toBe('/panggilan/panggilan_mahkamah');
  });
  it('withBanner puts the "Mesej baru" banner in front of a chat only', () => {
    expect(withBanner('/sembang/x')).toBe('/semester/mesej/x');
    expect(withBanner('/panggilan/x')).toBe('/panggilan/x');
  });
});

describe('afterIntroPath for all 12 weeks', () => {
  it('every scenario week goes to its scenario', () => {
    for (const w of WEEKS) {
      if (w.scenario) expect(afterIntroPath(w.week), `week ${w.week}`).toBe(scenarioPath(w.scenario));
    }
  });
  it('week 11 is the incoming call, week 7 the reflection, week 12 the report', () => {
    expect(afterIntroPath(11)).toBe('/panggilan/panggilan_mahkamah');
    expect(afterIntroPath(7)).toBe('/semester/cuti');
    expect(afterIntroPath(12)).toBe('/semester/rapor');
  });
});

describe('nextStep', () => {
  it('budget unset -> Dompet', () => {
    expect(nextStep({ ...base, budget: false })).toBe('/dompet');
  });
  it('before week 1 -> the first week intro', () => {
    expect(nextStep(base)).toBe('/semester/minggu');
  });
  it('an open intro stays on the intro', () => {
    expect(nextStep(at(4, { weekIntroOpen: true }))).toBe('/semester/minggu');
  });
  it('intro closed, scenario not played -> the scenario (chat or call)', () => {
    expect(nextStep(at(4))).toBe('/sembang/gaji_pertama');
    expect(nextStep(at(11))).toBe('/panggilan/panggilan_mahkamah');
  });
  it('a pending aftermath comes first', () => {
    expect(nextStep(at(4, { lastEnded: 'gaji_pertama', active: 'gaji_pertama' }))).toBe('/semester/akibat/gaji_pertama');
  });
  it('week 7 and week 12 have no scenario: reflection, then the report path', () => {
    expect(nextStep(at(7))).toBe('/semester/minggu');
    expect(nextStep(at(12))).toBe('/semester/rapor');
  });
  it('scenario finished -> next week intro', () => {
    expect(nextStep(at(4, { results: done(4) }))).toBe('/semester/minggu');
  });
});

describe('canBeginWeek', () => {
  it('is true at the start and after a finished scenario', () => {
    expect(canBeginWeek(base)).toBe(true);
    expect(canBeginWeek(at(4, { results: done(4) }))).toBe(true);
  });
  it('is false while the week scenario is unplayed', () => {
    expect(canBeginWeek(at(4))).toBe(false);
  });
  it('is false with a pending aftermath, an active chat or an open intro', () => {
    const fin = at(4, { results: done(4) });
    expect(canBeginWeek({ ...fin, lastEnded: 'x' })).toBe(false);
    expect(canBeginWeek({ ...fin, active: 'x' })).toBe(false);
    expect(canBeginWeek({ ...fin, weekIntroOpen: true })).toBe(false);
  });
  it('week 7 (no scenario) can move on once week 6 is done; week 12 never', () => {
    expect(canBeginWeek(at(7))).toBe(true);
    expect(canBeginWeek(at(12, { results: done(12) }))).toBe(false);
  });
  it('plays all 12 weeks in order', () => {
    let s: LoopState = base;
    for (let w = 1; w <= 12; w++) {
      expect(canBeginWeek(s), `begin ${w}`).toBe(true);
      s = { ...s, week: w };
      const sc = WEEKS[w - 1].scenario;
      if (sc) {
        expect(canBeginWeek(s)).toBe(false);
        s = { ...s, results: [...s.results, { id: sc }] };
      }
    }
    expect(s.results).toHaveLength(10);
  });
});

describe('homeTile', () => {
  it('start: Minggu 1', () => expect(homeTile(base)).toEqual({ kind: 'next', week: 1 }));
  it('scenario pending in the week -> Selesaikan perbualan', () => expect(homeTile(at(4)).kind).toBe('pending'));
  it('done -> Minggu N+1', () => expect(homeTile(at(4, { results: done(4) }))).toEqual({ kind: 'next', week: 5 }));
  it('week 12 done -> report', () => expect(homeTile(at(12, { results: done(12) })).kind).toBe('report'));
});
