import { describe, expect, it, vi } from 'vitest';
import { MUSIC, SFX, createSound, musicFor, soundsForChange, type SfxName } from './sound';

/** A stand-in for the browser's AudioContext that records what was made. */
function fakeCtx() {
  const made = { osc: 0, started: 0 };
  const param = () => ({ value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {} });
  const node = () => ({ connect() { return this; }, disconnect() {} });
  const ctx = {
    currentTime: 0, state: 'running', destination: node(),
    resume: () => Promise.resolve(), suspend: () => Promise.resolve(),
    createGain: () => ({ ...node(), gain: param() }),
    createOscillator: () => { made.osc++; return { ...node(), type: 'sine', frequency: param(), start() { made.started++; }, stop() {} }; },
  };
  return { ctx, made };
}

describe('sound recipes', () => {
  it('has every sound the game asks for, each short and quiet enough', () => {
    const names: SfxName[] = ['tap', 'coinIn', 'coinOut', 'ping', 'ring', 'right', 'wrong', 'week'];
    for (const n of names) {
      const notes = SFX[n];
      expect(notes.length).toBeGreaterThan(0);
      const end = Math.max(...notes.map((x) => x.at + x.dur));
      expect(end).toBeLessThanOrEqual(1.2);
      for (const x of notes) {
        expect(x.freq).toBeGreaterThan(50);
        expect(x.gain).toBeGreaterThan(0);
        expect(x.gain).toBeLessThanOrEqual(0.5);
      }
    }
  });
  it('the wrong sound is soft, not harsh (rule 4)', () => {
    expect(SFX.wrong.every((x) => x.wave === 'sine' || x.wave === 'triangle')).toBe(true);
  });
  it('has a calm and a tense loop', () => {
    expect(MUSIC.calm.steps.length).toBeGreaterThan(7);
    expect(MUSIC.tense.bpm).toBeGreaterThan(MUSIC.calm.bpm);
  });
});

describe('musicFor', () => {
  it('plays tense music in scam scenes and calm music elsewhere', () => {
    expect(musicFor('chat')).toBe('tense');
    expect(musicFor('panggilan')).toBe('tense');
    expect(musicFor('laman')).toBe('tense');
    expect(musicFor('home')).toBe('calm');
    expect(musicFor('dompet')).toBe('calm');
  });
  it('plays no music on the splash, onboarding or in Mod Kelas', () => {
    expect(musicFor('splash')).toBeNull();
    expect(musicFor('kelas')).toBeNull();
  });
});

describe('soundsForChange', () => {
  const base = { duit: 100, week: 2, results: [] as { right: boolean }[] };
  it('coin in when Duit goes up, coin out when it goes down', () => {
    expect(soundsForChange(base, { ...base, duit: 150 })).toEqual(['coinIn']);
    expect(soundsForChange(base, { ...base, duit: 40 })).toEqual(['coinOut']);
  });
  it('a new week plays the week sound', () => {
    expect(soundsForChange(base, { ...base, week: 3 })).toEqual(['week']);
  });
  it('a finished chat plays right or wrong', () => {
    expect(soundsForChange(base, { ...base, results: [{ right: true }] })).toEqual(['right']);
    expect(soundsForChange(base, { ...base, results: [{ right: false }] })).toEqual(['wrong']);
  });
  it('nothing for a reset or a loaded save (week goes back or jumps)', () => {
    expect(soundsForChange(base, { ...base, week: 0, duit: 0 })).toEqual([]);
    expect(soundsForChange({ ...base, week: 0 }, { ...base, week: 9 })).toEqual([]);
  });
  it('nothing when nothing changed', () => {
    expect(soundsForChange(base, { ...base })).toEqual([]);
  });
});

describe('createSound', () => {
  it('makes no AudioContext before the first tap (browser rule)', () => {
    let made = 0;
    const s = createSound(() => { made++; return fakeCtx().ctx as never; });
    s.play('tap');
    s.setMusic('calm');
    expect(made).toBe(0);
    s.unlock();
    expect(made).toBe(1);
  });
  it('plays a sound after unlock', () => {
    const f = fakeCtx();
    const s = createSound(() => f.ctx as never);
    s.unlock();
    s.play('right');
    expect(f.made.started).toBe(SFX.right.length);
  });
  it('plays nothing while sound is off', () => {
    const f = fakeCtx();
    const s = createSound(() => f.ctx as never);
    s.unlock();
    s.setEnabled(false);
    s.play('right');
    expect(f.made.started).toBe(0);
  });
  it('turning sound off right after a tap cancels the music that was about to start', () => {
    vi.useFakeTimers();
    const f = fakeCtx();
    const s = createSound(() => f.ctx as never);
    s.setMusic('calm');
    s.unlock();
    s.setEnabled(false);
    vi.advanceTimersByTime(2000);
    expect(f.made.started).toBe(0);
    s.setEnabled(true);
    vi.advanceTimersByTime(500);
    expect(f.made.started).toBeGreaterThan(0);
    s.setMusic(null);
    vi.useRealTimers();
  });
  it('copes when the browser has no Web Audio', () => {
    const s = createSound(() => null);
    expect(() => { s.unlock(); s.play('tap'); s.setMusic('tense'); s.setEnabled(false); }).not.toThrow();
  });
});
