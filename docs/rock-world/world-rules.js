/* Rock World: rules engine (1 Cor 3:10-15, Matt 6:19-21, Matt 7:24-27). Slice 1 of docs/rock-world/HANDOVER.md.
   No DOM, no drawing, no Math.random (pass an rng in). Browser: <script src="world-rules.js"> defines window.WorldRules.
   Node: require('./world-rules.js'). State is plain JSON (safe for localStorage).

   The world is a grid of blocks. A block lives at "x,y,z" (y = height, 0 = on the ground) and is { t, d, f? }:
     t  G gold · S silver · M gem (f = fruit code) · H hay · P pearl (hay that was put right) · X treasure stone
        D door (bottom) · d door (top half, always above a D) · W window · T table · B bed · L lamp
     d  the day it was laid.
   The child's own plot is 22 x 22: a ring of sand 2 wide around grey rock. East of it, a bridge (4 long) leads to the
   family middle (8 x 8), which opens when the child's first home is complete.

   What falls (ported from tryout.html and kept as Joel asked: "keep the wobbly walls and the real risk"):
     FIRE  hay burns. Everything stacked on top of hay falls. Burning hay knocks out the block beside it on each side
           (pearls, treasure and furniture stand firm). Then the cave-in rule: a block stands if it sits on blocks all the way
           down to the ground, or is joined within 3 steps to one that does; whatever stood before the fire and has nothing
           to hold it afterwards comes down too.
     STORM whatever is not joined, block to block, to the rock washes away (blocks that only stand on sand).
   Treasure stones (giving) never burn, never fall and never wash away, and they hold up what is built on them.
   Fallen blocks go to a fallen pile. They come back through "Put back" (a daily allowance), a pearl, or a rebuild pack. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.WorldRules = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var CONFIG = {
    plot: 28, sand: 2, maxY: 8,                       // 27 Nov 2026 (Joel): a wider plot (was 14 with 10 x 10 of rock)
    /* 27 Nov 2026 (Joel): the rock grows with gold, silver and gems, and the sand creeps in with wood, hay and stubble.
       The rock is a square round the middle of the plot, half-width start + rings. Every `per` points is one ring.
       A good block laid +1 (picked up -1). Wood, hay or stubble landing takes points away; putting it right gives them back. */
    rock: { start: 9, min: 5, max: 12, per: 120, spare: 12 },   // start 18 x 18 of rock; at least 10 x 10, at most 24 x 24; at the biggest rock only 12 points are kept spare, so 2 wood always bring the sand in
    burnPts: { wood: 12, hay: 8, stubble: 4, chaff: 4 },        // 1 Cor 3:12: bigger things are wood, unkind words hay, small grumbles stubble (js/quick.js)
    blocksPerAct: 4,                                  // each good act gives a small stack of this many blocks (as Build on the Rock v7)
    dailyCap: { G: 1, S: 2, gem: 6 },                 // acts a day; practice gold, prayers and goals are already limited by the app
    strawCapByAge: { 6: 2, 8: 3, 12: 3 },             // hay a day, from a grown-up's night check
    pearlsPerDayByAge: { 6: 2, 8: 3, 12: 3 },         // hay put right a day (matches the hay cap, as the old pulls did)
    fireNights: { 6: [2, 4, 6], 8: [1, 3, 5], 12: [0, 3] },   // weekday numbers, 0 = Sunday (same as Build on the Rock)
    firstFireDay: 4,                                  // a new child builds for 3 days before any fire
    stormEveryDays: 14,                               // storms are rare, and only after the rock-and-sand lesson
    caveSteps: 4,                                     // a block can reach this many steps sideways from a block that sits on the ground (27 Nov, round 1: 3 -> 4, and no block may be laid further out)
    /* round 1 (designer, 27 Nov 2026): keep the fire real once a home stands, with mercy */
    hayAtWall: { 6: 0.25, 8: 0.4, 12: 0.5 },          // while the home is whole, this share of hay lands on the ground against its outside wall
    maxFall: { 6: 8, 8: 20, 12: null },               // the most blocks that can fall in one fire (null = no limit). 28 Nov 2026 (Joel: "more of a risk"): was 6 / 10
    lossEvery: { 6: 4, 8: 2, 12: 2 },   // 27 Nov 2026 (Joel): keep some loss; words say "broke in the fall", never "burned"                 // 28 Nov 2026: of the blocks a fire or storm knocks down, every 4th (age 6) or every 2nd is lost for good ("he will suffer loss", 1 Cor 3:15); the rest can be put back
    practiceFirstFire: true,                          // a child's first fire burns hay but nothing falls
    homeMinCells: 4,                                  // a home needs at least 4 squares inside
    putBackPerDay: 12, bigPile: { over: 16, perDay: 20 },
    gems: ['l', 'j', 'p', 't', 'k', 'b', 'f', 'e', 'r'],
    recipes: [
      { id: 'D', cost: { any: 2 } },                  // door: any 2 pieces (silver first, then gems, then gold), so a plan can always get its door (round 2)
      { id: 'W', cost: { M: 1 } },                    // window
      { id: 'T', cost: { S: 2 } },                    // table
      { id: 'B', cost: { S: 2, M: 1 } },              // bed
      { id: 'L', cost: { G: 1 } },                    // lamp
      { id: 'V', cost: { Y: 2 } }                     // a stained-glass window, from 2 fruit stones (27 Nov 2026, Joel)
    ],
    /* the focus habit (27 Nov 2026, Joel: "a specific thing that they're working on, like being obedient, saying yes each time, coming
       immediately, working on self-control ... a whole day where they nail it, then they'll receive something special ... a whole
       week, then they have something extra special"). A grown-up says "nailed it" at night. Each nailed day: a fruit stone in the
       habit's colour. Every 7 nailed days (slips never reset the count): a big feature for the island. */
    focus: [
      { id: 'obey', f: 'p', feature: 'bell' },        // obeying: say yes, and come straight away
      { id: 'self', f: 'r', feature: 'fountain' },    // self-control
      { id: 'kind', f: 'k', feature: 'tree' },        // kind words
      { id: 'listen', f: 't', feature: 'bell' },      // listening the first time
      { id: 'thanks', f: 'j', feature: 'tree' }       // a thankful heart
    ],
    steps: ['wall', 'room', 'door', 'roof', 'home', 'window', 'furn'],
    /* 27 Nov 2026 (Joel): plans for cool houses; the outline shows on the plot. Joel chose (27 Nov): silver and gems only, gold is kept for building */
    plans: [
      { id: 'cottage', name: 'Cottage', icon: '🏡', cost: { S: 4 } },
      { id: 'tower', name: 'Tower', icon: '🗼', cost: { S: 6, M: 2 } },
      { id: 'barn', name: 'Sheepfold', icon: '🐑', cost: { S: 8 } },   // not 'Big barn' (Luke 12:18), round 2 heart
      { id: 'lighthouse', name: 'Lighthouse', icon: '🏮', cost: { S: 4, M: 4 } },
      { id: 'chapel', name: 'Chapel', icon: '⛪', cost: { S: 8, M: 4 } },
      { id: 'castle', name: 'Castle', icon: '🏰', cost: { S: 14, M: 8 } }
    ]
  };
  var SOLID = { G: 1, S: 1, M: 1, H: 1, P: 1, X: 1, W: 1, D: 1, d: 1, Q: 1, Y: 1, V: 1 };   // Q: a silver brace left where a propped-up piece burned (28 Nov 2026)
  var CUBE = { G: 1, S: 1, M: 1, H: 1, P: 1, X: 1, Y: 1 };      // plain cubes (drawn merged)
  var FURN = { T: 1, B: 1, L: 1, C: 1, N: 1 };   // C: a treasure chest, N: a pile of gold coins (27 Nov 2026, Joel: "on occasion they could get the treasure chest or gold coins")
  var TRAY_KINDS = ['G', 'S', 'M', 'P', 'X', 'Y', 'D', 'W', 'V', 'T', 'B', 'L', 'C', 'N'];   // Y: fruit stone, V: stained-glass window (27 Nov 2026)
  var GOODPTS = { G: 1, S: 1, M: 1, X: 1, Y: 1 };
  var MATERIALS = ['wood', 'hay', 'stubble', 'chaff'];   // 27 Nov 2026 (Joel): chaff added, the dirtiest; it burns like the rest (the wind does not blow it away)
  var SIDES6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  var SIDES4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  function key(x, y, z) { return x + ',' + y + ',' + z; }
  function un(k) { var p = k.split(','); return [+p[0], +p[1], +p[2]]; }
  function ageBand(a) { a = +a || 8; return a <= 6 ? 6 : a <= 9 ? 8 : 12; }
  function emptyTray() { return { G: 0, S: 0, M: [], P: 0, X: 0, D: 0, W: 0, T: 0, B: 0, L: 0 }; }
  function newToday() { return { G: 0, S: 0, gem: 0, straw: 0, pearls: 0, putBack: 0, got: 0, laid: 0, gotK: {}, laidK: {}, fired: false, stormed: false }; }   // got/laid: blocks given and laid today (the morning minute uses only today's)

  function fresh(age, weekday) {
    return { v: 1, age: ageBand(age), day: 1, weekday: weekday == null ? 1 : weekday, b: {}, tray: emptyTray(), fallen: [],
      today: newToday(), fireOwed: false, miles: {}, unlocked: false, toldSand: 0, lastStorm: 0, homeBroken: false,
      mended: [], stickers: [], lastNight: null, rockPts: CONFIG.rock.per >> 1, plans: { owned: [], done: [], active: null } };
  }

  /* ---------- the ground ---------- */
  function rockHalf(s) {
    var rk = CONFIG.rock, ring = Math.floor((s.rockPts || 0) / rk.per);
    var waiting = s.owedJ && Object.keys(s.owedJ).length ? 1 : 0; if (!waiting) for (var k in s.b) if (s.b[k].t === 'H' && !s.b[k].so) { waiting = 1; break; }   // heart round 3: a burned piece with no sorry to Jesus still keeps the sand (the fire never does what sorry does)   // sand stays while wood, hay or stubble waits (round 3); saying sorry stops it (28 Nov 2026)
    return Math.max(rk.min, Math.min(rk.max, rk.start + ring) - waiting);
  }
  /* a good block taken back out (pick-up, swap) takes its point, but never drops the rock below the ring it is in (round 4) */
  function giveBack(s) { var per = CONFIG.rock.per, p = s.rockPts || 0; if (p - 1 >= Math.floor(p / per) * per) s.rockPts = p - 1; }
  function ringEvents(s, h0) { var h = rockHalf(s); return h === h0 ? [] : [{ kind: h > h0 ? 'rockGrew' : 'sandCame', half: h }]; }
  /* points for the rock: kept inside the range that can still change it, so a big store can't hide new wood */
  function bump(s, n) {
    var rk = CONFIG.rock, before = rockHalf(s);
    s.rockPts = Math.max((rk.min - rk.start) * rk.per, Math.min((rk.max - rk.start) * rk.per + rk.spare, (s.rockPts || 0) + n));
    var after = rockHalf(s); if (after === before) return [];
    var ev = [{ kind: after > before ? 'rockGrew' : 'sandCame', half: after }];
    if (after < before && !s.toldSand && Object.keys(s.b).some(function (k) { var p = un(k); return p[1] === 0 && ground(s, p[0], p[2], after) === 'sand'; })) { s.toldSand = s.day; ev.push({ kind: 'sandLesson' }); }
    return ev;
  }
  /* rock or sand. Pass h (the rock's half width) when calling in a loop: working it out looks at every block (round 4 speed) */
  function ground(s, x, z, h) {
    var P = CONFIG.plot, c = P >> 1;
    if (x >= 0 && x < P && z >= 0 && z < P) { if (h == null) h = rockHalf(s); return (x >= c - h && x < c + h && z >= c - h && z < c + h) ? 'rock' : 'sand'; }
    return offPlot(s, x, z);
  }
  /* is there ground here at all (plot, bridge, middle)? Fast: never looks at the blocks */
  function onPlot(s, x, z) { var P = CONFIG.plot; return x >= 0 && x < P && z >= 0 && z < P ? 'plot' : offPlot(s, x, z); }
  function offPlot(s, x, z) {
    var P = CONFIG.plot;
    var m = P >> 1;
    if (x >= P && x < P + 4 && (z === m - 1 || z === m)) return s.unlocked ? 'bridge' : null;
    if (x >= P + 4 && x < P + 12 && z >= m - 4 && z < m + 4) return s.unlocked ? 'mid' : 'locked';
    return null;
  }

  /* ---------- the tray ---------- */
  function count(s, kind) { var v = s.tray[kind]; return Array.isArray(v) ? v.length : (v || 0); }
  function trayTotal(s) { return TRAY_KINDS.reduce(function (n, k) { return n + count(s, k); }, 0); }
  function giveTray(s, kind, n, fruit) {
    if (kind === 'M') { for (var i = 0; i < n; i++) s.tray.M.push(fruit || 'l'); }
    else s.tray[kind] = (s.tray[kind] || 0) + n;
  }
  function takeTray(s, kind, fruit) {
    if (kind === 'M') { var i = fruit ? s.tray.M.indexOf(fruit) : 0; if (i < 0) i = 0; return s.tray.M.splice(i, 1)[0]; }
    s.tray[kind]--; return null;
  }

  /* ---------- placing and picking up ---------- */
  function canPlace(s, kind, x, y, z) {
    var g = ground(s, x, z);
    if (g === 'locked') return { ok: false, why: 'locked' };
    if (!g) return { ok: false, why: 'noGround' };
    if (y < 0 || y >= CONFIG.maxY) return { ok: false, why: 'tooHigh' };
    if (s.b[key(x, y, z)]) return { ok: false, why: 'taken' };
    if (TRAY_KINDS.indexOf(kind) < 0 || !(count(s, kind) > 0)) return { ok: false, why: 'none' };
    var below = y === 0 ? true : s.b[key(x, y - 1, z)];
    if ((FURN[kind] || kind === 'D') && !below) return { ok: false, why: 'needsBelow' };
    if (below && below !== true && FURN[below.t]) return { ok: false, why: 'nothingOnTop' };
    if (kind === 'D' && (y + 1 >= CONFIG.maxY || s.b[key(x, y + 1, z)])) return { ok: false, why: 'doorSpace' };
    if (y > 0) {   // a block has to touch something: the block below it or one beside it (no blocks hanging in the air)
      var touch = SIDES6.some(function (d) { var n = s.b[key(x + d[0], y + d[1], z + d[2])]; return n && !FURN[n.t]; });
      if (!touch) return { ok: false, why: 'floating' };
      var k0 = key(x, y, z); s.b[k0] = { t: kind }; var held = stands(s, function () { return true; })[k0] != null; delete s.b[k0];
      if (!held) return { ok: false, why: 'noPost' };
    }
    return { ok: true };
  }
  function place(s, kind, x, y, z, opt) {
    var c = canPlace(s, kind, x, y, z); if (!c.ok) return { ok: false, why: c.why, events: [] };
    var events = [], k = key(x, y, z), blk = { t: kind, d: s.day };
    var fruit = takeTray(s, kind, opt && opt.fruit);
    if (kind === 'M') blk.f = fruit || 'l';
    if (kind === 'Y') blk.f = (s.focus && focusOf(s.focus.id) || { f: 'f' }).f;   // a fruit stone glows in its habit's colour
    if (y === 0 && ground(s, x, z) === 'rock') blk.r = 1;   // laid on the rock: it stays on the rock even if sand drifts over later (round 4)
    s.b[k] = blk; var grow = GOODPTS[kind] ? bump(s, 1) : []; s.today.laid = (s.today.laid || 0) + 1; var lk = s.today.laidK || (s.today.laidK = {}); lk[kind] = (lk[kind] || 0) + 1;
    if (kind === 'D') s.b[key(x, y + 1, z)] = { t: 'd', d: s.day };
    if (ground(s, x, z) === 'sand' && !s.toldSand) { s.toldSand = s.day; events.push({ kind: 'sandLesson' }); }
    return { ok: true, key: k, events: events.concat(grow, checkMiles(s)) };
  }
  function pickUp(s, k) {
    var b = s.b[k]; if (!b) return { ok: false, why: 'empty', events: [] };
    var p = un(k);
    if (b.t === 'd') { k = key(p[0], p[1] - 1, p[2]); b = s.b[k]; p = un(k); }
    if (!b) return { ok: false, why: 'empty', events: [] };
    if (b.t === 'H') return { ok: false, why: 'hay', events: [] };
    if (b.t === 'P') return { ok: false, why: 'pearl', events: [] };
    if (b.t === 'Q') return { ok: false, why: 'brace', events: [] };
    if (!canLift(s, k)) return { ok: false, why: 'holding', events: [] };
    var lean = fallSets(s).fire; if (lean[k]) return { ok: false, why: 'leaning', events: [] };
    giveTray(s, b.t, 1, b.f);
    removeAt(s, k);
    if (GOODPTS[b.t]) giveBack(s);   // a pick-up never shrinks the rock (round 3)
    return { ok: true, events: checkMiles(s) };
  }
  /* a door or window goes INTO a wall: the wall blocks it replaces come back to the tray (a door takes two, one above the other) */
  var SWAPPABLE = { G: 1, S: 1, M: 1, X: 1, P: 1 };   // a pearl can make way for a door or window (it goes back to the tray)
  function swapIn(s, kind, x, y, z) {
    if ((kind !== 'D' && kind !== 'W' && kind !== 'V') || !(count(s, kind) > 0)) return { ok: false, why: 'none', events: [] };
    if (kind === 'D') while (y > 0 && s.b[key(x, y - 1, z)] && SWAPPABLE[s.b[key(x, y - 1, z)].t]) y--;   // a door always goes to the foot of the wall (round 2)
    var k0 = key(x, y, z), k1 = key(x, y + 1, z), a = s.b[k0], b = s.b[k1];
    if (!a || !SWAPPABLE[a.t]) return { ok: false, why: a && (a.t === 'H' || a.t === 'P') ? a.t === 'H' ? 'hay' : 'pearl' : 'notWall', events: [] };
    if (kind === 'D') {
      if (y > 0 && !s.b[key(x, y - 1, z)]) return { ok: false, why: 'needsBelow', events: [] };
      if (y + 1 >= CONFIG.maxY) return { ok: false, why: 'doorSpace', events: [] };
      if (b && !SWAPPABLE[b.t]) return { ok: false, why: 'doorSpace', events: [] };
    }
    var ev = [], back = [a].concat(kind === 'D' && b ? [b] : []);
    back.forEach(function (q) { giveTray(s, q.t, 1, q.f); if (GOODPTS[q.t]) giveBack(s); });
    takeTray(s, kind);
    s.b[k0] = { t: kind, d: s.day }; if (a.r) s.b[k0].r = 1;
    if (kind === 'D') s.b[k1] = { t: 'd', d: s.day };
    s.today.laid = (s.today.laid || 0) + 1;
    return { ok: true, key: k0, back: back.length, events: ev.concat(checkMiles(s)) };
  }
  /* ---------- plans ----------
     Each plan is a list of cells relative to its front-left corner: [x, y, z, kind] where kind is 'D' for the door's
     bottom, 'd' for its top, or 0 for any good block. Width runs along x, depth along z (z 0 is the front, with the door). */
  function planCells(id) {
    var out = [], seen = {};
    function c(x, y, z, k) { var q = x + ',' + y + ',' + z; if (seen[q] != null) { if (k) out[seen[q]][3] = k; return; } seen[q] = out.length; out.push([x, y, z, k || 0]); }
    function walls(w, d, h, doorX) { for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) for (var z = 0; z < d; z++) if (x === 0 || z === 0 || x === w - 1 || z === d - 1) c(x, y, z, x === doorX && z === 0 && y < 2 ? (y === 0 ? 'D' : 'd') : 0); }
    function slab(x0, z0, x1, z1, y) { for (var x = x0; x <= x1; x++) for (var z = z0; z <= z1; z++) c(x, y, z); }
    if (id === 'cottage') { walls(6, 6, 2, 2); slab(0, 0, 5, 5, 2); }
    else if (id === 'tower') { walls(4, 4, 6, 1); slab(0, 0, 3, 3, 6); [[0, 0], [3, 0], [0, 3], [3, 3], [1, 0], [3, 2]].forEach(function (p) { c(p[0], 7, p[1]); }); }
    else if (id === 'barn') { walls(8, 6, 3, 3); slab(0, 0, 7, 5, 3); slab(0, 1, 7, 4, 4); slab(0, 2, 7, 3, 5); }
    else if (id === 'lighthouse') { walls(5, 5, 6, 2); slab(0, 0, 4, 4, 6); slab(1, 1, 3, 3, 7); }
    else if (id === 'chapel') { walls(6, 9, 3, 2); slab(0, 0, 5, 8, 3); slab(1, 0, 4, 8, 4); slab(2, 0, 3, 8, 5); slab(2, 0, 3, 1, 6); slab(2, 0, 3, 1, 7); }
    else if (id === 'castle') { walls(10, 10, 3, 4);
      [[0, 0], [8, 0], [0, 8], [8, 8]].forEach(function (t) { for (var y = 0; y < 5; y++) for (var x = 0; x < 2; x++) for (var z = 0; z < 2; z++) c(t[0] + x, y, t[1] + z); });
      for (var i = 2; i < 8; i += 2) { c(i, 3, 0); c(i, 3, 9); c(0, 3, i); c(9, 3, i); } }
    return out;
  }
  function planOf(id) { return CONFIG.plans.filter(function (p) { return p.id === id; })[0] || null; }
  function plansOf(s) { return s.plans || (s.plans = { owned: [], done: [], active: null }); }
  function canBuyPlan(s, id) { var p = planOf(id); if (!p) return false; return plansOf(s).owned.indexOf(id) < 0 && Object.keys(p.cost).every(function (k) { return count(s, k) >= p.cost[k]; }); }
  function buyPlan(s, id) {
    var p = planOf(id); if (!p) return { ok: false, why: 'noPlan' };
    if (plansOf(s).owned.indexOf(id) >= 0) return { ok: false, why: 'owned' };
    if (!canBuyPlan(s, id)) return { ok: false, why: 'cost' };
    Object.keys(p.cost).forEach(function (k) { for (var i = 0; i < p.cost[k]; i++) takeTray(s, k); });
    s.plans.owned.push(id); return { ok: true };
  }
  /* put an owned plan on the plot with its front-left corner at x0, z0. It must fit on the plot. */
  function usePlan(s, id, x0, z0) {
    if (plansOf(s).owned.indexOf(id) < 0) return { ok: false, why: 'notOwned' };
    var cells = planCells(id), ok = cells.every(function (q) { var g = onPlot(s, x0 + q[0], z0 + q[2]); return g && g !== 'locked'; });
    if (!ok) return { ok: false, why: 'noFit' };
    s.plans.active = { id: id, x0: x0, z0: z0 }; (s.plans.spots || (s.plans.spots = {}))[id] = { x0: x0, z0: z0 }; return { ok: true };
  }
  function clearPlan(s) { plansOf(s).active = null; return { ok: true }; }
  /* how far the active plan has got: a cell is filled by any good block (or the door, for the door's cells) */
  function planStatus(s) {
    var a = plansOf(s).active; if (!a) return null;
    if (!planOf(a.id)) { s.plans.active = null; return null; }   // a plan this version doesn't know
    var cells = planCells(a.id), missing = [], filled = 0;
    cells.forEach(function (q) {
      var k = key(a.x0 + q[0], q[1], a.z0 + q[2]), b = s.b[k];
      var ok = q[3] ? b && (b.t === q[3]) : b && SOLID[b.t];   // a weak piece fills its square (it may burn later); the outline never asks for a square that is taken
      if (ok) filled++; else missing.push({ key: k, door: q[3] || null });
    });
    return { id: a.id, name: planOf(a.id).name, total: cells.length, filled: filled, missing: missing, done: !missing.length };
  }
  /* the best spot for a plan near (x, z): fits on the plot, as much on rock and as little in the way of blocks as possible */
  function planSpot(s, id, x, z, avoid) {
    var cells = planCells(id), w = 0, d = 0; cells.forEach(function (q) { w = Math.max(w, q[0] + 1); d = Math.max(d, q[2] + 1); });
    var was = plansOf(s).spots && s.plans.done.indexOf(id) < 0 && s.plans.spots[id];   // a plan put away comes back where it was (not a finished one)
    if (was && cells.every(function (q) { var g = onPlot(s, was.x0 + q[0], was.z0 + q[2]), o = q[3] && s.b[key(was.x0 + q[0], q[1], was.z0 + q[2])]; return g && g !== 'locked' && !(o && o.t !== q[3]); })) return { x0: was.x0, z0: was.z0, cost: 0 };
    var best = null, rh = rockHalf(s);
    for (var x0 = 0; x0 <= CONFIG.plot - w; x0++) for (var z0 = 0; z0 <= CONFIG.plot - d; z0++) {
      var sand = 0, blocked = 0;
      var doorTaken = cells.some(function (q) { return q[3] && s.b[key(x0 + q[0], q[1], z0 + q[2])]; });   // never put the door where something already is
      if (doorTaken) continue;
      cells.forEach(function (q) { if (q[1] > 0) return; var gx = x0 + q[0], gz = z0 + q[2]; if (ground(s, gx, gz, rh) !== 'rock') sand++; if (s.b[key(gx, 0, gz)]) blocked++; });
      var inFoot = avoid && avoid[0] >= x0 - 1 && avoid[0] <= x0 + w && avoid[1] >= z0 - 1 && avoid[1] <= z0 + d;   // not on top of the builder
      var cost = blocked * 5 + sand * 3 + (inFoot ? 50 : 0) + (Math.abs(x0 + w / 2 - x) + Math.abs(z0 + d / 2 - z)) * 0.3;
      if (!best || cost < best.cost) best = { x0: x0, z0: z0, cost: cost };
    }
    return best;
  }
  /* a block can be picked up only if nothing would be left hanging: nothing sits on top of it, and every block beside it
     still touches something else (the same "no blocks in the air" rule as placing) */
  function canLift(s, k) {
    var p = un(k), b = s.b[k], cells = [k];
    if (b.t === 'D') cells.push(key(p[0], p[1] + 1, p[2]));
    var gone = {}; cells.forEach(function (c) { gone[c] = 1; });
    var top = un(cells[cells.length - 1]); if (s.b[key(top[0], top[1] + 1, top[2])]) return false;
    var before = stands(s, function () { return true; }), after = stands(s, function (q) { return !gone[q]; });
    if (Object.keys(s.b).some(function (q) { return !gone[q] && before[q] != null && after[q] == null; })) return false;   // something would be left without a post
    var ok = true;
    cells.forEach(function (c) {
      neighbours6(s, c, function (n) {
        if (gone[n] || !ok) return; var q = un(n);
        if (q[1] === 0 && onPlot(s, q[0], q[2])) return;
        var touch = SIDES6.some(function (d) { var m = key(q[0] + d[0], q[1] + d[1], q[2] + d[2]), o = s.b[m]; return o && !gone[m] && !FURN[o.t]; });
        if (!touch) ok = false;
      });
    });
    return ok;
  }
  function removeAt(s, k) {
    var b = s.b[k]; if (!b) return; var p = un(k); delete s.b[k];
    if (b.t === 'D') delete s.b[key(p[0], p[1] + 1, p[2])];
    if (b.t === 'd') delete s.b[key(p[0], p[1] - 1, p[2])];
  }

  /* ---------- making things ---------- */
  function canMake(s, id) {
    var r = CONFIG.recipes.filter(function (q) { return q.id === id; })[0]; if (!r) return false;
    return Object.keys(r.cost).every(function (k) { return k === 'any' ? count(s, 'S') + count(s, 'M') + count(s, 'G') >= r.cost[k] : count(s, k) >= r.cost[k]; });
  }
  function make(s, id) {
    if (!canMake(s, id)) return { ok: false, why: 'cost' };
    var r = CONFIG.recipes.filter(function (q) { return q.id === id; })[0];
    Object.keys(r.cost).forEach(function (k) { for (var i = 0; i < r.cost[k]; i++) takeTray(s, k === 'any' ? ['S', 'M', 'G'].filter(function (q) { return count(s, q) > 0; })[0] : k); });
    giveTray(s, id, 1);
    return { ok: true };
  }

  /* ---------- pieces from real life ----------
     item (from the app's inbox): { kind: 'gold'|'silver'|'gem'|'straw'|'treasure'|'rebuild'|'night', fruit?, practice?, from?, n?, label? }
     Good acts give blocksPerAct blocks within the daily caps. Straw lands as hay on its own (rng needed). */
  function addItem(s, it, rng) {
    var r = addItem0(s, it, rng);
    if (r.ok && r.gave) Object.keys(r.gave).forEach(function (k) { s.today.got = (s.today.got || 0) + r.gave[k]; var g = s.today.gotK || (s.today.gotK = {}); g[k] = (g[k] || 0) + r.gave[k]; });
    if (r.ok && r.moved) s.today.got = (s.today.got || 0) + r.moved;
    return r;
  }
  function todayLeft(s) { return Math.max(0, (s.today.got || 0) - (s.today.laid || 0)); }
  function todayLeftKind(s, k) { var g = (s.today.gotK || {})[k] || 0, l = (s.today.laidK || {})[k] || 0; return Math.max(0, Math.min(g - l, count(s, k), todayLeft(s))); }
  function addItem0(s, it, rng) {
    var kind = it && it.kind, n = CONFIG.blocksPerAct, cap = CONFIG.dailyCap, t = s.today;
    var free = !!(it && (it.practice || it.from === 'prayer' || it.from === 'goal'));
    if (kind === 'gold') { if (!free && t.G >= cap.G) return { ok: false, why: 'cap' }; if (!free) t.G++; giveTray(s, 'G', n); return { ok: true, gave: { G: n } }; }
    if (kind === 'silver') { if (t.S >= cap.S) return { ok: false, why: 'cap' }; t.S++; giveTray(s, 'S', n); return { ok: true, gave: { S: n } }; }
    if (kind === 'gem') {
      if (!free && t.gem >= cap.gem) return { ok: false, why: 'cap' }; if (!free) t.gem++;
      var f = CONFIG.gems.indexOf(it.fruit) >= 0 ? it.fruit : 'l'; giveTray(s, 'M', n, f); return { ok: true, gave: { M: n }, fruit: f };
    }
    if (kind === 'straw') {
      if (t.straw >= CONFIG.strawCapByAge[s.age]) return { ok: false, why: 'cap' };
      t.straw++; var mat = MATERIALS.indexOf(it.material) >= 0 ? it.material : 'hay', h0 = rockHalf(s);
      var keys = landHay(s, 1, rng || function () { return 0.5; }, mat), area = it.moment || 'other';
      keys.forEach(function (k) { s.b[k].mo = area; });
      var lg = s.log || (s.log = {}), ld = lg[s.day] || (lg[s.day] = {}); ld[area] = (ld[area] || 0) + 1;
      var be = keys.length ? bump(s, -CONFIG.burnPts[mat]) : [];
      var re = ringEvents(s, h0); if (be.some(function (e) { return e.kind === 'sandLesson'; })) re.push({ kind: 'sandLesson' });
      if (re.length && re[0].kind === 'sandCame' && !s.toldSand && Object.keys(s.b).some(function (k) { var p = un(k); return p[1] === 0 && ground(s, p[0], p[2]) === 'sand'; })) { s.toldSand = s.day; re.push({ kind: 'sandLesson' }); }
      return { ok: true, hay: keys, material: mat, events: re.concat(checkMiles(s)) };
    }
    if (kind === 'treasure') { var v = Math.max(1, Math.min(4, +it.n || 1)); giveTray(s, 'X', v); s.gives = (s.gives || 0) + 1;
      var tg = { X: v }, tev = []; if (s.gives % 3 === 0) { giveTray(s, 'N', 1); tg.N = 1; tev.push({ kind: 'coins' }); }   // every 3rd time of giving: a pile of gold coins
      return { ok: true, gave: tg, events: tev }; }
    if (kind === 'rebuild') { var m = fromFallen(s, Math.max(1, +it.n || 12)); return { ok: m > 0, moved: m }; }
    return { ok: false, why: 'ignored' };
  }

  /* hay lands by itself on top of the walls still going up (the lowest first), so what is built next rests on it.
     With nothing built yet it lands on the bare rock. Never in the family middle, never on a door, window or furniture. */
  function openSky(s, x, z) { for (var y = 0; y < CONFIG.maxY; y++) if (s.b[key(x, y, z)]) return false; return true; }
  function landHay(s, n, rng, mat) {
    var out = [], P = CONFIG.plot, maxY = CONFIG.maxY;
    for (var i = 0; i < n; i++) {
      var cols = {};
      Object.keys(s.b).forEach(function (k) {
        var p = un(k), b = s.b[k]; if (!SOLID[b.t] || p[0] >= P) return; var c = p[0] + ',' + p[2];
        if (!cols[c] || p[1] > cols[c].y) cols[c] = { x: p[0], y: p[1], z: p[2], d: b.d, t: b.t };
      });
      var list = Object.keys(cols).map(function (c) { return cols[c]; }).filter(function (c) {
        return c.y + 1 < maxY - 1 && c.t !== 'd' && c.t !== 'D' && c.t !== 'W' && c.t !== 'X' && !s.b[key(c.x, c.y + 1, c.z)];
      });
      list.sort(function (a, b) { return (a.y - b.y) || (b.d - a.d) || (a.x - b.x) || (a.z - b.z); });
      list = list.slice(0, 6);
      var x, y, z, h = house(s), wallSpots = [];
      if (h.room && h.room.home && rng() < (CONFIG.hayAtWall[s.age] || 0)) {
        var inside = {}; h.room.cells.forEach(function (c) { inside[c[0] + ',' + c[1]] = 1; });
        for (var wx = 0; wx < P; wx++) for (var wz = 0; wz < P; wz++) {
          if (!isWall(s, wx, wz)) continue;
          SIDES4.forEach(function (d) { var ax = wx + d[0], az = wz + d[1];
            if (inside[ax + ',' + az] || !onPlot(s, ax, az) || onPlot(s, ax, az) === 'locked' || !openSky(s, ax, az)) return;
            if (wallSpots.every(function (q) { return q[0] !== ax || q[1] !== az; })) wallSpots.push([ax, az]); });
        }
      }
      if (wallSpots.length) { var ws = wallSpots[Math.floor(rng() * wallSpots.length) % wallSpots.length]; x = ws[0]; y = 0; z = ws[1]; }
      else if (list.length) { var c = list[Math.floor(rng() * list.length) % list.length]; x = c.x; y = c.y + 1; z = c.z; }
      else {
        var spots = [];
        var rh = rockHalf(s); for (var xx = 0; xx < P; xx++) for (var zz = 0; zz < P; zz++) if (ground(s, xx, zz, rh) === 'rock' && openSky(s, xx, zz)) spots.push([xx, zz]);
        if (!spots.length) continue;
        var sp = spots[Math.floor(rng() * spots.length) % spots.length]; x = sp[0]; y = 0; z = sp[1];
      }
      s.b[key(x, y, z)] = { t: 'H', d: s.day, m: mat || 'hay' }; out.push(key(x, y, z));
    }
    return out;
  }

  /* ---------- sorry, and how the next day goes (28 Nov 2026, Joel: "they could say sorry ... if they continue to be that same
     level of disobedient the following day, then they're in danger. But if it's less, then they can start to prop that up").
     Each piece remembers its area (the hard moment it came from). Once the day after it landed is over, every piece of that
     area is judged on the last two whole days: as many or more yesterday than the day before = 'danger'; fewer = 'better'.
     Danger pieces burn first in the fire, past the age's limit. Sorry stops the sand and the cracks; sorry plus 'better'
     lets the child prop the piece up with a silver brace (1 silver): when it burns, the brace stays and nothing falls.
     Made right (a grown-up's yes) still turns it into a pearl. Forgiveness never depends on the trend: only the building does. */
  function areaCount(s, day, a) { var l = (s.log || {})[day]; return (l && l[a]) || 0; }
  function weakState(s, k) {
    var b = s.b[k]; if (!b || b.t !== 'H') return null; if (b.pf != null) return 'platform';
    if ((b.d || 0) >= s.day - 1) return 'new';   // heart round 2: a block the mould spread to gets a grace day too
    var a = b.mo || 'other', y = areaCount(s, s.day - 1, a), p = areaCount(s, s.day - 2, a);
    return y > 0 && y >= p ? 'danger' : 'better';
  }
  function crackLevel(s, k) {
    var b = s.b[k]; if (!b || b.t !== 'H') return 0; if (weakState(s, k) === 'danger') return 3;
    return Math.max(1, Math.min(3, (b.so || s.day) - (b.d || s.day) + 1));
  }
  /* 28 Nov 2026 (Joel): two sorries. Sorry to Jesus (1 John 1:9): the flies go, the cloud lifts, the sand and the cracks stop,
     and the mould stops spreading. Sorry to the person (Matthew 5:23-24): the mould washes off. Both are needed to prop it up. */
  function sorry(s, k, who) {
    var b = s.b[k]; if (!b || b.t !== 'H') return { ok: false, why: 'notHay' };
    var f = who === 'them' ? 'sp' : 'so'; if (b[f]) return { ok: false, why: 'already' };
    var h0 = rockHalf(s); b[f] = s.day;
    return { ok: true, events: ringEvents(s, h0) };
  }
  /* the same for every waiting piece from one hard moment (the heart list works by moment, not by block) */
  function sorryArea(s, area, who) {
    var h0 = rockHalf(s), n = 0, f = who === 'them' ? 'sp' : 'so';
    Object.keys(s.b).forEach(function (k) { var b = s.b[k]; if (b.t === 'H' && (b.mo || 'other') === area && !b[f]) { b[f] = s.day; n++; } });
    if (who === 'them' && s.owed && s.owed[area]) { delete s.owed[area]; n++; }
    if (who === 'jesus' && s.owedJ && s.owedJ[area]) { delete s.owedJ[area]; n++; }   // the piece burned, but the sorry is still worth saying
    return { ok: n > 0, n: n, why: n ? null : 'already', events: ringEvents(s, h0) };
  }
  /* the heart list: one row per hard moment that still has pieces waiting */
  var RANK = { danger: 3, 'new': 2, better: 1, platform: 1, owed: 0 };
  function heartList(s) {
    var rows = {};
    Object.keys(s.b).forEach(function (k) {
      var b = s.b[k]; if (b.t !== 'H') return; var a = b.mo || 'other', w = weakState(s, k);
      var ps = w === 'platform' ? platformState(s, k) : null, rk = a + '~' + w + '~' + (b.so ? 1 : 0) + (b.sp ? 1 : 0) + (ps ? '~' + ps : '');   // heart round 2: one row per hard moment AND state, so ticks and the Prop button never hide   // heart round 1: pieces that are getting better keep their own row (and their Prop button) when new ones land
      var r = rows[rk] || (rows[rk] = { area: a, keys: [], jesus: true, them: true, state: w, propped: 0, spread: 0, mat: b.m || 'hay' });
      if (ps) { r.pst = ps; r.pl = b.pl; } if (!b.rp) r.rpAll = false; else if (r.rpAll == null) r.rpAll = true;
      r.keys.push(k); if (!b.so) r.jesus = false; if (!b.sp) r.them = false; if (b.pr) r.propped++; if (b.inf) r.spread++;
      if (RANK[w] > RANK[r.state]) r.state = w;
    });
    Object.keys(s.owed || {}).concat(Object.keys(s.owedJ || {}), Object.keys(s.owedR || {}).filter(function (a) { return rightOpen(s, a); })).forEach(function (a) { if (rows[a + '~o']) return;
      rows[a + '~o'] = { area: a, keys: [], jesus: !(s.owedJ && s.owedJ[a]), them: !(s.owed && s.owed[a]), right: rightOpen(s, a), state: 'owed', propped: 0, spread: 0, mat: 'hay', owed: 1 }; });
    return Object.keys(rows).map(function (a) { return rows[a]; }).sort(function (x, y) { return RANK[y.state] - RANK[x.state] || (x.area < y.area ? -1 : 1); });
  }
  /* mould spreads (Hebrews 12:15, "a bitter root ... defiles many"): at the end of a day, every piece that has waited a whole day
     with no sorry to Jesus turns one good block touching it (gold, silver or a gem) into the same weak stuff. Pieces that were
     spread to do not spread again. Pearls and treasure never take it. */
  var CATCH = { G: 1, S: 1, M: 1 };
  /* 27 Nov 2026 (heart round 1): gentler at age 6 (a piece waits two whole days before it spreads), and a warning the day it will
     spread (mouldSoon), the same grace as the smoked-twice warning */
  function mouldReady(s, b) { return b && b.t === 'H' && !b.so && !b.inf && (b.d || 0) < s.day - (s.age === 6 ? 1 : 0); }
  var NEAR6 = [[0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]];
  function mouldSoon(s) {
    return Object.keys(s.b).filter(function (k) {
      if (!mouldReady(s, s.b[k])) return false; var p = un(k);
      return NEAR6.some(function (d) { var o = s.b[key(p[0] + d[0], p[1] + d[1], p[2] + d[2])]; return o && CATCH[o.t]; });
    });
  }
  function spreadMould(s) {
    var out = [];
    Object.keys(s.b).sort().forEach(function (k) {
      var b = s.b[k]; if (!mouldReady(s, b)) return;
      var p = un(k), best = null;
      [[0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1], [0, 1, 0]].forEach(function (d) {
        if (best) return; var n = key(p[0] + d[0], p[1] + d[1], p[2] + d[2]), o = s.b[n]; if (o && CATCH[o.t]) best = n;
      });
      if (!best) return; var o = s.b[best];
      s.b[best] = { t: 'H', m: b.m || 'hay', mo: b.mo || 'other', d: s.day, inf: o.t === 'M' ? { t: 'M', f: o.f } : { t: o.t } };
      if (o.r) s.b[best].r = 1; out.push(best);
    });
    if (out.length) s.lastSpread = { day: s.day + 1, keys: out };
    return out;
  }
  function canProp(s, k) {
    var b = s.b[k]; if (!b || b.t !== 'H') return 'notHay'; if (b.pr) return 'already'; if (!b.so || !b.sp) return 'sorryFirst';
    var w = weakState(s, k); if (w !== 'better') return w === 'new' ? 'wait' : 'danger';
    if (count(s, 'S') < 1) return 'noSilver';
    return null;
  }
  function prop(s, k) { var why = canProp(s, k); if (why) return { ok: false, why: why }; takeTray(s, 'S'); s.b[k].pr = 1; return { ok: true }; }
  /* prop up every piece of one hard moment that can be, while the silver lasts */
  function propArea(s, area) {
    var n = 0, why = null;
    Object.keys(s.b).forEach(function (k) { var b = s.b[k]; if (b.t !== 'H' || (b.mo || 'other') !== area || b.pr) return; var r = prop(s, k); if (r.ok) n++; else if (!why) why = r.why; });
    return { ok: n > 0, n: n, why: n ? null : why || 'already' };
  }
  /* made right (a grown-up's yes) for every piece of one hard moment, within the day's pearls */
  /* a burned hard moment made right (a grown-up's yes, after sorry to Jesus): the piece is gone, so a pearl comes to build with.
     Open for 3 days after the fire, within the day's pearls. */
  function rightOpen(s, a) { return !!(s.owedR && s.owedR[a] != null && s.day - s.owedR[a] <= 3); }
  function rightOwed(s, area) {
    if (!rightOpen(s, area)) return { ok: false, why: 'none' };
    if (s.owedJ && s.owedJ[area]) return { ok: false, why: 'sorryFirst' };
    if (s.today.pearls >= CONFIG.pearlsPerDayByAge[s.age]) return { ok: false, why: 'cap' };
    s.tray.P = (s.tray.P || 0) + 1; s.today.pearls++; delete s.owedR[area]; if (s.owed) delete s.owed[area];
    return { ok: true };
  }
  /* ---------- repentance: sorry, a plan, then change (27 Nov 2026, Joel: "repentance is saying sorry, but then it's also changing
     from their ways ... it's replaced with a temporary platform, but that won't hold for long. The only way that can be adjusted is
     if it's refilled and they show that they are actually doing less of the thing that they repented of"; "the pearl represents
     fruits of repentance", Matthew 3:8).
     After both sorries the child picks a plan ("When ..., I will ..."; one plan a day, the research says one works best). The weak
     pieces of that moment come out and a temporary platform (pf = the plan day) holds the wall. It gives way at the next fire.
     The day after the plan decides: did that hard moment happen less than before? Then the platform can be filled in for good,
     best with a pearl from "made right". The same again: try the plan again (it still gives way at the fire if not filled). */
  function planMake(s, area, pick) {
    if (s.today.plan) return { ok: false, why: 'oneToday' };
    var ks = Object.keys(s.b).filter(function (k) { var b = s.b[k]; return b.t === 'H' && (b.mo || 'other') === area && (b.pf == null || b.res === 'again'); });
    if (!ks.length) return { ok: false, why: 'none' };
    var ready = ks.filter(function (k) { return s.b[k].so && s.b[k].sp; });   // heart round 7: a new piece still waiting for sorry never blocks a plan for the ones that are ready
    if (!ready.length) return { ok: false, why: 'sorryFirst' }; ks = ready;
    var c0 = Math.max(1, areaCount(s, s.day, area), areaCount(s, s.day - 1, area));
    ks.forEach(function (k) { var b = s.b[k]; b.pf = s.day; b.pl = pick; b.c0 = c0; delete b.res; delete b.sm; });
    s.today.plan = area; s.plan = { area: area, pick: pick, day: s.day };
    return { ok: true, n: ks.length, events: ringEvents(s, rockHalf(s)) };
  }
  function held(b) { return b && b.t === 'H' && b.pf != null && b.res !== 'again'; }   // a platform that holds at the fire (waiting, or did less)
  function canPlan(s, area) { if (s.today.plan) return 'oneToday'; var ks = Object.keys(s.b).filter(function (k) { var b = s.b[k]; return b.t === 'H' && (b.mo || 'other') === area && (b.pf == null || b.res === 'again'); });
    if (!ks.length) return 'none'; return ks.some(function (k) { return s.b[k].so && s.b[k].sp; }) ? null : 'sorryFirst'; }
  function platformCheck(s) {   // at the end of the day after the plan: less, or the same again
    Object.keys(s.b).forEach(function (k) { var b = s.b[k]; if (b.t !== 'H' || b.pf == null || b.res || s.day !== b.pf + 1) return;
      b.res = areaCount(s, s.day, b.mo || 'other') < (b.c0 || 1) ? 'less' : 'again'; });
  }
  function platformState(s, k) { var b = s.b[k]; if (!b || b.t !== 'H' || b.pf == null) return null; return b.res || 'waiting'; }
  function canFill(s, k, kind) { var st = platformState(s, k); if (!st) return 'notPlatform'; if (st !== 'less') return st;
    if (!{ G: 1, S: 1, M: 1, P: 1 }[kind]) return 'kind'; if (!(count(s, kind) > 0)) return 'none'; return null; }
  function fillPlatform(s, k, kind) {
    var why = canFill(s, k, kind); if (why) return { ok: false, why: why, events: [] };
    var h0 = rockHalf(s), old = s.b[k], blk = { t: kind, d: s.day }, f = takeTray(s, kind); if (kind === 'M') blk.f = f || 'l'; if (old.r) blk.r = 1;
    s.b[k] = blk; var grow = GOODPTS[kind] ? bump(s, 1) : []; s.today.laid = (s.today.laid || 0) + 1;
    if (kind === 'P') { s.fruit = (s.fruit || 0) + 1; } s.filled = (s.filled || 0) + 1;
    return { ok: true, key: k, events: grow.concat(ringEvents(s, h0), checkMiles(s)) };
  }
  /* fill every platform of one moment that is ready, pearls first (the fruit of repentance), then the kind the child picked */
  function fillArea(s, area, kind) {
    var n = 0, ev = [], why = null, pearls = 0;
    Object.keys(s.b).forEach(function (k) { var b = s.b[k]; if (!b || b.t !== 'H' || (b.mo || 'other') !== area || platformState(s, k) !== 'less') return;
      var use = count(s, 'P') > 0 ? 'P' : kind, r = fillPlatform(s, k, use); if (r.ok) { n++; if (use === 'P') pearls++; ev = ev.concat(r.events); } else if (!why) why = r.why; });
    if (n) { s.stickers.push({ day: s.day, id: 'changed' }); ev.push({ kind: 'sticker', id: 'changed' }); }   // motivation round 7: a changed heart earns a sticker too, so no child needs a "clean" day to get one
    return { ok: n > 0, n: n, pearls: pearls, why: n ? null : why || 'none', events: ev };
  }
  /* made right (a grown-up's yes: it was put right with the person): a pearl, the fruit of repentance, one per piece, within the
     day's pearls. The piece stays where it is; the pearl fills the platform once the child is doing less. */
  function rightArea(s, area, only) {
    var n = 0, why = null, healed = 0;
    Object.keys(s.b).forEach(function (k) { var b = s.b[k]; if (b.t !== 'H' || (b.mo || 'other') !== area || b.rp || (only && only.indexOf(k) < 0)) return;
      if (!b.so || !b.sp) { why = why || 'sorryFirst'; return; }   // motivation round 5: both sorries before made right
      if (b.inf) { var nb = b.inf.t === 'M' ? { t: 'M', f: b.inf.f } : { t: b.inf.t }; nb.d = s.day; if (b.r) nb.r = 1; s.b[k] = nb; n++; healed++; return; }   // heart round 5: a spoiled block is made good again
      if (s.today.pearls >= CONFIG.pearlsPerDayByAge[s.age]) { why = why || 'cap'; return; }
      b.rp = 1; s.tray.P = (s.tray.P || 0) + 1; s.today.pearls++; n++; });
    return { ok: n > 0, n: n, healed: healed, why: n ? null : why || 'already' };
  }
  /* gem cuts the child unlocks as they grow (27 Nov 2026, Joel: "I actually love the sparkles, brilliant cut, inner fire, rainbow glint.
     Maybe they can unlock certain things as they progress"): a first home, a plan that worked, a first 7 nailed days */
  function cutsOpen(s) { var o = ['set']; if (s.miles && s.miles.home) o.push('bril'); if ((s.filled || 0) > 0 || (s.stickers || []).some(function (x) { return x.id === 'stood' || x.id === 'clean'; })) o.push('fire');   /* heart round 7: a home that stands through a fire opens it too (1 Cor 3:14) */ if ((s.features || []).length) o.push('rain'); return o; }
  function focusOf(id) { return CONFIG.focus.filter(function (f) { return f.id === id; })[0] || null; }
  function setFocus(s, id) { var f = focusOf(id); if (!f) return { ok: false, why: 'none' };
    if (s.focus && s.focus.id === id) return { ok: true, same: true };
    s.focus = { id: id, n: 0, since: s.day }; return { ok: true }; }
  function nailDay(s) {
    if (!s.focus) return { ok: false, why: 'noFocus', events: [] };
    if (s.today.nailed) return { ok: false, why: 'already', events: [] };
    var f = focusOf(s.focus.id); s.today.nailed = 1; s.focus.n++; s.tray.Y = (s.tray.Y || 0) + 1;
    var ev = [{ kind: 'nailed', n: s.focus.n }];
    if (s.focus.n % 7 === 0) { s.features = s.features || []; var ft = { id: f.feature, focus: f.id, day: s.day, n: s.features.length };
      s.features.push(ft); s.stickers.push({ day: s.day, id: 'week-' + f.id }); ev.push({ kind: 'weekFeature', id: f.feature, focus: f.id }); }
    return { ok: true, n: s.focus.n, events: ev };
  }
  function forgiveArea(s, area, only) {
    var n = 0, back = 0, ev = [], why = null;
    Object.keys(s.b).forEach(function (k) { var b = s.b[k]; if (b.t !== 'H' || (b.mo || 'other') !== area || (only && only.indexOf(k) < 0)) return; var r = forgive(s, k); if (r.ok) { n++; back += r.back || 0; ev = ev.concat(r.events); } else if (!why) why = r.why; });
    return { ok: n > 0, n: n, back: back, why: n ? null : why, events: ev };
  }
  /* a brace left by the fire can be filled with a good block again */
  function fillBrace(s, kind, k) {
    var b = s.b[k]; if (!b || b.t !== 'Q') return { ok: false, why: 'notBrace', events: [] };
    if (!{ G: 1, S: 1, M: 1, P: 1, X: 1 }[kind] || !(count(s, kind) > 0)) return { ok: false, why: 'none', events: [] };
    var blk = { t: kind, d: s.day }, f = takeTray(s, kind); if (kind === 'M') blk.f = f || 'l'; if (b.r) blk.r = 1;
    s.b[k] = blk; var grow = GOODPTS[kind] ? bump(s, 1) : []; s.today.laid = (s.today.laid || 0) + 1;
    return { ok: true, key: k, events: grow.concat(checkMiles(s)) };
  }

  /* hay put right: "Jesus is ready to forgive". The hay turns into a pearl in the same place (a pearl never burns).
     A few a day (as many as hay can come a day). If any blocks have fallen, one comes back with it. */
  function forgive(s, k) {
    var b = s.b[k]; if (!b || b.t !== 'H') return { ok: false, why: 'notHay' };
    if (s.today.pearls >= CONFIG.pearlsPerDayByAge[s.age]) return { ok: false, why: 'cap' };
    if (b.inf) { var h1 = rockHalf(s), was = b.inf; s.b[k] = { t: was.t, d: s.day }; if (was.f) s.b[k].f = was.f; if (b.r) s.b[k].r = 1; return { ok: true, back: 0, healed: true, events: ringEvents(s, h1).concat(checkMiles(s)) }; }   // the mould is washed out: it is gold (or a gem) again
    var h0 = rockHalf(s), mat = b.m || 'hay'; b.t = 'P'; delete b.m; delete b.sm; delete b.so; delete b.sp; delete b.pr; delete b.mo; s.today.pearls++;
    var back = fromFallen(s, 1); bump(s, CONFIG.burnPts[mat] || 8);
    return { ok: true, back: back, events: ringEvents(s, h0).concat(checkMiles(s)) };   // put right: its sand goes back
  }

  /* ---------- fallen blocks ---------- */
  function fromFallen(s, n) { var m = 0; while (m < n && s.fallen.length) { var p = s.fallen.shift(); giveTray(s, p.t, 1, p.f); m++; } return m; }
  function putBackLeft(s) {
    var per = s.fallen.length > CONFIG.bigPile.over ? CONFIG.bigPile.perDay : CONFIG.putBackPerDay;
    return Math.max(0, Math.min(s.fallen.length, per - s.today.putBack));
  }
  function putBack(s, n) {
    var m = fromFallen(s, Math.min(n == null ? 10 : n, putBackLeft(s)));
    s.today.putBack += m; return { ok: m > 0, moved: m };
  }

  /* ---------- what stands, what would fall ---------- */
  function neighbours6(s, k, fn) { var p = un(k); SIDES6.forEach(function (d) { var n = key(p[0] + d[0], p[1] + d[1], p[2] + d[2]); if (s.b[n]) fn(n); }); }
  /* distance (in steps) from a block that sits on the ground all the way down; only blocks within caveSteps are in the map */
  function stands(s, ok) {
    var dist = {}, q = [];
    var keys = Object.keys(s.b).filter(ok).sort(function (a, b) { return un(a)[1] - un(b)[1]; });
    keys.forEach(function (k) {
      var p = un(k), t = s.b[k].t;
      if (t === 'X' || (p[1] === 0 ? !!onPlot(s, p[0], p[2]) : dist[key(p[0], p[1] - 1, p[2])] === 0)) { dist[k] = 0; q.push(k); }
    });
    for (var d = 1; d <= CONFIG.caveSteps && q.length; d++) {
      var nq = [];
      q.forEach(function (k) { neighbours6(s, k, function (n) { if (ok(n) && dist[n] == null) { dist[n] = d; nq.push(n); } }); });
      q = nq;
    }
    return dist;
  }
  function pair(s, set) {
    Object.keys(set).forEach(function (k) {
      var b = s.b[k]; if (!b) return; var p = un(k);
      if (b.t === 'D') set[key(p[0], p[1] + 1, p[2])] = 1;
      if (b.t === 'd') set[key(p[0], p[1] - 1, p[2])] = 1;
    });
  }
  function fallSets(s, only) {
    var keys = Object.keys(s.b), fire = {}, storm = {}, direct;
    keys.forEach(function (k) {
      if (s.b[k].t !== 'H' || s.b[k].pr || (only && !only[k])) return; var p = un(k);   // a propped piece brings nothing down
      for (var yy = p[1] + 1; yy < CONFIG.maxY; yy++) {
        var kk = key(p[0], yy, p[2]), u = s.b[kk];
        if (!u || u.t === 'X') break;
        if (u.t !== 'H' || (only && !only[kk])) fire[kk] = 1;   // hay stacked on burning hay falls with it
      }
      SIDES4.forEach(function (d) {
        var kk = key(p[0] + d[0], p[1], p[2] + d[1]), n = s.b[kk];
        if (n && n.t !== 'H' && n.t !== 'P' && n.t !== 'X' && !FURN[n.t]) fire[kk] = 1;
      });
    });
    pair(s, fire); direct = JSON.parse(JSON.stringify(fire));
    var gone = function (k) { return (s.b[k].t === 'H' && !s.b[k].pr && (!only || only[k])) || !!fire[k]; };
    var before = stands(s, function () { return true; }), after = stands(s, function (k) { return !gone(k); });
    keys.forEach(function (k) { if (!gone(k) && s.b[k].t !== 'X' && before[k] != null && after[k] == null) fire[k] = 1; });
    pair(s, fire);
    /* storm: flood from the blocks on the rock (and treasure); whatever it can't reach stood only on sand */
    var seen = {}, q = [];
    var rh = rockHalf(s);
    keys.forEach(function (k) { var p = un(k), g = p[1] === 0 && ground(s, p[0], p[2], rh); if ((g && g !== 'sand') || (p[1] === 0 && s.b[k].r) || s.b[k].t === 'X') { seen[k] = 1; q.push(k); } });
    while (q.length) neighbours6(s, q.pop(), function (n) { if (!seen[n]) { seen[n] = 1; q.push(n); } });
    keys.forEach(function (k) { if (!seen[k] && s.b[k].t !== 'X') storm[k] = 1; });
    pair(s, storm);
    return { fire: fire, storm: storm, direct: direct };
  }

  /* ---------- nights ---------- */
  function isFireNight(s) { return s.day >= CONFIG.firstFireDay && CONFIG.fireNights[s.age].indexOf(s.weekday) >= 0; }
  function nightsToFire(s) {
    if (s.fireOwed || (isFireNight(s) && !s.today.fired)) return 0;
    for (var n = 1; n <= 14; n++) {
      var day = s.day + n, wd = (s.weekday + n) % 7;
      if (day >= CONFIG.firstFireDay && CONFIG.fireNights[s.age].indexOf(wd) >= 0) return n;
    }
    return null;
  }
  function stormDue(s) { return !!s.toldSand && s.day - Math.max(s.toldSand, s.lastStorm || 0) >= CONFIG.stormEveryDays; }
  function fireReady(s) { return !s.today.fired && (s.fireOwed || isFireNight(s)); }

  function fallInto(s, set, ev, info) {
    var fell = [], every = CONFIG.lossEvery[s.age] || 0; info = info || {}; info.lost = 0;
    Object.keys(set).forEach(function (k) {
      var b = s.b[k]; if (!b) return;
      if (b.t === 'H') { delete s.b[k]; return; }   // hay that falls (stacked on hay) burns like the rest
      if (b.t !== 'd' && b.t !== 'Q') {
        s.lossTick = (s.lossTick || 0) + 1;
        if (every && s.lossTick % every === 0) info.lost++;   // burned up for good
        else s.fallen.push(b.t === 'M' ? { t: 'M', f: b.f } : { t: b.t });
        fell.push(k); if (GOODPTS[b.t] && ev) ev.push.apply(ev, bump(s, -1));
      }
      delete s.b[k];
    });
    return fell;
  }
  /* the fire: hay burns, and what it held comes down. Returns the keys, so the page can show each one go. */
  /* the fire. Wood, hay and stubble burn one piece at a time (lowest first). A piece only burns if what it brings down stays
     inside the age's limit (maxFall), so nothing is ever left hanging: the rest only smoke and wait for another night.
     The first fire is practice (only pieces that bring nothing down burn). Straight after a fire that broke the home,
     no piece burns that would break it again (mercy). A piece that has smoked twice burns first, past the limit. */
  function fire(s) {
    var hadHome = homeNow(s), burned = [], events = [], h0 = rockHalf(s);
    var anyHay = Object.keys(s.b).some(function (k) { return s.b[k].t === 'H'; });
    if (anyHay) s.fires = (s.fires || 0) + 1;   // the practice fire only counts when there is something to burn (round 3)
    var practice = anyHay && CONFIG.practiceFirstFire && s.fires === 1, mercy = !!s.mercy && hadHome && !practice && s.age === 6;   // mercy for the youngest only (28 Nov 2026)
    var cap = practice ? 0 : CONFIG.maxFall[s.age];
    var old = function (k) { return (s.b[k].sm || 0) >= 2 || weakState(s, k) === 'danger' || (s.b[k].pf != null && s.b[k].res === 'again'); };   // heart round 6: a platform where the child did less holds until it is filled in   // heart round 5: a platform holds until its day has shown the change   // a platform not filled in gives way at the fire (27 Nov 2026, Joel)   // smoked twice, or in danger: it burns now, first and past the limit
    var hay = Object.keys(s.b).filter(function (k) { return s.b[k].t === 'H' && !(s.b[k].pf != null && s.b[k].res !== 'again'); }).sort(function (a, b) { return (old(b) ? 1 : 0) - (old(a) ? 1 : 0) || un(a)[1] - un(b)[1] || (a < b ? -1 : 1); });
    var count = function (f) { return Object.keys(f).filter(function (k) { return s.b[k] && s.b[k].t !== 'H' && s.b[k].t !== 'd'; }).length; };
    var homeAfter = function (set, f) { var keep = {}; Object.keys(s.b).forEach(function (k) { if (!(set[k] || f[k])) keep[k] = s.b[k]; }); return homeNow({ b: keep, unlocked: s.unlocked, rockPts: s.rockPts }); };
    var accepted = {};
    hay.forEach(function (h) {
      var trial = {}; Object.keys(accepted).forEach(function (k) { trial[k] = 1; }); trial[h] = 1;
      var f = fallSets(s, trial).fire, n = count(f);
      if (cap != null && n > cap && !(old(h) && !practice)) return;
      if (mercy && !homeAfter(trial, f)) return;
      accepted = trial;
    });
    var drop = fallSets(s, accepted).fire;
    var braced = [];
    /* heart round 2: a burned piece never cancels "sorry to them" (it stays owed in the heart list), and a gold, silver or gem
       block the mould spoiled comes through the fire as itself (it goes to Put back): gold survives fire (1 Cor 3:12-14) */
    function burnNote(b) { if (!b || b.t !== 'H') return; var a = b.mo || 'other'; if (!b.sp) { s.owed = s.owed || {}; s.owed[a] = (s.owed[a] || 0) + 1; stillN++; } if (!b.so) { s.owedJ = s.owedJ || {}; s.owedJ[a] = 1; stillN++; }
      if (!b.pr && !b.rp) { s.owedR = s.owedR || {}; s.owedR[a] = s.day; }   // 27 Nov 2026 (Joel: "yes, add it"): a burned moment can still be made right
      if (b.inf && !b.pr) { s.fallen.push(b.inf.t === 'M' ? { t: 'M', f: b.inf.f } : { t: b.inf.t }); spoiledBack++; } }
    var spoiledBack = 0, stillN = 0, wasPf = {}; Object.keys(accepted).forEach(function (k) { if (s.b[k] && s.b[k].pf != null) wasPf[k] = 1; });
    Object.keys(accepted).forEach(function (k) { burnNote(s.b[k]); });
    Object.keys(drop).forEach(function (k) { if (!accepted[k]) burnNote(s.b[k]); });
    Object.keys(accepted).forEach(function (k) { burned.push(k); var was = s.b[k]; if (was.pr) { s.b[k] = { t: 'Q', d: s.day }; if (was.r) s.b[k].r = 1; braced.push(k); } else delete s.b[k]; delete drop[k]; });
    Object.keys(drop).forEach(function (k) { if (s.b[k] && s.b[k].t === 'H') burned.push(k); });
    var smoked = hay.length - burned.length;
    if (!practice) Object.keys(s.b).forEach(function (k) { var b = s.b[k]; if (b.t === 'H' && !held(b)) b.sm = (b.sm || 0) + 1; });   // a held platform never smokes
    if (smoked > 0) events.push({ kind: practice ? 'practice' : mercy ? 'mercy' : 'smoked', n: smoked });
    var ev2 = [], info = {}, fell = fallInto(s, drop, ev2, info);
    if (info.lost) events.push({ kind: 'lost', n: info.lost });
    if (braced.length) events.push({ kind: 'braced', n: braced.length });
    if (spoiledBack) events.push({ kind: 'spoiledBack', n: spoiledBack });
    var gaveWay = burned.filter(function (k) { return wasPf[k]; }).length; if (gaveWay) events.push({ kind: 'platformGone', n: gaveWay });
    if (stillN) events.push({ kind: 'stillSay', n: stillN });   // heart round 4: no crash when only sorry to Jesus is owed
    s.today.fired = true; s.fireOwed = false;
    var broke = hadHome && !homeNow(s); s.mercy = broke;
    if (hadHome && !broke && burned.length && !fell.length && !practice && !mercy) { s.stickers.push({ day: s.day, id: 'stood' }); events.push({ kind: 'sticker', id: 'stood' }); }
    else if (hadHome && !burned.length && !smoked && !fell.length) { s.stickers.push({ day: s.day, id: 'clean' }); events.push({ kind: 'sticker', id: 'clean' }); }   // heart round 2: the best night earns one too
    s.lastNight = { kind: 'fire', day: s.day, burned: burned.length, fell: fell.length, smoked: smoked, lost: info.lost };
    return { ok: true, burned: burned, fell: fell, smoked: smoked, lost: info.lost, braced: braced, events: events.concat(ev2.filter(function (e) { return e.kind === 'sandLesson'; }), ringEvents(s, h0), checkMiles(s)) };
  }
  function storm(s) {
    var sets = fallSets(s), ev = [], info = {}, fell = fallInto(s, sets.storm, ev, info);
    s.lastStorm = s.day; s.today.stormed = true;
    s.lastNight = { kind: 'storm', day: s.day, fell: fell.length, lost: info.lost };
    if (info.lost) ev.push({ kind: 'lost', n: info.lost });
    return { ok: true, fell: fell, lost: info.lost, events: ev.concat(checkMiles(s)) };
  }
  /* the night the child lights: a storm first when one is due, then the fire */
  function night(s) {
    var out = { storm: null, fire: null };
    if (!fireReady(s)) return out;
    if (stormDue(s)) out.storm = storm(s);
    out.fire = fire(s);
    return out;
  }

  /* ---------- days ---------- */
  function endDay(s) { if (isFireNight(s) && !s.today.fired) s.fireOwed = true; platformCheck(s); return spreadMould(s); }   // a missed fire is owed once, never piled up
  function startDay(s, weekday) {
    s.day++; s.weekday = weekday == null ? (s.weekday + 1) % 7 : weekday; s.today = newToday();
    if (s.log) Object.keys(s.log).forEach(function (d) { if (+d < s.day - 3) delete s.log[d]; });
  }
  /* heart round 2: doing better is noticed from the day's own record, even when no weak piece is left on the walls */
  function betterAreas(s) { var y = (s.log || {})[s.day - 1] || {}, p = (s.log || {})[s.day - 2] || {};
    return Object.keys(p).filter(function (a) { return p[a] > 0 && (y[a] || 0) < p[a]; }); }
  function noneAreas(s) { var y = (s.log || {})[s.day - 1] || {}; return betterAreas(s).filter(function (a) { return !y[a]; }); }   // heart round 3: none at all, not just less
  function nextDay(s, weekday) { var sp = endDay(s); startDay(s, weekday); return { spread: sp, better: betterAreas(s), none: noneAreas(s) }; }

  /* ---------- is it a house? ---------- */
  function isWall(s, x, z) { var a = s.b[key(x, 0, z)], b = s.b[key(x, 1, z)]; return !!(a && b && SOLID[a.t] && SOLID[b.t]); }   // 27 Nov 2026 (heart round 1): a weak piece in a wall still closes it (it burns in the fire, and then the home has a gap); mould spreading into a wall no longer breaks a finished home
  function house(s) {
    var X0 = -1, X1 = CONFIG.plot + 13, Z0 = -1, Z1 = CONFIG.plot + 1, W = X1 - X0 + 1, maxY = CONFIG.maxY;
    var id = function (x, z) { return (z - Z0) * W + (x - X0); };
    var out = {}, q = [[X0, Z0]]; out[id(X0, Z0)] = 1;
    var wallCells = 0, x, z;
    for (x = 0; x < X1; x++) for (z = 0; z < Z1; z++) if (isWall(s, x, z)) wallCells++;
    while (q.length) {
      var c = q.pop();
      SIDES4.forEach(function (d) {
        var nx = c[0] + d[0], nz = c[1] + d[1]; if (nx < X0 || nx > X1 || nz < Z0 || nz > Z1) return;
        var i = id(nx, nz); if (out[i] || isWall(s, nx, nz)) return; out[i] = 1; q.push([nx, nz]);
      });
    }
    var seen = {}, best = null;
    for (x = 0; x < X1; x++) for (z = 0; z < Z1; z++) {
      var g = onPlot(s, x, z);
      if (!g || g === 'locked' || isWall(s, x, z) || out[id(x, z)] || seen[id(x, z)]) continue;
      var cells = [], st = [[x, z]]; seen[id(x, z)] = 1;
      while (st.length) {
        var cc = st.pop(); cells.push(cc);
        SIDES4.forEach(function (d) {
          var nx = cc[0] + d[0], nz = cc[1] + d[1], i = id(nx, nz);
          if (seen[i] || out[i] || isWall(s, nx, nz) || !onPlot(s, nx, nz)) return; seen[i] = 1; st.push([nx, nz]);
        });
      }
      var r = { cells: cells, door: false, window: false, furn: 0, roofed: 0 };
      cells.forEach(function (cc) {
        for (var y = 2; y < maxY; y++) if (s.b[key(cc[0], y, cc[1])]) { r.roofed++; break; }
        var f = s.b[key(cc[0], 0, cc[1])]; if (f && FURN[f.t]) r.furn++;
        SIDES4.forEach(function (d) {
          var a = s.b[key(cc[0] + d[0], 0, cc[1] + d[1])];
          if (a && a.t === 'D') r.door = true;
          for (var wy = 0; wy < maxY; wy++) { var wb = s.b[key(cc[0] + d[0], wy, cc[1] + d[1])]; if (wb && (wb.t === 'W' || wb.t === 'V')) { r.window = true; break; } }   // heart round 2: a window high in a tower counts too
        });
      });
      r.roof = r.roofed === cells.length; r.home = r.door && r.roof && cells.length >= CONFIG.homeMinCells;
      r.score = (cells.length >= 2 ? 1 : 0) + (r.door ? 2 : 0) + (r.roof ? 2 : 0) + (r.window ? 1 : 0) + r.furn * 0.1;
      if (cells.length >= 2 && (!best || r.score > best.score)) best = r;
    }
    return { wallCells: wallCells, room: best };
  }
  function homeNow(s) { var h = house(s); return !!(h.room && h.room.home); }
  var STEP_OK = {
    wall: function (h) { return h.wallCells >= 4 || !!h.room; },
    room: function (h) { return !!h.room; },
    door: function (h) { return !!(h.room && h.room.door); },
    roof: function (h) { return !!(h.room && h.room.roof); },
    home: function (h) { return !!(h.room && h.room.home); },
    window: function (h) { return !!(h.room && h.room.window); },
    furn: function (h) { return !!(h.room && h.room.furn >= 2); }
  };
  /* milestones won once and kept for ever; also notices a home that broke and was mended */
  function checkMiles(s) {
    var h = house(s), ev = [];
    CONFIG.steps.forEach(function (id) { if (!s.miles[id] && STEP_OK[id](h)) { s.miles[id] = s.day; ev.push({ kind: 'mile', id: id }); } });
    if (s.miles.home && !s.unlocked) { s.unlocked = true; ev.push({ kind: 'unlocked' }); }
    var home = STEP_OK.home(h);
    if (s.miles.home && !home && !s.homeBroken) { s.homeBroken = true; ev.push({ kind: 'broken' }); }
    if (s.homeBroken && home) { s.homeBroken = false; s.mended.push({ day: s.day, what: 'home' }); ev.push({ kind: 'mended' }); }
    var ps = planStatus(s); if (ps && ps.done && plansOf(s).done.indexOf(ps.id) < 0) { s.plans.done.push(ps.id); s.stickers.push({ day: s.day, id: 'plan-' + ps.id }); ev.push({ kind: 'planDone', id: ps.id }); giveTray(s, 'C', 1); ev.push({ kind: 'chest' }); }   // a finished plan: a treasure chest
    return ev;
  }
  function nextStep(s) { var h = house(s); for (var i = 0; i < CONFIG.steps.length; i++) if (!STEP_OK[CONFIG.steps[i]](h)) return { id: CONFIG.steps[i], house: h }; return { id: null, house: h }; }
  function level(s) { return s.miles.furn ? 'homemaker' : s.miles.home ? 'home' : s.miles.room ? 'wall' : 'apprentice'; }

  function summary(s) {
    var sets = fallSets(s), hay = 0, danger = 0, sorryN = 0, propped = 0, braces = 0;
    Object.keys(s.b).forEach(function (k) { var b = s.b[k]; if (b.t === 'Q') braces++; if (b.t !== 'H' || held(b)) return; hay++; if (weakState(s, k) === 'danger') danger++; if (b.so) sorryN++; if (b.pr) propped++; });
    var leaning = Object.keys(sets.fire).filter(function (k) { return s.b[k] && s.b[k].t !== 'd'; }).length;
    var onSand = Object.keys(sets.storm).filter(function (k) { return s.b[k] && s.b[k].t !== 'd' && !sets.fire[k]; }).length;
    return { blocks: Object.keys(s.b).length, tray: trayTotal(s), hay: hay, danger: danger, sorry: sorryN, propped: propped, braces: braces, leaning: leaning, onSand: onSand, fallen: s.fallen.length,
      putBackLeft: putBackLeft(s), pearlsLeft: Math.max(0, CONFIG.pearlsPerDayByAge[s.age] - s.today.pearls),
      fireNight: isFireNight(s), fireReady: fireReady(s), nightsToFire: nightsToFire(s), stormDue: stormDue(s), level: level(s),
      rockHalf: rockHalf(s), rockSize: rockHalf(s) * 2,
      toGrow: hay || rockHalf(s) >= CONFIG.rock.max ? null : CONFIG.rock.per - (((s.rockPts || 0) % CONFIG.rock.per) + CONFIG.rock.per) % CONFIG.rock.per };
  }

  return { CONFIG: CONFIG, SOLID: SOLID, CUBE: CUBE, FURN: FURN, TRAY_KINDS: TRAY_KINDS, key: key, un: un, ageBand: ageBand,
    fresh: fresh, ground: ground, onPlot: onPlot, rockHalf: rockHalf, MATERIALS: MATERIALS, count: count, trayTotal: trayTotal, canPlace: canPlace, place: place, pickUp: pickUp,
    canMake: canMake, make: make, swapIn: swapIn, planCells: planCells, planOf: planOf, canBuyPlan: canBuyPlan, buyPlan: buyPlan, usePlan: usePlan, clearPlan: clearPlan, planStatus: planStatus, planSpot: planSpot, addItem: addItem, todayLeft: todayLeft, todayLeftKind: todayLeftKind, canLift: canLift, landHay: landHay, forgive: forgive, sorry: sorry, sorryArea: sorryArea, heartList: heartList, spreadMould: spreadMould, mouldSoon: mouldSoon, rightOwed: rightOwed, setFocus: setFocus, nailDay: nailDay, focusOf: focusOf, cutsOpen: cutsOpen, planMake: planMake, canPlan: canPlan, held: held, platformState: platformState, fillPlatform: fillPlatform, fillArea: fillArea, rightArea: rightArea, propArea: propArea, forgiveArea: forgiveArea, weakState: weakState, crackLevel: crackLevel, canProp: canProp, prop: prop, fillBrace: fillBrace, areaCount: areaCount, putBack: putBack, putBackLeft: putBackLeft,
    stands: stands, fallSets: fallSets, isFireNight: isFireNight, nightsToFire: nightsToFire, stormDue: stormDue, fireReady: fireReady,
    fire: fire, storm: storm, night: night, endDay: endDay, startDay: startDay, nextDay: nextDay,
    isWall: isWall, house: house, checkMiles: checkMiles, nextStep: nextStep, level: level, summary: summary };
});
