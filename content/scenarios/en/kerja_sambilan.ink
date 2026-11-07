# id:kerja_sambilan
# type:scam
# family:job
# tactics:greed,urgency,payfirst
# contact:Kak Mira (HR)
# number:011-0000 0123
# hint:Real companies don't ask you to pay to start a job.
# apa_patut:Check for yourself whether the company is registered before agreeing to anything.
# apa_patut:Don't pay a fee, top-up or deposit to get a job. A real job pays you, not the other way round.
# apa_patut:If you have already paid, call NSRC 997 right away and tell your bank.

// English version of the BM file with the same name. Keep the structure, tags and order identical to the BM file.
Kak Mira (HR): Salam dik 😊 This is Kak Mira, HR from Bintang Digital Sdn Bhd.
Kak Mira (HR): I got your number from the campus group. We're looking for students for online part-time work.
Kak Mira (HR): Very easy job, just like & share product posts on social media. Can earn RM300 a day! # flag:greed:RM300 a day
Kak Mira (HR): No experience needed, can do from your hostel room also 👍
Kak Mira (HR): But only 3 slots left today ah, many already registered. Want me to save one for you? # flag:urgency:only 3 slots left today
* [Interested! How do I start?] -> mula
* [What company is this? Can I check that it's registered?] -> tanya
* [Ignore this message] -> abaikan

=== mula ===
Kak Mira (HR): Ok good! Let me explain the system ya.
Kak Mira (HR): Task 1, like 3 online shop posts, screenshot, send here. Finish and get RM30 straight away.
Kak Mira (HR): Task 2 is a VIP task. You must top up RM100 first, then you get back RM100 + RM160 commission 😍 # flag:payfirst:top up RM100 first
Kak Mira (HR): Quickly ya dik, this VIP task closes at 6pm. # flag:urgency:closes at 6pm
* [Ok, I'll top up RM100.]
    Kak Mira (HR): Thank you dik! I've received it. Commission is being processed.
    Kak Mira (HR): Alamak dik, the system says your account is still level 1. Must pay RM300 to withdraw commission, then can go up to level 2. # flag:payfirst:RM300 to withdraw commission
    Kak Mira (HR): If you don't pay, the RM100 just now can't come out ah.
    * * [Ok la, I'll pay another RM300.]
        Kak Mira (HR): Received. Wait for the system to process in 24 hours ya dik 🙏 # effect:duit:-400 # outcome:scammed
        -> END
    * * [No. Give me back my RM100.]
        Kak Mira (HR): Sorry dik, that's company rules. No upgrade, money can't come out. # effect:duit:-100 # outcome:scammed
        -> END
* [Why must I pay first for a job? I won't pay anything.]
    Kak Mira (HR): Aiya dik, you'll get the money back la...
    Kak Mira (HR): Never mind la, many others want this slot. # outcome:safe
    -> END

=== tanya ===
Kak Mira (HR): Eh no need to check la dik, we're an online company, registration still in process 😅
Kak Mira (HR): You want or not? I can give this slot to someone else.
* [It's okay kak, I'll pass. Thank you.]
    Kak Mira (HR): Ok, your loss dik. Bye. # outcome:safe
    -> END

=== abaikan ===
Kak Mira (HR): Dik? Slots almost full already 😢 # outcome:safe
-> END
