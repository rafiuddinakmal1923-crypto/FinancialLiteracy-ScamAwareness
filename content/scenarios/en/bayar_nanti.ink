# id:bayar_nanti
# type:finance
# family:loan
# concepts:hutang
# contact:BayarNanti
# hint:"No interest" doesn't mean free. Ask for the total you will pay, not only the monthly instalment.
# apa_patut:Before taking buy-now-pay-later, ask for the total you will pay and compare it with the cash price.
# apa_patut:If instalments are squeezing your budget, contact a recognised credit counselling agency for free advice.

// English version of the BM file with the same name. Keep the structure, tags and order identical to the BM file.
BayarNanti: Hi! The Lintang S5 phone is only RM1,000 📱
BayarNanti: Take it home today, pay just RM98 a month. No interest! 🎉
BayarNanti: Approved in two minutes, no credit card needed. Full details are in the payment schedule.
* [Not bad! I'll take it.] -> ambil
* [Work it out first] -> kira
* [It's okay, I'll save up first.] -> simpan

=== ambil ===
BayarNanti: Great! Before you confirm, the total you will pay is in the schedule details. Want to see it first or confirm right away?
* [Work it out first] -> kira
* [Confirm right away, I want that phone.] -> terus

=== kira ===
You open the Calculator and enter the RM1,000 price, the flat rate and the 12-month term from the product details. # ui:calc:kos:bayar1000
BayarNanti: That's right, the total is RM1,180 over 12 months. Example calculation: a flat-rate fee of 18% a year, included in the instalments.
BayarNanti: Lots of people like it because the instalments are small and easy to manage 😊
* [That total is more than the cash price. I'll wait and save first.] -> simpan
* [I understand the total. My old phone is broken, so I'll take it anyway.] -> sedar

=== terus ===
You confirm and take the phone home. RM98 goes out this month, plus a processing fee, and next week's food budget gets tighter. # effect:duit:-100 # effect:tekanan:+10 # outcome:hutang
-> END

=== sedar ===
You take the phone knowing the total is RM1,180. That is a clear decision, but the monthly instalment still goes out and your budget gets tighter. # effect:duit:-100 # effect:tekanan:+10 # outcome:hutang
-> END

=== simpan ===
You hold off and start setting aside RM100 a month for the phone. The old phone still works in the meantime. # outcome:untung
-> END
