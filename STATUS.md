# Morning Habits app: status

Updated 26 Nov 2026 (app v82 BUILT, NOT LIVE yet). Next: Joel says yes to putting the 🏘️ Town Square live, then opens the app twice on the iPad and taps 🏘️ Town on a farm.

## Where it's up to
- Live on GitHub Pages: Fruit time (3 fruits a day, this/not pictures, stars, quiz, pick your own fruit), Going up! night with the stay-in-bed bonus next morning, start by 7:15, −20 if asked, fair board, PIN every time, 3-minute grown-up cutoff, 🔊 voice chooser, kinder farm selling. Rules summary: README.md "Current rules".
- Not yet checked on the real iPad. Joel is checking the next morning (open the app twice so the update loads).
- Farm animals are now Sticker Plus (babies, happy/hungry/sleepy moods), plus 12 new friends live: Aussie Island Mates (bush egg, wombat burrow, gum tree, bush paddock) and Rock Pool Crew (rock pool, rock pool egg, jetty). They make no money. Preview: docs/farm-art-preview.html. Watch for slowness on the iPad farm (each animal uses a white-edge filter).

## Next
1. Joel's iPad check of Ready, set, go → Fruit time, and Going up! at night. Fix what he finds.
2. Joel to decide (docs/review-round3.md "For Joel to decide"): −20 for under-7s, 3-minute timer restarting on taps, farm money, farm visits per day, mine time, daily fire, speed bonuses, hand actions (Peace, Gentleness, Goodness "Thumbs up"), adding a 5-year-old.
3. LATER list in docs/review-round3.md: only the right child can tick their column, redraw Peace and Faithfulness pictures, rebuild animals in Sticker Plus (3 first as a test), hide the PIN from the public code.

### 🏘️ Town Square, my farmer, turkeys, market stall (26 Nov 2026, app v82, built and tested, NOT LIVE)
From Joel's dictated note (Gmail, 26 Nov): the kids want their own farmer (hair colour, outfits to buy), baby turkeys and turkey eggs, a farmers market stall to sell produce and juice for more, more than one farm, and a town square. Joel: "They love the farm but are not super excited about the building... let's try something more ambitious."
- **Why this shape (research, 26 Nov):** kids engage with what they asked for and with a world they share (Animal Crossing: the town grows when you give; Stardew Valley: community-centre bundles that each unlock something). A fixed blueprint and a weekly fire showing their own hay feel like a report card. So the good-choice pieces now ALSO build something they love, together.
- **🎒 Town pieces:** every gold, silver and gem sent to Build on the Rock (finished routines, prayers, kept good moments, picture-it) also drops into that child's town bag, up to 8 a day. Hay/straw never touches the town. `sendToRock` in js/app.js → `farm.townPiece`.
- **🔨 Town projects (shared by all 3 children, one at a time):** ⛲ wishing fountain (2 gold, 2 silver) → 🥖 bakery (5/5/2 gems) → 🎵 bandstand (8/8/4) → ⛪ little church (12/12/6) → 🕰️ clock tower (16/16/8). Children tap Give. When everything's in, "the builders work all night" and it opens the next day with a celebration for each child ("Built together by …", names only, never counts). Perks: fountain = a tap a day for 🪙 2 or a farm decoration; bakery = bread and honey cake recipes; bandstand = Saturday Market Day (made things +🪙 3); church = bell + Matthew 7:24; clock tower = +1 farm build move a day. `PROJECTS` in js/town.js; shared state in kv `town`.
- **🧺 Market stall (each child's own, 🪙 150 + ⭐ 12):** make apple juice, carrot juice, sunflower posy, woolly scarf, big omelette (+ bread, honey cake after the bakery) from the basket. Each sells for about a third more than its parts; sell everything from the stall. `RECIPES` in js/town.js, prices in `GOODS` (js/farm.js).
- **🧑‍🌾 My farmer:** made the first time a child opens the town. Skin, 7 hair styles, 10 hair colours free; 4 overalls + straw hat + cap free; 10 outfits (🪙 30 to 150: check shirt, raincoat, chef, explorer, cowboy, flower dress, fairy, superhero, knight, astronaut) and 8 hats (🪙 20 to 100, crown 100) bought in 👗 Dress-up. First tap reads the price, second tap buys. The farmer stands by their farmhouse and at their stall. Drawn in code (js/avatar.js), so every mix works.
- **🏡 Farm gates:** each brother's or sister's gate in the town opens their farm to look at (nothing can be changed there).
- **🦃 Turkeys (painted, Barnyard stage):** turkey egg 🪙 60 + ⭐ 6 hatches a poult straight away; grows in 6 feeds; a grown turkey lays a turkey egg (🪙 12) every second day it's fed on a job day; "🦃 Hatch a turkey egg" puts one in the nest (hatches tomorrow). Up to 3 turkeys (6 with the big barn). Sells for 70% of what was paid (🪙 40), farm-born 🪙 35.
- **Also fixed (was already broken before today):** with the iPad held upright, every picture on the painted farm shrank to nothing (the field had no fixed height). Now fixed for farm and town.
- **New pictures (kie.ai, about $0.40):** a-turkey, a-poult, ground-town.jpg, t-stall, t-dress, t-bakery, t-church, t-bandstand, t-clock, t-site, t-frame, t-gate, t-board in farm-art/. Prompts and the cut-out script (cut_town.py) in docs/farm-mockup/source-art/.
- **Tested** in a browser at iPad size (1080×810 landscape and 810×1080 upright) from a test copy with pretend farms: town opens from the farm, celebrations queue one at a time, farmer maker (face, hair, clothes, hats, buying the superhero outfit took 🪙 100), giving pieces to the bakery until "Opens tomorrow!", the next day it opens with "Built together by Annabelle and Judah", market stall making juice and a scarf (basket worth 141 → 157) and selling, visiting Eliana's farm, turkeys on the farm and in the shop, farmer by the farmhouse. **Not tried:** the real iPad (finger feel, speed), Market Day on a real Saturday, a whole week of real pieces.
- **Code review (fresh-eyes helper):** fixed a town or a visit carrying over to the next child's farm, the turkey card saying "Bug hunter", poults sharing the chick icon, a double-buy guard in Dress-up, and a piece for the town can never stop a Build on the Rock piece being saved. 138 Build on the Rock rules tests pass; no console errors.
- **For Joel to decide:** project sizes (whole town in roughly 1 to 3 weeks for 3 kids), stall price 🪙 150 + ⭐ 12, outfit prices, 8 pieces a day cap, whether town time should be extra to the 3-minute farm visit (right now it shares it), "more than one farm" (not built: next big step could be a second farm bought in town).

### 🏰 Tap a spot, then choose the piece (26 Nov 2026, app v81, LIVE)
From Joel's dictated notes (Asana "Kids app updates"). Joel chose: tap a spot first in **both** the 1-minute morning building and the full building; keep "Piece first" as a second way; keep "Lay them for me" as the automatic way.
- **👆 Tap a spot (the normal way now):** with nothing in hand, every open space glows. Tap one: it glows brighter and the pieces bar asks **"What goes here?"**, showing only pieces that fit there (the spire only offers gems; a gem that would finish a window says so). Tap Gold (or any piece) and it drops there. Tap the same spot again or Cancel to choose another. After laying, the hand is empty again and all spaces glow.
- **🧱 Piece first:** the old way (pick a piece, then a glowing space; the next piece of that kind stays in hand).
- **⚡ Lay them for me:** the automatic way, as before. The three buttons sit under "My pieces" (and in the morning panel). The choice is remembered on the iPad.
- **Morning building:** a tap on a piece no longer drops it into today's row by itself (that one-tap way is gone; Joel didn't pick it). Each piece laid still plays the rising note.
- Crafted items (recipes) and putting fallen blocks back still go piece first.
- **Eggs and land (items 1 and 2 of the same notes):** already built and live in v79 (rainbow eggs hatch a rare animal; land and land pieces show a real picture in the shop, tap to see it big). Joel: that's enough.
- **Tested** in a browser at iPad size (landscape 1080×810 and portrait 810×1080) from a test copy: tap a spot → picker → Gold dropped there; Cancel and tap-again cancel; spire offers gems only and the "dare" No leaves nothing in hand; Piece first shows no spots until a piece is picked and keeps silver in hand; sheets hide the spots; picker shows even with pieces hidden; morning panel (age 8) tap a spot → Gold, then Lay them for me laid the rest and finished today's goal; no errors; rules tests pass. **Not tried:** the real iPad (finger feel of tapping small spots).
- `way`, `spotGhosts`, `pickSpot`, `picker`, `wayRow` in docs/rock/play.html.

### 🐔 3 farm visits + Annabelle's Meadow land (26 Nov 2026, app v80, LIVE)
- **3 farm visits a day** (was 2): each at least **1 hour** after the last one started (was 30 min), and the **third only opens from 12:30 pm** ("after lunch" on the button). The night-chores visit is still extra. `FARM_VISITS_PER_DAY`, `FARM_GAP_MS`, `FARM_LUNCH` in js/app.js.
- **Annabelle's land:** she bought the first land when it was called "Bigger land" (🪙 400, before 24 Nov). When Meadow land was added below it on 24 Nov, her farm moved up to River land (river and bridge picture). Now her farm is put on Meadow land once, with a 🌼 news note; nothing has to move. She can buy River land later. `meadowFix` in `farmOf`, js/farm.js.
- **Tested** in Node (no browser this time): visit times at 7:00, 7:20, 8:05, 9:00, 12:00, 12:31, after the third; Meadow fix from River, starter and already-Meadow farms; both files load with no errors. **Not tried:** the app in a browser or on the iPad.

### ✅ Reminders check + small fixes (25 Nov 2026, app v78, LIVE)
Joel's 16 kids-app reminders (iPhone High Priority, also in Asana "Kids app updates") were checked against the app. Almost all were already built in v74 to v77.
- **Already built:** 1 research (docs/research-obey-kind-calm.md, used in the weekly review), 2 growing bonus, 3 + 12 rebuild pack and same-kind blocks, 4 sell for less + storm/flood/sick/fire/heatwave/mice/escape, 5 verses + plan + 60-second picture-it + Bible story quiz, 6 Komodo dragon + mystery egg, 7 Treasure chest, 8 Obeyed straight away + Disobeyed (and "goes on your building tonight"), 10 landscape header, 11 gold/silver/gem burst + hay pile + several in a row, 13 6-week growth bars, Sunday review first, breath prayer, 30 min between farm visits, 15 planting.
- **Built now (v78):**
  - **Build on the Rock, first open:** a new child gets 3 days of building before any fire (was: fire on day 1, e.g. "The fire comes TONIGHT!" before anything was built). `firstFireDay` in rules.js (0 in tests, 4 in live mode, play.html).
  - **Night fruit rating:** "Going up!" now asks about the fruit they planned for today (🌱 plan), both the quiz question and "How did X go TODAY?" (still can't be skipped). More stars than the last time they rated that fruit = **🌱 +🪙 2** ("You grew in Patience!"), once a day, in their coin history. `nightGrowth` in js/fruit.js, `GREW_BONUS` in js/app.js.
  - **Verse added:** 1 Corinthians 10:31 "Whatever you do, do it all for the glory of God." (8 verses, added at the end so nobody's place moves).
  - **Hard moment voice:** takes turns between 4 lines; "stinky" is now 1 in 4 ("Oh no. That one is hay and stubble", "That one won't last in the fire", "Hmm. That was a hard moment").
- **Tested** in a browser at iPad size from a test copy: new child's building says "Fire in 5 nights" on day 1 with no fire button; 4 hard moments in a row each said different words; 🌱 sheet shows 8 verses; Going up for Annabelle with a Patience plan (2 stars last time → 4 tonight) asked about Patience and gave +🪙 2; front page has no text running off in portrait (810×1080) or landscape (1080×810, 1080×690); 119 rules tests pass; no errors. **Not tried:** the real iPad.
- **Needs Joel (3 questions):**
  1. **House size (item 14 "wood and clay never turn into houses"):** a cottage is 223 blocks (Joel chose the big size for everyone on 19 Nov). A good day gives about 30 blocks, so the first house takes a week or more, and gold/silver blocks look like wood and clay sitting in a strip. Option: make the first house half size (about 110), later ones big.
  2. **Farm "layout options" (item 9):** each land already has its own picture and you can move everything in Build mode. What did "layout options" mean? (e.g. choose between 2 looks when buying bigger land?)
  3. **"Kids app and Rainbow" (item 16):** what is Rainbow?

### 🏰 Build on the Rock: 4 rounds of testing + Gmail notes (26 Nov 2026, app v79, LIVE)
- **From Gmail (Joel's dictated notes):** rainbow eggs now hatch a rarer animal (🌈 Hatch by the basket; eggs already in a basket move over); land and land pieces in the farm shop show a real picture, tap it to see it big. Reminders (High Priority) had nothing clearly for the kids app; "Negativity jar" asked about.
- **4 rounds** of testers (hands-on player at ages 6/8/12, game designer with 12-month simulations, child psychologist + pastor), each followed by a builder. All reports: `docs/rock-test/` (round-N.md = scores + fix list, round-N-*.md = each tester, round-N-built.md = what changed).
- **Scores 1→4 (out of 10):** morning touch 2.7→7.7, clear goals 4→7.7, seeing your hay 6→8, usability 5.7→6.7, smoothness 6.5→7, playability 6.3→8, creativity 6→6.7, long-term 5→6.7.
- **What's new:** 🏰 morning touch (1 minute, from the morning All done card; ages 6 and 8 when one job is left; "Your morning pieces" after school): today's fruit + "I will…", tap pieces into today's row (chime), one hay line with grace first and "Say sorry now"; goal ladder (Today row / This week / This building / Next); hay chip, stripy hay, "Show me the hay"; fair make-it-right with a grown-up coach check; gentler words for 8 and under ("hay", no "whole house"); sticker book earned by walls (+ milestone stickers, page 2), family walls + growing City landmark (never ranked), monthly blueprint for everyone + monthly family challenge with a grown-up "We did it"; name your house from day 1; ✨ Mended page of times they made it right; Put 10 back; many bug fixes (tray hidden on a new day, auto-laid rubble, bale taps, camera for tall designs).
- **Checked:** 138 rules tests pass; every page script compiles; testers played it in a browser at iPad size each round. **Not tried on the real iPad** (3D speed, sounds, finger feel).
- **For Joel to decide:** a "small" size of each design (a rough child's first building ~day 31 instead of ~41–61); a bonus for putting right / calming down instead of fewer hard moments; should the family goal count put-right hay; year-2 blueprints. Testers also asked Joel to think about the stinky pop-up next to the gentle grace words, and watching for "I'll pray to finish my row".
- **Grown-up talk before the kids try it (5 minutes):** a child can tap the "Grown-up" check themselves; be nearby on nights a wall might fall; read one Mended story aloud each week; tap "We did it" when the family does the month's challenge.

### 📜 Bible stories, farm extras, weekly review, breath prayer (24 Nov 2026, app v77, LIVE)
Joel chose all four groups of the remaining voice-note items:
- **📜 Bible story + quiz** (🌱 button → 📜): 8 stories of things Jesus did (our own simple retelling + Bible reference; `js/stories.js`), read aloud, then 3 tap-the-answer questions (shuffled, first tap counts, a miss shows the right answer). 🪙 1 a day, next story tomorrow. **Habakkuk 2:14** added at the end of the memory verses (7 now).
- **🌬️ Breath prayer** is back as a 4th choice in 🙏 I prayed: three slow breaths with a growing circle and a short prayer ("Jesus… calm my heart"), gold for the building. Stopping part-way logs nothing.
- **🧱 Build on the Rock:** after laying a block, the next one picked up is the same kind until that kind is all laid, and the chosen block is scrolled into view. (`layAt`, `drawTray` in docs/rock/play.html; 119 rules tests pass.)
- **💰 Treasure chest** (🪙 300 + ⭐ 20, from Big Farm; Joel: never call it "magic"): a rare egg (35% Komodo dragon), a calf, a piglet, two rainbow eggs, or golden corn for every baby.
- **🦎 Komodo dragon:** new rare animal (painted, grown-up and baby). Mystery egg 1%, rare egg 5%, treasure chest egg 35%. Keeps the fox away, like the crocodile.
- **Farm troubles:** 🔥 fire (lightning, a building gets burnt, rebuild costs 1.5× a storm), plus Claude's suggestions: 🥵 heatwave (fill the water troughs 🪙 10), 🐀 mice eat 2 feed bags (never with a grown snake), 🚪 an animal gets out (thank the neighbour 🪙 10; doesn't stop the farm).
- **🗓️ Weekly review** (Sunday, `reviewDay` in settings): "My week" is the first thing in each column that morning ("Later" never blocks the morning). 5 steps, shaped by docs/research-obey-kind-calm.md: wins read out, 📈 6-week bar of good moments (compared only with themselves, "Best week yet"), one hard moment with "Next time I can…" (no new punishment), pick next week's fruit, pray together. 🪙 3. The 🌱 sheet also shows the 6-week bars and a 🗓️ My week button.
- **Tested** in a browser at iPad size: Sunday review for 3 children, Later, all 5 steps, week bars; Bible story with a miss and coins; breath prayer (fast timers) logged + gold; treasure chest rainbow prize; magic-egg-style Komodo hatch with the new picture; each new trouble in Node (4,000 runs); Build on the Rock loads with no errors. **Not tried:** the real iPad, the hand-feel of the block change.
- **For Joel to decide:** review day (Sunday?) and 🪙 3 for it; story coins (1 a day); treasure chest price; trouble prices.

### 🐞 Bug fixes and quick wins (24 Nov 2026, app v76, LIVE)
From 24 more voice notes (High Priority list, passed on by the triage chat). Bugs first:
- **Planting fixed:** after picking seeds, tapping a garden bed picked the bed up to move it ("tap a glowing square"). Now it plants. `pick` in `js/farm.js`.
- **Front-board moments and Build on the Rock:** they only go to the game after the grown-up's night check (by design), and the game drops straw over its daily cap (2 at age 6, 3 at 8 and 12) without a word. Now the pop-up says "It goes on your building tonight, when a grown-up says yes", and the night check shows "🏰 Sent to X's building". The cap stays (Joel, 24 Nov: keep it).
- **Landscape header:** name, Fruit Friend badge, waiting coins and coin total ran off the column. Now they shrink to fit and the coin total moves to a second line.
- **Animals on trees:** nothing is placed in the far left/right corners of the farm (where the painted edge trees are; anything already there moves in once), and animals next to a tree, bush or hill hardly stroll. `inCorner`, `TALL` in `js/farm-world.js`.
- **Quick wins:** 🙋 "Obeyed straight away" good moment (orange faithfulness gem); the 🪙± sheet stays open so several can be logged in a row; good = gold and silver pieces fly out with a big gem and the matching Fruit Friend jumps out; hard = a big stinky hay pile with flies; second farm visit at least 30 minutes after the first ("🐔 My farm in 20 min").
- **Tested** in a browser at iPad landscape (1080×810 and 1080×690): planting wheat by tapping the bed, header with badge + 5-digit coins, a full Hilltop farm, both pop-ups, two moments in a row, farm gap (blocked at 10 min, code asked at 31 min), 119 rules tests. Not tried on the iPad.

### 💎 Kids app updates (24 Nov 2026, app v75, LIVE)
From the Asana task "Kids app updates" (High Priority list). Joel's answers: no Claude character, just a big gem.
- **💎 Big gem:** logging a good moment on 🪙± flashes a big sparkly gem full screen ("WOW, Eliana! Kind! A big gem for you!"). A hard moment shows "Hey, that is stinky and sad. Let's make it right." `bigMoment` in `js/quick.js`.
- **🎹 Keyboard longer:** 10 minutes (was 7), bonus +🪙 1 a minute up to 20 (was 15). **🎤 Singing** is now called "Singing lesson" (still 7 minutes). Settings v13 updates the iPad's saved lists.
- **🌼 Land:** each land has its own painted picture. New first step **Meadow land** (🪙 1,000 + ⭐ 15, 12 squares). Bigger → **River land** (🪙 2,500, 14 squares), Biggest → **Hilltop land** (🪙 6,000, 16); farms that had them move up one. **Special land pieces** (need Meadow land): wildflower patch, little bush forest, grassy hill, beach corner. Pictures made with kie.ai (about 20 cents).
- **💰 Price check (Joel: kids getting 500 to 1000 coins a day):** a full farm made about 600 to 650 a day vs 25 to 70 from jobs. Joel chose both fixes: farm goods sell for half (full farm about 300 a day) and the land costs more (above; pieces 600 / 900 / 1,200 / 1,500). Details: docs/farm-economy.md "Price check".
- **🙏 Tap to pray:** already done as the 🙏 I prayed button (v72, 20 Nov). Nothing new built.
- **Second test round before going live (Joel asked):** keyboard ticks itself at 10 min, keeps counting, stops at 20:00 with +🪙 10; Singing lesson name shows; River and Hilltop land bought in turn (pictures change, paddock 14 then 16, coins right, can't buy twice); gem for Judah (purple for Waited well), closes on tap, sad one closes itself; night check ✓ Yes still changes coins and sends the gem and wood to Build on the Rock; 119 rules tests pass. Live site checked: v75, new pictures load.
- **Tested** in a browser at iPad size from a test copy: gem and stinky pop-ups, settings upgrade from v12, old Bigger land moving to River land, shop locks, buying Meadow land and all four pieces, all 101 offline files present. **Not tested:** the real iPad, and the Hilltop picture on a real farm.
- **For Joel to decide:** keyboard 10 minutes / bonus to 20 (morning is tight before 7:30), whether the gem should also show at the night check, whether coin penalties should be bigger now that the farm pays so much.

### 🌱 Reminders update (21 Nov 2026, app v74, LIVE)
From the iPhone High Priority list and the Asana task "Kids app updates":
- **Farm sells for less:** an animal sells for 70% of what was paid for it (🪙 30 egg hen → 🪙 20, 🪙 1500 dinosaur egg → 🪙 1050). Farm-born animals, gifts, friends and animals from before today use a lower table (mystery-egg animals 🪙 20, sheep 100, pig 80, cow 240). `sellPrice` in `js/farm.js`.
- **Farm troubles, about once a week** (never two days in a row, one per opening, at most 2 waiting): ⛈️ storm damages a building (fix 🪙 15 to 40; no buildings = fence blown down), 🌊 flood (clean up 🪙 15, may wash away a garden bed), 🤒 sick animal (vet 🪙 15 / 30 / 50; makes nothing and doesn't grow until then), 🐛 caterpillars (a bed needs one more day), 💨 wind (up to 3 feed bags lost). While a storm or flood repair waits the animals make nothing. "Needs fixing" box on the farm panel. Nothing dies.
- **🌱 Growing bonus:** fewer kept hard moments yesterday than the day before = +🪙 3 the next day (waits until yesterday's moments are checked). `growBonus` in `js/quick.js`.
- **🧱 Rebuild pack** on the child's Grown-ups page (only when the building has fallen blocks): 🪙 20 brings back up to 12 fallen blocks into the tray, outside the daily rebuild limit. `restoreRubble` in `docs/rock/rules.js` (+1 test, 119 pass).
- **🌱 button on each column** (`js/grow.js`): 📖 memory verse word game (words disappear in 4 steps, tap a gap to peek; 🪙 1 a day for practising; after 3 days a grown-up hears it with the PIN: 🪙 10 and the next verse), 🌱 growing in / 💪 working on (last 7 days of kept moments), 📝 plan for tomorrow (pick a fruit, its "I will" step; asked before Build on the Rock opens after 3pm), 🌅 picture it (60 seconds the next morning → a precious stone in that fruit's colour for the building).
- Verses (kid wording, change in `js/grow.js`): Galatians 5:22–23, Philippians 2:14, John 15:5, 1 Corinthians 3:13, Matthew 28:19–20, 2 Corinthians 3:18.
- **Tested in a browser at iPad size (1080×810)** from a test copy of the app: 🌱 sheet, verse game (4 steps, peek, +🪙 1), plan for tomorrow, next-morning picture-it (60 s, Patience gem sent with `from:'goal'`), storm news, Needs fixing box (vet and repair paid, box clears), sell picker prices (hen 20, lamb 105, duck 20), Rebuild pack (coins taken, game gave back the blocks). Also in Node: a simulated year of troubles (~53, never two days running), growing bonus. After the test: the footer buttons were narrowed so the farm button has room, the Needs fixing box moved to the top of the farm panel, and a smaller rebuild pack costs less (🪙 5 per 3 blocks, up to 🪙 20). **Not tested:** the real iPad, the grown-up PIN check of a learned verse (needs 3 days of practice), the 🌱 bonus showing on a real morning.
- **For Joel to decide:** bonus 🪙 3, rebuild pack 🪙 20 for 12 blocks, verse coins (1 a day, 10 learned), repair/vet prices, which verse "love you" meant in the reminder.

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

### 🙏 I prayed (20 Nov 2026, app v72, LIVE)
- The 🙏 Hold (breath prayer) button on each column is now **🙏 I prayed**: tap, then pick 🙌 Thank you, God (gold), 🤲 For someone (silver) or 💖 Sorry / help me grow (a precious stone in the colour of their fruit this week, love if none). No coins, no grown-up check. Up to 10 a day, at least 30 minutes apart (button shows "in N min", then "💛 Amen" after 10). Saved on the day as `prayed`; sent to `rock.inbox.<kid>` with `from: 'prayer'`.
- **Needs the Build on the Rock chat:** the game's daily caps (gold 1, silver 2, gems 6) still apply, so extra prayer pieces are dropped until the game lets `from: 'prayer'` items past the caps. A message to that chat was held (different permission mode), so Joel passes it on.
- Tested in a browser at iPad size: sheet, piece sent, 30-minute wait, second prayer after 31 min, 10-a-day limit. Not tried on the iPad.

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

## 19 Nov 2026 — Pieces stacked, full screen, craft pictures (v61)
- My pieces now wrap into rows (no sideways scrolling), with ▾ Hide / ▴ Show pieces (remembered).
- ⛶ button on the picture: hides the side panel so the house fills the screen. The panel slides back over the picture for Craft, the design, night and fire, then hides again.
- In landscape the picture now fills whatever height is left, so hiding pieces makes it bigger.
- Craft list shows a picture of each item, drawn from the same blocks as in the wall. Torch flame made more orange.
- Checked in the browser at iPad 7 size, landscape and portrait. Not tried on the iPad. The fountain picture is the weakest (reads as a spout on a basin).

## 19 Nov 2026 — Hold-to-place, items on blocks, smoother turning, more room (v62)
Three review agents went through turning, placing and glitches; their main fixes are in.
- **Hold, slide, let go:** with a piece picked, put a finger near a glowing space: the real piece shows there see-through. Slide to move it (it aims a little above the finger once sliding, with a white dot). Let go = laid. Slide off every space, onto the pieces, or add a second finger = cancelled. A quick tap still lays straight away.
- **Items onto laid blocks:** a crafted item can go onto any laid gold, silver or gem block (rules: `decorate`, `decoSlots`; block keeps its type and strength, wears `p.deco`). Glowing spaces sit just in front of those blocks.
- **More room:** My pieces moved to the right-hand column; the message line floats over the bottom of the picture and hides when empty. Full screen: pieces float on the right, view buttons move left.
- **Smoother:** no view jump when text/pieces change size; 12px dead zone before turning (wobbly taps stay taps, 900ms allowed); turn and tilt lock to the main direction; gentle spin after a flick; pinch keeps its spot; zooming out drifts home; one finger keeps turning after a pinch; pixel ratio 1.5; shadows every 4th frame; animals no longer force shadows every frame; drop starts a frame later; quick second lay no longer pops the first; pieces list and panel keep their scroll; no text selection or page zoom; vertical drags no longer stolen by page scroll.
- 111 rule checks pass. Checked in the browser at iPad 7 size (landscape, portrait, full screen) with simulated touches. **Not tried on the iPad with real fingers.**

## 19 Nov 2026 — Straw, fire and rebuilding made clear (v63)
Played the straw → fire → rebuild loop as a child. Before: one small line of text, "!" marks with no meaning, straw hard to tell from gold.
- **Danger card** (top of the side panel whenever straw is in the walls): when the fire comes, what it would do right now (from the rules' own forecast: bales burn, blocks knocked off, which walls fall, cave-in), a chip per wall (will fall / leaning, safe this time / wobbly / holds), the 4 steps to fix a bale, and "Show me the straw". Glows on fire night. Honest about the practice fire and the breather after a cave-in.
- **Straw bales glow red, pulsing**, in the picture.
- **Fix sheet** shows where you are: 1. Say sorry → 2. Make it right → 3. Pull it out. After each pull: "The right wall will stand now!" / "2 more, it will still fall: keep going!".
- **Prop a wall up** (new rule `brace`): every 3 good blocks laid on the ground just outside a wall let it hold 1 more straw (max 2). Straw still burns and knocks blocks; the wall just stays up. The card says exactly how many more blocks would save it, and only when it can.
- **Build it back** card after a fall: "N blocks fell. They are still yours." One button picks up a fallen block and shows the spaces. Big-pile rebuild raised 12 → 20 a day; test space unlimited.
- 112 rule checks pass. Checked in the browser: card wording for practice, normal and after-cave-in fires; full fire to a cave-in (156 blocks to the pile); Build it back; propping changes "will fall" to "wobbly". Not tried on the iPad.

## v64 (20 Nov 2026) — front page tidy
- Home screen in portrait: title + clock on row 1, Last night / Grown-ups / bell on row 2 (they were squashed and cut off).
- Time-bar sun stays fully on the bar at the end. Farm note in card footers gets line spacing.
- Rock game: "Cottage · 0 of 223 laid" label moved under the view buttons (they covered it in landscape).

## v65 (20–21 Nov 2026) — walls, fire result, crafting, turning (overnight round 1)
- Strength sign over each wall with straw: WILL FALL / LEANING / WOBBLY / PROPPED UP / HOLDS, with boxes (straw vs how much it holds, white line = breaking point, gold = propped).
- Danger card: "Two ways to save a wall" (1. fix the straw, 2. prop it up) with a "Prop up the ___ wall (N blocks)" button: picks good blocks, turns to the wall, shows only the spaces next to it, counts down, "Propped up!" message. Also on Last look.
- After the fire: big message over the picture + a ✅/❌ list per wall (fell / stood because propped).
- "My pieces" hides at night and while a sheet (Craft etc.) is open, so panels get full height; it never takes more than ~half the side.
- Crafted items go onto laid gold/silver/gem blocks; craft pictures show them on gold.
- ⟲ ⟳ turn buttons on the picture; two-finger twist turns the house.

## v66 (21 Nov 2026) — overnight round 2 (from 3 agent reviews; round 1 overall 6.5/10)
- Controls: a quick swipe from a glowing space now TURNS the house (a short 0.17s hold before a block shows); aiming is right under the finger (no jump up a row); calmer turning; two-finger twist only after a clear twist, zoom frozen while twisting.
- Props hold for ONE fire: the blocks that carried the wall go to the rubble pile (rules brace.oneFire; theology: straw can't pile up behind props). Messages say so.
- Wall signs: icon + word + "N straw · holds N" + boxes; tap a sign to prop that wall (or turn to its straw).
- Last look: right reason for a cave-in ("two walls at once"), prop buttons always shown, propped walls named.
- Fire: flame burst before straw turns to ash, ground shake on falls/cave-in, clack per landing block, shorter wait before it starts.
- Rebuild: 12 fallen blocks a day (was 4), "Built back!" when the pile is empty; words say blocks wait in the rubble pile.
- Crafted items 30% bigger on blocks. Portrait: pieces strip no longer cut off.

## v67 (21 Nov 2026) — overnight round 3 (round 2 scored 7.3/10 overall, up from 6.5)
- Only blocks laid with "Prop it up" count as props (rules brace.marked + markProp), so good blocks can't be stockpiled outside a wall to skip sorry. Rebuilt blocks are plain blocks again.
- Honest counts everywhere: straw burned · blocks knocked off · props used up · blocks that fell with a wall.
- "Propped up, but…" when another wall will still fall or the house will cave in. Cracked walls are named on the danger card and after a fall.
- Wall sign says "N straw · falls at N".
- A slow drag turns the house: a hold only starts when the finger stays still (6px) for 0.26s. Prop mode shows the row right against the wall first. ⌂ also turns the house back to the front.
- Fire: the world darkens while it burns, longer flames + grey smoke, a wall shudders before it falls, the view steps back after a cave-in. Bigger torch flame.
- Words: no "tonight is practice" on real fires; "forgiven, and the bale stays until you make it right"; Build it back says "tap"; the grown-up rule line no longer shows in the children's panel in the family app.

## v68 (21 Nov 2026) — levels step 1 (Joel approved the levels plan in the other session: "Yes, build it"; plan in docs/levels-proposal.md)
- Levels count NIGHTS a grown-up checked (rules countNight/level; once per night, never goes down): Apprentice 0, Builder 10, Craftsman 20, Master builder 35, Wise builder 50, then ★ every 25.
- The family app sends {kind:'night'} to the game whenever a grown-up keeps or drops a moment in the night check (quick.js). Gems and straw that arrive also count that night. NOTE: a night with nothing waiting to check doesn't count yet.
- 🔨 level badge in the game's top bar (tap = recipe book). Level-up message.
- "📖 Recipe book" (was Craft): level bar, the 6 crafts, Furniture, and "Coming next" ? cards that flip with a chime when they open.
- First furniture: a bench by the front door for 1 star, made "For Mum / Dad / my brother / my sister / a friend / a neighbour", with a name sign.
- TO DO before any child reaches 10 nights (about 10 days): build bed + table and a pet (the cards say "coming to your island soon").

## v69 (21 Nov 2026) — fixes from the final review (v67 scored 7.3/10 overall: A 7.5, B 6.8, C 6.8, D 7.1, E 7.1, F 7.0)
- On a cave-in night props are no longer "used up" first (they fall with the house). New test (117 pass).
- The wall sign changes to PROPPED UP the moment the last prop lands.
- After the fire: a cave-in is one clear row ("two walls fell together"); "are cracked" grammar; no cracked warning during the breather after a cave-in.
- Practice fire: only warns "this much straw falls" when a wall really has that much; fire words don't mention knocked blocks when none were.
- While propping, a tap never opens a straw bale. Rebuild card shows progress ("N waiting · N back up today · N more today"). Old messages clear at goodnight.

## v70 (21 Nov 2026) — bigger fire, easier taps (Joel chose this next)
- Fire: the night goes dark and red; three flickering flames sit on each straw bale for ~2s, then a column of smoke; bales burn one after another (0.42s apart) with a live "🔥 Straw burning: 2 of 4"; "The ___ is shaking…"; a falling wall creaks and shudders 1.4s, crashes with a big shake and dust. Light comes back after (kept through the redraw).
- Fallen blocks stay as heaps beside the house (both sides, up to 48 drawn) until they are built back.
- Picking up a block (or Build it back) brings the view one step closer from the far view: spaces ~40% bigger under a finger.
- Plain spaces just outside a wall with straw are hidden (they looked like props but weren't); use Prop it up there.
- Age 6: wall signs say "👆 Tap me" instead of numbers. The front wall's sign sits higher, clear of the side ones.
- Not checked on the iPad.

## v71 (21 Nov 2026) — Builder unlocks (10 nights): table, guest bed, pet
- Recipe book Furniture: bench (night 0, ★1), table by the door (night 10, ★1), guest bed (night 10, ★2), each made "For" someone real with a name sign. Locked ones show "🔒 night 10 (N to go)".
- Pet to look after (night 10, ★1): dog, cat or rabbit, sits by the front door.
- "Coming next" ? cards now start at Craftsman (fireplace, night 20).
- NEXT before any child reaches 20 nights: fireplace (Craftsman). Then the room inside at 35.

### 🏋️ Practice for gold + fixes (21 Nov 2026, app v73)
- Grown-ups home → **🏋️ Practice for gold**: per child, 🙋 *Obey straight away* (grown-up gives one small job; 10-second countdown, "first time, with a smile") or 🧘 *Calm down* (breathing circle, then "I'm calm"). Grown-up ticks ✓ Did it / ↺ Try again. Each ✓ = a gold shard ◆; 3 shards = a gold block sent to Build on the Rock ("Practised obeying straight away" / "Practised calming down"). Max 3 practices a day per child. Saved as `practice` (IndexedDB).
- Build on the Rock: practice gold and "🙏 I prayed" pieces (`from:'prayer'`) now get past the game's daily caps (the app limits them already). Tested: an ordinary second gold is still capped.
- Fix sheet step 2: straw sent from the app now gets its own make-it-right idea (wood: "Say sorry and ask 'Are you okay?'"…).
- Front-board "Tantrum" now lands as wood (blow-ups), not stubble. "Disobeyed" left as wood (Joel's "bigger things are wood").
- Checked (other chat): Undo block works 5 times; wood/hay/stubble land and burn. The 5-undo count resets when the game is reopened (left as is).
