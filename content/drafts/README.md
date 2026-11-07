# Drafts

Content that is written and checked but not yet live.

- `raya_duit.ink` and `en/raya_duit.ink`: Raya event pack (C8, FR-87). It compiles and passes the content scan
  when placed in `content/scenarios/` (11 scenarios, `check:content` OK). It stays here because several tests assume
  exactly 10 scenarios (`engine/content.test.ts`, the Red Flag card count in `engine/cards.test.ts` and `KadBook.test.tsx`).
  To go live: Akmal relaxes those tests and slots it in (A10); Danish then moves both files into `content/scenarios/`.
