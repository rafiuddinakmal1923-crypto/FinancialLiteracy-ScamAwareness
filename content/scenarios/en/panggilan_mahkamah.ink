# id:panggilan_mahkamah
# type:scam
# family:authority
# tactics:authority,fear,secrecy
# contact:Court Officer
# number:011-0000 0990
# ui:call
# hint:Real authorities don't call to tell you to move money to a "safe account". Hang up and check for yourself.
# apa_patut:Real authorities never tell you to move money to a "safe account" or ask you to keep a case secret. Hang up, then check for yourself through an official line.
# apa_patut:Call the bank on the number on the back of your own card, and call NSRC 997 if you have already moved money or aren't sure.
# apa_patut:Don't trust an officer's name or a number they give you. Ask for the name and number, then check for yourself; don't call that number back.

// English version of the BM file with the same name. Keep the structure, tags and order identical to the BM file.
// The hang-up choice must keep the words "Hang up": the call screen looks for them (HANG_UP in the incoming-call code).
Court Officer: Good afternoon. I am a Court Officer. Your name is in a court summons case. # flag:authority:I am a Court Officer
Court Officer: A parcel in your name has been held and it contains illegal items. I will connect you to the Inspector now.
Inspector: I am an Inspector from police headquarters. Your case is serious and we are issuing an arrest warrant. # flag:fear:arrest warrant
Inspector: You can be arrested today if you do not cooperate.
Inspector: This is a secret case. Do not tell anyone, including your family and your bank. # flag:secrecy:Do not tell anyone
* [What? I never sent any parcel.] -> nafi
* [Yes, Inspector. I will follow your instructions.] -> ikut
* [Hang up.] -> letak

=== nafi ===
Inspector: That is what everyone says. We have evidence, and your name is in the system.
Inspector: To clear your name, transfer RM300 to our safe account. We will confirm your money is clean, then return it.
* [Okay, I'll transfer it now.] -> ikut
* [Ask for the Inspector's name and number. I'll check for myself first.] -> semak
* [Hang up.] -> letak

=== ikut ===
Inspector: Good. Transfer RM300 to that safe account now. Do not end this call and do not talk to anyone.
You transfer RM300 to the "safe account". The call drops and the number can no longer be reached. Soon after, the bank blocks your account because of a suspicious transaction. # effect:duit:-300 # effect:akaun:Disekat # outcome:scammed
-> END

=== semak ===
Inspector: No need to check! This is a secret case. If you end this call, the arrest warrant is issued right now.
You don't give in to the threat. You note the name and number given, end the call, then call the bank on the number on the back of your own card and contact 997. They confirm there is no such case. # outcome:safe
-> END

=== letak ===
You end the call. Real courts and police don't ask you to move money or keep a case secret over the phone. You block the number and tell your roommate about the call. # outcome:safe
-> END
