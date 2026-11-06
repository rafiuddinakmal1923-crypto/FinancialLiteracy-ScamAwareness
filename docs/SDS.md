> Originally a snapshot of https://claude.ai/artifact/Dt1cRrzkLVjn5vriotwdtX . Since 6 Nov 2026 this file is the source of truth; docs/DECISIONS.md wins over it.
> Related: docs/SRS.md (requirements), docs/UI-SPEC.md (screens and components).

# Celik — Software Design Specification (SDS)

## 1. Overview and tech stack

Celik is a 2D, offline-first web app (PWA) that simulates a phone; stories are written in the ink narrative language, and all game rules run on the device with no server.

| Layer | Choice | Why |
| --- | --- | --- |
| Language and build | TypeScript, Vite | Fast setup, small bundles |
| UI | React + Tailwind CSS | Quick to build the fake phone apps and screens |
| Animation | framer-motion | Chat bubbles, swipe cards, consequence timelines |
| Branching stories | ink + inkjs (MIT licence) | Writers author scenarios as plain text in the free Inky editor; the runtime plays them and tracks choices |
| State | zustand | Meters, inventory, settings |
| Content validation | zod | Swipe cards, tactics and Sindiket cards checked at load |
| Storage | Dexie (IndexedDB) | Progress, cards, best scores on the device |
| Offline | vite-plugin-pwa (Workbox) | Precache everything; installable |
| Share card | html-to-image | Renders the Imuniti result card as a PNG |
| Icons and fonts | lucide-react, @fontsource (bundled) | Works offline |
| Tests | Vitest, Playwright | Scoring and engine tests; end-to-end flows on phone viewports |
| Hosting (download only) | GitHub Pages or Netlify | Free static hosting |

No 3D, no backend and no AI at run time in the MVP.

## 2. Architecture

Scenarios and cards are written and reviewed centrally, shipped once with the app, and every mode then runs on the phone with no connection.

```text
 CENTRAL (team, before release)                 ON THE PHONE (offline after first load)
 +---------------------------+                  +--------------------------------------------------+
 | Content authoring         |                  | Service worker (precached app + content)         |
 | Inky (.ink scenarios),    |                  +--------------------------------------------------+
 | cards / tactics JSON,     |                  | Phone shell                                       |
 | content review checklist  |                  |  Home | Sembang (chat) | BankKu | Dompet | Kad   |
 +-------------+-------------+                  +--------------------------------------------------+
               |                                | Modes                                             |
               v                                |  Semester Pertama | Mod Sindiket |                |
 +---------------------------+   one download   |  Sahih atau Scam  | Mod Kelas (+ Latihan drills)  |
 | Build + hosting           | ---------------> +--------------------------------------------------+
 | ink -> JSON, zod check,   |                  | Engines                                           |
 | Vite PWA build, static    |                  |  inkjs story | scheduler | meters | adaptive      |
 | host (GitHub Pages)       |                  +--------------------------------------------------+
 +---------------------------+                  | Storage: Dexie (IndexedDB) progress, cards, scores|
                                                +--------------------------------------------------+
```

All four modes share the same engines and the same seven-tactic Imuniti record, so progress in one mode changes what the others show. The phone shell is the part players see and judges will remember.

## 3. Module design

Twelve modules sit in three layers: the phone shell shows things, the engines decide things, and storage remembers things.

| Module | Responsibility | Key parts | Covers |
| --- | --- | --- | --- |
| Phone shell | Fake OS: home screen, status bar, notifications, app switcher | `PhoneFrame`, `HomeScreen`, `Notification`, `AppTile` | FR-02 |
| Story engine | Wraps inkjs: loads a scenario, returns lines and choices, reads tags for flags and effects | `useStory`, `tagParser` | FR-06 |
| Event scheduler | Builds the 12-week semester; picks each week's events, scam/legit mix and adaptive weighting | `scheduleSemester`, `pickNextEvent` | FR-03, FR-04, FR-72 |
| Meters and economy | Duit, Imuniti per tactic, Tekanan, Status Akaun, Rekod; applies effects from story tags | `useMeters`, `applyEffect` | FR-07, FR-10 |
| Dompet | Week-0 budget split, weekly costs, BNPL and loan offers | `BudgetSplit`, `WeeklyCosts` | FR-20 to FR-23 |
| Consequence player | Plays "Apa jadi seterusnya" timelines, including the mule money-chain animation | `ConsequenceTimeline`, `MoneyChain` | FR-07, FR-08 |
| Flag hunt | Lets players tap tagged phrases in messages; awards Red Flag cards | `FlagHunt`, `cardAward` | FR-09, FR-71 |
| Sindiket | Card builder, persona reaction model, badges, debrief, twist ending | `SyndicateDesk`, `personaModel`, `Debrief` | FR-30 to FR-34 |
| Swipe game | Sahih atau Scam card stack, timer, explanations, streak | `SwipeDeck`, `streak` | FR-40 to FR-42 |
| Drills | 997 call drill, Semak Mule simulation, real-action checklist | `Drill997`, `SemakSim`, `ActionChecklist` | FR-50 to FR-52 |
| Class mode | Projector layout, teams, one-tap answers, scoreboard | `ClassLobby`, `TeamBoard` | FR-60, FR-61 |
| Storage and share | Dexie progress, card book, best scores; PNG share card | `db`, `ShareCard` | FR-73, FR-74 |

## 4. Content and data design

Every scenario, card and badge is tagged with the same seven tactics, so the game can measure which tricks each player falls for.

### 4.1 Tactic taxonomy

| Code | BM name | What it does | Example cue |
| --- | --- | --- | --- |
| `greed` | Terlalu Lumayan | Promises easy, outsized money | "RM300 sehari, kerja dari rumah" |
| `urgency` | Desakan Masa | Rushes the decision | "Slot tinggal 3 hari ni!" |
| `authority` | Menyamar Pihak Berkuasa | Pretends to be police, court, bank | "Saya Inspektor dari Bukit Aman" |
| `fear` | Ugutan | Threatens arrest, fines, blocked accounts | "Akaun anda akan dibekukan" |
| `secrecy` | Rahsiakan | Isolates the victim from advice | "Jangan beritahu sesiapa" |
| `social` | Bukti Palsu | Fake testimonials, fake friends | "500 pelajar dah join!" |
| `payfirst` | Bayar Dulu | Asks for a fee, top-up or account access first | "Top-up RM100 untuk tugasan 2" |

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
# apa_patut:Semak syarikat dengan SSM sebelum setuju.

Kak Mira (HR): Salam! Ada kerja part-time like & share, RM300 sehari. # flag:greed:RM300 sehari
Kak Mira (HR): Minat? Slot tinggal 3 je hari ni! # flag:urgency:Slot tinggal 3
* [Minat! Macam mana nak mula?] -> mula
* [Syarikat apa ni? Boleh saya semak SSM?] -> tanya
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

### 4.3 Swipe card (JSON)

```json
{ "id": "c014", "sender": "BankKu", "text": { "ms": "Transaksi RM89.90 di KedaiOnline. Bukan anda? Hubungi nombor di belakang kad.", "en": "..." }, "answer": "legit", "tactics": [], "why": { "ms": "Tiada pautan, tiada OTP diminta, minta anda guna nombor rasmi sendiri." } }
```

### 4.4 Sindiket cards

- **Hook:** job offer, investment, parcel, romance, authority call
- **Tactic:** one of the 7 codes (each earns its badge when first used); the MVP ships greed, urgency and authority
- **Ask:** transfer fee, "rent" your account, share OTP, click link
- **Persona:** fictional target with traits (needs money, trusts authority, lonely, busy); the reaction model scores Hook × Tactic × Persona match

### 4.5 Progress record (IndexedDB)

| Field | Type | Example |
| --- | --- | --- |
| imuniti | map of tactic → 0–100 | { urgency: 70, authority: 40 } |
| cards | list of card IDs | ["greed-job", "payfirst-job"] |
| badges | list of tactic codes | ["urgency", "authority"] |
| semesters | list of reports | grade, money left, scams avoided |
| swipe | best score, streak, last played date | 9/10, 4 days |
| actions | real actions ticked | ["save-997", "bookmark-semak"] |

## 5. Game systems

All numbers below are starting values for playtesting; they live in one `balance.ts` file so the team can tune them without touching logic.

### 5.1 Meters

| Meter | Range | Start | Changes when |
| --- | --- | --- | --- |
| Duit (money) | RM | RM2,000 (fictional PTPTN/scholarship) + RM400 part-time per month | Costs, scams, legit income |
| Imuniti per tactic | 0–100 | 30 each | Safe choices, flags found, swipe answers |
| Tekanan (stress) | 0–100 | 20 | Losses and low money push it up; high stress makes desperate offers more tempting |
| Status Akaun | Aktif / Disekat / Ditutup | Aktif | Lending the account or scam transfers |
| Rekod | Bersih / Disiasat / Didakwa | Bersih | Only from accepting a mule-account offer |

Desperation effect: if Simpanan is below RM100 at a week intro, Tekanan +10. When Tekanan is 60 or more, desperate offers (job, mule, loan) show an urgency cue.

### 5.2 Imuniti and XP rules

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

Rejecting a legitimate offer costs the missed income and shows a "Terlalu curiga?" (too suspicious?) tip, but no Imuniti penalty. Judgement accuracy is tracked separately.

**Levels by XP:** Mangsa 0–199 · Waspada 200–499 · Bijak 500–899 · Penjaga 900–1,399 · Wira Anti-Scam 1,400+.

### 5.3 Adaptive engine

The semester has 10 story scenarios (6 scam, 4 legit) on 12 weeks. The MVP uses the fixed order in `content/semester.json`:

| Week | Scenario | Type | Family |
| --- | --- | --- | --- |
| 1 | kerja_sambilan | scam | job |
| 2 | yuran_kelas | legit | payment |
| 3 | sewa_akaun (hostel fees due) | scam | mule |
| 4 | kerja_kafe | legit | job |
| 5 | parcel_kurier | scam | parcel |
| 6 | alert_bankku | legit | bank |
| 7 | mid-semester break, no scenario | - | - |
| 8 | crypto_naga | scam | investment |
| 9 | pinjam_cepat | scam | loan |
| 10 | buku_terpakai | legit | marketplace |
| 11 | panggilan_mahkamah | scam | authority |
| 12 | exams, report card | - | - |

Adaptive engine (stretch): each tactic gets a weight of (100 − its Imuniti) + 10. For weeks 4-11 the scheduler picks the unplayed scenario whose tactics have the highest total weight, keeping the scam share between 55% and 65% and never two scenarios of the same family in a row.

### 5.4 Semester grade

Score = 40% judgement accuracy + 30% overall Imuniti + 20% money kept + 10% flags found. A ≥ 85, B ≥ 70, C ≥ 55, D below. A Rekod other than Bersih caps the grade at C.

- Judgement accuracy = right calls / all decisions × 100 (avoiding a scam and accepting a legit offer are right calls)
- Overall Imuniti = mean of the 7 tactic scores
- Money kept = final Duit / (starting money + all income) × 100, clamped to 0–100
- Flags found = flags found / flags in the scenarios played × 100

### 5.5 Sindiket reaction model

Success (0–100) = how well the Hook matches the persona's need + the sum of each Tactic × that persona's susceptibility, from a fixed table. The meter rises as tactics stack, which makes the manipulation visible; the debrief then shows the matching red flags.

### 5.6 Consequence templates

| Outcome tag | Timeline shown |
| --- | --- |
| `scammed` | Money leaves → scammer disappears → "what you could have checked" |
| `mule` | Victim's money → your account → syndicate → bank freezes your account → police trace to you → Penal Code 424A–424D explained |
| `frozen` | Account frozen → can't pay hostel or food → Tekanan rises |
| `safe` | Kancil coach congratulates; red flags revealed for collection |

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
      engine/      story (inkjs), scheduler, meters, adaptive, balance.ts
      modes/       semester, sindiket, swipe, drills, classmode
      ui/          shared components (ChatBubble, MeterBar, CardTile...)
      storage/     Dexie, share card
  content/       scenarios/*.ink, cards.json, sindiket.json (hooks, tactics, asks, personas), tactics.json,
                 drills.json, semester.json, banned-names.txt
  assets/        illustrations, sounds, fonts
  video/, submission/
```

### 6.2 Build plan (Fri afternoon to Mon)

| Day | Shell dev (phone UI) | Engine dev (story + meters) | Modes dev (swipe, Sindiket, class) | Content + video lead |
| --- | --- | --- | --- | --- |
| Fri 6 Nov (pm) | Scaffold, PWA, phone frame, home screen, Chat app | inkjs wrapper, tag parser, meters store | Swipe deck with 10 placeholder cards | Write the job-scam and mule ink scenarios |
| Sat 7 Nov | BankKu, Dompet, consequence timeline, money-chain animation | Scheduler, effects, flag hunt, report card | Sindiket desk with 3 tactics + debrief; class mode | 4 more scam + 2 legit scenarios; 30 swipe cards; recruit 20 testers |
| Sun 8 Nov | Polish, Kancil coach, share card | Adaptive engine, balance tuning, offline test | Drills (997, Semak sim, checklist) | Pre/post test with UTP first-years; film the demo |
| Mon 9 Nov | Bug fixes | Bug fixes | Bug fixes | Edit the video, write form answers, submit by morning |

### 6.3 Testing

- **Vitest:** Imuniti and XP rules, grade formula, adaptive pick, persona model, tag parser, zod schemas
- **Playwright:** full mule scenario, one Sindiket round, swipe round, class mode with 2 teams, airplane mode, screenshots at 360×800, 412×915 and 1920×1080
- **Content check (`npm run check:content`):** no real brand names (content/banned-names.txt), no URL except `*.test` and semakmule.rmp.gov.my, no phone number except 997 and `01X-0000 0NNN`
- **Content review:** every scenario checked for fictional brands, correct real-world actions and no victim-blaming copy
- **Playtest:** 5 students per day; record where they get confused
