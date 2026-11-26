# Build on the Rock: test brief (26 Nov 2026)

## What it is
A Christian family's iPad morning-habits app (children Eliana 12, Annabelle 8, Judah 6). "Build on the Rock" (1 Corinthians 3:10-15) is a 3D building game inside it.
Real life gives pieces: gold = time with God (prayer), silver = faithful work (routines done), gems = fruit of the Spirit seen (good moments, coloured by fruit),
straw (hay / wood / stubble) = hard moments a grown-up kept at night (tantrum, disobeyed, unkind...). Straw is built into the walls and can burn in "fire nights";
pearls (owning up) bring back fallen blocks. Children choose where good pieces go; straw lands by itself.

## Joel's goals for this testing (in his words, tidied)
- Kids have **a little touch with their building in the morning** (today the building only opens from the Grown-ups page, or after 3pm).
- **Very clear motivation for building, with goals** (what am I building towards today / this week?).
- Kids can **see if they're building with hay** (straw in their walls should be obvious and mean something).
- **Usability, smoothness, playability, creativity.**
- **Stays motivating long term** (month 3, month 6), not just the first week.
- Constraints: low iPad time (mornings are tight: start by 7:15, done by 7:30); fair between siblings of different ages; grace not earning
  (prayer is not paid in coins); no "magic" words; plain kid-friendly words; works on an old iPad 7 (Safari, 1080x810 landscape).

## Where things are
- Game page: `docs/rock/play.html` (one big file: page, 3D drawing, panels). Rules engine: `docs/rock/rules.js` (+ `rules.test.js`, run `node rules.test.js` inside docs/rock). Words: `docs/rock/content.js`.
- How the family app opens it: `js/app.js` `openRockNow` (iframe `docs/rock/play.html?live=1&kid=..&name=..&age=..`), pieces arrive through localStorage `rock.inbox.<kid>` (see "section 10" comments near `liveSync` in play.html). `js/quick.js` (front-board good/hard moments), `js/app.js` "I prayed".
- Try-out (no family app): `http://localhost:8081/docs/rock/play.html` (pretend children, "Next morning", "Fire now" etc.). Live-like: `http://localhost:8081/docs/rock/play.html?live=1&sandbox=1&kid=test&name=Test&age=8`.
- Earlier design notes: `~/.claude/plans/i-would-like-you-nifty-valiant.md` (Design v4/v5), STATUS.md sections "Build on the Rock".

## Round notes
Each round's findings go in `docs/rock-test/round-N.md`.
