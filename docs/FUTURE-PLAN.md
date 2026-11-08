# Celik: future plan (written 8 Nov 2026)

What to build after the 9 Nov video, split by when. Every item must keep the hard rules in CLAUDE.md: fictional
brands, no real data, offline first, no backend, BM first, content as data. Where a wish clashes with a rule, the
plan says so and gives the version that fits. Estimates are for one builder with Claude Code.

## 0. Found on the phone (8 Nov), fix before 18 Nov

Done 8 Nov (commit after `6ed494e`): F1, F2, F3, plus the save kept with `navigator.storage.persist` and Papan
classmates that follow the week with fixed ups and downs.

| # | What you see | Why | Fix | Owner | Time |
| --- | --- | --- | --- | --- | --- |
| F1 | Feed, Shop and Ranks tiles are plain grey squares; the first six are coloured | The first six use drawn SVG icons (`assets/app-*.svg`); W1-W5 used stock line icons on a slate square (`APP_TILES` in `app/src/shell/HomeScreen.tsx`) | Draw 3 SVG icons in the same style: Suapan coral (news), Kedai teal (shop front), Papan gold (trophy). Settings stays grey on purpose | Akmal (shell), art by Wafi | 1-2 h |
| F2 | "No video advice anywhere" | By D41, Tonton is not video: 2 picture-frame explainers inside Kad Ilmu (Cards → Kad Ilmu → Kuasa Kompaun or Kos Hutang). Nothing on the home screen points to it | Add a "Tonton" chip on the Kad Ilmu cards that have an explainer, plus one line in onboarding tips | Wafi | 1 h |
| F3 | Settings has a Sound switch, but nothing plays | The setting was saved for later; no sound code exists yet | See section 1. Until then, hide the switch or label it "Akan datang" | Akmal | 15 min |

## 1. Sound: interaction sounds, background, music

Goal: the game feels alive without breaking offline play, the 8 MB budget or classroom use (a hall of 40 phones).

- **Sound set (about 12 short sounds, total under 300 KB, .ogg + .m4a fallback, precached by the PWA):**
  tap, coin in, coin out, message ping, notification, correct, wrong (soft, never mocking: rule 4), streak +1,
  week end, level up, alarm for scam pressure, freeze (account frozen).
- **Music:** one calm loop for home (60-90 s, under 600 KB), one tense loop for scam scenes; it fades between them.
  Royalty-free with a licence that allows school use, or composed by the team. No real songs.
- **Engine:** one `app/src/engine/sound.ts` using Web Audio (`AudioContext`, decoded once). Starts only after
  the first tap (browser rule). Respects: the Sound switch, separate "Muzik" and "Kesan bunyi" switches, the
  phone's silent mode where the browser allows, and Reduced motion (no alarm sound).
- **Mod Kelas:** sound only on the projector screen, not team phones.
- **Content as data:** scenarios can ask for a sound with an ink tag, e.g. `# sfx:ping`; check:content rejects unknown names.
- **Tests:** unit test that every tag maps to a file; a Playwright check that nothing plays before the first tap.
- **Time:** engine + switches 1 day; sounds and music sourcing 1-2 days; tags in 11 scenarios half a day.

## 2. Login / sign-up

**Clash:** real accounts need a server and collect personal data (rules 2 and 5). A normal email/password sign-up
is therefore out for this version. What the wish is really about, and how to give it safely:

| Need | Safe version | Time |
| --- | --- | --- |
| "My progress is mine" on a shared phone or lab PC | **Local profiles:** up to 4 players on one device, each a nickname (no real names, filtered list of suggestions) and a drawn avatar. Saves are kept per profile in IndexedDB. No password; optional 4-digit picture PIN that never leaves the device | 1.5 days |
| Move progress to a new phone | **Save code:** export the save as a QR code or short text, import on the other phone. Works offline, no server | 1 day |
| Teacher sees the class | **Class code for Mod Kelas:** the projector shows a code, phones join over the local session only; results stay on the teacher's device and can be exported as CSV with nicknames only | 2-3 days |
| Real cloud accounts (later, only with a school partner) | Needs a decision record, a privacy notice, parental consent for under-18s, a data-protection review (PDPA), and hosting. Not before the competition ends | weeks |

## 3. Asset details (what you own)

Today Kedai records purchases (`purchases` in `app/src/state/game.ts`) but there is no place to see them.

- **"Barang Saya" (My stuff) screen,** opened from Dompet and from Kedai: a grid of owned items with the drawn icon.
- **Item detail sheet:** name, price paid, week bought, which pot paid (Keperluan or Kehendak), "need or want" label,
  and what it did (e.g. the laptop raises study score, the bicycle saves RM10 a week on transport).
- **Value over time:** electronics lose value each week (example rate in `balance.ts`, labelled "contoh"); shows
  "bought RM1,200, worth about RM900 now" to teach depreciation. All maths in `finance.ts` with unit tests (rule 12).
- **Sell second-hand:** sell an item back at its current value. This links to the buku_terpakai marketplace scenario:
  a fake buyer who "overpays" by transfer is a scam lesson.
- **Net worth:** show owned items as a separate line on the report card ("Barang"), but keep net worth = Duit + Labur
  so the existing numbers and tests don't change. Decide in a new D-row if items should count.
- **Time:** screen + sheet 1 day; depreciation + sell 1 day; report card line half a day.

## 4. Other ideas worth doing

| Idea | Why | Rule check | Time |
| --- | --- | --- | --- |
| Achievements / badges (e.g. "Dana kecemasan penuh", "3 scam dielak") | Reason to replay; shows on Kad Keputusan | Fine | 1 day |
| Second semester (new scenarios: car loan, first job offer, takaful, family asking for a loan) | Longer play, more topics | Content only (rule 7) | 2-3 days content |
| Adaptive order (already a stretch in SDS 5.3) | Players who fall for mule scams see more of that tactic | Fine | 1-2 days |
| Daily challenge push reminders | Keeps Cek Harian streaks | Local notifications only, no server | 1 day |
| Accessibility pass: screen-reader labels, bigger text option, high-contrast theme | Wider reach, judges notice | Fine | 1 day |
| Real explainer videos | Better for TikTok/IG | **Marketing only, not in the app** (D41: size, internet, real-site risk) | Aimar |
| Teacher pack: printable lesson plan + worksheet per scenario | Easier for schools to adopt | Fine, docs only | 1-2 days |
| More languages (Chinese, Tamil) | Malaysia is multilingual | Fine, i18n files | per language 2 days + native review |

## Suggested order

1. **By 18 Nov (pitch):** F1, F2, F3. They are small and visible to judges.
2. **After the competition, first:** sound (1), Barang Saya (3), local profiles and save code (2, safe version).
3. **Then:** achievements, second semester, teacher pack, accessibility.
4. **Only with a school partner:** cloud accounts, class dashboards online.

Each item becomes an IMPLEMENTATION-PLAN task with an owner (D43) and, where it changes a rule or a number, a new
row in DECISIONS.md first.
