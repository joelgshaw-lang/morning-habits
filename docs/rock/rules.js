/* Build on the Rock: rules engine (1 Cor 3:10-15). No DOM, no drawing, no Math.random.
   Browser: <script src="rules.js"> defines window.RockRules.  Node: require('./rules.js').
   State is plain JSON (safe for localStorage). Every function mutates the state it is given
   and returns { ok, events } (or plain data for the read-only ones).
   Slots are addressed (wall, col, row): wall 'front' | 'left' | 'right' | 'free' | 'spire'; row 0 is the bottom.
   A piece is { id, t, f?, m?, seq?, forgiven?, madeRight? }: t = 'G' gold, 'S' silver, 'W' straw, 'P' pearl,
   'L' lamp (old saves only), or a gem code (see CONFIG.gems); f = fruit name; m = meta (the act it came from). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.RockRules = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /* A plain box-shaped blueprint: front 5 wide with the door in the middle, two side walls. */
  function box(id, name, rows, side, free) {
    return { id: id, name: name, walls: { front: { cols: 5, rows: rows, door: 2 }, left: { cols: side, rows: rows }, right: { cols: side, rows: rows } }, free: free };
  }
  function shape(id, name, f, door, s, free) {   // f = [cols, rows] of the front, s = [cols, rows] of each side
    return { id: id, name: name, walls: { front: { cols: f[0], rows: f[1], door: door }, left: { cols: s[0], rows: s[1] }, right: { cols: s[0], rows: s[1] } }, free: free };
  }

  /* Every tunable number lives here. */
  var CONFIG = {
    wallOrder: ['front', 'left', 'right'],          // also the tie-break order for straw
    frontCols: 5,                                   // (old tier blueprints only)
    door: { wall: 'front', col: 2, row: 0 },        // never a slot (a blueprint may move it)
    rowsByAge: { 6: 3, 8: 4, 12: 5 },               // (old tier blueprints only)
    gems: { l: 'love', j: 'joy', p: 'peace', t: 'patience', k: 'kindness', b: 'goodness',
            f: 'faithfulness', e: 'gentleness', r: 'self-control' },
    blocksPerPiece: 4,                              // v7: houses ~2x again (scale below), so each good act gives 4 blocks
    extraShare: 1.0,
    extraReach: 3,                                  // free building: up to this many spaces out from the outline (beside, in front, above, or a mix)                               // "nearby" extra blocks: one space out from the template, at most this share of its slots                              // each good act (gold, silver, a gem, bonus) gives a small stack of this many blocks.
                                                    // Straw, pearls and lamps stay one block. Daily caps count ACTS, not blocks.
    knocksPerBurn: 4,                               // blocks a burning bale knocks out (= one act's worth, so straw costs what it did)
    dailyCap: { G: 1, S: 2, gem: 6, L: 1 },         // v5: gems 9 -> 6 (3 night cards + 2 seen + 1 twin)
    /* v5 "This week's three": eight picture cards, each one fruit (rules gem code). Words live in content.js. */
    cards: [ { id: 'calm', fruit: 't' }, { id: 'kind', fruit: 'k' }, { id: 'peace', fruit: 'p' }, { id: 'work', fruit: 'j' },
             { id: 'gentle', fruit: 'e' }, { id: 'first', fruit: 'l' }, { id: 'truth', fruit: 'b' }, { id: 'wait', fruit: 'r' } ],
    seenPerDay: 2,                                  // "I saw it!" gems a day
    twinPerDay: 1,                                  // the focus card seen gives a second gem, once a day
    pearlPerOwnUp: 0,                               // (old) new pearl pieces for owning up. Now the sorry prayer's pearl brings back ONE fallen block
    /* Quick log: taps anyone can make in the day. Nothing is given until a grown-up checks them at night. */
    quick: { good: ['seen', 'cooled', 'great'], bad: ['tantrum', 'disobeyed', 'rude', 'fight', 'negative', 'lie', 'other'], cooledFruit: 'r', greatFruit: 'j',
             cooledPerDay: 1, greatPerDay: 2, nightStrawByAge: { 6: 1, 8: 3, 12: 3 } },
    prayer: { perDay: 5, perLantern: 10 },          // prayers counted a day; every 10 hangs a lantern (never burns)
    bonusPerReview: 3,                              // pieces chosen from the shelf after the weekly review
    /* v5 designs: the child picks one while the building is empty. Shapes per age band:
       [frontCols, frontRows, sideCols, sideRows, free, doorCol]. 3 open at the start, one more every 2 sealed buildings,
       then the named blueprints (content.js) one every 2 more, each a design grown by 0-2 rows. */
    designs: { enabled: true, open: 3, sealsPerUnlock: 2,
      order: ['cottage', 'tower', 'barn', 'chapel', 'lighthouse', 'castle'],
      names: { cottage: 'Cottage', tower: 'Tower', barn: 'Barn', chapel: 'Chapel', lighthouse: 'Lighthouse', castle: 'Castle' },
      shapes: {
        /* v6: twice the slots of v5 (28/40/60 -> ~56/80/120) because each good act now gives blocksPerPiece blocks.
           v5 was cottage 6:[5,3,2,3,2,2] 8:[5,4,2,4,5,2] 12:[5,5,3,5,6,2] (and so on). */
        cottage:    { 6: [7, 4, 3, 4, 4, 3], 8: [7, 5, 3, 6, 10, 3], 12: [7, 7, 5, 6, 12, 3] },
        tower:      { 6: [5, 5, 3, 5, 2, 2], 8: [5, 7, 3, 7, 4, 2],  12: [5, 10, 3, 10, 10, 2] },
        barn:       { 6: [9, 3, 4, 3, 6, 4], 8: [9, 5, 4, 4, 4, 4],  12: [9, 7, 4, 7, 2, 4] },
        chapel:     { 6: [7, 4, 4, 3, 4, 3], 8: [7, 5, 5, 4, 6, 3],  12: [9, 7, 5, 5, 8, 4] },
        lighthouse: { 6: [5, 7, 1, 7, 8, 2], 8: [5, 10, 1, 10, 11, 2], 12: [5, 13, 2, 13, 4, 2] },
        castle:     { 6: [6, 4, 3, 5, 2, 2], 8: [6, 5, 3, 7, 10, 2], 12: [6, 8, 4, 8, 10, 2] }
      },
      scale: { cols: 1.6, rows: 1.2, free: 2 },
      sameSize: 12,                               // 19 Nov (Joel): all kids build the large, age-12 size   // v7: every design ~1.9x the slots (wider more than taller, so it fits the iPad picture)
      growRows: 1.5,                                // a named blueprint's `grow` is in v5 rows; with smaller blocks each counts this many rows (rounded)
      spire: { cottage: 2, tower: 3, barn: 1, chapel: 4, lighthouse: 3, castle: 2 },
      /* the 12 named blueprints from content.js (seasons), unlocked after all six designs */
      named: [ { id: 'bp1', style: 'lighthouse', grow: 1 }, { id: 'bp2', style: 'cottage', grow: 0 }, { id: 'bp3', style: 'castle', grow: 1 },
               { id: 'bp4', style: 'chapel', grow: 0 }, { id: 'bp5', style: 'barn', grow: 2 }, { id: 'bp6', style: 'tower', grow: 1 },
               { id: 'bp7', style: 'cottage', grow: 1 }, { id: 'bp8', style: 'barn', grow: 2 }, { id: 'bp9', style: 'cottage', grow: 0 },
               { id: 'bp10', style: 'castle', grow: 1 }, { id: 'bp11', style: 'lighthouse', grow: 2 }, { id: 'bp12', style: 'barn', grow: 0 } ] },
    animals: { kinds: ['lamb', 'cat', 'dog', 'rabbit', 'bird', 'hen'], perBuilding: 3 },
    /* 19 Nov (Joel): crafting, Minecraft-style. Pieces in the tray are combined into one item (type 'C', p.c = recipe id).
       need: piece codes and counts; 'gem' = any fruit gem. An item lays like a stone (outline or extra spot), never burns,
       and falls with its wall like any stone. */
    craft: { recipes: [
      { id: 'torch',    name: 'Torch',                need: { G: 1, j: 1 } },
      { id: 'window',   name: 'Stained-glass window', need: { gem: 3 } },
      { id: 'lamppost', name: 'Lamp post',            need: { G: 2 } },
      { id: 'flowers',  name: 'Flower box',           need: { l: 1, k: 1, t: 1 } },
      { id: 'arch',     name: 'Arched door',          need: { S: 2, G: 1 } },
      { id: 'fountain', name: 'Fountain',             need: { p: 4 } }
    ] },
    strawCapByAge: { 6: 2, 8: 3, 12: 3 },
    fallAt: { 6: 2, 8: 2, 12: 2 },                  // straw in one wall that makes it fall at a fire
    swayBelow: 1,                                   // sway starts this many straw below fallAt
    pullsPerDay: 2,                                 // used only when pullsMatchStrawCap is off
    pullsMatchStrawCap: true,                       // pulls allowed a day = straw allowed a day for that age
    pullNeedsForgive: true,                         // the bale must carry the pearl mark first
    pullNeedsMadeRight: false,
    levels: { at: [0, 10, 20, 35, 50], names: ['Apprentice', 'Builder', 'Craftsman', 'Master builder', 'Wise builder'], every: 25 },   // levels by NIGHTS a grown-up confirmed (21 Nov 2026, Joel): owning-up nights count, no streaks, nothing resets
    brace: { enabled: true, per: 3, max: 2, oneFire: true, marked: true },   // marked: only blocks laid on purpose with "Prop it up" count (markProp), so good blocks can't be stockpiled outside a wall in advance;   // oneFire (21 Nov 2026): props that carry a wall through a fire are used up (knocked to the rubble pile), so straw can't pile up behind them for ever.       // good blocks laid just OUTSIDE a wall prop it up: every 3 = it stands with 1 more straw (at most 2). Straw still burns and knocks.                      // true: markMadeRight() must be called before pull() works
    pullMode: 'settle',                             // 'settle' (wall drops, pearl seam) | 'pearlSlot'
    rubblePerDay: { 6: 12, 8: 12, 12: 12 },         // (21 Nov 2026: 4 -> 12, a usual fire knocks ~12 off: one day to put it back) fallen stones a child may re-lay each day
    rubbleBigPile: { over: 16, perDay: 20 },          // while the pile is bigger than `over`, re-lay this many a day (19 Nov 2026: 12 -> 20, rebuilding should feel generous)
    autoLayAtNight: true,                           // endDay lays any tray pieces left over (no hoarding)
    carryOverMax: 12,                               // tray blocks carried into the next building; the rest go to the family landmark
    missedFireNextNight: true,                      // a fire night that was not held is held the next night
    practiceFirstFire: true,                        // a new child's first fire burns straw but knocks and fells nothing
    mercyAfterCaveIn: true,                         // at the very next fire after a cave-in no wall can fall
    /* Fairness ("extra mortar"): every `reviewEveryDays`, look back `lookBackDays`. Walls fell at `fallsToStep`+
       fires -> this child's walls take one more straw (up to maxBonus). `calmDays` with no fall -> one step back. */
    fairness: { enabled: true, reviewEveryDays: 7, lookBackDays: 14, fallsToStep: 2, maxBonus: 2, calmDays: 14,
                crackFiresWhenHelped: 1 },         // a child with a bonus has cracks that mend after this many fires
    fireNights: { 6: [2, 4, 6], 8: [1, 3, 5], 12: [0, 3] }, // weekday numbers, 0 = Sunday
    crackFires: 3,                                  // fires a fallen wall must stand through to mend
    sameWallCanCaveIn: true,                        // a cracked wall falling again is also a cave-in
    twoWallsCaveIn: true,                           // two walls falling at one fire is a cave-in
    caveInClearsCracks: true,                       // after a cave-in the child starts un-cracked
    knockBesideIfBare: true,                        // a bale with nothing on top knocks the stone beside it (left, then right)
    knockNearestIfBare: true,                       // ...and if there is none beside it, the nearest stone in that wall
    caveInGraceDays: 28,                            // days after a cave-in when a second one is only a wall fall
    freeNeedsFullWalls: true,
    callFireWhenComplete: true,                     // a finished, straw-free building may ask for its fire tonight
    windowsMustTouch: true,                         // a window = three gems in a straight line in one wall
    /* Commissions: each new building offers `offer` cards; a met commission is a star at sealing. */
    commissions: { enabled: true, offer: 3, pool: [
      { id: 'pure2',     need: 2, text: 'commission.pure2',     label: 'Two pure windows' },
      { id: 'windows4',  need: 4, text: 'commission.windows4',  label: 'Four windows' },
      { id: 'everyWall', need: 3, text: 'commission.everyWall', label: 'A window in every wall' },
      { id: 'rainbow',   need: 5, text: 'commission.rainbow',   label: 'A rainbow row: five different gems in one row' },
      { id: 'goldTop',   need: 0, text: 'commission.goldTop',   label: 'Gold all along the top of the front wall' },
      { id: 'silverSill', need: 0, text: 'commission.silverSill', label: 'Silver all along the foot of the left wall' }
    ] },
    /* The spire dare: optional gem slots above the roof. Any straw burning while it has pieces topples it. */
    spire: { enabled: true, slots: 3, gemsOnly: true, perDay: 1, star: 1, opens: 'anytime' },   // opens: 'wallsFull' | 'frontFull' | 'anytime'
    /* Blueprint ladder: one name and one shape per blueprint. A child starts at startStep[age] and climbs one
       step after sealsPerStep[step] sealed buildings. shapes.enabled swaps in the odd-shaped plan. */
    ladder: { enabled: true, startStep: { 6: 0, 8: 2, 12: 4 }, sealsPerStep: [1, 1, 1, 1, 2, 2, 2, 2, 3],
      plan:       ['cottage', 'farmhouse', 'hall', 'lodge', 'manor', 'chapel', 'guildhall', 'abbey', 'castle', 'cathedral'],
      shapedPlan: ['cottage', 'barn', 'tower', 'schoolhouse', 'lighthouse', 'chapel', 'greatbarn', 'abbey', 'castle', 'cathedral'] },
    shapes: { enabled: false },                     // true: use ladder.shapedPlan (walls of different widths and heights)
    blueprints: [
      box('cottage', 'Cottage', 3, 3, 4), box('farmhouse', 'Farmhouse', 3, 4, 4), box('hall', 'Hall', 4, 3, 4),
      box('lodge', 'Lodge', 4, 4, 4), box('manor', 'Manor', 5, 3, 4), box('chapel', 'Chapel', 5, 4, 5),
      box('guildhall', 'Guildhall', 5, 5, 5), box('abbey', 'Abbey', 6, 4, 6), box('castle', 'Castle', 6, 5, 6),
      box('cathedral', 'Cathedral', 7, 5, 6),
      shape('barn', 'Barn', [7, 3], 3, [3, 3], 4), shape('tower', 'Tower', [3, 6], 1, [2, 6], 6),
      shape('schoolhouse', 'Schoolhouse', [5, 5], 2, [4, 3], 6), shape('lighthouse', 'Lighthouse', [3, 8], 1, [2, 8], 4),
      shape('greatbarn', 'Great Barn', [7, 5], 3, [4, 5], 5)
    ],
    /* Old tier blueprints, used only when ladder.enabled is false. */
    progression: true, sealsPerTier: 2, maxTierByAge: { 6: 3, 8: 3, 12: 2 },
    tiers: [
      { name: 'Cottage',   addRows: 0, sideCols: 3, free: 4 },
      { name: 'House',     addRows: 0, sideCols: 4, free: 4 },
      { name: 'Hall',      addRows: 1, sideCols: 3, free: 5 },
      { name: 'Cathedral', addRows: 1, sideCols: 4, free: 6 }
    ],
    stars: { sealed: 1, neverFell: 1, pureWindow: 1, commission: 1 }, // pureWindow counts only when commissions are off
    city: { streetEvery: 4 },                       // sealed buildings per street; each street adds a set to the family landmark
    gospel: { enabled: true, neighbourHouse: 12, lampInGarden: true } // lampInGarden: a share plants a garden lamp, not a wall piece
  };

  var WALLS = CONFIG.wallOrder;
  function band(age) { return age <= 6 ? 6 : age <= 9 ? 8 : 12; }
  function rubbleCap(state) {
    var big = CONFIG.rubbleBigPile, base = CONFIG.rubblePerDay[band(state.profile.age)];
    return big && state.rubble.length + state.today.rubble > big.over ? Math.max(base, big.perDay) : base;
  }
  function pullCap(state) { return CONFIG.pullsMatchStrawCap ? CONFIG.strawCapByAge[band(state.profile.age)] : CONFIG.pullsPerDay; }
  /* Fill in fields that older saved games do not have. */
  function ensure(state) {
    if (!state.fair) state.fair = { bonus: 0, fallDays: [], lastReview: 0, lastChange: 0 };
    if (!state.spire) state.spire = [];
    if (!state.garden) state.garden = [];
    if (!state.purchases) state.purchases = [];
    if (state.starBalance == null) state.starBalance = state.stats ? state.stats.stars || 0 : 0;
    if (!state.family) state.family = { stones: 0, sets: 0 };
    if (!state.prayers) state.prayers = { n: 0, lanterns: 0 };
    if (!state.waiting) state.waiting = [];
    if (!state.extras) state.extras = [];           // old saves: no extra blocks yet
    if (state.build && !state.build.animals) { state.build.animals = []; state.build.animalPeak = 0; }
    if (state.build && !state.build.look) state.build.look = { roof: 'teal', door: 'wood' };
    return state;
  }
  function fairOf(state) { return ensure(state).fair; }
  /* Straw in one wall that topples it for THIS child: the age's number plus any fairness bonus. */
  function fallAtFor(state) { return CONFIG.fallAt[band(state.profile.age)] + (CONFIG.fairness.enabled ? Math.min(fairOf(state).bonus, CONFIG.fairness.maxBonus) : 0); }
  /* Weekly fairness look-back (called by startDay). Returns a 'fairness' event when the number changes. */
  function fairnessReview(state) {
    var F = CONFIG.fairness, f = fairOf(state), ev = [];
    if (!F.enabled || state.day - f.lastReview < F.reviewEveryDays) return ev;
    f.lastReview = state.day;
    f.fallDays = f.fallDays.filter(function (d) { return state.day - d <= Math.max(F.lookBackDays, F.calmDays); });
    var recent = f.fallDays.filter(function (d) { return state.day - d <= F.lookBackDays; }).length;
    var calm = !f.fallDays.some(function (d) { return state.day - d <= F.calmDays; }) && state.day - f.lastChange >= F.calmDays;
    if (recent >= F.fallsToStep && f.bonus < F.maxBonus) f.bonus++;
    else if (calm && f.bonus > 0) f.bonus--;
    else return ev;
    f.lastChange = state.day;
    ev.push({ kind: 'fairness', bonus: f.bonus, fallAt: fallAtFor(state), mortar: f.bonus > 0 });
    return ev;
  }
  /* The earliest day the extra mortar can come off (the first weekly look-back after two calm weeks). */
  function mortarEnds(state) {
    var F = CONFIG.fairness, f = fairOf(state);
    if (!F.enabled || f.bonus <= 0) return null;
    var lastFall = f.fallDays.length ? Math.max.apply(null, f.fallDays) : 0;
    var earliest = Math.max(f.lastChange + F.calmDays, lastFall + F.calmDays + 1), d = f.lastReview;
    while (d < earliest) d += F.reviewEveryDays;
    return d;
  }
  function isGem(t) { return !!CONFIG.gems[t]; }
  function fail(reason) { return { ok: false, reason: reason, events: [] }; }
  function cols(state, wall) { return state.walls[wall].length; }
  function rowsOf(state, wall) { return state.walls[wall][0].length; }
  function doorOf(state) { return state.bp.door || CONFIG.door; }
  function isSlot(state, wall, col, row) {
    if (wall === 'free') return row === 0 && col >= 0 && col < state.free.length;
    if (wall === 'spire') return row === 0 && col >= 0 && col < ensure(state).spire.length;
    if (!state.walls[wall] || col < 0 || col >= cols(state, wall) || row < 0 || row >= rowsOf(state, wall)) return false;
    var d = doorOf(state); return !(wall === d.wall && col === d.col && row === d.row);
  }
  /* at(state, wall, col, row) -> the piece in a slot, or null. */
  function at(state, wall, col, row) {
    if (!isSlot(state, wall, col, row)) return null;
    return wall === 'free' ? state.free[col] : wall === 'spire' ? state.spire[col] : state.walls[wall][col][row];
  }
  function put(state, wall, col, row, piece) {
    if (wall === 'free') state.free[col] = piece; else if (wall === 'spire') state.spire[col] = piece; else state.walls[wall][col][row] = piece;
  }
  /* Visit every wall slot: fn(wall, col, row, piece). Rows go bottom-up inside each column. */
  function eachSlot(state, fn, onlyWall) {
    (onlyWall ? [onlyWall] : WALLS).forEach(function (w) {
      for (var c = 0; c < cols(state, w); c++) for (var r = 0; r < rowsOf(state, w); r++)
        if (isSlot(state, w, c, r)) fn(w, c, r, state.walls[w][c][r]);
    });
  }
  /* tally(state, wall?) -> { filled, total, straw, holes } for one wall, or all walls when wall is omitted. */
  function tally(state, wall) {
    var o = { filled: 0, total: 0, straw: 0, holes: 0 };
    eachSlot(state, function (w, c, r, p) {
      o.total++;
      if (p) { o.filled++; if (p.t === 'W') o.straw++; }
      else if (hasAbove(state, w, c, r)) o.holes++;
    }, wall);
    return o;
  }
  function hasAbove(state, wall, col, row) {
    for (var r = row + 1; r < rowsOf(state, wall); r++) if (state.walls[wall][col][r]) return true;
    return false;
  }
  /* Open wall slot that rests on something (foundation, door, a piece) or is a hole under a piece. */
  function isLegalWall(state, w, c, r) {
    if (!isSlot(state, w, c, r) || state.walls[w][c][r]) return false;
    if (r === 0 || !isSlot(state, w, c, r - 1) || state.walls[w][c][r - 1]) return true;
    return hasAbove(state, w, c, r);
  }
  /* ---- extras: blocks laid up to extraReach spaces out from the template ("nearby", free building). Each is {wall, col, row, out, p}.
     out 0 = in the wall's own plane: col -1 or col = cols (beside an end, widening it), or row = rows (one row above the top).
     out 1 = one space out in front of the wall face (bay, porch, buttress). Never inside the house, never two spaces out.
     An extra belongs to its wall for every rule: it falls with it, goes to rubble, is knocked by the straw under it.
     Straw never goes on an extra. Sealing needs only the template. */
  function extraCap(state) { return Math.max(1, Math.floor(tally(state).total * CONFIG.extraShare)); }
  function extraAt(state, w, c, r, o) {
    var x = (state.extras || []).filter(function (e) { return e.wall === w && e.col === c && e.row === r && e.out === o; })[0];
    return x ? x.p : null;
  }
  function isExtraCell(state, w, c, r, o) {
    var X = CONFIG.extraReach || 1;
    if (WALLS.indexOf(w) < 0 || o < 0 || o > X || o !== Math.floor(o) || r < 0) return false;
    var C = cols(state, w), Rr = rowsOf(state, w);
    var oc = c < 0 ? -c : (c >= C ? c - C + 1 : 0), orow = r >= Rr ? r - Rr + 1 : 0, outs = oc + orow + o;
    if (outs < 1 || outs > X) return false;         // outside the outline, at most extraReach spaces out in all
    var d = doorOf(state);
    if (o && w === d.wall && c === d.col) return false;   // keep the doorway clear
    return true;
  }
  function extraSupported(state, w, c, r, o) {
    if (r === 0) return true;                       // on the ground / foundation
    if (o === 0 && c >= 0 && c < cols(state, w) && r === rowsOf(state, w)) {  // just above the top: rests on the top template block (or the door)
      return !isSlot(state, w, c, r - 1) || !!state.walls[w][c][r - 1];   // (a door below counts as support)
    }
    return !!extraAt(state, w, c, r - 1, o);
  }
  /* extraSlots(state) -> [{wall,col,row,out,extra:true}] open nearby spots right now (none once the cap is reached). */
  function extraSlots(state) {
    ensure(state);
    var out = [];
    if (state.extras.length >= extraCap(state)) return out;
    WALLS.forEach(function (w) {
      var C = cols(state, w), Rr = rowsOf(state, w);
      var X = CONFIG.extraReach || 1;
      for (var o = 0; o <= X; o++) for (var c = -X; c < C + X; c++) for (var r = 0; r < Rr + X; r++)
        if (isExtraCell(state, w, c, r, o) && !extraAt(state, w, c, r, o) && extraSupported(state, w, c, r, o))
          out.push({ wall: w, col: c, row: r, out: o, extra: true });
    });
    return out;
  }
  function isLegalExtra(state, w, c, r, o) {
    ensure(state);
    return isExtraCell(state, w, c, r, o) && !extraAt(state, w, c, r, o) && extraSupported(state, w, c, r, o) && state.extras.length < extraCap(state);
  }
  function takeExtra(state, w, c, r, o) {
    ensure(state);
    for (var i = 0; i < state.extras.length; i++) { var e = state.extras[i];
      if (e.wall === w && e.col === c && e.row === r && e.out === o) { state.extras.splice(i, 1); return e.p; } }
    return null;
  }

  function wallsFull(state) { var t = tally(state); return t.filled === t.total; }
  /* isComplete(state): every wall slot and free slot is filled (straw counts as filled; the spire is optional). */
  function isComplete(state) { return wallsFull(state) && state.free.every(Boolean); }

  /* Which blueprint comes after `sealed` sealed buildings. Returns the bp object stored on state.bp:
     { tier (step number), id, name, rows (tallest wall), sideCols, free, spire, door, walls:{front,left,right:{cols,rows}} } */
  function blueprintFor(age, sealed, pickId) {
    var b = band(age), L = CONFIG.ladder, def, step, left = 0;
    var dz = pickId && CONFIG.designs.enabled ? designDef(pickId, age) : null;
    if (dz) { def = dz; step = dz.grow; left = 0; }
    else if (L.enabled) {
      var plan = CONFIG.shapes.enabled ? L.shapedPlan : L.plan, n = sealed;
      step = Math.min(plan.length - 1, L.startStep[b] || 0);
      while (step < plan.length - 1 && n >= (L.sealsPerStep[step] || 1)) { n -= L.sealsPerStep[step] || 1; step++; }
      left = step >= plan.length - 1 ? 0 : (L.sealsPerStep[step] || 1) - n;
      def = CONFIG.blueprints.filter(function (x) { return x.id === plan[step]; })[0] || CONFIG.blueprints[0];
    } else {
      var top = Math.min(CONFIG.tiers.length - 1, CONFIG.maxTierByAge[b]);
      step = CONFIG.progression ? Math.min(top, Math.floor(sealed / CONFIG.sealsPerTier)) : 0;
      left = !CONFIG.progression || step >= top ? 0 : CONFIG.sealsPerTier - (sealed % CONFIG.sealsPerTier);
      var t = CONFIG.tiers[step], rows = CONFIG.rowsByAge[b] + t.addRows;
      def = { id: t.name.toLowerCase(), name: t.name, free: t.free, walls: { front: { cols: CONFIG.frontCols, rows: rows, door: CONFIG.door.col }, left: { cols: t.sideCols, rows: rows }, right: { cols: t.sideCols, rows: rows } } };
    }
    var w = def.walls;
    return { tier: step, id: def.id, name: def.name, style: def.style || null, rows: Math.max(w.front.rows, w.left.rows, w.right.rows), sideCols: w.left.cols, free: def.free,
      spire: CONFIG.spire.enabled ? (def.spire != null ? def.spire : CONFIG.spire.slots) : 0, nextIn: left,
      door: { wall: 'front', col: w.front.door, row: 0 },
      walls: { front: { cols: w.front.cols, rows: w.front.rows }, left: { cols: w.left.cols, rows: w.left.rows }, right: { cols: w.right.cols, rows: w.right.rows } } };
  }
  /* designDef(id, age) -> a blueprint definition for a design ('cottage' ...) or a named blueprint ('bp1' ...), or null. */
  function designDef(id, age) {
    var D = CONFIG.designs, style = id, grow = 0, named = null;
    D.named.forEach(function (n) { if (n.id === id) named = n; });
    if (named) { style = named.style; grow = named.grow; }
    var sh = D.shapes[style] && D.shapes[style][D.sameSize || band(age)];   // sameSize: every child builds the same (large) house
    if (!sh) return null;
    var gr = Math.round(grow * (D.growRows || 1)), k = D.scale || { cols: 1, rows: 1, free: 1 };
    var fc = Math.round(sh[0] * k.cols), fr = Math.round(sh[1] * k.rows), sc = Math.max(1, Math.round(sh[2] * k.cols)), sr = Math.round(sh[3] * k.rows);
    var door = k.cols === 1 ? sh[5] : Math.floor((fc - 1) / 2);   // keep the door in the middle of the wider front
    return { id: id, style: style, grow: grow, name: named ? id : D.names[style], free: Math.round(sh[4] * k.free), spire: D.spire[style],
      walls: { front: { cols: fc, rows: fr + gr, door: door }, left: { cols: sc, rows: sr + gr }, right: { cols: sc, rows: sr + gr } } };
  }
  /* designs(state) -> every design and named blueprint with {id, style, grow, open, sealsToOpen, slots}. */
  function designs(state) {
    var D = CONFIG.designs, out = [], per = D.sealsPerUnlock, n = state.sealed;
    D.order.forEach(function (id, i) {
      var need = i < D.open ? 0 : (i - D.open + 1) * per;
      out.push({ id: id, style: id, grow: 0, named: false, open: n >= need, sealsToOpen: Math.max(0, need - n) });
    });
    var base = (D.order.length - D.open) * per;
    D.named.forEach(function (x, i) {
      var need = base + (i + 1) * per;
      out.push({ id: x.id, style: x.style, grow: x.grow, named: true, open: n >= need, sealsToOpen: Math.max(0, need - n) });
    });
    out.forEach(function (d) { var def = designDef(d.id, state.profile.age), w = def.walls;
      d.slots = w.front.cols * w.front.rows - 1 + 2 * w.left.cols * w.left.rows + def.free; });
    return out;
  }
  function isEmptyBuilding(state) {
    var t = tally(state);
    return t.filled === 0 && !state.free.some(Boolean) && !(state.spire || []).some(Boolean) && !(state.extras || []).length;
  }
  /* chooseDesign(state, id): pick the design of the building, only while it is empty and the design is open. */
  function chooseDesign(state, id) {
    ensure(state);
    if (!CONFIG.designs.enabled) return fail('off');
    var d = designs(state).filter(function (x) { return x.id === id; })[0];
    if (!d) return fail('noDesign');
    if (!d.open) return fail('locked');
    if (!isEmptyBuilding(state)) return fail('notEmpty');
    var keep = state.build;
    state.design = id;
    layBlueprint(state, id);
    state.build.startDay = keep.startDay; state.build.look = keep.look || state.build.look;
    state.build.animals = keep.animals || []; state.build.animalPeak = 0;
    return { ok: true, events: [{ kind: 'design', id: id, bp: state.bp }] };
  }
  /* setLook(state, {roof, door}): the colours of this building (kept in the City when it is sealed). Any time. */
  function setLook(state, look) {
    ensure(state);
    if (look && look.roof) state.build.look.roof = String(look.roof);
    if (look && look.door) state.build.look.door = String(look.door);
    return { ok: true, events: [{ kind: 'look', look: state.build.look }] };
  }
  function layBlueprint(state, pickId) {
    var prevLook = state.build && state.build.look;
    var bp = state.bp = blueprintFor(state.profile.age, state.sealed, pickId || state.design);
    function grid(d) { var g = []; for (var c = 0; c < d.cols; c++) { g.push([]); for (var r = 0; r < d.rows; r++) g[c].push(null); } return g; }
    function row(n) { var a = []; for (var i = 0; i < n; i++) a.push(null); return a; }
    state.walls = { front: grid(bp.walls.front), left: grid(bp.walls.left), right: grid(bp.walls.right) };
    state.free = row(bp.free); state.spire = row(bp.spire); state.extras = [];
    state.cracked = { front: 0, left: 0, right: 0 };
    state.seams = [];                               // pearl lines left by pull-outs: {wall, col, row}
    state.build = { startDay: state.day, falls: 0, caveIns: 0, pearls: 0, choices: null, commission: null, spireFell: false,
      look: prevLook ? { roof: prevLook.roof, door: prevLook.door } : { roof: 'teal', door: 'wood' }, animals: [], animalPeak: 0 };
  }

  function freshDay() { return { G: 0, S: 0, L: 0, gem: 0, W: 0, P: 0, pulls: 0, rubble: 0, placed: 0, spire: 0, fired: false, called: false,
    seen: 0, twin: 0, prayers: 0, bonus: 0, cooled: 0 }; }
  /* newChild({name, age}) -> fresh state with an empty first blueprint. */
  function newChild(profile) {
    var state = { v: 2, profile: { name: profile.name || '', age: profile.age }, day: 0, weekday: 0,
      seq: 0, nextId: 1, sealed: 0, tray: [], rubble: [], city: [], lastFire: null,
      seeds: [], neighbours: [], garden: [], purchases: [], starBalance: 0, family: { stones: 0, sets: 0 },
      today: freshDay(),
      stats: { fires: 0, clean: 0, small: 0, wallFalls: 0, caveIns: 0, strawLaid: 0, strawBurned: 0, pearls: 0, stars: 0, spireFalls: 0 } };
    layBlueprint(state);
    return ensure(state);
  }

  /* startDay(state, weekday 0-6, 0 = Sunday): next day, daily counters back to zero.
     Events: {kind:'dayStart', day, weekday, fireNight} and sometimes {kind:'fairness', bonus, fallAt, mortar}. */
  function startDay(state, weekday) {
    ensure(state);
    var late = [];
    if (state.pendingNight) { late = giveNight(state, true); state.pendingNight = null; }   // gems no grown-up confirmed arrive anyway, on yesterday's count
    late = late.concat(quickMorning(state));        // unchecked quick taps: good ones arrive, bad ones are dropped (straw needs a grown-up)
    state.day++; state.weekday = weekday;
    state.today = freshDay();
    var fair = fairnessReview(state);
    var ev = [{ kind: 'dayStart', day: state.day, weekday: weekday, fireNight: isFireNight(state) }];
    if (late.length) ev.push({ kind: 'lateGems', pieces: late });
    return { ok: true, events: ev.concat(fair) };
  }

  function strawCount(state, wall) { return tally(state, wall).straw; }
  /* strawTarget(state): where the next straw must land: the wall that already has (most) straw, else the
     fullest wall; lowest open slot, left to right. Full walls are skipped. Returns {wall,col,row} or null. */
  function strawTarget(state) {
    var info = WALLS.map(function (w, i) { var t = tally(state, w); return { w: w, i: i, s: t.straw, f: t.filled }; });
    info.sort(function (a, b) { return (b.s - a.s) || (b.s || a.s ? 0 : b.f - a.f) || (a.i - b.i); });
    for (var k = 0; k < info.length; k++) {
      var w = info[k].w;
      for (var r = 0; r < rowsOf(state, w); r++) for (var c = 0; c < cols(state, w); c++)
        if (isLegalWall(state, w, c, r)) return { wall: w, col: c, row: r };
    }
    return null;
  }
  function landStraw(state, piece) {
    var ev = [], spot = strawTarget(state);
    if (!spot) {                                    // building full: bump the newest stone to rubble
      var best = null;
      eachSlot(state, function (w, c, r, p) { if (p && p.t !== 'W' && (!best || p.seq > best.p.seq)) best = { wall: w, col: c, row: r, p: p }; });
      if (!best) return ev;                         // every slot is straw: the bale has nowhere to go
      state.rubble.push(best.p);
      ev.push({ kind: 'bump', wall: best.wall, col: best.col, row: best.row, piece: best.p });
      spot = best;
    }
    piece.seq = ++state.seq;
    put(state, spot.wall, spot.col, spot.row, piece);
    state.stats.strawLaid++;
    animalPeak(state);
    ev.push({ kind: 'strawLand', wall: spot.wall, col: spot.col, row: spot.row, piece: piece, wobble: wobble(state)[spot.wall] });
    return ev;
  }

  /* addPiece(state, type, meta): a real-life act gives a piece. Gold/silver/gems/pearls go to the tray.
     Straw ('W') lands on its wall at once. Daily caps apply -> { ok:false, reason:'cap' }. */
  /* stack(state, type, meta, n): n blocks from one act. They share the meta and a stack id `st` (setColour recolours the stack). */
  function stack(state, type, meta, n) {
    var out = [];
    for (var i = 0; i < Math.max(1, n || 1); i++) {
      var piece = { id: state.nextId++, t: type };
      if (isGem(type)) piece.f = CONFIG.gems[type];
      if (meta != null) piece.m = meta;
      if (n > 1) piece.st = out.length ? out[0].id : piece.id;
      out.push(piece);
    }
    return out;
  }
  function addPiece(state, type, meta) {
    var key = type === 'W' ? 'W' : isGem(type) ? 'gem' : type;
    if (key !== 'G' && key !== 'S' && key !== 'W' && key !== 'gem' && key !== 'P' && key !== 'L') return fail('type');
    var cap = key === 'W' ? CONFIG.strawCapByAge[band(state.profile.age)] : CONFIG.dailyCap[key];
    var practice = !!(meta && meta.practice);         // a gold block earned by 3 practices a grown-up ticked: never blocked by the daily cap
    if (!practice && cap != null && (state.today[key] || 0) >= cap) return fail('cap');
    if (!practice) state.today[key] = (state.today[key] || 0) + 1;    // caps count acts, not blocks
    var pieces = stack(state, type, meta, key === 'W' || key === 'P' || key === 'L' ? 1 : CONFIG.blocksPerPiece);
    if (type === 'W') return { ok: true, piece: pieces[0], pieces: pieces, events: landStraw(state, pieces[0]) };
    state.tray = state.tray.concat(pieces);
    return { ok: true, piece: pieces[0], pieces: pieces, events: pieces.map(function (p) { return { kind: 'tray', piece: p }; }) };
  }

  /* legalSlots(state) -> [{wall,col,row,hole}] every wall / free slot a stone may go in right now.
     Free-build slots (wall 'free') appear only once all three walls are full. Spire slots: see spireSlots. */
  function legalSlots(state) {
    var out = [];
    eachSlot(state, function (w, c, r) {
      if (isLegalWall(state, w, c, r)) out.push({ wall: w, col: c, row: r, hole: hasAbove(state, w, c, r) });
    });
    if (!CONFIG.freeNeedsFullWalls || (!out.length && wallsFull(state)))
      state.free.forEach(function (p, i) { if (!p) out.push({ wall: 'free', col: i, row: 0, hole: false }); });
    return out;
  }
  /* spireSlots(state) -> [{wall:'spire', col, row:0}] open spire slots the child may dare to fill right now
     (open per CONFIG.spire.opens, at most CONFIG.spire.perDay a day). Never filled by autoPlace. */
  function spireSlots(state) {
    var out = [];
    var o = CONFIG.spire.opens, f;
    if (!CONFIG.spire.enabled || !ensure(state).spire.length || (state.today.spire || 0) >= CONFIG.spire.perDay) return out;
    if (o === 'frontFull') { f = tally(state, 'front'); if (f.filled < f.total) return out; } else if (o !== 'anytime' && !wallsFull(state)) return out;
    state.spire.forEach(function (p, i) { if (!p) out.push({ wall: 'spire', col: i, row: 0 }); });
    return out;
  }
  function isLegal(state, wall, col, row, out) {
    if (out != null) return isLegalExtra(state, wall, col, row, out);
    if (wall === 'free') return isSlot(state, wall, col, row) && !state.free[col] && (!CONFIG.freeNeedsFullWalls || wallsFull(state));
    if (wall === 'spire') return spireSlots(state).some(function (s) { return s.col === col && row === 0; });
    return isLegalWall(state, wall, col, row);
  }
  function lay(state, list, index, wall, col, row, fromRubble, out) {
    var piece = list[index];
    if (!piece) return fail('noPiece');
    if (!isLegal(state, wall, col, row, out)) return fail(out != null && state.extras.length >= extraCap(state) ? 'extraCap' : 'slot');
    if (wall === 'spire' && CONFIG.spire.gemsOnly && !isGem(piece.t)) return fail('gemsOnly');
    if (out != null && piece.t === 'W') return fail('strawNotExtra');
    list.splice(index, 1);
    piece.seq = ++state.seq;
    if (out != null) state.extras.push({ wall: wall, col: col, row: row, out: out, p: piece });
    else put(state, wall, col, row, piece);
    state.today.placed++;
    if (wall === 'spire') state.today.spire = (state.today.spire || 0) + 1;
    animalPeak(state);
    var e = { kind: 'place', wall: wall, col: col, row: row, piece: piece, fromRubble: !!fromRubble, windows: windows(state), complete: isComplete(state) };
    if (out != null) { e.out = out; e.extra = true; }
    return { ok: true, events: [e] };
  }
  /* place(state, trayIndex, wall, col, row): lay a tray piece (wall may also be 'free' or 'spire'). Never limited. */
  function place(state, trayIndex, wall, col, row, out) { return lay(state, state.tray, trayIndex, wall, col, row, false, out); }
  /* placeRubble(state, rubbleIndex, wall, col, row): re-lay a fallen stone; at most summary().rubbleLeftToday a day. */
  function placeRubble(state, rubbleIndex, wall, col, row, out) {
    if (state.today.rubble >= rubbleCap(state)) return fail('rubbleCap');
    if (state.rubble[rubbleIndex]) delete state.rubble[rubbleIndex].prop;   // a block put back is just a block again
    var res = lay(state, state.rubble, rubbleIndex, wall, col, row, true, out);
    if (res.ok) state.today.rubble++;
    return res;
  }
  function autoLay(state, trayOnly) {
    var ev = [];
    for (;;) {
      var useTray = state.tray.length > 0;
      if (!useTray && (trayOnly || !state.rubble.length || state.today.rubble >= rubbleCap(state))) break;
      var slots = legalSlots(state);
      if (!slots.length) break;
      slots.sort(function (a, b) {
        return (a.wall === 'free') - (b.wall === 'free') || (b.hole - a.hole) || (a.row - b.row) ||
               (WALLS.indexOf(a.wall) - WALLS.indexOf(b.wall)) || (a.col - b.col);
      });
      var s = slots[0];
      var res = useTray ? place(state, 0, s.wall, s.col, s.row) : placeRubble(state, 0, s.wall, s.col, s.row);
      if (!res.ok) break;
      ev = ev.concat(res.events);
    }
    return ev;
  }
  /* autoPlace(state): "lay the rest for me". Tray first, then rubble up to today's limit.
     Holes first, then lowest row, front-left-right, then the free slots. Returns all place events. */
  /* ---- crafting ---- */
  function recipe(id) { return CONFIG.craft.recipes.filter(function (r) { return r.id === id; })[0] || null; }
  function plainPiece(p) { return p && !p.pearl && p.t !== 'W' && p.t !== 'L' && p.t !== 'C'; }
  /* pick the tray pieces a recipe would use (indexes), or null. Named codes first; 'gem' prefers three of one fruit. */
  function craftPick(state, rc) {
    var used = {}, need = rc.need, pick = [];
    function take(code, n) {
      for (var i = 0; i < state.tray.length && n > 0; i++) { var p = state.tray[i];
        if (!used[i] && plainPiece(p) && p.t === code) { used[i] = 1; pick.push(i); n--; } }
      return n === 0;
    }
    for (var code in need) { if (code !== 'gem' && !take(code, need[code])) return null; }
    if (need.gem) {
      var by = {}; state.tray.forEach(function (p, i) { if (!used[i] && plainPiece(p) && isGem(p.t)) by[p.t] = (by[p.t] || 0) + 1; });
      var best = Object.keys(by).sort(function (a, b) { return by[b] - by[a]; }), n = need.gem;
      if (best.length && by[best[0]] >= n) { if (!take(best[0], n)) return null; }
      else { for (var k = 0; k < best.length && n > 0; k++) { var m = Math.min(n, by[best[k]]); if (take(best[k], m)) n -= m; } if (n > 0) return null; }
    }
    return pick;
  }
  /* craftable(state) -> [{id, name, need, ok}] */
  function craftable(state) { ensure(state); return CONFIG.craft.recipes.map(function (r) { return { id: r.id, name: r.name, need: r.need, ok: !!craftPick(state, r) }; }); }
  /* craft(state, id) -> {ok, piece, used:[pieces]} : the pieces leave the tray and one item joins it */
  function craft(state, id) {
    ensure(state);
    var rc = recipe(id); if (!rc) return fail('noRecipe');
    var pick = craftPick(state, rc); if (!pick) return fail('notEnough');
    var used = pick.sort(function (a, b) { return b - a; }).map(function (i) { return state.tray.splice(i, 1)[0]; }).reverse();
    var gems = used.filter(function (p) { return isGem(p.t); }), piece = { id: state.nextId++, t: 'C', c: rc.id, m: { crafted: true, from: used.map(function (p) { return p.t; }) } };
    if (gems.length) { piece.f = gems[0].t; if (rc.need.gem) piece.pure = gems.every(function (p) { return p.t === gems[0].t; }); }   // 'all one fruit' only means something for a window
    state.tray.push(piece);
    state.stats.crafted = (state.stats.crafted || 0) + 1;
    return { ok: true, piece: piece, used: used, events: [{ kind: 'craft', id: rc.id, piece: piece }] };
  }
  /* An item can also go ONTO a block already laid (gold, silver or a gem): the block stays as it is and wears the item. */
  function canDeco(p) { return !!p && !p.deco && !p.pearl && (p.t === 'G' || p.t === 'S' || isGem(p.t)); }
  /* decoSlots(state) -> [{wall, col, row, out?, deco:true}] every laid block an item can go on */
  function decoSlots(state) {
    ensure(state); var out = [];
    eachSlot(state, function (w, c, r, p) { if (canDeco(p)) out.push({ wall: w, col: c, row: r, deco: true }); });
    state.extras.forEach(function (e) { if (canDeco(e.p)) out.push({ wall: e.wall, col: e.col, row: e.row, out: e.out, deco: true }); });
    return out;
  }
  /* decorate(state, trayIndex, wall, col, row, out?): put a crafted item from the tray onto a laid block */
  function decorate(state, trayIndex, wall, col, row, out) {
    ensure(state);
    var item = state.tray[trayIndex]; if (!item || item.t !== 'C') return fail('notItem');
    var p = out != null ? extraAt(state, wall, col, row, out) : at(state, wall, col, row);
    if (!canDeco(p)) return fail('noBlock');
    state.tray.splice(trayIndex, 1);
    p.deco = { c: item.c, f: item.f || null, pure: !!item.pure, id: item.id };
    state.stats.decorated = (state.stats.decorated || 0) + 1;
    var e = { kind: 'decorate', wall: wall, col: col, row: row, piece: p, item: item };
    if (out != null) e.out = out;
    return { ok: true, events: [e] };
  }
  function autoPlace(state) { return { ok: true, events: autoLay(state, false) }; }

  /* forgive(state, wall, col, row): the sorry prayer. Free, unlimited, at once. The bale gets its pearl mark. */
  function forgive(state, wall, col, row) {
    var p = at(state, wall, col, row);
    if (!p || p.t !== 'W') return fail('notStraw');
    p.forgiven = true;
    return { ok: true, events: [{ kind: 'forgive', wall: wall, col: col, row: row }] };
  }
  /* markMadeRight(state, wall, col, row, by): a grown-up or the sibling confirms it was put right in real life.
     `by` is any label ('mum', 'Judah'). Needed before pull() when CONFIG.pullNeedsMadeRight is on. */
  function markMadeRight(state, wall, col, row, by) {
    var p = at(state, wall, col, row);
    if (!p || p.t !== 'W') return fail('notStraw');
    p.madeRight = by || true;
    return { ok: true, events: [{ kind: 'madeRight', wall: wall, col: col, row: row, by: p.madeRight }] };
  }
  /* pull(state, wall, col, row): "making it right". Takes the bale out; at most summary().pullsLeftToday a day.
     'settle' mode: stones above drop one row and a pearl seam is recorded, so the day ends level with a
     clean day. 'pearlSlot' mode: a pearl piece stays in the slot. */
  function pull(state, wall, col, row) {
    var p = at(state, wall, col, row);
    if (!p || p.t !== 'W' || wall === 'free' || wall === 'spire') return fail('notStraw');
    if (CONFIG.pullNeedsForgive && !p.forgiven) return fail('notForgiven');
    if (CONFIG.pullNeedsMadeRight && !p.madeRight) return fail('notMadeRight');
    if (state.today.pulls >= pullCap(state)) return fail('pullCap');
    state.today.pulls++; state.stats.pearls++; state.build.pearls++;
    var ev = { kind: 'pull', wall: wall, col: col, row: row, settled: [] };
    if (CONFIG.pullMode === 'pearlSlot') {
      put(state, wall, col, row, { id: state.nextId++, t: 'P', seq: ++state.seq });
    } else {
      var column = state.walls[wall][col], top = rowsOf(state, wall) - 1;
      for (var r = row; r < top; r++) {
        column[r] = column[r + 1];
        if (column[r]) ev.settled.push({ from: r + 1, to: r, piece: column[r] });
      }
      column[top] = null;
      var cap = takeExtra(state, wall, col, top + 1, 0);    // a chimney stone on top settles into the column
      if (cap) { column[top] = cap; ev.settled.push({ from: top + 1, to: top, piece: cap, fromExtra: true }); }
      state.seams.push({ wall: wall, col: col, row: row });
    }
    ev.wobble = wobble(state)[wall];
    return { ok: true, events: [ev] };
  }

  /* wobble(state) -> {front,left,right}: 0 steady, 1 sways, 2 leans (it will fall at the next fire). */
  /* braceOf(state, wall) -> how many more straw this wall can hold before it falls, from good blocks laid just outside it */
  function isProp(x, w) { var B = CONFIG.brace || {}; return x.wall === w && x.out >= 1 && !!x.p && x.p.t !== 'W' && (!B.marked || !!x.p.prop); }
  /* markProp(state, wall, col, row, out): this outside block was laid to prop its wall up (the screen calls it after "Prop it up") */
  function markProp(state, w, c, r, o) { var x = extraAt(state, w, c, r, o); if (x) x.prop = true; return !!x; }
  function braceOf(state, w) {
    var B = CONFIG.brace; if (!B || !B.enabled) return 0;
    var n = (state.extras || []).filter(function (x) { return isProp(x, w); }).length;
    return Math.min(B.max, Math.floor(n / B.per));
  }
  function wallFallAt(state, w) { return fallAtFor(state) + braceOf(state, w); }
  /* bracing(state) -> {front:{blocks, holds, next}} : blocks outside, extra straw it holds, blocks still needed for the next step */
  function bracing(state) {
    var B = CONFIG.brace || {}, o = {};
    WALLS.forEach(function (w) { var n = (state.extras || []).filter(function (x) { return isProp(x, w); }).length, holds = braceOf(state, w);
      o[w] = { blocks: n, holds: holds, next: B.enabled && holds < B.max ? B.per * (holds + 1) - n : 0 }; });
    return o;
  }
  function wobble(state) {
    var o = {};
    WALLS.forEach(function (w) { var fallAt = wallFallAt(state, w), s = strawCount(state, w); o[w] = s >= fallAt ? 2 : s >= fallAt - CONFIG.swayBelow && s > 0 ? 1 : 0; });
    return o;
  }

  /* windows(state) -> {total, pure, mosaic, gems, list}. With CONFIG.windowsMustTouch a window is three gems in a
     straight line (across or up) in one wall; three of one fruit is pure. list = [{wall, cells:[{col,row}x3], pure, fruit?}]
     so the screen can light exactly those stones. Each gem belongs to one window at most; pure lines are found first.
     Windows are worked out fresh from the walls each time, so a knocked-out stone darkens its window by itself. */
  function windows(state) {
    var by = {}, n = 0, list = [], used = {};
    function see(p) { if (p && isGem(p.t)) { by[p.t] = (by[p.t] || 0) + 1; n++; } }
    eachSlot(state, function (w, c, r, p) { see(p); });
    state.free.forEach(see); ensure(state).spire.forEach(see);
    if (!CONFIG.windowsMustTouch) {
      var pureAny = 0; Object.keys(by).forEach(function (k) { pureAny += Math.floor(by[k] / 3); });
      var total = Math.floor(n / 3);
      return { total: total, pure: Math.min(pureAny, total), mosaic: Math.max(0, total - pureAny), gems: n, list: list };
    }
    function gem(w, c, r) { var p = at(state, w, c, r); return p && isGem(p.t) && !used[p.id] ? p : null; }
    [true, false].forEach(function (pureOnly) {
      eachSlot(state, function (w, c, r) {
        [[1, 0], [0, 1]].forEach(function (d) {
          var cells = [0, 1, 2].map(function (i) { return { col: c + d[0] * i, row: r + d[1] * i }; });
          var ps = cells.map(function (x) { return gem(w, x.col, x.row); });
          if (!ps[0] || !ps[1] || !ps[2]) return;
          var pure = ps[0].t === ps[1].t && ps[1].t === ps[2].t;
          if (pureOnly && !pure) return;
          ps.forEach(function (p) { used[p.id] = true; });
          var win = { wall: w, cells: cells, pure: pure }; if (pure) win.fruit = ps[0].f;
          list.push(win);
        });
      });
    });
    var pureN = list.filter(function (x) { return x.pure; }).length;
    return { total: list.length, pure: pureN, mosaic: list.length - pureN, gems: n, list: list };
  }

  /* --- Commissions ------------------------------------------------------------------------------------- */
  function commissionCheck(state, id) {
    var have = 0, need = 0, win, f = state.walls.front, l = state.walls.left, c, top;
    if (id === 'pure2' || id === 'windows4' || id === 'everyWall') {
      win = windows(state);
      if (id === 'pure2') { have = win.pure; need = 2; }
      else if (id === 'windows4') { have = win.total; need = 4; }
      else { var seen = {}; win.list.forEach(function (x) { seen[x.wall] = 1; }); have = Object.keys(seen).length; need = 3; }
    } else if (id === 'rainbow') {
      need = 5;
      WALLS.forEach(function (w) {
        for (var r = 0; r < rowsOf(state, w); r++) {
          var kinds = {};
          for (var cc = 0; cc < cols(state, w); cc++) { var p = at(state, w, cc, r); if (p && isGem(p.t)) kinds[p.t] = 1; }
          have = Math.max(have, Object.keys(kinds).length);
        }
      });
    } else if (id === 'goldTop') {
      need = f.length; top = rowsOf(state, 'front') - 1;
      for (c = 0; c < f.length; c++) if (f[c][top] && f[c][top].t === 'G') have++;
    } else if (id === 'silverSill') {
      need = l.length;
      for (c = 0; c < l.length; c++) if (l[c][0] && l[c][0].t === 'S') have++;
    } else return null;
    return { have: Math.min(have, need), need: need };
  }
  function commissionFits(state, id) {            // can this card be met on this blueprint at all?
    if (id === 'rainbow') return WALLS.some(function (w) { return cols(state, w) >= 5 && rowsOf(state, w) >= 2; });
    if (id === 'pure2' || id === 'windows4') return tally(state).total >= 30;
    return true;
  }
  /* commissionChoices(state, rng?) -> [{id, text, label, need}] the cards offered for this building. Drawn once
     per building (with rng() if given, else a fixed shuffle from the building number) and then remembered. */
  function commissionChoices(state, rng) {
    var K = CONFIG.commissions;
    if (!K.enabled) return [];
    if (state.build.choices) return state.build.choices.map(function (id) { return commissionCard(state, id); });
    var seed = (state.sealed * 7919 + state.profile.age * 104729 + 12345) % 2147483647;
    var rand = rng || function () { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
    var pool = K.pool.filter(function (x) { return commissionFits(state, x.id); }).map(function (x) { return x.id; }), out = [];
    while (pool.length && out.length < K.offer) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
    state.build.choices = out;
    return out.map(function (id) { return commissionCard(state, id); });
  }
  function commissionCard(state, id) {
    var def = CONFIG.commissions.pool.filter(function (x) { return x.id === id; })[0], chk = commissionCheck(state, id);
    return { id: id, text: def ? def.text : id, label: def ? def.label : id, need: chk ? chk.need : 0 };
  }
  /* chooseCommission(state, id): pick one of the offered cards for this building (it can be swapped until sealing). */
  function chooseCommission(state, id) {
    if (!CONFIG.commissions.enabled) return fail('off');
    if (commissionChoices(state).every(function (x) { return x.id !== id; })) return fail('notOffered');
    state.build.commission = id;
    return { ok: true, events: [{ kind: 'commission', id: id }] };
  }
  /* commissionProgress(state) -> {id, done, have, need, text, label} for the chosen card, or null if none chosen. */
  function commissionProgress(state) {
    var id = state.build && state.build.commission;
    if (!CONFIG.commissions.enabled || !id) return null;
    var card = commissionCard(state, id), chk = commissionCheck(state, id);
    return { id: id, done: chk.have >= chk.need, have: chk.have, need: chk.need, text: card.text, label: card.label };
  }

  /* spendStars(state, n, what): spend n stars on a sticker or decoration. what = {kind, building?} (building = the
     city building's n, default 'city'). Recorded in state.purchases for the screen to draw. No gameplay effect. */
  /* countNight(state, key): one more night a grown-up confirmed (key = that night's date or day, so it counts once).
     Never goes down. -> {ok, nights, levelUp: the new level or null} */
  function countNight(state, key) {
    var nd = state.nightsDone || (state.nightsDone = { n: 0, keys: [] });
    key = String(key); if (nd.keys.indexOf(key) >= 0) return { ok: false, nights: nd.n, levelUp: null };
    var before = level(state).idx; nd.n++; nd.keys.push(key); if (nd.keys.length > 21) nd.keys = nd.keys.slice(-21);
    var L = level(state); return { ok: true, nights: nd.n, levelUp: L.idx > before ? L : null };
  }
  /* level(state) -> {idx, name, nights, at, nextAt, nextName, toNext}. After the last named level, a new step every `every` nights. */
  function level(state) {
    var C = CONFIG.levels, n = (state.nightsDone && state.nightsDone.n) || 0, i = 0;
    while (i + 1 < C.at.length && n >= C.at[i + 1]) i++;
    var last = C.at[C.at.length - 1], extra = n >= last ? Math.floor((n - last) / C.every) : 0, idx = i + extra;
    var name = C.names[i] + (extra ? ' ' + '\u2605'.repeat(Math.min(extra, 5)) : ''), at = extra ? last + extra * C.every : C.at[i];
    var nextAt = i + 1 < C.at.length ? C.at[i + 1] : last + (extra + 1) * C.every, nextName = i + 1 < C.at.length ? C.names[i + 1] : C.names[i] + ' ' + '\u2605'.repeat(Math.min(extra + 1, 5));
    return { idx: idx, name: name, nights: n, at: at, nextAt: nextAt, nextName: nextName, toNext: nextAt - n };
  }
  function spendStars(state, n, what) {
    ensure(state);
    if (!(n > 0) || n > state.starBalance) return fail('notEnough');
    var buy = { id: state.nextId++, kind: (what && what.kind) || String(what || 'sticker'), building: (what && what.building) || 'city', cost: n, day: state.day };
    if (what && what.forWho) buy.forWho = String(what.forWho).slice(0, 24);   // furniture is made for someone real
    state.starBalance -= n; state.purchases.push(buy);
    return { ok: true, purchase: buy, events: [{ kind: 'purchase', purchase: buy, balance: state.starBalance }] };
  }

  /* isFireNight(state): tonight is one of this age's set nights, a missed fire is owed, or the child called the fire. */
  function isFireNight(state) {
    return state.today.called || !!state.fireOwed || CONFIG.fireNights[band(state.profile.age)].indexOf(state.weekday) >= 0;
  }
  /* callFire(state): a complete building with no straw may ask for its testing fire tonight (it will seal). */
  function callFire(state) {
    if (!CONFIG.callFireWhenComplete) return fail('off');
    if (!isComplete(state) || strawCount(state) > 0) return fail('notReady');
    state.today.called = true;
    return { ok: true, events: [{ kind: 'fireCalled' }] };
  }

  function sealBuilding(state, ev) {
    var win = windows(state), counts = { G: 0, S: 0, P: 0, L: 0, gem: 0 }, layout = {};
    function see(p) { if (p) counts[isGem(p.t) ? 'gem' : p.t]++; }
    eachSlot(state, function (w, c, r, p) { see(p); }); state.free.forEach(see); state.spire.forEach(see);
    (state.extras || []).forEach(function (x) { see(x.p); });
    WALLS.forEach(function (w) {
      layout[w] = state.walls[w].map(function (col) { return col.map(function (p) { return p ? p.t : '.'; }).join(''); });
    });
    var S = CONFIG.stars, com = commissionProgress(state), spireDone = state.spire.length > 0 && state.spire.every(Boolean);
    var stars = S.sealed + (state.build.falls === 0 ? S.neverFell : 0) +
      (CONFIG.commissions.enabled ? (com && com.done ? S.commission : 0) : (win.pure > 0 ? S.pureWindow : 0)) + (spireDone ? CONFIG.spire.star : 0);
    var rec = { n: state.sealed + 1, day: state.day, days: state.day - state.build.startDay, tier: state.bp.tier, blueprint: state.bp.id,
      name: state.bp.name, rows: state.bp.rows, stars: stars, windows: win.total, pure: win.pure,
      gold: counts.G, silver: counts.S, gems: counts.gem, lamps: counts.L, pearls: state.build.pearls + counts.P,
      falls: state.build.falls, layout: layout, free: state.free.map(function (p) { return p.t; }),
      spire: state.spire.map(function (p) { return p ? p.t : '.'; }), spireDone: spireDone,
      commission: com ? { id: com.id, done: com.done } : null, gifted: 0, street: false,
      style: state.bp.style || null, look: { roof: state.build.look.roof, door: state.build.look.door },
      animals: (state.build.animals || []).slice(0, CONFIG.animals.perBuilding),
      animalOwed: Math.max(0, CONFIG.animals.perBuilding - (state.build.animals || []).length), lanterns: 0,
      extras: (state.extras || []).map(function (x) { return { wall: x.wall, col: x.col, row: x.row, out: x.out, t: x.p.t }; }) };
    state.city.push(rec); state.sealed++; state.stats.stars += stars; state.starBalance += stars;
    if (CONFIG.city.streetEvery && state.sealed % CONFIG.city.streetEvery === 0) { state.family.sets++; rec.street = true; }
    state.tray = state.tray.concat(state.rubble); state.rubble = [];
    if (CONFIG.carryOverMax != null && state.tray.length > CONFIG.carryOverMax) {     // the rest become the family landmark's stones
      rec.gifted = state.tray.splice(CONFIG.carryOverMax).length; state.family.stones += rec.gifted;
    }
    layBlueprint(state);
    ev.push({ kind: 'seal', building: rec, next: state.bp, street: rec.street, gifted: rec.gifted, family: { stones: state.family.stones, sets: state.family.sets } });
  }

  /* fire(state) -> ordered events for the screen to animate:
       {kind:'burn', wall, col, row, forgiven}          a bale burns, leaving a hole
       {kind:'knock', wall, col, row, piece, window?}   the stone on it (or nearest) goes to rubble; window:true = it was part of a lit window
       {kind:'wallFall', wall, straw, pieces:[{col,row,piece}]}
       {kind:'caveIn', pieces:[{wall,col,row,piece}]}   every wall down (free-build slots stay)
       {kind:'spireFall', pieces:[{col,piece}]}         straw burned while the spire had pieces: they go to rubble
       {kind:'practice'}                                the child's very first fire: straw burned, nothing else moved
       {kind:'mend', wall}                              a cracked wall stood: no longer cracked
       {kind:'crown'}                                   no straw at all tonight
       {kind:'seal', building, next, street, gifted, family}   complete + clean: moved to the City
     The array also carries .size = 'clean' | 'small' | 'wallFall' | 'caveIn', .mercy (walls were spared),
     .practice and .windowsLost (how many lit windows went dark). A wall falls at summary(state).fallAt straw. */
  function fire(state) {
    ensure(state);
    var ev = [], fallAt = fallAtFor(state), falling = [], burned = 0, mercy = !!state.mercy && CONFIG.mercyAfterCaveIn;
    var practice = CONFIG.practiceFirstFire && state.stats.fires === 0 && !state.practiced;
    var wasCracked = WALLS.filter(function (w) { return state.cracked[w] > 0; });
    var before = windows(state), lit = {};
    before.list.forEach(function (x) { x.cells.forEach(function (c) { lit[x.wall + ':' + c.col + ':' + c.row] = true; }); });
    if (!mercy && !practice) WALLS.forEach(function (w) { if (strawCount(state, w) >= wallFallAt(state, w)) falling.push(w); });
    state.mercy = false; state.fireOwed = false; state.practiced = true;
    if (falling.length) fairOf(state).fallDays.push(state.day);
    function knock(w, c, r, p) {
      state.walls[w][c][r] = null; state.rubble.push(p);
      var e = { kind: 'knock', wall: w, col: c, row: r, piece: p }; if (lit[w + ':' + c + ':' + r]) e.window = true;
      ev.push(e);
    }
    /* props that hold a straw-heavy wall up through this fire are used up: the blocks that took the weight go to the rubble pile */
    var cavePre = falling.length > 0 && (wasCracked.filter(function (w) { return CONFIG.sameWallCanCaveIn || falling.indexOf(w) < 0 || falling.length > 1; }).length > 0 || (CONFIG.twoWallsCaveIn && falling.length > 1))
      && !(state.lastCaveIn && state.day - state.lastCaveIn <= CONFIG.caveInGraceDays);   // the whole house comes down anyway: props are not "used up", they fall with it
    if (CONFIG.brace && CONFIG.brace.oneFire && !mercy && !practice && !cavePre) WALLS.forEach(function (w) {
      if (falling.indexOf(w) >= 0) return;
      var load = strawCount(state, w) - fallAt + 1; if (load <= 0) return;
      var props = state.extras.filter(function (x) { return isProp(x, w); })
        .sort(function (a, b) { return b.row - a.row; }).slice(0, CONFIG.brace.per * load);   // from the top down, so nothing is left floating
      props.forEach(function (x) { takeExtra(state, w, x.col, x.row, x.out); delete x.p.prop; state.rubble.push(x.p);
        ev.push({ kind: 'knock', wall: w, col: x.col, row: x.row, out: x.out, extra: true, prop: true, piece: x.p }); });
    });
    eachSlot(state, function (w, c, r, p) {
      if (!p || p.t !== 'W') return;
      burned++; state.walls[w][c][r] = null;
      ev.push({ kind: 'burn', wall: w, col: c, row: r, forgiven: !!p.forgiven });
      if (practice || falling.indexOf(w) >= 0) return;
      for (var kb = 0; kb < (CONFIG.knocksPerBurn || 1); kb++) knockFor(w, c, r);
    });
    function knockFor(w, c, r) {
      var spots = [[c, r + 1]].concat(CONFIG.knockBesideIfBare ? [[c - 1, r], [c + 1, r]] : []);
      if (r + 1 === rowsOf(state, w) && !at(state, w, c, r + 1)) {   // the top row: an extra stone sitting on it is "on top"
        var cap = extraAt(state, w, c, r + 1, 0);
        if (cap && cap.t !== 'W') { takeExtra(state, w, c, r + 1, 0); state.rubble.push(cap);
          return ev.push({ kind: 'knock', wall: w, col: c, row: r + 1, out: 0, extra: true, piece: cap }); }
      }
      for (var i = 0; i < spots.length; i++) {              // the stone on top, else (optional) the one beside
        var up = at(state, w, spots[i][0], spots[i][1]);
        if (!up || up.t === 'W') continue;
        return knock(w, spots[i][0], spots[i][1], up);
      }
      if (!CONFIG.knockBesideIfBare || !CONFIG.knockNearestIfBare) return;
      var near = null;                                      // nothing on top or beside: the nearest stone in this wall
      eachSlot(state, function (ww, cc, rr, q) {
        var dist = Math.abs(cc - c) + Math.abs(rr - r);
        if (q && q.t !== 'W' && (!near || dist < near.d)) near = { c: cc, r: rr, d: dist, p: q };
      }, w);
      if (near) knock(w, near.c, near.r, near.p);
    }
    function drop(w, list, tagWall) {
      eachSlot(state, function (ww, c, r, p) {
        if (!p) return;
        state.walls[ww][c][r] = null; state.rubble.push(p);
        list.push(tagWall ? { wall: ww, col: c, row: r, piece: p } : { col: c, row: r, piece: p });
      }, w);
      state.extras = state.extras.filter(function (x) {      // its extra blocks fall with it
        if (x.wall !== w) return true;
        state.rubble.push(x.p);
        var q = { col: x.col, row: x.row, out: x.out, extra: true, piece: x.p }; if (tagWall) q.wall = w;
        list.push(q); return false;
      });
      state.seams = state.seams.filter(function (s) { return s.wall !== w; });
    }
    falling.forEach(function (w) {
      var e = { kind: 'wallFall', wall: w, straw: fallAt, pieces: [] };
      drop(w, e.pieces, false); ev.push(e);
      state.stats.wallFalls++; state.build.falls++;
    });
    var others = wasCracked.filter(function (w) { return CONFIG.sameWallCanCaveIn || falling.indexOf(w) < 0 || falling.length > 1; });
    var caveIn = falling.length > 0 && (others.length > 0 || (CONFIG.twoWallsCaveIn && falling.length > 1));
    if (caveIn && state.lastCaveIn && state.day - state.lastCaveIn <= CONFIG.caveInGraceDays) caveIn = false;
    if (caveIn) {
      state.lastCaveIn = state.day; state.mercy = true;
      var all = { kind: 'caveIn', pieces: [] };
      WALLS.forEach(function (w) { drop(w, all.pieces, true); });
      ev.push(all); state.stats.caveIns++; state.build.caveIns++;
    }
    if (burned && !practice && state.spire.some(Boolean)) {   // the spire dare is lost
      var sp = { kind: 'spireFall', pieces: [] };
      state.spire.forEach(function (p, i) { if (p) { sp.pieces.push({ col: i, piece: p }); state.rubble.push(p); state.spire[i] = null; } });
      ev.push(sp); state.build.spireFell = true; state.stats.spireFalls = (state.stats.spireFalls || 0) + 1;
    }
    if (practice) ev.push({ kind: 'practice' });
    WALLS.forEach(function (w) {
      if (falling.indexOf(w) >= 0) state.cracked[w] = CONFIG.fairness.enabled && fairOf(state).bonus > 0 ? Math.min(CONFIG.crackFires, CONFIG.fairness.crackFiresWhenHelped) : CONFIG.crackFires;
      else if (state.cracked[w] > 0 && --state.cracked[w] === 0 && !caveIn) ev.push({ kind: 'mend', wall: w });
      if (caveIn && CONFIG.caveInClearsCracks) state.cracked[w] = 0;
    });
    state.stats.strawBurned += burned;
    ev.mercy = mercy; ev.practice = practice;
    ev.windowsLost = Math.max(0, before.total - windows(state).total);
    ev.size = caveIn ? 'caveIn' : falling.length ? 'wallFall' : burned ? 'small' : 'clean';
    state.stats.fires++;
    if (ev.size === 'clean' || ev.size === 'small') state.stats[ev.size]++;
    if (!burned) { ev.push({ kind: 'crown' }); if (isComplete(state)) sealBuilding(state, ev); }
    state.today.fired = true;
    state.lastFire = { day: state.day, size: ev.size, burned: burned, falls: falling, caveIn: caveIn, practice: practice, windowsLost: ev.windowsLost,
      spireFell: ev.some(function (e) { return e.kind === 'spireFall'; }), sealed: ev.some(function (e) { return e.kind === 'seal'; }) };
    return ev;
  }

  /* forecast(state): what a fire tonight would do, without changing anything.
     -> { size, burns, knocks, wallFalls:[wall], caveIn, seal, spireFall, windowsLost, practice, events } */
  function forecast(state) {
    var ev = fire(JSON.parse(JSON.stringify(state)));
    function n(k) { return ev.filter(function (e) { return e.kind === k; }).length; }
    return { size: ev.size, burns: n('burn'), knocks: n('knock'),
      wallFalls: ev.filter(function (e) { return e.kind === 'wallFall'; }).map(function (e) { return e.wall; }),
      caveIn: n('caveIn') > 0, seal: n('seal') > 0, spireFall: n('spireFall') > 0, windowsLost: ev.windowsLost, practice: ev.practice, events: ev };
  }

  /* endDay(state): close the day. With CONFIG.autoLayAtNight any tray pieces left are laid (events hold the
     'place' events, record.autoLaid counts them). A fire night that was not held is owed tomorrow. */
  function endDay(state) {
    var laid = CONFIG.autoLayAtNight ? autoLay(state, true) : [];
    var rec = { day: state.day, placed: state.today.placed, fired: state.today.fired, autoLaid: laid.length,
      missedFire: isFireNight(state) && !state.today.fired, straw: state.today.W, pulls: state.today.pulls };
    state.fireOwed = CONFIG.missedFireNextNight && rec.missedFire && !state.today.called;
    return { ok: true, events: laid.concat([{ kind: 'dayEnd', record: rec }]), record: rec };
  }

  /* addGospelShare(state, meta): "I shared the gospel". meta may carry {name}. Plants a seed (state.seeds gets
     {id, day, name?}) and, with CONFIG.gospel.lampInGarden, a garden lamp (state.garden gets {id, day, name});
     otherwise the old behaviour: one lamp piece 'L' a day to the tray. */
  function addGospelShare(state, meta) {
    if (!CONFIG.gospel.enabled) return fail('off');
    ensure(state);
    var name = meta && typeof meta === 'object' && meta.name ? meta.name : typeof meta === 'string' ? meta : '';
    var seed = { id: state.nextId++, day: state.day }; if (name) seed.name = name;
    state.seeds.push(seed);
    if (CONFIG.gospel.lampInGarden) {
      var lamp = { id: state.nextId++, day: state.day, name: name };
      state.garden.push(lamp);
      return { ok: true, seed: seed, lamp: lamp, piece: null, events: [{ kind: 'seed', seed: seed }, { kind: 'gardenLamp', lamp: lamp }] };
    }
    var res = addPiece(state, 'L', meta);
    return { ok: true, seed: seed, piece: res.ok ? res.piece : null, events: [{ kind: 'seed', seed: seed }].concat(res.events) };
  }
  /* addNeighbour(state, name | {name}): "someone came to Jesus" (a grown-up confirms). Starts a neighbour's house
     beside the child's. Neighbours are never touched by straw or fire. */
  function addNeighbour(state, name) {
    if (!CONFIG.gospel.enabled) return fail('off');
    if (name && typeof name === 'object') name = name.name;
    var n = { id: state.nextId++, name: name || '', startedDay: state.day, stones: 0, lastPrayed: 0 };
    state.neighbours.push(n);
    return { ok: true, neighbour: n, events: [{ kind: 'neighbour', neighbour: n }] };
  }
  /* prayFor(state, id): praying for a neighbour on a later day adds one stone to their house
     (once a day each, up to CONFIG.gospel.neighbourHouse). */
  function prayFor(state, id) {
    var n = state.neighbours.filter(function (x) { return x.id === id; })[0];
    if (!n) return fail('noNeighbour');
    if (state.day <= n.startedDay) return fail('tooSoon');
    if (n.lastPrayed === state.day) return fail('alreadyToday');
    if (n.stones >= CONFIG.gospel.neighbourHouse) return fail('houseDone');
    n.stones++; n.lastPrayed = state.day;
    return { ok: true, events: [{ kind: 'neighbourStone', id: id, stones: n.stones, complete: n.stones >= CONFIG.gospel.neighbourHouse }] };
  }

  /* --- v5: cards, the night account, seen gems, pearls for owning up, prayers, bonus pieces, colours, animals --- */
  function cardDef(id) { return CONFIG.cards.filter(function (c) { return c.id === id; })[0] || null; }
  /* seen(state, cardId, focusId): "I saw it!" -> a gem from that card's fruit (at most seenPerDay a day).
     If it is the child's focus card, a twin: a second gem, once a day. The twin is two ordinary pieces. */
  function seen(state, cardId, focusId) {
    ensure(state);
    var c = cardDef(cardId);
    if (!c) return fail('noCard');
    if (state.today.seen >= CONFIG.seenPerDay) return fail('seenCap');
    var r = addPiece(state, c.fruit, { card: cardId, seen: true });
    if (!r.ok) return r;
    state.today.seen++;
    var pieces = r.pieces.slice(), ev = r.events;
    if (focusId === cardId && state.today.twin < CONFIG.twinPerDay) {
      var r2 = addPiece(state, c.fruit, { card: cardId, seen: true, twin: true });
      if (r2.ok) { state.today.twin++; r.piece.m.twin = true; pieces = pieces.concat(r2.pieces); ev = ev.concat(r2.events); }
    }
    return { ok: true, pieces: pieces, twin: !!(r.piece.m && r.piece.m.twin), events: ev };
  }
  /* nightAccount(state, answers): answers = {cardId: 'good' | 'both' | 'not'}. Nothing is given yet:
     'good' cards wait for a grown-up's confirmNight (or arrive next morning anyway); 'not' cards may be owned up
     with ownUp() after the sorry prayer. An honest 'not' NEVER adds straw. 'both' gains and loses nothing. */
  function nightAccount(state, answers) {
    ensure(state);
    var good = [], not = [];
    Object.keys(answers || {}).forEach(function (id) {
      if (!cardDef(id)) return;
      if (answers[id] === 'good') good.push(id); else if (answers[id] === 'not') not.push(id);
    });
    if (state.accountDay === state.day) return { ok: false, reason: 'already', events: [] };   /* one night account a day */
    state.accountDay = state.day;
    state.pendingNight = { day: state.day, cards: good, owned: [], not: not };
    return { ok: true, good: good.length, not: not.slice(), events: [{ kind: 'nightAccount', good: good, not: not }] };
  }
  function giveNight(state, late) {
    var pn = state.pendingNight, out = [];
    if (!pn) return out;
    pn.cards.forEach(function (id) {
      var r = addPiece(state, cardDef(id).fruit, { card: id, night: true, late: !!late });
      if (r.ok) out = out.concat(r.pieces);
    });
    pn.cards = []; pn.given = true;
    return out;
  }
  /* confirmNight(state): the grown-up's one tap ("Yes, I saw that too") gives the night's gems. */
  function confirmNight(state) {
    if (!state.pendingNight || state.pendingNight.given) return fail('nothingPending');
    var given = giveNight(state, false), cn = countNight(state, 'day' + state.day);
    return { ok: true, levelUp: cn.levelUp, pieces: given, events: given.map(function (p) { return { kind: 'tray', piece: p }; }) };
  }
  /* ownUp(state, cardId): after the sorry prayer for a card answered 'not' tonight. Never straw, never a new piece:
     the pearl brings back ONE block lost to fire (the newest in the rubble) into the tray, pearl-marked, to be laid next
     (outside the daily rubble limit). Empty rubble -> the pearl just shines on the Rock (restored: null, shine: true). */
  function ownUp(state, cardId) {
    ensure(state);
    var pn = state.pendingNight;
    if (!pn || pn.not.indexOf(cardId) < 0) return fail('notOwned');
    if (pn.owned.indexOf(cardId) >= 0) return fail('alreadyOwned');
    pn.owned.push(cardId);
    var pieces = [];
    for (var i = 0; i < CONFIG.pearlPerOwnUp; i++) { var r = addPiece(state, 'P', { card: cardId, ownUp: true }); if (r.ok) pieces.push(r.piece); }
    var back = state.rubble.length ? state.rubble.pop() : null;
    if (back) { back.pearl = true; state.tray.push(back); state.stats.pearls++; state.build.pearls++; }
    return { ok: true, pieces: pieces, restored: back, shine: !back,
      events: [back ? { kind: 'pearlRestore', piece: back } : { kind: 'pearlShine' }] };
  }
  /* --- Quick log: "I prayed", "I cooled down", and "Tell about today" (great attitude / tantrum / disobeyed / negative).
     quickLog(state, kind, by, at): kind as in CONFIG.quick or 'prayer'; by 'me' | 'sibling' | 'grownup'; at = a time label.
     A prayer is counted at once (prayers are never taken away). Everything else waits for a grown-up's quickCheck. */
  function quickKind(k) { var Q = CONFIG.quick; return Q.good.indexOf(k) >= 0 ? 'good' : Q.bad.indexOf(k) >= 0 ? 'bad' : k === 'prayer' ? 'prayer' : null; }
  /* 'seen' (a precious-stones card): opt = { card, focus } -> it waits like the rest; seenPerDay and the twin are applied
     when the pile is turned into blocks (quickCheck, or next morning). */
  function quickLog(state, kind, by, at, opt) {
    ensure(state);
    if (!quickKind(kind)) return fail('kind');
    if (kind === 'seen' && !cardDef(opt && opt.card)) return fail('noCard');
    var e = { id: state.nextId++, kind: kind, by: by || 'me', at: at || '', day: state.day };
    if (kind === 'seen') { e.card = opt.card; e.focus = opt.focus === opt.card; }
    var ev = [];
    if (kind === 'prayer') { var pr = addPrayer(state); e.counted = pr.counted; e.lantern = pr.lantern; ev = pr.events; }
    state.waiting.push(e);
    return { ok: true, entry: e, events: ev.concat([{ kind: 'quick', entry: e }]) };
  }
  /* waitingFor(state) -> today's waiting entries a grown-up still has to check (prayers come too, as thanks). */
  function waitingFor(state) { ensure(state); return state.waiting.filter(function (e) { return e.day === state.day; }); }
  /* A cooled-down gem never comes on a day with a tantrum that a grown-up has not set aside as "not quite",
     so a tantrum then cooling down never pays better than a calm day. */
  function giveQuickGood(state, list, late) {
    var Q = CONFIG.quick, out = [];
    list.forEach(function (e) {
      var r;
      var qd = state.quickDays = state.quickDays || {}, d = qd[e.day] = qd[e.day] || { tantrum: 0, cooled: 0, great: 0 };
      if (e.kind === 'seen') {
        d.seen = d.seen || 0; d.twin = d.twin || 0;
        if (d.seen >= CONFIG.seenPerDay) return;
        var fr = cardDef(e.card).fruit;
        r = addPiece(state, fr, { card: e.card, seen: true, quick: 'seen', by: e.by, late: !!late });
        if (r.ok) {
          d.seen++; state.today.seen = (state.today.seen || 0) + 1;
          if (e.focus && d.twin < CONFIG.twinPerDay) {
            var r2 = addPiece(state, fr, { card: e.card, seen: true, twin: true, quick: 'seen', by: e.by, late: !!late });
            if (r2.ok) { d.twin++; r.piece.m.twin = true; out = out.concat(r2.pieces); }
          }
        }
      } else if (e.kind === 'cooled') {
        /* counted per day the tap was made, so a later check or the morning arrival can't pay it twice,
           and never on a day with a kept tantrum (whichever order they were checked in) */
        if (e.tantrumDay || d.tantrum || d.cooled >= Q.cooledPerDay) return;
        r = addPiece(state, Q.cooledFruit, { quick: 'cooled', by: e.by, label: 'Cooled down', late: !!late });
        if (r.ok) { d.cooled++; state.today.cooled = (state.today.cooled || 0) + 1; }
      } else if (e.kind === 'great') {
        if (d.great >= Q.greatPerDay) return;
        r = addPiece(state, Q.greatFruit, { quick: 'great', by: e.by, label: 'Great attitude', colour: true, late: !!late });
        if (r.ok) d.great++;
      }
      if (r && r.ok) out = out.concat(r.pieces);
    });
    return out;
  }
  function markTantrumDays(state, entries, keptOrWaiting) {
    var days = {};
    keptOrWaiting.forEach(function (e) { if (e.kind === 'tantrum') days[e.day] = true; });
    entries.forEach(function (e) { if (e.kind === 'cooled') e.tantrumDay = !!days[e.day]; });
  }
  /* quickCheck(state, keep): the grown-up check at night. keep = {entryId: true | false}; a missing id counts as kept.
     Kept bad -> straw (daily straw cap, and at most quick.nightStrawByAge from this check). Kept good -> gems (daily gem cap;
     the cooled-down gem once a day). Prayers are already counted. Every checked entry leaves the list. */
  function quickCheck(state, keep, strawUsed) {
    ensure(state);
    keep = keep || {};
    var list = waitingFor(state), kept = list.filter(function (e) { return keep[e.id] !== false; });
    var room = CONFIG.quick.nightStrawByAge[band(state.profile.age)] - (strawUsed || 0), straw = [], ev = [];
    kept.forEach(function (e) {
      if (quickKind(e.kind) !== 'bad') return;
      if (e.kind === 'tantrum') { var qd = state.quickDays = state.quickDays || {}; (qd[e.day] = qd[e.day] || { tantrum: 0, cooled: 0, great: 0 }).tantrum = 1; }
      if (room <= 0) { e.capped = true; return; }
      var r = addPiece(state, 'W', { quick: e.kind, by: e.by, label: 'Straw: ' + e.kind });
      if (r.ok) { room--; straw.push(r.piece); ev = ev.concat(r.events); } else e.capped = true;
    });
    var good = kept.filter(function (e) { return quickKind(e.kind) === 'good'; });
    markTantrumDays(state, good, kept);
    var gems = giveQuickGood(state, good, false);
    var ids = list.map(function (e) { return e.id; });
    state.waiting = state.waiting.filter(function (e) { return ids.indexOf(e.id) < 0; });
    return { ok: true, pieces: gems, straw: straw, kept: kept.length, notQuite: list.length - kept.length,
      events: ev.concat(gems.map(function (p) { return { kind: 'tray', piece: p }; })) };
  }
  /* Next morning (from startDay): unchecked good items arrive anyway, on yesterday's count; bad items are dropped. */
  function quickMorning(state) {
    var old = state.waiting.filter(function (e) { return e.day < state.day + 1; });
    var good = old.filter(function (e) { return quickKind(e.kind) === 'good'; });
    markTantrumDays(state, good, old);
    var out = giveQuickGood(state, good, true);
    state.waiting = state.waiting.filter(function (e) { return old.indexOf(e) < 0; });
    return out;
  }
  /* pileCount(state, strawUsed): tonight's pile as it would land if a grown-up tapped "Keep all" now (every cap applied),
     worked out on a copy so nothing changes. -> { blocks, straw, good, bad } (good/bad = taps waiting). */
  function pileCount(state, strawUsed) {
    var list = waitingFor(state);
    var copy = JSON.parse(JSON.stringify(state)), r = quickCheck(copy, {}, strawUsed || 0);
    return { blocks: r.pieces.length, straw: r.straw.length,
      good: list.filter(function (e) { return quickKind(e.kind) === 'good'; }).length,
      bad: list.filter(function (e) { return quickKind(e.kind) === 'bad'; }).length };
  }
  /* addPrayer(state): "I stopped and prayed" or Stop & Pray. At most prayer.perDay counted a day; every perLantern -> a lantern. */
  function addPrayer(state) {
    ensure(state);
    var P = CONFIG.prayer;
    if ((state.today.prayers || 0) >= P.perDay) return { ok: true, counted: false, count: state.prayers.n, lantern: false, lanterns: state.prayers.lanterns, events: [] };
    state.today.prayers = (state.today.prayers || 0) + 1; state.prayers.n++;
    var lantern = state.prayers.n % P.perLantern === 0;
    if (lantern) state.prayers.lanterns++;
    return { ok: true, counted: true, count: state.prayers.n, lantern: lantern, lanterns: state.prayers.lanterns,
      events: [{ kind: 'prayer', count: state.prayers.n }].concat(lantern ? [{ kind: 'lantern', lanterns: state.prayers.lanterns }] : []) };
  }
  /* addBonus(state, kind, code): a piece from the weekly review shelf (no daily gem cap; bonusPerReview a day).
     kind 'gem' | 'glass' (a gem that always glows) | 'lantern' | 'flag'. */
  function addBonus(state, kind, code) {
    ensure(state);
    if ((state.today.bonus || 0) >= CONFIG.bonusPerReview) return fail('bonusCap');
    var ev = [], piece = null;
    if (kind === 'gem' || kind === 'glass') {
      if (!isGem(code)) code = Object.keys(CONFIG.gems)[0];
      var m = { bonus: kind }; if (kind === 'glass') m.glass = true;
      var blocks = stack(state, code, m, CONFIG.blocksPerPiece); piece = blocks[0];
      state.tray = state.tray.concat(blocks); blocks.forEach(function (b) { ev.push({ kind: 'tray', piece: b }); });
    } else if (kind === 'lantern') { state.prayers.lanterns++; ev.push({ kind: 'lantern', lanterns: state.prayers.lanterns }); }
    else if (kind === 'flag') { var buy = { id: state.nextId++, kind: 'flag', building: 'home', cost: 0, day: state.day, bonus: true }; state.purchases.push(buy); ev.push({ kind: 'purchase', purchase: buy }); }
    else return fail('kind');
    state.today.bonus = (state.today.bonus || 0) + 1;
    return { ok: true, piece: piece, events: ev };
  }
  /* setColour(state, pieceId, code): choose a tray gem's colour before placing it. Three the same still make a pure window. */
  function setColour(state, pieceId, code) {
    if (!isGem(code)) return fail('colour');
    var p = state.tray.filter(function (x) { return x.id === pieceId; })[0];
    if (!p) return fail('noPiece');
    if (!isGem(p.t)) return fail('notGem');
    var same = p.st ? state.tray.filter(function (x) { return x.st === p.st && isGem(x.t); }) : [p];   // the whole stack from that act
    same.forEach(function (x) { x.t = code; x.f = CONFIG.gems[code]; });
    return { ok: true, events: [{ kind: 'colour', piece: p }] };
  }
  /* Animals: first wall finished -> 1, all walls up -> 2, sealed -> 3 (they move to the City with the building).
     Once earned, an animal is never lost: if a wall falls it waits safe on the Rock until the wall is rebuilt. */
  function animalsDue(state) {
    var full = WALLS.filter(function (w) { var t = tally(state, w); return t.total > 0 && t.filled === t.total; }).length;
    return full === 0 ? 0 : full < WALLS.length ? 1 : 2;
  }
  function animalPeak(state) { if (state.build && state.build.animals) state.build.animalPeak = Math.max(state.build.animalPeak || 0, animalsDue(state)); }
  function animals(state) {
    ensure(state); animalPeak(state);
    var b = state.build, due = animalsDue(state), last = state.city[state.city.length - 1];
    return { invited: b.animals.slice(), due: due, peak: b.animalPeak, home: b.animals.slice(0, due), onRock: b.animals.slice(due),
      canInvite: b.animals.length < b.animalPeak || !!(last && last.animalOwed > 0), forCity: !!(last && last.animalOwed > 0) && b.animals.length >= b.animalPeak };
  }
  /* inviteAnimal(state, kind): fill an earned place (the building's first, then a sealed building's owed ones). */
  function inviteAnimal(state, kind) {
    ensure(state);
    if (CONFIG.animals.kinds.indexOf(kind) < 0) return fail('kind');
    var b = state.build, last = state.city[state.city.length - 1];
    animalPeak(state);
    if (b.animals.length < b.animalPeak) { b.animals.push(kind); return { ok: true, where: 'home', events: [{ kind: 'animal', animal: kind, where: 'home' }] }; }
    if (last && last.animalOwed > 0) { last.animals.push(kind); last.animalOwed--; return { ok: true, where: 'city', building: last.n, events: [{ kind: 'animal', animal: kind, where: 'city' }] }; }
    return fail('noRoom');
  }

  /* summary(state): everything a screen needs to draw the status of the building. */
  function summary(state) {
    ensure(state);
    var all = tally(state), wob = wobble(state), per = {}, f = fairOf(state);
    WALLS.forEach(function (w) { var t = tally(state, w); t.wobble = wob[w]; t.cracked = state.cracked[w] > 0; t.cols = cols(state, w); t.rows = rowsOf(state, w); per[w] = t; });
    var b = band(state.profile.age), mortar = CONFIG.fairness.enabled && f.bonus > 0;
    return { day: state.day, weekday: state.weekday, age: state.profile.age, blueprint: state.bp,
      slots: all, walls: per, free: { filled: state.free.filter(Boolean).length, total: state.free.length },
      tray: state.tray.length, rubble: state.rubble.length,
      rubbleLeftToday: Math.max(0, rubbleCap(state) - state.today.rubble),
      pullsLeftToday: Math.max(0, pullCap(state) - state.today.pulls),
      strawLeftToday: Math.max(0, CONFIG.strawCapByAge[b] - state.today.W),
      fallAt: fallAtFor(state), fairnessBonus: f.bonus, mortar: mortar, mortarEndsDay: mortar ? mortarEnds(state) : null,
      mercy: !!state.mercy, fireOwed: !!state.fireOwed, practiceNext: CONFIG.practiceFirstFire && state.stats.fires === 0 && !state.practiced,
      windows: windows(state), seams: state.seams.length,
      commission: commissionProgress(state), commissionChoices: state.build.choices || null,
      extras: { n: state.extras.length, cap: extraCap(state) },
      spire: { filled: state.spire.filter(Boolean).length, total: state.spire.length, open: spireSlots(state).length > 0, fell: !!state.build.spireFell },
      complete: isComplete(state), canCallFire: CONFIG.callFireWhenComplete && isComplete(state) && all.straw === 0,
      fireTonight: isFireNight(state), fired: state.today.fired, lastFire: state.lastFire,
      seeds: state.seeds.length, seedList: state.seeds, garden: state.garden, neighbours: state.neighbours,
      city: state.city.length, streets: CONFIG.city.streetEvery ? Math.floor(state.sealed / CONFIG.city.streetEvery) : 0,
      family: { stones: state.family.stones, sets: state.family.sets },
      stars: state.stats.stars, starBalance: state.starBalance, purchases: state.purchases,
      nextTierIn: state.bp.nextIn != null ? state.bp.nextIn : 0,
      empty: isEmptyBuilding(state), design: state.design || null, look: state.build.look, animals: animals(state),
      prayers: { n: state.prayers.n, lanterns: state.prayers.lanterns, ofLantern: state.prayers.n % CONFIG.prayer.perLantern },
      pendingNight: state.pendingNight || null,
      waiting: waitingFor(state).filter(function (e) { return e.kind !== 'prayer'; }).length,
      todayGood: (state.today.G || 0) + (state.today.S || 0) + (state.today.gem || 0) + (state.today.P || 0) + (state.today.bonus || 0),
      todayStraw: state.today.W || 0,
      stats: state.stats };
  }

  return { CONFIG: CONFIG, newChild: newChild, startDay: startDay, addPiece: addPiece, legalSlots: legalSlots,
    craft: craft, craftable: craftable, bracing: bracing, braceOf: braceOf, markProp: markProp, countNight: countNight, level: level, decorate: decorate, decoSlots: decoSlots, place: place, placeRubble: placeRubble, autoPlace: autoPlace, forgive: forgive, pull: pull, wobble: wobble,
    windows: windows, forecast: forecast, isFireNight: isFireNight, callFire: callFire, fire: fire,
    endDay: endDay, summary: summary, addGospelShare: addGospelShare, addNeighbour: addNeighbour, prayFor: prayFor,
    strawTarget: strawTarget, isComplete: isComplete, at: at, tally: tally,
    spireSlots: spireSlots, extraSlots: extraSlots, extraAt: extraAt, markMadeRight: markMadeRight, commissionChoices: commissionChoices,
    chooseCommission: chooseCommission, commissionProgress: commissionProgress, spendStars: spendStars,
    /* v5 */
    designs: designs, chooseDesign: chooseDesign, setLook: setLook, isEmptyBuilding: isEmptyBuilding, blueprintFor: blueprintFor,
    seen: seen, nightAccount: nightAccount, confirmNight: confirmNight, ownUp: ownUp, addPrayer: addPrayer, addBonus: addBonus,
    quickLog: quickLog, quickCheck: quickCheck, waitingFor: waitingFor, pileCount: pileCount, quickKind: quickKind,
    setColour: setColour, animals: animals, inviteAnimal: inviteAnimal, cardDef: cardDef };
});
