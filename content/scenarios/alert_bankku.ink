# id:alert_bankku
# type:legit
# family:bank
# tactics:
# contact:BankKu
# hint:Amaran sebenar tak bagi pautan dan tak minta OTP atau TAC. Cara nak tahu: semak sendiri dalam aplikasi BankKu atau telefon nombor di belakang kad.
# apa_patut:Amaran bank sebenar tak minta OTP, TAC atau kata laluan, dan tak bagi pautan untuk klik. Semak dalam aplikasi sendiri atau telefon nombor di belakang kad.
# apa_patut:Jangan abaikan amaran dan jangan terus anggap ia scam. Semak sendiri melalui saluran rasmi, kemudian baru putuskan.

// Scenario 7 (W6, legit): a REAL fraud-style alert from BankKu. No link, no OTP/TAC, and it tells the reader to check
// the app or call the number on their own card. The wrong call is refusing to look at it ("mesti scam!").
// REVIEW: is this how a bank alert reads (formal BM, amount and merchant, "if not you")? Check wording against real alerts.
BankKu: Makluman BankKu: Transaksi kad debit RM89.90 di KedaiOnline telah direkodkan.
BankKu: Jika ini bukan anda, sila semak aplikasi BankKu anda atau hubungi nombor di belakang kad anda.
BankKu: Kami tidak akan meminta OTP, TAC atau kata laluan melalui mesej, dan mesej ini tidak mengandungi pautan.
* [Buka aplikasi BankKu sendiri dan semak transaksi tu.] -> aplikasi
* [Telefon nombor di belakang kad aku.] -> telefon
* [Mesti scam! Aku sekat BankKu, tak payah tengok apa-apa.] -> sekat

=== aplikasi ===
Kamu buka aplikasi BankKu sendiri, bukan melalui mesej. Dalam senarai transaksi ada RM89.90 di KedaiOnline, status menunggu.
* [Aku tak kenal transaksi ni. Sekat kad dalam aplikasi dan telefon bank.] -> sekat_kad
* [Oh, ini pesanan casing telefon aku semalam. Tak ada masalah.]
    Kamu ingat semula pesanan casing telefon di KedaiOnline. Alert itu hanya makluman biasa, dan kamu sahkan sendiri dalam aplikasi. # outcome:safe
    -> END

=== sekat_kad ===
Kamu sekat kad melalui aplikasi, kemudian telefon nombor di belakang kad. Pegawai bank sahkan transaksi itu masih menunggu dan menolaknya, kemudian aturkan kad baharu. # outcome:safe
-> END

=== telefon ===
Kamu telefon nombor di belakang kad sendiri, bukan nombor dalam mesej. Pegawai bank semak transaksi itu bersama kamu dan sahkan alert tadi memang datang daripada bank. # outcome:safe
-> END

=== sekat ===
// REVIEW: "missed:0" because nothing is lost in money; the cost is a missed chance to stop a real charge, said by the app's Kancil hint.
Kamu sekat BankKu dan tutup mesej tanpa buka aplikasi atau telefon sesiapa. Transaksi RM89.90 itu kekal tanpa disemak, dan kamu tak tahu sama ada ia memang kamu atau tidak. # missed:0 # outcome:curiga
-> END
