# Handoff (7 Nov 2026)

State: branch `build/celik-mvp`, milestones 1-6 done (the MVP for the 9 Nov video). Last verified run: 645 unit tests, tsc clean, check:content OK, build 1.44 MB (limit 8 MB), Playwright 58/58. Not pushed, not merged to main, not deployed.

Plans: docs/superpowers/plans/2026-11-06-celik-mvp.md (tasks 1-10, done) and ...-v2.md (tasks 11-30; 11-27 done). Decisions: docs/DECISIONS.md (D1-D33 win over everything). Pivot review: docs/superpowers/pivot-review.md.

## Left to do
1. Final whole-branch review (Opus, effort medium per the user), then ONE fix wave. Triage the deferred minors below.
2. Milestone 7 stretch (finalists, by 18 Nov): Task 28 Mod Sindiket (v1 Tasks 16-17), Task 29 adaptive order + share card + full English strings, Task 30 sounds + performance pass (4x CPU throttle, lazy-loaded modes).
3. Not code: team must verify every `TODO-VERIFY` / `_todoVerify` legal line and example rate against official sources; have a native speaker read the BM copy; film the video (acceptance checklist: docs/SRS.md 5.2); fill submission/form-answers.md; deploy only when the user says so.

## Deferred minors worth fixing in the fix wave
- Typed URL can play a scenario out of order (no availableChats check in ChatThread/IncomingCall); `beginWeek` lacks a store-level canBeginWeek guard; CHAT_WEEKS duplicates semester.json.
- Playwright `retries: 1` masks flakes; seedGame should wait for the saved row; startAutoSave cleanup drops a pending write without flushing.
- Cek Harian: swipe clock keeps counting while the tab is hidden; ComeBack screen frozen at mount across midnight.
- ~10 missing en.json keys (rapor.*, kad.*), hardcoded BM aria-label in KadBook.tsx:529.
- Cuti `?preset=labur50` prefill may not apply outside scenario mode (Kalkulator.tsx:32).
- SemakSim exact-string match (make dash-insensitive); c007 card wording; money-card hygiene tests.
- Content to review by people: lines marked `// REVIEW` in content/scenarios/*.ink and the lists in .superpowers/sdd/*/task-*-report.md (git-ignored; local only).

## Notes
- Subagent ledgers live in .superpowers/sdd/ (git-ignored, local): progress.md holds every ruling R1-R14.
- Untracked folders Celik/ and graphify-out/ are the user's; never committed.
