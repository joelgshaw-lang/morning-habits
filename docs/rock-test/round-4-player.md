# Round 4: hands-on player (26 Nov 2026)

Played on :8090 at 1080x810 and 1080x690, with my own kids:
- p4a Judah, 6: sandbox, touch, Tower, then a day-28 Lighthouse blueprint.
- p4b Annabelle, 8: sandbox, touch, Cottage, practice fire, sticker.
- p4c Eliana, 12: live, Barn, a new real day, 2 fires.

New days: `lastDate` moved back. Family app not tested. No console errors. Saves deleted.

## Scores (change from round 3)
1. Morning touch **7** (=): tap-to-lay and "Today's goal done!" are lovely, but on a new real day the tray is hidden (bug 1).
2. Clear goals **7** (=): heart → Today → week → building reads well. The dead end is gone.
3. Seeing hay **8** (+1): hay counted by wall, WOBBLY/LEANING signs, and "Show me".
4. Usability **6** (=): the near-miss is fixed. Tall designs open tiny and dim, and the age-6 pull bale is about 10 px (bug 2).
5. Smoothness **7** (=): a fire takes about 13 s. The bottom message still cuts off with "…".
6. Playability **8** (+1): Sorry tonight → evening sorry → Not ready yet → coach line → pull → Mended is a warm, complete loop.
7. Creativity **5** (+1): the name sign and gem/roof colours help. The special piece gets auto-laid (bug 3), and stickers are tiny dots.
8. Long-term **6** (=): the family landmarks, Mended and the blueprint verse are good. At about 1 sticker per building, the 22 spaces take years.

## Round-3 fixes verified
- **A1 near-miss:** fixed. A tap about 0.6 of a block above the bale with Silver held opened it, and the ring stayed.
- **A3 hay by wall:** works.
- **A5 Lay them for me lays no hay:** works.
- **B no dead end:** works ("Saved for your next building: 12", Say sorry now is the main button).
- **C grace order:** works ("ready to forgive", then after Amen "Jesus has forgiven you. Make it right today.").
- **Sorry tonight (age 6):** works, and shows first in the evening.
- **D coach line:** works.
- **E today's fruit:** works. The heart question works, but only when `fruit=` is in the web address.
- **F tap-to-lay:** works.
- **F name sign:** works.
- **F special piece:** its line shows, but see bug 3.
- **G sticker book and sticking:** works.
- **H family walls:** works ("Our family: 23 walls · next: a lantern at 30"). The City shows a bell, a flag and a sign.
- **I Mended page:** works, with pearls on the ladder.
- **J softer words:** works.
- **A4:** not re-checked.
- **A6 words:** still has "Straw" on the sandbox tray tile at 6 and 8. At age 12, "straw" and "hay" are mixed.

## Bugs
**Must-fix**
1. **New real day = no tray.**
   - Cause: the live catch-up (`nextDay → resetDay`) leaves `x.phase='morning'`. `applyFull` then sets `notray`, and nothing in live mode puts the phase back to `'day'`.
   - Steps: a live kid with pieces is opened the next day (or `lastDate` set to yesterday), with inbox items.
   - Result: the touch says "Tap a piece below…" but there is no tray, and the board says "Tap a piece, then tap a glowing space" with no tray.
   - Fix: set `x.phase='day'` after the catch-up in `liveSync`.
2. **Tall designs (Tower, Lighthouse) open far away and murky**, and "⌂" goes back to that view.
   - Blocks dropped in the touch can't be seen.
   - At the pull step the bale is about 10 px across. "Say sorry now" from the evening card doesn't turn or zoom to it.
   -
3. **"Lay them for me" lays the blueprint special piece into the wall** as a plain block (`c:'special'` ended up in walls), so the child never places it. `autoLay` should skip it.

**Nice-to-have**
4. Name it with the box empty says "The Judah's Tower. Lovely."
5. Hay labels lose capitals: "Hay (shouted at judah)", "unkind to annabelle".
6. After a pull, Today went from "Lay 4 more" to "Lay 5 more": mending feels like going backwards.
7. On a full house, new hay knocked out 2 good blocks ("Fallen blocks: 2") with no fire and no explanation.
8. The sticker is a small dot that is hard to find. It needs to be bigger, with a pop.
9. "2 hay… Jesus has forgiven you" shows when only 1 is forgiven.
10. At 1080x690: the age-12 tray shows 2 rows, "Hide" sits on its own line, and the board shows only the fire title. In the age-8 touch, the hay line is hidden under "Say sorry now".
11. After the fire, the same text shows twice and the bottom one is cut off.
12. Old test saves (p3*, b2*, r2anna, test, judah) are still on :8090 and count toward the family total.

## Top 6 changes
1. Set the phase to day after the live catch-up (bug 1). Otherwise every morning after day 1 breaks.
2. Camera: open close and bright for tall designs. Zoom to today's row in the touch and to the bale at the pull step.
3. Keep the special piece out of autoLay. Offer it in the touch as "✨ Place your lamp room".
4. Make stickers big, with a pop, and add more ways to earn them (a mended hay, or a finished wall).
5. Words: no "The" before a name, keep capitals in hay labels, one word for straw at 12, and "1 of 2 forgiven".
6. At 690 px: put "Hide" in the tray header and pin the hay line above the main button.
