# The Mine and the Temple: evaluation (round 3)

## The frameworks we used

These eight frameworks were combined into one 35-point checklist:

- **PLAY / HEP heuristics** (Desurvire): a way to review prototypes early.
- **Pinelle's 10 usability heuristics**: covers feedback, controls and whether you can see what's going on.
- **MDA** (Hunicke, LeBlanc, Zubek): do the rules create the feelings we want?
- **PENS / Self-Determination Theory**: autonomy, competence, relatedness.
- **"Juice it or lose it"** (Jonasson & Purho) and Swink's *Game Feel*: how satisfying the game feels to play.
- **Game Accessibility Guidelines** (Basic tier).
- **Dark Patterns in Games** (Zagal et al.).
- **Child design rules**: the UK ICO Age Appropriate Design Code, Apple's Kids Category rules, and Gelman's *Design for Kids*.

There is no official "game evaluation" GitHub repo. The useful GitHub lists, [awesome-game-design](https://github.com/Roobyx/awesome-game-design) and [awesome-gamedev](https://github.com/Calinou/awesome-gamedev), are reading lists, not checklists.

## Scorecard

Y/N items are yes/no checks. The other items are scored 1–5, where 5 is best. "Before" is v4 and "Now" is v6 (v5 plus sibling help and recipe unlocks).

| # | Check | Before | Now | Notes |
|---|---|---|---|---|
| **Core loop** |||||
| 1 | Child can explain good deed → gems → dig → build | Y | Y | Playtesters got it in one session |
| 2 | Every gem has a use | Y | Y | Recipes plus the 3-for-1 market |
| 3 | Interesting spending choices | 2 | 4 | Stone is now short: temple vs. buildings vs. defences |
| 4 | Steady surprises, no empty stretches | 2 | 4 | **The mine ran out at week 8.** It now grows 6 rows deeper |
| **Feedback / juice** |||||
| 5 | Every tap responds instantly | Y | Y | |
| 6 | Big moments celebrated more than small ones | 4 | 5 | "HELD!" on pillars; the ending is now hopeful |
| 7 | Cave-ins clear but gentle | 3 | 4 | Things now visibly drop into the hole; ends with "You're safe. Jesus held." |
| 8 | Key state visible without menus | 3 | 4 | Compact chip: 🪰 props, ⚠️ at risk, 🆘 to rescue |
| **Usability for kids** |||||
| 9 | A non-reader can play (icons + read-aloud) | Y | Y | Read-aloud is on by default for under-8s |
| 10 | Touch targets of 44pt or more | Y | Y | 56–84px |
| 11 | Taught one thing at a time | 3 | 4 | Recipes unlock as the temple grows: 2 at the start, 3 more after the Altar, the Garden after the Chapel |
| 12 | Undo / cancel | N | Y | New ✕ Cancel button when placing |
| 13 | Progress saves reliably | N | Y | A fire is now saved all at once (closing mid-fire used to half-apply it) |
| **Motivation** |||||
| 14 | Autonomy: choose what and where to build | 4 | 4 | Plots now show green (safe) or red (risky) |
| 15 | Competence: visible progress | 4 | 5 | "Need 2 more" on recipes; temple tiers |
| 16 | Relatedness | 2 | 4 | "I helped my brother or sister": both kids get a helping hand, and the sibling gets a "💌 … helped you! Say thank you" gift |
| 17 | Good deeds feel like celebration, not payment | 3 | 3 | Worth watching: gems are a reward |
| **Fairness** |||||
| 18 | Fire is predictable and explained | Y | Y | Lens (with the Bell Tower) plus red support lines |
| 19 | Risks can be fixed before the fire | Y | Y | Make it right, pillars, shield |
| 20 | Every loss is recoverable | Y | Y | Rescues return everything, including stacked stones |
| 21 | Feels like repair, not punishment | 3 | 4 | The ending jumps straight to the rescue |
| 22 | Works for ages 6 and 12 | 3 | 3 | Joel chose the same recipes for every age |
| **Accessibility** |||||
| 23 | Large text | Y | Y | |
| 24 | Not colour alone | Y | Y | Flies, ⚠️ and shapes |
| 25 | No timed or precise gestures | Y | Y | |
| 26 | Audio has visual equivalents | Y | Y | No separate volume control |
| 27 | Respects Reduce Motion | Y | Y | |
| **Ethics** |||||
| 28 | No ads, purchases or links | Y | Y | |
| 29 | No streaks or FOMO | Y | Y | Missing days costs nothing |
| 30 | Check against inflated logs | Y | Y | 6 logs a day, plus the PIN for ratings. PIN grace cut from 2 min to 15 s |
| 31 | Sorry is private and non-shaming | 4 | 4 | |
| 32 | Data stays on the device | Y | Y | localStorage only |
| **Family** |||||
| 33 | Parent's job takes under 30 s | Y | Y | |
| 34 | Siblings cooperate, not compete | 2 | 4 | Shared family wall: one brick per sibling help; every 10 bricks, a family feast for everyone |
| 35 | Natural stopping points | Y | Y | Swings run out |

## What changed in v5

**Bugs fixed**
- **The mine ran out after about 8 weeks.** Good deeds then gave no gems. It now grows 6 rows deeper whenever it's nearly dug out.
- **Rescuing a fallen building gave its gems back every time.** A cheap rebuild meant a loop: build, fall, rescue, rebuild, and so on. Now a rescue only returns what was actually paid.
- **Buildings didn't visually fall into the hole.** Fixed.
- **Stacked rubble lost stones.** Rescues now return every stone in the pile.
- **Closing the app mid-fire half-applied it.** The fire is now saved all at once.
- **Fire couldn't reach tunnels cut off by rubble.** It now passes through rubble.
- **Messages were hidden behind the chest.** Fixed.
- **The Fruit of the Day ignored dev mode.** Fixed.

**Game balance**
- If a grown-up had to notice something, the wobbly prop goes *under something you built*. Owning up keeps it near the mole. Hiding things now really threatens the house.
- You can't put a brace or pillar on a wobbly prop ("Make it right first 🫂"). Reinforcements protect; they don't cancel a sorry.
- Stone is now scarce:
  - 1 per rock.
  - A temple gem costs 1 stone on the foundation and 2 on a wing.
  - Recipes cost more, aiming for the first building in about days 5–7.
- The temple builds on the foundation first and the wings last. At most 3 stones fall per column.
- The Bell Tower unlocks the 👁 lens.
- The Lantern reveals hidden geodes (they're now invisible without it) and makes them break in one swing.

**Easier for kids**
- A "Put spare gems in the temple" button (it used to take 3 taps per gem).
- Each recipe ingredient now shows its fruit word and "need 2 more".
- A ✕ Cancel button when placing.
- Plots show green or red for safe or risky.
- Bigger "help!" bubbles show a count.
- The fire ending: "💛 You're safe. Jesus held." and then the camera jumps to the first rescue.

## Simulation: how it grows and how it falls

The simulation ran 30 kids × 12 weeks per profile, using the game's real rules. It records gem stones standing in the temple (finished buildings included).

| Week | Steady | Up and down | Hard patch → recovery |
|---|---|---|---|
| 1 | 22 | 15 | 15 |
| 4 | 125 | 87 | 83 |
| 5 | 164 | 115 | 99 (11 tunnels caved, 1.5 fell) |
| 6 | 204 | 143 | 118 (11 caved, 3.8 fell) |
| 7 | 243 | 172 | 129 (10 caved, 9.4 fell) |
| 8 | 282 | 201 | 139 (11 caved, 11.2 fell; about half the buildings down) |
| 9 | 320 | 231 | 173 (all buildings back after rescues) |
| 12 | 436 | 316 | 291 |

- **Growing:** steady kids reach the Great Temple by about week 10 and start the City.
- **Falling:** a hard month (more sorry, little made right, no defending) caves in about 40 tunnels. About 26 stones and buildings fall into the mine, and temple growth roughly halves.
- **Recovering:** good weeks plus rescues bring everything back within one week, then growth returns to normal.

## v6: helping each other (Joel's choice)

- **The card:** a new good-deed card, "🤗 I helped my brother or sister". The child picks who they helped, then a grown-up rates it as usual.
- **Rewards:**
  - The helper gets swings and a 🙌 helping hand.
  - The sibling gets a 🙌 helping hand too. It waits as a gift ("💌 Eliana helped you! Say thank you to Eliana!") until they next open their mine.
- **The family wall** (🧱 button, top bar): shared by everyone. Each help adds a brick in the helper's colour, showing who helped whom. Every 10 bricks is a family feast: everyone gets 1 gold and 1 helping hand.
- **Recipes unlock as the temple grows:**
  - From the start: Stone Brace and Lantern.
  - After the Altar: Golden Pillar, Shield and Bell Tower.
  - After the Chapel: Garden.
  - A 🔒 line shows what's next.
- **Ages:** recipe costs stay the same for every age (Joel's call).

## Still open (for Joel)

These earlier decisions are still waiting:
- an evening review;
- a sorry scale vs. make-it-right steps;
- confession cleansing;
- your own action list;
- a forgot-PIN reset.
