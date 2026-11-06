# id:kerja_sambilan
# type:scam
# family:job
# tactics:greed,urgency,payfirst
# contact:Kak Mira (HR)
# number:011-0000 0123
# hint:Syarikat sebenar tak minta bayaran untuk mula kerja.
# apa_patut:Semak sendiri sama ada syarikat itu berdaftar sebelum setuju apa-apa.
# apa_patut:Jangan bayar yuran, top-up atau deposit untuk dapat kerja. Kerja sebenar bayar kamu, bukan sebaliknya.
# apa_patut:Kalau dah terbayar, telefon NSRC 997 dengan segera dan beritahu bank kamu.

// Scenario 1 (W1): kerja sambilan like & share. Consequence text is in the app's outcome templates, not here.
Kak Mira (HR): Salam dik 😊 Akak Mira, HR dari Bintang Digital Sdn Bhd.
// REVIEW: is "dapat nombor dari group kampus" a realistic opener for this scam in Malaysia?
Kak Mira (HR): Akak dapat nombor adik dari group kampus. Kami tengah cari student untuk kerja part-time online.
Kak Mira (HR): Kerja senang je, like & share post produk kat media sosial. Boleh dapat RM300 sehari! # flag:greed:RM300 sehari
Kak Mira (HR): Tak perlu pengalaman, buat dari bilik hostel pun boleh 👍
Kak Mira (HR): Tapi slot tinggal 3 je hari ni tau, ramai dah daftar. Nak akak simpan satu utk adik? # flag:urgency:slot tinggal 3 je hari ni
* [Minat! Macam mana nak mula?] -> mula
* [Syarikat apa ni? Boleh saya semak syarikat ni berdaftar?] -> tanya
* [Abaikan mesej ni] -> abaikan

=== mula ===
Kak Mira (HR): Ok bagus! Akak terangkan sistem dia ya.
Kak Mira (HR): Tugasan 1: like 3 post kedai online, screenshot, hantar sini. Siap terus dapat RM30.
// REVIEW: the "top-up then get it back with commission" mechanic; check wording against real reports.
Kak Mira (HR): Tugasan 2 pulak tugasan VIP. Adik kena top-up RM100 dulu, nanti dapat balik RM100 + komisen RM160 😍 # flag:payfirst:top-up RM100 dulu
Kak Mira (HR): Cepat sikit ya dik, tugasan VIP ni tutup pukul 6 petang. # flag:urgency:tutup pukul 6 petang
* [Ok, saya top-up RM100.]
    Kak Mira (HR): Terima kasih dik! Akak dah terima. Komisen tengah diproses.
    // REVIEW: second-ask amount and the "naik level" excuse.
    Kak Mira (HR): Alamak dik, sistem kata akaun adik masih level 1. Kena bayar RM300 untuk keluarkan komisen, baru boleh naik level 2. # flag:payfirst:RM300 untuk keluarkan komisen
    Kak Mira (HR): Kalau tak bayar, duit RM100 tadi tak boleh keluar tau.
    * * [Ok la, saya bayar RM300 lagi.]
        Kak Mira (HR): Dah terima. Tunggu sistem proses dalam 24 jam ya dik 🙏 # effect:duit:-400 # outcome:scammed
        -> END
    * * [Tak nak. Pulangkan RM100 saya.]
        Kak Mira (HR): Maaf dik, itu peraturan syarikat. Tak upgrade, duit tak boleh keluar. # effect:duit:-100 # outcome:scammed
        -> END
* [Kenapa kerja kena bayar dulu? Saya tak nak bayar apa-apa.]
    Kak Mira (HR): Alaa dik, nanti dapat balik la duit tu...
    Kak Mira (HR): Takpe la, ramai lagi nak slot ni. # outcome:safe
    -> END

=== tanya ===
// REVIEW: recruiter dodging the registration question; is this how real recruiters respond?
Kak Mira (HR): Eh tak payah semak la dik, kami syarikat online, pendaftaran tengah proses lagi 😅
Kak Mira (HR): Adik nak ke tak? Akak boleh bagi slot ni kat orang lain je.
* [Takpe kak, saya tak jadi. Terima kasih.]
    Kak Mira (HR): Ok, rugi la adik. Bye. # outcome:safe
    -> END

=== abaikan ===
Kak Mira (HR): Dik? Slot dah nak penuh ni 😢 # outcome:safe
-> END
