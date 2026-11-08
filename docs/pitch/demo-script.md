# Celik: live demo script (18 Nov pitch, D7)

**Length: 3:00.** Follows docs/SRS.md 5.2b. Akmal drives the phone (on the projector), Aimar narrates, Wafi holds the
backup phone with the same state, Danish answers fact questions. Draft: rehearse it twice (Mon 16 and Tue 17 Nov)
and fix the timings.

## Setup (before going on stage)
- Two phones on the **deployed link**, opened once online, then **airplane mode on** (status bar visible on the projector).
- DEMO watermark on. Notifications off.
- Sound: the app plays music and tap sounds (on by default). Decide in rehearsal 1: off (Settings) if the hall speaker is loud or Aimar is narrating over it; otherwise phone volume low.
- Main phone state: open **`<deployed link>/#/demo/pitch`** on both phones (Akmal, 8 Nov). It opens the home screen
  at week 5 with RM1,120 Duit, the emergency-fund goal at RM200 / RM300, four chats played, and Kedai and Suapan untouched.
  Open it again between rehearsals to reset.
- **Dry run status:** docs/pitch/demo-check.md. Re-run it after each evening merge.
- Backup: the offline screen recording Akmal makes on Tue 17 Nov (A9), ready to play if a phone fails.

## Script

| Time | Screen | What to do | What to say (EN; BM version below) |
| --- | --- | --- | --- |
| 0:00-0:15 | Home screen of the fake phone | Point at the status bar | "Everything you'll see runs in airplane mode. No internet, no account, no data collected." |
| 0:15-0:50 | **Suapan** feed | Scroll to the "2% a day" post; tap **Semak**; Semak Pulangan opens with the post's numbers; the **Terlalu Lumayan** red flag appears | "This is Suapan, a feed like the ones students scroll every day. A finfluencer promises 2% a day. Before trusting it, students tap Semak. 2% a day is over a thousand percent a year: no real investment does that." |
| 0:50-1:20 | **Kedai Kampus** | Pick the phone on instalment; **Kos Sebenar** shows the total cost before Confirm; cancel or buy | "Every ringgit in the game is the semester's own money. Buying a phone on instalment? Celik shows the total cost first, before you sign." |
| 1:20-1:40 | **Dompet** | Show the Matlamat goal bar | "At week zero each player picks one goal, like an emergency fund. The bar tracks it all semester." |
| 1:40-2:05 | **Kad Ilmu → Tonton** | Open Kuasa Kompaun, play 3-4 frames of the explainer | "Short animated explainers inside the cards. No video files, so it stays small and offline." |
| 2:05-2:35 | **Report card → Papan Markah → Kad Keputusan** | Show the grade, then the ranking against fictional classmates, then the share card | "At the end: a report card for money skills and scam immunity, a ranking against classmates without anyone's real data, and a card to share." |
| 2:35-3:00 | Slide: before/after result | Switch to the slide | "We tested it with [n] students. Their scores went from [before] to [after] out of 12. [One honest limitation.] Free for every student; universities license it for orientation week." |

## BM narration (draft, Danish to read)

1. "Semua yang anda lihat berjalan dalam mod pesawat. Tiada internet, tiada akaun, tiada data dikumpul."
2. "Ini Suapan, suapan seperti yang pelajar tatal setiap hari. Seorang pempengaruh janji 2% sehari. Sebelum percaya, pelajar tekan Semak. 2% sehari ialah lebih seribu peratus setahun: tiada pelaburan sebenar yang begitu."
3. "Setiap ringgit dalam permainan ialah duit semester itu sendiri. Beli telefon secara ansuran? Celik tunjuk jumlah kos dulu, sebelum kamu setuju."
4. "Pada minggu kosong, setiap pemain pilih satu matlamat, contohnya dana kecemasan. Bar ini menjejakinya sepanjang semester."
5. "Penerangan animasi ringkas dalam kad. Tiada fail video, jadi ia kekal kecil dan luar talian."
6. "Di hujung semester: kad laporan untuk kemahiran duit dan imuniti scam, kedudukan berbanding rakan sekelas tanpa data sebenar sesiapa, dan kad untuk dikongsi."
7. "Kami uji dengan [n] pelajar. Skor mereka naik daripada [sebelum] kepada [selepas] daripada 12. [Satu had yang jujur.] Percuma untuk setiap pelajar; universiti melesenkannya untuk minggu orientasi."

## Maths behind the lines (so nobody gets caught out)
- 2% a day compounded over 365 days: 1.02^365 − 1 ≈ 1,377 times the money, i.e. about 137,700% a year, so "over a
  thousand percent" is safe (it is far more). Same formula as `yearlyFromPeriodic` in `app/src/engine/finance.ts`.
- The phone in Kedai Kampus: RM1,200, or RM110 × 12 = RM1,320 on instalment, so the true cost is RM120 (a flat 10%,
  about 18% a year in real terms). Read the figures off the screen anyway, in case `balance.ts` changes.
- The Suapan post is `p004` (Abang Duit Pantas, "Saya buat 2% sehari dengan robot dagangan"); Semak Pulangan shows
  137,640.8% a year.

## If something breaks
- A screen freezes: say "let me show you the recording", switch to the backup video at the same timestamp.
- The projector fails: hold the phone up and keep talking; the script still works in 3:00.
