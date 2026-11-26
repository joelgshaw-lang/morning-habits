# Round 3: what the builder changed (26 Nov 2026)

All of groups A to J are done. A few small parts are left (see "Left or worth raising"). Nothing is committed. Every change has a "(26 Nov 2026, round 3)" comment.

Checks: `node rules.test.js` gives 131 passed (124 before + 7 new). `node --check` passes on rules.js, content.js and app.js. Every inline script in play.html compiles. play.html has no raw emoji in new code: they are `\u` escapes, because raw ones showed as "ðŸ" on this server.

Browser tests ran on the copy at localhost:8090 at 1080x810, with my own kids b3a (Judah, 6, live and touch), b3b (Annabelle, 8, sandbox touch) and b3c (Eliana, 12, sandbox), plus the try-out. No console errors. Test saves were deleted afterwards. I used no fake clock.

| Group | Item | Status |
|---|---|---|
| A1 | Tap near a bale opens it; ring stays while a piece is held | Done |
| A2 | Design picker even when the first piece is hay | Done, with a test |
| A3 | Hay counted wall by wall | Done |
| A4 | After a wall falls, Today = put back on that wall | Done, with a test |
| A5 | Lay them for me never lays straw | Done, with a test |
| A6 | "hay" for 8 and under everywhere; Kind words card; 📜 | Done |
| B | No dead-end mornings | Done |
| C | Grace in the right order; Sorry tonight for age 6 | Done |
| D | Coach, not judge | Done |
| E | Today's fruit; evening heart question | Done |
| F | Tap to lay in the touch; name the house; blueprint special piece | Done |
| G | Sticker book earned by walls | Done, with tests (book on this building only) |
| H | Family goal | Done, with a test (no grown-up "We did it" tap) |
| I | Remember repair: pearl stories, Mended page | Done, with a test (not in the weekly review) |
| J | Softer standing words | Done |

## A. Bugs
1. **Near-miss tap.** `tapTarget` has a new first check: when the tap hits nothing or a glowing space, the nearest bale wins if it is closer than 0.72 of one block on screen (at least 26 px). "One block" is measured on screen, so it works at any zoom. Ring sprites have `renderOrder=7`, so they draw after the glowing spaces.
   - Tested at age 6 with a held silver: a tap about 30 px above the bale opened it. A tap a full block above laid the silver on the space above (that is still allowed, on purpose). The amber ring stayed visible while silver was held.
2. **Design choice.** rules.js has a new `canChooseDesign(state)`: true when the building is empty, or holds only hay. It is false once a good block is laid or a bale has been put right (a pearl seam), which also fixes round-3 player bug 9. `chooseDesign` moves the hay into the new walls. play.html uses it for first open (`liveStart`), the design sheet, the "Choose your design" link and the design button.
   - Tested: a new kid whose first inbox item was hay got the picker, chose Tower, and the hay was still there.
3. **Hay by wall.** New `hayByWall(s)` gives "7 hay in your front wall, 5 in your right wall". It is used by the touch hay line and the age 6/8 danger card.
4. **Fallen wall first.** New `fellWall(s)` and a `todayGoal` branch: "Put 10 back on the front wall", with a bar. The touch shows a big "Put N back on the …" button. `putBack` passes that wall as `prefer` (`R.putBack(state, n, prefer)`).
   - Tested in the age-8 try-out after a front-wall fall. "10 more today" now reads "You can put back 10 more today."
5. **No straw from Lay them for me.** `autoLay` skips straw in the tray. Test added.
6. **Words.**
   - `kidWords` also lowers "ONE", turns "it will fall" into "could fall", and fixes "stubble hay".
   - New `kidPanel()` runs every text line of the panel through `kidWords` for ages 8 and under, so no spot is missed. Tested: the age-8 night panel shows no "straw".
   - content.js: the `kind` card is now "Be kind / My words and my hands help, not hurt", and its sorry prayer matches the sharing pictures.
   - 📜 is now 🏰 on blueprint cards and in the ladder.

## B. No dead-end mornings
- `todayGoal`, when the house is full: "Put right 1 hay → then the fire can finish your house ★" (or "… today (3 to go)"). The sorry step becomes the big button. With no hay: "Finished! Tonight's fire makes it safe ★".
- The touch shows "Saved for your next building: N" (up to `carryOverMax`). `layRest` on a full house says the pieces are saved.
- Tested at age 8, both cases.

## C. Grace in the right order
- `touchBale` picks a forgiven bale first.
  - Not forgiven: "Jesus loves you and is ready to forgive. Today you can make it right." The button is "Say sorry now", or "Sorry tonight" at age 6.
  - Forgiven: "Jesus has forgiven you. Make it right today." The button is "Make it right today".
- "Sorry tonight" sets `k.p.sorryTonight`. The evening `drawLive` shows it first (`sorryCard`), with "Say sorry now". The flag clears once the bale is forgiven.
- Tested end to end at age 6.

## D. Coach, not judge
- content.js `repair.notReadyYet` changes:
  - `grownUpAsk` is now "Grown-up: did you see them try to make it right?"
  - New `grownUpSay`: "You went and tried. That was brave. Being forgiven can take time." It shows in the grown-up box and is said after Yes.
  - `notYet` is now "A grown-up can help you try. The hay can wait."
- The confusing line now reads "The other person (or a grown-up): are things right again between you?"
- Tested.

## E. Close the heart loop
- New `fruitCheer` runs in `layAt`, the touch tap and `layRest`. It says "That's today's fruit! Kindness grew."
- New `heartAsk` in the evening panel: "💛 Kindness today: did you see it?" with "Yes, I saw it" or "Try again tomorrow". The answer is only remembered in `k.p.heartLog`. Nothing is given.
- Tested.

## F. Creativity
- **Tap to lay in the touch.** `pickTile` in TOUCH calls `touchDrop`, which lays the piece into the Today row.
  - Each block plays a rising note (`noteUp`). A finished row plays a chime and a small canvas shake.
  - "Place it myself" switches to glowing spaces. "Lay them for me" is now a quiet button.
  - Tested: 4 taps finished the row, and the shake class was set.
- **Name the house.**
  - "Done" in the design sheet asks "What will you call your building?" The suggestion is "Judah's Kindness Tower" (`nameHouse`, stored in `k.p.bname`).
  - A name sign on a post shows by the house from day 1. At the seal the name goes to the City without asking again.
  - Tested: the sign showed.
- **Blueprint special piece.** Choosing a blueprint puts one "✨ <freeBuild>" piece in the tray (`c:'special'`, gold frame and light). It goes onto a block like a craft. Switching design removes it. Tested on day 28.

## G. Sticker book
- rules.js changes:
  - `fire()` counts each full wall that stands, once per building, in `stats.wallsStood` (event `wallStood`).
  - Every 3 walls pushes a sticker into `state.stickers` (event `sticker`).
  - New `placeSticker` and `stickerSlots`. A sticker goes on any good laid block, never straw, one per block.
  - `ensure` adds defaults for old saves. Two tests added.
- play.html changes:
  - "🌟 Sticker book" (`SHEETS.stickers`): 22 spaces from `seasons.stickers`, earned ones with a picture.
  - "Tap to stick it on" shows glowing blocks, and a tap sticks it.
  - The sticker is drawn as one flat plane (`stickerOn`, one draw call).
  - After a fire: "🌟 A new sticker!"
- Tested: a real sandbox fire with 3 full walls gave a sticker. Placing one worked, and the picture showed on the block face.

## H. Family goal
- rules.js: new `familyWalls(list)`. Test added.
- play.html changes:
  - New `famWalls()` adds up `wallsStood` from every `rock-live.*` save. It reads them once per page and skips test-space saves (`DB.sandbox`).
  - The line "🏡 Our family: 23 walls · next: a bell at 30" shows in the touch, the evening panel and the try-out.
  - The City landmark gains one piece every 10 walls (bell, flag, lantern, flower bed, fountain, gate, bench, star), all simple boxes. It also gets an "Our family: N walls" sign.
- Tested: 36 walls showed 3 pieces and the sign.

## I. Remember repair
- rules.js: `pull(state, w, c, r, opt)` saves a story in `state.stories` with the day, date, what the hay was, and whether it was mended or tried. It also adds to `build.mended`, which a sealed building keeps as `rec.mended`.
- "✨ Mended" page (`SHEETS.mended`): newest first, with a line for a grown-up to read aloud. Age 6 sees pearls.
- The finished-building card says "3 times you made it right in this building."
- The age-6 ladder shows "✨ Put right: ⚪⚪".
- Tested: a pull made a story, and the Mended page and pearls showed.

## J. Softer words
- Wall sign for 8 and under, on two lines: "1 more hay and this wall / could fall in the fire".
- `heartGoal`: "I will: say one kind word to each person." It drops "at breakfast".
- `pearlAfter['12']`: "…Love like that is what lasts."
- `propBox` "ONE" is lowered by `kidWords`.

## Left or worth raising
- **Joel's choices, not built:** the "small" size, a put-right or calm-down bonus, and a grown-up nearby on wall-fall nights.
- **Near-miss tap:** a tap clearly on the space above a bale (a full block up) still lays there, on purpose, so children can build up. Please try the near-miss on the iPad.
- **Stickers:** they go on this building's blocks only, not on City buildings. A sealed building's stickers are not drawn in the City; the book still lists them as "Stuck on". On side walls, I checked the sticker by its draw call only. The front-face picture was seen.
- **Family goal:** there is no grown-up "We did it this week" tap, and the month's blueprint challenge text is still not shown.
- **Mended stories:** not yet in the weekly review sheet.
- **Not on the list, still there:** the sandbox touch shows "106 pieces waiting" and "999999 undos left". The same 3 picture cards show nightly. "Your builders laid the rest" is still in the try-out.
- `sw.js` VERSION is not bumped.
- **git:** only content.js, play.html, rules.js and rules.test.js changed. Untracked docs were left alone.
