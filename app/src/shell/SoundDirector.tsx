// Connects the code-made sounds (engine/sound.ts) to the app: music per screen, short sounds for taps, money,
// weeks, chat results, new messages and calls. Renders nothing.
import { useEffect } from 'react';
import { musicFor, sound as appSound, soundsForChange, type Sound } from '../engine/sound';
import { useGame } from '../state/game';
import { useSettings } from '../state/settings';

const ARRIVE: Record<string, 'ping' | 'ring'> = { mesej: 'ping', panggilan: 'ring' };

export function SoundDirector({ route, sound = appSound }: { route: string; sound?: Sound }) {
  const on = useSettings((s) => s.sound);

  useEffect(() => { sound.setEnabled(on); }, [on, sound]);

  useEffect(() => {
    sound.setMusic(musicFor(route));
    const arrive = ARRIVE[route];
    if (arrive) sound.play(arrive);
  }, [route, sound]);

  useEffect(() => {
    const onDown = (e: Event) => {
      sound.unlock();
      const el = e.target instanceof Element ? e.target.closest('button, a, [role="switch"], [role="button"]') : null;
      if (el && !el.hasAttribute('disabled')) sound.play('tap');
    };
    const onVis = () => sound.setHidden(document.visibilityState === 'hidden');
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [sound]);

  useEffect(() => useGame.subscribe((next, prev) => {
    const names = soundsForChange(
      { duit: prev.meters.duit, week: prev.week, results: prev.results },
      { duit: next.meters.duit, week: next.week, results: next.results },
    );
    for (const n of names) sound.play(n);
  }), [sound]);

  return null;
}
