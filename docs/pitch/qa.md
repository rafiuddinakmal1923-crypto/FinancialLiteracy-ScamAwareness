# Celik: Q&A sheet (18 Nov pitch, D7)

Short answers first; the detail is for follow-ups. **Facts must cite docs/verification-log.md** (Danish, C5). Row IDs
(V1-V26) are from the log Danish wrote on 7 Nov. The log covers what the app shows; the national statistics from
research/problem-statement.md are not in it yet, so they stay [VERIFY]. **Never quote the Penal Code section numbers:
V1 is still open.** Danish checks this sheet on Tue 17 Nov.

| # | Likely question | Answer | Source |
| --- | --- | --- | --- |
| 1 | How is this different from Mind Your Ringgit or Singapore's #XiamTheScams? | Celik is built for the student money moment (PTPTN, hostel fees, first part-time pay), puts a real and a fake investment side by side with a calculator that shows why one is impossible, and treats scams as the cost of weak money skills, so both are learned together. Mod Kelas runs a whole orientation hall from one screen | docs/SRS.md 2.2, 2.3 |
| 2 | Most investment-scam victims are 31-50, not students. Why students? | Habits form now: today's students are tomorrow's targets. And students are already targeted directly as mule-account holders, which is a criminal offence many first-years don't recognise; police can freeze and seize mule accounts. We never claim students are the main victims | research/problem-statement.md [VERIFY]; mule-account consequences: verification-log V2-V4 |
| 3 | Isn't this investment advice? | No. Every product in the game is fictional, every rate is labelled "example", and the game never recommends a product. It teaches how to judge a return and how to check a licence on the regulator's official list (the SC Investor Alert List, the BNM Financial Consumer Alert List) | CLAUDE.md rule 12; verification-log V23, V25 |
| 4 | How do you know it works? | We ran a 12-question test before and after one session with [n] students: scores went from [before] to [after] out of 12. Limitation: [one honest limit, e.g. same questions twice, short-term only]. Research on game-based "inoculation" shows the effect fades without boosters, which is why Cek Harian exists | research/validation/results.md; research/problem-statement.md (Maertens et al.) [VERIFY] |
| 5 | What data do you collect? | None. No accounts, no names, no bank details, no analytics. Progress stays on the phone. Every fake bank screen says SIMULASI and is pre-filled | CLAUDE.md rules 2 and 5 |
| 6 | Scams change every month. How do you keep up? | Scenarios and cards are content files, not code: a new scam is a new file, checked automatically, with no app change. Seasonal packs (new scams, Raya, PTPTN season) are part of the university licence | CLAUDE.md rule 7; docs/business/model.md |
| 7 | Who pays? | Students never pay. Universities license an orientation-week package (Mod Kelas kit, seasonal packs, facilitator training); a grant funds the first 2-3 pilot universities; sponsors are a backup and never appear in the game | docs/business/model.md |
| 8 | How much would a university pay? | We'll set the price per student in the pilot, against what a HEP office already spends on awareness talks. [TO FILL if the team has a figure by then] | docs/business/model.md |
| 9 | Why offline, with no server? | Many B40 students have limited data; offline means it works anywhere, collects nothing, and costs almost nothing to run per student | docs/SRS.md 2.5; docs/business/model.md |
| 10 | Why fictional brands? Wouldn't real bank names be more realistic? | Using real brands could look like endorsement or teach "this logo is safe". Scammers copy real logos anyway, so we teach the behaviour, not the logo. The only real items are the correct actions: NSRC 997 and the official Semak Mule portal | CLAUDE.md rule 1 |
| 11 | What's the 997 number? Is it real? | Yes: the National Scam Response Centre hotline, open 24 hours. Report within 24 hours of a transfer so the authorities can block the accounts and transactions. The game drills it | verification-log V6, V7 |
| 12 | Is the debt maths right? | Yes. RM1,000 at an example flat 18% for 12 months is RM98.33 a month and RM1,180 in total: about 31.7% a year in real terms. The same maths runs in Kos Sebenar and is unit-tested | verification-log V12, V24; app/src/engine/finance.ts |
| 13 | Can it scale beyond your campus? | It's a web app: one link, no app store, works on low-end Android. Mod Kelas needs one screen per hall. Content packs are the same for every university | docs/SRS.md 2.4, 2.5 |

## Spare facts (only if asked; check each one before using)
- Fake investment scams: highest losses for three years; RM848.62m (2024) → RM1.46b (2025). [VERIFY]
- Ages 19-30 score below the national average in BNM's financial literacy index. [VERIFY]
- Only 18.6% of EPF members aged 18-30 met the basic savings level for their age (31 Aug 2025). [VERIFY]
- Students made up about 8% of mule-account cases (official profiling). Do NOT use the ">50%" figure. [VERIFY]
- 877 youth bankruptcies in 2024, up from 727 in 2023. [VERIFY]

## Rules for answering
- Don't guess a number. Say "I'll get back to you on the exact figure" and let Danish answer.
- Never name a real product as good or bad.
- If a judge points out a weakness, agree, then say what the pilot will test.
