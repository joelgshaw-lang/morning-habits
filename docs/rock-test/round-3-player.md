# Round 3: hands-on player (26 Nov 2026)

Played on :8090 at 1080x810, own kids: p3a Judah 6 (touch, sorry steps, evening, near-miss taps), p3b Annabelle 8 (touch, practice fire), p3c Eliana 12 (touch). Try-out: age 12 lone bale, age 8 Tower from empty (practice fire, real fire, Put 10 back). App with a fake 6:50am. No console errors. Fake clock and dev mode cleared.

## Scores (change from round 2)
1. Morning touch **7** (+1): heart goal on top, grace-first hay line, Say sorry now, "Today's goal done!". Still one real choice, and Say sorry now / Show me sit below the fold.
2. Clear goals **7** (+1): "Lay 8 more → left wall's bottom row" is reachable. Age-8 ladder is 7 lines; the goal ignores a fallen wall.
3. Seeing hay **7** (+1): lone-bale zoom is much closer; age-12 ring now shows. Labels float far from bales and overlap.
4. Usability **6** (=): near-miss tap still buries the bale.
5. Smoothness **7** (=): fires are short (12-14 hay ≈ 14 s). Bottom messages still cut off.
6. Playability **7** (+1): sorry → make right → grown-up check → pull is a lovely loop. Put 10 back works.
7. Creativity **4** (=): roof/door and gem colours exist but are hidden. Nothing says "I made this".
8. Long-term **6** (=): same 3 picture cards nightly; blueprint locked and looks like the Lighthouse.

## Round-2 fixes verified
- **1 Not ready yet:** works (hurt child's line → grown-up check → Not yet = nothing pulled).
- **2 Today row goal:** works ("Today's goal done! The left wall's bottom row is up.").
- **3 Heart goal:** works at 6, 8, 12. Grace line at 6/8, "Put it right today" at 12.
- **4 Touch flow:** one tap ticks only Say sorry; progress carries to the evening; bar hidden at 6/8.
- **5 Gentler words:** age-8 real fire reads "fell down", "the house could fall too". Half: bug 5.
- **6 Age 6 quieter / Pray and tell:** works.
- **7 Fire card first:** works.
- **8 Bale taps:** lone-bale zoom works (6 and 12); age-12 ring visible (half hidden by the lamp post). **Near-miss: NOT fixed** (bug 1).
- **9 Put 10 back:** works (28 → 18).
- **10 Blueprint card:** gold card works. 📜 still draws as a box; verse and fruit hidden while locked.
- **11 Fair access:** not verified (shared app: Judah already "All done" with the touch used; the dev bar's Hide resets to real time).
- **12 Put right this month:** not seen.

## New bugs (steps)
1. **Near-miss tap lays on the bale.** Sandbox age 6, 1 hay at front 0,0. Show me the hay, select Silver, tap ~20 px above the bale: silver lands at front 0,1 on top of the hay. A direct tap opens it. Also the amber ring vanishes once a piece is selected.
2. **First piece is hay = no design choice.** New live kid whose first inbox has straw: the bale lands, the building isn't empty, the picker never shows. Stuck on Cottage.
3. **Lay them for me / Lay the rest lays straw from the tray** (sandbox and try-out Test blocks): hay 2 → 14 in a stripe. Test-only, but misleading to grown-ups.
4. **Hay counts:** front 7 + right 5 reads "12 hay in your front wall and more".
5. **"Straw" at age 8:** night card "3 good pieces, 0 straw", "Tonight: 🔥 0 straw", "4 stubble hay"; Last look "it will fall".
6. **Sandbox touch unrealistic:** "106 pieces waiting", "999999 undos left".
7. **Still there:** Kind words card (sharing pictures, then prays "hurtful words"); bedtime header shows tomorrow's focus; "Your builders laid the rest"; "3 good pieces" while tray holds 12.
8. **Today goal ignores a fallen wall:** after the front wall fell, Today said "right wall's 4th row"; Build it back sat below.
9. After mending the only bale, "Choose your design" came back (pearl not counted).
10. Wording: "10 back up today! 10 more today."; "For the other person, or a grown-up: are you two right again?"

## Creativity: what would make it MINE
- In the touch: "Place 3 yourself" with 3 big glowing spots (window, door, top), not only Lay them for me.
- Roof/door colour and a name sign ("Judah's Kindness Tower") visible from day 1.
- "Paint it" with the 9 colours shown plainly, plus row patterns (stripe, heart, cross).
- Crafts offered in one tap: "You can make a 🌸 Flower box. Put it on?"
- "Take a picture" for the fridge or City.

## Top 6 changes
1. **Near-miss tap** (`tapTarget`): within one block of a bale always opens it; keep the ring while a piece is selected.
2. **Creativity in the touch** (`drawTouch`): "Place 3 yourself" spots + "Lay the rest"; name sign and chosen colours from day 1.
3. **Protect the design choice:** show the picker on first open even with a bale.
4. **Words:** hay by wall ("12 hay: 7 front, 5 right"); "straw" → "hay" for 8 and under in night card and tallies; fix "10 more today".
5. **Fallen wall first:** after a fall, Today = "Put 10 back on the front wall"; "Lay the rest" never lays straw.
6. **Fresh nights:** fix Kind words card, rotate picture cards weekly, show blueprint verse and fruit while locked, fix the 📜 box.
