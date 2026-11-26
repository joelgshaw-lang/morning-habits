# Round 2: kids' game designer review (26 Nov 2026)

I only read the code and ran simulations. I didn't use the browser or change anything. The simulation script is `scratchpad/livesim4.js`. It copies live mode, adds a morning touch every day ("Lay them for me", plus a small chance to put hay right), and an evening open on the same share of days as round 1. It ran 30 children per row for 180 days.

## Scores (change from round 1)

- **Morning touch: 6 (+4).** It's in the right place (the button appears after "All done") and the right size (90 seconds, no fire, no shop). Three problems:
  - The "Today" line can only be reached on about 1 morning in 5.
  - The button disappears at 7:30, so a child who finishes late never sees it.
  - "Put it right today" has nothing to tap except "Show me".
- **Goal clarity: 6 (+2).** The ladder is there and reads well. But "Today: 22 more blocks finish the left wall" is really a 2-to-3-day goal. "This building: 195 of 223 good" is too big a number for a 6-year-old. The Next line is dense.
- **Hay visibility: 8 (+2).** The chip, stripy straw, glow, "Show me the hay" and arrival words like "Hay (rude)" all work. For age 6, hay now shows 3 times on one screen: the chip, the This week line and the danger card.
- **Usability: 6 (=).** The ladder was added on top of an already long live panel (danger card, rebuild, mortar, design, review, chips, 4 gospel buttons, candles, animal, fire).
- **Smoothness: 7 (+1).** With the touch, the median tray is 8 to 12 pieces (it was 100+ for children who skipped days). "Lay the rest" and "Build it back" first help too.
- **Playability: 6 (=).** A rough child still loses a wall every 8 to 9 days and takes about a month to finish their first wall.
- **Creativity: 7 (=).** Nothing new to make or decorate this round.
- **Long-term motivation: 6 (+1).** The monthly blueprint means every child has about 10 to 12 designs open by month 6. Before, a rough child had 1 or 2. But a blueprint is a base design grown by a row. Its verse, fruit and `seasons.stickers` are never shown. There is still no shared family goal.

## Pacing (morning touch every day)

| Age · child | First wall done (days into a building) | Days per building | Buildings in 6 months | A wall falls every | Tray at the touch | "Today" goal size | Today goal reachable |
|---|---|---|---|---|---|---|---|
| 6 steady | 9 | 11 | 15.5 | 59 days | 9 | 24 | 24% |
| 6 typical | 13 | 19 | 9.1 | 16 days | 12 | 21 | 21% |
| 6 rough | 29 | 42 | 3.5 | 8 days | 8 | 18 | 16% |
| 8 steady | 9 | 11 | 15.8 | 60 days | 8 | 24 | 24% |
| 8 typical | 13 | 18 | 9.2 | 16 days | 12 | 22 | 21% |
| 8 rough | 34 | 52 | 2.8 | 8 days | 8 | 17 | 17% |
| 12 steady | 9 | 11 | 15.8 | 73 days | 8 | 24 | 23% |
| 12 typical | 13 | 18 | 9.3 | 17 days | 12 | 23 | 21% |
| 12 rough | 35 | 53 | 2.6 | 9 days | 12 | 15 | 19% |

Designs open at day 30 / 90 / 180: steady 5 / 9 / 12, typical 4 / 8 / 12, rough 4 / 6.5 / 10.

**What the touch changes:**
- **Steady children:** the touch adds no speed, but walls fall less often (every 40 days before, about 60 now). Pieces are laid every day, so the hay is seen sooner.
- **Rough children:**
  - The touch barely helps, because forgiven hay still burns (`fire()`), and a pull needs a grown-up's "made right".
  - I tested a quick grown-up "made right?" nod inside the touch for an age-8 child.
    - Rough: days per building go from 52 to 40, and walls fall every 10 days instead of 8.
    - Typical: walls fall every 24 days instead of 16.
  - That nod is the biggest lever left.

**Gap to watch:** a steady child seals a building about every 11 days, a rough child about every 50. By month 3 the rough child has blueprints they will never finish.

## Month 1 / 3 / 6

- **Month 1:** good. Each child gets a new design, a first animal and the first 📜 blueprint on day 28.
- **Month 3:**
  - A steady child has about 30 buildings and has seen every base design.
  - The blueprints feel like "the same house, taller".
  - There's nothing to collect beyond the buildings themselves, and nothing the family builds together.
- **Month 6:** a rough child has about 3 buildings and has had a wall fall around 20 times. It needs a smaller win and a shared win.

## Top 6 changes (most important first)

1. **A "Today" goal that can be done today.**
   - File and function: `play.html` `todayGoal(s)`.
   - When the tray has enough pieces for the nearest wall, keep today's line.
   - Otherwise aim at the next unfinished row of that wall. A row is 5 to 9 blocks, and the tray is 8 to 12. For example: "Lay your 9 pieces → the left wall's 3rd row is done ✓".
   - Count only good blocks.
   - In `drawTouch`, after "Lay them for me": turn the camera to that wall (`showHay`-style turn, gold glow) and show "Today's goal done!".
2. **Let the morning hay line really put something right.**
   - File and function: `play.html` `drawTouch`.
   - The hay line gets "Say sorry now". It opens the sorry steps on the first bale of the worst wall, then shows a grown-up nod: "Was it made right? 👍" (`R.markMadeRight`).
   - The pull can wait for the evening.
   - The simulation shows this cuts rough-child wall falls by about 20% and building time by about 25%. Fire numbers stay the same.
3. **Make the age-6 panel quieter.**
   - In `play.html` `goalLadder`, for `band()===6` show only Today and This week. Skip the hay words in This week when `dangerCard` already shows.
   - "This building" becomes a small bar, not "195 of 223".
   - In `drawLive`, put the 4 gospel buttons behind one "🙏 Pray and tell" button for age 6.
4. **Catch late finishers.**
   - File and function: `js/app.js` `rockTouchOpen`.
   - If the touch was missed (finished after 7:30), the first open after school starts with the same touch panel ("Your morning pieces"). Use `d.rockTouch` unset plus a `touch=late` flag.
   - Rough children, who finish late most often, need this most.
5. **Make the monthly blueprint mean something.**
   - Files: `play.html` design picker and `goalLadder` Next line.
   - Show the blueprint's `line`, `verse` and `fruit`, for example: "📜 The Bridge: peacemakers. Build a blue (peace) window in it → a sticker".
   - Award one of `content.js` `seasons.stickers` per blueprint finished, kept in a sticker row in the City. This gives a collection for month 3 to 6.
6. **A shared family goal** (carried over from round 1, still not built).
   - File: `play.html`, city drawing near the landmark (line ~856). Add up the sealed buildings and bales put right from every `rock-live.*` save.
   - Show "Our family: 23 buildings · next: a bell at 25". Show it in `portal.js` too.
   - It's one family target, never siblings ranked. It gives a rough child a win their brother or sister helps carry.

*(Worth raising with Joel, not built: let any child pick a "small" size of any design, one row shorter, so a rough child can finish something within a fortnight. The fire numbers stay unchanged.)*
