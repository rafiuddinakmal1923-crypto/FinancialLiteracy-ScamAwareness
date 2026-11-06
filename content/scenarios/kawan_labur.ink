# id:kawan_labur
# type:finance
# family:investment
# concepts:risiko,semak
# contact:Kak Sofea
# number:011-0000 0789
# hint:Pelaburan sah boleh naik dan turun, ada yuran, dan boleh disemak dalam senarai pemegang lesen. Yang janji pasti untung atau minta yuran tunai patut disemak dulu.
# apa_patut:Sebelum bagi duit, semak syarikat pengurus dana dalam senarai pemegang lesen Suruhanjaya Sekuriti (SC). Taip sendiri alamat laman rasmi, jangan klik pautan dalam mesej.
# apa_patut:Semak juga Investor Alert List SC untuk nama yang pernah diberi amaran.
# apa_patut:Bayar hanya kepada syarikat berlesen melalui saluran rasmi, bukan tunai atau ke akaun peribadi ejen. Guna duit lebihan, bukan dana kecemasan.

// Scenario 4 (W5, finance): a friendly senior explains a REAL-style licensed unit trust (fictional "Dana Ekuiti Cempaka").
// She explains, she never recommends (hard rule 12). The right call is the process: check first, small amount, spare money.
// TODO-VERIFY: every rate, fee and licence-check step below against the regulator's public guidance.
Kak Sofea: Hai dik! Kak Sofea ni, senior tahun akhir. Kita satu kelab kewangan kan 😊
Kak Sofea: Akak dengar adik tengah fikir nak mula labur duit lebihan. Akak cuma terangkan ya. Ini bukan nasihat, keputusan tetap adik yang buat.
// REVIEW: a unit trust described in one sentence for a first-year; check that "kumpul duit ramai orang" is a fair summary.
Kak Sofea: Contoh yang akak tengok, "Dana Ekuiti Cempaka". Itu unit amanah. Maksudnya duit ramai orang dikumpul, lepas tu pengurus dana labur dalam saham syarikat.
Kak Sofea: Harga unit dia naik turun. Ada minggu naik, ada minggu jatuh. Tak ada sesiapa boleh jamin pulangan.
// REVIEW: the fee range is illustrative ("contoh"); real sales charges and annual fees differ by fund.
Kak Sofea: Ada yuran juga. Yuran jualan masa masuk dan yuran pengurusan setiap tahun, contoh dalam lingkungan 1% hingga 5%. Yuran tu ditolak sama ada dana untung atau rugi.
Kak Sofea: Ada pulak "ejen" kat kampus ni yang tawar daftar cepat dengan yuran tunai. Akak tak kenal siapa.
* [Macam mana nak tahu dana ni sah, kak?] -> semak
* [Ejen kat kafe tu tawar daftar terus, yuran RM50 je. Saya bayar la.] -> ejen
* [Terima kasih kak, saya fikir dulu.] -> fikir

=== semak ===
Kak Sofea: Soalan paling penting tu dik. Jangan percaya cakap orang, semak sendiri.
// REVIEW: the check steps are described generically (no real agency names in dialogue, D27); confirm order and wording.
Kak Sofea: Satu, minta nama syarikat pengurus dana dan nombor lesen dia. Syarikat sebenar akan beri dengan senang hati.
Kak Sofea: Dua, buka laman web pengawal selia pasaran modal negara. Taip sendiri alamatnya, jangan klik pautan dalam mesej. Cari nama syarikat tu dalam senarai pemegang lesen.
Kak Sofea: Tiga, semak senarai amaran pelabur. Kalau nama tu ada situ, jangan layan.
Kak Sofea: Empat, bayaran pergi kepada syarikat melalui saluran rasmi. Kalau disuruh bayar tunai atau masuk akaun peribadi, itu tanda merah.
Kak Sofea: Akak dah semak, Dana Ekuiti Cempaka ada dalam senarai pemegang lesen. Tapi adik semak sendiri jugak ya, jangan harap akak je.
* [Ok kak. Saya masukkan RM100 dulu, duit kecemasan saya tak usik.] -> kecil
* [Saya masukkan RM300, semua simpanan kecemasan. Mesti naik!] -> semua
* [Saya nak baca risalah dulu, minggu depan baru putuskan.] -> baca

=== kecil ===
Kak Sofea: Akak tak boleh cakap itu betul atau tak untuk adik. Tapi bagus adik semak dulu dan guna duit yang memang tak diperlukan bulan ni.
// REVIEW: reminder that a small amount can dip below what was put in; that is normal for an equity fund.
Kak Sofea: Ingat, nilai RM100 tu boleh jatuh bawah RM100 dalam beberapa minggu. Itu biasa untuk dana macam ni. Jangan panik jual cepat-cepat.
Kamu semak nama dana dalam senarai pemegang lesen, kemudian masukkan RM100 melalui saluran rasmi. Duit kecemasan kamu tak disentuh. # effect:labur:ekuiti:+100 # effect:duit:-100 # outcome:untung
-> END

=== semua ===
Kak Sofea: Eh dik, kejap. Duit kecemasan tu untuk benda tak dijangka, bukan untuk dana yang harganya naik turun.
Kak Sofea: Kalau adik perlu duit cepat masa harga tengah turun, adik terpaksa jual rugi, lagi ada yuran. Akak cuma ingatkan, adik yang putuskan.
// REVIEW: RM300 in, RM270 back after one week; a sales charge of about 5% plus a dip of about 5% is illustrative, not typical.
Kamu tetap masukkan RM300. Seminggu kemudian telefon rosak dan kamu perlukan duit segera. Harga unit tengah turun dan ada yuran, jadi kamu terima balik RM270 sahaja. # effect:duit:-30 # outcome:rugi
-> END

=== baca ===
Kak Sofea: Bagus, tak payah gesa. Risalah produk ada senarai yuran dan risiko, baca elok-elok.
Kak Sofea: Kalau ada sesiapa kata "slot terhad, bayar hari ni", itu pun tanda untuk berhenti dan semak dulu.
Kamu simpan risalah itu dan putuskan lepas semak. Duit kamu kekal sama buat masa ini. # outcome:safe
-> END

=== fikir ===
Kak Sofea: Takpe dik, tak payah tergesa-gesa. Bila nak tahu cara semak, mesej akak je.
Kamu tak buat apa-apa dulu dan duit kamu kekal sama. # outcome:safe
-> END

=== ejen ===
Kak Sofea: Kejap dik. Yuran pendaftaran RM50 tunai kepada ejen? Akak tak pernah dengar dana macam tu minta yuran macam tu.
Kak Sofea: Bayaran biasanya terus kepada syarikat melalui saluran rasmi. Adik dah semak ejen tu berlesen?
* [Belum. Tapi dia kata RM50 je, lepas tu boleh masuk berapa pun. Saya bayar la.] -> bayar_ejen
* [Betul jugak. Macam mana nak semak?] -> semak

=== bayar_ejen ===
Kak Sofea: Akak risau, tapi adik yang putuskan. Simpan resit kalau ada.
// REVIEW: the unlicensed-middleman pattern (small "registration fee", units never arrive); check against investor-alert reports.
Kamu bagi RM50 tunai kepada ejen itu. Dia kata unit akan masuk dalam tiga hari, tapi tak pernah ada, dan nombor dia tak berjawab lagi. # effect:duit:-50 # outcome:rugi
-> END
