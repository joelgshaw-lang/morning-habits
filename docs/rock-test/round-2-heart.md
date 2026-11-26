# Round 2: heart review (child psychologist + children's pastor)

I read the code and the words only (no browser). Joel's own decisions are respected. My concerns about them are at the end.

## Scores (round 1 → round 2)
- **Morning touch: 3 → 5.** It is short, has no fire and no shop, and closes itself. But its one goal is a building goal ("3 more blocks finish the front wall → an animal"). The child's heart goal for the day (today's fruit) never reaches the building. The shrinking 90-second bar adds a hurry feeling.
- **Clear goals: 4 → 6.** The ladder is clear and honest. All four rungs are about building and performance. None is about the heart.
- **Seeing your hay: 8 → 8.** The amber ring, the stripy hay, the chip and "Show me" are calm and clear. The new risk is that hay is always in view. A child who struggles sees "🌾 4 hay" every time the game opens.
- **Usability: 6 → 7.** The age-6 danger card (one line, one button) is just right. Age 8 still gets the full card: wall chips, "propped up", and "Two ways to save a wall".
- **Playability: 7 → 7.** No change for the heart.
- **Creativity: 7 → 7.** No change.
- **Long-term: 5 → 6.** The monthly blueprint helps a slower child (fairness). Repair is celebrated only when a building is finished. That is too rare at month 3.

## Words to change (current → suggested)
- Touch hay line: "🌾 1 hay in your front wall: put it right today" → age 6/8: "🌾 1 hay in your front wall. Jesus has forgiven you. Today you can make it right." Age 12: keep as it is.
- Ladder "Today: 3 more blocks finish the front wall → an animal can move in" → add a heart line above it: "💛 Growing today: Kindness. *I will let Judah go first.*"
- Ladder "This week: Put right your 2 hay before the fire on Friday" → "This week: 2 hay to put right. Sorry and making it right make your walls strong."
- Tag and ladder "195 good · 4 hay" → "195 strong · 4 hay". "Good" here also counts prayer, which makes prayer a score and makes the child feel "good or bad".
- `showMeHay` with no hay: "No hay in your walls. Well done!" → "No hay in your walls right now."
- `pearlAfter['8']` after a "tried" pull: "You and {sibling} are right again" → this isn't true yet. Add `pearlAfter.tried`: "You did your part. Keep being kind to {sibling}. Jesus is working on it too."
- `straw.forgivenStillBurns` (still shown in the fix sheet): "The bale stays in the wall until you make it right" → "Jesus has forgiven you, all of it. Now go and show love to the person. Then you can pull the hay out."
- Age 8 danger card, practice line: "a wall with this much straw FALLS DOWN" → "…could fall down" (no capitals for 6 and 8). The 3D wall sign "WILL FALL" → "Could fall" for 6 and 8.
- drawNight for 6 and 8: "straw bales will burn", "knocked to the rubble pile" → "hay bales will burn", "will fall off. You can build them back".
- Fallback text `LIVEW.strawHint` still says "straw" → "hay".
- `tomorrow.reminder['8']` (eternity's screen) is still not changed from round 1 → use the age-6 line.

## Risks
1. **A loophole in making it right (most serious).** The confirm box says "For the other person, or a grown-up", but nothing checks who taps. "Not ready yet" now lets the hay be pulled out straight away, so the child who did the wrong can tap it himself without going to the person. Before, that button did nothing. Now it is the easiest way out. The hurt sibling's own line (`toOther`: "You don't have to be ready yet") is never shown, so their hurt gets no voice.
2. **The morning touch can close in the middle of saying sorry.** `touchTick` only waits for an armed pull. A child who taps a bale and is in the middle of the sorry prayer gets "Time for shoes!" and the screen closes. For age 6, that step needs a grown-up anyway, and there isn't time before 7:30.
3. **The hay label first thing in the morning.** `liveSync` is also on in touch mode. Its first spoken line can be "🌾 Hay (tantrum) landed in your walls. Hay can't last in the fire." The child hears last night's failure before hearing grace, and maybe in front of siblings.
4. **A goal ladder that is all performance.** Blocks, animals, stars and designs are fine as fun. But with no heart rung, children learn that Build on the Rock is about filling spaces. The gold and gem meanings (prayer, fruit) fade by month 3.
5. **Fairness of the morning touch.** It only shows after the whole morning is "All done", and before the window closes. The 12-year-old will almost always get it. The 6-year-old often won't, so the building turns into a prize for being fast.
6. **The countdown bar.** It is a visible draining bar for a 6-year-old in the morning rush. It is mild, but it adds pressure we don't need.

## Top 6 changes (most important first)
1. **Close the "Not ready yet" loophole.** In `play.html`, in the `SHEETS.fix` `onNo` handler: before `markMadeRight(...,'tried')`, ask a second `confirmBox`: "Grown-up: did they go and try to make it right?" Pull only on yes. Show `nry.toOther` to the other child. Use a new `repair.pearlAfter.tried` line, not "right again". Add a rules or flow test.
2. **Carry the heart goal into the morning touch.** In `js/app.js` `openRockNow`, pass `&goal=<today's fruit>&goalLine=<I will…>` from the morning plan (`goalToday`). In play.html `drawTouch` and `goalLadder`, show "💛 Growing today: Kindness, *I will…*" as the first line. When the child lays a gem of that fruit, say "That's today's fruit!"
3. **Never close in the middle of sorry.** In play.html `touchTick`: if `ui.sheet && ui.sheet.kind==='fix'`, push `touchEnd` back again and again, or turn the close into a gentle "Finish tonight with a grown-up?" button. Also hide the draining `.touchbar` for ages 6 and 8 (or use a soft "about a minute" dot).
4. **Grace first in the morning.** In play.html `liveSync`: when `TOUCH` is on, skip the `strawLanded` line (the chip and the hay line already show it). Change the `drawTouch` hay line to the grace-first words above. Leave out the kind of hard moment ("tantrum") until the evening panel.
5. **Reward repair often, not only at the end of a building.** In `goalLadder`, add a "Put right this month: 🌾✨ 3" rung when it is more than 0, so the child is compared only with their own past. Change "good" to "strong" in `drawBar` and `goalLadder`.
6. **Fair access and gentler words for age 8.** In `js/app.js` `rockTouchOpen`, also offer the touch for ages 6 and 8 when the morning is "nearly done" (one job left), or let a grown-up open it. In play.html `dangerCard`, give age 8 the short card plus the wall chips only. Add the "could fall" and "hay" word fixes in `drawNight`, `wallSignMat` and the practice line.

## For Joel to consider (his decisions, not changed)
- **Daily straw cap and fire numbers.** At `fallAt 6:2`, one evening with two hard moments can make a wall fall in a 6-year-old's building. Bad weeks will happen. Do the fallen-wall evenings have a grown-up sitting with the child?
- **"Hey, that is stinky and sad" with the hay pile on the front board.** With the hay chip now always on in the game, the child already sees their hay in two places. Is the public pile still needed?
- **"I prayed" pieces (up to 10 a day).** With the ladder now counting "good" blocks to finish a wall, extra prayers now speed up the goal you can see. Watch for "I'll pray to finish my wall" by month 2.
- **The growing bonus for fewer hard moments.** It rewards not falling, not getting back up. A "calmed down" bonus fits the research better and still fits his aim.
