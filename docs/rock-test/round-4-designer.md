# Round 4: kids' game designer review, the long-term judge (26 Nov 2026)

Code and simulations only: `livesim7.js` (12 months, 20 children per age and type) and `livesim7b.js` (what-ifs), in the scratchpad. The ages are within about 10% of each other (same size), so the table averages them.

## Scores (change from round 3)

- **Morning touch: 8 (+1).** Tap-to-lay with notes and a chime is a real win. No more dead ends.
- **Goals: 8 (+1).** The Today row is reached 83% (steady), 77–79% (typical) and 65–69% (rough) of mornings,. Full-house mornings (8–23%) now have a goal.
- **Hay: 8 (=).** Hay is now counted wall by wall.
- **Usability: 7 (=).** Two new pages and a naming step. Not tried on an iPad.
- **Smoothness: 7 (=).** "Put 10 back on the front wall" helps.
- **Playability: 8 (+1).** Sticking stickers and tapping pieces in are real play.
- **Creativity: 7 (+1).** Naming, the special piece and stickers. They repeat after 22.
- **Long-term: 7 (+1).** Something new every month for steady and typical children until about month 9. Rough children and long-run families have gaps.

**Touch time.** Tray 8–12 pieces; the row takes 3–4 taps (6–8 at worst). That is **about 30–50 seconds**; a "Say sorry now" morning at 8 or 12 takes 60–80. It closes at 90 seconds (waits during sorry steps). Age 6 uses "Sorry tonight".

## 12-month timeline (round-3 code)

Family = three children of that type. Landmark = drawn / earned (at most 8 are drawn).

| Child | Month | Stickers (total) | Buildings sealed | New designs tried | Designs open | Family landmark | New for the child that month |
|---|---|---|---|---|---|---|---|
| Steady | 1 | 2.4 (first on day 10) | 2.3 | 1.3 | 3 + blueprint 1 | 2 | first building, name sign, first sticker, blueprint 1 + special piece |
| Steady | 3 | 7.7 | 7.7 | 5.7 | 9 | 7 | all 6 designs, Fireplace and the room inside (levels 20/35) |
| Steady | 6 | 15.1 | 15.0 | 9.0 | 12 | **8 / 13** (stopped in month 4) | a blueprint a month, stickers |
| Steady | 12 | 30.2 (**book full in month 9**, then repeats) | 30.1 | 15.0 | 18 | 8 / 27 | blueprint 12 only |
| Typical | 1 | 1.2 (day 15–17) | 1.1 (day 17–20) | 0.2 | 3 + blueprint 1 | 1 | first building, first sticker |
| Typical | 3 | 4.5 | 4.4 | 3.4 | 8 | 4 | Chapel and Lighthouse open, levels |
| Typical | 6 | 8.9 | 8.7 | 7.9 | 12 | **8 / 8** (stops now) | blueprints, stickers |
| Typical | 12 | 17.6 | 17.6 | 14.9 | 18 | 8 / 16 | blueprints, stickers (book full in about month 15) |
| Rough | 1 | **0.3** (first on day 39–40) | **0.2** (first on day 51–61) | 0.1 | 3 + blueprint 1 (can't use it yet) | 0 | name sign, pearl stories (10–19 this month) |
| Rough | 3 | 1.4 | 1.1 | 1.0 | 6 | 1 | first building, first sticker |
| Rough | 6 | 2.9 | 2.5 | 2.5 | about 10 | 2 | about 1 sticker every 2 months |
| Rough | 12 | 5.3 | 5.0 | 4.8 | 17 | 5 | 12 blueprints open, only about 5 ever built |

Pearl stories in a year: 53 / 102 / 150 (steady / typical / rough). Mended keeps only the last 60, so the first ones go by month 5 (rough) or 7 (typical).

## Dead months (nothing new)

1. **A rough child's month 1.** No sticker until day 40, no building until day 51–61; blueprint 1 (day 28) can't be used mid-building.
2. **A rough child, months 4–12.** Each month 15–35% get no sticker, building or level step (age 12 worst).
3. **The family landmark stops.** Full at month 4 (steady family) or 6 (typical, mixed): `buildCity` draws `Math.min(8, fam.pieces)`, yet the line promises "next: a bell at 90". A rough family gets nothing in 50–85% of months.
4. **The sticker book fills up.** Full at month 9 (steady) or 15 (typical); then `stkOf` repeats.
5. **Levels.** Last unlock at night 50 (month 3–4); stars stop at 5 (month 10 steady).
6. **Year 2.** The last blueprint opens on day 336; nothing after.

## Top 6 changes (each about 2 hours)

1. **The landmark keeps growing.**
   - `play.html` `buildCity` (the `Math.min(8, …)` loop) and `LANDMARK`.
   - Pieces 9–16 make a second ring, "the town square" (tree, well, steps, arch, lamps). `famLine` names a real next piece.
2. **Show the month's family challenge, with a grown-up "We did it" tap.**
   - `content.js` `bpExtras[3]` is still never shown. Show it in `drawLive` and the City; store `k.p.challenge[month]`.
   - `rules.js` `familyWalls(list, bonus)`: each done month adds a landmark piece. Fills rough families' months, unlinked to hay.
3. **A wall that fell and stands again counts again.**
   - `rules.js` `fire()`: when a wall is in `falling`, `delete state.build.stood[w]`.
   - What-if, age 8 rough: walls a year 17 → 25, stickers 5.5 → 8.2, first sticker day 39 → 33. Typical: +3%.
4. **Milestone stickers.**
   - 14 of 16 `content.js` `milestones` are unused (Brave, Forgiven, A mender, A rebuilder, In the light…).
   - `rules.js` pushes `{ms: id}` into `state.stickers` in `fire`/`pull`; `play.html` `stkOf` draws them gold with the line.
   - Rough children earn 2–4 in the first weeks: fills month 1.
5. **Sticker book page 2, plus a sticker for the first wall.**
   - `content.js` `seasons.stickers2` (22 garden and animal names); `stkOf` uses it when `n >= 22`.
   - `rules.js` `fire()`: a sticker also at `wallsStood === 1`. Rough month 1: 0.3 → 1.0 stickers.
6. **The Mended page keeps the first story and the full count.**
   - `rules.js` `pull()`: keep `stories[0]` when trimming; add `stats.mendedTotal`. `SHEETS.mended`: "You have made it right 147 times. The first time: …".

## For Joel to decide

- **A "small" size of each design.** The only thing that gets a rough child's first building before day 50.
- **Should rebuilt walls count (change 3)?** I think yes: it rewards building again, which is grace.
- **Should the family goal also count put-right hay?** Helps rough families but risks paying for sorry.
- **Year 2:** bring the 12 blueprints back in a "Year 2" look, or write 12 new ones?
- **Stickers on sealed City buildings.** Not drawn yet.
