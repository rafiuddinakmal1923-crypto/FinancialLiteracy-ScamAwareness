# Decisions log

Resolved conflicts and gaps between CLAUDE.md, docs/claude-code-prompt.md, SRS, SDS and UI-SPEC.
This file wins over every other doc. The md files in this repo are the source of truth from 6 Nov 2026; the
claude.ai live doc artifacts are older snapshots.

| # | Problem | Decision | Docs updated |
| --- | --- | --- | --- |
| D1 | 12 weeks x 2-4 events needs 24-48 events, but the MVP had 8 scenarios (6 scam + 2 legit = 75% scam), failing the 55-65% scam-share test | A semester has **10 story scenarios: 6 scam + 4 legit (60%)**. Every week opens with a week intro (costs). Story scenarios run on 10 of the 12 weeks; week 7 (mid-semester break) and week 12 (exams, report card) have no scenario. Extra events are short: a bill, a Dompet offer or a notification. Two new legit scenarios: `alert_bankku.ink` (real BankKu fraud alert that asks you to call the number on your card) and `buku_terpakai.ink` (selling a used textbook, cash on campus) | SRS FR-03, FR-04, 5.1; SDS 5.3, 6.1; prompt section 4 |
| D2 | Scenario order for the MVP and video | Fixed order in `content/semester.json`: W1 kerja_sambilan, W2 yuran_kelas, W3 sewa_akaun (hostel fees due, so money is tight), W4 kerja_kafe, W5 parcel_kurier, W6 alert_bankku, W7 break, W8 crypto_naga, W9 pinjam_cepat, W10 buku_terpakai, W11 panggilan_mahkamah, W12 exams + report. No family repeats back to back. The adaptive engine (stretch) only reorders weeks 4-11 | SDS 5.3 |
| D3 | Card book total: UI-SPEC said 49, SRS said 7 tactics x scam families (42), most pairs never occur | **One card per (tactic, family) pair that appears as a `# flag` in the content.** The total is computed at load (16 in the MVP), never hard-coded | SRS FR-71; UI-SPEC S11 |
| D4 | In ink, `//` starts a comment, so `http://...` links in scenarios get cut off silently; and the content check bans URLs and phone numbers that scenarios need | **Fake links** use the reserved `.test` domain with no scheme, e.g. `kurierkilat-bayar.test/alamat`. **Fake phone numbers** use `01X-0000 0NNN` (e.g. 011-0000 0123). The content checker allows only these patterns, `997` and `semakmule.rmp.gov.my` | CLAUDE.md; SRS NFR-01; SDS 4.2; UI-SPEC S06, section 6; prompt section 6 |
| D5 | Sahih atau Scam: 10 cards in 60 s with a 1.5 s reason after each would spend 15 s of the timer on reading | **The timer pauses while the reason shows** | SRS FR-41; UI-SPEC S15 |
| D6 | Grade inputs undefined | Judgement accuracy = right calls / all decisions (avoid scam, accept legit). Money kept = final Duit / (starting money + all income) x 100, clamped 0-100. Flags found = found / flags in played scenarios x 100. Overall Imuniti = mean of the 7 tactics | SDS 5.4 |
| D7 | Tanya Kancil cost (10 XP) not in the balance table; desperation effect had no numbers | Tanya Kancil: -10 XP, XP never below 0. Simpanan below RM100 at a week intro: Tekanan +10. Tekanan 60 or more shows the urgency cue on desperate offers (job, mule, loan). All in `balance.ts` | SDS 5.1, 5.2 |
| D8 | pinjam_cepat was "only when Tekanan is high", which could leave the semester one scenario short | It always runs in week 9; high Tekanan adds the urgency cue (FR-23) | SRS FR-23 |
| D9 | Penal Code 424A-424D is cited from a news aggregator, which NFR-12 does not accept | All legal lines are i18n strings marked `TODO-VERIFY` until checked against the official Penal Code | SRS 2.1; UI-SPEC S09 |
| D10 | Viewports: CLAUDE.md says 360x800 + 1920x1080, the prompt adds 412x915 | Check all three | CLAUDE.md; SDS 6.3 |
| D11 | SRS open question: generic or disguised university | Generic fictional **Universiti Cempaka Raya (UCR)** | SRS 5.4 |
| D12 | Playwright MCP and Context7 MCP are not connected in this environment | Playwright runs as the `@playwright/test` dev dependency (offline via `context.setOffline(true)`, screenshots at all three viewports); library docs come from the official sites and the packages' own type definitions | - |
| D13 | Problem statement evidence includes a stat about children 7-17, outside the target group | Kept in the evidence list but marked "not for the pitch" | research/problem-statement.md |
