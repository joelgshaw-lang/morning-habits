# Round 1: kids' game designer review (26 Nov 2026)

Code read only. No browser used, nothing changed.

## Scores

- **Morning touch: 2.** It doesn't exist yet. The building only opens from the Grown-ups page (portal.js). Nothing links the morning "All done" to it.
- **Goal clarity: 4.** In live mode the goal chip is hidden (commissions off). The child sees only "X of Y laid", "Fire in N nights" and a level chip. Nothing says what to aim for today, this week or next.
- **Hay visibility: 6.** The 3D looks differ and the danger card is clear. But straw counts as "laid" in the progress tag, there's no straw count on screen all the time, and "(wood)" never says what wood means.
- **Usability: 6.** Tap a piece, then a glowing space, is simple. The panel is crowded: danger card, rebuild, 4 gospel buttons, candles, animals.
- **Smoothness: 6.** A child who opens every other day finds 100 to 170 blocks waiting in the tray (simulation).
- **Playability: 6.** Fires, props and pulling bales are real choices. But a rough child has straw in the walls on 93% of days.
- **Creativity: 7.** Designs, extra blocks, crafting, colours, decorations and animals.
- **Long-term motivation: 5.** Unlocks come only from sealed buildings. A steady child opens everything in about 10 months, a rough child gets 1 or 2 new designs in 6 months. The "family landmark" is per child, so it isn't shared.

## Pacing (simulation)

The script is `scratchpad/livesim.js`. It copies live mode: pieces arrive the way the app sends them, there's no fire for the first 3 days, and nothing is laid overnight. 20 children per row, 180 days. Every age builds the same size, about 211 to 235 spaces.

| Child | Opens half the days: days per building / a wall falls every | Opens daily: days per building / a wall falls every |
|---|---|---|
| Steady | 11 / 36 to 50 days | 10 / almost never |
| Typical | 18 / 14 to 16 days | 13 / 60 to 70 days |
| Rough | 44 to 52 / 7 to 8 days | 24 to 28 / 13 to 14 days |

- For a rough child, a wall fall loses 20 to 50 blocks.
- Over 6 months: a steady child seals 15 to 18 buildings, a rough child about 3.
- Letting walls stand 3 straw instead of 2 barely helps a rough child (a wall still falls every 8 to 9 days).
- **What helps is a daily chance to put straw right.** Opening every day halves the days per building and halves the wall falls. That's the strongest case for a morning touch.

## Morning touch design (30 to 90 seconds, 7:05 to 7:30)

1. **0 s.** On the morning 🏆 All done! card (js/app.js), a button: **"🏰 Lay my silver (1 minute)"**. It shows until the start-by time plus 15 minutes (7:30), once a day. The morning silver has just been sent, so the child sees their jobs turn into blocks.
2. **2 s.** The building opens on the house. The panel says:
   - "Good morning, Annabelle! New: 4 silver (morning jobs), 8 gems (last night: kind, patient)."
   - One goal line: "Today: 14 more blocks finish the left wall. Then a new animal comes."
3. **5 to 20 s.** **[Lay them]** drops all the new pieces in place, with the animation. Or the child places them by hand.
4. **Only if there's straw:** "🔥 Fire in 2 nights. Front wall: 2 hay (unkind words). Put it right today?" and **[Say sorry now]**.
   - A 10-second sorry prayer gives the bale its pearl mark.
   - "Make it right with them today, then pull it out tonight."
5. **A candle burns down over 60 s.** "Great building! Time for shoes." At 90 s the game saves and closes itself.

There is never a fire, shop, decorations or gospel buttons in the morning.

## Top 6 changes

1. **Morning touch.**
   - `js/app.js`: in the morning all-done branch (`else if (all)`), show the button while it's before the start-by time plus 15 minutes and `!d.rockTouch`. It calls `openRockNow(id,{touch:1})`, which adds `&touch=1`.
   - `play.html`: in `drawPanel`, when the address has `touch`, call a new `drawTouch(b,f)` instead of `drawLive`.
   - `drawTouch` shows: the arrivals from `k.p.arrivals`, the goal line (change 2), a **Lay them** button (`layRest`) and the straw line with sorry (`R.forgive` plus the sorry sheet).
   - It also needs the 60/90-second candle and `tellParent('rock-close')`. No fire button, no sheets.
2. **Goal ladder.** New `goalLines(s)` in play.html, shown at the top of `drawLive`; `drawTouch` uses the Today line only.
   - **Today:** the wall closest to finished, from `R.tally(s,w)`: "N blocks finish the left wall → an animal".
   - **This week:** "Keep straw out until Saturday's fire" (`nightsToFire`), or "Finish by Sunday?" when it's in reach.
   - **This building:** stars still possible (never fell, a window all in one fruit colour, spire).
   - **Next:** "2 more buildings open the Castle" (`R.designs` `sealsToOpen`), or the level's `toNext`.
3. **Hay you can see all the time, without shame.**
   - `drawBar`: a chip "🌾 2 straw · front". Amber while safe, ember on fire night, hidden when there's none.
   - The tag becomes "176 good · 3 straw of 223", so straw no longer looks like progress.
   - In `liveSync`'s "straw landed" words, add `content.js` `straw.kinds[mat].kidWords`: "Hay (unkind words)".
   - The seal card celebrates pearl seams: "3 bales put right ✨".
4. **A monthly blueprint for all.** In `rules.js` `designs()`, named blueprint *i* also opens at (i+1)×28 days since the first building, using the `seasons.blueprints` names.
   - Siblings share that month's blueprint, whatever their behaviour: grace, variety and something to talk about together.
   - Add a test in rules.test.js.
5. **A shared family landmark.** In play.html's city drawing (around line 844), add up `family.stones` and `city.length` from every `rock-live.*` save (skip `grownup-test`).
   - Show "Our family: 23 buildings. Next: a bell at 25." One family target, never children side by side (research).
   - Show the same total in portal.js.
6. **Calm the pile.**
   - `drawTray0`: when there are more than 40 tiles, make **Lay the rest** the big main button.
   - `drawLive`: when the rubble is more than 16, put the rebuild card above the danger card.
   - Leave the fire numbers alone. The lever is daily chances to put straw right (changes 1 and 3).
