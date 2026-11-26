# Round 4: heart review (child psychologist + children's pastor)

Final round. Code and words only (no browser). Read: round-3-built.md and `git diff d7c79cb..5d5163e`. Joel's decisions respected.

## Verdict
**Yes, ready for the family to try on the iPad**, after four small word fixes (below) and a 5-minute talk with the grown-ups. The order is now right: Jesus loves you and is ready to forgive → say sorry → forgiven → make it right → pearl. Nothing ranks the children. The stickers are small, and they go on the building, so they don't push the heart aside.

## Scores (round 3 → round 4)
- **Morning touch 7 → 8.** Grace comes first in the hay line. "Sorry tonight" keeps a 6-year-old's sorry out of the 7:20 rush. Tap-to-drop with rising notes is quick and joyful.
- **Clear goals 7 → 8.** No more dead-end mornings. The heart goal now closes in the evening ("did you see it?") with nothing paid. That is right.
- **Seeing your hay 8 → 8.** "7 hay in your front wall, 5 in your right wall" is clear. "Could fall in the fire" is softer. The age-12 line is missing grace (see must-fix 2).
- **Usability 7 → 7.** The touch now holds a lot for a 6-year-old: heart goal, new pieces, ladder, hay line, family line and 3–4 buttons. Watch whether Judah reads any of it.
- **Playability 7 → 8.** The chime and shake when the row is done is a good, small win.
- **Creativity 7 → 8.** Naming the house, the sign from day 1, stickers he places himself and the blueprint's special piece.
- **Long-term 6 → 7.** The Mended page is the best heart feature yet: it remembers repair, not failure. Family landmarks add a shared goal. Both need a grown-up to use them (weekly review, Sunday dinner) or they will fade by month 3.

## Theology and age check (new lines)
- **Fire tests the work, not the child.** "Gold, silver and gems last through the fire" and "Your walls stood" are both about the building. Good.
- **Forgiveness free, making right is love.** Right in the touch line for 6 and 8, and in `pearlAfter`. One coach line blurs it (must-fix 1).
- **Family walls.** "🏡 Our family: 23 walls · next: a bell at 30" shows one sum and never splits it by child. The count never goes down when a wall falls. Safe.
- **Stickers for walls.** Fine. They are small, cosmetic and placed by the child, and a rebuilt wall can still earn one later, so a child with hard evenings is delayed, not shut out. Don't add more reward layers: gold, silver, gems, stars, animals, blueprints, stickers and landmarks is already plenty. From here, the parent's spoken praise does the work.
- **Sibling comparison.** None in the new words. The Mended page belongs to one child. Keep it that way.

## Words to change (current → suggested, file)
1. content.js `repair.notReadyYet.grownUpSay`: "You went and tried. That was brave. Being forgiven can take time." → "You went and tried. That was brave. Jesus has forgiven you. {sibling} may need a little more time." (A 6-year-old can hear "forgiven takes time" as Jesus being slow.)
2. play.html `drawTouch` hay line, age 12: "Put it right today." → not forgiven: "Jesus is ready to forgive. Put it right today."; forgiven: "You're forgiven. Put it right today."
3. play.html `SHEETS.mended` story card: "Hay (unkind words): you said sorry and made it right." → "You said sorry and made it right." with "(unkind words)" in small grey text after it. For age 6, leave out what the hay was. (Love "keeps no record of wrongs", 1 Cor 13:5. This should be a book of mending, not a list of sins.)
4. play.html `SHEETS.mended` header and the finished-building card: "Once you made it right." → "You made it right 1 time." ("Once you…" reads like the start of a sentence.)
5. play.html `sorryTonight` say(): "Tonight, with a grown-up, you can say sorry to Jesus. He loves you." → "Tonight, with a grown-up, you can say sorry. Jesus loves you." (The evening steps include saying sorry to the brother or sister too. The morning words should match.)
6. play.html `SHEETS.mended` grown-up line: "Look how you've grown." → "Look how Jesus is growing you." Also "Look how you are growing." → "Look how Jesus is growing you."
7. play.html `fruitCheer`: "That's today's fruit! Kindness grew." → "That's today's fruit! Jesus is growing kindness in you." (This matches the evening answer.)
8. play.html `heartAsk` button: "Try again tomorrow" → "Not today". (The reply, "That's okay. Tomorrow is a new day, and Jesus will help you.", already gives hope. A child shouldn't have to label their own day a failure.)
9. play.html finished-building card: "That is what makes it strong." → "Love like that is what lasts." (It matches `pearlAfter` and doesn't credit the child's effort for the strength.)

## Must-fix before the family tries it
1. Coach line "Being forgiven can take time" (word 1).
2. Grace in the age-12 hay line (word 2).
3. Mended cards lead with the repair, not the wrong. No hay label for age 6 (words 3 and 4).
4. "Sorry tonight" words match the evening steps (word 5).
5. Practical: bump `sw.js` VERSION. Otherwise the iPad may keep the old version, and the family tests round 2.
6. A grown-up briefing (spoken, not code): the child can tap the grown-up check, a grown-up should be nearby on wall-fall nights, and they should read one Mended story aloud each week.

## Could wait
- Words 6–9.
- Mended stories in the weekly review sheet (the builder didn't add them).
- A grown-up "We did it this week" tap for the family goal.
- A simpler age-6 touch: hide the family line and "Place it myself" for 6.
- Warmer City sign: "Our family built 30 strong walls together."
- Mended entries older than about 2 months show only the date and the repair.

## For Joel to consider (your decisions, not changed)
- **A bonus for putting right or calming down**, instead of (or as well as) the growing bonus for fewer hard moments. Stickers now reward walls that stand, which also leans toward "fewer hard moments". The research says to reward recovery.
- **A family pearl jar.** Count put-rights in the family goal, not just walls. That makes repair the thing the family celebrates together, at Sunday dinner.
- **Fire numbers and the straw cap.** These are your call. A grown-up nearby on wall-fall nights matters most for Judah.
- **"I prayed" pieces.** Watch for "I'll pray to finish my row" now that the row has a chime.
- **"Hey, that is stinky and sad"** on the front board, next to the new gentle grace lines. Do both voices fit together for a 6-year-old?
