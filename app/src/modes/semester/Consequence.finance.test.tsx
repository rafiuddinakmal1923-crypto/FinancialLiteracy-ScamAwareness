// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { translate, type Vars } from '../../shell/i18n';
import ms from '../../shell/i18n/ms.json';
import en from '../../shell/i18n/en.json';
import { useGame } from '../../state/game';
import { useSettings } from '../../state/settings';
import { formatRM } from '../../ui/format';
import { STEP_ICONS } from '../../ui/ConsequenceTimeline';
import { Consequence } from './Consequence';
import { consequenceBase, consequenceSteps, consequenceTone } from './aftermath';

vi.mock('virtual:celik-content', async () => {
  const { compileScenario } = await import('../../engine/compile');
  const mk = (id: string, family: string, concept: string) => compileScenario(
    [`# id:${id}`, '# type:finance', `# family:${family}`, `# concepts:${concept}`, '# contact:Kak Sofea', '',
      'Kak Sofea: Hai.', '* [Ya]', '  Kak Sofea: Ok. # outcome:untung', '  -> END',
      '* [Tak]', '  Kak Sofea: Hmm. # outcome:rugi', '  -> END'].join('\n') + '\n',
    `${id}.ink`,
  );
  return {
    scenarios: { kawan_labur: mk('kawan_labur', 'investment', 'risiko'), bayar_nanti: mk('bayar_nanti', 'loan', 'hutang') },
    calcPresets: [], pages: {}, semester: { weeks: [] },
  };
});

const KEYS = ['untung', 'rugi', 'hutang'] as const;
const flat = (j: unknown) => j as Record<string, string>;
const VARS = { amount: 'RM50.00', balance: 'RM1,950.00' };

describe('finance outcome copy (Task 19, SDS 5.6)', () => {
  for (const lang of ['ms', 'en'] as const) {
    const t = (k: string, v?: Vars) => translate(lang, k, v);
    it.each(KEYS)(`${lang}: akibat.%s has a title and at least 3 steps with known icons`, (o) => {
      expect(t(`akibat.${o}.title`, VARS)).not.toBe(`akibat.${o}.title`);
      const steps = consequenceSteps(t, o, VARS);
      expect(steps.length).toBeGreaterThanOrEqual(3);
      for (const s of steps) {
        expect(s.text.length).toBeGreaterThan(10);
        expect(Object.keys(STEP_ICONS)).toContain(s.icon);
      }
    });
  }

  it('untung points at the Kalkulator, rugi compares the other choice, hutang shows the cost and where to get help', () => {
    const t = (k: string, v?: Vars) => translate('ms', k, v);
    const text = (o: 'untung' | 'rugi' | 'hutang') => consequenceSteps(t, o, VARS).map((s) => s.text).join(' ');
    expect(text('untung')).toMatch(/Mesin Masa/);
    expect(text('untung')).toMatch(/contoh/i);
    expect(text('rugi')).toMatch(/kalau|jika/i);
    expect(text('hutang')).toMatch(/Kos Sebenar/);
    expect(text('hutang')).toMatch(/kaunseling kredit/i);
    for (const o of KEYS) expect(text(o)).not.toMatch(/bodoh|beli /i);
  });

  it('the real agency name lives only in a legal.* key that _todoVerify lists', () => {
    const m = flat(ms);
    for (const [k, v] of Object.entries(m)) {
      if (k.startsWith('akibat.') && /AKPK/.test(v)) throw new Error(`${k} names a real agency`);
    }
    expect(m['legal.akpk']).toMatch(/AKPK/);
    expect(flat(en)['legal.akpk']).toBeTruthy();
  });

  it('tones: untung safe, rugi warning, hutang danger', () => {
    const t = (k: string) => translate('ms', k);
    expect(consequenceTone(t, consequenceBase(t, 'kawan_labur', 'untung'), 'untung')).toBe('safe');
    expect(consequenceTone(t, consequenceBase(t, 'kawan_labur', 'rugi'), 'rugi')).toBe('warning');
    expect(consequenceTone(t, consequenceBase(t, 'bayar_nanti', 'hutang'), 'hutang')).toBe('danger');
  });
});

describe('Consequence renders the finance outcomes', () => {
  beforeEach(() => {
    useSettings.getState().hydrate({ lang: 'ms', sound: false, reducedMotion: true, demo: true });
    useGame.getState().reset();
  });
  afterEach(() => cleanup());

  it.each([
    ['kawan_labur', 'untung'],
    ['kawan_labur', 'rugi'],
    ['bayar_nanti', 'hutang'],
    ['bayar_nanti', 'untung'],
  ] as const)('%s %s: title, first step, Cuba lagi', (id, outcome) => {
    useGame.getState().set({ lastEnded: { id, outcome, transcript: [], found: [], huntDone: false }, active: null });
    render(<Consequence params={{ id }} />);
    const base = consequenceBase((k) => translate('ms', k), id, outcome);
    const title = screen.getByRole('heading', { level: 1 });
    expect(title.textContent).toBe(translate('ms', `${base}.title`, { amount: formatRM(0), balance: formatRM(2000) }));
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByRole('button', { name: 'Cuba lagi' })).toBeTruthy();
  });
});
