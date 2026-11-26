# Round 1: heart review (child psychologist + children's pastor)

Read from code and words only (no browser). Marked (code) where I could not see it on screen.

## Scores
- Morning touch: **3** (code). Live mode has no morning view at all. "Today's three", the focus card and the morning prayer (`drawMorning`) only exist in the pretend mode. The app's 60-second "Picture it" (js/grow.js) is a morning goal, but it never shows the building.
- Goal clarity: **4** (code). Goal cards are switched off (`R.CONFIG.commissions.enabled=false`). The live panel shows "Today's pieces" but nothing about what I'm building towards this week.
- Hay visibility: **8**. There are distinct wood, hay and stubble looks, a pulsing red glow, a wall sign and a danger card. You can't miss it. The problem is the opposite: it is loud and red.
- Usability: **6**. The fix sheet's 3-step path (Say sorry, Make it right, Pull it out) is excellent. The danger card has too much text for a 6-year-old.
- Smoothness: **?** (code). Not judged.
- Playability: **7** (code). Free building, crafting, designs and the drag-to-pull are good.
- Creativity: **7** (code).
- Long-term motivation: **5**. Levels count checked nights, with no streaks, which is good. Risks: prayer turning into a block farm, and the fire becoming nagging by month 3.

## Words that should change
- quick.js `SAD_LINES`: "Hey, that is stinky and sad." plus flies and stink lines on the shared front board → "That was a hard moment. It can be put right. 💛". Drop the flies 🪰 and stink 〰️.
- One word for children. Today they see "straw", "hay", "stubble", "wood", "bale" and "Burns up (wood, hay, straw)". Use **"hay"** for ages 6 and 8 everywhere ("Hay landed: Rude words."). Keep wood/hay/stubble only as the look, and in words for age 12.
- dangerCard: "If it came now, the WHOLE HOUSE would cave in!" → "If the fire came now, the house would fall down. You can fix it." Also "the WHOLE house comes down" → "it could fall".
- dangerCard step 2: "Say sorry to God (tap Amen)". For age 6 the button is really "Grown-up: We prayed it together" → "Say sorry to Jesus with a grown-up".
- `straw.forgivenStillBurns`: "The bale stays in the wall until you make it right" (sounds like forgiveness isn't finished) → "Jesus has forgiven you, all of it. Now go and show love to the person. Then you can pull the hay out."
- `tomorrow.reminder['8']`: "Tomorrow will be played on eternity's screen" (too abstract at 8) → use the age-6 line for 8. Keep Joel's line for 12.
- "rubble pile" → "fallen blocks" (age 6). "sealed" → "finished and safe". "Extra mortar" → add "(your walls hold one more hay)".
- `v5.quick.strawNote`: "Kept straw lands tonight" → "Hay a grown-up said yes to lands tonight."

## Risks
1. **Sibling holds the key (fairness/shame).** In the fix sheet, if the other child taps "Not ready yet", the hay stays and can still burn. A 12-year-old could make her brother's wall fall by not forgiving. The content says it "does not count against the child", but the rules don't protect it.
2. **Double penalty.** A kept hard moment takes coins (quick.js) *and* lands hay that can knock blocks down. The "growing bonus" also rewards fewer hard moments, not calming down afterwards. The research says: tiny penalties, and reward recovery.
3. **Public shame.** The flies and stink pile shows full-screen on the shared front board, in front of siblings. content.js itself says "Name straw quietly".
4. **Prayer paid in blocks.** "I prayed" sends gold, silver or a gem up to 10 times a day and skips the caps (`meta.practice`). "Sorry / help me grow" pays a gem. No coins, but it is still "pray → get". By month 3 a child can farm it.
5. **Fear at age 6.** Fire comes 3 nights a week (age 12: 2). Two hay in one wall falls it (`fallAt 6:2`), and the hay all goes to the same wall. A 6-year-old needs a grown-up for both sorry and making it right. The red pulsing glow, "TONIGHT!" and caps lettering add to it.
6. **Mixed meanings.** quick.js "Disobeyed" = wood, but content.js says wood = fights and blow-ups, and not listening = stubble.

## Top 6 changes (most important first)
1. **Child's part done = safe from fire.** In play.html `sheets.fix`, the `notReadyYet` `onNo` handler should set `m.went=true; m.waiting=true` and call `R.markMadeRight(s,w,c,r,'tried')` so the pull is allowed. The content line "You did your part" then becomes true. Add a test in rules.test.js.
2. **Morning look in the app, not the 3D game (under 30 s).** In js/grow.js `openPicture`, show a still picture of the child's building. Save it when the game closes: in play.html, `renderer.domElement.toDataURL('image/jpeg',0.5)` → `localStorage['rock.snap.'+kid]` (the drawing canvas needs preserveDrawingBuffer, or capture right after a render). Add two lines: "Today I'm growing: **Kindness**: *I will …*" (from `goalToday`) and, if there is any, "1 hay waiting to put right 💛". Shorten the timer to 20 s for age 6. Keep one gem a day. No building before school.
3. **Make it quiet and private.** In quick.js `bigMoment` for hard moments: no flies or stink, a small card, the kind words only. In play.html `strawHalo`: amber (0xe8a33a) and a slow glow for age ≤8, not red pulsing. In `dangerCard`: for age 6, show one line plus the "Show me the hay" button, and hide the prop-it-up details.
4. **Gentler for age 6.** In rules.js CONFIG: `fallAt: {6:3, 8:2, 12:2}` and `fireNights: {6:[2,5], …}`. That is still fair, because each child's fire matches their own age, and the extra-mortar wording already explains "everyone gets what they need".
5. **Prayer is a gift, not a till.** In js/app.js `openPrayed`, only the *first* prayer of the day sends a building piece (gold). Later ones send `{kind:'night'}`-style "light a candle" items that `liveSync` turns into candles or lanterns (`R.addPrayer`), which never build. "Sorry / help me grow" should never pay a gem: send a candle.
6. **A visible "building towards" line.** In play.html `drawLive`, under the title, add one line from `R.summary`: "Your Cottage: 34 of 56 spaces filled. Next design opens after 1 more finished building." Add the focus fruit from the app's plan (pass `&goal=kindness` in the `openRockNow` iframe URL) so laying a matching gem says "That's today's fruit!". Also swap quick.js `growBonus` (fewer hard moments) for a bonus on "Cooled down" moments.
