# id:kawan_labur
# type:finance
# family:investment
# concepts:risiko,semak
# contact:Kak Sofea
# number:011-0000 0789
# hint:A legitimate investment can go up and down, has fees, and can be checked in the licence holder list. Anything promising sure profit or asking for a cash fee should be checked first.
# apa_patut:Before giving money, check the fund management company in the Securities Commission (SC) licence holder list. Type the official site address yourself, don't click links in messages.
# apa_patut:Also check the SC Investor Alert List for names that have been flagged.
# apa_patut:Pay only licensed companies through official channels, not in cash or to an agent's personal account. Use spare money, not your emergency fund.

// English version of the BM file with the same name. Keep the structure, tags and order identical to the BM file.
// TODO-VERIFY: every rate, fee and licence-check step below against the regulator's public guidance.
Kak Sofea: Hi dik! Kak Sofea here, final-year senior. We're in the same finance club, right 😊
Kak Sofea: I heard you're thinking of starting to invest some spare money. I'm only explaining ya. This isn't advice, the decision is still yours.
Kak Sofea: An example I've looked at, "Dana Ekuiti Cempaka". That's a unit trust. It means many people's money is pooled, then a fund manager invests it in company shares.
Kak Sofea: The unit price goes up and down. Some weeks up, some weeks down. Nobody can guarantee a return.
Kak Sofea: There are fees too. A sales fee when you go in and a management fee every year, for example in the range of 1% to 5%. Those fees are taken whether the fund gains or loses.
Kak Sofea: There's also this "agent" on campus offering quick sign-ups with a cash fee. I don't know who that is.
* [How do I know this fund is legitimate, kak?] -> semak
* [The agent at the cafe offered to sign me up now, just a RM50 fee. I'll pay.] -> ejen
* [Thanks kak, I'll think about it first.] -> fikir

=== semak ===
Kak Sofea: That's the most important question, dik. Don't trust what people say, check it yourself.
Kak Sofea: One, ask for the name of the fund management company and its licence number. A real company will give it gladly.
Kak Sofea: Two, open the website of the national capital market regulator. Type the address yourself, don't click links in messages. Look for the company's name in the licence holder list.
Kak Sofea: Three, check the investor alert list. If the name is there, walk away.
Kak Sofea: Four, payment goes to the company through official channels. If you're told to pay cash or into a personal account, that's a red flag.
Kak Sofea: I've checked, Dana Ekuiti Cempaka is in the licence holder list. But check it yourself too ya, don't just rely on me.
* [Ok kak. I'll put in RM100 first, and leave my emergency money alone.] -> kecil
* [I'll put in RM300, all my emergency savings. It's sure to go up!] -> semua
* [I want to read the brochure first, and decide next week.] -> baca

=== kecil ===
Kak Sofea: I can't say whether that's right or not for you. But it's good you checked first and used money you really don't need this month.
Kak Sofea: Remember, that RM100 can fall below RM100 within a few weeks. That's normal for a fund like this. Don't panic and sell quickly.
You check the fund's name in the licence holder list, then put in RM100 through the official channel. Your emergency money stays untouched. # effect:labur:ekuiti:+100 # effect:duit:-100 # outcome:untung
-> END

=== semua ===
Kak Sofea: Eh dik, wait. Emergency money is for unexpected things, not for a fund whose price goes up and down.
Kak Sofea: If you need money fast while the price is down, you'll have to sell at a loss, plus there are fees. I'm only reminding you, you decide.
You still put in RM300. A week later your phone breaks and you need money quickly. The unit price is down and there are fees, so you only get RM270 back. # effect:duit:-30 # outcome:rugi
-> END

=== baca ===
Kak Sofea: Good, no need to rush. The product brochure lists the fees and risks, read it properly.
Kak Sofea: If anyone says "limited slots, pay today", that's also a sign to stop and check first.
You keep the brochure and decide to choose after checking. Your money stays the same for now. # outcome:safe
-> END

=== fikir ===
Kak Sofea: No worries dik, no need to rush. When you want to know how to check, just message me.
You do nothing for now and your money stays the same. # outcome:safe
-> END

=== ejen ===
Kak Sofea: Wait dik. A RM50 cash registration fee to an agent? I've never heard of a fund like that asking for a fee like that.
Kak Sofea: Payment normally goes straight to the company through official channels. Have you checked whether that agent is licensed?
* [Not yet. But the agent said just RM50, then I can put in any amount. I'll pay.] -> bayar_ejen
* [You're right. How do I check?] -> semak

=== bayar_ejen ===
Kak Sofea: I'm worried, but you decide. Keep the receipt if there is one.
You give RM50 cash to the agent, who says the units will come in three days. They never do, and the number no longer answers. # effect:duit:-50 # outcome:rugi
-> END
