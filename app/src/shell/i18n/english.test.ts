// English coverage: the toggle must never fall back to BM. Everything a player reads has an English version.
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadCelikContent } from '../../../vite-plugins/ink';
import { replayTranscript, StoryRunner } from '../../engine/story';
import { walkScenario } from '../../engine/compile';
import type { TrailStep } from '../../engine/types';
import ms from './ms.json';
import en from './en.json';

const content = loadCelikContent(resolve(__dirname, '../../../../content'));
const msDict = ms as Record<string, unknown>;
const enDict = en as Record<string, unknown>;
const uiKeys = Object.keys(msDict).filter((k) => !k.startsWith('_'));

const vars = (s: unknown) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join();

/** Every { ms, en? } object inside a content file, with its path. */
function localized(node: unknown, path = ''): { path: string; ms: string; en?: string }[] {
  if (Array.isArray(node)) return node.flatMap((v, i) => localized(v, `${path}[${i}]`));
  if (!node || typeof node !== 'object') return [];
  const o = node as Record<string, unknown>;
  const here = typeof o.ms === 'string' ? [{ path, ms: o.ms, en: o.en as string | undefined }] : [];
  return [...here, ...Object.entries(o).flatMap(([k, v]) => localized(v, `${path}.${k}`))];
}

describe('English coverage', () => {
  it('has every BM string', () => {
    expect(uiKeys.filter((k) => !(k in enDict))).toEqual([]);
  });

  it('keeps the same {variables} in each string', () => {
    expect(uiKeys.filter((k) => vars(msDict[k]) !== vars(enDict[k]))).toEqual([]);
  });

  it('has no BM game terms left in English sentences', () => {
    const terms = /\b(Kalkulator|Mesin Masa|Semak Pulangan|Kos Sebenar|Kira dulu|Kad Ilmu|Dompet|Sembang|Labur|Keperluan|Kehendak|Simpanan|Tekanan|Duit)\b/;
    const left = Object.entries(enDict).filter(([k, v]) => k !== 'lang.msName' && typeof v === 'string' && terms.test(v as string));
    expect(left).toEqual([]);
  });

  it('has English for every text in every content file', () => {
    expect(content.problems).toEqual([]);
    const { scenarios: _s, ...files } = content.data;
    const missing = Object.entries(files).flatMap(([name, data]) =>
      localized(data, name).filter((l) => !l.en).map((l) => `${l.path}: ${l.ms}`));
    expect(missing).toEqual([]);
  });

  it('has an English version of every scenario', () => {
    const ids = Object.keys(content.data.scenarios);
    expect(ids.length).toBeGreaterThan(0);
    expect(ids.filter((id) => !content.data.scenarios[id].en)).toEqual([]);
  });
});

describe('a played chat in either language', () => {
  const scenarios = Object.values(content.data.scenarios);

  /** Plays one path through the runner, recording the trail the way useScenario does. */
  function trailOf(json: string, choices: number[], meta: typeof scenarios[number]['meta'], flags: typeof scenarios[number]['flags']) {
    const runner = new StoryRunner({ meta, json, flags });
    const queue = [...choices];
    const trail: TrailStep[] = [];
    for (;;) {
      const step = runner.next();
      if (step.kind === 'end') return trail;
      if (step.kind === 'choices') {
        const c = queue.shift() ?? 0;
        trail.push({ c });
        runner.choose(c);
      } else if (step.ui) {
        trail.push({ u: true });
        runner.setUiResult(true);
      }
    }
  }

  it('replays the same path in BM and English, with the same flags', () => {
    for (const s of scenarios) {
      for (const path of walkScenario(s.json)) {
        const trail = trailOf(s.json, path.choices, s.meta, s.flags);
        const a = replayTranscript(s, trail);
        const b = replayTranscript(s.en!, trail);
        expect(b.length, s.meta.id).toBe(a.length);
        expect(b.map((m) => m.from), s.meta.id).toEqual(a.map((m) => m.from));
        expect(b.map((m) => m.flags.map((f) => f.tactic)), s.meta.id).toEqual(a.map((m) => m.flags.map((f) => f.tactic)));
      }
    }
  });

  it('shows English words when replayed in English', () => {
    const s = content.data.scenarios.sewa_akaun;
    const first = replayTranscript(s.en!, [{ c: 2 }])[0];
    expect(first.speaker).toBe('Abang Zul');
    expect(first.text).toContain('Engineering senior');
  });
});
