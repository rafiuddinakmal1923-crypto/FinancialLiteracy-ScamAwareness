# Explainer frames

Plain SVG frames for Tonton (D41), listed in `content/explainers.json`. No embedded fonts or images and no text in the art: captions live in the JSON in BM and EN. Six to eight frames per explainer, all explainers together under 150 KB. Owner: Aimar.

| Explainer | Frames | Story |
| --- | --- | --- |
| `kompaun` (Kuasa Kompaun) | 7 | RM50 a month from age 19 at an example 5% a year: savings vs returns, 10 years, age 55, starting at 19 vs 29, "example only, check the licence" |
| `hutang` (Kos Hutang) | 8 | RM1,000 phone on "pay later" at an example 10% flat a year: RM91.67 x 12 = RM1,100, flat rate on the full amount, about 18% effective, 24 months = RM1,200, late charges, save first |

The frames are generated, not hand-drawn: edit `build-frames.mjs`, then run `node assets/explainers/build-frames.mjs` from the repo root. Its maths mirrors `futureValue` and `loanCost` in `app/src/engine/finance.ts`; if you change a number, change the matching caption in `content/explainers.json`. Colours are the UI-SPEC tokens.
