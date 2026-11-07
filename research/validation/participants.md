# Validation test: participants (D1)

Before/after test from docs/SRS.md 5.3: 12 questions (6 money, 6 scam-spotting), taken before and after one play
session. The questions are in `test.md` (D3); the results go in `results.md` (D4).

**Privacy rule (hard rule 2):** this file holds counts and times only. No names, matric numbers, phone numbers,
emails or photos, here or in any other file in the repo. Contact details stay in the booker's own phone.

## Target

| Item | Plan |
| --- | --- |
| Who | UTP undergraduates, any programme and year (first-years preferred) |
| How many | 10-20 (aim for 15 so that a few no-shows still leave at least 10) |
| When | Sat 14 Nov 2026 |
| How long | About 40 minutes each: 5 min pre-test, 25 min play, 5 min post-test, 5 min spare |
| Device | Their own phone, on the dev build (A9 deploy comes after this test) |
| Reward | [TO FILL: e.g. snacks; nothing that needs their personal details] |

## Bookings

Update the counts as people confirm. "Group" means students who play at the same time in one room.

| Slot (Sat 14 Nov) | Place | Confirmed | Showed up | Notes |
| --- | --- | --- | --- | --- |
| [TO FILL: e.g. 10:00-10:40] | [TO FILL] | 0 | - | |
| [TO FILL: e.g. 11:00-11:40] | [TO FILL] | 0 | - | |
| [TO FILL: e.g. 14:00-14:40] | [TO FILL] | 0 | - | |
| **Total** | | **0** | **-** | Goal: 15 confirmed |

Mix (counts only, if people offer it; never required):

| | Count |
| --- | --- |
| First-year | 0 |
| Other years | 0 |

## Booking message (send from your own phone)

**BM**

> Salam! Kami pasukan pelajar yang membina Celik, permainan telefon tentang urus duit dan elak scam, untuk
> pertandingan inovasi. Boleh bantu kami uji? Sabtu 14 Nov, lebih kurang 40 minit: kuiz pendek 12 soalan,
> main 25 minit, kemudian kuiz yang sama sekali lagi. Tiada nama atau maklumat peribadi dikumpul; markah sahaja.
> [Ganjaran: TO FILL]. Balas dengan slot pilihan kamu: [slot 1] / [slot 2] / [slot 3]. Terima kasih!

**EN**

> Hi! We're a student team building Celik, a phone game about managing money and avoiding scams, for an innovation
> competition. Could you help us test it? Saturday 14 Nov, about 40 minutes: a short 12-question quiz, 25 minutes of
> play, then the same quiz again. No names or personal details are collected, only scores. [Reward: TO FILL].
> Reply with the slot you prefer: [slot 1] / [slot 2] / [slot 3]. Thank you!

## On the day (checklist)

- [ ] Dev build opens on a test phone; Settings has the DEMO watermark on
- [ ] Printed or on-screen pre-test and post-test (from `test.md`), each with a random code instead of a name
- [ ] Tell each person: it is a game test, not an exam; they can stop at any time; no personal data is kept
- [ ] Record only the code, pre-test score and post-test score in `results.md`
- [ ] Note anything that went wrong (a crash, a confusing screen) as a count, for the honest limitation in D4
