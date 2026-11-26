# Round 1: hands-on player (26 Nov 2026)

Played on http://localhost:8090 at iPad size 1080x810, as Judah (6), then Age 12, then the live sandbox (age 8). Five pretend days, one practice fire and one real fire (wall fell), straw put right once, a rebuild, the design picker and the recipe book.

## Scores
1. Morning touch: **3/10**. The morning screen is "Today's three" plus a prayer, then "Amen. Start my day". You look at the house but do nothing with it.
2. Clear goals: **4/10**. The only goal shown is "Cottage · 0 of 223 laid". At about 5 pieces a day that is 6+ weeks, with no closer goal.
3. Seeing your hay: **4/10**. Straw looks like brown wood blocks. I never saw the "red glow". The big WOBBLY/LEANING labels float away from the bales.
4. Usability: **5/10**. Tap a piece, then a glowing space works. But night has about 10 screens, and some steps say "tap a piece" when no pieces are showing.
5. Smoothness: **7/10**. Loads fast, no console errors, fire takes about 10 s. Some waits are confusing (the focus cards take about 3 s to appear under "…"), and the camera jumps after every block.
6. Fun: **6/10**. The wall falling is dramatic and clear. Pulling a bale out slowly is a lovely moment.
7. Creativity: **4/10**. Design, roof and door colour are nice. But "Your builders laid the rest" places most pieces for you, the roof colour can't be seen until the roof is built, and crafts all say "Not yet".
8. Long-term pull: **5/10**. Unlocks exist (Chapel, Castle, animals, furniture at night 10/20/35/50), but they are hidden in Recipes, and the same 3 picture cards come every night.

## Bugs and confusions (exact steps)
1. **Can't lay today's pieces at night.** Night → answer the 3 cards → "Grown-up: Yes, I saw that too". The panel says "Lay today's pieces: tap a piece, then a glowing space", but the only button is "Goodnight" / "Last look before the fire". No pieces panel shows (the tray held 15 pieces). After Goodnight: "Your builders laid the rest: 15 pieces." The child never chose where they went.
2. **A fallen wall rebuilds itself at bedtime.** The real fire showed "The front wall FELL DOWN… In the morning, tap 'Build it back'". I tapped Goodnight and got "Your builders laid the rest: 87 pieces", and the wall was full again (223 of 223) with straw in it. The 83-block rubble pile was still there too. The fall means nothing.
3. **"Not tonight" ends the day.** In the morning, "🔥 Fire now" → "Not tonight" jumped straight into the bedtime "Tomorrow / Which one will you build with tomorrow?" screens.
4. **Tapping a bale adds more straw.** With Straw still selected, tapping the "red glowing bale" laid a second straw (WOBBLY → LEANING) instead of opening the sorry steps. Tapping a bale should always open the bale.
5. "Show me the straw" says "The red glowing bales are straw". No bale glowed red in the picture, and the camera didn't move to the bale.
6. "Your first wall is finished. An animal can move in!" pops up right after "The front wall FELL DOWN". After choosing Lamb, the "🐑 Someone wants to move in!" button stays.
7. Design list shows **"Lighthouse" twice** (after 4 and after 8 buildings).
8. An empty build shows a huge dark grey tower behind the floor. It looks like a finished wall that isn't yours.
9. Kind words look-back card: the pictures show "Sharing and kind / Keeping it all", but the sorry prayer says "I said hurtful words". Sharing is not words.
10. After "Make peace" was the focus, a tray tile was named "Make peace × 1" among the fruit names.
11. The header said "My focus today: Kind words" at bedtime, before the next day had started. The nights counter went up before Goodnight.
12. Recipes: Torch "Needs 1 gold + 1 Joy" shows "Not yet" while I hold Gold ×12 and Joy ×6 (sandbox). It gives no reason. The header says "0 nights", but Recipes says "1 night checked".
13. After pulling a bale, the message was cut off: "…It is safe now, but still…".
14. Some blocks tapped on the outer edge go into "extras", so the "laid" count doesn't go up.
15. In the sandbox, the child can place Straw from the tray. In real play, straw is supposed to land by itself.

## What a 6-year-old couldn't do
- Read the fire panel. It is a wall of text ("every 3 blocks = 1 more straw", "Prop up the right wall (6 blocks)").
- Find their straw without a grown-up.
- Do the bale pull (500 ms slow drag) without a hint arrow. My first quick drag said "Too fast. It slipped back."
- Cope with "If it came now, the WHOLE HOUSE would cave in! 187 blocks fall". That is scary, after 4 straw made 83 blocks fall.
- Understand "223 laid" as a goal.
- Age 12 gets the same teddy cards and the same cottage. It feels babyish.

## Top 6 changes
1. **Morning touch (app.js + play.html).** After "Amen. Start my day", show one 20-second step. Last night's new pieces wait in a small tray, and the child taps a glowing space for 1 to 3 of them, then "Done". Pieces not laid stay put; drop "Your builders laid the rest". On fire mornings, this step becomes: "Tonight: N straw. Tap one to put it right."
2. **Fix the night tray bug, and never auto-lay rubble (play.html).** At "Time to build, then bed", show the My pieces panel. Rubble only goes back through "Build it back", by the child's hand.
3. **Closer goals (rules.js + play.html).** Replace "0 of 223" with "This week: finish the front wall (12/40) → a Lamb moves in". Show a strip of 3 next rewards (wall → animal, roof → see your roof colour, house → stars + next design). Raise the 5-a-day rate, or shrink the first cottage, so the first wall is done in about a week.
4. **Make hay obvious (play.html).** Give straw a bright straw-yellow, stripy, rough look, unlike gold. Add a steady orange glow pulse and a small 🔥 marker right on each bale. Pin the WOBBLY label to its wall. "Show me the straw" should turn the camera to each bale in turn.
5. **Tapping a bale always opens the bale (play.html).** Unselect pieces when a bale is tapped. Block Undo on straw. Fix "Not tonight" so it only closes the sheet.
6. **Gentler fire for little ones (rules.js + content.js).** For ages 6 to 8, a fall drops only the straw rows plus the blocks just above them (not 83). Use short 1-line panels: "🔥 3 straw. Tap one to fix it." Drop the "WHOLE HOUSE cave in" wording for ages 6 to 8. Add age-12 look-back cards with pictures for that age.
