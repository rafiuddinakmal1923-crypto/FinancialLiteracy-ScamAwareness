# Pivot review: v2 docs (D18-D28) vs what is built on build/celik-mvp

Built so far: milestones 1-2 (scaffold, engine core, phone shell, kerja_sambilan end to end). Reviewed 6 Nov 2026.

## Conflicts and gaps

| # | Area | Built today | v2 needs | Change |
| --- | --- | --- | --- | --- |
| 1 | `types.ts` Outcome | scammed, mule, frozen, safe, curiga | + untung, rugi, hutang (D23) | extend |
| 2 | `types.ts` ScenarioMeta.type | scam, legit | + finance; `concepts: Concept[]` (D23) | extend |
| 3 | Concept taxonomy | none | `CONCEPTS` = bajet, kecemasan, kompaun, risiko, hutang, semak | add |
| 4 | `Meters` | duit, simpanan, tekanan, xp, imuniti, akaun, rekod | + `celik: Record<Concept, number>` (start 30), `labur: { amanah, ekuiti }` | extend |
| 5 | Effect | duit, tekanan, akaun, rekod | + `labur` (D22) | extend |
| 6 | UiDirective | transfer, link | + `calc { tab, preset }` from `# ui:calc:<tab>:<preset>` (D21) | extend |
| 7 | `tags.ts` | global keys without `concepts`; type scam/legit | `concepts` global key, `type:finance`, new outcomes, `ui:calc`, `effect:labur` | extend + tests |
| 8 | Families | 9 scam/legit families | finance scenarios need a family so "no family twice in a row" works | ruling P1 |
| 9 | `meters.ts` applyOutcome / isRight | scam + legit rules | finance rules (±10 Celik per concept, +50/+20 XP); untung right; rugi, hutang wrong | extend + tests |
| 10 | `balance.ts` levels | Mangsa, Waspada, Bijak, Penjaga, Wira Anti-Scam | Pemula, Berjimat, Bijak, Pelabur, Celik (D24) | rename + tests |
| 11 | `balance.ts` grade | 40/30/20/10 | 30 judgement / 25 Celik / 20 Imuniti / 15 money health / 10 flags (D24) | replace (grade.ts not built yet) |
| 12 | `balance.ts` adaptive band | 55-65% | 35-45% (D20) | replace |
| 13 | `balance.ts` finance block | none | bands (TODO-VERIFY), unrealisticAbove 0.2, emergencyTarget 300, Labur rates and ekuiti path, Celik rule values, xp calc +10, kadIlmu +10, labur-before-emergency Tekanan +5 | add |
| 14 | Build checks (`compile.ts`) | legit needs safe + curiga | finance needs at least one right (safe/untung) and one wrong (rugi/hutang/curiga) path; concepts must exist | extend + tests |
| 15 | Content checker | bans agencies everywhere (ruling R4) | real names allowed only in `content/concepts.json` via `content/allowed-real-names.txt` (D27); rates in concepts.json marked TODO-VERIFY | extend + tests |
| 16 | `ScenarioResult` | tactics, family | + concepts (for Celik and report card) | extend |
| 17 | Home (S03) | Imuniti ring, 5 app tiles + Tetapan, 4 mode tiles incl. Sahih atau Scam and Mod Sindiket | two rings (Celik + Imuniti), net worth, + Kalkulator tile, dock: Semester, Cek Harian, Mod Kelas, Sindiket locked | M3 task |
| 18 | Kad (S11) | not built | two tabs: Bendera Merah + Kad Ilmu | M6 task |
| 19 | Plan | M3 money+mule, M4 swipe+kelas, M5 Sindiket, M6 semester | M3 money+mule (Labur) -> M4 Kalkulator -> M5 Cek Harian + Kelas -> M6 semester -> M7 stretch incl. Sindiket | plan v2 |
| 20 | Scenario list | plan had 10 incl. yuran_kelas, kerja_kafe, parcel_kurier, pinjam_cepat | drop those 4; add dompet_minggu0, gaji_pertama, kawan_labur, bayar_nanti (D20) | plan v2 |

## Open from the Task 10 review (milestone 2)

- I1: flag-hunt word buttons are about 22 px tall and the 48 px check skips them.
- M2: opening another chat while a finished one's consequence is still open rolls back meters.
- M5: new mule/frozen consequence steps make enforcement claims; add to `_todoVerify`.
- M6: `huntFlag` should only award cards in scam scenarios.

## Controller rulings (no question needed)

- P1: every scenario keeps a `family`. New families: `budget` (dompet_minggu0), `pay` (gaji_pertama); kawan_labur and crypto_naga use `investment` (weeks 5 and 8, never adjacent); bayar_nanti uses `loan`. Unused `parcel` and `payment` stay valid for later content.
- P2: Kalkulator +10 XP once per scenario and Kad Ilmu +10 XP live in `balance.ts` and are applied through store actions, not tags (D15 stays).
- P3: M2, M5, M6 from the Task 10 review are fixed in the alignment commit.
