# Celik: build prompt for Claude Code

> **Update 6 Nov 2026 evening:** the product moved to a hybrid direction (financial literacy core, scams inside
> it). docs/DECISIONS.md D18-D28 override sections 3-6 of this prompt: new scenario list and order (D20), Kalkulator
> (D21), Labur (D22), finance concepts and Kad Ilmu (D23), scoring and levels (D24), Cek Harian (D25), Mod Sindiket
> moved to stretch and the new milestone order (D26), real-name rule (D27). See docs/pivot-delta-prompt.md.


Open Claude Code in `D:\FinancialLiteracy-ScamAwareness` and paste the short prompt from the chat, or everything
below the line.

---

Before starting, read CLAUDE.md, docs/SRS.md (requirements, FR/NFR IDs), docs/SDS.md (architecture, modules,
data formats, game systems, build plan) and docs/UI-SPEC.md (tokens, components, screens S01-S18, copy style).
Review them against this prompt and tell me about any conflicts or gaps before you plan.

You are building **Celik** ("Bijak duit, kebal scam"), an offline-first 2D web app (PWA) that simulates a phone.
First-year Malaysian university students live through their first semester's money decisions and scam
attempts, play the scammer to learn the tricks, and finish with real protective actions (NSRC 997, Semak Mule).
It is an entry for the Festival Idea Putrajaya 2026 Innovation Challenge (IPT category, theme: Edutainment &
Innovation). The video is due **9 Nov 2026**, so build the smallest polished version first and keep it working
at every step.

## 0. How to work

Use these plugins and skills (install any that are missing with `/plugin`):

1. **superpowers**: `brainstorming` to confirm this spec, `writing-plans` for the task plan, then
   `subagent-driven-development` (or `executing-plans`). Use `test-driven-development` for every engine rule
   (meters, XP, grade, adaptive pick, persona model, tag parser), `systematic-debugging` for bugs and
   `verification-before-completion` before claiming a milestone is done.
2. **frontend-design**: for the look in docs/UI-SPEC.md. It must feel like a real, warm, Malaysian phone, not a
   generic dashboard template.
3. **Context7 MCP**: fetch current docs for inkjs, framer-motion, vite-plugin-pwa, Dexie, zod and Tailwind
   before using their APIs.
4. **Playwright MCP**: drive the app at 360x800, 412x915 and 1920x1080, test offline
   (`context.setOffline(true)`) and screenshot every screen for review.
5. **Chrome DevTools MCP** (optional): performance traces with 4x CPU throttling.

Run `git init` if needed and commit after each milestone with a clear message.

## 1. Hard rules (also in CLAUDE.md)

- **Fictional brands only.** No real bank, telco, courier, company, app, agency or person names, logos,
  colours, phone numbers or URLs. The only real items are NSRC 997 and the Semak Mule portal
  (https://semakmule.rmp.gov.my), opened only from a clearly labelled button.
- **Never collect real data.** No inputs for real names, IC numbers, bank accounts, OTPs or passwords. Fake values
  are pre-filled; simulated bank and portal screens show the "SIMULASI" banner.
- **No scam generator.** Mod Sindiket uses fixed card templates only; every round ends with a debrief.
- **No shaming copy.** Consequences explain and offer a retry.
- **Offline after first load.** No run-time network calls: no CDN fonts, analytics or AI. Everything is bundled
  and precached. First download at most 8 MB.
- **BM first**, English second; all strings in i18n files.
- **Content is data.** Scenarios are `.ink` files; cards, tactics and personas are JSON validated with zod.
  Adding a scenario must not need app code changes.
- **Tunable numbers only in `app/src/engine/balance.ts`** (values in SDS section 5).
- **Legal lines are placeholders.** Any sentence about the Penal Code (424A-424D), NSRC procedures or bank
  rules uses a string marked `TODO-VERIFY` in the i18n file; the team checks it against official sources.
  Never invent legal text.

## 2. Tech stack (use exactly this unless blocked)

TypeScript, Vite, React, Tailwind CSS, framer-motion, ink + inkjs (compile .ink to JSON at build time with
inklecate or the inkjs compiler), zustand, zod, Dexie, vite-plugin-pwa, html-to-image, lucide-react,
@fontsource (Plus Jakarta Sans, Inter, JetBrains Mono), Vitest, Playwright. No 3D, no backend.
App lives in `app/`; content in `content/` (copied into the build). Folder layout: SDS section 6.1.

## 3. What to build (MVP for the video)

All screens, components and copy style are in docs/UI-SPEC.md; requirements in SRS section 3.

1. **Phone shell**: splash and disclaimer, onboarding (Aina or Amir, Universiti Cempaka Raya, RM2,000 +
   RM400/month), home screen with Imuniti ring, app grid (Sembang, BankKu, Dompet, Kad, Latihan) and mode dock.
2. **Semester Pertama**: 12 weeks, 2-4 events a week, about 15 minutes. Chats with typing indicators and reply
   chips, an incoming call screen, BankKu with transfer and TAC screens, consequence timelines, flag hunt,
   Sang Kancil debrief, week intros, semester report card.
3. **Dompet**: week-0 Needs/Wants/Savings split, weekly costs, low savings raises Tekanan, which makes
   desperate offers show an urgency cue.
4. **Mod Sindiket**: dark theme, 3 tactics for the MVP (greed, urgency, authority), 3 personas, success meter,
   badges, debrief after every round. Twist ending is a stretch goal.
5. **Sahih atau Scam?**: 10 cards in 60 seconds, swipe plus buttons, one-line reason after each, daily streak.
6. **Latihan Tindakan**: 997 drill, Semak simulation with the real-portal button, action checklist.
7. **Mod Kelas**: projector layout, 2-6 teams, one-tap answers, reveal, scoreboard, winner screen.
8. **Kad** collection book and the **share card** (stretch).

## 4. Content to author for the MVP

Write these in casual Malaysian BM chat style (mixed BM-English is fine), all names fictional. Use the tag
format in SDS section 4.2 (`# type`, `# family`, `# tactics`, `# flag:<tactic>:<exact phrase>`,
`# effect:...`, `# outcome:scammed|mule|frozen|safe`). Each scenario has 2-3 decision points and at least one
safe path.

| # | File | Type | Story | Tactics | Bad outcome |
| --- | --- | --- | --- | --- | --- |
| 1 | kerja_sambilan.ink | scam | "Kak Mira (HR)" from Bintang Digital offers RM300/day like-and-share tasks; task 2 needs a RM100 top-up | greed, urgency, payfirst | scammed |
| 2 | sewa_akaun.ink | scam | Senior "Abang Zul" offers RM1,500 to "borrow" your account for his e-wallet business; "semua orang buat" | greed, secrecy, social | mule (money-chain, Rekod Disiasat, account frozen) |
| 3 | crypto_naga.ink | scam | Telegram group "CryptoNaga" shows screenshots of 30% weekly profit, asks for a first deposit | greed, social, urgency | scammed |
| 4 | parcel_kurier.ink | scam | SMS from "KurierKilat": address incomplete, pay RM1.50 via link; fake page then asks for TAC | urgency, payfirst | scammed (balance drained) |
| 5 | panggilan_mahkamah.ink | scam | Call from "Pegawai Mahkamah", transferred to "Inspektor"; threat of arrest, told to move money to a "safe account" and stay silent | authority, fear, secrecy | scammed + frozen |
| 6 | pinjam_cepat.ink | scam | When Tekanan is high, "PinjamCepat" ad: RM500 in 5 minutes, no documents; true cost revealed after | urgency, greed | scammed (debt) |
| 7 | kerja_kafe.ink | legit | Campus cafe part-time job via the UCR career portal; asks for nothing upfront, interview on campus | none | rejecting it shows "Terlalu curiga?" |
| 8 | yuran_kelas.ink | legit | Class rep collects lab-coat money in the official class group with a receipt from the faculty office | none | rejecting it shows "Terlalu curiga?" |
| 9 | alert_bankku.ink | legit | BankKu alert about a RM89.90 card payment; asks you to call the number on the back of your card, no link, no OTP | none | rejecting it shows "Terlalu curiga?" |
| 10 | buku_terpakai.ink | legit | A junior wants to buy your used textbook; meets at the library and pays cash | none | rejecting it shows "Terlalu curiga?" |

Week order, families and the 60:40 mix are in SDS section 5.3 (`content/semester.json`). Links in scenarios use
`*.test` with no `http://` (ink reads `//` as a comment); phone numbers use `01X-0000 0NNN`.

Also write:
- `content/cards.json`: 30 Sahih atau Scam cards (18 scam, 12 legit) across SMS, chat and email, each with a
  one-line BM reason. Legit cards never ask for OTP, never push payment links, and give a way to verify.
- `content/tactics.json`: the 7 tactics from SDS section 4.1 (code, BM name, what it does, example cue, tip).
- `content/sindiket.json`: hooks, the 3 MVP tactic cards, asks, and 3 personas with susceptibility values, for
  example "Hafiz, 22, pelajar tahun akhir, perlukan duit" (high greed), "Mak Cik Senah, 60, percaya pihak
  berkuasa" (high authority), "Daniel, 27, sibuk bekerja" (high urgency).
- `content/drills.json`: 997 drill steps and the action checklist.
- `content/semester.json`: the week order and week-intro costs.

Mark any line you are unsure is realistic with an ink comment `// REVIEW` so the content lead can check it.

## 5. Milestones (each must pass its checks before moving on)

The 4-person split and day plan are in SDS section 6.2; keep each person's files separate (shell/, engine/,
modes/, content/) so the team can work in parallel.

1. **Scaffold**: Vite + React + TS + Tailwind + PWA; tokens from UI-SPEC section 1; `npm run build` works; loads
   offline in Playwright.
2. **Shell + first scenario**: phone shell, home, Sembang chat thread, story engine and tag parser, scenario 1
   end to end with consequence timeline, flag hunt and Kancil debrief.
3. **Money + mule (video hero)**: meters store, Dompet, BankKu, scenario 2 with the money-chain animation and
   frozen account. Polish this first; it is the most important 30 seconds of the video.
4. **Sahih atau Scam + Mod Kelas**: 30 cards, streak, projector mode with 2 teams.
5. **Mod Sindiket**: 3 tactics, 3 personas, success meter, badges, debrief.
6. **Full semester**: scheduler with the 60:40 mix, scenarios 3-10, week intros, report card, Latihan Tindakan,
   Kad book.
7. **Polish (stretch, by 18 Nov for finalists)**: adaptive engine, share card, Sindiket twist ending, English
   strings, sounds, performance and 8 MB budget check.

## 6. Tests and checks

- **Vitest**
  - XP levels: 199 = Mangsa, 200 = Waspada, 899 = Bijak, 900 = Penjaga, 1,400 = Wira Anti-Scam
  - Grade: judgement 80, Imuniti 60, money 50, flags 70 gives 67 (C); a score of 90 with Rekod Disiasat is
    capped at C
  - Adaptive weight: Imuniti 30 gives weight 80; never two scenarios of the same family in a row; scam share
    across a semester within 55-65%
  - Imuniti stays within 0-100 after any sequence of effects
  - Tag parser reads type, family, tactics, flags, effects and outcomes from scenario 1
  - Persona model: a matching hook plus a high-susceptibility tactic scores higher than a mismatch
  - zod rejects bad content (unknown tactic code, a legit card with tactics, a missing `ms` string)
- **Playwright**
  - Scenario 1 and scenario 2 end to end, including flag hunt and money chain
  - One Sindiket round, one swipe round, Mod Kelas with 2 teams
  - The whole app with the network offline
  - Screenshots of every screen at 360x800, 412x915 and 1920x1080
- **Content check script** (`npm run check:content`): fails if any content file contains a phone number other
  than 997 and the `01X-0000 0NNN` pattern, a URL other than `*.test` and semakmule.rmp.gov.my, or a word from a banned list of real brand names kept in
  `content/banned-names.txt` (start it with the major Malaysian banks, e-wallets, telcos and couriers).
- Every screen used in the video shows the DEMO watermark (toggle in settings, on by default).

Start by running the superpowers brainstorming skill on this spec, ask me any questions you have, then write the plan.
