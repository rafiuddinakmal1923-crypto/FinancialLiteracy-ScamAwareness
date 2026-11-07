# id:raya_duit
# type:scam
# family:bank
# tactics:greed,urgency
# concepts:bajet
# contact:KadRaya3D
# number:011-0000 0731
# hint:Duit raya sebenar datang daripada keluarga, bukan melalui aplikasi yang minta kamu log masuk bank. Tanya keluarga dulu.
# apa_patut:Jangan pasang aplikasi daripada pautan dalam mesej. Kad ucapan sebenar tak perlu aplikasi khas, apatah lagi log masuk bank.
# apa_patut:Kalau tak pasti, tanya terus dalam group keluarga siapa yang hantar.
# apa_patut:Kalau dah terpasang dan log masuk, buang aplikasi itu, telefon bank melalui nombor di belakang kad, dan telefon NSRC 997 dengan segera.

// Raya event pack (FR-87, C8): an optional scenario for the week before the Raya break. The player has set aside
// RM180 for the trip home and duit raya for younger cousins. A "digital Raya card" asks them to install an app and log in
// to their bank to claim RM50. Concept: bajet (the scam targets money already set aside in the budget).
// REVIEW: is a fake e-greeting app (APK link) a realistic Raya scam for students? Check wording with a BM speaker.
Kamu dah asingkan RM180 untuk balik kampung, iaitu tiket bas dan duit raya untuk sepupu-sepupu kecil.
KadRaya3D: Salam Aidilfitri! 🌙 Anda menerima Kad Raya Digital dan DUIT RAYA RM50 daripada ahli keluarga anda. # flag:greed:DUIT RAYA RM50
KadRaya3D: Muat turun aplikasi KadRaya3D untuk buka kad dan tuntut duit raya: kadraya3d.test/apk
KadRaya3D: Tuntutan tamat malam ini. Log masuk akaun bank dalam aplikasi supaya duit raya terus masuk. # flag:urgency:Tuntutan tamat malam ini
* [Muat turun dan log masuk untuk tuntut RM50.] -> pasang
* [Tanya dalam group keluarga dulu, siapa yang hantar kad ni.] -> tanya
* [Padam. Duit raya tak datang melalui aplikasi pelik.] -> padam

=== pasang ===
Aplikasi KadRaya3D minta kebenaran membaca SMS dan memaparkan halaman log masuk BankKu.
* [Masukkan nama pengguna dan kata laluan BankKu.]
    KadRaya3D: Terima kasih! Duit raya akan dikreditkan dalam 24 jam 🎉
    Malam itu, SMS TAC masuk tetapi aplikasi itu membacanya dahulu. RM180 yang kamu asingkan untuk balik kampung hilang dari akaun. # effect:duit:-180 # outcome:scammed
    -> END
* [Eh, kenapa kad ucapan nak baca SMS dan log masuk bank? Berhenti.]
    Kamu buang aplikasi itu tanpa log masuk, kemudian telefon nombor di belakang kad untuk beritahu bank. Duit bajet Raya kamu selamat. # outcome:safe
    -> END

=== tanya ===
Kamu tanya dalam group keluarga. Mak Long balas, "Tak ada siapa hantar duit raya guna aplikasi. Jangan tekan, itu scam."
Kamu padam mesej itu. RM180 untuk balik kampung dan duit raya sepupu kekal seperti yang kamu rancang. # outcome:safe
-> END

=== padam ===
Kamu padam mesej itu tanpa buka pautan. Bajet Raya kamu tak terusik. # outcome:safe
-> END
