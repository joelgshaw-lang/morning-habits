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
    dailyCap: { G: 1, S: 2, gem: 9, L: 1 },
    strawCapByAge: { 6: 2, 8: 3, 12: 3 },
    fallAt: { 6: 2, 8: 2, 12: 2 },                  // straw in one wall that makes it fall at a fire
    swayBelow: 1,                                   // sway starts this many straw below fallAt
    pullsPerDay: 2,                                 // used only when pullsMatchStrawCap is off
    pullsMatchStrawCap: true,                       // pulls allowed a day = straw allowed a day for that age
    pullNeedsForgive: true,                         // the bale must carry the pearl mark first
    pullNeedsMadeRight: false,                      // true: markMadeRight() must be called before pull() works
    pullMode: 'settle',                             // 'settle' (wall drops, pearl seam) | 'pearlSlot'
    rubblePerDay: { 6: 2, 8: 2, 12: 2 },            // fallen stones a child may re-lay each day
    rubbleBigPile: { over: 8, perDay: 6 },          // while the pile is bigger than `over`, re-lay this many a day
    autoLayAtNight: true,                           // endDay lays any tray pieces left over (no hoarding)
    carryOverMax: 6,                                // tray pieces carried into the next building; the rest go to the family landmark
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
  function wallsFull(state) { var t = tally(state); return t.filled === t.total; }
  /* isComplete(state): every wall slot and free slot is filled (straw counts as filled; the spire is optional). */
  function isComplete(state) { return wallsFull(state) && state.free.every(Boolean); }

  /* Which blueprint comes after `sealed` sealed buildings. Returns the bp object stored on state.bp:
     { tier (step number), id, name, rows (tallest wall), sideCols, free, spire, door, walls:{front,left,right:{cols,rows}} } */
  function blueprintFor(age, sealed) {
    var b = band(age), L = CONFIG.ladder, def, step, left = 0;
    if (L.enabled) {
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
    return { tier: step, id: def.id, name: def.name, rows: Math.max(w.front.rows, w.left.rows, w.right.rows), sideCols: w.left.cols, free: def.free,
      spire: CONFIG.spire.enabled ? (def.spire != null ? def.spire : CONFIG.spire.slots) : 0, nextIn: left,
      door: { wall: 'front', col: w.front.door, row: 0 },
      walls: { front: { cols: w.front.cols, rows: w.front.rows }, left: { cols: w.left.cols, rows: w.left.rows }, right: { cols: w.right.cols, rows: w.right.rows } } };
  }
  function layBlueprint(state) {
    var bp = state.bp = blueprintFor(state.profile.age, state.sealed);
    function grid(d) { var g = []; for (var c = 0; c < d.cols; c++) { g.push([]); for (var r = 0; r < d.rows; r++) g[c].push(null); } return g; }
    function row(n) { var a = []; for (var i = 0; i < n; i++) a.push(null); return a; }
    state.walls = { front: grid(bp.walls.front), left: grid(bp.walls.left), right: grid(bp.walls.right) };
    state.free = row(bp.free); state.spire = row(bp.spire);
    state.cracked = { front: 0, left: 0, right: 0 };
    state.seams = [];                               // pearl lines left by pull-outs: {wall, col, row}
    state.build = { startDay: state.day, falls: 0, caveIns: 0, pearls: 0, choices: null, commission: null, spireFell: false };
  }

  function freshDay() { return { G: 0, S: 0, L: 0, gem: 0, W: 0, pulls: 0, rubble: 0, placed: 0, spire: 0, fired: false, called: false }; }
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
    state.day++; state.weekday = weekday;
    state.today = freshDay();
    var fair = fairnessReview(state);
    return { ok: true, events: [{ kind: 'dayStart', day: state.day, weekday: weekday, fireNight: isFireNight(state) }].concat(fair) };
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
    ev.push({ kind: 'strawLand', wall: spot.wall, col: spot.col, row: spot.row, piece: piece, wobble: wobble(state)[spot.wall] });
    return ev;
  }

  /* addPiece(state, type, meta): a real-life act gives a piece. Gold/silver/gems/pearls go to the tray.
     Straw ('W') lands on its wall at once. Daily caps apply -> { ok:false, reason:'cap' }. */
  function addPiece(state, type, meta) {
    var key = type === 'W' ? 'W' : isGem(type) ? 'gem' : type;
    if (key !== 'G' && key !== 'S' && key !== 'W' && key !== 'gem' && key !== 'P' && key !== 'L') return fail('type');
    var cap = key === 'W' ? CONFIG.strawCapByAge[band(state.profile.age)] : CONFIG.dailyCap[key];
    if (cap != null && state.today[key] >= cap) return fail('cap');
    var piece = { id: state.nextId++, t: type };
    if (isGem(type)) piece.f = CONFIG.gems[type];
    if (meta != null) piece.m = meta;
    if (key !== 'P') state.today[key]++;
    if (type === 'W') return { ok: true, piece: piece, events: landStraw(state, piece) };
    state.tray.push(piece);
    return { ok: true, piece: piece, events: [{ kind: 'tray', piece: piece }] };
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
  function isLegal(state, wall, col, row) {
    if (wall === 'free') return isSlot(state, wall, col, row) && !state.free[col] && (!CONFIG.freeNeedsFullWalls || wallsFull(state));
    if (wall === 'spire') return spireSlots(state).some(function (s) { return s.col === col && row === 0; });
    return isLegalWall(state, wall, col, row);
  }
  function lay(state, list, index, wall, col, row, fromRubble) {
    var piece = list[index];
    if (!piece) return fail('noPiece');
    if (!isLegal(state, wall, col, row)) return fail('slot');
    if (wall === 'spire' && CONFIG.spire.gemsOnly && !isGem(piece.t)) return fail('gemsOnly');
    list.splice(index, 1);
    piece.seq = ++state.seq;
    put(state, wall, col, row, piece);
    state.today.placed++;
    if (wall === 'spire') state.today.spire = (state.today.spire || 0) + 1;
    return { ok: true, events: [{ kind: 'place', wall: wall, col: col, row: row, piece: piece, fromRubble: !!fromRubble, windows: windows(state), complete: isComplete(state) }] };
  }
  /* place(state, trayIndex, wall, col, row): lay a tray piece (wall may also be 'free' or 'spire'). Never limited. */
  function place(state, trayIndex, wall, col, row) { return lay(state, state.tray, trayIndex, wall, col, row, false); }
  /* placeRubble(state, rubbleIndex, wall, col, row): re-lay a fallen stone; at most summary().rubbleLeftToday a day. */
  function placeRubble(state, rubbleIndex, wall, col, row) {
    if (state.today.rubble >= rubbleCap(state)) return fail('rubbleCap');
    var res = lay(state, state.rubble, rubbleIndex, wall, col, row, true);
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
      state.seams.push({ wall: wall, col: col, row: row });
    }
    ev.wobble = wobble(state)[wall];
    return { ok: true, events: [ev] };
  }

  /* wobble(state) -> {front,left,right}: 0 steady, 1 sways, 2 leans (it will fall at the next fire). */
  function wobble(state) {
    var fallAt = fallAtFor(state), o = {};
    WALLS.forEach(function (w) { var s = strawCount(state, w); o[w] = s >= fallAt ? 2 : s >= fallAt - CONFIG.swayBelow && s > 0 ? 1 : 0; });
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
  function spendStars(state, n, what) {
    ensure(state);
    if (!(n > 0) || n > state.starBalance) return fail('notEnough');
    var buy = { id: state.nextId++, kind: (what && what.kind) || String(what || 'sticker'), building: (what && what.building) || 'city', cost: n, day: state.day };
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
      commission: com ? { id: com.id, done: com.done } : null, gifted: 0, street: false };
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
    if (!mercy && !practice) WALLS.forEach(function (w) { if (strawCount(state, w) >= fallAt) falling.push(w); });
    state.mercy = false; state.fireOwed = false; state.practiced = true;
    if (falling.length) fairOf(state).fallDays.push(state.day);
    function knock(w, c, r, p) {
      state.walls[w][c][r] = null; state.rubble.push(p);
      var e = { kind: 'knock', wall: w, col: c, row: r, piece: p }; if (lit[w + ':' + c + ':' + r]) e.window = true;
      ev.push(e);
    }
    eachSlot(state, function (w, c, r, p) {
      if (!p || p.t !== 'W') return;
      burned++; state.walls[w][c][r] = null;
      ev.push({ kind: 'burn', wall: w, col: c, row: r, forgiven: !!p.forgiven });
      if (practice || falling.indexOf(w) >= 0) return;
      var spots = [[c, r + 1]].concat(CONFIG.knockBesideIfBare ? [[c - 1, r], [c + 1, r]] : []);
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
    });
    function drop(w, list, tagWall) {
      eachSlot(state, function (ww, c, r, p) {
        if (!p) return;
        state.walls[ww][c][r] = null; state.rubble.push(p);
        list.push(tagWall ? { wall: ww, col: c, row: r, piece: p } : { col: c, row: r, piece: p });
      }, w);
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
      spire: { filled: state.spire.filter(Boolean).length, total: state.spire.length, open: spireSlots(state).length > 0, fell: !!state.build.spireFell },
      complete: isComplete(state), canCallFire: CONFIG.callFireWhenComplete && isComplete(state) && all.straw === 0,
      fireTonight: isFireNight(state), fired: state.today.fired, lastFire: state.lastFire,
      seeds: state.seeds.length, seedList: state.seeds, garden: state.garden, neighbours: state.neighbours,
      city: state.city.length, streets: CONFIG.city.streetEvery ? Math.floor(state.sealed / CONFIG.city.streetEvery) : 0,
      family: { stones: state.family.stones, sets: state.family.sets },
      stars: state.stats.stars, starBalance: state.starBalance, purchases: state.purchases,
      nextTierIn: state.bp.nextIn != null ? state.bp.nextIn : 0,
      stats: state.stats };
  }

  return { CONFIG: CONFIG, newChild: newChild, startDay: startDay, addPiece: addPiece, legalSlots: legalSlots,
    place: place, placeRubble: placeRubble, autoPlace: autoPlace, forgive: forgive, pull: pull, wobble: wobble,
    windows: windows, forecast: forecast, isFireNight: isFireNight, callFire: callFire, fire: fire,
    endDay: endDay, summary: summary, addGospelShare: addGospelShare, addNeighbour: addNeighbour, prayFor: prayFor,
    strawTarget: strawTarget, isComplete: isComplete, at: at, tally: tally,
    spireSlots: spireSlots, markMadeRight: markMadeRight, commissionChoices: commissionChoices,
    chooseCommission: chooseCommission, commissionProgress: commissionProgress, spendStars: spendStars };
});
