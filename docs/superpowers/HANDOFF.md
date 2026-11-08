# Handoff (8 Nov 2026)

State: `main` at `2c5ccaa` has the MVP, finalist work W1-W7, the report card Papan link and the A8 lazy-loading.
776 unit tests, tsc clean, check:content OK, build about 1.55 MB, Playwright 85/85 with finalist on; with
`VITE_FINALIST=0` the 65 non-finalist tests pass and the 20 finalist tests fail as expected (D45).
Full review and scores: docs/REVIEW-2026-11-08.md.

Live site: Netlify builds `build/celik-mvp`, now `2c5ccaa` (same as `main`, finalist screens off). It only moves
forward to a `main` commit that passed both Playwright configurations (D47). Filming from the live link is fine.

Plans: docs/IMPLEMENTATION-PLAN.md (owners, tasks A1-A10, W1-W8, C1-C8, D1-D7). Decisions: docs/DECISIONS.md (D1-D47)
win over everything.

## Left to do
1. 9 Nov: fix the script overclaim (REQ-A1) and the mule bank notice (REQ-D5), film, upload, fill the form.
2. 10-18 Nov: A7 nightly merges (then move `build/celik-mvp`, D47), A9 deploy with `VITE_FINALIST = "1"` only when the user says so.
3. Open REQs from the review: Papan streak source and Kedai pot (Wafi), kipas and lampu in shop.json, Raya scenario, `_todoVerify`
   clean-up, Semak Pulangan bands and the mule bank notice (Danish), script overclaim (Aimar).

## Deferred minors worth fixing in the fix wave
- Fixed in A6: typed-URL scenario guard, beginWeek guard, seedGame waits for the save, autosave flush, swipe clock
  pause, ComeBack across midnight, SemakSim digit match. Still open: CHAT_WEEKS duplicates semester.json; c007 wording.
- Content to review by people: lines marked `// REVIEW` in content/scenarios/*.ink and the lists in .superpowers/sdd/*/task-*-report.md (git-ignored; local only).

## Notes
- Subagent ledgers live in .superpowers/sdd/ (git-ignored, local): progress.md holds every ruling R1-R14.
- Untracked folders Celik/ and graphify-out/ are the user's; never committed.
