# Celik: New Features, Team Split and Business Model

Agreed plan, 7 Nov 2026. Input for docs/IMPLEMENTATION-PLAN.md. Assumes Celik is the entry submitted on 9 Nov.
Team: A. Akmal (Lead), B. Wafi (Builder), C. Danish (Content), D. Aimar (Pitch).

## 1. Recommendation

Build five features before 18 Nov (about 36 hours), plus 6 hours for two animated explainers, plus an optional
Raya event pack (5 hours). Every feature keeps Celik's hard rules: offline, no backend, no real data.

| Feature | What it is | Why |
| --- | --- | --- |
| **Suapan** ("Thread" idea) | A new app on the fake phone: a feed of posts from fictional accounts, mixing good money advice, misleading "finfluencer" posts and scam ads. The player judges each one | Teaches the skill students need most on real social media: telling advice from hype. Shipped as content, so no server |
| **Kedai Kampus** (shop idea) | A campus shop where items cost the semester's own Duit (in-game money) | Every purchase is a needs-vs-wants decision; Mesin Masa shows what the money could have grown into |
| **Matlamat Semester** | The player picks one goal at the start (laptop, emergency fund, ticket home for Raya) and tracks it weekly | Borrowed from Mind Your Ringgit; goal-based saving is a core money habit |
| **Papan Markah** (leaderboard idea, offline) | Your score against fictional classmates, plus the existing Mod Kelas scoreboard | A leaderboard without collecting anyone's data |
| **Kad Keputusan** | A shareable image of the semester report | Free reach among students; already FR-73 ("could have") |

- **Video lessons:** no video files in the app (they break the 8 MB budget, need internet, or link to real sites that
  rule 1 forbids). Build 2 short animated SVG explainers inside Kad Ilmu ("Tonton", 6 hours). Full video series go on
  social media after the competition.
- **Business model:** free for every student, paid for by institutions. Universities licence an orientation-week
  package; a grant or sponsor (financial-education bodies, bank CSR) funds the pilot. Backup: grant funding alone.
  Freemium aimed at B40 students is not recommended.
- **Team plan:** four lanes with no shared files. Akmal writes the shared contracts on 10 Nov by 13:00; nobody waits
  after that.

## 2. Benchmark (Mind Your Ringgit and others)

Mind Your Ringgit (Visa Malaysia, supporting the Financial Education Network): a 12-month web simulation. Players pick
a goal, meet a monthly milestone, and each choice moves money, health and happiness. A budget manager tracks savings,
debts and commitments; each month ends with tips. One 2021 review said it felt like a questionnaire.

| Mechanic | Source | Celik has it? | Borrow? |
| --- | --- | --- | --- |
| Choose a goal, milestones | Mind Your Ringgit | No | Yes: Matlamat Semester |
| Trade-off meters (money, health, happiness) | Mind Your Ringgit | Partly (Duit, Simpanan, Labur, Tekanan) | No: Tekanan does this job |
| Budget manager | Mind Your Ringgit, Belanjawanku | Yes (Dompet) | - |
| Tips after each period | Mind Your Ringgit | Yes (Apa jadi seterusnya, Kancil, Kad Ilmu) | - |
| Festive and life events | Mind Your Ringgit | No | Later / optional: Raya event pack |
| Share result for a prize | Mind Your Ringgit, #XiamTheScams | No (FR-73 is C) | Yes: Kad Keputusan |
| Scam and legit mixed | #XiamTheScams | Yes (40% scams) | - |
| Reward real actions | #XiamTheScams | Yes (FR-52) | - |
| Play the manipulator | Bad News | Planned (Mod Sindiket) | After 18 Nov |
| Daily streak | Duolingo, Zogo | Yes (Cek Harian) | - |
| Live group battle | Kahoot, SPF kiosks | Yes (Mod Kelas) | - |
| Spend points in a shop | Zogo, mobile games | No | Yes, as a lesson: Kedai Kampus |
| Judge posts in a social feed | None of the benchmarks | No | Yes: Suapan (most original addition) |
| Leaderboard | Kahoot, Duolingo | Only in Mod Kelas | Yes, offline: fictional classmates |

## 3. Feature assessment

Priority = (Impact + 3 - Risk) / Effort in hours. Impact and Risk 0-3. Build is 1.44 MB today; budget 8 MB.

### Before 18 Nov (about 47 hours including the optional Raya pack)

| Feature | How it works | Rule conflict -> compliant version | Impact | Risk | Effort (h) | Size | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Papan Markah | Report grade and Cek Harian streak ranked against 9 fictional classmates; Mod Kelas scoreboard stays as the live version | Online leaderboard needs a server and names (rules 2, 5) -> fictional classmates only | 2 | 0 | 4 | ~5 KB | 1.25 |
| Kad Keputusan | Semester report drawn as an image to save or share | A name field breaks rule 2 -> uses the character's name (Aina or Amir), no text input | 2 | 0 | 4 | ~10 KB | 1.25 |
| Matlamat Semester | Pick 1 of 4 goals at week 0; progress bar on Dompet; report card shows the result | None | 2 | 0 | 6 | ~5 KB | 0.83 |
| Raya event pack (optional) | One festive scenario: duit raya budget plus a fake e-greeting card that installs an app | None (ordinary .ink scenario) | 1 | 0 | 5 | ~15 KB | 0.80 |
| Tonton (2 explainers) | 45-second animated explainers (compound growth, cost of debt) inside Kad Ilmu | Video breaks size/offline; real links break rule 1 -> SVG frames with captions | 2 | 1 | 6 | ~100 KB | 0.67 |
| Kedai Kampus | Shop priced in Duit; purchases logged as Kehendak; a used bicycle cuts weekly transport cost | Changes game balance -> all prices in balance.ts, with scheduler tests | 3 | 1 | 10 | ~20 KB | 0.50 |
| Suapan | Feed of 20 posts from fictional accounts; Percaya / Semak / Lapor; Semak opens the Kalkulator or a Kad Ilmu | User posts need a server, moderation, real accounts (rules 2, 5) -> curated posts shipped as content | 3 | 1 | 12 | ~30 KB | 0.42 |

### After the competition

| Feature | Why later | Priority |
| --- | --- | --- |
| Cosmetic shop (avatar items for stars) | Teaches nothing new; Kedai Kampus covers the idea | 0.50 |
| Financial-literacy videos on TikTok / Instagram | Marketing, not product | 0.40 |
| Mod Sindiket | 20 hours; can look like a scam generator if rushed | 0.20 |
| Online campus leaderboards | Needs a server and privacy review: a rule change | 0.07 |
| Suapan with real user posts | Needs a server, moderation and personal data | 0.05 |

### Drop

- Video files inside the app (size and offline).
- Real-money purchases (selling to B40 students contradicts the mission).

## 4. Feature details

### Suapan
- New home tile; scrolling feed; each post: fictional account (avatar, name, follower count), text, sometimes a chart
  or screenshot; buttons Percaya (trust), Semak (check), Lapor (report).
- 20 posts: 8 sound advice, 6 misleading but legal hype, 6 scams (fake investment ad, job offer, account rental).
- Data: `content/feed.json` (zod). Reuses swipe-card fields (verdict, tactic or concept, one-line reason); adds
  `author` and `kind: advice | hype | scam`.
- Scoring: right call on a scam raises Imuniti for its tactic; right call on advice/hype raises Celik Kewangan for its
  concept. Semak opens the Kalkulator with the post's numbers (existing `# ui:calc` presets).
- Every hype post ends with a debrief (what was missing: licence, risk, fees). No real product names (rules 1, 12).
- Demo moment: "2% a day" post -> Semak -> Semak Pulangan shows over 1,000% a year and the Terlalu Lumayan flag.

### Kedai Kampus
- 8-10 items: snacks, concert ticket, earphones, phone upgrade on instalment, used bicycle, textbook.
- Paid from Duit, logged as Kehendak (textbook: Keperluan). Bicycle cuts weekly transport cost. Phone upgrade opens
  Kos Sebenar. After a purchase over RM100, a Kancil tip offers Mesin Masa.
- Data: `content/shop.json` (item, price, pot, effect); numbers in `balance.ts`.
- Balance guard: total shop spending stays below the RM400 part-time pay; scheduler tests for "buy nothing" and
  "buy everything" both finish week 12.

### Matlamat Semester
- After the week-0 split, choose: emergency fund RM300, laptop RM1,500, ticket home for Raya RM250, or start investing
  RM200. Progress bar on Dompet; Kancil nudge at weeks 4 and 8; report card line "Goal reached?".
- Data: `content/goals.json`.

### Papan Markah and Kad Keputusan
- Papan Markah: 10 names (9 fictional classmates plus you) ranked by semester grade, with Cek Harian streak.
  Data: `content/classmates.json`.
- Kad Keputusan: share button on the report card draws a 1080x1350 image (grade, Celik Kewangan, Imuniti, goal
  result, tagline, SIMULASI label) with the browser canvas; no new library.

### Tonton
- Compound growth (RM50 a month to age 55) and cost of debt (RM1,000 BNPL). 6-8 SVG frames each, BM/EN captions,
  tap-to-advance or auto-play, inside the matching Kad Ilmu. No audio files.
- Data: `content/explainers.json`; art in `assets/explainers/`.

## 5. Business model

| Model | Fit with B40 students | Fit with rules | Believable? | Verdict |
| --- | --- | --- | --- | --- |
| Freemium (students pay) | Poor | Fine | Low | Not recommended |
| University licence (orientation package: Mod Kelas kit, seasonal packs, training) | Good: free to students | Fine (a future dashboard needs a server) | High: fits MOHE mule-account awareness and every intake | **Main** |
| Sponsorship (banks, agencies, CSR) | Good | Sponsors never appear as brands or advice (rules 1, 12); splash credit only | Medium-high | **Backup**, with an independence rule |
| Government / grant | Good | Fine | High for a pilot | **Funds the pilot** |
| Paid content packs | Poor if students pay | Fine | Medium | Fold into the licence |

Phases: pilot at 2-3 universities (grant or sponsor, before/after test from SRS 5.3) -> yearly licence per university
(price per student [TO FILL], tested in the pilot) -> later an anonymous dashboard and campus leaderboards (needs a
server and a rule change).

Pitch line: "Free for every student, forever. Universities and partners pay for the orientation programme, the way
they already pay for awareness talks, except this one students remember."

## 6. Team split

Rule: nobody edits a file they do not own; they ask the owner, who does it the same day.

| Person | Lane | Owns (only they edit) | Depends on | First task (10 Nov) | Done when |
| --- | --- | --- | --- | --- | --- |
| **A. Akmal** | Lead: engine, integration, release | `app/src/engine/`, `state/`, `storage/`, `shell/` (except `i18n/ms.json`, `i18n/en.json`), `ui/`, all existing `modes/*`, existing `app/e2e/` specs, `app/scripts/`, `package.json` + lockfile, configs, `netlify.toml`, `main` | Nobody | Contracts merged by 13:00 | All features merged, `npm run check` and Playwright green, deployed, demo runs offline |
| **B. Wafi** | Builder: new feature screens | New `app/src/modes/suapan/`, `kedai/`, `matlamat/`, `papan/`, `kongsi/`, `tonton/` (each with `i18n.ms.json`, `i18n.en.json`); one new Playwright spec per feature | Akmal's contracts (then stubs) | Suapan feed screen on example posts | 6 screens work at 360x800, 412x915, 1920x1080, offline, BM and EN |
| **C. Danish** | Content: content, copy, accuracy | `content/` (except `explainers.json`), `content/scenarios/` incl. `en/`, `app/src/shell/i18n/ms.json`, `en.json`, `allowed-real-names.txt`, `banned-names.txt` | Akmal's schemas | 20 feed posts in BM | New content passes `check:content`; legal lines and rates in the demo verified; BM read done |
| **D. Aimar** | Pitch: business, evidence, demo, art | New `docs/business/`, `docs/pitch/`, `research/validation/`, `assets/explainers/`, `content/explainers.json`; `submission/`, `video/` | Nobody | Book 10-20 students for the before/after test; business one-pager | Slides, demo script, Q&A sheet, test results, 2 explainers ready by 17 Nov |

### Contracts (Akmal, 10 Nov, by 13:00)
1. Types and zod schemas in `engine/types.ts`, `engine/schemas.ts`: FeedPost, ShopItem, Goal, Classmate, Explainer.
2. One valid example per type in each new content file; ownership then passes to Danish (Aimar for `explainers.json`).
3. Engine function stubs: `judgePost()`, `buyItem()`, `goalProgress()`, `rankClassmates()`.
4. Routes and home tiles for Suapan, Kedai, Papan, pointing to placeholders in Wafi's folders.
5. Slots in Akmal's screens: `GoalBar` in Dompet, `ShareButton` in the report card, `ExplainerSlot` in Kad Ilmu, each
   importing a component from Wafi's folder.
6. Per-feature i18n loading in `shell/i18n/index.ts` (merges `modes/<feature>/i18n.*.json`).

### Merge rules
- One branch per person (`lane/akmal`, `lane/wafi`, `lane/danish`, `lane/aimar`) from `main` after the contracts.
- Akmal merges daily at 20:00: Danish, Wafi, Aimar, Akmal; runs `npm run check` and Playwright after each.
- A red build goes back to its owner next morning; nobody else is blocked.
- New npm packages and `balance.ts` changes go through Akmal only.
- 15-minute stand-up each morning.

## 7. Timeline, 10-18 Nov (code freeze Sun 15 Nov, 20:00)

| Day | A. Akmal | B. Wafi | C. Danish | D. Aimar |
| --- | --- | --- | --- | --- |
| Tue 10 | Contracts by 13:00; fix wave from HANDOFF | Suapan screen | 20 feed posts (BM) | Book students; business one-pager |
| Wed 11 | `judgePost()`, feed scoring; merge | Suapan buttons, Semak -> Kalkulator; spec | Feed posts (EN); `shop.json` | 12-question test form (SRS 5.3); cost model |
| Thu 12 (shortlist) | `buyItem()`, shop effects; merge | Kedai Kampus screen | `goals.json`, `classmates.json`; verify demo legal lines and rates | Shortlisted: slides. Not: stop |
| Fri 13 | `goalProgress()`, `rankClassmates()`; merge | GoalBar, Papan Markah | Raya scenario (BM), if time | Explainer art: compound growth |
| Sat 14 | Performance pass (4x CPU throttle); merge | Kad Keputusan; Tonton player | Raya (EN); BM read of new copy | Run the test; explainer art: cost of debt |
| Sun 15 | Final merge; freeze 20:00; deploy | Fix specs; 3 viewports | Fix checker errors | Analyse results; slides v1 |
| Mon 16 | Fixes; offline check on 2 phones | Fixes | Proofread on deployed app | Demo script; rehearsal |
| Tue 17 | Backup phone; offline demo recording | Rehearse demo path | Q&A fact sheet | Final slides; Q&A drill |
| Wed 18 | Runs the demo | Backup phone | Fact questions | Presents |

Hours: Akmal ~30, Wafi ~27, Danish ~22, Aimar ~28.

## 8. Risks

| Risk | What to do |
| --- | --- |
| Kedai Kampus breaks game balance | Shop total below RM400; scheduler tests for buy-nothing and buy-everything runs |
| Suapan hype posts read as advice (rule 12) | Debrief on every hype post; no real product names |
| Contracts slip past 10 Nov noon | Danish drafts posts in a plain doc; Wafi sketches screens |
| Too much for a 5-minute pitch | Demo only the "2% a day" post and one shop purchase; the rest on one slide |

## 9. Open questions
- Online features (leaderboards, user posts) after the competition need a rule change: decide as a team.
- Price per student for the licence: ask a university HEP office what it spends on awareness programmes.
- Confirm MOHE's mule-account programmes and BNM's FEN Proaktif plan are current before the pitch.
