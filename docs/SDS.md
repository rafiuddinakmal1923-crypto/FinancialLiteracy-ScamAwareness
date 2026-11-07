> Originally a snapshot of https://claude.ai/artifact/Dt1cRrzkLVjn5vriotwdtX . Since 6 Nov 2026 this file is the source of truth; docs/DECISIONS.md wins over it.
> Version 2, 6 Nov 2026 evening: hybrid direction (decisions D18-D28). Related: docs/SRS.md (requirements), docs/UI-SPEC.md (screens and components).
> Version 3, 7 Nov 2026: finalist modules, data and systems (D35-D44); tasks and owners in docs/IMPLEMENTATION-PLAN.md.

# Celik — Software Design Specification (SDS)

## 1. Overview and tech stack

Celik is a 2D, offline-first web app (PWA) that simulates a phone; stories are written in the ink narrative language, and all game rules (including the Kalkulator maths) run on the device with no server. Financial literacy is the core loop; scams are the high-stakes events inside it (D18).

| Layer | Choice | Why |
| --- | --- | --- |
| Language and build | TypeScript, Vite | Fast setup, small bundles |
| UI | React + Tailwind CSS | Quick to build the fake phone apps and screens |
| Animation | framer-motion | Chat bubbles, swipe cards, consequence timelines |
| Branching stories | ink + inkjs (MIT licence) | Writers author scenarios as plain text in the free Inky editor; the runtime plays them and tracks choices |
| State | zustand | Meters, inventory, settings |
| Content validation | zod | Swipe and money cards, tactics, concepts, calculator presets and Sindiket cards checked at load |
| Storage | Dexie (IndexedDB) | Progress, cards, best scores on the device |
| Offline | vite-plugin-pwa (Workbox) | Precache everything; installable |
| Share card (stretch) | html-to-image | Renders the result card as a PNG |
| Charts | Hand-written SVG | Mesin Masa growth line; no chart library (size budget) |
| Icons and fonts | lucide-react, @fontsource (bundled) | Works offline |
| Tests | Vitest, Playwright | Scoring and engine tests; end-to-end flows on phone viewports |
| Hosting (download only) | GitHub Pages or Netlify | Free static hosting |

No 3D, no backend and no AI at run time in the MVP.

## 2. Architecture

Scenarios, cards, concepts and calculator presets are written and reviewed centrally, shipped once with the app, and every mode then runs on the phone with no connection.

```text
 CENTRAL (team, before release)                 ON THE PHONE (offline after first load)
 +---------------------------+                  +--------------------------------------------------+
 | Content authoring         |                  | Service worker (precached app + content)         |
 | Inky (.ink scenarios),    |                  +--------------------------------------------------+
 | cards / tactics JSON,     |                  | Phone shell                                       |
 | content review checklist  |                  |  Home | Sembang | BankKu | Dompet | Kalkulator | Kad|
 +-------------+-------------+                  +--------------------------------------------------+
               |                                | Modes                                             |
               v                                |  Semester Pertama | Cek Harian | Mod Kelas        |
 +---------------------------+   one download   |  Latihan drills   | (Mod Sindiket: stretch)       |
 | Build + hosting           | ---------------> +--------------------------------------------------+
 | ink -> JSON, zod check,   |                  | Engines                                           |
 | Vite PWA build, static    |                  |  inkjs story | scheduler | meters | finance      |
 | host (GitHub Pages)       |                  +--------------------------------------------------+
 +---------------------------+                  | Storage: Dexie (IndexedDB) progress, cards, scores|
                                                +--------------------------------------------------+
```

All modes share the same engines and two score records, Celik Kewangan (6 finance concepts) and Imuniti (7 scam tactics), so progress in one mode changes what the others show. The phone shell is the part players see and judges will remember.

## 3. Module design

Twenty modules sit in three layers: the phone shell shows things, the engines decide things, and storage remembers things.

| Module | Responsibility | Key parts | Covers |
| --- | --- | --- | --- |
| Phone shell | Fake OS: home screen, status bar, notifications, app switcher | `PhoneFrame`, `HomeScreen`, `Notification`, `AppTile` | FR-02 |
| Story engine | Wraps inkjs: loads a scenario, returns lines and choices, reads tags for flags, effects and calculator hooks | `useStory`, `tagParser` | FR-06, FR-11 |
| Event scheduler | Builds the 12-week semester; picks each week's events, scam/legit mix and adaptive weighting | `scheduleSemester`, `pickNextEvent` | FR-03, FR-04, FR-72 |
| Meters and economy | Duit, Labur, Celik Kewangan per concept, Imuniti per tactic, Tekanan, Status Akaun, Rekod; applies effects from story tags | `useMeters`, `applyEffect` | FR-07, FR-10 |
| Dompet | Week-0 budget split, weekly costs, Labur pot (fixed-price fund and equity unit trust), emergency-fund bar, net worth | `BudgetSplit`, `WeeklyCosts`, `LaburPot` | FR-20 to FR-24, FR-29 |
| Kalkulator | Phone app with Mesin Masa, Semak Pulangan and Kos Sebenar tabs; opened from scenarios with presets | `Kalkulator`, `GrowthChart`, `useCalcPreset` | FR-11, FR-25 to FR-28 |
| Finance engine | Pure maths and scoring for money: future value, annualised rate, loan cost, Labur growth, money health | `finance.ts` | FR-25 to FR-27, NFR-16 |
| Consequence player | Plays "Apa jadi seterusnya" timelines, including the mule money-chain animation | `ConsequenceTimeline`, `MoneyChain` | FR-07, FR-08 |
| Flag hunt | Lets players tap tagged phrases in messages; awards Red Flag cards | `FlagHunt`, `cardAward` | FR-09, FR-71 |
| Sindiket (stretch) | Card builder, persona reaction model, badges, debrief, twist ending | `SyndicateDesk`, `personaModel`, `Debrief` | FR-30 to FR-34 |
| Cek Harian and swipe | Daily 5-card booster (swipe + money cards), date-seeded deck, streak with weekly freeze; 60-second Sahih atau Scam round | `DailyCheck`, `SwipeDeck`, `MoneyCard`, `streak` | FR-40 to FR-43 |
| Drills | 997 call drill, Semak Mule simulation, real-action checklist | `Drill997`, `SemakSim`, `ActionChecklist` | FR-50 to FR-52 |
| Class mode | Projector layout, teams, one-tap answers, scoreboard; scam and money cards | `ClassLobby`, `TeamBoard` | FR-60, FR-61 |
| Storage and share | Dexie progress, card book, best scores; PNG share card | `db`, `ShareCard` | FR-73, FR-74 |
| Suapan (finalist) | Feed of fictional posts; Percaya / Semak / Lapor; debrief; Semak opens the Kalkulator or a Kad Ilmu | `modes/suapan`, `engine/feed.ts` (`judgePost`) | FR-80, FR-81 |
| Kedai Kampus (finalist) | Shop shelf, confirm sheet, instalment preview; purchases change Duit, pots and weekly costs | `modes/kedai`, `engine/shop.ts` (`buyItem`, `itemPrice`) | FR-82 |
| Matlamat (finalist) | Goal picker after the week-0 split, goal bar in Dompet, result on the report card | `modes/matlamat`, `engine/goals.ts` (`goalProgress`, `goalReached`) | FR-83 |
| Papan Markah (finalist) | Ranking against fictional classmates | `modes/papan`, `engine/papan.ts` (`rankClassmates`) | FR-84 |
| Kongsi (finalist) | Kad Keputusan share image with `html-to-image` | `modes/kongsi` (`ShareButton`) | FR-85 |
| Tonton (finalist) | SVG frame player inside Kad Ilmu | `modes/tonton` (`ExplainerSlot`) | FR-86 |

## 4. Content and data design

Scam content is tagged with seven tactics and finance content with six concepts, so the game can measure both which tricks each player falls for and which money ideas they have mastered.

### 4.1 Tactic taxonomy

| Code | BM name | What it does | Example cue |
| --- | --- | --- | --- |
| `greed` | Terlalu Lumayan | Promises easy, outsized money | "RM300 sehari, kerja dari rumah" |
| `urgency` | Desakan Masa | Rushes the decision | "Slot tinggal 3 hari ni!" |
| `authority` | Menyamar Pihak Berkuasa | Pretends to be police, court, bank | "Saya Inspektor dari ibu pejabat polis" |
| `fear` | Ugutan | Threatens arrest, fines, blocked accounts | "Akaun anda akan dibekukan" |
| `secrecy` | Rahsiakan | Isolates the victim from advice | "Jangan beritahu sesiapa" |
| `social` | Bukti Palsu | Fake testimonials, fake friends | "500 pelajar dah join!" |
| `payfirst` | Bayar Dulu | Asks for a fee, top-up or account access first | "Top-up RM100 untuk tugasan 2" |

### 4.1b Finance concept taxonomy (D23)

| Code | BM name | What it teaches | Kad Ilmu "where to check" line |
| --- | --- | --- | --- |
| `bajet` | Bajet | Split money into needs, wants and savings before spending | Guide amounts such as KWSP's Belanjawanku |
| `kecemasan` | Dana Kecemasan | Keep an emergency fund before investing | - |
| `kompaun` | Kuasa Kompaun | Small regular amounts grow over time | - |
| `risiko` | Risiko vs Pulangan | Higher return means higher risk; nobody can guarantee a high return | SC Investor Alert List |
| `hutang` | Kos Hutang | Flat rates and fees cost more than they look | AKPK for debt help |
| `semak` | Semak Lesen | Check a product and its seller are licensed before paying | SC licence register, BNM Financial Consumer Alert List |

Real scheme and agency names appear only in `content/concepts.json` (D27).

### 4.2 Scenario format (ink)

Scenarios live in `content/scenarios/*.ink` (one scenario per file), compiled to JSON at build time. Global tags at the top carry metadata; line tags carry red flags, effects and the outcome (see docs/DECISIONS.md D14-D16):

```text
# id:kerja_sambilan
# type:scam
# family:job
# tactics:greed,urgency,payfirst
# contact:Kak Mira (HR)
# number:011-0000 0123
# hint:Syarikat sebenar tak minta bayaran untuk mula kerja.
# apa_patut:Semak sendiri sama ada syarikat itu berdaftar sebelum setuju.

Kak Mira (HR): Salam! Ada kerja part-time like & share, RM300 sehari. # flag:greed:RM300 sehari
Kak Mira (HR): Minat? Slot tinggal 3 je hari ni! # flag:urgency:Slot tinggal 3
* [Minat! Macam mana nak mula?] -> mula
* [Syarikat apa ni? Boleh saya semak syarikat ni berdaftar?] -> tanya
* [Abaikan] -> abaikan
=== mula ===
Kak Mira (HR): Tugasan 1 dapat RM30. Tugasan 2 perlu top-up RM100 dulu ya. # flag:payfirst:top-up RM100
* [Top-up RM100]
    Kak Mira (HR): Terima kasih! Komisen masuk esok ya. # effect:duit:-100 # outcome:scammed
    -> END
* [Tak nak bayar apa-apa]
    Kak Mira (HR): Ok takpe... # outcome:safe
    -> END
// knots tanya and abaikan omitted from this sample
```

Ink treats `//` as a comment, so in-game links never include `http://`: write `kurierkilat-bayar.test/alamat`. Fake numbers use `01X-0000 0NNN`. A line the writer is unsure of gets an ink comment `// REVIEW`.

Finance scenarios use the same format with `# type:finance`, `# concepts:` instead of `# tactics:`, the outcomes `untung`, `rugi` and `hutang`, and an optional calculator hook:

```text
# id:crypto_naga
# type:scam
# family:investment
# tactics:greed,social,urgency
# concepts:risiko,semak

Abang Rizal: Group CryptoNaga bagi 30% seminggu, confirm! # flag:greed:30% seminggu
* [Masuk RM500 sekarang]
    ...
* [Kira dulu berapa setahun] # ui:calc:pulangan:naga30w
    ...
```

`# ui:calc:<tab>:<preset-id>` opens the Kalkulator on that tab with the preset from `content/calc-presets.json` (D21). Using it counts as a found `greed` flag when the result is above `finance.unrealisticAbove`.

### 4.3 Swipe card and money card (JSON)

```json
{ "id": "c014", "sender": "BankKu", "text": { "ms": "Transaksi RM89.90 di KedaiOnline. Bukan anda? Hubungi nombor di belakang kad.", "en": "..." }, "answer": "legit", "tactics": [], "why": { "ms": "Tiada pautan, tiada OTP diminta, minta anda guna nombor rasmi sendiri." } }
```

Money card (`content/money-cards.json`, D25):

```json
{ "id": "m007", "kind": "truefalse", "concept": "kompaun", "text": { "ms": "RM50 sebulan selama 10 tahun pada 5% setahun jadi lebih RM7,700.", "en": "..." }, "answer": true, "why": { "ms": "Simpan RM6,000, pertumbuhan kompaun tambah lebih RM1,700. Contoh sahaja." } }
```

A `"kind": "pick"` card has two `options` and the index of the better one.

### 4.4 Sindiket cards (stretch)

- **Hook:** job offer, investment, parcel, romance, authority call
- **Tactic:** one of the 7 codes (each earns its badge when first used); the MVP ships greed, urgency and authority
- **Ask:** transfer fee, "rent" your account, share OTP, click link
- **Persona:** fictional target with traits (needs money, trusts authority, lonely, busy); the reaction model scores Hook × Tactic × Persona match

### 4.5 Progress record (IndexedDB)

| Field | Type | Example |
| --- | --- | --- |
| imuniti | map of tactic → 0–100 | { urgency: 70, authority: 40 } |
| celik | map of concept → 0–100 | { kecemasan: 60, kompaun: 40 } |
| kadIlmu | list of concept codes | ["bajet", "kompaun"] |
| labur | pot balances | { amanah: 200, ekuiti: 0 } |
| harian | streak, freeze used this week, last played date, best score | 6 days, false, 2026-11-08, 5/5 |
| cards | list of card IDs | ["greed-job", "payfirst-job"] |
| badges | list of tactic codes | ["urgency", "authority"] |
| semesters | list of reports | grade, money left, scams avoided |
| swipe | best score, streak, last played date | 9/10, 4 days |
| actions | real actions ticked | ["save-997", "bookmark-semak"] |
| goal (finalist) | chosen goal ID, reached flag | "kecemasan", false |
| purchases (finalist) | list of shop item IDs bought this semester, with week | [{ id: "basikal", week: 3 }] |
| feed (finalist) | map of post ID → call made and whether it was right | { p004: { call: "semak", right: true } } |

### 4.6 Finalist content (D35-D41)

Five new JSON files, validated with zod at load and by `npm run check:content` (fictional names, `.test` links and
`01X-0000 0NNN` numbers only). Text has `ms` and `en`; tunable numbers stay in `balance.ts` (CLAUDE.md rule 8).

Feed post (`content/feed.json`):

```json
{ "id": "p004", "kind": "hype", "author": { "name": "Abang Duit Pantas", "handle": "@duitpantas", "followers": "48.2K" },
  "text": { "ms": "Saya buat 2% sehari dengan robot dagangan. DM untuk join!", "en": "..." },
  "concept": "risiko", "tactics": ["greed"], "semak": { "calc": "p2harian" },
  "debrief": { "ms": "Tiada lesen, tiada risiko disebut, pulangan mustahil. Semak lesen dahulu.", "en": "..." } }
```

`kind` is `advice`, `hype` or `scam`; scam posts list `tactics`, advice and hype posts name a `concept`; `semak` opens
a Kalkulator preset (`calc`) or a Kad Ilmu (`kad`).

Shop item (`content/shop.json`; price in `balance.ts` under `kedai.prices`):

```json
{ "id": "basikal", "name": { "ms": "Basikal terpakai", "en": "Used bicycle" }, "pot": "kehendak",
  "effect": "transport", "tip": { "ms": "Jimat tambang setiap minggu.", "en": "..." } }
```

`pot` is `keperluan` or `kehendak`; `effect` is `none`, `transport` (cuts weekly transport) or `instalment` (opens
Kos Sebenar with preset `kedai-<id>`).

Goal (`content/goals.json`; target in `balance.ts` under `matlamat.targets`):
`{ "id": "kecemasan", "measure": "simpanan", "name": { "ms": "Dana kecemasan", "en": "Emergency fund" } }`;
`measure` is `simpanan`, `labur` or `duit`.

Classmate (`content/classmates.json`; grades in `balance.ts` under `papan.grades`):
`{ "id": "k3", "name": "Mei Ling", "avatar": "a3" }`, 9 entries, fictional names only.

Explainer (`content/explainers.json`; art in `assets/explainers/`):
`{ "id": "kompaun", "concept": "kompaun", "frames": [{ "svg": "kompaun-1", "caption": { "ms": "...", "en": "..." } }] }`,
6-8 frames, all explainers together under 150 KB.

## 5. Game systems

All numbers below are starting values for playtesting; they live in one `balance.ts` file so the team can tune them without touching logic.

### 5.1 Meters

| Meter | Range | Start | Changes when |
| --- | --- | --- | --- |
| Duit (money) | RM | RM2,000 (fictional PTPTN/scholarship) + RM400 part-time pay in weeks 4, 8 and 12 | Costs, scams, legit income |
| Imuniti per tactic | 0–100 | 30 each | Safe choices, flags found, swipe answers |
| Celik Kewangan per concept | 0–100 | 30 each | Right or wrong finance decisions, money cards |
| Labur | RM, two products | 0 | Moves at week intros; grows per SDS 5.8; not spendable |
| Tekanan (stress) | 0–100 | 20 | Losses and low money push it up; high stress makes desperate offers more tempting |
| Status Akaun | Aktif / Disekat / Ditutup | Aktif | Lending the account or scam transfers |
| Rekod | Bersih / Disiasat / Didakwa | Bersih | Only from accepting a mule-account offer |

Desperation effect: if Simpanan is below RM100 at a week intro, Tekanan +10. When Tekanan is 60 or more, desperate offers (job, mule, loan) show an urgency cue. Moving money into Labur while Simpanan is below `finance.emergencyTarget` (RM300) adds Tekanan +5 and shows the "dana kecemasan dulu" tip (D22).

### 5.2 Imuniti, Celik Kewangan and XP rules

| Event | Imuniti (that tactic) | XP |
| --- | --- | --- |
| Safe choice in a scam scenario | +10 | +50 |
| Fell for the scam | −15 | +20 (still learning) |
| Red flag found | +5 | +10 |
| Swipe correct / wrong | +3 / −5 | +5 / 0 |
| Sindiket badge earned | +5 | +30 |
| Drill completed | none | +40 |
| Real action ticked | none | +25 |
| Tanya Kancil hint | none | −10 (XP never goes below 0) |
| Right finance decision (`untung`, or `safe` in a finance scenario) | +10 Celik for each declared concept | +50 |
| Wrong finance decision (`rugi`, `hutang`) | −10 Celik for each declared concept | +20 |
| Money card correct / wrong | +3 / −5 Celik for its concept | +5 / 0 |
| Kalkulator used inside a scenario (once per scenario) | none | +10 |
| Kad Ilmu earned | none | +10 |

Rejecting a legitimate offer costs the missed income and shows a "Terlalu curiga?" (too suspicious?) tip, but no Imuniti penalty. Judgement accuracy is tracked separately.

**Levels by XP (D24):** Pemula 0–199 · Berjimat 200–499 · Bijak 500–899 · Pelabur 900–1,399 · Celik 1,400+.

### 5.3 Semester order and adaptive engine

The semester has 10 story scenarios (4 scam, 6 finance or legit) on 12 weeks (D20). The MVP uses the fixed order in `content/semester.json`:

| Week | Scenario | Type | Family or concepts |
| --- | --- | --- | --- |
| 1 | kerja_sambilan | scam | job |
| 2 | dompet_minggu0 | finance | bajet, kecemasan |
| 3 | sewa_akaun (hostel fees due) | scam | mule |
| 4 | gaji_pertama (first pay, campus cafe job) | finance | bajet, kompaun |
| 5 | kawan_labur (fictional licensed unit trust) | finance | risiko, semak |
| 6 | alert_bankku | legit | bank |
| 7 | mid-semester break: Mesin Masa reflection, no scenario | - | - |
| 8 | crypto_naga ("Kira dulu" opens Semak Pulangan) | scam | investment; risiko, semak |
| 9 | bayar_nanti (legal but costly BNPL; Kos Sebenar) | finance | hutang |
| 10 | buku_terpakai | legit | marketplace |
| 11 | panggilan_mahkamah | scam | authority |
| 12 | exams, report card | - | - |

Adaptive engine (stretch): each tactic and concept gets a weight of (100 − its score) + 10. For weeks 4–11 the scheduler picks the unplayed scenario with the highest total weight, keeping the scam share between 35% and 45% and never two scenarios of the same family in a row. kawan_labur always comes before crypto_naga.

### 5.4 Semester grade

Score = 30% judgement accuracy + 25% Celik Kewangan + 20% Imuniti + 15% money health + 10% flags found (D24). A ≥ 85, B ≥ 70, C ≥ 55, D below. A Rekod other than Bersih caps the grade at C.

- Judgement accuracy = right calls / all decisions × 100 (`safe` and `untung` are right; `scammed`, `mule`, `frozen`, `curiga`, `rugi` and `hutang` are wrong)
- Celik Kewangan = mean of the 6 concept scores; Imuniti = mean of the 7 tactic scores
- Money health = 50% money kept + 25% emergency fund + 25% invested, where money kept = (final Duit + Labur) / (starting money + all income) × 100 clamped to 0–100, emergency fund = Simpanan at week 12 / RM300 × 100 capped at 100, invested = 100 if Labur > 0 at week 12, else 0
- Flags found = flags found / flags in the scenarios played × 100

Example: judgement 80, Celik 60, Imuniti 60, money health 50, flags 70 → 65.5 → C.

### 5.5 Sindiket reaction model (stretch)

Success (0–100) = how well the Hook matches the persona's need + the sum of each Tactic × that persona's susceptibility, from a fixed table. The meter rises as tactics stack, which makes the manipulation visible; the debrief then shows the matching red flags.

### 5.6 Consequence templates

| Outcome tag | Timeline shown |
| --- | --- |
| `scammed` | Money leaves → scammer disappears → "what you could have checked" |
| `mule` | Victim's money → your account → syndicate → bank freezes your account → police trace to you → Penal Code 424A–424D explained |
| `frozen` | Account frozen → can't pay hostel or food → Tekanan rises |
| `safe` | Kancil coach congratulates; red flags revealed for collection |
| `untung` | Money grows or is protected → Mesin Masa shows the long-term effect → Kad Ilmu awarded |
| `rugi` | What the choice cost this semester → what would have happened with the other choice |
| `hutang` | Instalments eat the weekly budget → Kos Sebenar shows the total cost → where to get help (AKPK, `TODO-VERIFY`) |

### 5.7 Kalkulator formulas (`finance.ts`, D21)

All results round to the nearest sen. Rates are yearly decimals.

| Tab | Formula | Unit-test example |
| --- | --- | --- |
| Mesin Masa | FV = P0 × (1 + i)^n + PMT × ((1 + i)^n − 1) / i, with i = r / 12 and n = months; total contributed = P0 + PMT × n | PMT RM50, r 5%, 10 years → RM7,764.11 (contributed RM6,000); 19 to 30 (132 months) → RM8,775.28; 19 to 55 (432 months) → RM60,324.80 |
| Semak Pulangan | yearly = (1 + p)^(periods per year) − 1, with 365 days, 52 weeks or 12 months | 10% a month → 213.8% a year; 30% a week → far above `unrealisticAbove` (flag) |
| Kos Sebenar | total = P × (1 + flat × months / 12); instalment = total / months; effective yearly rate = 12 × monthly IRR solved by bisection | RM1,000, flat 18%, 12 months → total RM1,180.00, instalment RM98.33, effective about 31.7% a year |

`balance.ts` keeps `finance.bands` (illustrative yearly ranges for savings, fixed deposits, fixed-price funds and unit trusts, each `TODO-VERIFY` with its source and year), `finance.unrealisticAbove` (start at 0.2, meaning a guaranteed 20% a year or more is flagged) and `finance.emergencyTarget` (RM300).

### 5.8 Labur products (fictional, D22)

| Product | Type | Weekly change (MVP) | What it teaches |
| --- | --- | --- | --- |
| Amanah Cempaka | Fixed-price fund | Illustrative 4% a year, credited weekly (4% / 52) | Low risk, slow, steady |
| Dana Ekuiti Cempaka | Equity unit trust | Scripted path in `balance.ts` (small gains, −6% in week 8, recovery by week 11) | Prices go up and down; don't panic-sell |

### 5.9 Finalist systems and `balance.ts` additions (D36-D41)

**Suapan scoring (`judgePost`).** One call per post; the result is saved and cannot be replayed for points.

| Post kind | Percaya | Semak | Lapor |
| --- | --- | --- | --- |
| advice | right | right | wrong ("too suspicious", like `curiga`) |
| hype | wrong | right | neutral (no score change) |
| scam | wrong | right | right |

A right call on a scam post adds `imuniti.swipeRight` to each of its tactics; a wrong one adds `imuniti.swipeWrong`.
A right or wrong call on advice or hype changes Celik Kewangan for its concept by `celik.cardRight` or
`celik.cardWrong`. Each right call gives `suapan.xpRight` XP.

**Kedai Kampus (`buyItem`).** Pays the price from Duit (never below RM0; the buy button is disabled when Duit is
short), records the item and week, and moves the amount into the item's pot as spent. `transport` lowers each later
weekly transport cost by `kedai.transportSaving`. `instalment` opens Kos Sebenar first; confirming adds the monthly
instalment to the week intros of weeks 4, 8 and 12.

**Matlamat (`goalProgress`, `goalReached`).** Progress = current value of the goal's `measure` ÷ its target, capped
at 100%. Reached at week 12 gives `matlamat.xpReached` XP; the grade formula (D24) does not change. At each week intro
the player can move `finance.simpananStep` in or out of Simpanan from Dompet (D46); kecemasan, laptop and raya measure
Simpanan, labur measures both Labur pots.

**Papan Markah (`rankClassmates`).** Sorts the player's grade into `papan.grades`; ties place the player above.

**First-guess numbers** (tune after playtests; all in `balance.ts`):

```ts
suapan:   { xpRight: 10 },
kedai:    { prices: { snek: 15, konsert: 99, earfon: 59, basikal: 150, buku: 60, telefon: 1200 },
            transportSaving: 10, instalment: { telefon: { monthly: 110, months: 12 } }, tipAbove: 100 },
matlamat: { targets: { kecemasan: 300, laptop: 500, raya: 250, labur: 200 }, nudgeWeeks: [4, 8], xpReached: 100 },
papan:    { grades: [42, 51, 58, 63, 67, 71, 76, 82, 90] },
```

The cash items together cost RM383, under one part-time pay (RM400). A unit test plays a "buy nothing" and a "buy
everything" semester; both must reach week 12.

**i18n for new modes.** Each new mode keeps its UI strings in `modes/<mode>/i18n.ms.json` and `i18n.en.json`;
`shell/i18n/index.ts` merges them into the main dictionaries with `import.meta.glob` (eager), so new keys never touch
the shared `ms.json`. Key prefixes are the mode name (`suapan.*`, `kedai.*`) to avoid clashes.

## 6. Folders, build plan and testing

### 6.1 Project folder (D:\FinancialLiteracy-ScamAwareness)

```text
FinancialLiteracy-ScamAwareness/
  README.md, CLAUDE.md
  docs/          SRS.md, SDS.md, UI-SPEC.md, claude-code-prompt.md, DECISIONS.md
  research/      problem statement, gamification benchmark
  app/           Vite + React source
    src/
      shell/       fake phone OS, i18n
      engine/      story (inkjs), scheduler, meters, finance, adaptive, balance.ts
      modes/       semester, kalkulator, harian (Cek Harian + swipe), drills, classmode;
                   finalist: suapan, kedai, matlamat, papan, kongsi, tonton (each with i18n.ms.json, i18n.en.json)
      ui/          shared components (ChatBubble, MeterBar, CardTile...)
      storage/     Dexie, share card
  content/       scenarios/*.ink, cards.json, money-cards.json, concepts.json, calc-presets.json, tactics.json,
                 drills.json, semester.json, banned-names.txt, allowed-real-names.txt,
                 sindiket.json (roadmap); finalist: feed.json, shop.json, goals.json, classmates.json,
                 explainers.json
  assets/        illustrations, sounds, fonts
  video/, submission/
```

### 6.2 Build plan (milestone 2 done; Fri night to Mon)

Milestones after the pivot (D26): M3 money + mule → M4 Kalkulator → M5 Cek Harian + Mod Kelas → M6 full semester → M7 stretch.

| Day | Shell dev (phone UI) | Engine dev (story + meters + finance) | Modes dev | Content + video lead |
| --- | --- | --- | --- | --- |
| Fri 6 Nov (night) | BankKu, Dompet with 4 pots | `finance.ts` with tests; `labur` meter; new outcomes and tags; `balance.ts` and test updates | Kalkulator screen skeleton | Write dompet_minggu0 and sewa_akaun; concepts.json |
| Sat 7 Nov | Consequence and money-chain animation; Kad book with Kad Ilmu | Scheduler (35–45% band), grade, `ui:calc` directive | Kalkulator 3 tabs + Mesin Masa chart; Cek Harian | gaji_pertama, kawan_labur, crypto_naga, bayar_nanti; calc presets; 20 money cards; recruit testers |
| Sun 8 Nov | Week intros, report card, Kancil coach polish | Offline test, balance tuning | Mod Kelas with money cards; drills | alert_bankku, buku_terpakai, panggilan_mahkamah; 30 swipe cards; verify example rates; pre/post test; film the demo |
| Mon 9 Nov | Bug fixes | Bug fixes | Bug fixes | Edit the video, write form answers, submit by morning |

### 6.3 Testing

- **Vitest:** Imuniti, Celik Kewangan and XP rules, grade formula (including the 65.5 example), Kalkulator formulas (SDS 5.7 examples), Labur growth and the emergency-fund rule, scheduler scam share 35–45%, date-seeded Cek Harian deck and streak freeze, tag parser (`concepts`, `ui:calc`, `effect:labur`), zod schemas, persona model (stretch)
- **Playwright:** full mule scenario, crypto_naga with "Kira dulu" into Semak Pulangan, Dompet Labur move, a Cek Harian round, class mode with 2 teams, airplane mode, screenshots at 360×800, 412×915 and 1920×1080
- **Content check (`npm run check:content`):** no real brand names (content/banned-names.txt) except names in content/allowed-real-names.txt inside content/concepts.json only, no URL except `*.test` and semakmule.rmp.gov.my, no phone number except 997 and `01X-0000 0NNN`, every rate in concepts.json and balance.ts bands marked `TODO-VERIFY` or sourced
- **Content review:** every scenario checked for fictional brands, correct real-world actions and no victim-blaming copy
- **Playtest:** 5 students per day; record where they get confused

### 6.4 Finalist build plan and tests (10-18 Nov)

Tasks, owners, dependencies and the day-by-day schedule are in docs/IMPLEMENTATION-PLAN.md (D43). In short: Akmal
writes the contracts (types, schemas, engine stubs, routes, slots, i18n loading) on 10 Nov by 13:00; Wafi builds the
six new modes against the stubs; Danish writes the content files; Aimar owns the explainer art, validation test and
pitch. Code freeze Sun 15 Nov, 20:00.

- **Vitest (new):** `judgePost` for all 9 kind x call pairs; `buyItem` (Duit floor, pots, transport effect,
  instalment weeks); "buy nothing" and "buy everything" semesters reach week 12; `goalProgress` for the 4 goals;
  `rankClassmates` at grades 0, 65.5 and 100; zod schemas for the 5 new files; i18n merge of per-mode files
- **Playwright (new):** `suapan.spec.ts` ("2% a day" → Semak Pulangan red flag), `kedai.spec.ts` (instalment shows
  Kos Sebenar first), `matlamat.spec.ts`, `papan.spec.ts`, `kongsi.spec.ts` (PNG with SIMULASI label), `tonton.spec.ts`,
  `finalist-screens.spec.ts` (screenshots at 360x800, 412x915, 1920x1080), all offline
- **Content check:** the 5 new files go through the banned-name, URL and phone-number rules
- **Size:** new content and explainers add under 0.3 MB; `npm run size` stays under 8 MB
