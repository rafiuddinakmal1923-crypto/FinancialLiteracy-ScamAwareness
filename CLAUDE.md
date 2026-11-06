# CLAUDE.md: Celik

Full build spec: docs/claude-code-prompt.md. Read it with docs/DECISIONS.md, docs/SRS.md, docs/SDS.md and
docs/UI-SPEC.md before any change. docs/DECISIONS.md wins over everything. Otherwise: the SRS wins for
requirements, UI-SPEC wins for look and copy, the SDS wins for structure and numbers.

## Hard rules
1. **Fictional brands only.** No real bank, telco, courier, company, app or agency names, logos, colours, phone
   numbers or URLs. The only real items allowed are the correct actions: NSRC 997 and the official Semak Mule
   portal (https://semakmule.rmp.gov.my), opened only from a clearly labelled button. In-game links use the
   reserved `.test` domain with no scheme (`kurierkilat-bayar.test/alamat`); in-game phone numbers use
   `01X-0000 0NNN` (e.g. 011-0000 0123). `npm run check:content` enforces this.
2. **Never collect real data.** No inputs for real names, IC numbers, bank accounts, OTPs or passwords. Fake values
   are pre-filled and every simulated bank/portal screen shows the "SIMULASI" banner.
3. **No scam generator.** Mod Sindiket uses fixed card templates only; every round ends with a debrief.
4. **No shaming.** Consequence copy explains and offers a retry; never call the player stupid.
5. **Offline first.** Everything works in airplane mode after the first load; no backend, no analytics, no AI calls.
6. **BM first.** Bahasa Melayu by default with an English toggle; all strings live in i18n files.
7. **Content is data.** Scenarios are .ink files in content/scenarios; cards and tactics are JSON validated with zod.
   Adding a scenario must not need app code changes.
8. **Tunable numbers live in app/src/engine/balance.ts.**
9. Phone viewport 360-430 px is the primary target; check 360x800, 412x915 and 1920x1080 with Playwright before
   claiming done.
10. Keep the DEMO watermark toggle working; it is on for every screen used in the video.
11. **Legal lines are placeholders.** Penal Code, NSRC and bank-rule sentences are i18n strings marked `TODO-VERIFY`.
