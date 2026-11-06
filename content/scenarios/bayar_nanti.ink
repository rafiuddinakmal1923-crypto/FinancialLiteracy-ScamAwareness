# id:bayar_nanti
# type:finance
# family:loan
# concepts:hutang
# contact:BayarNanti
# hint:"Tiada faedah" tak bermakna percuma. Tanya jumlah keseluruhan yang akan dibayar, bukan hanya ansuran sebulan.
# apa_patut:Sebelum ambil bayar-kemudian, tanya jumlah keseluruhan yang akan dibayar dan bandingkan dengan harga tunai.
# apa_patut:Kalau ansuran dah menyesakkan bajet, hubungi agensi kaunseling kredit (AKPK) untuk nasihat percuma.

// Scenario 6 (W9, finance): a legal "buy now pay later" offer that costs more than it looks. Not a scam, so there is no
// scam language and no flags: BayarNanti is polite and answers honestly when asked. The cost is in the fees.
// REVIEW: the 18% flat rate over 12 months (RM1,180 total) is illustrative; it matches the Kos Sebenar preset bayar1000.
BayarNanti: Hai! Telefon Lintang S5 cuma RM1,000 📱
BayarNanti: Bawa balik hari ni, bayar RM98 sebulan je. Tiada faedah! 🎉
BayarNanti: Lulus dalam dua minit, tak perlu kad kredit. Butiran penuh ada dalam jadual bayaran.
* [Boleh tahan! Saya ambil.] -> ambil
* [Kira dulu] -> kira
* [Tak apa, saya kumpul duit dulu.] -> simpan

=== ambil ===
BayarNanti: Hebat! Sebelum sahkan, jumlah keseluruhan yang akan dibayar ada dalam butiran jadual. Nak lihat dulu atau terus sahkan?
* [Kira dulu] -> kira
* [Terus sahkan, saya nak telefon tu.] -> terus

=== kira ===
Kamu buka Kalkulator dan masukkan harga RM1,000, kadar rata dan tempoh 12 bulan daripada butiran produk. # ui:calc:kos:bayar1000
// REVIEW: contoh figures only; BayarNanti answers honestly because the product is legal. Check that the "yuran" wording is plausible.
BayarNanti: Betul, jumlah keseluruhan RM1,180 untuk 12 bulan. Contoh pengiraan: yuran kadar rata 18% setahun, dimasukkan dalam ansuran.
BayarNanti: Ramai suka sebab ansuran kecil dan senang urus 😊
* [Jumlah tu lebih daripada harga tunai. Saya tangguh dan simpan dulu.] -> simpan
* [Saya faham jumlahnya. Telefon lama dah rosak, saya ambil jugak.] -> sedar

=== terus ===
// REVIEW: first instalment about RM100 (RM98 plus a small processing fee) and Tekanan +10 are game numbers, not a real schedule.
Kamu sahkan dan bawa balik telefon itu. Bulan ni RM98 keluar, tambah yuran proses, dan bajet makan minggu depan makin ketat. # effect:duit:-100 # effect:tekanan:+10 # outcome:hutang
-> END

=== sedar ===
Kamu ambil telefon itu dengan tahu jumlahnya RM1,180. Itu keputusan yang jelas, tapi ansuran bulanan tetap keluar dan bajet makin ketat. # effect:duit:-100 # effect:tekanan:+10 # outcome:hutang
-> END

=== simpan ===
Kamu tangguh dulu dan mula asingkan RM100 sebulan untuk telefon. Telefon lama masih boleh digunakan sementara itu. # outcome:untung
-> END
