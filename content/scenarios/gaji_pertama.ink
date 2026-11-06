# id:gaji_pertama
# type:finance
# family:pay
# concepts:bajet,kompaun
# contact:Nurin
# number:011-0000 0320
# hint:Gaji pertama seronok, tapi tetapkan dulu duit untuk simpanan. Dana kecemasan dulu, baru fikir benda lain.
# apa_patut:Sebaik gaji masuk, asingkan bahagian simpanan dahulu sebelum belanja. Jangan tunggu baki di hujung bulan.
# apa_patut:Siapkan dana kecemasan sebelum letak duit di tempat lain. Kalau tak, kamu terpaksa keluarkan duit pada masa yang salah.
# apa_patut:Duit kecil yang disimpan lama boleh membesar kerana pulangan dikira atas pulangan sebelumnya. Cuba Mesin Masa di Kalkulator, dan ingat kadar sebenar sentiasa berbeza.

// Scenario 4 (W4, finance): first RM400 pay from the fictional Kafe Cempaka. The pay itself arrives in the week intro; this
// only decides what to do with it. Amanah Cempaka is explained, never recommended (hard rule 12). Rates are "contoh" only.
// REVIEW: the scenario cannot read Simpanan, so "dana kecemasan dah cukup RM300" is the player's own claim; the engine adds Tekanan +5 if it is not true.
Nurin: Gaji pertama dari Kafe Cempaka dah masuk kan?! RM400! 🎉
Nurin: Jom makan besar malam ni, kau belanja!
Nurin: Eh, tapi sebelum tu, aku cuma nak tanya. Kau dah fikir duit tu nak buat apa? Ini bukan nasihat, kau yang putuskan.
* [Jom! Aku belanja semua, gaji pertama kot.] -> belanja
* [Aku simpan sebahagian dulu.] -> simpan
* [Kira dulu] -> kira

=== kira ===
Kamu buka Kalkulator dan masukkan contoh: RM50 sebulan, dari umur 19 hingga 30. # ui:calc:masa:labur50
// REVIEW: no figures from the preset are quoted here on purpose; the calculator shows them. Total put in is 132 x RM50 = RM6,600.
Nurin: Nampak tak? Dalam contoh tu kau masukkan RM6,600 sendiri, tapi jumlah akhir lebih daripada tu. Itulah kesan masa, pulangan dikira atas pulangan sebelumnya.
Nurin: Kadar dalam Kalkulator tu contoh je, kadar sebenar sentiasa berbeza dan tak dijamin.
* [Menarik. Aku simpan sebahagian dulu.] -> simpan
* [RM50 tu kecil je. Tak payah, aku belanja je.] -> belanja

=== belanja ===
Nurin: Okay! Kau berhak raikan gaji pertama. Tapi jangan lupa baki bulan ni.
// REVIEW: RM150 for the treat is a game number for an over-the-top first-pay splurge (treat for friends, new shoes).
Kamu belanja kawan-kawan makan besar dan beli kasut baharu. Seronok, tapi RM150 hilang sekelip mata dan simpanan kamu tak bertambah. # effect:duit:-150 # outcome:rugi
-> END

=== simpan ===
Nurin: Bagus. Mula dengan dana kecemasan. Sasaran dalam permainan ni RM300, cukup untuk perkara tak dijangka.
Nurin: Aku ada dengar pasal Amanah Cempaka, dana harga tetap yang risikonya rendah. Contoh, pulangannya dalam sekitar 4% setahun, tapi itu contoh sahaja. Aku tak cakap kau patut masuk, aku cuma terangkan.
Nurin: Soalan paling penting: dana kecemasan kau dah cukup RM300 ke belum?
* [Belum cukup. Aku simpan RM100 dalam Simpanan dulu.]
    Nurin: Bagus. Dana kecemasan dulu, baru benda lain. Yang lain boleh tunggu.
    Kamu masukkan RM100 ke Simpanan dan belanja baki gaji dengan berhemat. Dana kecemasan kamu makin dekat dengan sasaran RM300. # outcome:untung
    -> END
* [Dah cukup RM300. Aku pindah RM50 ke Amanah Cempaka, bakinya aku simpan.]
    Nurin: Kalau dana kecemasan dah ada, itu urutan yang betul. Ingat, ini bukan nasihat. Semak dulu butiran dan risiko produk tu sebelum masuk.
    // REVIEW: RM50 into Amanah Cempaka is shown as an option after the emergency fund, never as advice.
    Kamu pindahkan RM50 ke Amanah Cempaka dan asingkan baki ke Simpanan. Dana kecemasan kamu sudah ada, jadi duit ini bukan untuk dikeluarkan bila-bila masa. # effect:labur:amanah:+50 # effect:duit:-50 # outcome:untung
    -> END
