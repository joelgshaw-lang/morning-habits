# Round 3: heart review (child psychologist + children's pastor)

Code and words only (no browser). Joel's decisions respected; concerns at the end.

## Scores (round 2 → round 3)
- **Morning touch 5 → 7.** Heart goal first, grace-first hay line, no draining bar for 6/8, "Your morning pieces" after school. But "Jesus has forgiven you" shows before sorry, and "Say sorry now" can hold the touch open in the 7:20 rush.
- **Clear goals 6 → 7.** The reachable row and "Today's goal done!" suit 6 and 8. The heart rung is never closed in the evening.
- **Seeing your hay 8 → 8.** Calm and clear. "1 more hay and this wall falls" is a standing threat for 6/8.
- **Usability 7 → 7.** The grown-up check is one quick tap; its wording sounds suspicious.
- **Playability 7 → 7.** No heart change.
- **Creativity 7 → 7.** Blueprints with verse and fruit are lovely.
- **Long-term 6 → 6.** "Put right this month" is right, but age 6 never sees it and nothing remembers *what* was put right.

## Words to change (current → suggested)
- play.html `drawTouch` hay line (6/8): "Jesus has forgiven you. Today you can make it right." → not yet forgiven: "Jesus loves you and is ready to forgive. Today you can make it right." Already forgiven: keep. (The sheet's first step is "Say sorry"; "forgiven" first confuses a 6-year-old. 1 John 1:9.)
- play.html `drawTouch` button "Say sorry now" → forgiven: "Make it right today"; age 6 not forgiven: "Tonight with a grown-up".
- play.html `heartGoal`: "…Kindness. Say one kind word to each person at breakfast." → "…Kindness. I will: say one kind word to each person." (Breakfast is often over by the touch; "I will:" makes it a promise. It is the fruit's set step, not the child's own words.)
- content.js `repair.notReadyYet.grownUpAsk`: "did they go and really try…" → "Grown-up: did you see them try to make it right?"
- content.js new `repair.notReadyYet.grownUpSay`: "Say: 'You went and tried. That was brave. Being forgiven can take time.'"
- content.js `repair.notReadyYet.notYet`: "Go and try to make it right when you are ready." → "A grown-up can help you try. The hay can wait."
- play.html `wallSignMat` (8 and under): "1 more hay and this wall falls" → "1 more hay and this wall could fall in the fire".
- play.html `propBox`: "for ONE fire" → `kidWords` lowers "ONE" for 6/8.
- content.js `repair.pearlAfter['12']`: "That is what lasts." → "Love like that is what lasts."

## Risks
1. **Forgiveness out of order.** "Forgiven" before confessing can teach that sorry is optional. Keep: sorry → fully forgiven; make it right → the *work* is mended; the child's worth never changes (1 Cor 3:15).
2. **Sorry in the rush.** `touchTick` now waits while the fix sheet is open (good), but a 6-year-old's sorry needs a grown-up and a sibling. At 7:22 it is either late or shallow.
3. **The child can tap the grown-up check.** No PIN; I would not add one (too slow), but parents should know. `toOther` is spoken; if the sibling is not in the room it goes nowhere.
4. **Heart goal with no ending** fades by week 3.
5. **Age 6 misses the repair count**, though the youngest usually has the most hay.
6. **Siblings.** Fair access now looks good. Watch the always-on hay chip at a shared table.

## Top 6 changes (most important first)
1. **Grace in the right order.** play.html `drawTouch`: words and button from the bale's `pc.forgiven` (see above). Age 6 in the morning: don't open the fix sheet; set a "sorry tonight" flag shown first in the evening panel.
2. **Close the heart loop.** play.html `liveSync`: a gem of today's fruit says "That's today's fruit! Kindness grew." Evening `drawLive`: "💛 Kindness today: did you see it?" → "Yes, I saw it" (within existing gem caps) or "Try again tomorrow" (no penalty).
3. **Coach, not judge.** content.js `repair.notReadyYet` new words; play.html `SHEETS.fix` onNo shows `grownUpSay` in the second `confirmBox`.
4. **Remember repair (month 3–6).** rules.js `pull`: save a short "pearl story" (date, hay in kid words, what they did). play.html: a "✨ Mended" page; show 1–2 stories in the weekly review sheet for the parent to read aloud ("Remember when you said sorry to Judah? Look how you've grown"); finished-building card: "3 times you made it right."
5. **Age 6 gets the repair count.** play.html `goalLadder` six branch: "✨ Put right" as pearls when N > 0.
6. **Softer standing words.** `wallSignMat`, `kidWords` "ONE", `heartGoal` "I will:", `pearlAfter['12']`.

## For Joel to consider (his decisions, not changed)
- **Fire numbers and straw cap.** With the sign counting down, a hard evening feels like a near miss all week. Is a grown-up there on wall-fall nights?
- **"I prayed" pieces.** The row goal can be finished fast with extra prayers. Watch for "I'll pray to finish my row".
- **Growing bonus.** It rewards not falling, not getting up. A "put right" or "calmed down" bonus fits the research and grace.
- **Family moment.** All three children's put-rights filling one family pearl jar, celebrated at Sunday dinner, would reduce competing and keep repair alive at month 6.
