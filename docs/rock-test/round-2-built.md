# Round 2: what the builder changed (26 Nov 2026)

All 12 items are done; two have parts that could only be checked in code, not on screen (see "Not seen on screen"). Nothing is committed. Every change has a "(26 Nov 2026, round 2)" comment.
Checks: `node rules.test.js` gives 124 passed (121 before + 3 new). `node --check` passes on rules.js, content.js, app.js, grow.js. Every inline script in play.html compiles.
Browser tests ran on the copy at localhost:8090 at 1080x810 (own kids b2a, b2b, b2c, b2d): age 6 morning touch with a fake inbox, age 6 and 8 sandbox, age 12 sandbox, and the app with a faked 4:10pm. The fake clock is cleared.

| # | Item | Status |
|---|---|---|
| 1 | Close the "Not ready yet" loophole | Done |
| 2 | Today goal you can reach today | Done, with a test |
| 3 | Heart goal first in the morning touch | Done |
| 4 | Morning touch flow | Done |
| 5 | Gentler words for 8 and under | Done |
| 6 | Quieter for age 6 | Done |
| 7 | Fire days: danger card first | Done |
| 8 | Bale taps | Done in code; partly seen on screen |
| 9 | Put 10 back | Done, with a test |
| 10 | Designs list | Done |
| 11 | Fair access to the touch | Done |
| 12 | Repair counts | Done, with a test |

## 1. "Not ready yet": done
- play.html `SHEETS.fix` onNo: first says the hurt child's own line (`toOther`). Then a second box: "Grown-up: did they go and really try to make it right?" with "Yes, they tried" or "Not yet". The pull is allowed only after "Yes". "Not yet" says "That's okay. Go and try to make it right when you are ready. The hay can wait."
- `startPull`: when the bale was 'tried', the pearl line is the new `repair.pearlAfter.tried` ("You did your part… Keep being kind. Jesus is working on it too."). It never says "You and X are right again".
- content.js `repair.notReadyYet`: new grownUpAsk, grownUpYes, grownUpNo, notYet. `repair.pearlAfter.tried`.
- Tested in the browser: Not ready yet → toOther shown → grown-up box → Not yet (nothing pulled) → again → Yes → pull armed with the toChild line.

## 2. Today goal: done
- rules.js: new `rowGoal(state)` (nearest wall's lowest row with a space; counts good, hay and empty apart). `autoPlace(state, trayOnly, prefer)` fills the preferred wall first. Test added.
- play.html: `todayGoal` is now "Lay 5 more → the left wall's 4th row is done" with a small bar (`.gbar`). The whole-wall line (`wallGoal`) moved to "This week". `layRest` fills the goal wall first, turns to it and says "Today's goal done! The left wall's bottom row is up." (`rowFull`).
- Tested: age 6 touch with 27 pieces → goal met, camera turned, words shown.

## 3. Heart goal first: done
- js/app.js `openRockNow`: passes `fruit` (name) and `will` (the fruit's `practice`) from `grow.goalToday`. It imports `fruitById` from fruits.js.
- play.html `heartGoal()`: "💛 Growing today: Kindness. Say one kind word to each person at breakfast." It is the top line in `drawTouch` and the first rung of the ladder in the evening.
- Hay line in the touch: ages 6 and 8 see "🌾 1 hay in your front wall. Jesus has forgiven you. Today you can make it right." Age 12 keeps "Put it right today."
- `liveSync`: no "Hay landed in your walls" line in touch mode.

## 4. Morning touch flow: done
- "Say sorry now" on the hay line opens the sorry steps on the first bale of the worst wall.
- The bug is fixed: `sorry()` for age 6 no longer marks it made right. One grown-up tap now ticks only "Say sorry". Making it right is its own step ("With a grown-up: I went and did it", then "We're right again"). `repair.prayedTogether.line` now reads "We said sorry to Jesus together. Jesus has forgiven you. Next: go and make it right."
- `touchTick` never closes while the sorry steps or a grown-up box are open (tested: still open after more than 2 minutes).
- No 90-second bar for ages 6 and 8. It still closes by itself.

## 5. Gentler words for 8 and under: done
- play.html: new `kidWords(t)` (ages 8 and under only) is used in `say`, `toast`, `showNews`, `title`, the Last look lines, the after-fire rows and headline, the saved fire words, and the prop box. It changes "straw" to "hay" and removes "whole house". Capitals are gone: "FELL DOWN" becomes "fell down" and "WILL FALL" becomes "could fall". "Caved in" becomes "fell down", "rubble pile" becomes "Fallen blocks", and "whole house comes down" becomes "the house could fall too". Age 12 is unchanged.
- Age 8 now gets the short danger card (`dangerCard`: `band()<=8`).
- Wall sign (`wallSignMat`, now ages 8 and under): "Could fall", and "1 more hay and this wall falls" (or "👆 Tap a hay bale").
- The `LIVEW.strawHint` fallback now says "hay". content.js `tomorrow.reminder['8']` now uses the gentler age-6 line.
- Tested: an age-8 real fire with 8 hay. The card read "The front wall fell down (8 hay in it)" and "…the house could fall too". The Last look read "hay" throughout. `kidWords` was also checked in node with the fire sentences.

## 6. Quieter for age 6: done
- `goalLadder` for age 6 shows Today, This week (the wall only, no hay words), and "This building" as a bar. It has no Next line and no counts.
- `drawLive`: one "🙏 Pray and tell" button opens the 4 gospel buttons (`ui.prayOpen`).

## 7. Fire days: done
- New `topCards` (used by `drawLive` and `drawDay`): on a fire night with hay, the danger card comes first, then the ladder. Tested at age 8.

## 8. Bale taps: done in code, partly seen
- `tapTarget`: a tap on the space right on top of a bale opens the bale when the tap is nearer the bale.
- Age-12 ring: steadier and stronger, bigger, and a brighter red.
- `showHay(w, one)`: a lone bale zooms to 0.5 (from 0.78). When the turn finishes, it centres on the bale.
- **Not seen on screen:** the browser pane was hidden, so the 3D view barely animated. The near-miss tap, the ring strength and the lone-bale zoom need a look on the iPad.

## 9. Put 10 back: done
- rules.js: new `putBack(state, n)`. It lays fallen blocks only and keeps to the daily limit. Test added.
- play.html `rebuildCard`: "Put 10 back" (or "Put them all back" when fewer are left) sits next to "Build it back". New `putBack(n)`. Tested: 15 → 5, then the button read "Put them all back".

## 10. Designs list: done
- Design picker: a blueprint card has a gold background, a gold picture and a "Blueprint · Let your light shine." tag. When it is open, the line shows its line, verse and fruit (for example "A light for people who are lost. Matthew 5:16 · Goodness").

## 11. Fair access: done
- js/app.js: for ages 8 and under, the "🏰 My building" button also shows when one morning job is left.
- New `rockLateOpen`: from noon to 8pm, if there was no touch today, "🏰 Your morning pieces" shows at the top of the column. It opens `touch=1&late=1`, and the title becomes "🏰 Your morning pieces". The button goes once it is used (`d.rockTouch`).
- Tested at a faked 4:10pm: the button showed for all 3 children. Judah's opened the late touch, and after Done only 2 buttons were left. The one-job-left button was checked in code only.

## 12. Repair counts: done
- rules.js: `pull` keeps `stats.putRightDays`. New `putRightLately(state, 30)`. Test added.
- The ladder shows "Put right this month: 🌾✨ N" when N > 0 (ages 8 and 12; age 6 has the short ladder). The tag and the ladder say "strong", not "good".

## Left or worth raising
- Please check on the iPad: the near-miss bale tap, the age-12 ring, and the lone-bale zoom (item 8).
- `sw.js` VERSION is not bumped.
- One older line (the "★ This week with Jesus" button) uses a raw ★ character. My new lines use \u escapes, because raw characters showed as "â" on this server.
- Not done, because they were not on the list: picture-card variety, a family goal, stickers for blueprints, and the try-out "Your builders laid the rest" wording.
- git: only my 5 files changed (content.js, play.html, rules.js, rules.test.js, app.js). Untracked docs were left alone.
