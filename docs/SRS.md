> Snapshot of the live doc on 6 Nov 2026: https://claude.ai/artifact/3woKSQeWmxHZVgipLPpBmj . If they differ, the live doc wins.
> Related: docs/SDS.md (design), docs/UI-SPEC.md (screens and components).

# Celik — Software Requirements Specification (SRS)

## 1. Introduction

Celik (tagline "Bijak duit, kebal scam" — money-smart, scam-proof; "celik" is the Malay word for literate, as in celik kewangan, financial literacy) is a mobile-first game that lets first-year university students live through their first semester's money decisions and scam attempts safely, so they learn to spot scams, refuse mule-account offers and manage their money before real scammers reach them.

### 1.1 Purpose

This SRS defines what the Celik MVP must do for the Festival Idea Putrajaya 2026 Innovation Challenge (IPT category, theme Edutainment & Innovation; entry closes 9 Nov 2026, 11.59 pm). It is the reference for the build, testing and the 5-minute video.

### 1.2 Scope

- **In scope (MVP):** Semester Pertama story mode, Sahih atau Scam swipe game, Mod Sindiket (play the scammer), Latihan Tindakan action drills, Mod Kelas for orientation and classes, Red Flag card collection, Imuniti score, semester money report, Bahasa Melayu with English.
- **Out of scope (roadmap):** online multiplayer, university leaderboards, partner rewards, AI-assisted scenario updates from the latest scam alerts, university dashboard.

### 1.3 Definitions

| Term | Meaning |
| --- | --- |
| Scenario | A short branching story (a chat, call or ad) that is either a scam or legitimate |
| Tactic | A manipulation technique used in scams (urgency, authority, greed, fear, secrecy, social proof, pay-first) |
| Red Flag card | A collectible card earned by spotting a tactic in a message |
| Imuniti | The player's resistance score, overall and per tactic (0–100) |
| Mule account | A bank account used by syndicates to receive and move stolen money |
| Inoculation (prebunking) | Building resistance by exposing people to a weakened version of manipulation in a safe setting |
| NSRC 997 | National Scam Response Centre hotline (real) |
| Semak Mule | PDRM's public portal for checking suspicious accounts and numbers (real) |

### 1.4 References

- Competition rules and rubric (organiser site)
- Research notes: research/problem-statement.md and research/gamification-benchmark.md in the project folder
- Celik Software Design Specification (SDS) and UI specification (docs/UI-SPEC.md)

## 2. Overall description

Celik targets the gap no existing game covers: university students being recruited as mule accounts and targeted by job scams, taught through campus-life simulation plus playing the scammer.

### 2.1 Problem

- Online scam losses rose from RM1.57 billion in 2024 to RM2.97 billion in 2025 ([Malay Mail](https://www.malaymail.com/amp/news/malaysia/2026/06/24/online-scam-losses-surge-to-rm297b-in-2025-says-home-ministry-as-fraud-trend-worsens-across-malaysia/225000)).
- Ages 21–30 were the largest group of telecom-scam victims in Jan–Nov 2025 ([SAYS / PDRM](https://says.com/my/news/pdrm-most-telco-scam-victims-in-malaysia-this-year-are-aged-21-to-30)).
- Syndicates offer students RM1,000–2,000 per mule account ([The Star](https://www.thestar.com.my/news/nation/2026/06/17/students-turn-mule-for-cash)); mule-account offences now have their own Penal Code sections, 424A–424D ([The Vibes](https://newswav.com/article/rm6-7-million-recovered-for-scam-victims-as-mule-account-crackdown-intensif-A2601_SiQ1gk)).
- Malaysians aged 19–30 score below the national average on BNM's financial literacy index ([The Edge](https://theedgemalaysia.com/node/759356)).

### 2.2 Benchmark and what Celik borrows

| Product | Key mechanic | What makes it unique | What Celik borrows |
| --- | --- | --- | --- |
| [Bad News](https://www.cam.ac.uk/research/news/fake-news-vaccine-works-pre-bunk-game-reduces-susceptibility-to-disinformation) (Cambridge) | Player becomes the manipulator; 6 tactic badges | Inoculation: 15 minutes of play measurably raised resistance in a 15,000-player study | Mod Sindiket: play the scammer, earn tactic badges |
| [#XiamTheScams](https://ncpc.org.sg/xiamthescams) (Singapore NCPC) | Life simulator with scam and legit situations | 519,000+ players and 77,000+ real protective actions taken | Mixed legit/scam events; reward real-world actions |
| [Interland](https://www.creativereview.co.uk/work/google-game-internet-safety-interland/) (Google) | Themed islands; quiz to cross Reality River | Short arcade levels per topic, mascot-led | Short levels, friendly guide character |
| [Spent](https://www.nextavenue.org/what-online-poverty-game-can-teach-you/) | Survive a month on a fixed budget | Every choice shows its consequence; 2M+ plays | Semester budget with visible consequences |
| [Zogo](https://www.tucsonfcu.com/?p=3623) | Bite-sized finance lessons, points for rewards | Partners pay real rewards for learning | Partner reward idea (roadmap) |
| [Online Safety IRL](https://focusmalaysia.my/?p=254956) (MY, with KKD) | Scam-spotting simulation | 900,000+ users in Malaysia | Proof that Malaysians engage with simulations |
| [Mind Your Ringgit](https://www.visa.com.my/about-visa/newsroom/press-releases/visa-launches-mind-your-ringgit-web-game-to-help-young-malaysians-achieve-financial-empowerment.html) (Visa MY) | One-year simulation, a money decision each month | Covers payments, scams, loans and savings in one game | Money and scams in one game; Celik adds student life, mule accounts and the scammer role |
| Duolingo / Kahoot (well known) | Streaks, XP, live quiz battles | Daily habit loop; live group play | Daily Sahih atau Scam streak; Mod Kelas battles |

### 2.3 How Celik is different

1. **Built for IPT students:** PTPTN money, hostel life, part-time job hunting and mule-account recruitment, not general public scenarios.
2. **Play both sides:** life-sim defence (like #XiamTheScams) plus scammer role-play inoculation (like Bad News). No Malaysian scam game found combines both.
3. **Money and scams in one loop:** a weak budget makes scams hurt more, so financial literacy and scam awareness reinforce each other.
4. **Orientation-week ready:** Mod Kelas runs a whole hall from one screen, fitting university Minggu Taaruf and MOHE's own mule-account awareness programmes.
5. **Real action, not just knowledge:** drills end with real steps (save 997, check Semak Mule).

### 2.4 Users

| User | Who | Main needs |
| --- | --- | --- |
| Player | First-year IPT students, 18–21, many B40 | Fun, quick sessions; realistic scenarios; know what to do |
| Facilitator | Orientation organisers, lecturers, student leaders | Run a group session from one screen in under a minute |
| Content reviewer (roadmap) | University security/HEP staff, partner agencies | Approve new scenarios |

### 2.5 Environment, constraints, assumptions

- Mid-range and low-end Android phones in Chrome; installable web app; works offline after first load.
- Fictional brands only: no real bank logos or agency branding; the only real names used are the correct actions (NSRC 997, Semak Mule).
- Scammer scripts are fictional and satirical, followed by a debrief; the game never asks for real personal or bank data.
- 3.5-day build by a team of 4.

## 3. Functional requirements

Priority: **M** = must have for the video, **S** = should have, **C** = could have.

### 3.1 Semester Pertama (story mode, the core)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-01 | The player picks a character (Aina or Amir), a fictional university and a starting budget (PTPTN or scholarship money plus part-time income) | M |
| FR-02 | The game runs as a fake phone: home screen, Chat app, BankKu (bank), Dompet (budget), Kad (red flags) | M |
| FR-03 | A semester is 12 in-game weeks (about 15 minutes); each week delivers 2–4 events: chats, calls, ads, friend requests | M |
| FR-04 | Events mix scams and legitimate offers (about 60:40) so players learn to judge, not to reject everything | M |
| FR-05 | MVP scam families: part-time job / task scam, mule account rental, fake investment, parcel phishing link, Macau-style authority call, illegal loan / BNPL trap | M |
| FR-06 | The player replies by choosing from 2–4 reply chips; each choice branches the story | M |
| FR-07 | Every scam outcome shows "Apa jadi seterusnya" (what happens next): money lost, account frozen, police investigation, with a short plain-language reason | M |
| FR-08 | The mule-account consequence animates the money chain: victim → your account → syndicate, and police tracing back to you | M |
| FR-09 | After each scenario, the player taps the red flags hidden in the messages to collect Red Flag cards | M |
| FR-10 | At semester end, a report card shows money left, scams avoided, flags collected, Imuniti per tactic and a grade | M |

### 3.2 Financial literacy layer (Dompet)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-20 | At week 0 the player splits money into Needs, Wants and Savings (emergency fund) | M |
| FR-21 | Real-life costs arrive weekly (food, transport, phone bill, a surprise expense) | M |
| FR-22 | BNPL and fast-loan offers appear as temptations with their true cost shown afterwards | S |
| FR-23 | No emergency fund makes desperate offers (job scams, mule rental) more tempting, shown as an urgency cue | S |

### 3.3 Mod Sindiket (play the scammer, inoculation)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-30 | The player is a "new intern" in a fictional syndicate and builds scam messages from cards: Hook, Tactic, Ask | M |
| FR-31 | Fictional target personas react; adding manipulation tactics raises a "success meter" | M |
| FR-32 | Each tactic used earns a badge (7 tactics); MVP needs at least 3 | M |
| FR-33 | Every round ends with a debrief: how a victim could have spotted it | M |
| FR-34 | The mode ends with a twist: the syndicate collapses, the interns' mule accounts are traced, and the real cost is shown | S |

### 3.4 Sahih atau Scam? (quick game)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-40 | Swipe left (scam) or right (legit) on 10 message cards in 60 seconds | M |
| FR-41 | Each card shows a one-line explanation after the swipe | M |
| FR-42 | A daily set builds a streak; the best score is saved on the device | S |

### 3.5 Latihan Tindakan (action drills)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-50 | A simulated 997 call drill: what to say, what details to prepare, why the first minutes matter | M |
| FR-51 | A simulated account check that teaches how Semak Mule works, clearly labelled as a simulation, with a button to the real portal | M |
| FR-52 | A real-action checklist (save 997 in contacts, bookmark Semak Mule, turn on bank transaction alerts, tell family); each ticked action earns stars | S |

### 3.6 Mod Kelas (orientation and classes)

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-60 | A facilitator runs Sahih atau Scam on a projector for 2–6 teams with one-tap answer entry | M |
| FR-61 | A scoreboard and winner screen; large type readable in a lecture hall | M |
| FR-62 | Online live mode where students join by QR code on their phones | C |

### 3.7 Progress and gamification

| ID | Requirement | Priority |
| --- | --- | --- |
| FR-70 | XP and Imuniti levels: Mangsa → Waspada → Bijak → Penjaga → Wira Anti-Scam | M |
| FR-71 | Red Flag card collection book (7 tactics × scam families) | M |
| FR-72 | Adaptive engine: the next scenario favours the tactic the player is weakest against | S |
| FR-73 | Shareable Imuniti result card (image) for social media | S |
| FR-74 | Progress saved on the device; no login | M |

## 4. Non-functional requirements

Safety and ethics rules matter as much as speed here: a scam game must never become a scam manual or impersonate a real organisation.

| ID | Category | Requirement | How it is checked |
| --- | --- | --- | --- |
| NFR-01 | Ethics | Only fictional banks, apps, companies and people; no real logos, phone numbers or URLs except NSRC 997 and the official Semak Mule portal as correct actions | Content review checklist |
| NFR-02 | Ethics | Scammer messages in Mod Sindiket are templated, fictional and always followed by a debrief; no free-text scam generator | Code and content review |
| NFR-03 | Safety | The game never asks for real names, IC numbers, bank details, OTPs or passwords; fake inputs are pre-filled and labelled "simulasi" | Code review |
| NFR-04 | Wellbeing | Losing is educational, not shaming: consequence screens explain and offer a retry; no victim-blaming copy | Copy review |
| NFR-05 | Offline | All MVP features work offline after the first load | Airplane-mode test |
| NFR-06 | Size | First download at most 8 MB | Build output |
| NFR-07 | Performance | First screen interactive within 3 s; 60 fps animations on a mid-range phone, 30 fps on low-end | Throttled device test |
| NFR-08 | Session length | Each mode is playable in 5–15 minutes | Timed playtest |
| NFR-09 | Language | Bahasa Melayu by default, English toggle; casual Malaysian chat style in scenarios | Content review |
| NFR-10 | Accessibility | Text at least 16 px, touch targets at least 48 px, colour never the only signal, reduced-motion option | Manual review |
| NFR-11 | Privacy | No login, no analytics; progress stays on the device | Code review |
| NFR-12 | Accuracy | Legal and procedural facts (997, Semak Mule, Penal Code 424A–424D) checked against official sources before release | Source check |
| NFR-13 | Maintainability | New scenarios are added as content files without app code changes | Add a test scenario |
| NFR-14 | Competition | A visible DEMO watermark on screens shown in the video | Visual check |

## 5. Scope and acceptance

The MVP is done when a player can finish a short semester with the mule-account and job-scam scenarios, play one Mod Sindiket round, and a facilitator can run Mod Kelas, all offline.

### 5.1 Release phases

1. **MVP (by 9 Nov):** Semester Pertama with 6 scam + 2 legit scenarios, Dompet budget, Red Flag cards, report card; Sahih atau Scam with 30 cards; Mod Sindiket with 3 tactics; 997 and Semak Mule drills; Mod Kelas.
2. **Finalist polish (by 18 Nov):** all 7 Sindiket tactics and the twist ending, adaptive engine, share card, English, a pre/post test with 20–30 UTP first-years.
3. **Roadmap:** online live mode for orientation halls, campus leaderboards, monthly scenario updates from new scam alerts (AI drafts, human review), partner rewards (banks, AKPK), anonymous university dashboard.

### 5.2 Acceptance checklist for the video

- Mule-account scenario plays end to end with the money-chain animation
- Job-scam scenario plays end to end with red-flag tapping
- Budget split at week 0 changes how tempting later offers look
- One Mod Sindiket round with debrief
- Sahih atau Scam round with streak and explanations
- 997 drill and Semak Mule simulation with the real-portal button
- Mod Kelas with 2 teams on a projector
- Semester report card and Imuniti per tactic
- Everything works in airplane mode

### 5.3 Validation plan

Run a 10-question scam-spotting test with UTP first-years before and after one play session. Report the change in the video and the finalist pitch.

### 5.4 Open questions

- Can a UTP security or HEP officer review the scenarios for realism?
- Should the fictional university be generic or a lightly disguised UTP?

