# Entry form answers (draft)

Character counts are checked with the command at the bottom. BM wording still needs a native-speaker read (Danish).
Facts come from research/problem-statement.md; check them against docs/verification-log.md once it exists.

- **Category:** IPT
- **Title (max 80 characters):**
  - BM: Celik: Permainan Telefon Simulasi Semester untuk Bijak Duit dan Kebal Scam
  - EN: Celik: A Semester Phone-Sim Game to Be Money-Smart and Scam-Proof
- **Video link (max 5 min, "Anyone with the link"):** [TO FILL after upload]

## Problem (max 600 characters)

EN (from research/problem-statement.md):

> Malaysians aged 19-30 score below the national average in BNM's financial literacy index, and only 18.6% of EPF members aged 18-30 have the basic savings for their age. Young Malaysians invest just 8% of their income. Not knowing what a realistic return looks like, they cannot tell real investments from fake schemes, now Malaysia's costliest scam (RM1.46 billion lost in 2025). First-year IPT students, managing money alone for the first time, need a safe place to practise budgeting, investing and spotting fraud.

BM:

> Rakyat Malaysia berumur 19-30 mendapat skor di bawah purata nasional dalam indeks celik kewangan BNM, dan hanya 18.6% ahli KWSP berumur 18-30 mempunyai simpanan asas mengikut umur. Golongan muda hanya melabur 8% daripada pendapatan. Tanpa tahu rupa pulangan yang realistik, mereka sukar membezakan pelaburan sebenar dengan skim palsu, kini scam paling mahal di Malaysia (RM1.46 bilion hilang pada 2025). Pelajar IPT tahun pertama, yang mengurus duit sendiri buat kali pertama, perlukan tempat selamat untuk berlatih bajet, melabur dan mengesan penipuan.

## Solution and technology (max 600 characters)

EN:

> Celik is a phone-simulator game: students live one university semester of money choices on a fake phone. They split a budget, build an emergency fund, see their first pay grow in Mesin Masa, and face scams as the high-stakes events: job scams, mule-account offers, fake investments and fake police calls. The Kalkulator shows why a promised 30% a week is impossible. A 2-minute Cek Harian keeps skills fresh, and Mod Kelas runs orientation battles from one screen. A React web app that works fully offline, collects no data and uses fictional brands only. Free for students.

BM:

> Celik ialah permainan simulasi telefon: pelajar melalui satu semester universiti penuh keputusan duit pada telefon olok-olok. Mereka bahagikan bajet, bina dana kecemasan, lihat gaji pertama berkembang dalam Mesin Masa, dan berdepan scam sebagai detik genting: kerja palsu, sewa akaun keldai, pelaburan palsu dan panggilan polis palsu. Kalkulator menunjukkan kenapa janji 30% seminggu mustahil. Cek Harian 2 minit menyegarkan ingatan, dan Mod Kelas menjalankan pertandingan orientasi dari satu skrin. Aplikasi web React luar talian, tiada data dikumpul, jenama rekaan sahaja. Percuma untuk pelajar.

## Check the counts

```bash
node -e "const t=require('fs').readFileSync('submission/form-answers.md','utf8');for(const m of t.matchAll(/^> (.+)$/gm))console.log(m[1].length, m[1].slice(0,40));for(const m of t.matchAll(/^  - (BM|EN): (.+)$/gm))console.log('title',m[1],m[2].length)"
```
