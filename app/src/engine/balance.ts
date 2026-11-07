export const BALANCE = {
  start: { duit: 2000, simpanan: 0, tekanan: 20, imuniti: 30, celik: 30, labur: 0, xp: 0 },
  semesterWeeks: 12,
  incomeWeeks: [4, 8, 12],
  income: 400,
  imuniti: { safe: 10, fell: -15, flag: 5, swipeRight: 3, swipeWrong: -5, badge: 5 },
  /** Celik Kewangan per concept (D24): finance right/wrong call, money card right/wrong. */
  celik: { right: 10, wrong: -10, cardRight: 3, cardWrong: -5 },
  xp: {
    safe: 50, fell: 20, flag: 10, swipeRight: 5, swipeWrong: 0, badge: 30, drill: 40, action: 25, hint: -10,
    financeRight: 50, financeWrong: 20, calc: 10, kadIlmu: 10, moneyCardRight: 5, moneyCardWrong: 0,
  },
  levels: [['Pemula', 0], ['Berjimat', 200], ['Bijak', 500], ['Pelabur', 900], ['Celik', 1400]],
  grade: {
    weights: { judgement: 0.3, celik: 0.25, imuniti: 0.2, money: 0.15, flags: 0.1 },
    /** Money health parts (SDS 5.4): money kept, emergency fund vs finance.emergencyTarget, invested (Labur > 0). */
    moneyHealth: { kept: 0.5, emergency: 0.25, invested: 0.25 },
    A: 85, B: 70, C: 55, capWhenRecord: 'C',
  },
  /** Semester loop: how long the "Mesej baru dari ..." banner shows before the chat opens (Task 25). */
  loop: { bannerMs: 1200 },
  /** Latihan: how long the simulated 997 call "connects", and how long a checklist confetti burst shows. */
  drill: { connectMs: 1200, burstMs: 1100 },
  desperation: { simpananBelow: 100, tekananUp: 10, cueAt: 60 },
  adaptive: { base: 100, bonus: 10, scamShareMin: 0.35, scamShareMax: 0.45 },
  /**
   * Money and Kalkulator numbers (D21, D22, SDS 5.7-5.8). Every rate here is an illustrative "contoh" and
   * TODO-VERIFY (CLAUDE.md rule 11). Rates are yearly decimals unless noted.
   */
  finance: {
    /** RM in Simpanan before investing counts as an emergency fund. */
    emergencyTarget: 300,
    /** A promised yearly return above this is flagged as Terlalu Lumayan in Semak Pulangan. */
    unrealisticAbove: 0.2,
    /** Tekanan added when money goes into Labur while Simpanan is below emergencyTarget. */
    laburBeforeEmergencyTekanan: 5,
    /** Amanah Cempaka (fictional fixed-price fund): illustrative yearly rate, credited weekly as amanahYearly / 52. */
    amanahYearly: 0.04,
    /**
     * Dana Ekuiti Cempaka (fictional unit trust): weekly % change for weeks 1-12 (index 0 = week 1).
     * Small gains, a scripted -6% dip in week 8 (index 7), and the value is back above its week-7 level by
     * week 11 (index 10), to teach that prices go up and down.
     */
    ekuitiPath: [0.8, 0.5, 0.7, 0.4, 0.6, 0.5, 0.6, -6, 3, 2, 2, 0.5],
    /** Source and year for amanahYearly, ekuitiPath and unrealisticAbove (illustrative, not market data). */
    illustrative: { source: 'TODO-VERIFY', year: 2026 },
    /**
     * Kalkulator defaults and limits (Task 18). Every rate is an illustrative "contoh", TODO-VERIFY (same source and
     * year as `illustrative`). Percents here are as typed in the app (5 = 5%).
     */
    calc: {
      defaults: {
        monthly: 50, ratePct: 5, startAge: 19, endAge: 30,
        promisedPct: 5, period: 'tahun' as 'hari' | 'minggu' | 'bulan' | 'tahun',
        amount: 1000, flatPct: 18, fee: 100, months: 12,
      },
      /** "Hingga umur" chips. */
      endAgeChips: [30, 55],
      /** Example-rate chips for Mesin Masa, one per example band (a "contoh" inside that band's range). */
      rateChips: [
        { band: 'simpanan', pct: 1 }, { band: 'simpananTetap', pct: 3 }, { band: 'hargaTetap', pct: 5 }, { band: 'unitAmanah', pct: 8 },
      ] as { band: 'simpanan' | 'simpananTetap' | 'hargaTetap' | 'unitAmanah'; pct: number }[],
      /** Sane limits so no input can overflow into NaN or Infinity. */
      maxAge: 100, maxMonths: 120, maxDigits: 9,
      /** Yearly rates from this percent up are shown as "lebih daripada ..." instead of a giant number. */
      displayCapPct: 10_000_000,
      /** Semak Pulangan chart scale, in percent a year (the shaded zone starts at unrealisticAbove). */
      scale: { minPct: -10, maxPct: 30 },
    },
    /** Illustrative yearly return ranges for Semak Pulangan. */
    bands: {
      simpanan: { min: 0.0025, max: 0.01, source: 'TODO-VERIFY', year: 2026 },
      simpananTetap: { min: 0.02, max: 0.035, source: 'TODO-VERIFY', year: 2026 },
      hargaTetap: { min: 0.03, max: 0.06, source: 'TODO-VERIFY', year: 2026 },
      unitAmanah: { min: -0.1, max: 0.12, source: 'TODO-VERIFY', year: 2026 },
    },
  },
  swipe: { cards: 10, seconds: 60, revealMs: 1500 },
  typing: { minMs: 600, maxMs: 1500 },
  /** After a chat ends: pause before "Lihat apa jadi seterusnya"; consequence step interval; flag hunt wrong taps. */
  aftermath: { endPauseMs: 800, stepMs: 900, stepMsReduced: 300, meterMs: 1000, wrongTaps: 3, flagSlopPx: 6 },
  /**
   * Mule consequence MoneyChain (UI-SPEC S09): pause before the first hop, each coin hop (600-1200 ms,
   * ease-in-out), the police trace back to "Akaun anda", one slow pulse period (well under 3 flashes a second),
   * and the stagger between fades with reduced motion (each fade under 200 ms).
   */
  moneyChain: { startMs: 500, hopMs: 1000, traceMs: 1600, pulseMs: 1800, reducedMs: 150 },
  persona: { hookMatch: 40, hookMiss: 10, max: 100 },
  kelas: { pointsCorrect: 100, rounds: 10, minTeams: 2, maxTeams: 6 },
  /** Finalist first guesses (SDS 5.9); tune after playtests. */
  suapan: { xpRight: 10 },
  /** Prices in RM. The cash items total RM383, under one part-time pay (D37). Instalment terms are examples. */
  kedai: {
    prices: { snek: 15, konsert: 99, earfon: 59, basikal: 150, buku: 60, telefon: 1200 },
    transportSaving: 10,
    instalment: { telefon: { monthly: 110, months: 12 } },
    tipAbove: 100,
  },
  matlamat: { targets: { kecemasan: 300, laptop: 500, raya: 250, labur: 200 }, nudgeWeeks: [4, 8], xpReached: 100 },
  papan: { grades: [42, 51, 58, 63, 67, 71, 76, 82, 90] },
} as const;
