# Round 2: combined results and fix list (26 Nov 2026)

Reports: round-2-player.md, round-2-designer.md, round-2-heart.md.

| Goal | Player | Designer | Heart | Avg R2 | Avg R1 |
|---|---|---|---|---|---|
| Morning touch | 6 | 6 | 5 | 5.7 | 2.7 |
| Clear goals | 6 | 6 | 6 | 6.0 | 4.0 |
| Seeing your hay | 6 | 8 | 8 | 7.3 | 6.0 |
| Usability | 6 | 6 | 7 | 6.3 | 5.7 |
| Smoothness | 7 | 7 | – | 7.0 | 6.5 |
| Playability | 6 | 6 | 7 | 6.3 | 6.3 |
| Creativity | 4 | 7 | 7 | 6.0 | 6.0 |
| Long-term | 6 | 6 | 6 | 6.0 | 5.0 |

Still respecting Joel's decisions (see round-1.md "Kept out on purpose"). For Joel to consider (not changed): a "small" size of each design so a rough child can finish within about 2 weeks; a grown-up sits with a 6-year-old on wall-fall nights; the bonus for fewer hard moments vs. a bonus for calming down; watch for "I'll pray to finish my wall".

## Fix list for round 2 (builder)
1. **Close the "Not ready yet" loophole** (play.html SHEETS.fix onNo): a grown-up confirms "Did they go and try to make it right?" (the game's grown-up check) before the pull is allowed; show the hurt sibling their own line (toOther); new words when it's not made up yet (age 8 must not say "You and X are right again" here).
2. **A Today goal you can reach today:** todayGoal = the next row of the nearest wall (good blocks only), with a small progress bar. "Lay them for me" fills that row first, turns the camera to it, and says "Today's goal done!". The whole-wall goal moves to "This week".
3. **Heart goal first in the morning touch:** pass today's fruit and the child's "I will…" from the app's plan (js/grow.js plans / js/app.js openRockNow → URL params) and show "💛 Growing today: Kindness. I will…" at the top of drawTouch. Grace-first hay line: "Jesus has forgiven you. Today you can make it right." In touch mode don't speak the "Hay landed in your walls" line.
4. **Morning touch flow:** "Say sorry now" on the hay line opens the sorry steps; one grown-up tap must not tick both "Say sorry" and "Make it right" (bug); never auto-close while the sorry steps are open; hide the 90-second bar for ages 6 and 8 (keep the auto-close).
5. **Gentler words for 8 and under:** no "whole house", "FELL DOWN", "WILL FALL", "rubble pile", "straw bales"; say "hay" everywhere for 8 and under ("That was a hay moment"); bale label "1 more hay and this wall falls"; age 8 gets the short danger card too.
6. **Quieter for age 6:** goal ladder shows only Today and This week; hay words once (the chip), not three times; "This building" as a bar; the 4 gospel buttons behind one "🙏 Pray and tell" button.
7. **Fire days:** the danger card and "Show me the hay" sit above the goal ladder.
8. **Bale taps:** a tap on or just above a bale always opens it and never lays a piece there; stronger red ring at age 12; "Show me the hay" zooms closer on a single bale.
9. **Faster Build it back:** a "Put 10 back" button (and "Put them all back" when fewer than 10).
10. **Designs list:** the monthly blueprint is clearly different from the base design (e.g. "📜 Lighthouse of Light: Matthew 5:14 · Joy") with its verse and fruit shown; no two entries that look the same.
11. **Fair access to the touch:** for ages 6 and 8 offer it when one morning job is left (or "All done"); a child who misses it in the morning gets "🏰 Your morning pieces" the first time they open the app after school (once a day).
12. **Repair counts:** a "Put right this month: 🌾✨ N" line (own past only); change "good" to "strong" in block counts.
