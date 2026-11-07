# Demo dry run (D7), 8 Nov 2026

Walked the 18 Nov demo path (docs/pitch/demo-script.md, SRS 5.2b) on the dev server at 412×915, on `main`
(`dbc066b`) plus `lane/wafi` (`de7d335`, W2-W4, not merged yet), merged only in a local test branch that was then
deleted. Re-run this after every evening merge until the demo passes end to end.

**Latest run (8 Nov, `main` `557e4a5` + `lane/wafi` `abea6f8`, from `#/demo/pitch`):** 8 of 9 checks pass. Home at week 5,
Semak → 137,640.8% + Terlalu Lumayan, Kedai with RM1,120 Duit, Kos Sebenar RM120 / RM1,320, goal bar, report card.
Only Tonton fails (still a placeholder). Wafi's W2-W4 are not in `main` yet, so on the live app Suapan has no
Percaya/Semak/Lapor and Kedai is a placeholder until Akmal merges `lane/wafi`.

| Demo step | Result | Blocker |
| --- | --- | --- |
| Suapan feed shows the "2% a day" post (`p004`, Abang Duit Pantas) | ✅ Works (W1 on `main`; Percaya/Semak/Lapor from W2) | - |
| Semak → debrief sheet ("Ini hype: sah, tetapi mengelirukan", +10 XP) | ✅ Works | - |
| Semak → **Semak Pulangan with Terlalu Lumayan** | ✅ Fixed by Danish (`8064a40`, re-tested 8 Nov): 137,640.8% a year + Terlalu Lumayan. Reaches the live app after Akmal merges `lane/danish` and `lane/wafi` | ~~REQ 1~~ done |
| Kedai Kampus: phone on instalment → **Kos Sebenar before confirming** | ✅ Fixed by Danish (`8064a40`, re-tested 8 Nov): RM110.00 a month, RM1,320.00 total, RM120.00 true cost, about 18% a year | ~~REQ 2~~ done |
| Matlamat goal bar in Dompet | ✅ With Akmal's `#/demo/pitch` (`557e4a5`): "Matlamat: Dana kecemasan RM200 / RM300" (screenshot `img/dompet-goal.png`) | ~~REQ 3~~ done |
| Tonton explainer in Kad Ilmu | ⏳ Placeholder ("Akan datang") | Wafi W7 |
| Papan Markah, Kad Keputusan | ⏳ Not built yet | Wafi W5, W6 |

Both content fixes were tried in the test branch and work:
- With REQ 1, Semak → "Buka Kalkulator" → Semak Pulangan shows **2% a day = 137,640.8% a year** and the
  **Terlalu Lumayan** flag.
- With REQ 2, "Beli ansuran" → Kos Sebenar shows **RM110.00 a month, RM1,320.00 in total, RM120.00 true cost**
  (flat 10% for 12 months, about 18% a year in real terms).

## REQs to post in the team chat

**REQ 1 (Danish):** `content/feed.json` + `content/calc-presets.json`. Add a Semak Pulangan preset and point post
p004 at it, so the demo's "2% a day" Semak opens the Kalkulator with the red flag (SRS 5.2b, W2's Playwright check).
Tested locally; passes `npm run check:content`:
```json
{ "id": "robot2h", "tab": "pulangan",
  "label": { "ms": "Janji robot dagangan: 2% sehari", "en": "Trading-robot promise: 2% a day" },
  "inputs": { "promised": 2, "period": "hari" } }
```
and in `feed.json`, post `p004`: `"semak": { "calc": "robot2h" }`.

**REQ 2 (Danish, C3):** `content/calc-presets.json`. Add the `kedai-telefon` preset that Kedai's "Beli ansuran"
opens (`kedaiFlow.ts` builds `kedai-<itemId>`); without it Kos Sebenar never shows. Numbers match `balance.ts`
(price RM1,200; RM110 × 12):
```json
{ "id": "kedai-telefon", "tab": "kos",
  "label": { "ms": "Kedai Kampus: telefon RM1,200, RM110 × 12 bulan", "en": "Campus shop: RM1,200 phone, RM110 × 12 months" },
  "inputs": { "amount": 1200, "flat": 10, "months": 12 } }
```

**REQ 3 (Akmal):** `app/src/shell/demo.ts`. A demo scene for the pitch (e.g. `#/demo/pitch`): week 5, budget set, a
goal picked (Matlamat), Duit left for Kedai, Kedai and Suapan untouched, so the whole demo runs from one state on both
phones. Today `#/demo/kelas` has no budget and no goal.

**Note for Akmal (wording, low priority):** the Kalkulator's banner says "Nombor dari perbualan" (numbers from the chat)
when it is opened from a Suapan post or Kedai item. "Nombor dari hantaran / kedai" would read better.
