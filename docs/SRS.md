> Source of truth since 6 Nov 2026 (live doc: https://claude.ai/artifact/3woKSQeWmxHZVgipLPpBmj). docs/DECISIONS.md wins over it.
> Version 2, 6 Nov 2026 evening: hybrid direction (decisions D18-D28). Related: docs/SDS.md, docs/UI-SPEC.md.

# Celik — Software Requirements Specification (SRS)

## 1. Introduction

Celik (tagline "Bijak duit, kebal scam" — money-smart, scam-proof; "celik" is the Malay word for literate, as in celik kewangan, financial literacy) is a mobile-first game where university students live through a semester of real money decisions: budgeting, building an emergency fund, saving, learning how money grows and what a realistic return looks like, and handling debt. Scams appear inside that life as the high-stakes events, so students learn to grow their money and to spot who is trying to take it.

### 1.1 Purpose

This SRS defines what the Celik MVP must do for the Festival Idea Putrajaya 2026 Innovation Challenge (IPT category, theme Edutainment & Innovation; entry closes 9 Nov 2026, 11.59 pm). It is the reference for the build, testing and the 5-minute video.

### 1.2 Scope

- **In scope (MVP):** Semester Pertama story mode (finance decisions and scam events), Dompet with a Labur (investing) pot, Kalkulator (Mesin Masa, Semak Pulangan, Kos Sebenar), Cek Harian daily booster, Sahih atau Scam quick round, Latihan Tindakan action drills, Mod Kelas for orientation and classes, Red Flag and Kad Ilmu cards, Celik Kewangan and Imuniti scores, semester report card, Bahasa Melayu with English.
- **Finalist stretch (by 18 Nov):** Mod Sindiket (play the scammer), adaptive scenario order, share card.
- **Out of scope (roadmap):** later semesters as seasons (internship allowance, first EPF contribution, investing before graduation), monthly new-alert packs, online live mode, campus leaderboards, partner rewards, university dashboard.

### 1.3 Definitions

| Term | Meaning |
| --- | --- |
| Scenario | A short branching story (a chat, call or ad): a scam, a legitimate offer, or a money decision |
| Finance concept | One of 6 ideas the game measures: budgeting, emergency fund, compound growth, risk vs return, cost of debt, checking a product is licensed |
| Celik Kewangan | The player's financial literacy score, overall and per concept (0–100) |
| Tactic | A manipulation technique used in scams (urgency, authority, greed, fear, secrecy, social proof, pay-first) |
| Imuniti | The player's scam-resistance score, overall and per tactic (0–100) |
| Red Flag card | A collectible card earned by spotting a tactic in a message |
| Kad Ilmu | A knowledge card for a finance concept, earned the first time the concept appears |
| Labur | The investing pot in Dompet; not spendable cash |
| Mule account | A bank account used by syndicates to receive and move stolen money |
| Booster | A short repeat activity that refreshes what was learned (Cek Harian) |
| NSRC 997 | National Scam Response Centre hotline (real) |
| Semak Mule | PDRM's public portal for checking suspicious accounts and numbers (real) |

### 1.4 References

- Competition rules and rubric (organiser site)
- research/problem-statement.md and research/gamification-benchmark.md
- docs/SDS.md, docs/UI-SPEC.md, docs/claude-code-prompt.md, docs/DECISIONS.md

## 2. Overall description

Celik fills a gap no existing product covers: the student money moment, real and fake investments shown side by side, scams shown as the cost of low financial literacy, a daily booster, and a channel that repeats every intake (orientation week).

### 2.1 Problem

Problem statement (515 characters):

> Malaysians aged 19-30 score below the national average in BNM's financial literacy index, and only 18.6% of EPF members aged 18-30 have the basic savings for their age. Young Malaysians invest just 8% of their income. Not knowing what a realistic return looks like, they cannot tell real investments from fake schemes, now Malaysia's costliest scam (RM1.46 billion lost in 2025). First-year IPT students, managing money alone for the first time, need a safe place to practise budgeting, investing and spotting fraud.

- Ages 19–30 score below the national average on BNM's financial literacy index ([The Edge](https://theedgemalaysia.com/node/759356)).
- Only 18.6% of EPF members aged 18–30 met the Basic Savings level for their age at 31 Aug 2025 ([The Vibes / MOF](https://www.thevibes.com/articles/news/113744/majority-of-epf-members-fall-short-of-basic-retirement-savings-mof-acknowledges)). Many first-years are not EPF contributors yet, so this shows where the age group is heading.
- Youths set aside only 8% of income for investment (SC Youth Capital Market Survey 2022, ages 18–40) ([The Edge](https://theedgemalaysia.com/article/malaysian-youths-generally-unable-manage-finance-well-scs-survey-finds)).
- Fake investment schemes caused the highest scam losses for three years: RM848.62 million (2024) to RM1.46 billion (2025) ([The Sun / Home Ministry](https://thesun.my/?p=631846)). Victims are mostly 31–50, so the pitch says "today's students are tomorrow's targets".
- Syndicates offer students RM1,000–2,000 per mule account ([The Star](https://www.thestar.com.my/news/nation/2026/06/17/students-turn-mule-for-cash)); ages 21–30 are the largest telecom-scam victim group ([SAYS / PDRM](https://says.com/my/news/pdrm-most-telco-scam-victims-in-malaysia-this-year-are-aged-21-to-30)).
- Mule-account offences are reported as Penal Code 424A–424D; to be verified against the official Penal Code and marked `TODO-VERIFY` in the app until then.

### 2.2 Benchmark and what Celik borrows

| Product | Key mechanic | What makes it unique | What Celik borrows |
| --- | --- | --- | --- |
| [Mind Your Ringgit](https://www.visa.com.my/about-visa/newsroom/press-releases/visa-launches-mind-your-ringgit-web-game-to-help-young-malaysians-achieve-financial-empowerment.html) (Visa MY) | One-year simulation, a money decision each month | Money and scams in one game | Life-sim money decisions; Celik adds student life, real vs fake investing and mule accounts |
| [Belanjawanku](https://fintechnews.my/36711/personal-finance-mgt-pfm/epf-launches-belanjawanku-app-and-guide-to-help-malaysians-be-financially-savvy/) (KWSP) | Budget tracker and expense guide | Official guide amounts | Budget categories; Celik makes budgeting a game instead of a chore |
| [Versa](https://www.malaymail.com/news/money/2025/08/26/malaysias-versa-cracks-forbes-asias-100-to-watch-list-of-hottest-startups/188947) (MY) | Real investing app with quests | 300,000+ users | Investing made simple; Celik teaches judgement before real money |
| [Zogo](https://www.cuinsight.com/press-release/2021-zogo-year-in-review/) (US) | Bite-sized lessons, rewards from partners | ~1M users, partner-funded | Short daily lessons; partner rewards (roadmap) |
| [Spent](https://www.nextavenue.org/what-online-poverty-game-can-teach-you/) | Survive a month on a fixed budget | Every choice shows its consequence | Visible consequences of money choices |
| [#XiamTheScams](https://ncpc.org.sg/xiamthescams) (Singapore NCPC) | Life sim with scam and legit situations | 519,000+ players, real protective actions | Mixed legit/scam events; reward real-world actions |
| [Bad News](https://www.cam.ac.uk/research/news/fake-news-vaccine-works-pre-bunk-game-reduces-susceptibility-to-disinformation) (Cambridge) | Play the manipulator | Inoculation works but fades without boosters | Mod Sindiket (stretch); Cek Harian as the booster |
| Duolingo / Kahoot (well known) | Streaks, XP, live quiz battles | Daily habit loop; live group play | Cek Harian streak; Mod Kelas battles |

### 2.3 How Celik is different

1. **Built for the student money moment:** PTPTN or scholarship money, hostel costs, first part-time pay and first investing choice, not generic adult scenarios.
2. **Real vs fake, side by side:** the same "investment" decision appears twice (a licensed fictional unit trust in week 5, a fake crypto scheme in week 8); the Kalkulator shows why one return is realistic and the other is impossible.
3. **Scams as the cost of low financial literacy:** a weak budget and no emergency fund make scam offers more tempting, so money skills and scam awareness reinforce each other.
4. **Built to come back to:** Cek Harian (2-minute daily booster with a streak) and Mesin Masa (your own savings goal) give reasons to return after the first play.
5. **Orientation-week ready:** Mod Kelas runs a whole hall from one screen every intake, fitting MOHE's university awareness programmes.

### 2.4 Users

| User | Who | Main needs |
| --- | --- | --- |
| Player | IPT undergraduates, about 18–24, entered through first year; many B40 | Fun, quick sessions; realistic money and scam situations; know what to do in real life |
| Facilitator | Orientation organisers, lecturers, student leaders | Run a group session from one screen in under a minute |
| Content reviewer (roadmap) | University HEP/security staff, partner agencies | Approve new scenarios and alert packs |

### 2.5 Environment, constraints, assumptions

- Mid-range and low-end Android phones in Chrome; installable web app; works offline after first load.
- Scenarios and cards use fictional brands only. Real scheme and agency names appear only in Kad Ilmu and "where to check" lines (D27).
- The game teaches principles and how to check; it never recommends a product (the team is not licensed to give investment advice).
- The game never asks for real personal or bank data.
- 3.5-day build by a team of 4.

## 3. Functional requirements

Priority: **M** = must have for the video, **S** = should have, **C** = could have.

### 3.1 Semester Pertama (story mode, the core)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-01 | The player picks a character (Aina or Amir), a fictional university (Universiti Cempaka Raya) and starts with RM2,000 (fictional PTPTN or scholarship money) | M |
| FR-02 | The game runs as a fake phone: home screen, Sembang (chat), BankKu (bank), Dompet (budget and Labur), Kalkulator, Kad (Red Flag and Kad Ilmu cards) | M |
| FR-03 | A semester is 12 in-game weeks (about 15 minutes). Each week opens with a week intro (costs and income) and delivers 1–3 events: a story scenario on 10 of the 12 weeks, plus short events (a bill, a Dompet offer, a notification) | M |
| FR-04 | Story scenarios are 4 scams and 6 finance or legitimate decisions (scam share 40%), so players learn to judge and to manage money, not to reject everything | M |
| FR-05 | MVP scam families: part-time job / task scam, mule account rental, fake investment, Macau-style authority call. MVP finance scenarios: budget split, first pay, licensed unit trust, real bank alert, costly BNPL/loan, selling a used book | M |
| FR-06 | The player replies by choosing from 2–4 reply chips; each choice branches the story | M |
| FR-07 | Every outcome shows "Apa jadi seterusnya" (what happens next): money lost or grown, debt taken, account frozen or police investigation, with a short plain-language reason | M |
| FR-08 | The mule-account consequence animates the money chain: victim → your account → syndicate, and police tracing back to you | M |
| FR-09 | After each scam scenario, the player taps the red flags hidden in the messages to collect Red Flag cards; finance scenarios award the Kad Ilmu for their concepts | M |
| FR-10 | At semester end, a report card shows money left, Labur value, emergency fund, scams avoided, flags collected, Celik Kewangan per concept, Imuniti per tactic and a grade | M |
| FR-11 | Scenario choices can open the Kalkulator with numbers filled in ("Kira dulu"); using it inside a scenario is rewarded | M |

### 3.2 Dompet and Kalkulator (financial literacy core)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-20 | At week 0 the player splits money into Keperluan (needs), Kehendak (wants) and Simpanan (savings / emergency fund) | M |
| FR-21 | Real-life costs arrive weekly (food, transport, phone bill, a surprise expense); part-time pay arrives in weeks 4, 8 and 12 | M |
| FR-22 | A fourth pot, Labur, takes money only at week intros, in a fictional fixed-price fund (low risk) or a fictional equity unit trust (goes up and down) | M |
| FR-23 | Investing while the emergency fund is below RM300 raises Tekanan and shows a "dana kecemasan dulu" tip | M |
| FR-24 | No emergency fund makes desperate offers (job scams, mule rental, costly loans) more tempting, shown as an urgency cue | S |
| FR-25 | Kalkulator → Mesin Masa: monthly amount, yearly rate and years → future value and total contributed, with a line chart to age 30 and 55 | M |
| FR-26 | Kalkulator → Semak Pulangan: a promised return and its period (day, week, month, year) → the yearly rate, compared with example ranges for savings, fixed deposits and unit trusts; impossible returns show the Terlalu Lumayan red flag | M |
| FR-27 | Kalkulator → Kos Sebenar: loan or BNPL amount, flat rate or fee, and months → instalment, total repaid, total cost and effective yearly rate | M |
| FR-28 | All example rates are labelled "contoh" (example), show their year and are checked against official sources before release | M |
| FR-29 | Dompet shows net worth (Duit + Labur) and the emergency fund progress bar | S |

### 3.3 Cek Harian and Sahih atau Scam (boosters)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-40 | Cek Harian: a daily 2-minute round of 5 cards (3 scam/legit swipe cards and 2 money cards), different each day and available offline | M |
| FR-41 | Every card shows a one-line explanation after the answer; any timer pauses while it shows | M |
| FR-42 | Cek Harian builds a streak with one free "freeze" a week; best score and streak are saved on the device | M |
| FR-43 | Sahih atau Scam? quick round: swipe left (scam) or right (legit) on 10 message cards in 60 seconds | S |

### 3.4 Latihan Tindakan (action drills)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-50 | A simulated 997 call drill: what to say, what details to prepare, why the first minutes matter | M |
| FR-51 | A simulated account check that teaches how Semak Mule works, clearly labelled as a simulation, with a button to the real portal | M |
| FR-52 | A real-action checklist (save 997, bookmark Semak Mule, turn on bank transaction alerts, set a savings goal, check an investment's licence before paying, tell family); each ticked action earns stars | S |

### 3.5 Mod Kelas (orientation and classes)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-60 | A facilitator runs a card battle (scam/legit and money cards) on a projector for 2–6 teams with one-tap answer entry | M |
| FR-61 | A scoreboard and winner screen; large type readable in a lecture hall | M |
| FR-62 | Online live mode where students join by QR code on their phones | C |

### 3.6 Mod Sindiket (finalist stretch)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-30 | The player is a "new intern" in a fictional syndicate and builds scam messages from cards: Hook, Tactic, Ask | S |
| FR-31 | Fictional target personas react; adding manipulation tactics raises a "success meter" | S |
| FR-32 | Each tactic used earns a badge (7 tactics); first release needs at least 3 | S |
| FR-33 | Every round ends with a debrief: how a victim could have spotted it | S |
| FR-34 | The mode ends with a twist: the syndicate collapses and the interns' mule accounts are traced | C |

### 3.7 Progress and gamification

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-70 | XP levels: Pemula → Berjimat → Bijak → Pelabur → Celik | M |
| FR-71 | Kad book: Red Flag cards (one per tactic and scam family flagged in the content, total computed from content) and 6 Kad Ilmu | M |
| FR-72 | Adaptive engine: the next scenario favours the weakest tactic or concept | C |
| FR-73 | Shareable result card (image) for social media | C |
| FR-74 | Progress saved on the device; no login | M |

## 4. Non-functional requirements

A money and scam game must never become a scam manual, impersonate a real organisation or give personal investment advice.

| ID | Category | Requirement | How it is checked |
| --- | --- | --- | --- |
| NFR-01 | Ethics | Scenarios and cards use only fictional banks, apps, companies, products and people; no real logos, phone numbers or URLs except NSRC 997 and the official Semak Mule portal as correct actions. In-game links use the `.test` domain; in-game numbers use `01X-0000 0NNN` | `npm run check:content` + content review |
| NFR-02 | Ethics | Mod Sindiket messages are templated, fictional and always followed by a debrief; no free-text scam generator | Code and content review |
| NFR-03 | Safety | The game never asks for real names, IC numbers, bank details, OTPs or passwords; fake inputs are pre-filled and labelled "simulasi" | Code review |
| NFR-04 | Wellbeing | Losing is educational, not shaming: consequence screens explain and offer a retry; no victim-blaming copy | Copy review |
| NFR-05 | Offline | All MVP features work offline after the first load, including Cek Harian | Airplane-mode test |
| NFR-06 | Size | First download at most 8 MB | Build output |
| NFR-07 | Performance | First screen interactive within 3 s; 60 fps on a mid-range phone, 30 fps on low-end | Throttled device test |
| NFR-08 | Session length | Each mode is playable in 2–15 minutes (Cek Harian about 2) | Timed playtest |
| NFR-09 | Language | Bahasa Melayu by default, English toggle; casual Malaysian chat style in scenarios | Content review |
| NFR-10 | Accessibility | Text at least 16 px, touch targets at least 48 px, colour never the only signal, reduced-motion option | Manual review |
| NFR-11 | Privacy | No login, no analytics; progress stays on the device | Code review |
| NFR-12 | Accuracy | Legal and procedural facts (997, Semak Mule, Penal Code 424A–424D) and every example rate checked against official sources before release; until then `TODO-VERIFY` | Source check |
| NFR-13 | Maintainability | New scenarios, cards and concepts are added as content files without app code changes | Add a test scenario |
| NFR-14 | Competition | A visible DEMO watermark on screens shown in the video | Visual check |
| NFR-15 | Advice | The game explains what savings and investment products are and how to check them; it never recommends a product. Real scheme names appear only in Kad Ilmu and "where to check" lines (D27) | Content review + checker allowlist |
| NFR-16 | Maths | Kalkulator results match the formulas in SDS 5.7 to the nearest sen | Unit tests |

## 5. Scope and acceptance

The MVP is done when a player can finish a semester that includes the budget split, first pay, the real-vs-fake investment pair, the mule-account scenario and the Kalkulator, can play a Cek Harian round, and a facilitator can run Mod Kelas, all offline.

### 5.1 Release phases

1. **MVP (by 9 Nov):** Semester Pertama with 4 scam + 6 finance/legit scenarios, Dompet with Labur, Kalkulator (3 tabs), Red Flag and Kad Ilmu cards, report card; Cek Harian with 30 swipe + 20 money cards; 997 and Semak Mule drills; Mod Kelas.
2. **Finalist polish (by 18 Nov):** Mod Sindiket, adaptive order, share card, English, a pre/post test with 20–30 UTP students.
3. **Roadmap:** later semesters as seasons, monthly new-alert packs (drafted with AI, reviewed by people), online live mode, campus leaderboards, partner rewards (banks, AKPK), anonymous university dashboard.

### 5.2 Acceptance checklist for the video

- Week-0 budget split, and the emergency fund changes how tempting later offers look
- Mesin Masa shows what RM50 a month becomes by age 30 and 55
- kawan_labur (real unit trust) then crypto_naga with "Kira dulu" opening Semak Pulangan
- Mule-account scenario end to end with the money-chain animation
- Kos Sebenar on the BayarNanti offer
- Cek Harian round with streak and explanations
- 997 drill and Semak Mule simulation with the real-portal button
- Mod Kelas with 2 teams on a projector
- Semester report card with Celik Kewangan and Imuniti
- Everything works in airplane mode

### 5.3 Validation plan

Run a 12-question test (6 money questions, 6 scam-spotting questions) with UTP students before and after one play session. Report the change in the video and the finalist pitch.

### 5.4 Open questions

- Can a UTP HEP or security officer review the scenarios for realism?
- Which example rate ranges will the team verify for Semak Pulangan (savings, fixed deposit, unit trust), and from which official sources?
- ~~Should the fictional university be generic or a lightly disguised UTP?~~ Resolved: generic, Universiti Cempaka Raya (UCR).
