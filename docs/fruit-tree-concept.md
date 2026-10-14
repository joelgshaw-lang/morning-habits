# The Fruit Tree: concept

*"I am the vine; you are the branches. If you remain in me and I in you, you will bear much fruit."* John 15:5

This concept came out of three drafts and three critiques:
- **Drafts:** faith formation, game design, family practice.
- **Critiques:** role-playing Eliana, Annabelle and Judah through a real week; a pastor and a ministry parent; a product lead focused on what can actually be built.

## The big idea

One **family tree** lives in the app.
- **Prayer is water.** Each time a child stops to pray, rain falls on the roots.
- **Fruit is what God grows.** When a child acts with patience instead of lashing out, shares, or tells the truth, a blossom pops onto the tree and becomes fruit.
- The app always gives God the credit: *"Thank you, God, for growing patience in Judah."*

The tree **never wilts, never loses fruit, has no streaks and earns no coins.** The pets carry consequences; the tree stands for grace. Fruit is never bought, sold, ranked or turned into rewards.

## Principles every critic agreed on

1. **No scoreboard.** All fruit hangs on one shared canopy, not on colour-coded branches. That stops Annabelle counting Judah's fruit against hers. When a child taps their own face, *their* fruit glows. Tapping any fruit tells you whose it is and what happened.
2. **Prayer counts are private.** The shared screen shows rain with no names. A child hears only their own count, pointed toward God: *"You talked to God 6 times this week. He heard every one."* Parents see each child's count behind the PIN as a way to start a conversation, never as a target.
3. **Forgiveness is never rewarded or forced.** If the hurt child is pressed to tap "I forgive you" and gets a prize for it, the forgiveness is coerced, and the child who caused the hurt gets rewarded too.
4. **Lashing out is never recorded.** Only good moments and repairs are recorded.
5. **The parent load is tiny.** The app must work fully even if the only family ritual is a short Sunday meal.

## Version 1 (build first)

| Feature | How it works | Taps |
|---|---|---|
| **The tree screen** | Inline SVG tree with gently swaying branches and a bird that visits. After the 7:30am window closes, it becomes the home screen until 3am. In the morning a 🌳 button opens it, and "Ready, set, go" is unchanged. | — |
| **💧 I stopped to pray** | Tap your face, then 💧. A short rain animation plays (about 10 seconds, which stops spamming), and the child hears their own weekly count. | 2 |
| **🌧️ Stop & Pray** | For hard moments. Pick a feeling face, then a 30-second Scripture breath prayer plays on a calm screen. It can use Mum's or Dad's recorded voice in v2. Afterwards: "Now tell Jesus what happened," a short quiet, then "Do you need to make something right?" A parent can start it by long-pressing a child's face. | 2–3 |
| **Fruit moments** | Tap your face, then **hold** a picture card. A tap reads the card aloud; holding plants the fruit (the same as morning habits). Undo stays for 8 seconds. Soft cap: 5 a day. | 2 |
| **Grace line** | On a quiet day the tree says: *"The roots are still strong. Jesus holds the tree."* | — |
| **Parent view** | Behind the PIN: prayer counts and moments per child, and removing a mistaken entry (never as punishment). | — |

**Stop & Pray breath prayers**

| Feeling | Breathe in… | Breathe out… |
|---|---|---|
| 😠 Angry | "Set a guard, Lord…" | "…over my mouth" (Psalm 141:3) |
| 😟 Worried | "When I am afraid…" | "…I will trust in you" (Psalm 56:3) |
| 😢 Sad | "The Lord is close…" | "…to the broken-hearted" (Psalm 34:18) |
| 🤕 Hurt | "God is my refuge…" | "…and my strength" (Psalm 46:1) |

Finishing Stop & Pray also adds a 💧.

**The six v1 moment cards.** Each card *suggests* a fruit; at Harvest the family talks about which fruit it really was.

| Card | Fruit | Kid meaning |
|---|---|---|
| 😤➡️😌 I stayed calm when I was cross | 🥥 Self-control | "My body listens to me, not my mad feelings" |
| ⏳ I waited my turn | 🍇 Patience | "Waiting with a calm heart" |
| 🤝 I helped without being asked | 🍒 Kindness | "Doing something nice for someone" |
| 🎁 I shared | 🍓 Love | "Putting others first" |
| 🙋 I told the truth | 🍎 Goodness | "Doing right, even when it's hard" |
| 🫂 I said sorry first | 🫒 Peace | "Making things right" |

Joy 🍊, faithfulness 🍐 and gentleness 🍑 arrive in v2 with their own cards.

## Version 2

- **🍯 Sunday Harvest** (about 10 minutes at a meal, the one ritual the design relies on):
  - Celebrate answered prayers first.
  - The week's fruit drops into a basket one at a time and is read aloud ("Look what God grew this week"). Each child can tell the story or say "pass".
  - The family picks the next **Fruit of the Week** from a preloaded 9-week rotation of verses, so there's nothing to plan.
  - Harvested fruit go into jars on a **Pantry** shelf, a lasting family record like Joshua's stones of remembrance. The jars are sorted by fruit, never by child.
- **👀 I saw…:** spot fruit in a sibling or parent, marked 💛. Capped at 2 spots of the same person a day, so nobody can trade spots.
- **🩹 Fix-it:**
  - The child who caused the hurt picks pictures: "I… hit / grabbed / broke / yelled" and "Next time I'll… ask / walk away / use words".
  - The hurt child chooses between three equal options: **I heard you / I forgive you / Not yet**. None of them earns a reward.
  - The apologiser's fruit comes from saying sorry, not from being forgiven. It ends with "Tell God sorry too" (1 John 1:9).
  - Either child can log "we sorted it" for an apology made off-screen.
- **🙏 Prayer list and Answered jar:** after a 💧, an optional extra tap says who it was for (thank you / someone / me / I was upset). "Someone" picks a face from the family prayer list (Grandma, a friend, missionaries).
- **Eliana's mode:** text-first and muted. She can write her own moments and keep an "only me" option that still adds to the family basket without her name.
- **Mum and Dad on the tree:** parents log their own fruit and their own fix-its, so the kids see that grown-ups are still growing too.
- **Seasons:** when the tree fills (about 3 months), the family harvests it and a new sapling grows beside it.

## Deliberately left out

- **Rewarding forgiveness, and colour-coded branches.** Both bring back pressure and comparison.
- **The morning Pray habit adding a 💧 automatically.** It would inflate the count that's meant to mean something.
- **A family check-in every night.** It wouldn't survive a busy ministry term. The app works without it.
- **Decorations unlocked by a fruit target.** Kids would pad entries to reach the goal.
- **Hosting duty for Eliana.** A 12-year-old would feel like a deputy parent. Hosting rotates and is opt-in.

## Risks to watch

- **Judah treating it as a sound toy.** Holding to plant, the rain animation and the daily cap all slow him down. Don't cross-examine him; Harvest is the gentle place for truth.
- **Eliana dropping out.** Her mode and privacy are the fix, so bring them forward if she disengages.
- **The pet and tree messages clashing.** Pets that get sick (consequences) and a tree that never wilts (grace) teach different lessons. Keep them visually separate, and never let streaks or the leaderboard touch prayer or fruit.
