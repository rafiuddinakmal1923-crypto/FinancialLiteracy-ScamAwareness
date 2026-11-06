import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compileScenario } from './compile';
import { StoryRunner } from './story';

const src = readFileSync(new URL('../../../content/scenarios/kerja_sambilan.ink', import.meta.url), 'utf8');
const scenario1 = () => compileScenario(src, 'kerja_sambilan.ink');

function inline(id: string, body: string) {
  const head = [
    `# id:${id}`, '# type:scam', '# family:job', '# tactics:greed', '# contact:Tester',
    '# apa_patut:Semak dulu.',
  ].join('\n');
  return compileScenario(`${head}\n\n${body}\n`, `${id}.ink`);
}

describe('StoryRunner', () => {
  it('first line has speaker and flag', () => {
    const r = new StoryRunner(scenario1());
    const s = r.next();
    expect(s.kind).toBe('line');
    if (s.kind !== 'line') return;
    expect(s.speaker).toBe('Kak Mira (HR)');
    expect(s.text).toBe('Salam dik 😊 Akak Mira, HR dari Bintang Digital Sdn Bhd.');
    expect(s.flags).toEqual([]);
    const lines = [s];
    let n = r.next();
    while (n.kind === 'line') { lines.push(n); n = r.next(); }
    expect(lines[2].flags).toEqual([{ tactic: 'greed', phrase: 'RM300 sehari' }]);
  });

  it('system line has null speaker', () => {
    const r = new StoryRunner(inline('sys_line', [
      'Panggilan tamat.',
      'pautan.test/abc: buka',
      'Kak A: Hai RM300 sehari # flag:greed:RM300 sehari',
      '* [Tak nak] Bye # outcome:safe',
      '  -> END',
    ].join('\n')));
    const a = r.next();
    const b = r.next();
    expect(a).toMatchObject({ kind: 'line', speaker: null, text: 'Panggilan tamat.' });
    expect(b).toMatchObject({ kind: 'line', speaker: null, text: 'pautan.test/abc: buka' });
  });

  it('choices after the opening lines', () => {
    const r = new StoryRunner(scenario1());
    let s = r.next();
    let count = 0;
    while (s.kind === 'line') { count++; s = r.next(); }
    expect(count).toBe(5);
    expect(s).toEqual({
      kind: 'choices',
      choices: [
        { index: 0, text: 'Minat! Macam mana nak mula?' },
        { index: 1, text: 'Syarikat apa ni? Boleh saya semak syarikat ni berdaftar?' },
        { index: 2, text: 'Abaikan mesej ni' },
      ],
    });
    expect(r.next()).toEqual(s); // idempotent while pending
  });

  it('top-up path ends scammed with duit -100 effect on the last line', () => {
    const r = new StoryRunner(scenario1());
    const play = (pick: number) => {
      let s = r.next();
      while (s.kind === 'line') s = r.next();
      expect(s.kind).toBe('choices');
      r.choose(pick);
    };
    play(0); // Minat
    play(0); // top-up RM100
    let s = r.next();
    while (s.kind === 'line') s = r.next();
    expect(s.kind).toBe('choices');
    r.choose(1); // Tak nak. Pulangkan RM100
    s = r.next();
    while (s.kind === 'line') s = r.next();
    expect(s).toEqual({ kind: 'end', outcome: 'scammed' });
    const last = r.transcript[r.transcript.length - 1];
    expect(last.text).toContain('Tak upgrade');
    expect(last.effects).toEqual([{ kind: 'duit', delta: -100 }]);
    expect(r.next()).toEqual(s); // stays ended
  });

  it('choose twice throws', () => {
    const r = new StoryRunner(scenario1());
    let s = r.next();
    while (s.kind === 'line') s = r.next();
    expect(() => r.choose(9)).toThrow();
    r.choose(2);
    expect(() => r.choose(0)).toThrow();
  });

  it('choose without pending choices throws', () => {
    const r = new StoryRunner(scenario1());
    expect(() => r.choose(0)).toThrow();
  });

  it('transcript keeps all lines in order', () => {
    const r = new StoryRunner(scenario1());
    let s = r.next();
    while (s.kind === 'line') s = r.next();
    r.choose(2);
    s = r.next();
    while (s.kind === 'line') s = r.next();
    expect(s).toEqual({ kind: 'end', outcome: 'safe' });
    expect(r.transcript.map((l) => l.text)).toEqual([
      'Salam dik 😊 Akak Mira, HR dari Bintang Digital Sdn Bhd.',
      'Akak dapat nombor adik dari group kampus. Kami tengah cari student untuk kerja part-time online.',
      'Kerja senang je, like & share post produk kat media sosial. Boleh dapat RM300 sehari!',
      'Tak perlu pengalaman, buat dari bilik hostel pun boleh 👍',
      'Tapi slot tinggal 3 je hari ni tau, ramai dah daftar. Nak akak simpan satu utk adik?',
      'Dik? Slot dah nak penuh ni 😢',
    ]);
  });

  it('empty text lines with tags are returned with text ""', () => {
    const r = new StoryRunner(inline('empty_tag', [
      'Kak A: Hai RM300 sehari # flag:greed:RM300 sehari',
      '# effect:tekanan:5',
      '* [Tak nak] Bye # outcome:safe',
      '  -> END',
    ].join('\n')));
    const a = r.next();
    const b = r.next();
    expect(a).toMatchObject({ kind: 'line', text: 'Hai RM300 sehari' });
    expect(b).toMatchObject({ kind: 'line', speaker: null, text: '', effects: [{ kind: 'tekanan', delta: 5 }] });
  });
});
