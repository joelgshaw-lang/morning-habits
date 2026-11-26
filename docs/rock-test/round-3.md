# Round 3: combined results and fix list (26 Nov 2026)

Reports: round-3-player.md, round-3-designer.md, round-3-heart.md.

| Goal | Player | Designer | Heart | R3 | R2 | R1 |
|---|---|---|---|---|---|---|
| Morning touch | 7 | 7 | 7 | 7.0 | 5.7 | 2.7 |
| Clear goals | 7 | 7 | 7 | 7.0 | 6.0 | 4.0 |
| Seeing your hay | 7 | 8 | 8 | 7.7 | 7.3 | 6.0 |
| Usability | 6 | 7 | 7 | 6.7 | 6.3 | 5.7 |
| Smoothness | 7 | 7 | – | 7.0 | 7.0 | 6.5 |
| Playability | 7 | 7 | 7 | 7.0 | 6.3 | 6.3 |
| Creativity | 4 | 6 | 7 | 5.7 | 6.0 | 6.0 |
| Long-term | 6 | 6 | 6 | 6.0 | 6.0 | 5.0 |

Today-row goal now reached on 82–84% (steady), 76–78% (typical), 61–66% (rough) of mornings (was ~20%).

For Joel to decide (not built): a "small" size of each design (rough child's first building day 41 → 31 with a grown-up nod); bonus for putting right / calming down instead of fewer hard moments; a grown-up nearby on wall-fall nights.

## Fix list for round 3 (builder), in priority order
A. **Bugs**
1. A tap within one block of a bale always opens it (never lays a piece on/above it); the bale's ring stays visible while a piece is held.
2. A new child whose first piece is hay still gets the design picker (choose design on first open no matter what).
3. Hay counts by wall: "7 hay in the front wall, 5 in the right wall" (not "12 hay in your front wall and more").
4. After a wall falls, Today = "Put 10 back on the front wall" (that wall), not another wall.
5. "Lay them for me" / "Lay the rest" never lay straw (test space bug).
6. "hay" not "straw" anywhere for ages 8 and under (remaining spots); Kind words card picture/words match; the 📜 emoji (shows as a box on some browsers) → use 🏰 or ✨ on blueprint cards.
B. **No dead-end mornings:** when the house is full and waiting on hay, Today = "Put right 1 hay → then the fire can finish your house ★" with "Say sorry now" as the main button; with no hay: "Finished! Tonight's fire makes it safe ★". Leftover pieces: "Saved for your next building: N".
C. **Grace in the right order:** hay line follows forgiven state — not yet: "Jesus loves you and is ready to forgive."; forgiven: "Jesus has forgiven you. Make it right today." Age 6 in the morning: "Sorry tonight" (a flag shown first in the evening panel) instead of opening the sorry steps in the rush.
D. **Coach, not judge** (content.js repair.notReadyYet + SHEETS.fix): ask "Grown-up: did you see them try to make it right?"; show a line for the grown-up to say: "You went and tried. That was brave. Being forgiven can take time."; notYet: "A grown-up can help you try. The hay can wait."
E. **Close the heart loop:** laying a gem of today's fruit says "That's today's fruit!"; the evening live panel asks "💛 Kindness today: did you see it?" — "Yes, I saw it" / "Try again tomorrow" (no penalty; just remembered).
F. **Creativity:**
   - In the morning touch, tapping a tray tile drops a block into the Today row with a rising note; a chime + small shake when the row is done. "Lay them for me" becomes a quiet button. Allow "Place it myself" (glowing spots) too.
   - Name the house when choosing the design (pickDesign), sign shows from day 1.
   - Each blueprint's freeBuild becomes one special extra piece the child places.
G. **Sticker book earned by walls:** rules.js stats.wallsStood; one sticker per 3 walls that stood through a fire, from seasons.stickers; the child places stickers on blocks (reuse decorate path); a sticker book page.
H. **Family goal (never ranked):** add up walls from every rock-live.* save; every 10 family walls adds a landmark piece in the City; show it in the touch footer and City ("Our family: 23 walls · next: a bell at 30").
I. **Remember repair:** pull() saves a short pearl story (date, what the hay was, what they did); a "✨ Mended" page; finished-building card says "3 times you made it right"; age 6 sees "Put right" as pearls.
J. **Softer standing words:** wall sign "1 more hay and this wall could fall in the fire"; heartGoal "I will: …" without "at breakfast"; pearlAfter 12: "Love like that is what lasts."
