# Handoff (8 Nov 2026)

State: MVP (milestones 1-6) and finalist work W1-W7 are built. `main` is at `ec48ae6`; Wafi's W5-W7 (`lane/wafi` 189a57c) and
Aimar's pitch docs wait for the nightly A7 merge. Review branch `review/8nov` = main + both lanes + the ReportCard test fix:
775 unit tests, tsc clean, check:content OK, build 1.55 MB, Playwright 85/85 with finalist screens on and retries off;
with `VITE_FINALIST=0` the 65 non-finalist tests pass and the 20 finalist tests fail as expected (D45).
Full review and scores: docs/REVIEW-2026-11-08.md.

Live site: Netlify serves `build/celik-mvp`, still at `1dabbeb` (48 commits behind main). It lacks the C5 legal-line
fixes, so film the 9 Nov video from a local build of `main`, not from the live link, unless the user updates the site.
Finalist screens stay off on the live site until A9 (D45).

Plans: docs/IMPLEMENTATION-PLAN.md (owners, tasks A1-A10, W1-W8, C1-C8, D1-D7). Decisions: docs/DECISIONS.md (D1-D46)
win over everything.

## Left to do
1. 9 Nov: film from a local `main` build (see docs/REVIEW-2026-11-08.md P0 list), upload, fill the form.
2. 10-18 Nov: A7 nightly merges, A8 performance pass, A9 deploy with `VITE_FINALIST = "1"` only when the user says so.
3. Open REQs from the review: Papan streak source and Kedai pot (Wafi), kipas and lampu in shop.json, Raya scenario, `_todoVerify`
   clean-up and Semak Pulangan bands (Danish), script overclaim and film source (Aimar).

## Deferred minors worth fixing in the fix wave
- Fixed in A6: typed-URL scenario guard, beginWeek guard, seedGame waits for the save, autosave flush, swipe clock
  pause, ComeBack across midnight, SemakSim digit match. Still open: CHAT_WEEKS duplicates semester.json; c007 wording.
- Content to review by people: lines marked `// REVIEW` in content/scenarios/*.ink and the lists in .superpowers/sdd/*/task-*-report.md (git-ignored; local only).

## Notes
- Subagent ledgers live in .superpowers/sdd/ (git-ignored, local): progress.md holds every ruling R1-R14.
- Untracked folders Celik/ and graphify-out/ are the user's; never committed.
