# id:dompet_minggu0
# type:finance
# family:budget
# concepts:bajet,kecemasan
# contact:Hafiz (Rakan Serumah)
# number:011-0000 0210
# hint:Asingkan duit sebaik sahaja ia masuk, bukan selepas habis belanja. Dana kecemasan dulu, baru yang lain.
# apa_patut:Bahagikan duit kepada keperluan, kehendak dan simpanan sebaik duit masuk. Satu contoh pembahagian ialah 50 / 30 / 20, tetapi ubah ikut keadaan kamu.
# apa_patut:Bina dana kecemasan dulu. Dalam permainan ini sasarannya RM300, duit untuk perkara tak dijangka seperti telefon rosak atau yuran mengejut.
# apa_patut:Buka Dompet dan asingkan duit ke Keperluan, Kehendak dan Simpanan. Tengok baki sahaja tak cukup, kamu perlu tahu duit itu untuk apa.

// Scenario 3 (W2, finance): a flatmate compares budgets over teh tarik; the player splits money in Dompet and starts an
// emergency fund. No products, no investing here. Consequence copy is in the app's outcome templates.
// REVIEW: 50 / 30 / 20 is a common rule of thumb, shown as "contoh" only; check it is fair for a student on a small allowance.
Hafiz: Weh, jom mamak kejap. Aku belanja teh tarik 🍵
Hafiz: Aku tengok bajet kau macam mana? Aku pulak, sebelum belanja apa-apa, aku asing duit dulu dalam tiga bahagian: keperluan, kehendak, simpanan.
Hafiz: Keperluan tu makan, tambang, bil. Kehendak tu bubble tea, game, jalan-jalan. Simpanan tu duit yang aku tak sentuh.
Hafiz: Kau buat macam mana? Kan hujung bulan selalu sesak.
* [Aku belanja je dulu. Kalau ada lebih, baru simpan.] -> belanja
* [Tunjuk aku macam mana buat dalam Dompet.] -> dompet
* [Dana kecemasan tu apa? Kenapa kena ada?] -> tanya

=== tanya ===
Hafiz: Dana kecemasan tu duit khas untuk benda tak dijangka. Telefon rosak, laptop kena baiki, yuran mengejut.
Hafiz: Kalau tak ada, masa tu kau terpaksa pinjam kawan atau potong makan. Tekanan gila.
// REVIEW: RM300 is the in-game emergency target (the balance table); a real student target is usually larger, said as "untuk permulaan".
Hafiz: Untuk permulaan, sasaran RM300 dah okay. Lepas tu boleh tambah lagi.
* [Ok, jom asingkan duit dalam Dompet sekarang.] -> dompet
* [Susah la nak simpan. Nanti-nanti je la.] -> belanja

=== belanja ===
Hafiz: Hmm. Masalahnya "baki" tu selalu tak ada. Duit lebih jarang jadi simpanan kalau tak diasingkan awal.
Hafiz: Takpe, kau yang putuskan. Tapi cuba fikir kalau minggu depan ada apa-apa kecemasan.
* [Betul jugak. Tunjuk macam mana asing dalam Dompet.] -> dompet
* [Tak apa, duit aku untuk dibelanja. Aku okay.]
    // REVIEW: Tekanan +10 is a game number for a tight month with no cushion, not a measured figure.
    Kamu belanja ikut suka sepanjang bulan. Simpanan kosong. Bila telefon tiba-tiba perlu dibaiki, kamu tak ada apa-apa untuk menampungnya dan terpaksa pinjam kawan. # effect:tekanan:+10 # outcome:rugi
    -> END

=== dompet ===
Kamu buka Dompet. Hafiz tunjuk tiga bahagian: Keperluan, Kehendak dan Simpanan.
Hafiz: Mula dengan keperluan, pastikan makan dan tambang cukup untuk bulan ni. Lepas tu, asing sikit untuk simpanan walaupun kecil.
Hafiz: Satu contoh yang ramai guna: 50% keperluan, 30% kehendak, 20% simpanan. Itu contoh sahaja, kau boleh ubah ikut keadaan kau.
* [Aku letak sikit dalam Simpanan dulu sampai cukup RM300, baru fikir benda lain.] -> asing
* [Aku letak semua dalam satu bahagian je. Senang, tengok baki.]
    Hafiz: Kalau satu poket je, kau tak tahu duit tu dah terpakai untuk apa. Baki nampak banyak, tapi sebenarnya dah ada tuan.
    Kamu biarkan semuanya dalam satu bahagian. Dua minggu kemudian, baki makin tipis dan kamu tak pasti ke mana perginya. Simpanan tak bertambah. # effect:tekanan:+10 # outcome:rugi
    -> END

=== asing ===
Hafiz: Bagus. Dana kecemasan dulu. RM300 tu kau kumpul sikit-sikit setiap minggu, tak payah sekali gus.
Kamu asingkan duit mengikut bahagian dan mula kumpul dana kecemasan. Bulan ni kamu tahu duit makan dan tambang cukup, dan ada sedikit simpanan untuk perkara tak dijangka. # outcome:untung
-> END
