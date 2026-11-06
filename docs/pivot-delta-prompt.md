# Pivot delta prompt for Claude Code (6 Nov 2026 evening)

Paste the block below into Claude Code before it starts milestone 3.

```
The product direction changed. Before continuing, read docs/DECISIONS.md D18-D28 (they win over every other
doc), then the updated docs/SRS.md (v2), docs/SDS.md (v2, especially 5.1-5.8 and 6.2), docs/UI-SPEC.md (v2, new
screens S19-S21) and CLAUDE.md (rules 1, 11-13). Summary:

- Hybrid: financial literacy is the core loop; scams are the high-stakes events inside it.
- Target user: IPT undergraduates ~18-24, entered through first year. The MVP is still Semester 1.
- Semester: 4 scam + 6 finance/legit scenarios, scam share band 35-45%, new fixed order (D20).
- New: Kalkulator app (Mesin Masa, Semak Pulangan, Kos Sebenar) with pure maths in engine/finance.ts (SDS 5.7
  has the test examples); `ui:calc` directive; Labur pot in Dompet with two fictional products; 6 finance
  concepts with Celik Kewangan scores and Kad Ilmu; outcomes untung/rugi/hutang; Cek Harian daily booster.
- Scoring: new grade weights, money health, renamed levels (D24). Mod Sindiket moves to stretch (D26).
- Real scheme names only in content/concepts.json via content/allowed-real-names.txt (D27). No investment advice.

What to do, in order:
1. Review the updated docs against what is already built on build/celik-mvp and list every conflict or gap
   (types.ts, balance.ts, tags.ts, meters/xp rules, tests, content checker, home screen, level names). Ask me
   about anything unclear before changing code.
2. Update your plan in docs/superpowers/plans/ for the new milestone order: M3 money + mule (Dompet with Labur,
   BankKu, sewa_akaun, money chain) -> M4 Kalkulator + finance.ts + crypto_naga/bayar_nanti hooks -> M5 Cek
   Harian + Mod Kelas -> M6 full semester -> M7 stretch (Mod Sindiket, adaptive, share card, English).
3. In ONE commit, update types, balance.ts and the existing tests (scam-share band, grade, levels) so the suite
   stays green before adding features.
4. Then continue with M3, using TDD for finance.ts and every scoring rule, and verification-before-completion at
   each milestone gate.
5. Commit the doc changes I made as "docs: hybrid pivot (D18-D28)" first, if they are not committed yet.
```
