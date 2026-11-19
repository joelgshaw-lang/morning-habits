# Morning Habits app: status

Updated 17 Nov 2026.

## Where it's up to
- Live on GitHub Pages: Fruit time (3 fruits a day, this/not pictures, stars, quiz, pick your own fruit), Going up! night with the stay-in-bed bonus next morning, start by 7:15, −20 if asked, fair board, PIN every time, 3-minute grown-up cutoff, 🔊 voice chooser, kinder farm selling. Rules summary: README.md "Current rules".
- Not yet checked on the real iPad. Joel is checking the next morning (open the app twice so the update loads).
- Farm animals are now Sticker Plus (babies, happy/hungry/sleepy moods), plus 12 new friends live: Aussie Island Mates (bush egg, wombat burrow, gum tree, bush paddock) and Rock Pool Crew (rock pool, rock pool egg, jetty). They make no money. Preview: docs/farm-art-preview.html. Watch for slowness on the iPad farm (each animal uses a white-edge filter).

## Next
1. Joel's iPad check of Ready, set, go → Fruit time, and Going up! at night. Fix what he finds.
2. Joel to decide (docs/review-round3.md "For Joel to decide"): −20 for under-7s, 3-minute timer restarting on taps, farm money, farm visits per day, mine time, daily fire, speed bonuses, hand actions (Peace, Gentleness, Goodness "Thumbs up"), adding a 5-year-old.
3. LATER list in docs/review-round3.md: only the right child can tick their column, redraw Peace and Faithfulness pictures, rebuild animals in Sticker Plus (3 first as a test), hide the PIN from the public code.

## Farm revamp: painted, build-your-own farm (16 Nov 2026)
- **Updates (16 Nov, v47):** the app version shows tiny in the bottom-right corner of every screen and in Grown-ups → 🔓 Farm & mine, with an **Update now** button there. The app also checks for updates when it comes to the front and every 30 minutes. Joel's iPad was still on the old version (no 'New painted farm' row) after v46 went live; cause not proven (my own browser with an old copy updated fine; no iPad simulator on this Mac without Xcode). Best lead: v46 and v47 made the update wait for all 69 farm pictures in one all-or-nothing download. **v48** installs from the 23 app files only and fetches the pictures afterwards. If the iPad still doesn't update, next questions: does Grown-ups show the 🔊 Voice tab (added 16 Nov 14:30)? Is the iPad on Wi-Fi? Never delete and re-add the home screen icon (it wipes the kids' data).
- **Live since 16 Nov 2026 (app version v46), but off** until a grown-up switches it on: Grown-ups → 🔓 Farm & mine → New painted farm. Off = the old farm exactly, nothing lost.
- **v49 (16 Nov, Joel's notes after seeing it on the iPad: "looks pretty good"):** a one-time free set-up of the whole farm (Grown-ups can give it again), and animals that stroll a little.
- **What's in:** painted paddock with every building, decoration and all 31 animals painted; animals in groups with a number; 🔨 Build mode with daily moves (3 on a job day, 1 otherwise, 8 on Saturday); garden beds with carrots, wheat and sunflowers that grow on job days. Rules and numbers: README "Current rules".
- **Tested** in a browser at iPad size with pretend farms (a full Dream Farm and a starter farm): moving, planting, picking, feeding, switch on and off. **Not tested** on the real iPad, or on an old iPad (uses a newer layout feature with a simple fallback).
- **Not built yet:** the tiny daily shop (3 offers), zoom on a very full farm, moving several things at once on Build Day, wool showing on painted sheep.
- **For Joel to decide:** crop prices and bed limits (README), moves per day, whether hungry animals need a clearer sign on the field.
- Mockup and source pictures: docs/farm-mockup/ (prompts and the cut-out script are in source-art/). Mockup page: https://claude.ai/artifact/SiSorWLPCDnHS5pmCxUUV5
- **Next:** Joel opens the app twice on the iPad (so v46 loads), switches the painted farm on in Grown-ups, and tries it. Fix what he finds.

### Painted farm: full screen, zoom, bigger land, pigs (17 Nov 2026, app v51, live with v52 on 18 Nov)
- **Built:** ⛶ full screen button (✕ to go back, farm time shows in the corner); zoom with ➕ / ➖ or pinch, drag to look around; works in Build mode (a drag never drops something). Land you can buy: Bigger land (13 squares a side) and Biggest land (16); everything keeps its square, new land is added at the front; a "Getting crowded!" button appears when the farm is more than half full. Pigs: piglet → pig that finds truffles 🍄. Pig pictures made with the same picture-maker and style reference as the other animals (`farm-art/a-pig.webp`, `a-piglet.webp`; sheet, prompt and the green cut-out script in `docs/farm-mockup/source-art/pigs*`, `cut_out_green.py`). They match well. Moods work like the other painted animals (💤 / 🍽️ bubble), there are no separate mood pictures.
- **Tested** in a hidden Chrome window at iPad size (1080×810) with a pretend full Dream Farm and a starter farm: full screen in and out, zoom buttons, pinch, drag, building while zoomed and full screen, set-up mode, tapping animals while zoomed, buying both lands (all 30 pieces on the same squares), buying piglets (room limit works), painted farm off (old farm fine, pigs show, no piglet/land in its shop) and back on (nothing lost). No console errors.
- **Not tested:** the real iPad 7 (pinch feel, speed when zoomed on the 16-square land), and opening the farm as a child (tested through Grown-ups).
- **Committed** (checkpoint `9a39329`), **not pushed**. Build on the Rock files left alone. To put it live: push, then open the app twice on the iPad.
- **For Joel to decide:** Bigger land 🪙 400 + ⭐ 40 (from Big Farm), Biggest land 🪙 900 + ⭐ 90 (from Dream Farm). Piglet 🪙 120 + ⭐ 12 (from Barnyard), feed 🪙 2, a truffle (🪙 15) every second job day, sells for 🪙 100, up to 2 pigs (4 with the big barn). Pigs are painted-farm only in the shop.

### Look-and-feel cleanup (19 Nov 2026, app v55, LIVE)
- Three reviewers (kids' view, visual design, grown-ups' view) looked at 8 screens at iPad size. Changes made from what they agreed on:
  - **Columns:** fixed the morning overlap (Fruit time and the small tiles sat on the big tile); small tiles stay on one line; removed the "Do it, then hold here" hint; white columns; one footer style; farm lock words short ("🔒 Farm after jobs"); the egg/farm line only shows in the daytime.
  - **Parent coins button** in each column's top corner: "🪙 ±" when nothing waits, otherwise the waiting points (green +, red −), counting claimed jobs and front-board moments.
  - **Header:** one 🛏️ Last night button (morning, while any child is due) instead of one per column; "Dinner done"; no wrapping; time bar just says "Start by 7:15"; the separate 🌙 Check coins button is gone; the Grown-ups badge counts everything waiting.
  - **Grown-ups home:** each child's card lists everything waiting (jobs they say they did, front-board moments) with ✓ Yes / ✕ No, so the night check is one screen. "Open ›" goes to the child.
  - **Child page:** no duplicate balance, no reason chooser (plus = "⭐ Bonus", minus = "↩️ Taken off"), 🔔 asks only when there were some, last 3 coin changes, Lock button gone (Done locks).
  - **🪙± sheet:** closes after logging a moment; amount starts at 2 each time.
- **Not done (ideas from the reviewers, for Joel):** a drawn gold coin instead of the 🪙 emoji; fewer emoji in headings; flat colours instead of gradients on the night cards; clearing ~300 lines of unused styles; folding 🔔 into the 🪙± sheet; a smaller extra-jobs grid for Judah.
- **Tested** in a browser at iPad size (morning, night, Grown-ups home and child page, ✓ Yes from the home card). Not tried on the iPad.

### Front-board coins, Build on the Rock in the app, whole-farm zoom (18 Nov 2026, app v54, LIVE)
- **🪙± on each column** (no PIN): pick 🪙 1/2/5 and a good or hard moment; ⏳ shows until the night check (🌙 Check coins in the header at night, PIN, or on the child's Grown-ups page). ✓ Keep = coin change (never below zero) + a Build on the Rock piece: gem for good, stubble / hay / wood for hard. Code `js/quick.js`.
- **Build on the Rock live mode:** 🏰 Open building on each child's Grown-ups page opens `docs/rock/play.html?live=1&kid=..&name=..&age=..` full screen. Real days (3am start), save `rock-live.<kid>`, pieces from `rock.inbox.<kid>` (gold = prayer timer, silver = morning / night routine done, gems and straw = kept front-board moments). Missed days catch up with at most one fire owed. Pretend tools hidden in live mode. 105 rules tests pass.
- **Also includes** the free-building rules change from the "Build on the Rock game redesign" chat (blocks up to 2 spaces outside the outline, rules.js 9:03pm 18 Nov).
- **Whole farm zooms** (the painted ground now zooms with the animals). **Grown-up farm visits** get 3 minutes too.
- **Tested** in a browser at iPad size: adding / removing moments, night check keep and drop, straw arriving in Eliana's building (hay and wood), Close back to the board, zoom, grown-up farm timer. **Not tested:** real iPad 7 (3D speed), a grown-up farm running out of time, kids' first look. Wood straw may need a stronger colour; age 6 gets at most 2 straw a day (extra hard moments still cost coins but give no straw).

### Singing and Keyboard timers (18 Nov 2026, app v53, LIVE)
- **Built:** Music is replaced by 🎤 Singing and 🎹 Keyboard, 7 minutes each, for all three children (settings upgrade v12 swaps them in on the iPad, same place in the list). Tap to start, tap to pause; the job ticks itself at 7:00. Keyboard keeps counting for +🪙 1 a minute from 8 to 15, stops itself at 15:00, or ⏹ Stop. Morning only. Code: `practiceTileHTML` / `checkPractice` in `js/app.js`, bonus in `dayCoins` (`js/family.js`), saved on the day as `practice`.
- **Tested** in a browser at iPad size with a pretend 6:45am: Music swapped out, timer starts, ticks at 7:00, keeps going after a reload, Stop works, auto-stop at 15:00, coins right (keyboard 15 min = 2 + 8 bonus).
- **Not tested:** the real iPad (screen staying awake while practising, sound of the voice lines).
- **Note:** a 7 + 7 minute practice plus other jobs is tight before the 7:15 start-by / 7:30 window close.

### Simpler app: mine gone, one farm, simpler Grown-ups (18 Nov 2026, app v52, LIVE)
- **Mine removed** (mine.html and every link to it: the ⛏ button on the farm, jobs and prayer feeding it, grown-up "Open mine"). The kids' old mine saves are left untouched on the iPad (nothing deleted).
- **Painted farm is the only farm.** The on/off switch is gone. The old farm's drawing code is still in `js/farm.js` but unused (safe to clear out later).
- **Grown-ups:** opens on a big card per child (coins, jobs waiting to check, times asked today). Tap a child: 🐔 Open farm, jobs they say they did, give or take coins, tick a job, fruit. ⚙️ Settings holds night / morning / extra jobs, voice, and App (update, farm set-up again, Build on the Rock try-out).
- **Tested** in a browser at iPad size: child cards, a child's page, +5 coins, ticking a job (coins added), back, all five Settings pages, opening a farm from Grown-ups (painted farm, no mine button). **Not checked:** the real iPad; the offline-update file (this test browser can't run it; its file list was checked by hand).
- **Build on the Rock** goes into each child's page later, once it's finished and tried on the iPad (Joel's choice).
- **Audit list for Joel to choose from:** see the 18 Nov chat; top items: one night bonus instead of six, drop "Dinner's finished", one morning time rule, one way to do extra jobs (and delete the 4 unused "Another helpful job" tiles), drop the children's farm codes, one-tap 🔔 asks, one kind of prayer, less clutter in each column.
- **Live since 18 Nov 2026** (pushed with the 17 Nov farm changes; the live site shows v52). Next: Joel opens the app twice on the iPad, then tries Grown-ups and the farm.

## Build on the Rock: replacing the mine (17 Nov 2026)
- **Plan approved by Joel** (full text: `~/.claude/plans/i-would-like-you-nifty-valiant.md`, Design v4). Play is between Minecraft and Jenga: real life gives pieces (gold = time with God, silver = faithful work, gems = fruit seen, straw = work that can't last, pearl = forgiven). Straw is built into the wall and can be put right. Fire nights: holes (small), a wall falls (3 straw), cave-in (a second wall falls while one is cracked). Sealed buildings join the City on the Rock.
- Scored by three reviewers over three rounds: 7.5 to 7.7 overall. Two sub-scores of 7 had fixes added but not re-scored.
- **3D mock-up, first pass:** `docs/rock-mockup.html` (Three.js loaded from the web for now; pretend data; seven scenario buttons; drag to turn). Checked in a browser: loads with no errors, "Shaky" and "Wall falls" play. Not checked: the other five scenarios by eye, or the real iPad 7.
- Look Joel wants: chunky block houses with glowing lanterns and gems (his reference pictures), one building on its own small island, foundation stone carved "Jesus Christ".
- **Nothing in the live app has changed.** The mine is still in place.
- **Next:** Joel's notes on the mock-up look. Then: make it playable (tray, tap to place a piece, slide the straw out by finger), richer house detail (windows, roof shapes, lanterns), sound, then try it on the iPad 7 with the kids. Expert skills from GitHub get added only with Joel's yes.

### Build on the Rock: update later on 17 Nov 2026
- **Playable mock-up published:** https://claude.ai/artifact/DKhPV5voynTTa3ULhSiZqq (files: `docs/rock/play.html`, `rules.js`, `content.js`; scenes-only page is `docs/rock-mockup.html`, https://claude.ai/artifact/VTPfT1Ed5nxLr5eDoeyfZ5). Played end to end in a browser by the builder agent; not tried on the real iPad.
- Two chats were building at once (this one and a fork). The fork has stopped; its cut-gem look and tuning findings were taken. Continue in the main chat only.
- Joel's extra instructions (given in the fork): gems are the main block with a cut-gem look; kids choose where good pieces go, straw lands by itself; lose a block or two every couple of days, real cave-in risk, not constant collapse; adjust per child so a rougher child isn't left behind. Gospel: sharing gives a lamp and a seed; someone coming to Jesus starts a neighbour's island that grows a stone per prayer.
- **In progress when the usage limit hit:** the rules agent was retuning `rules.js` to those loss targets and adding a fairness layer. `rules.test.js` had one failing test ("cave-in grace") mid-change. Check `node rules.test.js` passes before republishing. The published page still carries the older, gentler rules.
- `content.js` was merged (gospel, straw cards, breath prayers, weekly check, act-matched praise) after the published version; republish to pick it up.
- **Next:** confirm rules tests pass and read the retune numbers; republish play.html with the new rules.js and content.js; send to three play-test reviewers for scores (playability, motivation, month after month, character change); then Joel and the kids try it on the iPad 7.

### Build on the Rock: end of 17 Nov 2026 (stopped early, Joel low on usage)
- **Playable game, version 3 published:** https://claude.ai/artifact/DKhPV5voynTTa3ULhSiZqq (`docs/rock/play.html` + `rules.js` + `content.js`). Loads with no errors; page script parses; 60 rules tests pass.
- **Reviews of the earlier version scored 5 to 6.5** (hands-on tester, game designer, psychologist + pastor). Their fixes were built in three rounds:
  - Rules (finished, tested, simulated 240 days): windows need three gems in a line and go dark when knocked; goal card per building; spire dare (stake for the steady child); stars to spend; night auto-lay (no hoarding); practice first fire; 10 named blueprint shapes over a year; streets and family landmark; garden lamp + named seed for gospel shares; extra mortar (fairness) capped at 2 straw and shown openly; rubble 2 a day.
  - Words (finished): pastor's rewrites, new cards (say something mean, late chores), shorter morning, rebuilt night account, repair lines, commissions, fade-plan flags.
  - Page round 2 (finished, browser-tested by the builder): wrong-slot tap bug fixed (72/72), Left/Front/Right/Centre views, slow pull enforced, straw as dull thatch, matched praise, three-tap morning, new night account, repair needs "We're right again", PIN on grown-up tools.
  - **Page round 3 was stopped part-way** (wiring the new rules into the screen). Seen working on load: goal chip, stars, City button, tall blueprint. NOT verified: touching-window hints, spire dare and fall, spending stars, choosing a City plot, night auto-lay animation, practice fire, Pretend 90 days, draw-call target for the iPad 7, 390px phone layout.
- **Not done:** finish and test page round 3; re-score with the three reviewers (target 7.5+); try on the real iPad 7 with the kids (finger drag, speed, sound); only then decide on replacing the mine in the live app. Live app unchanged.
- Known stakes: typical child loses a block about every 5 days (Joel asked for every couple of days); rough child a wall about every 12 days and a cave-in about every 2 months; steady child loses a spire every 4 to 8 weeks.

### Build on the Rock: version 5 built (17 Nov 2026, not published)
- **Built** per the v5 plan (`~/.claude/plans/i-would-like-you-nifty-valiant.md`): this week's three cards (8 cards, "Tell the truth" off), 1-tap morning, 2-tap "I saw it!", 4-tap night account with grown-up confirm (auto next morning), pearl for owning up (never straw), Tomorrow moment + twin gem, weekly review (all 9 fruits, stars, 3 bonus pieces, choose next week's three), 6 designs with roof/door colour and naming, gem colour palette, candle prayer log + lanterns, animals. Save key `rock-play-v4`. Backup of v3 files: scratchpad `rock-before-v5` (temporary).
- **Checked:** 74 rules tests pass; clicked through in a browser at 1024×768 and 768×1024 (tap counts, night answers ages 6/8/12, fire nights, words-only fallback, all six designs, City). Fixed a stray error from the creak-sound timer.
- **Not checked:** real iPad 7 speed (about 85–90 drawn items a frame), finger drag, sounds, the kids.
- **Audit vs targets (400 pretend children × 180 days):** house times on target (5.5 / 8.2 / 12.2 days). Misses: blocks lost to fire every ~6–7 days (target 2–3); hard day ~4 good pieces (target 2–3, because each owned-up card gives a pearl); rough child's wall falls every 12–16 days (target 10–12); great vs rough gap 2.7 / 5.1 / 9.4 days at ages 6 / 8 / 12 (target 3–4); lantern every 7–10 days (target 3–5).
- **For Joel to decide:** one pearl per owned-up card (a fully owned-up bad day pays like a good day) or cap it; loosen the targets the caps can't reach, or allow only 1 straw put right a day (walls fall every 10–12 days, but rough children fall further behind).
- **To publish** (only on Joel's yes): republish `docs/rock/play.html` to https://claude.ai/artifact/DKhPV5voynTTa3ULhSiZqq with rules.js, content.js and `fruit-art.js` ← `js/fruit-art.js` in files, or the pictures show as words only.
- **Joel decided (17 Nov, 8:30 pm):** pearls only partly bring things back. Owning up gives a pearl that puts one fire-lost block back from the rubble pile. It is not a new piece. To build at 9:30 pm along with the quick log.

### Build on the Rock: quick log + grown-up check + pearl rule (18 Nov 2026, not published)
- **Built:** main screen (after "Start my day") has "🙏 I prayed" and "😮‍💨 I cooled down" (1 tap) and "Tell about today" (Great attitude, Tantrum, Disobeyed, Negative; 2 taps with "Who is telling?"), 10-second undo, shown only as "N waiting for a grown-up". At night a Grown-up check comes first: Keep / Not quite / Keep all / Not now. Unchecked good items arrive next morning; unchecked bad ones are dropped. Pearl now brings back the latest fire-lost block (no new piece).
- **Tested:** 84 rules tests pass. Click-tester: all 8 checks pass. Loophole-tester found 3 holes, all fixed with tests: tantrum + later cooled down paid a gem; unlimited "great attitude" (now 2 a day); night account could run twice. Grown-up check now shows only counted prayers.
- **For Joel to decide:** owning up when nothing has fallen gives only words ("pearl shines on the Rock"), so it can be worth less than claiming "good". Small thank-you piece, or keep as is?
- **Pending:** Joel's yes to publish; hidden-straw bag idea (scored 7, 8.5 with straw from real life hidden in the bag).
- **Published 18 Nov:** v5 + quick log at a NEW link https://claude.ai/artifact/XVoFMyGv6xMSTktwAFMHCR (the old link DKhPV5voynTTa3ULhSiZqq still shows v3; updating it needed a costly full read). Publish folder: copy play.html, rules.js, content.js and js/fruit-art.js into one folder. Pretend progress saves under a new key, so nothing old carries over.
- **18 Nov:** pinch zoom (two fingers; mouse wheel on a computer) and the pieces bar moved under the picture, one tile per kind with a count ("Silver × 2"); tap to pick one. Republished to the new link. Pinch not tested with real fingers.
- **18 Nov, later:** each good act gives 2 smaller blocks (CONFIG.blocksPerPiece), houses about twice as big (56 / 80 / 120 slots), finish days unchanged (sim: 5.8 / 8.3 / 12.3 days usual child). One straw act = 1 block but knocks out 2 when it burns. "My pieces" bar always shows every kind, greyed at 0. 91 tests pass. Republished to the new link. Not checked: iPad 7 speed with the bigger houses.
- **18 Nov, later:** home screen now has two big buttons, 💎 Precious stones and 🔥 Burns up (each opens sub-categories with pictures), then "Who is telling?". Everything goes to Tonight's pile (shown per child as blocks and straw); prayers light a candle at once. Night grown-up check grouped the same way. 95 tests pass. Republished to the new link. Next idea waiting on Joel: free building, either the template plus one space out (medium) or full free build (hard).
- **18 Nov, later:** free building option 1: extra blocks one space out from the outline (beside, in front, one row above), dashed pale-blue glow, max a quarter of the outline, each extra belongs to its wall for fire/falls, straw never on extras, sealing needs only the outline. 102 tests pass. Republished. Not checked: a fire knocking an extra over, extras in the City, an extra in front of an open outline spot cannot be tapped until that spot is filled.

### Rock: freer building (18 Nov 2026, version 6 on the same link)
- Extra blocks can now go up to 2 spaces out from the outline (beside, in front, above, or a mix such as a porch with a roof), not just 1.
- Up to 60% of the house size in extras (was 25%). Chimneys/towers can go 2 high above the top. No floating blocks: each needs ground or a block under it.
- Same rules as before: extras fall with their wall, straw never lands on them, the house is finished when the outline is full.
- 102 checks pass. Not tried on the iPad yet; corner extras from two walls may overlap in the picture.
- Backup of the step before: scratchpad rules.before-free2.js / play.before-free2.html.

### Rock: bigger houses + more room (18 Nov 2026, version 7 on the same link)
- Joel: "still feels too small" -> picked the house AND room to build.
- Every design ~1.9x the spaces (wider x1.6, taller x1.2): cottage age 6 is 112 spaces (was 56). Door kept in the middle.
- Each good act now gives 4 blocks (was 2); a burning straw bale knocks out 4. Days to finish stay about the same (pretend kids: age 6 ~6 days, age 8 ~9).
- Free building: up to 3 spaces out from the outline, extras up to the size of the house, towers 3 high on top.
- Picture: wider walls allowed, camera pulls back for wide houses. Houses already started keep their old size; the next one is big.
- 105 checks pass. Not tried on the iPad (speed with ~2x blocks is the main worry). Backups: scratchpad *.before-big.*

### Rock: try-out extras + same big house for all (19 Nov 2026, version 12 on the try-out link)
- Try-out page only (not in the family app): 🧪 Test blocks (gold, silver, fruit, wood/hay/stubble straw), 🔥 Fire now (goes to Last look), ↶ Undo block (default 5 a session; Grown-ups → Undo block: Off/3/5/10/20), 15 starter blocks per child once.
- Joel: all kids build the same large (age-12) size: `CONFIG.designs.sameSize: 12` in rules.js. Cottage = 223 spaces for every age. A house already started keeps its size until finished or Start again.
- Not checked: how many days age 6 now takes to finish (about twice as long as before), iPad speed.
- Family app still has the mine; Rock is NOT in it.
- **19 Nov: LIVE in the family app as v56** (commit 3dbcc42, pushed). Open building on a child's page now has: same large house for all, 4 blocks per good act, free building 3 out, 15 starter blocks, Undo block (Grown-ups in the game → Undo block). Test blocks / Fire now stay on the try-out page only. Not checked on the iPad: open the app twice so v56 loads; houses already started keep their size until finished.
- **19 Nov: v57 LIVE** (commit 9682970): zoom right in close, two-finger slide, one-finger up/down tilt, ＋ / − / ⌂ buttons on the picture. Try-out link updated too (version 13). Not checked with real fingers on the iPad.
- **Plan waiting on Joel: crafting** (combine gems into items, Minecraft-style). Craft button on My pieces → recipes using pieces in the tray. Draft recipes: Torch (1 gold + 1 joy), Stained-glass window (3 gems, pure if all one fruit), Lamp post (2 gold), Flower box (love + kindness + patience), Arched door (2 silver + 1 gold), Fountain (4 peace). Items go in a wall space or an extra spot, never burn, fall with their wall. Open choices: which items, and whether an item fills an outline space or is decoration only.
- **19 Nov: v58 LIVE** (commit 51d7b2e): spin all the way round, zoom much closer (toward the block under the fingers / mouse), turning while zoomed circles round that spot. Tested in the browser at 1024x768: zoom into a side wall, turn while zoomed, tap a glowing space while zoomed (block laid). Not tested with real fingers.
- **19 Nov: v59 LIVE** (commit 386d343): crafting. 🛠️ Craft on My pieces → Torch (gold + joy), Stained-glass window (3 gems, brighter if one fruit), Lamp post (2 gold), Flower box (love + kindness + patience), Arched door (2 silver + gold), Fountain (4 peace). Items lay in the outline (count toward finishing) or an extra spot, never burn, fall with their wall. Recipes: `CONFIG.craft` in rules.js; looks: `itemInto` in play.html. 110 tests pass; all six made and laid in the browser. Not checked: iPad, how items look in the City (plain glowing block there).

## 19 Nov 2026 — Building test space for grown-ups (v60)
- Grown-ups → Settings → 🔄 App → 🧪 Building test space → Open.
- Same game as the children's, but: the tray tops itself back up (12 gold, 12 silver, 6 of each gem, 4 each wood/hay/stubble), Undo block has no limit, 🔥 Fire now works any time (and again after Goodnight), ↺ Start again clears the test building.
- Saved apart under `rock-live.grownup-test` (play.html `?live=1&sandbox=1`). Takes nothing from the app's inbox; children's saves untouched.
- Checked in the browser: refill after laying and crafting, all 6 recipes craftable, two fires in a row, Start again, open and Close from the app. Not tried on the iPad.
