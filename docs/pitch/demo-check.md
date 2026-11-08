# Demo dry run (D7), 8 Nov 2026

Walked the 18 Nov demo path (docs/pitch/demo-script.md, SRS 5.2b) on the dev server at 412×915, on `main`
(`dbc066b`) plus `lane/wafi` (`de7d335`, W2-W4, not merged yet), merged only in a local test branch that was then
deleted. Re-run this after every evening merge until the demo passes end to end.

**Latest run (8 Nov, `main` `557e4a5` + `lane/wafi` `abea6f8`, from `#/demo/pitch`):** 8 of 9 checks pass. Home at week 5,
Semak → 137,640.8% + Terlalu Lumayan, Kedai with RM1,120 Duit, Kos Sebenar RM120 / RM1,320, goal bar, report card.
Only Tonton failed (still a placeholder then; now done, see below).

**Re-run on the real `main` (`ec48ae6`, 8 Nov, after Akmal merged `lane/wafi`):** same result, 8 of 9 pass with no
test branch; `npm run check` 767 tests green.

**Current status (8 Nov, `main` `2c5ccaa`: Wafi's W5-W7 merged, Akmal's A8 lazy-loading, Papan Markah opens from the
report card):** `npm run check` 776 tests green; dry run 8 of 9 from `#/demo/pitch`; both explainers still play all 15
frames (checked from the `report` preset). Every demo step works. The one gap left: in `#/demo/pitch`
the Kuasa Kompaun card is locked, so the Tonton step needs REQ 4 (Akmal). Then re-run once on the deployed link (16 Nov).

| Demo step | Result | Blocker |
| --- | --- | --- |
| Suapan feed shows the "2% a day" post (`p004`, Abang Duit Pantas) | ✅ Works (W1 on `main`; Percaya/Semak/Lapor from W2) | - |
| Semak → debrief sheet ("Ini hype: sah, tetapi mengelirukan", +10 XP) | ✅ Works | - |
| Semak → **Semak Pulangan with Terlalu Lumayan** | ✅ Fixed by Danish (`8064a40`, re-tested 8 Nov): 137,640.8% a year + Terlalu Lumayan. Reaches the live app after Akmal merges `lane/danish` and `lane/wafi` | ~~REQ 1~~ done |
| Kedai Kampus: phone on instalment → **Kos Sebenar before confirming** | ✅ Fixed by Danish (`8064a40`, re-tested 8 Nov): RM110.00 a month, RM1,320.00 total, RM120.00 true cost, about 18% a year | ~~REQ 2~~ done |
| Matlamat goal bar in Dompet | ✅ With Akmal's `#/demo/pitch` (`557e4a5`): "Matlamat: Dana kecemasan RM200 / RM300" (screenshot `img/dompet-goal.png`) | ~~REQ 3~~ done |
| Tonton explainer in Kad Ilmu | ✅ Wafi's W7 (`189a57c`): both explainers play, all 15 frames in order with the exact BM captions, also **offline** on a production build (service worker in control, network cut). Frames are inlined, so they need no network. ⚠️ In `#/demo/pitch` the Kuasa Kompaun card is not earned, so it is locked and the explainer can't be shown | **REQ 4** (Akmal) |
| Papan Markah | ✅ Wafi's W5: 10 rows, player highlighted (`img/papan.png`) | - |
| Kad Keputusan | ✅ Wafi's W6: downloads `celik-kad-keputusan.png`, 1080×1350, SIMULASI label and character name (`img/kad-keputusan.png`) | - |

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

**REQ 4 (Akmal):** `app/src/shell/demo.ts`, the `pitch` preset. Add `kadIlmu: ['bajet', 'kecemasan', 'kompaun']` (the
cards earned by the four chats it marks as played) so Kad Ilmu → Kuasa Kompaun opens with the Tonton explainer in the
demo. Today the card is locked in that state. Tested: with the `report` preset, which has `kompaun` earned, the
explainer plays.

**Note for Akmal (wording, low priority):** the Kalkulator's banner says "Nombor dari perbualan" (numbers from the chat)
when it is opened from a Suapan post or Kedai item. "Nombor dari hantaran / kedai" would read better.
