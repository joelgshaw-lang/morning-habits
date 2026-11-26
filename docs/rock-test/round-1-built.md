# Round 1: what the builder changed (26 Nov 2026)

All 8 fix-list items are done. Nothing is committed. Every change has a "(26 Nov 2026, round 1)" comment.
Checks: `node rules.test.js` gives 121 passed (119 before, plus 2 new). `node --check` passes on rules.js, content.js and app.js. Every inline script in play.html compiles.
Browser tests ran on the copy at localhost:8090 at 1080x810: the try-out page, the live sandbox, live with a fake inbox, `touch=1`, and the app at a faked Friday 6:50am.

| # | Item | Status |
|---|---|---|
| 1 | Morning touch | Done |
| 2 | Goal ladder | Done |
| 3 | Hay you can see | Done |
| 4 | Bugs | Done (one could not be reproduced, now guarded) |
| 5 | Fair make-it-right | Done, with a test |
| 6 | Monthly blueprint | Done, with a test |
| 7 | Calm the pile | Done |
| 8 | Gentler words for age 6 and 8 | Done |

## 1. Morning touch: done
- **js/app.js**
  - New `rockTouchOpen` and `rockTouch(id)`.
  - In the morning "All done" branch of `columnHTML`, a "🏰 My building · 1 minute" button shows once a day (`d.rockTouch`) until the morning window closes.
  - New `rock-touch` click case.
  - `openRockNow(id, opt)` adds `&touch=1`.
- **styles.css**: `.rock-touch`.
- **play.html**
  - New `TOUCH` flag. `drawPanel` calls the new `drawTouch`, which shows:
    - "Good morning, name!" and a 90-second bar
    - "New: … / N pieces waiting"
    - the Today goal line only
    - if there is hay: "🌾 N hay in your front wall: put it right today" with a Show me button
    - "Lay them for me" and Done.
  - `touchTick` and `touchClose` save the game and close it after 90 s. If a bale pull is in progress, it waits 15 s more.
  - Hidden in touch mode: the fire buttons (Fire now, Start again), stars (shop), level and city chips, and Recipes. The gospel buttons are not drawn.
  - Tapping a bale still opens the sorry steps.
- **Tested** in the app with a faked Friday 6:50am: Judah all done → button shows → opens touch → Lay them → closed itself after 90 s → button gone.

## 2. Goal ladder: done
- **play.html**: new `todayGoal` and `goalLadder(b, todayOnly)`. It sits at the top of `drawLive`, and also of try-out `drawDay`.
  - **Today:** the wall nearest finished, and what it brings (an animal, or "all walls up").
  - **This week:** the fire day and the hay, or "You have enough pieces to finish".
  - **This building:** good blocks out of all the spaces.
  - **Next:** the next design, and the next 📜 blueprint in N days.
- The tag on the picture now reads "Cottage · 195 good · 4 hay of 223" (`drawBar`).

## 3. Hay you can see: done
- **Top-bar chip.** New `#hayChip`, for example "🌾 4 hay · front + left walls". Amber; ember on fire night; hidden when there is no hay. Tapping it calls `showMeHay`.
- **Show me the hay.** New 3D `showHay(w)` turns to the wall, comes closer, and makes the bales brighter and bigger for 4 s. Taps go worst wall first, then each wall in turn.
- **Bales now glow.** The old glow was added light, which disappeared on white silver walls. That is why it was never seen. It is now a soft ring that blends normally: amber and slow for ages 8 and under, red for 12.
- **The look.** New straw texture: pale straw-yellow with upright stripes (`M.W`). Wood and stubble bales now start from hay-yellow too, with their battens or stalks on top. The tray swatch matches.
- **Arrival words.** "🌾 Hay (rude) landed in your walls…" (`hayWords`, `liveSync`, content.js `live.strawLanded`). Today's chips say "Hay (tantrum)".
- **Finished-building card.** It adds "🌾✨ N hay bales put right in this building" (`runFire` seal).

## 4. Bugs: done
- **Tapping a bale.** `tapTarget` now always returns the bale when it is the first thing hit, or when it sits right behind a glowing extra space. `onBale` already drops the held piece. Tested: holding Silver and tapping a bale opens the sorry steps.
- **"Not tonight".** New `notTonight()` only closes the Last look and goes back to where the child was. `Fire now` remembers that place in `x.lookFrom`. Tested from the morning screen.
- **Tray at "Lay today's pieces".** `applyFull` keeps the tray on at night step `build`. Tested.
- **No auto-laid rubble.** `layRest` calls `R.autoPlace(s, true)`, which lays tray pieces only (new `trayOnly` in rules.js `autoPlace`). Bedtime `endDay` was already tray-only. The 87 pieces the tester saw were their test blocks.
- **Lighthouse twice.** Named blueprints in the design picker now keep "The" and a 📜, and say "Comes in N days".
- **Torch "Not yet".** Could not reproduce: rules and browser both give "Make it" with 1 gold + 1 Joy. As a guard, the recipe sheet now turns the button on whenever the tray has the pieces, and "Not yet" always says what is missing.
- **Animal after a fall.** `animalButton` hides on the "after the fire" step when a wall fell. It also hides when a place was only earned before a fall (`invited >= due`). This also clears the button that stayed after choosing a Lamb.

## 5. Fair make-it-right: done
- **play.html** `SHEETS.fix`: "Not ready yet" now runs `markMadeRight(...,'tried')`, sets `m.right` and `m.tried`, and arms the pull.
- **content.js**: `repair.notReadyYet` (toChild, note) now says the child's part counts.
- **rules.js**: comment only. `markMadeRight` already accepts any label.
- **Test** "fair make-it-right": sorry is needed first, then 'tried' lets the hay be pulled, even with `pullNeedsMadeRight` on. The browser flow was walked end to end.

## 6. Monthly blueprint: done
- **rules.js**: new `CONFIG.designs.monthlyDays: 28`. In `designs()`, named blueprint i also opens on day (i+1)×28. Each design gets `daysToOpen`.
- **Test** "monthly blueprint": bp1 opens on day 28, bp2 on day 56, the six designs still open by finished buildings, and setting it to 0 switches it off.

## 7. Calm the pile: done
- **More than 40 pieces:** `drawTray0` shows a big "Lay the rest for me (N pieces)". Not in the test space, which tops itself up, and not in the morning touch.
- **More than 16 fallen blocks:** "Build it back" comes above the danger card, in `drawLive` and `drawDay`. Tested with 83 fallen.
- **Tray wording:** "Rubble pile" is now "Fallen blocks".

## 8. Gentler words: done
- **Age 6:** the danger card is one line ("N hay in your front wall. You can put it right before the fire.") plus a big "🌾 Show me the hay".
- **Ages 6 and 8:** no "WHOLE HOUSE" anywhere, either in the danger card or at the Last look. Instead: "…would fall down. You can fix it." Also "Fire tonight", "hay" in the wall chips, "Tap a glowing hay bale", and "Say sorry to Jesus".
- **Age 12:** words unchanged.

## Left or worth raising
- `sw.js` VERSION is not bumped (the lead does releases).
- The Next line and the design picker use 📜. A desktop browser drew it as a box; the iPad should draw it fine.
- Not touched, because they were not on the list: the WOBBLY label floating, "…still wobbly" cut off, the dark empty-wall look, 15 of the player's smaller bugs, and the heart reviewer's word changes outside item 8.
- `docs/rock-test/brief.md` was already changed before this round (not by me). Untracked docs were left alone.
