# Celik: implementation plan, SRS/SDS update and team split (10-18 Nov 2026)

Paste everything below the line into Claude Code, opened in `D:\FinancialLiteracy-ScamAwareness`.

---

## 1. Role and limits
You are the tech lead for Celik. In this session, write documents only: do not change app code.
Run on Opus 5.5 with reasoning effort no higher than medium. This limit applies to this session, to any subagents you
start, and to every team member's sessions (see section 6G).

## 2. Goal
Turn the agreed feature plan into documents four people can build from on 10 Nov without overlapping or waiting on
each other:
1. A new docs/IMPLEMENTATION-PLAN.md
2. An updated docs/SRS.md and docs/SDS.md (the SDS is the design doc, "SDD")
3. New entries in docs/DECISIONS.md (D35 onwards) recording every decision below, because DECISIONS.md wins over all
   other docs

## 3. Read first
CLAUDE.md, docs/DECISIONS.md, docs/SRS.md, docs/SDS.md, docs/UI-SPEC.md, docs/claude-code-prompt.md,
docs/superpowers/HANDOFF.md, research/gamification-benchmark.md, and the folder layout of app/src.
Feature plan input: **docs/feature-plan.md** (the agreed plan; follow it).

## 4. What is already decided (do not reopen)
Features for 18 Nov, all offline, no backend, no real data:
- Suapan: a feed of 20 curated posts from fictional accounts (advice, hype, scam); buttons Percaya / Semak / Lapor;
  Semak opens the Kalkulator
- Kedai Kampus: a shop priced in the semester's Duit; purchases count as Kehendak; prices in balance.ts
- Matlamat Semester: pick 1 of 4 goals at week 0; progress bar on Dompet; result on the report card
- Papan Markah: ranking against 9 fictional classmates plus the Mod Kelas scoreboard
- Kad Keputusan: shareable report-card image using the character's name (no text input)
- Tonton: 2 animated SVG explainers (compound growth, cost of debt) inside Kad Ilmu; no video files
- Raya event pack: one festive scenario, only if time allows
After the competition: cosmetic shop, Mod Sindiket, online leaderboards, user-posted feed.
Business model: free for students; universities licence an orientation package; a grant or sponsor funds the pilot.

## 5. Team and lanes (each person owns their files; nobody edits another person's files)
| Person | Lane | Owns |
| --- | --- | --- |
| A. Akmal | Lead: engine, integration, release | engine/, state/, storage/, shell/ (except i18n ms.json and en.json), ui/, existing modes/*, existing e2e specs, scripts/, package.json and lockfile, configs, netlify.toml, main branch |
| B. Wafi | Builder: new feature screens | new modes/suapan/, kedai/, matlamat/, papan/, kongsi/, tonton/ (each with its own i18n files), plus one Playwright spec per feature |
| C. Danish | Content: content, copy, accuracy | content/ (except explainers.json), content/scenarios/ incl. en/, shell/i18n/ms.json and en.json, allowed-real-names.txt, banned-names.txt |
| D. Aimar | Pitch: business, evidence, demo, art | new docs/business/, docs/pitch/, research/validation/, assets/explainers/, content/explainers.json; submission/, video/ |
Check this split against the real code. If a task needs a file owned by someone else, solve it with the contract
approach (a slot, stub or interface the owner creates first), not by sharing the file.

## 6. What IMPLEMENTATION-PLAN.md must contain
A. Priority levels: P0 = blocks others or the 18 Nov demo; P1 = in the demo; P2 = only if time allows;
   P3 = after the competition. Order every task by priority, then by dependency.
B. Contracts first (Akmal, 10 Nov, by 13:00): types and zod schemas, example data, engine function stubs, routes and
   home tiles, slots in existing screens, per-feature i18n loading. List each contract file exactly.
C. Task list. One row per task: ID | priority | owner | files touched (all owned by that person) | depends on (task
   IDs) | estimate (hours) | done when (a test or check).
   Rules: every task has exactly one owner; no two tasks touch the same file; dependencies only point to contracts or
   earlier-priority tasks, so the graph has no cycles. Show the graph as a list or a mermaid diagram.
D. Day-by-day schedule, 10-18 Nov, per person. Code freeze Sun 15 Nov at 20:00. Allow for the 12 Nov shortlist: put
   low-regret work on 10-11 Nov.
E. Branch and merge rules: one branch per person; Akmal merges daily at 20:00 in a fixed order and runs npm run check
   plus Playwright; how requests for another person's file are handled.
F. Plugins and tools per person: for each, what it does, why that person needs it, how to install it, and the exact
   setting. Consider superpowers (brainstorming, writing-plans, TDD, verification-before-completion), frontend-design,
   Playwright, Context7 and Chrome DevTools. Respect D12 (Playwright runs as a dev dependency; MCPs may not be
   connected). Recommend only tools that exist and add no run-time network calls to the app.
G. Session settings for everyone: how to set Opus 5.5 with effort no higher than medium in Claude Code, including for
   subagents. Use Claude Code's own documentation for the exact setting names; do not guess. Add one line to CLAUDE.md
   so every session follows it.
H. A copy-paste starter prompt for each person's first Claude Code session.

## 7. SRS and SDS updates
- SRS: new FR IDs for each feature (with M/S/C priority), updated scope and release phases, the 18 Nov demo
  acceptance checklist, business model in section 2, open questions.
- SDS: new modules and folders, data schemas (FeedPost, ShopItem, Goal, Classmate, Explainer), engine functions,
  balance.ts additions, i18n loading, build plan and tests.
- Keep the existing style. Do not delete earlier decisions; supersede them in DECISIONS.md.

## 8. When to decide vs ask me
Decide yourself: task breakdown, IDs, estimates, file names, schemas, and plugin choices.
Ask me before: changing a hard rule in CLAUDE.md, moving a feature between 18 Nov and after the competition, or giving
a person work outside their lane.

## 9. Done when
- [ ] docs/IMPLEMENTATION-PLAN.md exists with sections A-H
- [ ] No file appears in two people's task rows (include a check table: file -> owner)
- [ ] The dependency graph has no cycles, and no one waits after 10 Nov 13:00
- [ ] SRS, SDS and DECISIONS.md are updated and agree with each other
- [ ] npm run check:content still passes (docs only; no app code changed)
- [ ] Committed on a branch named docs/implementation-plan, not merged

## 10. Output in chat
A short summary: files changed, the P0 list, each person's total hours, and up to 3 questions.
