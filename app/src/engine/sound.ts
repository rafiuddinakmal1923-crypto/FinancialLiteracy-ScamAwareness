// Sound made in code with Web Audio: short sounds and two music loops, no audio files (offline, tiny, no
// licences). Nothing plays until the first tap (browser rule) and nothing plays while the Sound switch is off.
import { BALANCE } from './balance';

type Wave = 'sine' | 'triangle' | 'square' | 'sawtooth';
/** One note: start (s after the sound starts), length (s), pitch (Hz), loudness 0..1, wave shape. */
export interface Note { at: number; dur: number; freq: number; gain: number; wave: Wave }

const n = (at: number, dur: number, freq: number, gain: number, wave: Wave = 'sine'): Note => ({ at, dur, freq, gain, wave });

export const SFX = {
  tap: [n(0, 0.05, 880, 0.12, 'triangle')],
  coinIn: [n(0, 0.08, 988, 0.25, 'square'), n(0.07, 0.25, 1319, 0.22, 'square')],
  coinOut: [n(0, 0.1, 659, 0.2, 'triangle'), n(0.09, 0.2, 440, 0.18, 'triangle')],
  ping: [n(0, 0.12, 1047, 0.25), n(0.1, 0.25, 1568, 0.2)],
  ring: [n(0, 0.35, 784, 0.18), n(0, 0.35, 988, 0.12), n(0.45, 0.35, 784, 0.18), n(0.45, 0.35, 988, 0.12)],
  right: [n(0, 0.12, 523, 0.25, 'triangle'), n(0.1, 0.12, 659, 0.25, 'triangle'), n(0.2, 0.3, 784, 0.25, 'triangle')],
  // Soft and low, never a buzzer (rule 4: no shaming).
  wrong: [n(0, 0.2, 392, 0.2), n(0.18, 0.35, 330, 0.18)],
  week: [n(0, 0.15, 523, 0.2, 'triangle'), n(0.14, 0.15, 784, 0.2, 'triangle'), n(0.28, 0.4, 1047, 0.18, 'triangle')],
} satisfies Record<string, Note[]>;
export type SfxName = keyof typeof SFX;

/** A loop: one note (Hz, 0 = rest) per eighth beat, a bass note per bar of 8 steps. */
export interface Track { bpm: number; wave: Wave; steps: number[]; bass: number[]; gain: number }

export const MUSIC = {
  // C major pentatonic, gentle.
  calm: {
    bpm: 84, wave: 'triangle', gain: 0.5,
    steps: [523, 0, 659, 0, 784, 659, 0, 587, 523, 0, 440, 0, 587, 0, 523, 0,
      659, 0, 784, 0, 880, 784, 0, 659, 587, 0, 523, 0, 440, 0, 0, 0],
    bass: [131, 110, 175, 196],
  },
  // A minor, a low repeating pulse for scam scenes.
  tense: {
    bpm: 112, wave: 'triangle', gain: 0.45,
    steps: [220, 0, 220, 262, 0, 220, 247, 0, 220, 0, 220, 262, 0, 294, 262, 0],
    bass: [55, 58],
  },
} satisfies Record<string, Track>;
export type TrackName = keyof typeof MUSIC;

const TENSE = new Set(['chat', 'panggilan', 'laman', 'akibat']);
const SILENT = new Set(['splash', 'kelas', 'onboarding']);

/** The loop for a screen (route name), or null for none. */
export function musicFor(route: string): TrackName | null {
  if (SILENT.has(route)) return null;
  return TENSE.has(route) ? 'tense' : 'calm';
}

export interface SoundState { duit: number; week: number; results: readonly { right: boolean }[] }

/** Short sounds for one game-state change. A reset, a loaded save or a jump of weeks plays nothing. */
export function soundsForChange(prev: SoundState, next: SoundState): SfxName[] {
  if (next.week < prev.week || next.week > prev.week + 1) return [];
  const out: SfxName[] = [];
  if (next.results.length === prev.results.length + 1) out.push(next.results.at(-1)!.right ? 'right' : 'wrong');
  else if (next.duit > prev.duit) out.push('coinIn');
  else if (next.duit < prev.duit) out.push('coinOut');
  if (next.week === prev.week + 1) out.push('week');
  return out;
}

/** The parts of AudioContext this file uses (so tests can pass a stand-in). */
type Ctx = Pick<AudioContext, 'currentTime' | 'destination' | 'createGain' | 'createOscillator' | 'resume' | 'suspend' | 'state'>;

export interface Sound {
  /** Call from a user tap: makes (or resumes) the AudioContext. */
  unlock(): void;
  play(name: SfxName): void;
  setMusic(track: TrackName | null): void;
  setEnabled(on: boolean): void;
  /** Pause while the app is hidden; resume when back. */
  setHidden(hidden: boolean): void;
}

export function browserContext(): Ctx | null {
  const AC = typeof window === 'undefined' ? undefined
    : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!AC) return null;
  try { return new AC(); } catch { return null; }
}

export function createSound(makeCtx: () => Ctx | null = browserContext): Sound {
  const vol = BALANCE.sound;
  let ctx: Ctx | null = null;
  let tried = false;
  let master: GainNode | null = null;
  let musicBus: GainNode | null = null;
  let sfxBus: GainNode | null = null;
  let enabled = true;
  let hidden = false;
  let wanted: TrackName | null = null;
  let playing: TrackName | null = null;
  let step = 0;
  let nextAt = 0;
  let timer: ReturnType<typeof setInterval> | null = null;
  let switchTimer: ReturnType<typeof setTimeout> | null = null;

  function tone(bus: GainNode, x: Note, t0: number): void {
    const c = ctx!;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = x.wave;
    o.frequency.setValueAtTime(x.freq, t0 + x.at);
    const start = t0 + x.at;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.linearRampToValueAtTime(x.gain, start + Math.min(0.01, x.dur / 4));
    g.gain.exponentialRampToValueAtTime(0.0001, start + x.dur);
    o.connect(g);
    g.connect(bus);
    o.start(start);
    o.stop(start + x.dur + 0.02);
  }

  function schedule(): void {
    if (!ctx || !musicBus || !playing) return;
    const tr: Track = MUSIC[playing];
    const len = 60 / tr.bpm / 2;
    if (nextAt < ctx.currentTime) nextAt = ctx.currentTime + 0.05;
    while (nextAt < ctx.currentTime + 0.3) {
      const f = tr.steps[step % tr.steps.length];
      if (f) tone(musicBus, n(0, len * 1.6, f, tr.gain * 0.5, tr.wave), nextAt);
      if (step % 8 === 0) tone(musicBus, n(0, len * 7, tr.bass[(step / 8) % tr.bass.length], tr.gain * 0.6, 'sine'), nextAt);
      step++;
      nextAt += len;
    }
  }

  function stopLoop(): void {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function applyMusic(): void {
    if (!ctx || !musicBus) return;
    const target = enabled && !hidden ? wanted : null;
    const t = ctx.currentTime;
    // A newer request always replaces one still waiting to start.
    if (switchTimer) { clearTimeout(switchTimer); switchTimer = null; }
    musicBus.gain.cancelScheduledValues(t);
    if (target === playing) {
      if (playing) musicBus.gain.setTargetAtTime(vol.music, t, vol.fadeSec / 3);
      return;
    }
    musicBus.gain.setTargetAtTime(0, t, vol.fadeSec / 3);
    switchTimer = setTimeout(() => {
      switchTimer = null;
      playing = target;
      step = 0;
      stopLoop();
      if (!ctx || !musicBus || !playing) return;
      nextAt = ctx.currentTime + 0.05;
      musicBus.gain.setTargetAtTime(vol.music, ctx.currentTime, vol.fadeSec / 3);
      schedule();
      timer = setInterval(schedule, 100);
    }, playing ? vol.fadeSec * 1000 : 0);
  }

  return {
    unlock() {
      if (!ctx && !tried) {
        tried = true;
        ctx = makeCtx();
        if (ctx) {
          master = ctx.createGain();
          master.gain.value = vol.master;
          master.connect(ctx.destination);
          musicBus = ctx.createGain();
          musicBus.gain.value = 0;
          musicBus.connect(master);
          sfxBus = ctx.createGain();
          sfxBus.gain.value = vol.sfx;
          sfxBus.connect(master);
        }
      }
      if (ctx && ctx.state === 'suspended' && !hidden) void ctx.resume().catch(() => undefined);
      applyMusic();
    },
    play(name) {
      if (!ctx || !sfxBus || !enabled || hidden) return;
      const t0 = ctx.currentTime + 0.01;
      for (const x of SFX[name]) tone(sfxBus, x, t0);
    },
    setMusic(track) {
      wanted = track;
      applyMusic();
    },
    setEnabled(on) {
      enabled = on;
      applyMusic();
    },
    setHidden(h) {
      hidden = h;
      if (ctx) void (h ? ctx.suspend() : ctx.resume()).catch(() => undefined);
      applyMusic();
    },
  };
}

/** The app's one sound player. */
export const sound: Sound = createSound();
