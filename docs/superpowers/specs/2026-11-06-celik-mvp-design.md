# Celik MVP: design spec

Date: 6 Nov 2026. Status: approved in brainstorming, awaiting written review.
Inputs: CLAUDE.md, docs/claude-code-prompt.md, docs/SRS.md, docs/SDS.md, docs/UI-SPEC.md, docs/DECISIONS.md.
This spec records how the MVP will be built; the docs above stay the reference for requirements, numbers and look.

## 1. Intent

- **Outcome:** a polished, offline phone-simulator game good enough to film a 5-minute competition video by
  9 Nov 2026, then usable for a pre/post test with 20-30 UTP first-years.
- **Users:** first-year IPT students on mid/low-end Android phones (primary), a facilitator on a projector
  (Mod Kelas), and the judges watching the video.
- **Success:** the acceptance checklist in SRS 5.2 passes on video, in airplane mode, at 360x800, 412x915 and
  1920x1080, and the mule scenario (milestone 3) is the strongest 30 seconds.

## 2. Working decisions (from brainstorming)

| Topic | Decision |
| --- | --- |
| Who builds | Claude builds every milestone (subagent-driven). The team writes and reviews content, tests with students and makes the video. Folders stay separate so people can take over later |
| Artwork | Claude draws flat SVGs in `assets/` (Sang Kancil x 5 expressions, Aina and Amir, 5 app icons, 7 badges, 7 tactic icons, card frames), each under 20 KB, using UI-SPEC tokens. Replaceable by dropping in files with the same names |
| Hosting | Build must be deployable to GitHub Pages or Netlify (hash routes, relative base). Claude deploys only when the user says so, to a repo/account the user creates |
| Ink pipeline | Compile `.ink` at build time with the inkjs compiler inside a Vite plugin; the app ships only the inkjs runtime |
| Tools | `@playwright/test` (Chromium) as a dev dependency instead of the Playwright MCP; library docs from official sites and package types instead of Context7 (DECISIONS D12) |

## 3. Architecture

```text
content/                      repo root, owned by the content lead
  scenarios/*.ink             10 scenarios (6 scam, 4 legit)
  cards.json tactics.json sindiket.json drills.json semester.json banned-names.txt
app/
  vite-plugins/ink.ts         compiles content/scenarios/*.ink -> JSON modules, runs zod + flag-phrase checks
  scripts/check-content.ts    npm run check:content
  src/
    engine/                   pure TypeScript, no React, all test-first
      balance.ts              every tunable number (SDS 5)
      tags.ts                 parse ink tags into typed metadata, flags, effects, outcome, ui directives
      story.ts                inkjs wrapper -> step stream: Line | Choices | End
      meters.ts               applyEffect with clamping; snapshot/restore for retry
      xp.ts  grade.ts         levels; semester score and grade with the Rekod cap
      scheduler.ts            semester.json order; adaptive pick (stretch)
      persona.ts              Sindiket success score
      cards.ts                derive the card set (tactic x family pairs) from content
      schemas.ts              zod schemas for every JSON file and scenario metadata
    state/                    zustand stores: game (meters, week, progress), settings (lang, demo, sound, motion)
    storage/                  Dexie db; in-memory fallback if IndexedDB is unavailable; share card (stretch)
    shell/                    PhoneFrame, StatusBar, HomeScreen, AppTile, NotificationBanner, router, i18n (ms.json, en.json), DemoWatermark, ErrorScreen
    modes/semester/           WeekIntro, ChatList, ChatThread, IncomingCall, BankKu, Consequence, MoneyChain, FlagHunt, Debrief, ReportCard, Dompet
    modes/sindiket/  modes/swipe/  modes/drills/  modes/classmode/
    ui/                       ChatBubble, ReplyChip, TypingIndicator, MeterBar, ImunitiRing, CardTile, Badge, CoachSheet, ConsequenceTimeline, Toast, SimulasiBanner
  e2e/                        Playwright specs and screenshot runner
assets/                       SVG art, sounds (stretch), fonts come from @fontsource
```

Rules: `engine/` imports nothing from React, `state/`, `shell/` or `modes/`. Modes talk to the engine through
`state/` stores and `engine/` functions only. Every user-visible string is an i18n key.

## 4. Content format additions

On top of SDS 4.2 (`type`, `family`, `tactics`, `flag`, `effect`, `outcome`), three UI directive tags:

| Tag | Where | Effect |
| --- | --- | --- |
| `# ui:call` | knot header | play the scenario on the IncomingCall screen instead of a chat thread |
| `# ui:transfer:<amount>` | a line | open BankKu transfer with SIMULASI banner and a fake TAC prompt; the story waits for Sahkan / Batal |
| `# ui:link:<name>.test/<path>` | a line | render the link; tapping opens a fake in-game web page (a template keyed by name) |

Speaker is the text before the first `: ` in a line (`Kak Mira (HR): Salam!`). Lines without a speaker are
system messages. Scenarios carry no cost data; week costs live in `semester.json`.

Build-time content checks (fail the build and `check:content`):
1. Ink compiles; knot header has `type`, `family`, `tactics` with valid codes.
2. Every `# flag:<tactic>:<phrase>` phrase appears word for word in the same line.
3. Every path reaches an `# outcome`; scam scenarios have at least one `safe` path.
4. JSON files pass zod (unknown tactic code, legit card with tactics, missing `ms` string all fail).
5. No banned brand names, no URL except `*.test` and semakmule.rmp.gov.my, no phone number except 997 and `01X-0000 0NNN`.

## 5. Runtime flow (Semester Pertama)

1. Week intro: apply `semester.json` costs; if Simpanan < RM100, Tekanan +10; show the week card.
2. Scheduler returns the week's scenario (fixed order in the MVP).
3. Snapshot meters. Story engine streams lines; each incoming line waits on a typing indicator (600-1500 ms,
   shorter in reduced motion); choices render as ReplyChips; Tanya Kancil once per scenario (-10 XP).
4. Choice tags apply effects through `applyEffect` (clamped). `ui:*` tags open BankKu, the call screen or a fake page.
5. On `# outcome`: Consequence screen plays the template (scammed, mule with MoneyChain, frozen, safe); legit
   rejections show "Terlalu curiga?" and the missed income.
6. Flag hunt over the transcript; cards awarded per (tactic, family); Kancil debrief; record judgement, flags,
   XP and Imuniti; save to Dexie.
7. Cuba lagi restores the snapshot and replays the scenario.
8. Week 12: report card (SDS 5.4 grade with definitions from DECISIONS D6).

Desktop (1280+): phone frame 390x844 centred, Kancil tips panel left, live meters panel right.
Demo links: `#/demo/<scene>` loads a preset (e.g. `mule` = week 3, Simpanan RM60, Tekanan 70, sewa_akaun ready).

## 6. Error handling

- Content errors are caught at build time (section 4), never on stage.
- Each mode is wrapped in an error boundary showing a friendly "Kancil tersadung" screen with Mula semula.
- Dexie open failure: keep progress in memory and show a small toast once.
- Unknown route: back to Home.

## 7. Testing and milestone gates

- **Vitest (test-first):** every rule in prompt section 6 plus tag parser, story stepping, card derivation,
  meters snapshot/restore and scheduler order/mix.
- **Playwright:** scenarios 1 and 2 end to end (flag hunt, money chain), one Sindiket round, one swipe round,
  Mod Kelas with 2 teams, whole app offline (`setOffline(true)` after first load of the production preview),
  screenshots of every screen at 360x800, 412x915, 1920x1080 into `app/e2e/screens/`.
- **Gate for every milestone:** `npm test`, `npm run e2e`, `npm run check:content` and `npm run build` pass; build
  output under 8 MB; Claude reviews the screenshots; then a git commit `milestone N: ...`.

## 8. Milestones

As in prompt section 5, with milestone 3 polished as soon as milestone 2 works:
1. Scaffold (PWA, tokens, fonts, offline load test)
2. Shell + scenario 1 (chat, story engine, consequence, flag hunt, debrief)
3. Money + mule (meters, Dompet, BankKu, scenario 2, MoneyChain, frozen account, `#/demo/mule`)
4. Sahih atau Scam (30 cards, streak) + Mod Kelas (2-6 teams)
5. Mod Sindiket (3 tactics, 3 personas, meter, badges, debrief)
6. Full semester (scenarios 3-10, week intros, report card, Latihan Tindakan, Kad book)
7. Stretch: adaptive engine, share card, twist ending, English strings, sounds, performance pass

## 9. Out of scope

Backend, login, analytics, AI calls, online multiplayer, leaderboards, partner rewards, university dashboard.
