# Verification log (C5)

Checked 7 Nov 2026 for task C5. Each row is a legal line, enforcement claim or example rate that the app shows.
"Verified" means the line matches the source as worded now. Lines that changed were reworded to say only what
the source says. Q&A answers (D7) should cite the row ID.

Rule for the pitch: if a line is still **Open**, do not read it aloud or show it on a slide as a fact.

## Legal and enforcement lines (`app/src/shell/i18n/ms.json`, `en.json`)

| ID | Key | Status | What changed | Source |
| --- | --- | --- | --- | --- |
| V1 | `legal.penalCode` | **Open**: not changed | Says "424A-424D". Low & Partners mentions "four dedicated sections" but names only 424A, 424B and 424C; Malay Mail (bill as tabled) names 424A, 424B, 424C(1) and 424C(2). Whether 424D exists, and the exact wording, must be checked in the official Penal Code (Act 574) from the Attorney General's Chambers (D9). Left as it is because `app/e2e/scenario2.spec.ts` matches the current text | Low & Partners, "Keldai Accounts": https://www.lowpartners.com/keldai-accounts-when-helping-a-friend-becomes-a-criminal-offence/ ; Malay Mail, 9 Jul 2024: https://www.malaymail.com/news/malaysia/2024/07/09/govt-seeks-harsher-penalties-for-mule-account-holders-renters-in-crackdown-on-scams-jail-term-up-to-10-years-rm150000-fine/143181 |
| V2 | `akibat.mule.1.text`, `akibat.mule.2.text`, `moneyChain.trace` | Verified (general description) | None | The Sun, 18 Nov 2024, police can freeze and seize mule accounts and block suspicious transactions: https://thesun.my/news/malaysia-news/police-can-freeze-and-seize-mule-bank-accounts-ab13306305/ |
| V3 | `akibat.mule.3.text` | Verified after rewording | Removed "Baki yang tinggal ditarik untuk dipulangkan kepada mangsa" (no source says leftover money is always returned). Now: the balance can't be used during the investigation | Same as V2 |
| V4 | `akibat.mule.4.text` | Verified (general description) | None | Same as V2 |
| V5 | `akibat.frozen.1.text`, `akibat.frozen.4.text`, `akibat.panggilan_mahkamah.scammed.4.text` | Verified (general description) | None | Same as V2 |
| V6 | `akibat.sewa_akaun.frozen.2.text` | Verified after rewording | Was "the bank returns the money to the victim". Now: the bank blocks the transaction for now and the victim's money has a chance of being saved (keeps the opening that `app/e2e/scenario2.spec.ts` matches) | NSRC 997 page, malaysia.gov.my (report within 24 hours so authorities can block accounts and transactions and help recover funds): https://www.malaysia.gov.my/en/topics/nsrc-997-hotline |
| V7 | `legal.drill997.freeze` | Verified after rewording | Now matches the official wording: report to NSRC 997 within 24 hours so authorities can block accounts and transactions | Same as V6. The page also says the line runs 24 hours a day |
| V8 | `legal.akpk`, `akibat.hutang.4.text` | Verified | Added "secara percuma" (free) | BNM press release, 17 Apr 2006 (AKPK is a BNM subsidiary; services free of charge): https://www.bnm.gov.my/-/agensi-kaunseling-dan-pengurusan-kredit-commences-operations ; The Star, 1 Jul 2019 ("AKPK's services are free of charge for all individuals"): https://www.thestar.com.my/news/nation/2019/07/01/akpk-our-services-are-free |
| V9 | `akibat.panggilan_mahkamah.scammed.3.text` | Verified after rewording | Removed "courts" and the secrecy claim as facts. Now: real police and authorities won't ask you to move money to another account; being told to keep it secret is a warning sign | BNM Macau scam page ("Authorities (e.g. BNM, LHDN, MCMC, PDRM) will not ask you to immediately transfer funds to another account"): https://www.bnm.gov.my/macauscam |
| V10 | `akibat.kawan_labur.untung.2.text` | Verified (general statement) | None | General statement with no figure or legal claim (unit prices go up and down; no return is guaranteed) |

## Example numbers (checked by calculation)

| ID | Where | Status | Check |
| --- | --- | --- | --- |
| V11 | `akibat.untung.2.text`, `akibat.kawan_labur.untung.3.text`, `akibat.bayar_nanti.untung.3.text` | Verified | RM50 a month, 132 monthly deposits (age 19 to 30), 5% a year compounded monthly = RM8,775.28. Labelled as an example rate |
| V12 | `akibat.hutang.3.text` | Verified | RM1,000 at a flat 18% for 12 months = RM1,180.00 total, RM180.00 more than cash |

## Kad Ilmu (`content/concepts.json`)

`source` now points to these rows. Three entries stay `TODO-VERIFY`: kecemasan `duniaSebenar`, kompaun
`duniaSebenar` and hutang `duniaSebenar` (no source checked yet).

| ID | Entry | Status | Source or check |
| --- | --- | --- | --- |
| V20 | bajet `duniaSebenar`, `caraSemak` | Verified | EPF publishes Belanjawanku, a guide to minimum monthly expenses for different household types; latest edition seen: 2024/2025. Malay Mail, 13 Dec 2024: https://www.malaymail.com/news/malaysia/2024/12/13/how-much-to-spend-monthly-and-save-for-later-day-your-guide-to-understanding-epfs-new-belanjawanku-and-retirement-framework/159667 . 50/30/20 is shown as an example split, not an official rule |
| V21 | kompaun `contoh` | Verified | RM50 a month for 120 months at 5% a year compounded monthly = RM7,764.11 (RM6,000 paid in) |
| V22 | risiko `contoh` | Verified | 1.3^52 = about 84,000,000% a year, so "lebih sejuta peratus" is true |
| V23 | risiko `caraSemak` | Verified | SC Investor Alert List lists unauthorised entities and individuals: https://www.sc.com.my/investor-alert |
| V24 | hutang `contoh` | Verified | RM1,000 at a flat 18% for 12 months: RM98.33 a month, RM1,180 total; the equivalent yearly rate (APR) is 31.7% |
| V25 | hutang `caraSemak` | Verified | BNM Financial Consumer Alert List (companies and websites not authorised under BNM laws; "not exhaustive"): https://www.bnm.gov.my/-/financial-consumer-alert-list-of-unauthorised-companies-and-websites-has-been-updated ; AKPK as V8 |
| V26 | semak `duniaSebenar`, `caraSemak` | Verified | SC list as V23; BNM list as V25 |

## Still to do

1. **V1 Penal Code:** read the mule-account sections in the official Penal Code (Act 574, as amended in 2024), confirm
   whether they run 424A-424C or 424A-424D, then update the line (and ask Akmal to update `app/e2e/scenario2.spec.ts`).
   Until then, keep it off the slides.
2. **Akmal (REQ):** three test files require keys to stay in `_todoVerify`, so they are still listed there even
   though they are verified: `app/src/shell/i18n/i18n.test.ts` and `app/src/modes/semester/aftermath.test.ts`
   (rows V2-V6) and `app/src/modes/semester/Consequence.finance.test.tsx` (`legal.akpk`, `akibat.untung.2.text`,
   `akibat.hutang.4.text`, rows V8 and V11). Once the tests are relaxed, Danish removes every key except
   `legal.penalCode` (V1) from the list.
3. Three Kad Ilmu `duniaSebenar` entries above are still `TODO-VERIFY`.

## Review list for Wafi (C6)

Empty until W1-W7 land.
