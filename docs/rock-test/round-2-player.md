# Round 2: hands-on player (26 Nov 2026)

Played on :8090 at 1080x810 as Judah (6: app morning card, touch, 2 try-out days), Annabelle (8: sandbox, practice and real fire, Build it back) and Eliana (12: big pile, filled building).

## Scores (change from round 1)
1. Morning touch **6** (+3): works end to end, but the only real action is "Lay them for me", and sorry needs a grown-up.
2. Clear goals **6** (+2): the ladder is clear, but "Today: 56 more blocks" is a week's work, and "Lay them for me" ignores it (31 pieces: 56 → 48).
3. Seeing hay **6** (+2): Show me turns the camera, and the amber rings are clear on a half-built wall. A lone bale in a full gold and silver wall is still hard to find (no red ring seen at 12), and the words mix "hay" and "straw".
4. Usability **6** (+1): the tray shows at night, bale tap and "Not tonight" work. On fire days the fire card is pushed below the fold.
5. Smoothness **7** (=): no console errors. The camera still jumps after each block, a 15-straw fire takes about 17 s, and bottom messages are cut off.
6. Playability **6** (=): make-it-right is lovely. Build it back is 42 single taps.
7. Creativity **4** (=): nothing new. Try-out bedtime still says "Your builders laid the rest: 26 pieces".
8. Long-term **6** (+1): the monthly blueprint and the "Next:" line help. The same 3 picture cards come every night, at every age.

## Round-1 fixes
**Work:** morning touch (once a day, closes itself), goal ladder (📜 draws as a box on desktop), hay chip (the top bar wraps to 2 rows), Show me, stripy straw, Not tonight, bedtime tray, no rubble auto-lay, calm pile, and fair make-it-right.

**Half:**
- Bale tap: see bug 2.
- Designs list: "Lighthouse" and "📜 The Lighthouse" sit side by side with the same picture.
- Age 6 and 8 words: see bug 1.

**Not re-tested:** Torch recipe, animal after a fall.

## New bugs (steps)
1. **"Whole house" at age 8.** Sandbox, age 8. Put 3 hay in the front wall (after the practice fire), then Fire now, then Light the fire. The After-the-fire card says "If another wall falls in the next fires, the whole house comes down". It also uses "FELL DOWN" and "rubble pile".
2. **A near-miss bale tap lays a block on top of the bale.** Try-out, age 6, 1 hay at the foot of the left wall. Select Silver and tap just above the bale: the silver lands on the hay and buries it.
3. **A lone bale at 12 is hard to find.** Try-out, age 12, 1 hay in a filled gold and silver wall. Tap the hay chip: no red ring is visible, and the camera stays far away.
4. **Mixed words for age 6.** The chip and danger card say "hay". But the toast says "That was a straw moment", and the Last look says "1 straw bale will burn" and "Is there any straw…". The bale label reads "1 straw · falls at 2", which a child can't read.
5. **Touch sorry skips a step.** Age 6, touch, tap the bale. One tap on "Grown-up: We prayed it together" ticks both "Say sorry" and "Make it right", with the line "went and made it right".
6. Still there from round 1: "Kind words" cards show sharing, the bedtime header shows tomorrow's focus, the empty-build dark tower, and the WOBBLY label far from its bale.
7. Night says "4 good pieces" while the tray holds 16 blocks.
8. **Fire card below the fold.** Fire day, age 6: the ladder pushes "🔥 Fire tonight / Show me the hay" out of view (the panel shows 273 of 794 px).
9. **Dev:** `RockPlay.simDay('hard')` throws "reading 'mix'". The frame ignores the app's fake clock, so faked-day pieces hit the day cap. Testers share localStorage on :8090: give each its own `kid=`.

## Top 6 changes
1. **Ages 6 and 8 fire words** (content.js, the cracked card in `runFire`):
   - No "whole house", "FELL DOWN" or "rubble pile" for ages 8 and under.
   - "Hay" everywhere for 8 and under (Last look, the toast, bale labels).
   - Change the bale label to "1 more hay and this wall falls".
2. **A real morning choice** (`drawTouch`):
   - 1 to 3 big buttons such as "Lay 3 on the left wall", each with a flying-block moment.
   - "Lay them for me" fills the Today-goal wall first (`autoPlace` priority).
3. **A Today goal reachable today** (`todayGoal`): "Lay 8 more → the left wall is half done", with a bar. Move the whole wall to "This week".
4. **Fire-day order** (`drawLive` and `drawDay`): put the danger card and Show me the hay above the ladder, or show only the ladder's Today line on fire days.
5. **The bale wins taps** (`tapTarget`):
   - A tap within 1 block of a bale opens it, and a piece is never laid on a bale.
   - Make the age-12 red ring as strong as the amber one.
   - For a lone bale, Show me zooms about 2× closer.
6. **Build it back faster, and fresh cards** (`rebuildCard`, content.js):
   - Add a "Put 10 back" button.
   - Age-12 picture cards, a new card set each week, and Kind words pictures that show words.
