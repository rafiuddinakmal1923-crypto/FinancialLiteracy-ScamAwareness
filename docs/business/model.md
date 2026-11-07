# Celik: business model (one page)

Source: docs/feature-plan.md section 5, docs/SRS.md 2.6, decision D42. Numbers marked [TO FILL] are not known yet;
numbers marked *(estimate)* are the team's guess and must be checked before the pitch.

## In one line

**Free for every student, forever. Universities and partners pay for the orientation programme around it**, the way
they already pay for awareness talks, except this is one students remember.

## Who uses it, who pays

| | Who | What they get | Do they pay? |
| --- | --- | --- | --- |
| **User** | IPT undergraduates, 18-24, entered at orientation week | The full game, offline, no ads, no data collected | **Never** |
| **Customer** | University student-affairs office (HEP) | Orientation-week package: Mod Kelas facilitator kit, seasonal content packs (new scam types, Raya, PTPTN season), a short facilitator training | **Yes:** yearly licence |
| **Pilot funder** | Grant or government financial-education fund | The first 2-3 universities and the before/after evidence (SRS 5.3) | Funds the pilot |
| **Backup funder** | Sponsors (bank CSR, agencies) | Credit on the splash screen only | Funds content packs |

## Revenue streams

| Model | Role | Why |
| --- | --- | --- |
| University licence | **Main** | Every university runs orientation and awareness programmes every intake. Mule-account awareness at universities is already a national priority (see research/problem-statement.md) |
| Grant / government funding | **Pays for the pilot** | Pilots need evidence before a university will pay |
| Sponsorship | **Backup** | Only with the independence rule below |
| Students pay (freemium, paid packs, in-app purchases) | **Not used** | Charging B40 students goes against the problem Celik solves |

**Independence rule (hard rules 1 and 12):** a sponsor never appears as a brand, character, logo, colour or
recommendation inside the game. It gets a splash-screen credit only, and has no say over the scam or money content.

## Price

| Item | Value |
| --- | --- |
| Licence price per student per year | **[TO FILL]**: ask a HEP office what it spends per student on awareness programmes, then test the price in the pilot |
| Example yearly licence for one university | [TO FILL] = price per student × first-year intake |

## Cost model (yearly)

The app is a static offline web app with no server, so the cost of one extra student is close to zero. Most of the
cost is people's time.

| Cost | What it covers | Fixed or per university | Amount |
| --- | --- | --- | --- |
| Hosting | Static site; no backend, no database | Fixed | RM0 on a free static host *(estimate)* |
| Content packs | Writing and fact-checking 2-3 seasonal packs a year (new scams, Raya, PTPTN) | Fixed | [TO FILL] hours × [TO FILL] RM/hour |
| Fact-check and legal review | Checking legal lines and example rates against official sources each year | Fixed | [TO FILL] |
| Facilitator training | One short session per university per intake | Per university | [TO FILL] |
| Mod Kelas kit | Printed guide and slides for orientation facilitators | Per university | [TO FILL] |
| Maintenance | Bug fixes, browser updates | Fixed | [TO FILL] hours |

**Break-even:** number of universities needed = fixed costs ÷ (licence per university − cost per university).
Fill this in once the price and the costs above are known.

## Roadmap

| Phase | When | What | Funded by |
| --- | --- | --- | --- |
| 1. Pilot | After the competition | 2-3 universities, the before/after test at each, feedback from HEP officers | Grant or sponsor |
| 2. Licence | Next academic year | Yearly licence per university; seasonal content packs | Universities |
| 3. Grow | Later | Anonymous university dashboard and campus leaderboards (needs a server and a change to hard rule 5, with a privacy design) | Universities |

## Risks

| Risk | What we do |
| --- | --- |
| Universities have no budget line for it | Price it against what an awareness talk already costs; start with grant-funded pilots |
| A sponsor wants its brand in the game | Independence rule above, written into every sponsor agreement |
| Content goes out of date (new scam types) | Seasonal content packs are part of the licence |
| No proof it works | Before/after test in every pilot (SRS 5.3); first results from Sat 14 Nov (research/validation/results.md) |
