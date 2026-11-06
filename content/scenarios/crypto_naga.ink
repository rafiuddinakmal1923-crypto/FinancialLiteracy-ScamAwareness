# id:crypto_naga
# type:scam
# family:investment
# tactics:greed,social,urgency
# concepts:risiko,semak
# contact:Group CryptoNaga
# hint:Pelaburan sah tak boleh janji 30% seminggu. Kira dulu berapa setahun, dan ingat ramai ahli pun tak bermakna ia sah.
# apa_patut:Semak syarikat atau platform dalam senarai pemegang lesen Suruhanjaya Sekuriti (SC) dan Investor Alert List SC sebelum bagi duit.
# apa_patut:Jangan percaya pulangan tetap yang tinggi, tangkapan skrin keuntungan atau desakan "slot tutup". Semua itu mudah direka.
# apa_patut:Kalau dah terbayar, simpan bukti, beritahu bank kamu dan telefon NSRC 997 dengan segera.

// Scenario 5 (W8): fake crypto group. Greed (30% a week), social proof (500 students), urgency (slot closes tonight).
// The Semak Pulangan calculator shows why 30% a week is impossible; the player can still choose to pay, which is the point.
// REVIEW: Telegram-style group with a hype member ("Syaz") planted by the admin; check against reported campus investment-group scams.
Admin Naga: Selamat datang ke CryptoNaga VIP 🐉 Adik kena add oleh Syaz kan?
Syaz: Haah bang! Aku dah masuk minggu lepas 🔥
Admin Naga menghantar tiga tangkapan skrin "keuntungan" ahli.
Admin Naga: Sistem AI kami bagi 30% seminggu, confirm! Modal RM500 boleh jadi RM650 hujung minggu ni 💰 # flag:greed:30% seminggu
Admin Naga: Setakat ni 500 pelajar dah join, semua dah untung! Adik jangan ketinggalan. # flag:social:500 pelajar dah join
Admin Naga: Cepat dik, slot tutup malam ni pukul 12! # flag:urgency:slot tutup malam ni
* [Wah, 30% seminggu? Macam mana dia buat?] -> tanya
* [Kira dulu berapa setahun] -> kira
* [Tak minat. Saya keluar group.] -> keluar

=== tanya ===
// REVIEW: the vague "AI bot" explanation and the "modal dijamin" claim are typical of these pitches.
Admin Naga: Rahsia dia bot AI trading. Modal dijamin selamat, kami tak pernah rugi 😎
Syaz: Betul tu! Minggu lepas aku keluarkan RM200, masuk terus.
* [Kira dulu berapa setahun] -> kira
* [Ok, saya deposit RM500 sekarang.] -> deposit
* [Hmm, tak apa. Saya keluar.] -> keluar

=== kira ===
Kamu buka Kalkulator dan masukkan janji mereka, 30% setiap minggu. # ui:calc:pulangan:naga30w
Kamu perasan Kalkulator tanda janji itu Terlalu Lumayan. Pulangan setahun daripadanya jauh melebihi apa-apa yang sah boleh jamin.
Admin Naga: Dah kira? Jangan fikir panjang sangat, nanti slot habis 😅
* [Walaupun macam tu, saya deposit RM500 jugak.] -> deposit
* [Kalkulator kata mustahil. Saya tak masuk.] -> tolak

=== deposit ===
Admin Naga: Mantap dik! Pindah RM500 ke dompet CryptoNaga ya.
// REVIEW: the "tax/withdrawal fee first" stall and the group vanishing are the usual endgame of these schemes.
Kamu pindah RM500. Papan pemuka tunjuk keuntungan naik, tapi bila kamu cuba keluarkan, mereka minta "yuran cukai" dulu. Kemudian admin sekat kamu dan group dipadam. # effect:duit:-500 # outcome:scammed
-> END

=== tolak ===
Admin Naga: Alaa rugi la dik, yang lain semua dah masuk.
Kamu tak bayar apa-apa, keluar daripada group dan beritahu kawan-kawan supaya kira dulu sebelum percaya janji macam tu. # outcome:safe
-> END

=== keluar ===
Admin Naga: Okay la, tapi slot tinggal sikit je tau.
Kamu keluar daripada group dan sekat nombor admin. Duit kamu kekal sama. # outcome:safe
-> END
