# id:buku_terpakai
# type:legit
# family:marketplace
# tactics:
# contact:Farhan (Junior)
# number:011-0000 0615
# hint:Jual-beli sebenar biasanya jumpa di tempat awam, siang hari, dan bayar bila terima barang. Tiada deposit dan tiada pautan.
# apa_patut:Jual-beli barang terpakai paling selamat di tempat awam pada siang hari, dengan bayaran tunai atau bayaran selepas terima barang. Tiada deposit, tiada pautan pelik.
# apa_patut:Kalau ragu, semak orang itu melalui kumpulan fakulti atau kawan yang kenal. Jangan terus menolak tanpa menyemak.

// Scenario 8 (W10, legit): a junior wants the player's used textbook. Cash at the library counter, in daytime, no deposit,
// no link. Nothing here is a scam; the wrong call is refusing out of general fear without even replying.
// REVIEW: RM50 for a used first-year textbook; is the price realistic for a campus flea market?
Farhan (Junior): Assalamualaikum. Saya Farhan, junior Tahun 1 Fakulti Perniagaan. Saya nampak kamu jual buku Pengantar Perakaunan dalam group fakulti.
Farhan (Junior): Masih ada? Saya nak beli RM50 macam yang kamu letak.
Farhan (Junior): Boleh jumpa kat kaunter perpustakaan esok tengah hari? Saya bayar tunai terus bila ambil buku. Tak payah deposit atau apa-apa.
* [Boleh. Jumpa kat kaunter perpustakaan esok pukul 1.] -> jumpa
* [Saya tak kenal awak. Biar saya tanya dalam group fakulti dulu.] -> semak
* [Tak payah balas la. Mana tahu penipu.] -> abai

=== jumpa ===
Farhan (Junior): Baik! Saya datang pukul 1 dengan duit tunai.
Esoknya kamu jumpa Farhan di kaunter perpustakaan yang ramai orang. Dia belek buku itu, hulur RM50 tunai, dan kamu serahkan buku. Selesai dalam seminit. # effect:duit:+50 # outcome:safe
-> END

=== semak ===
Farhan (Junior): Boleh, tak ada masalah. Kamu tanya la.
Kamu tanya dalam group fakulti. Kak Wani, ketua tahun akhir, balas: "Farhan tu junior kita, budak baik."
* [Okay, jumpa di kaunter perpustakaan siang esok.]
    Farhan (Junior): Baik. Jumpa esok pukul 1.
    Kamu jumpa Farhan di kaunter perpustakaan yang ramai orang. Dia bayar RM50 tunai dan ambil buku. Kamu dah semak dulu dan pilih tempat yang selamat. # effect:duit:+50 # outcome:safe
    -> END

=== abai ===
// REVIEW: missed:50 is the sale the player turned away; check that not replying at all (not even a question) reads as the "too suspicious" call.
Kamu tak balas langsung dan padam mesej itu. Farhan tunggu beberapa hari, kemudian beli buku dari orang lain. Buku kamu masih di rak dan RM50 itu terlepas. # missed:50 # outcome:curiga
-> END
