# id:alert_bankku
# type:legit
# family:bank
# tactics:
# contact:BankKu
# hint:A real alert gives no link and does not ask for an OTP or TAC. How to tell: check in the BankKu app yourself, or call the number on the back of your card.
# apa_patut:A real bank alert does not ask for an OTP, TAC or password, and gives no link to click. Check in your own app or call the number on the back of your card.
# apa_patut:Don't ignore an alert and don't assume straight away that it is a scam. Check it yourself through official channels, then decide.

// English version of the BM file with the same name. Keep the structure, tags and order identical to the BM file.
BankKu: BankKu notice: A debit card transaction of RM89.90 at KedaiOnline has been recorded.
BankKu: If this was not you, please check your BankKu app or call the number on the back of your card.
BankKu: We will never ask for your OTP, TAC or password by message, and this message contains no link.
* [Open the BankKu app myself and check that transaction.] -> aplikasi
* [Call the number on the back of my card.] -> telefon
* [Must be a scam! I'm blocking BankKu, no need to look at anything.] -> sekat

=== aplikasi ===
You open the BankKu app yourself, not through the message. In the transaction list there is RM89.90 at KedaiOnline, status pending.
* [I don't recognise this transaction. Block the card in the app and call the bank.] -> sekat_kad
* [Oh, this is the phone case I ordered yesterday. No problem.]
    You remember ordering a phone case at KedaiOnline. The alert was only a routine notice, and you confirmed it yourself in the app. # outcome:safe
    -> END

=== sekat_kad ===
You block the card in the app, then call the number on the back of it. The bank officer confirms the transaction is still pending and rejects it, then arranges a new card. # outcome:safe
-> END

=== telefon ===
You call the number on the back of your own card, not a number from the message. The bank officer checks the transaction with you and confirms the alert really came from the bank. # outcome:safe
-> END

=== sekat ===
You block BankKu and close the message without opening the app or calling anyone. The RM89.90 transaction stays unchecked, and you don't know whether it was really yours. # missed:0 # outcome:curiga
-> END
