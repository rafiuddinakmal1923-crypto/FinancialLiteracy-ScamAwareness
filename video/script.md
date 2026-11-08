# Celik: competition video script (9 Nov entry)

Target length **4:30** (hard limit 5:00). Round 1 is judged on this video only, so every rubric item must be visible:
originality (25%), real problem + ease of use (25%), impact + feasibility (25%), presentation (25%). (Rubric as
recorded in the team's MakmalPop script; check it against the organiser's site.)

Narration in Bahasa Melayu with English subtitles. The BM lines are a first draft: have Danish (native speaker) read
them aloud before recording. Shots follow the acceptance checklist in docs/SRS.md 5.2.

## Before filming
- **Airplane mode on, on camera, before anything else, and the status bar visible the whole time** (offline proof).
- **DEMO watermark on** (Settings → Tanda air DEMO). Every bank or portal screen must show the SIMULASI banner.
- **Sound:** the app now plays music and tap sounds (on by default). Turn it **off** in Settings before screen-recording so the narration is clean, or record it on purpose and keep it low under the voice. Decide once and use the same for every shot.
- Film from a **local build of `main`** (`npm run build` + preview), opened once online, then switch to airplane mode. The Netlify link is a fallback only if it serves the same commit as `main` (Akmal checks; it did on 8 Nov, D47). An older live build has old legal lines.
- Demo shortcuts (`#/demo/<scene>`) put the game in a known state: `job`, `mule`, `report`, `kelas`, `kalkulator`.
  Open each one before its shot so you don't play 12 weeks on camera.
- Screen-record at 1080p on the phone; film the projector (Mod Kelas) with a second phone.
- Team members only on camera, no other students' faces or names. No real bank, telco or app logos anywhere in frame.
- Turn off notifications so no real message pops up during the recording.

## Shot list

| Time | Rubric | Shot | Narration (BM) | Subtitle (EN) |
| --- | --- | --- | --- | --- |
| 0:00-0:15 | Problem | Black screen, white text one line at a time: "RM1.46 bilion", "scam pelaburan palsu, 2025" | "Tahun lepas, rakyat Malaysia hilang RM1.46 bilion kepada scam pelaburan palsu. Itu scam paling mahal di negara kita." | "Last year Malaysians lost RM1.46 billion to fake investment scams, the costliest scam in the country." |
| 0:15-0:35 | Problem | Evidence cards with the source under each (research/problem-statement.md): ages 19-30 below the national literacy average; 18.6% with basic savings; youth invest 8% of income | "Golongan muda kita di bawah purata nasional dalam celik kewangan. Tanpa tahu rupa pulangan yang realistik, susah nak bezakan pelaburan sebenar dengan skim palsu." | "Young Malaysians score below the national average in financial literacy. Without knowing what a realistic return looks like, it's hard to tell a real investment from a fake one." |
| 0:35-0:50 | Problem | A team member (back or hands only) with a phone; text: "Pelajar tahun 1: PTPTN, akaun bank pertama" | "Pelajar tahun pertama mengurus duit sendiri buat kali pertama, dan di sinilah sindiket mencari mangsa." | "First-year students manage money alone for the first time, and that's where syndicates look for victims." |
| 0:50-1:05 | Ease of use | Hand switches **airplane mode on**; opens Celik; splash, then the home screen of the fake phone | "Inilah Celik. Satu semester universiti, dalam telefon olok-olok. Berfungsi sepenuhnya tanpa internet." | "This is Celik: one university semester inside a pretend phone. It works fully offline." |
| 1:05-1:25 | Originality | Dompet week-0 budget split (needs / wants / savings), Simpanan set | "Minggu pertama: bahagikan duit. Dana kecemasan yang kamu bina sekarang menentukan betapa tergodanya kamu nanti." | "Week one: split your money. The emergency fund you build now decides how tempted you'll be later." |
| 1:25-1:45 | Originality | Kalkulator → Mesin Masa: RM50 a month, line to age 30 and 55. **Change the end age to 55 on camera** | "Gaji pertama? Mesin Masa tunjuk apa jadi pada RM50 sebulan bila umur 30, dan 55. Kadar contoh sahaja." | "First pay? Mesin Masa shows what RM50 a month becomes by 30 and by 55. Example rate only." |
| 1:45-2:20 | Originality | kawan_labur (fictional licensed unit trust: fees, risk, how to check a licence) then `#/demo/kalkulator` or crypto_naga: "Kira dulu" opens Semak Pulangan; 30% a week → **Terlalu Lumayan** red flag. **Wait for the XP toast to clear before framing the flag** | "Dua tawaran pelaburan. Satu berlesen, ada risiko dan yuran. Satu lagi janji 30% seminggu. Tekan Kira dulu: itu berjuta-juta peratus setahun. Mustahil." | "Two investment offers. One is licensed, with risk and fees. The other promises 30% a week. Tap Kira dulu: that's millions of percent a year. Impossible." |
| 2:20-2:55 | Real problem | `#/demo/mule`: senior offers RM1,500 to rent the bank account; play the wrong choice; money-chain animation; account frozen; then Cuba lagi | "Senior tawar RM1,500 untuk 'pinjam' akaun bank. Nampak mudah. Tapi akaun kamu jadi laluan duit scam, dan kamu yang disiasat. Dalam Celik, kamu boleh silap dengan selamat, dan cuba lagi." | "A senior offers RM1,500 to 'borrow' your account. Looks easy. But your account becomes a route for scam money, and you're the one investigated. In Celik you can make the mistake safely, and try again." |
| 2:55-3:10 | Real problem | Kos Sebenar on the BayarNanti offer: example flat 18% → about 31.7% a year (verification-log V24) | "Bayar nanti? Kos Sebenar dedahkan kadar sebenar." | "Pay later? Kos Sebenar reveals the real rate." |
| 3:10-3:30 | Impact | Cek Harian: 2 cards, streak flame, one explanation | "Ilmu cepat pudar. Jadi Celik ada Cek Harian: dua minit sehari, dengan streak." | "Learning fades fast, so Celik has Cek Harian: two minutes a day, with a streak." |
| 3:30-3:45 | Impact | Latihan: 997 drill and the Semak Mule simulation with the real-portal button | "Dan Celik latih tindakan sebenar: telefon NSRC 997 dan semak akaun di Semak Mule." | "And Celik trains the real actions: call NSRC 997 and check an account on Semak Mule." |
| 3:45-4:05 | Impact + feasibility | Projector: `#/demo/kelas`, 2 teams, one round, scoreboard | "Untuk minggu orientasi, Mod Kelas jalankan pertandingan seluruh dewan dari satu skrin." | "For orientation week, Mod Kelas runs a whole hall's battle from one screen." |
| 4:05-4:20 | Impact | `#/demo/report`: report card with Celik Kewangan and Imuniti, grade | "Di hujung semester: kad laporan untuk celik kewangan dan imuniti scam." | "At the end of the semester: a report card for financial literacy and scam immunity." |
| 4:20-4:30 | Feasibility + presentation | Airplane mode still on; text: "Percuma untuk pelajar. Tiada data dikumpul. Luar talian." then logo and "Bijak duit, kebal scam" | "Percuma untuk setiap pelajar. Celik: bijak duit, kebal scam." | "Free for every student. Celik: money-smart, scam-proof." |

## After filming
- Cut to 4:30 or less; check the subtitles match the narration.
- Upload (YouTube unlisted or Google Drive, "Anyone with the link"), open the link in a private window to check it.
- Paste the link into `submission/form-answers.md` and the entry form before **9 Nov, 11.59 pm**.

## Checklist (SRS 5.2), tick when the shot is in the cut
- [ ] Week-0 budget split and emergency fund
- [ ] Mesin Masa: RM50 a month by age 30 and 55
- [ ] kawan_labur, then crypto_naga with Kira dulu → Semak Pulangan
- [ ] Mule-account scenario with the money-chain animation
- [ ] Kos Sebenar on the BayarNanti offer
- [ ] Cek Harian with streak and explanations
- [ ] 997 drill and Semak Mule simulation
- [ ] Mod Kelas with 2 teams on a projector
- [ ] Report card with Celik Kewangan and Imuniti
- [ ] Airplane mode visible throughout
