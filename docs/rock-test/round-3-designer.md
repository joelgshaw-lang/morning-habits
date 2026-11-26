# Round 3: kids' game designer review (26 Nov 2026)

Code reading and simulations only. Scripts are in the scratchpad: `livesim6.js` and `livesim6c.js`. Each row is 15 to 30 children over 180 days, with a touch every morning.

## Scores (change from round 2)

- **Morning touch: 7 (+1).** Heart goal, "Say sorry now" and the late touch are in. Still passive, and a full house ends with "There is no open space right now".
- **Goals: 7 (+1).** The Today row is reached about 4 mornings in 5 (round 2: 1 in 5). But it is tiny (median 3 blocks with 8 to 12 in the tray), and 1 rough morning in 4 has no goal at all.
- **Hay: 8 (=).**
- **Usability: 7 (+1).** Age 6 is quieter; 8 and 12 still long.
- **Smoothness: 7 (=).** "Put 10 back" helps.
- **Playability: 7 (+1).** There is a real daily win now. A rough child still loses a wall every 8 to 9 days.
- **Creativity: 6 (-1).** Nothing new. By month 2 the colours, the 6 crafts and naming at the seal are all used up. The `freeBuild` ideas and the stickers in content.js are never shown.
- **Long-term: 6 (=).** There is no family goal and nothing to collect. Levels stop at night 50; the shop has about 8 things. A rough child has 0 to 0.3 buildings at day 30.

## Pacing (current code)

| Age · child | Days per building | Built by day 30 / 90 / 180 | Wall falls every | Today row reached | House full, nothing to lay | Walls a month |
|---|---|---|---|---|---|---|
| 6 steady | 11 | 2.3 / 7.7 / 15.5 | 61 days | 82% | – | 8.3 |
| 6 typical | 19 | 1.0 / 4.2 / 9.0 | 16 days | 76% | – | 6.4 |
| 6 rough | 41 to 45 | 0.1 / 1.5 / 3.2 | 9 days | 66% | 22% | 4.8 |
| 8 steady | 11 | 2.3 / 7.8 / 15.7 | 62 days | 84% | – | 8.4 |
| 8 typical | 19 | 1.3 / 4.5 / 9.1 | 17 days | 77% | 12% | 6.6 |
| 8 rough | 48 to 51 | 0.1 / 1.1 / 2.8 | 8 days | 65% | 20% | 5.3 |
| 12 steady | 11 | 2.3 / 7.9 / 15.8 | 83 days | 84% | – | 8.3 |
| 12 typical | 18 | 1.1 / 4.5 / 9.0 | 17 days | 78% | – | 6.7 |
| 12 rough | 54 | 0.0 / 1.1 / 2.7 | 9 days | 61% | 27% | 5.3 |

- **Today row reached** counts every morning. With a row to aim at, a rough child reaches it 84% of the time.
- **Why it's missed:** either the tray is empty or runs out (5 to 10%), or the house is full and waiting on hay before the fire (20 to 27% for rough children). A dead end for the child who most needs a win.

**What-if runs (age 8 rough):**

| Option | Days per building | First building done | Buildings in 6 months |
|---|---|---|---|
| Now | 48 | day 41 | 3.2 |
| Small size (rows ×0.8, not ×1.2) | 36 | day 37 | 4.5 |
| Grown-up nod (puts right 60% of hay, not 25%) | 43 | day 41 | 3.4 |
| Both | 32 | day 31 | 4.7 |

- Walls still fall every 8 to 9 days whatever we change (Joel's fire numbers). A typical child on the small size: 13 days, not 19.

**Count walls, not buildings.** A rough child finishes 62% as many walls as a steady child, but only 19% as many buildings. Stickers and the family goal should count walls.

## Month 1 / 3 / 6 / 12 (with the changes below)

- **Month 1:** a first sticker around day 10 to 17, a first family landmark piece around day 15, and a blueprint plus a family challenge on day 28.
- **Month 3:** 5 to 8 stickers, and the landmark is half built.
- **Month 12:** the 22-sticker book is full (steady about 8 months, typical 10, rough 13). Add a second sheet before then.

## Top 6 changes (most important first)

1. **No dead-end mornings.**
   - `play.html` `todayGoal`, `drawTouch`, `layRest`.
   - When `R.rowGoal` is null and the house is full (`R.isComplete`) with hay, Today says "Put right 1 hay → the fire can finish your house ★". "Say sorry now" is the big button.
   - With no hay, it says "Finished! Tonight's fire makes it safe ★".
   - Leftover pieces show as "Saved for your next building: N" (the `carryOverMax` pile), or go into the free-build extras (`R.extraSlots`).
2. **A sticker book earned by walls.**
   - `rules.js`: `stats.wallsStood` (a wall counts when it fills). One sticker per 3 walls from `seasons.stickers` (22).
   - `play.html`: tap a sticker, then a laid block on this building or a City building. Reuse the `decorate` path with a flat plane, which is light enough for the iPad 7.
3. **A shared family goal.**
   - `play.html` `buildCity` and the touch footer: add up `wallsStood` from every `rock-live.*` save.
   - Every 10 family walls adds one landmark piece. That is about one piece a fortnight (about 20 walls a month).
   - The line reads: "Our family: 34 walls · next: the bell at 40". Never rank siblings.
   - Also show the month's blueprint `challenge` (already written in `content.js` `bpExtras`, never shown). A grown-up's "We did it this week" tap adds a landmark piece.
4. **Tap to lay in the touch.**
   - `drawTouch`: tapping a tray tile drops the next block into the Today row (`R.place` at `rowGoal`). A rising note for each block, a chime and a small shake when the row is done.
   - "Lay them for me" stays, as a quiet button.
   - Stretch the goal to what the tray can finish: "Lay your 12 → the left wall reaches row 4", with one chime per row.
5. **The house is theirs from day 1.**
   - The child names it when choosing the design (`pickDesign`), not only at the seal.
   - Show each blueprint's `freeBuild` as one special extra piece the child places.
6. **Raise with Joel: a "small" size of any design, the child's choice.**
   - `rules.js` `designDef` and `chooseDesign(state, id, size)` (rows ×0.8), plus a toggle in the design sheet.
   - With the grown-up nod, a rough child finishes their first building on about day 31, not day 41 (32 days per building, not 48).
