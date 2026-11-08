# id:raya_duit
# type:scam
# family:bank
# tactics:greed,urgency
# concepts:bajet
# contact:KadRaya3D
# number:011-0000 0731
# hint:Real Raya money comes from family, not through an app that asks you to log in to your bank. Ask your family first.
# apa_patut:Don't install apps from links in messages. A real greeting card needs no special app, let alone a bank login.
# apa_patut:If you're not sure, ask in the family group who sent it.
# apa_patut:If you already installed it and logged in, remove the app, call your bank on the number on the back of your bank card, and call NSRC 997 right away.

// English version of the BM file with the same name. Keep the structure, tags and order identical to the BM file.
You've set aside RM180 for going home, for the bus ticket and Raya money for your younger cousins.
KadRaya3D: Happy Eid! 🌙 You have received a Digital Raya Card and RM50 IN RAYA MONEY from a family member. # flag:greed:RM50 IN RAYA MONEY
KadRaya3D: Download the KadRaya3D app to open the card and claim your Raya money: kadraya3d.test/apk
KadRaya3D: The claim closes tonight. Log in to your bank account in the app so the Raya money goes straight in. # flag:urgency:The claim closes tonight
* [Download it and log in to claim the RM50.] -> pasang
* [Ask in the family group first who sent this card.] -> tanya
* [Delete it. Raya money doesn't come through a strange app.] -> padam

=== pasang ===
The KadRaya3D app asks for permission to read your SMS and shows a BankKu login page.
* [Enter my BankKu username and password.]
    KadRaya3D: Thank you! Your Raya money will be credited within 24 hours 🎉
    That night a TAC SMS arrives, but the app reads it first. The RM180 you set aside for going home is gone from your account. # effect:duit:-180 # outcome:scammed
    -> END
* [Wait, why would a greeting card need to read my SMS and log in to my bank? Stop.]
    You remove the app without logging in, then call the number on the back of your bank card to tell the bank. Your Raya budget is safe. # outcome:safe
    -> END

=== tanya ===
You ask in the family group. Mak Long replies, "Nobody sends Raya money through an app. Don't tap it, it's a scam."
You delete the message. The RM180 for going home and your cousins' Raya money stay as you planned. # outcome:safe
-> END

=== padam ===
You delete the message without opening the link. Your Raya budget is untouched. # outcome:safe
-> END
