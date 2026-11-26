# Round 4 (final): what the builder changed (26 Nov 2026)

All 10 items are done. Nothing is committed. Every change has a "(26 Nov 2026, round 4)" comment.

Checks:
- `node rules.test.js`: 138 passed (131 before, plus 7 new; 4 old tests updated for the new stickers).
- `node --check` passes on rules.js, content.js and sw.js. Every inline script in play.html compiles. No "magic" anywhere.

Browser tests ran on the :8090 copy at 1080x810:
- b4c: Eliana, 12, live, Tower, touch.
- b4a: Judah, 6, sandbox, touch, day-29 Lighthouse blueprint.
- The try-out.

No console errors. Afterwards I deleted every `rock-live.*`, `rock.inbox.*` and `rock.family` key in that browser, including the old p3/b2/r2anna/test/judah saves. Only `rock-play-v4` (the try-out) is left.

| # | Item | Status |
|---|---|---|
| 1 | Tray hidden on a new real day | Done, tested |
| 2 | Camera fits tall designs; Say sorry now zooms to the bale | Done, tested |
| 3 | Lay them for me skips the special piece | Done, test + browser |
| 4 | Heart must-fix words | Done, tested |
| 5 | Landmark keeps growing | Done, tested |
| 6 | Family challenge + grown-up "We did it" | Done, test + browser |
| 7 | A fallen wall that stands again counts again | Done, test |
| 8 | Milestone stickers, first-wall sticker, page 2, bigger stickers | Done, tests + browser |
| 9 | Mended keeps the first story and the full count | Done, test + browser |
| 10 | Name box, hay capitals, full-house explanation | Done (the explanation only in live mode) |

## 1. Tray hidden on a real new day
- play.html `liveSync`: after the catch-up loop it sets `x.phase='day'`, `x.night='account'` and calls `applyFull()`.
- `liveStart`: an old save stuck in `'morning'` is put back to `'day'` on reload.
- Tested both:
  - lastDate moved back a day, plus 4 inbox items. Result: phase is day, the tray shows, and the line reads "A new day! New pieces: …".
  - A save with `phase='morning'` forced in, then reloaded. The tray shows.

## 2. Camera
- `home()` now fits the building's real height (`ht = Y0 + effH()`) to the camera's view, with a fixed gentle tilt. Wide houses still use `camDist()`, which now only handles width.
- The fog starts beyond the camera (`scene.fog.near/far` follow the distance), so tall designs are no longer dim.
- About the age-12 Tower: the distance went from roughly 75 to 58. The Cottage is unchanged.
- Tested:
  - Tower (12) and Lighthouse blueprint (6) both open filling the picture, top to bottom.
  - ⌂ uses the same `home()`.
- "Say sorry now" (the evening `sorryCard`) and the touch hay-line button (Say sorry now / Make it right today) now call `S.showHay(wall, bale)`.
- New `aimOne`/`aimSlot`: the camera stays on that bale through the redraws in the sorry steps. Before, every redraw called `home()` and lost the bale at the pull step. ⌂ or any view button lets go.
- Tested: the bale ends at the centre of the picture at the pull step, about 55 px across (it was about 10 px).

## 3. Special piece
- rules.js `autoLay` skips `c:'special'`, so "Lay them for me", "Lay the rest" and the night auto-lay all leave it.
- Test added.
- Browser, Lighthouse blueprint: after "Lay them for me" the special piece was still in the tray and in no wall.

## 4. Words
- content.js `grownUpSay`: "…Jesus has forgiven you. {sibling} may need a little more time."
  - It is now run through `fill()` and starts with a capital: "Your brother or sister may need…". Seen in the grown-up box.
- Age-12 hay line:
  - Not forgiven: "Jesus is ready to forgive. Put it right today."
  - Forgiven: "You're forgiven. Put it right today."
  - Seen.
- Mended page (`SHEETS.mended`):
  - It leads with "You said sorry and made it right."
  - What it was about follows in small grey text, e.g. "(shouted at Judah)". At age 6 it is left out.
  - The header reads "You made it right 1 time." / "You have made it right N times."
- `sorryTonight`: "…you can say sorry. Jesus loves you."
- Heart "could wait" words, also done:
  - "Look how Jesus is growing you."
  - `fruitCheer`: "Jesus is growing kindness in you."
  - Button: "Not today".
  - Finished card: "You made it right N times in this building. Love like that is what lasts."
- Heart must-fix 5: `sw.js` VERSION v78 → v79.

## 5. Landmark
- `buildCity` now draws up to 32 pieces:
  - The first ring stays as it was.
  - Pieces 9–16 make a second ring, "the town square": tree, well, lamp post, arch, bird bath, fruit tree, signpost, picnic table.
  - Pieces 17–32 are trees round the edge. All are simple boxes in the one batch.
- `famLine` names the real next piece (`LANDMARK[pieces]`, then "a tree"). After 32 it says "the town square is full ★".
- Tested with 250 walls: all three rings sit on the island.

## 6. Family challenge
- `challengeCard` shows the challenge for the calendar month (content.js blueprint `challenge`; November = Waiting jar).
  - It appears in the evening live panel and the try-out panel, not in the touch.
  - "Grown-up: we did it" asks for a grown-up to confirm, then saves the month.
- Where the month is saved: `localStorage['rock.family']` for the real family. Sandbox and try-out keep it in their own save.
- rules.js `familyWalls(list, bonus)`: each month done adds one landmark piece. "next" is still counted in walls.
- The City has a second sign: "★ 1 challenge done".
- Tested: tap → "next: a flag at 10", and the bell showed in the City.

## 7, 8, 9. Stickers and Mended (rules.js)
- `fire()`:
  - A wall that falls (or a cave-in) clears `build.stood[w]` and sets `build.fell[w]`.
  - The first wall that stands gives a plain sticker. After that, one every 3 walls, as before.
  - A wall that stands again after a fall gives "A rebuilder".
  - The first real (not practice) fire gives "Brave".
  - The first sealed building gives "It lasts".
- `pull()`:
  - The first pearl gives "Forgiven".
  - The first one made right with the other person gives "A mender". "tried" does not count for it.
  - `stats.mendedTotal` is counted. Old saves start from their stories.
  - When the stories pass 60, the first one is kept.
- New `giveSticker`:
  - A plain sticker gets `k`, its place in the book.
  - A milestone sticker gets `ms` and is given once ever.
- play.html:
  - `stkOf` draws milestone stickers gold, with their content.js line.
  - Page 2 is content.js `seasons.stickers2` (22 garden and animal stickers).
  - The book has "⭐ Special stickers", Page 1 and "Page 2: the garden".
  - Stickers are 1.32 wide (they were 0.86), most of a block face, and pop when stuck on.
  - A news card names the special sticker after a fire or a pull.
  - The Mended button and page use the full count, plus "The first time: <date>".
- Tested in the browser:
  - Forgiven and A mender after a pull.
  - The first-wall sticker after a practice fire, with no Brave.
  - Page 2 with 24 stickers.
  - A gold sticker stuck on a block.

## 10. Nice-to-have
- The empty name box gives "Eliana's Cottage. Lovely." (no "The"). Tested.
- Hay labels keep their capitals ("Hay (shouted at Judah)"). Tested.
- Live: when new hay bumps good blocks off a full house, the game says "Your house was full, so the new hay pushed 2 good blocks off. They are in Fallen blocks: you can build them back." Not seen in the browser, because that needs a full house.

## Left, or worth knowing
- The "Straw × 12" label on the sandbox test tray still shows at ages 6 and 8. It is test-only, but not fixed.
- The town square was checked from the City camera only. On the iPad, look at how the third ring sits with a long street of buildings.
- Brave / A rebuilder / It lasts were tested in rules.test.js, not seen in the browser. The fire news shows only the first special sticker if two come at once.
- Not done (Joel's decisions): the "small" design size, a put-right bonus, and counting put-rights in the family goal.
- The grown-up briefing (heart must-fix 6) is a spoken step for Joel.
- I closed one old browser tab (tab-1, from an earlier round) to open my own. My tab was tab-9.
