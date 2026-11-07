# id:sewa_akaun
# type:scam
# family:mule
# tactics:greed,secrecy,social
# contact:Abang Zul
# number:011-0000 0456
# hint:If other people's money comes into your account and you move it out, your account is being used as a mule account.
# apa_patut:Don't lend, rent out or sell your bank account to anyone, even a senior or a close friend.
# apa_patut:If money you don't recognise lands in your account, don't move it. Contact your bank on the official number on the back of your card.
# apa_patut:If you're already involved, stop right away, call the 997 line and make a report at the nearest police station.

VAR ui_ok = false

// English version of the BM file with the same name. Keep the structure, tags and order identical to the BM file.
Abang Zul: Assalamualaikum dik. Abang Zul here, Engineering senior, block C 👋
Abang Zul: Heard your hostel fee must settle this Friday right? Many juniors tight on money now 😅
Abang Zul: I got a small e-wallet business. Want to borrow your BankKu account for just one month.
Abang Zul: I pay RM1,500 a month. Money straight in, you don't have to do anything 💸 # flag:greed:RM1,500
Abang Zul: Relax la, everyone does it. Lots of block C guys already rent to me. # flag:social:everyone does it
Abang Zul: But don't tell anyone ah, later everybody wants to join 🤫 # flag:secrecy:don't tell anyone
* [Serious RM1,500? Ok, how does it work?] -> minat
* [Why don't you use your own account?] -> tanya
* [No thanks bang. My account, I use it myself.] -> tolak

=== minat ===
Abang Zul: Easy only dik. Give me your BankKu account number.
Abang Zul: Later my customer's money comes in, you transfer to my friend's account. Done, that's the whole job.
* [Ok bang, take my account number.] -> serah
* [Wait. Whose money is this really?] -> tanya

=== serah ===
Abang Zul: Ngam! I've put in RM1,500. Check BankKu 😎 # effect:duit:+1500
Abang Zul: Now transfer RM1,400 to my friend's account, Teratai Emas Enterprise. The RM100 is your pay this week.
Abang Zul: Fast a bit ya dik, customer is waiting. # ui:transfer:1400:Teratai Emas Enterprise
{ ui_ok:
    -> dah_pindah
- else:
    -> batal_pindah
}

=== dah_pindah ===
Abang Zul: Solid dik! My friend got it. Next week there's more, standby 👍 # effect:duit:-1400
BankKu notice. Your account has been frozen for receiving money reported in a fraud case. RM1,500 has been taken back to return to the victim. # effect:akaun:Disekat # effect:rekod:Disiasat # effect:duit:-1500
Your message to Abang Zul was not delivered. This number has blocked you. # outcome:mule
-> END

=== batal_pindah ===
Abang Zul: Eh, why cancel?? That money isn't yours la. Transfer fast! 😠
* [I don't want to be involved. I'm telling the bank.]
    You call BankKu and tell them everything. The bank returns the RM1,500 to the victim and blocks your account for now while it investigates. # effect:duit:-1500 # effect:akaun:Disekat # outcome:frozen
    -> END

=== tanya ===
Abang Zul: My account kena limit la dik, the bank restricts transactions. Normal for business 😅
Abang Zul: Don't think so much. Money comes in, you transfer, done. One hour of work only.
* [Hmm, ok la. Take my account number.] -> serah
* [If it's legit, why must it be secret? I want to ask a friend first.]
    Abang Zul: Aiya dik, no need la. I already said, don't tell anyone. # flag:secrecy:don't tell anyone
    You show these messages to your roommate, who says this is how people look for mule accounts, and you block Abang Zul's number. # outcome:safe
    -> END

=== tolak ===
Abang Zul: Aiya your loss dik. RM1,500, enough to pay the hostel fee. # flag:greed:RM1,500
Abang Zul: Think about it first. But remember, don't tell anyone. # flag:secrecy:don't tell anyone
* [No, bang. I'm blocking this number.]
    You block the number 011-0000 0456 and tell your roommate not to bother with Abang Zul's offer. # outcome:safe
    -> END
