# id:panggilan_mahkamah
# type:scam
# family:authority
# tactics:authority,fear,secrecy
# contact:Pegawai Mahkamah
# number:011-0000 0990
# ui:call
# hint:Pihak berkuasa sebenar tak telefon untuk suruh kamu pindah duit ke "akaun selamat". Letak telefon dan semak sendiri.
# apa_patut:Pihak berkuasa sebenar tak pernah suruh pindah duit ke "akaun selamat" atau minta kamu rahsiakan kes. Letak telefon, kemudian semak sendiri melalui talian rasmi.
# apa_patut:Telefon bank melalui nombor di belakang kad sendiri, dan telefon NSRC 997 kalau dah terpindah duit atau tak pasti.
# apa_patut:Jangan percaya nama pegawai atau nombor yang mereka beri. Minta nama dan nombor, kemudian semak sendiri, jangan balik telefon nombor itu.

// Scenario 9 (W11, scam): a phone call. "Pegawai Mahkamah" transfers the player to an "Inspektor"; threat of arrest, move money
// to an "akaun selamat", tell nobody. The UI is the incoming-call screen (Task 25); until then it plays in the chat thread.
// REVIEW: the "parcel with illegal items / court summons" story and the "akaun selamat" demand are typical of reported
// impersonation-of-authority calls; check the wording against official public advisories.
Pegawai Mahkamah: Selamat petang. Saya Pegawai Mahkamah. Nama kamu ada dalam satu kes saman mahkamah. # flag:authority:Saya Pegawai Mahkamah
Pegawai Mahkamah: Satu bungkusan atas nama kamu ditahan dan ada barang haram di dalamnya. Saya sambungkan kamu kepada Inspektor sekarang.
Inspektor: Saya Inspektor dari ibu pejabat polis. Kes kamu serius dan kami sedang keluarkan waran tangkap. # flag:fear:waran tangkap
Inspektor: Kamu boleh ditangkap hari ini kalau kamu tak bekerjasama.
Inspektor: Ini kes rahsia. Jangan beritahu sesiapa, termasuk keluarga dan bank kamu. # flag:secrecy:Jangan beritahu sesiapa
* [Hah? Saya tak pernah hantar apa-apa bungkusan.] -> nafi
* [Baik, Inspektor. Saya akan ikut arahan.] -> ikut
* [Letak telefon.] -> letak

=== nafi ===
Inspektor: Itu yang semua orang kata. Kami ada bukti, dan nama kamu dalam sistem.
Inspektor: Untuk bersihkan nama kamu, pindahkan RM300 ke akaun selamat kami. Kami akan sahkan duit kamu bersih, lepas tu pulangkan.
* [Baik, saya pindahkan sekarang.] -> ikut
* [Minta nama dan nombor Inspektor. Saya semak sendiri dulu.] -> semak
* [Letak telefon.] -> letak

=== ikut ===
Inspektor: Bagus. Pindahkan RM300 ke akaun selamat itu sekarang. Jangan letak telefon dan jangan cakap dengan sesiapa.
// REVIEW: Disekat after the bank flags the transfer; the unusual-transfer freeze is described generically, check bank practice.
Kamu pindahkan RM300 ke "akaun selamat" itu. Panggilan terputus dan nombor itu tak boleh dihubungi lagi. Tak lama kemudian bank menyekat akaun kamu kerana transaksi mencurigakan. # effect:duit:-300 # effect:akaun:Disekat # outcome:scammed
-> END

=== semak ===
Inspektor: Tak payah semak! Ini kes rahsia. Kalau kamu letak telefon, waran tangkap dikeluarkan sekarang juga.
Kamu tak terpengaruh dengan ugutan itu. Kamu catat nama dan nombor yang diberi, letak telefon, kemudian telefon bank melalui nombor di belakang kad sendiri dan hubungi 997. Mereka sahkan tiada kes seperti itu. # outcome:safe
-> END

=== letak ===
Kamu letak telefon. Mahkamah dan polis sebenar tak minta kamu pindah duit atau rahsiakan kes melalui telefon. Kamu sekat nombor itu dan beritahu kawan sebilik tentang panggilan tadi. # outcome:safe
-> END
