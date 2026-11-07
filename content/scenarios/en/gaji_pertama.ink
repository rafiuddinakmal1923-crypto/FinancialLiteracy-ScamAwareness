# id:gaji_pertama
# type:finance
# family:pay
# concepts:bajet,kompaun
# contact:Nurin
# number:011-0000 0320
# hint:First pay is exciting, but decide on your savings first. Emergency fund first, then think about other things.
# apa_patut:As soon as your pay comes in, set aside your savings before spending. Don't wait for what's left at the end of the month.
# apa_patut:Finish your emergency fund before putting money anywhere else. If not, you may have to take money out at the wrong time.
# apa_patut:Small money kept for a long time can grow because returns are earned on earlier returns. Try Time Machine in the Calculator, and remember real rates always differ.

// English version of the BM file with the same name. Keep the structure, tags and order identical to the BM file.
Nurin: Your first pay from Kafe Cempaka came in right?! RM400! 🎉
Nurin: Let's have a big dinner tonight, your treat!
Nurin: Eh, but before that, I just want to ask. Have you thought about what to do with the money? This isn't advice, you decide.
* [Let's go! I'm spending it all, it's my first pay.] -> belanja
* [I'll save part of it first.] -> simpan
* [Work it out first] -> kira

=== kira ===
You open the Calculator and enter an example, RM50 a month from age 19 to 30. # ui:calc:masa:labur50
Nurin: See that? In the example you put in RM6,600 yourself, but the final total is more than that. That's the effect of time, returns are earned on earlier returns.
Nurin: The rate in the Calculator is only an example, real rates always differ and aren't guaranteed.
* [Interesting. I'll save part of it first.] -> simpan
* [RM50 is so small. Nah, I'll just spend it.] -> belanja

=== belanja ===
Nurin: Okay! You deserve to celebrate your first pay. But don't forget the rest of the month.
You treat your friends to a big dinner and buy new shoes. Fun, but RM150 vanishes in a flash and your savings don't grow. # effect:duit:-150 # outcome:rugi
-> END

=== simpan ===
Nurin: Nice. Start with the emergency fund. The target in this game is RM300, enough for unexpected things.
Nurin: I've heard about Amanah Cempaka, a fixed-price fund with lower risk, but not zero risk. For example, returns of around 4% a year, but that's only an example. I'm not saying you should join, I'm just explaining.
Nurin: The most important question, has your emergency fund reached RM300 yet?
* [Not yet. I'll put RM100 in Savings first.]
    Nurin: Nice. Emergency fund first, then other things. The rest can wait.
    You decide to set aside RM100 for Savings (arrange it in your Wallet) and spend the rest of your pay carefully. Your emergency fund gets closer to the RM300 target. # outcome:untung
    -> END
* [It's at RM300. I'll move RM50 to Amanah Cempaka and save the rest.]
    Nurin: If the emergency fund is ready, that's the right order. Remember, this isn't advice. Check the product's details and risks before joining.
    You move RM50 to Amanah Cempaka and decide to set aside the rest for Savings (arrange it in your Wallet). Your emergency fund is ready, so this money isn't for taking out any time. # effect:labur:amanah:+50 # effect:duit:-50 # outcome:untung
    -> END
