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

## How kids use it

- **Start night chores:** every night the Night tab starts with a big **Start night chores!** button, which starts a clock. All night jobs done within 40 minutes 🪙 5, within 20 minutes 🪙 5 more (🪙 10 in total). The bar is green for 20 minutes, then amber, then red.
- **After-dinner race:** in the evening a grown-up taps **🍽️ Dinner's finished** (grown-up PIN). Each child taps **Start my night jobs**: worth 🪙 10 within 5 minutes, then 2 fewer every 5 minutes. All night jobs done 🪙 10. Toilet, teeth and in bed by 8pm 🪙 5. When everyone finishes it's a **🏆 Family win** (🪙 5 each), plus 🪙 5 for beating last time and 🪙 5 more for a new family record.
- **🐔 Farm:** coins from jobs (every tile shows its 🪙 price) buy mystery eggs (usually a chicken, sometimes a duck, lizard or crocodile), feed, fence repairs, lambs, calves and buildings. One tap feeds everyone; grown animals lay eggs, grow wool or give milk to sell. Keep the fence fixed or a fox may take a chicken. Stages: Little Coop → Barnyard → Big Farm → Dream Farm. Full numbers in `docs/farm-economy.md`.
- **Streaks 🔥:** days in a row with every morning and night job done.
- **Family board (the home screen):** all three children side by side, no sign-in. Each column shows that child's **next job** big and the rest of their routine small; hold it to tick it, then go and do the next one. Mornings start with **Ready, set, go** (by 6:45 🪙 4, by 7:00 🪙 3, by 7:15 🪙 2); nights with **Start night chores**. During the day the columns show extra jobs.
- **🐔 Farm:** opens from a child's column with **their own 4-digit code**, only once their routine is done, for **2 minutes**, then a **10-minute break**.
- **🔔 Reminders (grown-ups):** tap 🔔 on the board, enter the grown-up PIN, and tap **Remind** when you had to remind a child: −🪙 1 each. A morning or night routine done with no reminders earns +🪙 2.
- Tap your card on **Who are you?** It's the home screen all day. Each card shows the egg and how many ⛏ swings are waiting in the mine.
- Each child's screen has four tabs and opens on the right routine for the time of day:
  - **☀️ Morning** (6:30–7:30am window)
  - **⭐ Extra chores**: any time of day, once each per day. 20 jobs: clean the floor, take out the trash, wipe the table, fold washing, water the plants, help with dinner, pack away toys, do the dishes, set the table, put clothes away, line up the shoes, unpack the shopping, wipe the bathroom sink, help in the yard, help a brother or sister, vacuum, and four "Another helpful job" tiles for jobs that aren't on the list. A chore that's already in a child's own routine is left out of their list.
  - **🌙 Night** (6–8pm window): shower or bath, pyjamas, brush teeth, tidy my room, pack my bag.
  - **⛏ Mine**: opens The Mine and the Temple (see below). Locked 🔒 in the morning until the morning jobs are done, and 🔑 a grown-up opens it with the PIN for 20 minutes at a time.
- Tap the big **Ready, set, go!** button: a traffic-light countdown starts the morning and saves the start time. Then the habit tiles appear.
- **Your egg grows with every job.** Each finished habit or chore warms it 🔥, and extra chores warm it twice as much. It grows: egg → wobbly egg → cracking egg → hatching 🐣 → baby chick 🐥 → hen 🐔 (at 10, 25, 45, 70 and 100 warmth), with a celebration at each stage. The hen will lay eggs on the farm in Stage 2.
- **Hold** a habit tile for about a second to tick it (a quick tap only says the habit name and shows "Keep your finger down"). This stops exploring taps from ticking things.
- **↩️ Undo** shows on a tile for 8 seconds after ticking it.
- **Pray**: tap, then Start. You can tap **🏠 Let others use the iPad** while praying; the timer keeps going on your card and chimes when done.
- **🔊** top right turns read-aloud on or off. It is on by default for kids under 8.
- 🐦 on a tile means it was done before 6:30am.
- The app goes back to **Who are you?** after 1 minute of no touches, or 12 seconds after finishing everything.

## The Mine and the Temple (1 Corinthians 3)

Each child has a gem mine under a temple built on Jesus, the foundation (`mine.html`, opened from the **⛏ Mine** tab; concept and evaluation in `docs/`).

**Habits feed the mine:**
- Each habit ticked = 1 ⛏ swing.
- A finished morning or night routine = gold hidden by the mole.
- The prayer timer = 1 swing and gold.
- Each extra chore = 1 swing and a 🙌 helping hand (helping hands clear boulders after a fall).
- **↩️ Undo** takes the swing back.

**In the mine:**
- **⭐ I did something good**: picture cards for the fruits of the Spirit. A grown-up rates it 1–5, then a gem is hidden by the mole to dig out.
- **🙏 Stop & Pray** (moved here from the old Fruit Tree): pick a feeling, then breathe and pray a Scripture breath prayer. Gold is hidden by the mole.
- **🤗 I helped my brother or sister** gives you both a helping hand. **👀 I saw God's fruit in someone** sends them a 💌. Both add a brick to the shared 🧱 family wall; every 10 bricks is a family feast.
- **💛 I need to say sorry** puts wobbly hay or wood props in the tunnels. Owning up adds fewer than being caught. A grown-up uses **Make it right** to turn them to stone.
- Gems go in the treasure chest, into the temple (Altar → Chapel → Temple → Great Temple → City), or into recipes (buildings, pillars, braces, workshop upgrades) that unlock as the temple grows.
- **🔥 The fire**: a grown-up holds the button in 👨‍👩‍👧 (the Sunday family moment). Wobbly props burn, tunnels cave in, and things built above can fall into the mine and need rescuing. A fireside talk and prayer follows.
- When a child uses their last swing of the day, a short read-aloud moment reminds them it's a game, but they will stand before God (2 Cor 5:10), and that they're safe on Jesus (1 Cor 3:11–14).
- **The grown-up PIN** opens the mine for 20 minutes (then "⏰ Mine time is over" and back to the jobs), and guards the 👨‍👩‍👧 controls (unlocked for 15 minutes). Opening the mine doesn't unlock the grown-up controls.

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
