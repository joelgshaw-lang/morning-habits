# Round 1: combined results and fix list (26 Nov 2026)

Testers: hands-on player (round-1-player.md), game designer (round-1-designer.md), psychologist + pastor (round-1-heart.md).

| Goal | Player | Designer | Heart | Average |
|---|---|---|---|---|
| Morning touch | 3 | 2 | 3 | 2.7 |
| Clear goals | 4 | 4 | 4 | 4.0 |
| Seeing your hay | 4 | 6 | 8 | 6.0 |
| Usability | 5 | 6 | 6 | 5.7 |
| Smoothness | 7 | 6 | – | 6.5 |
| Playability | 6 | 6 | 7 | 6.3 |
| Creativity | 4 | 7 | 7 | 6.0 |
| Long-term | 5 | 5 | 5 | 5.0 |

## Kept out on purpose (Joel's own decisions; raise with Joel, don't change)
- "Hey, that is stinky and sad" + flies/hay pile on the front board (Joel asked for it; v78 already plays the voice line only 1 in 4).
- "I prayed" pieces (up to 10 a day, gold/silver/gem) — Joel's v72 design.
- Daily straw cap stays (Joel, 24 Nov). Fire numbers stay (Joel wanted a real cave-in risk); only the words get gentler for age 6.
- Growing bonus (fewer hard moments) stays.

## Fix list for round 1 (builder)
1. **Morning touch (1 minute).** Morning "All done" card in js/app.js gets "🏰 My building (1 minute)" once a day, until the morning window closes. Opens play.html with `touch=1`. New short panel: hello + name, today's new pieces, ONE goal line, "Lay them for me" or place by hand, if straw is in the walls: one line "🌾 1 hay in your front wall: put it right today" with "Show me". No fire, shop or gospel buttons. Saves and closes itself after 90 seconds (or a Done button).
2. **Goal ladder** at the top of the live panel: Today (nearest wall to finish → what it unlocks), This week, This building, Next (design / level). Progress tag counts good and straw apart ("176 good · 3 hay of 223").
3. **Hay you can see:** always-on top-bar chip "🌾 2 hay · front wall"; "Show me the straw" really turns the camera and makes the bales glow (amber for 8 and under, red for 12); straw clearly stripy straw-yellow, never mistaken for gold or wood; arrival words say what it was ("Hay (unkind words)"); the finished-building card celebrates bales put right.
4. **Bugs:** tapping a bale always opens it (drop any held piece; never lays another straw on it); "Not tonight" only closes the panel; pieces must show in the tray when "Lay today's pieces" is asked (check try-out and live); never auto-lay rubble at bedtime (fallen blocks come back only with "Build it back"); "Lighthouse" listed twice in designs; crafts that say "Not yet" while the child has the pieces (Torch: 1 gold + 1 Joy); "first wall finished, an animal can move in" must not show right after a wall fell.
5. **Fair make-it-right:** if the brother/sister taps "Not ready yet", the child's part still counts and they can pull the hay out. Add a rules test.
6. **Monthly blueprint for everyone:** named blueprints also open by time (one every 28 days), not only by finished buildings. Add a rules test.
7. **Calm the pile:** more than 40 pieces waiting → "Lay the rest" becomes the big main button; more than 16 blocks fallen → "Build it back" above the danger card.
8. **Gentler words for age 6:** one-line danger card + "Show me the hay"; no "WHOLE HOUSE would cave in" for 6 and 8.
