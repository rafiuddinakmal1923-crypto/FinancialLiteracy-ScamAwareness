# id:sewa_akaun
# type:scam
# family:mule
# tactics:greed,secrecy,social
# contact:Abang Zul
# number:011-0000 0456
# hint:Kalau duit orang lain masuk akaun kamu dan kamu pindahkan keluar, akaun kamu sedang digunakan sebagai akaun keldai.
# apa_patut:Jangan pinjam, sewa atau jual akaun bank kepada sesiapa, walaupun senior atau kawan rapat.
# apa_patut:Kalau duit yang kamu tak kenal masuk ke akaun, jangan pindahkan. Hubungi bank kamu melalui nombor rasmi di belakang kad.
# apa_patut:Kalau dah terlibat, berhenti segera, telefon talian 997 dan buat laporan di balai polis berhampiran.

VAR ui_ok = false

// Scenario 2 (W3): sewa akaun (mule). Yuran asrama due this Friday, Duit is tight. Consequence text is in the app.
// REVIEW: a senior from the same hostel block as the opener; check against real campus mule recruitment reports.
Abang Zul: Assalamualaikum dik. Ni Abang Zul, senior Kejuruteraan, blok C 👋
Abang Zul: Dengar cerita yuran asrama kena settle Jumaat ni kan? Ramai junior tengah sesak 😅
Abang Zul: Abang ada bisnes e-wallet kecik-kecik. Nak pinjam akaun BankKu adik sebulan je.
Abang Zul: Abang bayar RM1,500 sebulan. Duit masuk terus, tak payah buat apa pun 💸 # flag:greed:RM1,500
Abang Zul: Relax la, semua orang buat. Budak blok C ramai dah sewa kat abang. # flag:social:semua orang buat
Abang Zul: Tapi jangan cerita kat orang tau, nanti semua nak join 🤫 # flag:secrecy:jangan cerita kat orang
* [Serius RM1,500? Ok, macam mana?] -> minat
* [Kenapa abang tak guna akaun sendiri?] -> tanya
* [Tak nak la bang. Akaun saya, saya guna sendiri.] -> tolak

=== minat ===
Abang Zul: Senang je dik. Bagi abang nombor akaun BankKu adik.
// REVIEW: the "customer money in, pass it on, keep a cut" mechanic as described in mule-recruitment cases.
Abang Zul: Nanti duit customer abang masuk, adik pindahkan ke akaun kawan abang. Siap, tu je kerja dia.
* [Ok bang, ambil la nombor akaun saya.] -> serah
* [Kejap. Duit siapa sebenarnya ni?] -> tanya

=== serah ===
Abang Zul: Ngam! Abang dah masukkan RM1,500. Cek BankKu 😎 # effect:duit:+1500
Abang Zul: Sekarang pindah RM1,400 ke akaun kawan abang, Teratai Emas Enterprise. RM100 tu upah adik minggu ni.
// REVIEW: the push to transfer within minutes; real handlers rush the mule before the bank flags the money.
Abang Zul: Cepat sikit ya dik, customer tunggu. # ui:transfer:1400:Teratai Emas Enterprise
{ ui_ok:
    -> dah_pindah
- else:
    -> batal_pindah
}

=== dah_pindah ===
Abang Zul: Mantap dik! Kawan abang dah terima. Minggu depan ada lagi, standby 👍 # effect:duit:-1400
// REVIEW: a freeze two days later and the bank taking back the RM1,500 for the victim; check bank practice.
Notis BankKu. Akaun anda telah dibekukan kerana menerima wang yang dilaporkan dalam kes penipuan. RM1,500 itu disekat semasa siasatan. # effect:akaun:Disekat # effect:rekod:Disiasat # effect:duit:-1500
Mesej kepada Abang Zul tidak dihantar. Nombor ini telah menyekat kamu. # outcome:mule
-> END

=== batal_pindah ===
Abang Zul: Eh, kenapa batal?? Duit tu bukan duit adik la. Pindah cepat! 😠
* [Saya tak nak terlibat. Saya nak beritahu bank.]
    // REVIEW: telling the bank right away; the account is still frozen while they check the RM1,500 that came in.
    Kamu telefon BankKu dan ceritakan semuanya. Bank pulangkan RM1,500 itu kepada mangsa dan sekat akaun kamu sementara siasatan berjalan. # effect:duit:-1500 # effect:akaun:Disekat # outcome:frozen
    -> END

=== tanya ===
// REVIEW: the handler's excuse for not using his own account.
Abang Zul: Akaun abang dah kena limit la dik, bank hadkan transaksi. Biasa la bisnes 😅
Abang Zul: Adik tak payah fikir banyak. Duit masuk, adik pindah, siap. Sejam je kerja.
* [Hmm, ok la. Ambil la nombor akaun saya.] -> serah
* [Kalau sah, kenapa kena rahsia? Saya nak tanya kawan dulu.]
    Abang Zul: Alaa dik, tak payah la. Abang dah cakap, jangan cerita kat orang. # flag:secrecy:jangan cerita kat orang
    Kamu tunjuk mesej ini kepada kawan sebilik. Dia kata ini cara orang cari akaun keldai, dan kamu sekat nombor Abang Zul. # outcome:safe
    -> END

=== tolak ===
Abang Zul: Alaa rugi la dik. RM1,500 tu, cukup bayar yuran asrama. # flag:greed:RM1,500
Abang Zul: Fikir la dulu. Tapi ingat, jangan cerita kat orang. # flag:secrecy:jangan cerita kat orang
* [Tak nak, bang. Saya sekat nombor ni.]
    Kamu sekat nombor 011-0000 0456 dan pesan kepada kawan sebilik supaya jangan layan tawaran Abang Zul. # outcome:safe
    -> END
