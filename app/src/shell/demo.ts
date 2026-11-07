// Demo presets for the competition video (`#/demo/:scene`): each one puts the game in a known state and names
// the screen to open. Routes not built yet keep their future path; applyPreset only needs the state.
import { BALANCE } from '../engine/balance';
import type { Meters } from '../engine/types';
import { fillMeters, initialGame, useGame, type GameData, type TxEntry } from '../state/game';

export const DEMO_SCENES = ['job', 'mule', 'report', 'kelas', 'kalkulator'] as const;
export type DemoScene = (typeof DEMO_SCENES)[number];

export interface DemoPreset {
  route: string;
  /** Game fields to set on top of a fresh game; `meters` is merged into the starting meters. */
  game: Partial<Omit<GameData, 'meters'>> & { meters?: Partial<Meters> };
}

/** BankKu history for weeks 1-3 (content/semester.json costs): RM2,000 less these is the mule preset's RM1,070. */
const WEEK_1_TO_3_TX: TxEntry[] = [
  ['Makan', 80, 1], ['Pengangkutan', 20, 1], ['Bil telefon', 30, 1],
  ['Makan', 80, 2], ['Pengangkutan', 20, 2],
  ['Makan', 80, 3], ['Pengangkutan', 20, 3], ['Yuran asrama', 600, 3],
].map(([label, amount, week], i) => ({ id: i + 1, week: week as number, label: label as string, amount: -(amount as number) }));

const BUDGET = { needs: 50, wants: 30, savings: 20 };

export const DEMO_PRESETS: Record<DemoScene, DemoPreset> = {
  job: {
    route: '/sembang/kerja_sambilan',
    game: { onboarded: true, week: 1, meters: { duit: BALANCE.start.duit - 130, tekanan: 30 }, txLog: WEEK_1_TO_3_TX.filter((e) => e.week === 1) },
  },
  // The hero scene (SRS 5.2): week 3, hostel fees just paid, Tekanan at the desperation cue.
  mule: {
    route: '/sembang/sewa_akaun',
    game: {
      onboarded: true, week: 3, budget: BUDGET, txLog: WEEK_1_TO_3_TX,
      meters: { duit: 1070, simpanan: 60, tekanan: 70 },
    },
  },
  report: {
    route: '/semester/rapor',
    game: { onboarded: true, week: 12, budget: BUDGET, meters: { duit: 1240, simpanan: 320, tekanan: 35, labur: { amanah: 150, ekuiti: 100 } } },
  },
  kelas: { route: '/kelas', game: { onboarded: true, week: 1 } },
  kalkulator: {
    route: '/kalkulator/pulangan',
    game: { onboarded: true, week: 8, budget: BUDGET, meters: { duit: 1350, simpanan: 300, tekanan: 30 } },
  },
};

export function isDemoScene(name: string): name is DemoScene {
  return (DEMO_SCENES as readonly string[]).includes(name);
}

/** Replaces the game with a fresh one plus the preset. Returns false (and changes nothing) for an unknown name. */
export function applyPreset(name: string): boolean {
  if (!isDemoScene(name)) return false;
  const { meters, ...rest } = DEMO_PRESETS[name].game;
  const fresh = initialGame();
  useGame.getState().set({
    ...fresh, ...rest,
    meters: fillMeters({ ...fresh.meters, ...meters } as Partial<Meters>),
  });
  return true;
}
