# Celik: Financial Literacy & Scam Awareness

Alternative idea for the Festival Idea Putrajaya 2026 Innovation Challenge (IPT category, theme: Edutainment &
Innovation). The main project is D:\MakmalPop; this folder keeps the scam / financial literacy direction ready.

Tagline: **Bijak duit, kebal scam** (money-smart, scam-proof). "Celik" is the Malay word for literate, as in celik kewangan
(financial literacy). Note: avoid the full phrase "Celik Kewangan" as a product name; Prudential already uses it for a programme.

## Idea in one line
An offline phone-simulator game where university students live through a semester of real money decisions
(budgeting, emergency fund, first pay, how money grows, realistic returns, cost of debt) with scams as the
high-stakes events inside it (job scams, mule-account offers, fake investments, authority calls). A Kalkulator,
a daily 2-minute Cek Harian and orientation-week class battles keep them coming back. Direction: docs/DECISIONS.md D18.

## Target user
IPT undergraduates, about 18-24, entered through first year (orientation week); many B40, often managing a lump
sum (PTPTN or scholarship) and a first bank account alone for the first time.

## Documents
| File | What it is | Live doc |
| --- | --- | --- |
| docs/SRS.md | Requirements (FR / NFR, scope, acceptance) | https://claude.ai/artifact/3woKSQeWmxHZVgipLPpBmj |
| docs/SDS.md | Design (stack, architecture, modules, data, game systems, build plan) | https://claude.ai/artifact/Dt1cRrzkLVjn5vriotwdtX |
| docs/UI-SPEC.md | Design tokens, components, screens S01-S18, copy style | - |
| docs/claude-code-prompt.md | Build prompt: stack, MVP, content list, milestones, tests | - |
| docs/DECISIONS.md | Resolved conflicts between the docs (wins over all of them) | - |
| docs/claude-code-prompt.md | Full build prompt for Claude Code | - |
| docs/DECISIONS.md | Decisions log (wins over every other doc) | - |
| docs/pivot-delta-prompt.md | Prompt to give Claude Code for the hybrid pivot | - |
| research/problem-statement.md | Problem statement and evidence | - |
| research/gamification-benchmark.md | Gamification benchmark of 10 products and the new mechanics | - |

The md files in docs/ are the source of truth from 6 Nov 2026 (see docs/DECISIONS.md). The live doc artifacts
are older snapshots and do not include those decisions.

## Folder structure
- docs/        SRS, SDS, UI spec, Claude Code prompt, decisions log
- research/    problem statement, evidence, gamification benchmark
- app/         source code (Vite + React PWA)
- content/     ink scenarios, cards, Sindiket and tactic JSON
- assets/      illustrations, sounds, fonts
- video/       script, footage, final cut
- submission/  entry form answers
