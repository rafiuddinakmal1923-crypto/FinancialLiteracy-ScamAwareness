# id:crypto_naga
# type:scam
# family:investment
# tactics:greed,social,urgency
# concepts:risiko,semak
# contact:CryptoNaga Group
# hint:A legitimate investment can't promise 30% a week. Work out what that is in a year first, and remember that lots of members doesn't make it legitimate.
# apa_patut:Check the company or platform in the Securities Commission (SC) licence holder list and the SC Investor Alert List before giving any money.
# apa_patut:Don't trust high fixed returns, profit screenshots or "slots closing" pressure. All of these are easy to fake.
# apa_patut:If you have already paid, keep the evidence, tell your bank and call NSRC 997 right away.

// English version of the BM file with the same name. Keep the structure, tags and order identical to the BM file.
Admin Naga: Welcome to CryptoNaga VIP 🐉 Syaz added you right, dik?
Syaz: Yup bang! I joined last week 🔥
Admin Naga sends three screenshots of members' "profits".
Admin Naga: Our AI system gives 30% a week, confirm! RM500 capital can become RM650 by this weekend 💰 # flag:greed:30% a week
Admin Naga: So far 500 students have joined, all making profit! Don't get left behind dik. # flag:social:500 students have joined
Admin Naga: Fast dik, slots close tonight at 12! # flag:urgency:slots close tonight
* [Wow, 30% a week? How do they do it?] -> tanya
* [Work out what that is in a year first] -> kira
* [Not interested. I'm leaving the group.] -> keluar

=== tanya ===
Admin Naga: The secret is our AI trading bot. Capital guaranteed safe, we never lose 😎
Syaz: So true! Last week I withdrew RM200, came in straight away.
* [Work out what that is in a year first] -> kira
* [Ok, I'll deposit RM500 now.] -> deposit
* [Hmm, never mind. I'm leaving.] -> keluar

=== kira ===
You open the Calculator and enter their promise, 30% every week. # ui:calc:pulangan:naga30w
You notice the Calculator marks the promise as Too Good To Be True. The yearly return from it is far beyond anything a legitimate investment can guarantee.
Admin Naga: Done counting? Don't think too long, later slots finish 😅
* [Even so, I'll deposit RM500 anyway.] -> deposit
* [The Calculator says it's impossible. I'm not joining.] -> tolak

=== deposit ===
Admin Naga: Solid dik! Transfer RM500 to the CryptoNaga wallet ya.
You transfer RM500. The dashboard shows your profit rising, but when you try to withdraw, they ask for a "tax fee" first. Then the admin blocks you and the group is deleted. # effect:duit:-500 # outcome:scammed
-> END

=== tolak ===
Admin Naga: Aiya, your loss dik, everyone else is already in.
You pay nothing, leave the group and tell your friends to work it out first before believing promises like that. # outcome:safe
-> END

=== keluar ===
Admin Naga: Okay la, but only a few slots left ah.
You leave the group and block the admin's number. Your money stays the same. # outcome:safe
-> END
