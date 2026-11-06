# CLAUDE.md: Celik

Full build spec: docs/claude-code-prompt.md. Read it with docs/DECISIONS.md, docs/SRS.md, docs/SDS.md and
docs/UI-SPEC.md before any change. docs/DECISIONS.md wins over everything. Otherwise: the SRS wins for
requirements, UI-SPEC wins for look and copy, the SDS wins for structure and numbers.

## Hard rules
1. **Fictional brands only.** No real bank, telco, courier, company, app or agency names, logos, colours, phone
   numbers or URLs. The only real items allowed are the correct actions: NSRC 997 and the official Semak Mule
   portal (https://semakmule.rmp.gov.my), opened only from a clearly labelled button. In-game links use the
   reserved `.test` domain with no scheme (`kurierkilat-bayar.test/alamat`); in-game phone numbers use
   `01X-0000 0NNN` (e.g. 011-0000 0123). `npm run check:content` enforces this. Exception (D27): real scheme
   and agency names (KWSP/EPF, PTPTN, Tabung Haji, ASB as an example of a fixed-price fund, SC, BNM, AKPK) may
   appear only in `content/concepts.json` (Kad Ilmu) and "where to check" lines, listed in
   `content/allowed-real-names.txt`; never as characters, senders, logos or colours.
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
11. **Legal lines and rates are placeholders.** Penal Code, NSRC and bank-rule sentences, and every example rate
    (Semak Pulangan bands, Labur products), are marked `TODO-VERIFY` until checked against official sources.
12. **No investment advice.** Explain what products are and how to check them; never recommend one. Every rate is
    labelled "contoh" (example). All money maths lives in `app/src/engine/finance.ts` with unit tests.
13. **Direction (D18):** financial literacy is the core loop; scams are the high-stakes events inside it. When a
    trade-off comes up, protect the video path in SRS 5.2.
