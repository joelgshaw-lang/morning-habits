# Morning Habits

A morning habit tracker for one shared family iPad. Plain HTML, CSS and JavaScript. No build step. Works fully offline once loaded.

## Files

| File | What it does |
|---|---|
| `index.html` | Page shell |
| `styles.css` | All styling |
| `js/app.js` | Screens, habit tapping, prayer timer, dev mode |
| `js/clock.js` | Current time (fakeable), 3am day rollover, time formatting |
| `js/config.js` | Default kids, habits, timer lengths, window times |
| `js/db.js` | IndexedDB storage |
| `sw.js` | Service worker for offline use |
| `manifest.webmanifest`, `icons/` | Home screen install |

## Run it on your Mac

```bash
cd "/Users/joelshawgmail.com/Documents/Claude Code/Family"
python3 -m http.server 8080
```

Then open http://localhost:8080 in Chrome or Safari.

## Host it free on GitHub Pages

Service workers need HTTPS, so the iPad needs a hosted copy. GitHub Pages gives you that free.

1. Create a new repository on github.com, for example `morning-habits`. It must be public on a free GitHub plan (private Pages needs GitHub Pro). Note that `js/config.js` contains the kids' first names and ages, so anyone with the link could read them. Ticks and history live only on the iPad.
2. Upload every file and folder in this directory (drag them into "Add file → Upload files"), or push with git:
   ```bash
   git init && git add . && git commit -m "Morning Habits" && git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/morning-habits.git
   git push -u origin main
   ```
3. In the repo: **Settings → Pages → Build and deployment → Source: Deploy from a branch → main / (root) → Save.**
4. After a minute your app is at `https://YOUR-USERNAME.github.io/morning-habits/`.

**Updating:** when you change files, also bump `VERSION` in `sw.js` (for example `v1` → `v2`). The iPad picks up the new version the second time the app is opened.

(Netlify works too: drag this folder onto https://app.netlify.com/drop.)

## Add to the iPad home screen

1. Open the GitHub Pages URL in **Safari** on the iPad (must be Safari).
2. Tap the **Share** button → **Add to Home Screen** → **Add**.
3. Open it from the new "Morning" icon. It runs full screen, landscape, and offline.

Tips for a shared kitchen iPad:
- **Settings → Display & Brightness → Auto-Lock → Never** (or 10 min) so it stays on in the morning. The prayer timer also asks the screen to stay awake while it runs.
- **Guided Access** (Settings → Accessibility → Guided Access) keeps kids inside the app.
- Keep the app on the home screen. iPadOS keeps home screen app data; plain Safari tabs can be cleared after weeks of non-use.

## Current rules (16 Nov 2026)

These win over anything older further down.

- **Morning:** tap **Ready, set, go!** by 7:15 (change it in Grown-ups → Morning). Starting later means no coins that morning (job stars still count). If a grown-up has to ask (🔔), that routine loses 🪙 20, once, and the day never goes below zero. The child's column shows which job, plus "Tomorrow is a fresh start."
- **🍓 Fruit time:** after Ready, set, go, each child meets the next 3 fruits of the Spirit (✓ this is / ✗ this is not pictures, read aloud), gives stars (under-8s get 3 face stars, 8+ get 5), then a 2-question "which fruit is which" quiz. After all 9 they pick their own fruit for the week. "Not today" is always allowed. Their Fruit Friend badge shows on their column.
- **Night:** house jobs only (bath, teeth and bed are off the iPad). Then **🌙 Going up!**: one night fruit question and "How did your fruit go today?", then goodnight. The iPad stays downstairs. No farm at night.
- **Next morning:** a grown-up taps **Last night 🛏️** (PIN): stayed in bed 🪙 15, got up once 🪙 5, otherwise nothing.
- **🙏 Breath prayer:** hold for one guided 5-second breath, up to 3 a day. No coins for prayer.
- **Fair board:** coins, streaks and 🔔 counts are not shown side by side. A child's coins show briefly when earned and on their farm. Two children can hold jobs at the same time.
- **Grown-ups:** the PIN is needed every time; the area closes after 3 minutes (🔒 Lock now closes it sooner). Tabs include 🍓 Fruit (one child at a time) and 🔊 Voice. `?dev=1` also asks for the PIN.
- **🌱 21 Nov 2026 (v74):** animals sell for less than they cost (70% of what was paid); farm troubles about once a week (storm, flood, sick animal, caterpillars, wind) with a "Needs fixing" box; +🪙 3 the day after fewer hard moments; 🧱 Rebuild pack (🪙 20 for up to 12 fallen blocks) on the child's Grown-ups page; 🌱 button on each column for memory verses, growing in / working on, plan for tomorrow and a 60-second picture-it. Details: STATUS.md.
- **Farm:** shop words show real prices. To sell, pick the animal, say goodbye, hold to sell, and "Bring it back" works for 10 seconds. For under-8s the fox only scares the animals.

- **🪙± Coins from the front board (18 Nov 2026):** each column has a 🪙± button. Any grown-up taps it (no PIN), picks 🪙 1, 2 or 5 and a good moment (💛 Kind, 🤝 Helpful, 😊 Great attitude, 🧘 Calmed down, 🙌 Told the truth, ⏳ Waited well) or a hard one (😡 Tantrum, 🙉 Didn't listen = stubble; 🗯️ Unkind words, 😤 Rude = hay; 🥊 Fighting, 🙅 Disobeyed = wood). It shows ⏳ on the column until the night check: at night a **🌙 Check coins** button appears in the header (PIN), or check them on the child's Grown-ups page. ✓ Keep adds or takes the coins (never below zero) and sends Build on the Rock a gem, or wood / hay / stubble. ✕ Not quite drops it.
- **🏰 Build on the Rock (18 Nov 2026):** opens from the child's Grown-ups page (🏰 Open building). Gets gold for a finished prayer timer, silver for a finished morning or night routine, and the kept front-board moments. Needs internet.
- **Grown-up farm time:** a farm opened from Grown-ups also has 3 minutes (doesn't use a visit); then the PIN again.
- **🎤 Singing lesson and 🎹 Keyboard (18 Nov 2026, replaced Music; 24 Nov: Keyboard 10 minutes, bonus to 20):** morning jobs for every child. Singing lesson is 7 minutes, Keyboard 10. Tap the tile to start the timer (tap again to pause). When the time is up the job ticks itself (normal morning job coins). Keyboard keeps counting: +🪙 1 for each whole minute from 11 to 20 (up to +10), then stops by itself at 20:00; ⏹ Stop ends it sooner. Morning only. A running timer shows on the big tile.
- **💎 Big moment (24 Nov 2026, v75):** logging a good moment on 🪙± flashes a big gem full screen ("WOW, name!", gem colour by fruit, chime and voice). A hard moment shows "Hey, that is stinky and sad. Let's make it right." Tap or wait a few seconds to close. `bigMoment` in js/quick.js.
- **🎨 Painted farm (the only farm since 18 Nov 2026):** The farm becomes a painted paddock of squares with painted animals. All the old rules (coins, stars, shop, feeding, selling, fox, fence) are the same, and switching it off brings the old farm back with nothing lost.
  - **🔨 Build:** tap Build, tap a thing, tap a glowing square to move it. Each move, new garden bed or planting uses one **move**: 3 on a day the jobs are done, 1 on other days, 8 on Saturday (Build Day).
  - **One-time set-up:** the first time, the button says **Set up my farm** and moves are free and unlimited until the child taps Done and then "Yes, I'm finished". If farm time runs out first, they carry on next visit. Grown-ups → ⚙️ Settings → 🔄 App → Farm set-up → **Give again** gives every child another one.
  - **Animals stroll** a little way and back. Hungry or sleeping animals stand still.
  - **Garden beds:** one free bed to start; more cost 🪙 40 + ⭐ 4, up to 2 / 3 / 4 / 5 beds by farm stage. Seeds: carrots 🪙 5 (2 job days, 3 carrots at 🪙 5), wheat 🪙 6 (3 job days, 4 at 🪙 6), sunflowers 🪙 10 (4 job days, 4 at 🪙 10, from Barnyard). Crops only grow on days the jobs are done. Tap a ripe bed (or 🧺 Pick everything) and sell from the basket.
  - **Lots of animals:** each kind stands in a group of up to 4 with a number ("9 sheep"), and the land grows from 6 to 10 squares a side as the farm fills.
  - **⛶ Full screen and zoom (17 Nov 2026):** ⛶ (top right of the field) shows the farm over the whole screen, ✕ goes back. ➕ / ➖ (bottom right) or pinch with two fingers to zoom, and drag with one finger to look around when zoomed in. Building, planting and picking all work while zoomed; a drag never drops something on a square.
  - **🗺️ Bigger land (17 Nov 2026):** the starter land grows by itself to 10 squares a side. After that, **Bigger land** (🪙 400 + ⭐ 40, from Big Farm) makes it 13 squares a side, and **Biggest land** (🪙 900 + ⭐ 90, from Dream Farm, after Bigger land) makes it 16. Everything stays on the same square; the new land is added along the front. When the farm is more than half full and can't grow by itself, a "Getting crowded!" button points to the shop.
  - **🌼 Land update (24 Nov 2026, v75):** four lands, each with its own painted picture: Starter (10 squares), **Meadow land** (🪙 1,000 + ⭐ 15, from Barnyard, 12 squares, wildflowers and a stone wall), **River land** (🪙 2,500 + ⭐ 40, from Big Farm, 14 squares, river, bridge, willows; was Bigger land), **Hilltop land** (🪙 6,000 + ⭐ 90, from Dream Farm, 16 squares, hills, lake, mountains; was Biggest land). Farms that already had Bigger or Biggest land move up one (`landOf` in js/farm-world.js). **Special land pieces** (2×2, just for looks, need Meadow land): 🌸 Wildflower patch 🪙 600 + ⭐ 12, 🌲 Little bush forest 🪙 900 + ⭐ 20, ⛰️ Grassy hill 🪙 1,200 + ⭐ 25, 🏖️ Beach corner 🪙 1,500 + ⭐ 30. **Farm goods sell for half since 24 Nov 2026** (see docs/farm-economy.md "Price check"). Pictures from kie.ai (nano-banana-2), prompts in docs/farm-mockup/source-art/.
  - **🐷 Pigs (17 Nov 2026):** **Piglet** 🪙 120 + ⭐ 12, from Barnyard. Grows in 8 feeds into a pig (feed 🪙 2), which finds a 🍄 truffle (sells for 🪙 15) every second day it's fed on a job day. Sells for 🪙 100. Up to 2 pigs (4 with the big barn). Painted farm only: the shop hides piglets and land when the painted farm is off, but pigs already bought still show (painted) on the old farm.
  - Code: `js/farm-world.js` (drawing and layout), the "painted farm" block near the top of `createFarm` in `js/farm.js`, pictures in `farm-art/`.

Plans and reviews: `docs/review-round3.md` (latest review and what's next), `docs/redesign-plan.md` (Joel's plan).

## How kids use it

- **Start night chores:** every night the Night tab starts with a big **Start night chores!** button, which starts a clock. All night jobs done within 40 minutes 🪙 5, within 20 minutes 🪙 5 more (🪙 10 in total). The bar is green for 20 minutes, then amber, then red.
- **After-dinner race:** in the evening a grown-up taps **🍽️ Dinner's finished** (grown-up PIN). Each child taps **Start my night jobs**: worth 🪙 10 within 5 minutes, then 2 fewer every 5 minutes. All night jobs done 🪙 10. Toilet, teeth and in bed by 8pm 🪙 5. When everyone finishes it's a **🏆 Family win** (🪙 5 each), plus 🪙 5 for beating last time and 🪙 5 more for a new family record.
- **🐔 Farm:** coins from jobs (every tile shows its 🪙 price) buy mystery eggs (usually a chicken, sometimes a duck, lizard or crocodile), feed, fence repairs, lambs, calves and buildings. One tap feeds everyone; grown animals lay eggs, grow wool or give milk to sell. Keep the fence fixed or a fox may take a chicken. Stages: Little Coop → Barnyard → Big Farm → Dream Farm. Full numbers in `docs/farm-economy.md`.
- **Streaks 🔥:** days in a row with every morning and night job done.
- **Family board (the home screen):** all three children side by side, no sign-in. Each column shows that child's **next job** big and the rest of their routine small; hold it to tick it, then go and do the next one. Mornings start with **Ready, set, go** (start before 7:00 for 🪙 5; every morning job done within 45 minutes of starting, with no reminders, for 🪙 20); nights with **Start night chores**. During the day the columns show ideas for extra jobs. Every time coins are earned, a big "+5 🪙" pops up and coins fly into the child's counter.
- **⭐ Extra jobs:** a child taps ⭐ (or a job icon during the day), picks the job they did and claims it. A grown-up confirms it with the PIN, straight away or later in the portal, and the coins fly in. Up to 🪙 20 a day each.
- **🌙 Nights have two parts:** after-dinner house jobs (allocated per child in the portal, timed by **Start night chores**), then bedtime (tidy room, pack bag, bath, pyjamas, teeth, toilet, in bed).
- **🙏 Breath prayers:** hold 🙏 in a child's column for one guided breath, up to 3 a day. No reward.
- **🐔 Farm:** opens from a child's column with **their own 4-digit code**, **three times a day for 3 minutes** (at least an hour apart, and the third only from 12:30 pm, after lunch), once their routine is done (during the day: once the morning or an extra job is done). **At night**, finishing the after-dinner chores shows a big **🎉 Night chores done! Open my farm · 3 min** button: one extra visit before bedtime that doesn't use up the daytime visits. Each column also shows a tally of their animals and "🎯 N more → next thing to buy".
- **👨‍👩‍👧 Grown-ups (PIN, 18 Nov 2026):** opens on a big card for each child (coins, jobs waiting to check, times asked today). Tap a child for their page: 🐔 Open farm (no time limit, doesn't use their visits), jobs they say they did, give or take coins, tick a job, and their fruit. **⚙️ Settings** holds the rest: night jobs, morning jobs, extra jobs, voice, and App (update now, give farm set-up again, Build on the Rock try-out).
- **🔔 Reminders (grown-ups):** tap 🔔 on the board, enter the grown-up PIN, and tap **Remind** when you had to remind a child: −🪙 1 each. A morning or night routine done with no reminders earns +🪙 2.
- Tap your card on **Who are you?** It's the home screen all day. Each card shows the egg.
- Each child's screen has four tabs and opens on the right routine for the time of day:
  - **☀️ Morning** (6:30–7:30am window)
  - **⭐ Extra chores**: any time of day, once each per day. 20 jobs: clean the floor, take out the trash, wipe the table, fold washing, water the plants, help with dinner, pack away toys, do the dishes, set the table, put clothes away, line up the shoes, unpack the shopping, wipe the bathroom sink, help in the yard, help a brother or sister, vacuum, and four "Another helpful job" tiles for jobs that aren't on the list. A chore that's already in a child's own routine is left out of their list.
  - **🌙 Night** (6–8pm window): shower or bath, pyjamas, brush teeth, tidy my room, pack my bag.
- Tap the big **Ready, set, go!** button: a traffic-light countdown starts the morning and saves the start time. Then the habit tiles appear.
- **Your egg grows with every job.** Each finished habit or chore warms it 🔥, and extra chores warm it twice as much. It grows: egg → wobbly egg → cracking egg → hatching 🐣 → baby chick 🐥 → hen 🐔 (at 10, 25, 45, 70 and 100 warmth), with a celebration at each stage. The hen will lay eggs on the farm in Stage 2.
- **Hold** a habit tile for about a second to tick it (a quick tap only says the habit name and shows "Keep your finger down"). This stops exploring taps from ticking things.
- **↩️ Undo** shows on a tile for 8 seconds after ticking it.
- **Pray**: tap, then Start. You can tap **🏠 Let others use the iPad** while praying; the timer keeps going on your card and chimes when done.
- **🔊** top right turns read-aloud on or off. It is on by default for kids under 8.
- 🐦 on a tile means it was done before 6:30am.
- The app goes back to **Who are you?** after 1 minute of no touches, or 12 seconds after finishing everything.

## Farm: jobs stay essential

- **⭐ Job stars:** 1 for every job done. Big farm things cost coins *and* stars, so selling alone can't buy them.
- **Animals work when you work:** the farm only makes eggs, wool, milk, apples and honey on days a routine (or 2 extra jobs) is done.

## Grown-ups: coins

In **👨‍👩‍👧 Grown-ups** (PIN), the **🪙 Coins** tab adds or takes away coins for a child (−10 to +10 at a time, with a reason). Jobs a child claimed but nobody checked carry over to the next morning, so they can still be confirmed.

## Dev mode (fake the time)

Open the app with `?dev=1` on the end of the URL (`?dev=0` turns it off). A black bar appears at the bottom:

- **Set time**: pick any date and time, then tap Set. The clock keeps ticking from there.
- **+5m / +15m / +1 day**: jump forward.
- **Real time**: back to the real clock.
- **Fast timers**: the prayer timer runs 60× faster (3 minutes takes 3 seconds).
- **Clear today**: wipe today's ticks for all kids (asks first).
- **Export JSON**: download all data.
- **Hide**: turn dev mode off.

A red **DEV** tag next to the clock means the time is faked. Tap **Real time** before handing the iPad back to the kids.

## Stage 1 test steps

1. Open `http://localhost:8080/?dev=1`. Set the time to tomorrow 6:40am. The window bar is green, shows minutes left, and a ☀️ slides left as time passes (turns yellow, then red).
2. Tap **Judah**, then **Ready, set, go!** (red, yellow, green countdown). Quick-tap **Make bed**: it wiggles and says "Keep your finger down". Hold it: it fills up, ticks, and bursts stars. Tap **↩️ Undo** to untick.
3. Read-aloud is already on for Judah (🔊). Holding a tile speaks its name.
4. Tick **Fast timers**. Go to **Eliana → Pray → Start** (10 min = 10 sec). Tap **🏠 Let others use the iPad**. Her card shows "🙏 Praying 0:07". Open Annabelle meanwhile. Eliana's prayer finishes, chimes, and shows a toast.
5. **Pray → Start → Stop → Stop** gives "Try again, you can do it" and the habit stays undone.
6. Finish all of one child's habits: full-screen "All done" moment, trophy lights up, back to the picker 12 seconds later.
7. Set the time to 2:59am the next day, then **+5m**: everything resets for the new day.
8. Reload the page: ticks stay (IndexedDB). A running prayer timer also survives a reload.
9. On the iPad: install it, turn on Airplane Mode, open it again. It still works.
