# id:dompet_minggu0
# type:finance
# family:budget
# concepts:bajet,kecemasan
# contact:Hafiz (Housemate)
# number:011-0000 0210
# hint:Set money aside as soon as it comes in, not after you have finished spending. Emergency fund first, then everything else.
# apa_patut:Divide your money into needs, wants and savings as soon as it comes in. One example split is 50 / 30 / 20, but change it to fit your situation.
# apa_patut:Build an emergency fund first. In this game the target is RM300, money for unexpected things like a broken phone or a surprise fee.
# apa_patut:Open your Wallet and set money aside for Needs, Wants and Savings. Looking at the balance alone isn't enough, you need to know what the money is for.

// English version of the BM file with the same name. Keep the structure, tags and order identical to the BM file.
Hafiz: Oi, let's go mamak for a bit. Teh tarik on me 🍵
Hafiz: How's your budget looking? Me, before I spend anything, I split my money into three parts first, needs, wants, savings.
Hafiz: Needs is food, fares, bills. Wants is bubble tea, games, going out. Savings is money I don't touch.
Hafiz: How do you do it? End of the month is always tight, right?
* [I just spend first. If there's extra, then I save.] -> belanja
* [Show me how to do it in the Wallet.] -> dompet
* [What's an emergency fund? Why do I need one?] -> tanya

=== tanya ===
Hafiz: An emergency fund is money just for unexpected stuff. Phone breaks, laptop needs fixing, a surprise fee.
Hafiz: If you don't have one, you end up borrowing from friends or skipping meals. Super stressful.
Hafiz: To start, a RM300 target is okay already. After that you can add more.
* [Ok, let's set money aside in the Wallet now.] -> dompet
* [Hard to save la. Maybe later.] -> belanja

=== belanja ===
Hafiz: Hmm. The problem is there's never any "extra". Spare money rarely becomes savings if you don't set it aside early.
Hafiz: No worries, your decision. But think about what happens if there's an emergency next week.
* [Fair point. Show me how to split it in the Wallet.] -> dompet
* [It's fine, my money is for spending. I'm okay.]
    You spend as you like all month. Savings stay empty. When your phone suddenly needs fixing, you have nothing to cover it and have to borrow from a friend. # effect:tekanan:+10 # outcome:rugi
    -> END

=== dompet ===
You open your Wallet. Hafiz shows you the three parts, Needs, Wants and Savings.
Hafiz: Start with needs, make sure food and fares are enough for this month. After that, set a bit aside for savings, even if it's small.
Hafiz: One example lots of people use, 50% needs, 30% wants, 20% savings. That's just an example, you can change it to suit you.
* [I'll put some in Savings first until I reach RM300, then think about other things.] -> asing
* [I'll put everything in one part. Easy, just look at the balance.]
    Hafiz: With just one pocket, you won't know what the money got used for. The balance looks big, but really it's already spoken for.
    You leave everything in one part. Two weeks later, the balance is getting thin and you aren't sure where it went. Savings don't grow. # effect:tekanan:+10 # outcome:rugi
    -> END

=== asing ===
Hafiz: Nice. Emergency fund first. Collect that RM300 bit by bit every week, no need for it all at once.
You split your money into its parts and start building an emergency fund. This month you know food and fares are covered, and there's a little saved for the unexpected. # outcome:untung
-> END
