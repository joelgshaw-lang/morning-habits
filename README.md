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

- Tap your card on **Who are you?** It's the home screen all day, with a **🌳 Fruit Tree** card next to the kids.
- Each child's screen has three tabs and opens on the right one for the time of day:
  - **☀️ Morning** (6:30–7:30am window)
  - **⭐ Extra chores**: any time of day, once each per day (clean the floor, take out the trash, wipe the table, fold washing, water plants, help with dinner, pack away toys, another helpful job). A chore that's already in a child's own routine is left out of their list.
  - **🌙 Night** (6–8pm window): shower or bath, pyjamas, brush teeth, tidy my room, pack my bag.
- Tap the big **Ready, set, go!** button: a traffic-light countdown starts the morning and saves the start time. Then the habit tiles appear.
- **Your egg grows with every job.** Each finished habit or chore warms it 🔥, and extra chores warm it twice as much. It grows: egg → wobbly egg → cracking egg → hatching 🐣 → baby chick 🐥 → hen 🐔 (at 10, 25, 45, 70 and 100 warmth), with a celebration at each stage. The hen will lay eggs on the farm in Stage 2.
- **Hold** a habit tile for about a second to tick it (a quick tap only says the habit name and shows "Keep your finger down"). This stops exploring taps from ticking things.
- **↩️ Undo** shows on a tile for 8 seconds after ticking it.
- **Pray**: tap, then Start. You can tap **🏠 Let others use the iPad** while praying; the timer keeps going on your card and chimes when done.
- **🔊** top right turns read-aloud on or off. It is on by default for kids under 8.
- 🐦 on a tile means it was done before 6:30am.
- The app goes back to **Who are you?** after 1 minute of no touches, or 12 seconds after finishing everything.

## Fruit Tree

A shared family tree for the rest of the day (concept: `docs/fruit-tree-concept.md`). Tap the **🌳 Fruit Tree** card on the home screen.

- Tap your face, then **💧 I stopped to pray**. Rain falls on the roots. Each child sees only their own weekly count.
- **Hold** a moment card (e.g. "I stayed calm when I was cross") to grow fruit. A blossom pops on, then ripens. Up to 5 a day each. **↩️ Undo** in the message at the bottom.
- **🌧️ Stop & Pray**: pick a feeling, then a 30-second Scripture breath prayer, "Now tell Jesus what happened", and "Do you need to make something right?"
- Tap any fruit to hear what it means and who grew it. When you pick your face, your fruit glows.
- Fruit never earns coins and the tree never wilts.

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
