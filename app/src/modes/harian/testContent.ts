// Test-only content for the Cek Harian / Sahih atau Scam component tests (mocked as `virtual:celik-content`).
import type { ConceptInfo, MoneyCard, SwipeCard, TacticInfo } from '../../engine/schemas';

const channels = ['sms', 'chat', 'email'] as const;

export const SWIPE: SwipeCard[] = Array.from({ length: 12 }, (_, i) => {
  const scam = i % 2 === 0;
  return {
    id: `s${i}`,
    channel: channels[i % 3],
    sender: scam ? `Penghantar ${i}` : `Kawan ${i}`,
    text: { ms: `Mesej nombor ${i} untuk anda` },
    answer: scam ? 'scam' : 'legit',
    tactics: scam ? [i % 4 === 0 ? 'greed' : 'urgency'] : [],
    why: { ms: `Sebab kad ${i}: ${scam ? 'ini helah' : 'ini mesej biasa'}.` },
  } as SwipeCard;
});

export const MONEY: MoneyCard[] = [
  {
    id: 'm1', kind: 'truefalse', concept: 'bajet', answer: true,
    text: { ms: 'Bajet bermula dengan perkara wajib.' }, why: { ms: 'Sebab wang 1: asingkan yang wajib dulu.' },
  },
  {
    id: 'm2', kind: 'pick', concept: 'kompaun', better: 1,
    text: { ms: 'Pilih yang lebih baik untuk simpanan.' },
    options: [{ ms: 'Simpan hujung bulan sahaja' }, { ms: 'Simpan awal tiap bulan' }],
    why: { ms: 'Sebab wang 2: awal memberi masa untuk tumbuh.' },
  },
];

export const TACTICS = [
  { code: 'greed', name: { ms: 'Terlalu Lumayan' }, does: { ms: 'x' }, cue: { ms: 'x' }, tip: { ms: 'x' } },
  { code: 'urgency', name: { ms: 'Desakan Masa' }, does: { ms: 'x' }, cue: { ms: 'x' }, tip: { ms: 'x' } },
] as unknown as TacticInfo[];

export const CONCEPTS = [
  { code: 'bajet', name: { ms: 'Bajet' } },
  { code: 'kompaun', name: { ms: 'Kuasa Kompaun' } },
] as unknown as ConceptInfo[];

/** Mutable so a test can take the content away. */
export const content: { cards: SwipeCard[] | null; moneyCards: MoneyCard[] | null } = { cards: SWIPE, moneyCards: MONEY };
