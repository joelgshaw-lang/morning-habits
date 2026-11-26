# Round 4 (final): combined results and last fix list (26 Nov 2026)

Reports: round-4-player.md, round-4-designer.md, round-4-heart.md.

| Goal | Player | Designer | Heart | R4 | R3 | R2 | R1 |
|---|---|---|---|---|---|---|---|
| Morning touch | 7 | 8 | 8 | 7.7 | 7.0 | 5.7 | 2.7 |
| Clear goals | 7 | 8 | 8 | 7.7 | 7.0 | 6.0 | 4.0 |
| Seeing your hay | 8 | 8 | 8 | 8.0 | 7.7 | 7.3 | 6.0 |
| Usability | 6 | 7 | 7 | 6.7 | 6.7 | 6.3 | 5.7 |
| Smoothness | 7 | 7 | – | 7.0 | 7.0 | 7.0 | 6.5 |
| Playability | 8 | 8 | 8 | 8.0 | 7.0 | 6.3 | 6.3 |
| Creativity | 5 | 7 | 8 | 6.7 | 5.7 | 6.0 | 6.0 |
| Long-term | 6 | 7 | 7 | 6.7 | 6.0 | 6.0 | 5.0 |

Morning touch: about 30–50 seconds (60–80 with "Say sorry now"); Today row reached 83% / 77–79% / 65–69% of mornings (steady / typical / rough).
Heart verdict: ready for the family to try once the must-fix words are done and the grown-ups have a 5-minute talk.

## Last fix list (builder)
Must-fix
1. **Tray hidden on a real new day:** after a missed day is caught up in liveSync, x.phase is left 'morning' (tray hidden; touch says "tap a piece below" but there are none). Set x.phase='day' in live mode after catch-up (and make sure reload also recovers an old save stuck in 'morning').
2. **Camera:** Tower and Lighthouse open very far and dim; ⌂ returns there. Fit the home view to the building's size. "Say sorry now" from the evening card turns and zooms to the bale (like "Show me the hay").
3. **"Lay them for me" / "Lay the rest" skip the blueprint special piece** (c:'special'), so the child places it.
4. **Words (heart must-fix):** content.js repair.notReadyYet.grownUpSay → "You went and tried. That was brave. Jesus has forgiven you. {sibling} may need a little more time."; age-12 morning hay line gets grace first ("Jesus is ready to forgive. Put it right today." / forgiven: "You're forgiven. Put it right today."); Mended page leads with the repair ("You said sorry and made it right.", what it was about in small grey text, nothing about the hay for age 6; "You made it right 1 time"); morning "Sorry tonight" → "…you can say sorry. Jesus loves you."
Long-term (designer)
5. **Landmark keeps growing:** pieces 9–16 as a second ring ("the town square"); the family line must name a piece that really appears.
6. **Show the month's family challenge** (content.js bpExtras) in the live panel and City, with a grown-up "We did it" tap that adds a landmark piece (rules.js familyWalls counts it).
7. **A wall that fell and stands again counts again** for stickers (rules.js fire(): reset stood for a fallen wall).
8. **Milestone stickers** (Brave, Forgiven, A mender, A rebuilder… from content.js milestones) given in fire()/pull(), drawn gold; **a sticker for the first wall that stands**; sticker book page 2 once the first 22 are earned; stickers drawn bigger than a tiny dot.
9. **Mended page keeps the first story and the full count** (stats.mendedTotal; "You have made it right N times. The first time: …").
Nice-to-have (if quick)
10. Empty name box → default name (not "The Judah's Tower"); hay labels keep capitals ("shouted at Judah"); on a full house, explain when new hay knocks out good blocks.
