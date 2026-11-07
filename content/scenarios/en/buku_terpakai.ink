# id:buku_terpakai
# type:legit
# family:marketplace
# tactics:
# contact:Farhan (Junior)
# number:011-0000 0615
# hint:Real buying and selling usually means meeting in a public place, in daytime, and paying when you get the item. No deposit and no link.
# apa_patut:Buying and selling used things is safest in a public place in daytime, with cash or payment after you receive the item. No deposit, no strange links.
# apa_patut:If in doubt, check the person through a faculty group or a friend who knows them. Don't refuse straight away without checking.

// English version of the BM file with the same name. Keep the structure, tags and order identical to the BM file.
Farhan (Junior): Assalamualaikum. I'm Farhan, a Year 1 junior at the Business Faculty. I saw you selling your Introduction to Accounting book in the faculty group.
Farhan (Junior): Is it still available? I'd like to buy it for RM50 like you posted.
Farhan (Junior): Can we meet at the library counter tomorrow at noon? I'll pay cash right when I pick up the book. No deposit or anything.
* [Sure. See you at the library counter tomorrow at 1.] -> jumpa
* [I don't know you. Let me ask in the faculty group first.] -> semak
* [Don't bother replying. Could be a scammer.] -> abai

=== jumpa ===
Farhan (Junior): Great! I'll come at 1 with the cash.
The next day you meet Farhan at the busy library counter. Farhan flips through the book, hands you RM50 in cash, and you hand the book over. Done in a minute. # effect:duit:+50 # outcome:safe
-> END

=== semak ===
Farhan (Junior): Sure, no problem. Go ahead and ask.
You ask in the faculty group. Kak Wani, the final-year rep, replies, "Farhan is one of our juniors, a good kid."
* [Okay, see you at the library counter tomorrow in the daytime.]
    Farhan (Junior): Great. See you tomorrow at 1.
    You meet Farhan at the busy library counter. Farhan pays RM50 in cash and takes the book. You checked first and chose a safe place. # effect:duit:+50 # outcome:safe
    -> END

=== abai ===
You don't reply at all and delete the message. Farhan waits a few days, then buys the book from someone else. Your book is still on the shelf and the RM50 is gone. # missed:50 # outcome:curiga
-> END
