/* Simulated children playing Build on the Rock v5 ("This week's three"). Run: node sim.js [options]
   --kids 400        children per profile          --days 180
   --parent usual    who notices the good in the day (attentive | usual | lapsed | all)
   --nolastlook      children never react to a leaning wall at Last look
   --set a.b=1       override any CONFIG value, e.g. --set fallAt.12=3 --set dailyCap.gem=6
   --repair 0.5      multiply every child's chance of putting today's straw right (a what-if)

   v5 piece sources (one day):
     gold 1 at the night account (always, when the night is played)       silver 0-2 (jobs, by themselves)
     night: 3 cards, each good / a bit of both / not; good -> a gem (grown-up confirms, or it arrives next morning)
     not -> owned up -> sorry prayer -> a pearl brings back 1 fallen block seen in the day: up to 2 gems, the focus card twins
     straw only from a grown-up (daytime, or one at the night confirm), within the daily cap
     Sunday review: 3 bonus pieces (any colour)                            prayers: a lantern every 10 (not a wall piece) */
'use strict';
var R = require('./rules.js');
var C = R.CONFIG;
function acts(n) { return n / (C.blocksPerPiece || 1); }   // v6: a good act is a stack of blocks; good/day counts ACTS

var args = process.argv.slice(2), opt = { kids: 400, days: 180, parent: 'usual', sets: [] };
for (var i = 0; i < args.length; i++) {
  var a = args[i];
  if (a === '--kids') opt.kids = +args[++i]; else if (a === '--days') opt.days = +args[++i];
  else if (a === '--parent') opt.parent = args[++i]; else if (a === '--set') opt.sets.push(args[++i]);
  else if (a === '--nolastlook') opt.noLastLook = true;
  else if (a === '--repair') opt.repair = +args[++i];
}
function setPath(path, val) { var p = path.split('.'), o = C; while (p.length > 1) o = o[p.shift()]; o[p[0]] = val; }
C.commissions.enabled = false;            // v5: the goal cards are off the screen
opt.sets.forEach(function (s) { var kv = s.split('='); setPath(kv[0], JSON.parse(kv[1])); });

/* Three kinds of DAY, calibrated to the plan's audit table (hard: 2-3 good, 2-3 straw; usual: 5-6 good, 0-1 straw;
   great: 9 good, 0 straw). night = chance of [good, a bit of both, not] for each card (age 6 has no "both": half goes
   to good, half to not). seen = mean "I saw it!" taps; straw = grown-up straw (mean, before the cap). */
var DAY = {
  hard:  { night: [0.10, 0.40, 0.50], seen: 0.2, silver: 0.35, straw: 2.6, pray: 0.8 },
  usual: { night: [0.45, 0.40, 0.15], seen: 0.9, silver: 0.70, straw: 0.5, pray: 1.2 },
  great: { night: [0.95, 0.05, 0.00], seen: 2.6, silver: 0.95, straw: 0.0, pray: 1.6 }
};
/* Kinds of CHILD: a mix of days, plus how they build. repair = share of today's straw put right; lastLook = chance of
   reacting to a leaning wall on fire night; sorry = says the sorry prayer after owning up; care = places gems (and
   picks colours) for windows. */
var TEMPER = {
  rough:   { mix: { hard: 0.55, usual: 0.40, great: 0.05 }, repair: 0.35, lastLook: 0.4,  sorry: 0.8,  care: 0.2,  spire: 0.1 },
  typical: { mix: { hard: 0.12, usual: 0.76, great: 0.12 }, repair: 0.55, lastLook: 0.6,  sorry: 0.9,  care: 0.5,  spire: 0.3 },
  steady:  { mix: { hard: 0.03, usual: 0.37, great: 0.60 }, repair: 0.75, lastLook: 0.85, sorry: 0.95, care: 0.85, spire: 0.7 }
};
if (opt.repair != null) Object.keys(TEMPER).forEach(function (k) { TEMPER[k].repair *= opt.repair; });   // sensitivity: --repair 0.5 halves putting straw right
var PARENT = { attentive: 1.3, usual: 1.0, lapsed: 0.5 };   // how much of the good in the day a grown-up notices
var BYDAY = { hard: { n: 0, good: 0, straw: 0 }, usual: { n: 0, good: 0, straw: 0 }, great: { n: 0, good: 0, straw: 0 } };
var SKIP = 0.10, REVIEW = 0.8, GEMS = Object.keys(C.gems), CARDS = C.cards.map(function (c) { return c.id; });

function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function poisson(rand, mean) { var L = Math.exp(-mean), k = 0, p = 1; do { k++; p *= rand(); } while (p > L); return k - 1; }
function good(s) { var t = R.tally(s); return t.filled - t.straw + s.free.filter(Boolean).length + (s.spire || []).filter(Boolean).length; }
function strawSpots(s, wall) { var out = []; (wall ? [wall] : C.wallOrder).forEach(function (w) { s.walls[w].forEach(function (col, c) { col.forEach(function (p, r) { if (p && p.t === 'W') out.push({ wall: w, col: c, row: r, id: p.id }); }); }); }); return out; }
function pullOne(s, spot) { R.forgive(s, spot.wall, spot.col, spot.row); R.markMadeRight(s, spot.wall, spot.col, spot.row, 'sim'); return R.pull(s, spot.wall, spot.col, spot.row).ok; }
function isGem(t) { return !!C.gems[t]; }

/* A child who cares about windows: choose the colour and the slot where the gem best joins other gems in a line. */
function gemScore(s, slot, t) {
  var best = 0;
  [[1, 0], [0, 1]].forEach(function (d) {
    for (var k = -2; k <= 0; k++) {
      var n = 0, same = 0, ok = true;
      for (var j = 0; j < 3; j++) {
        if (k + j === 0) continue;
        var c = slot.col + d[0] * (k + j), r = slot.row + d[1] * (k + j);
        if (c < 0 || r < 0 || c >= s.walls[slot.wall].length || r >= s.walls[slot.wall][0].length || (slot.wall === 'front' && r === 0 && c === (s.bp.door ? s.bp.door.col : 2))) { ok = false; break; }
        var p = s.walls[slot.wall][c][r];
        if (p && isGem(p.t)) { n++; if (p.t === t) same++; } else if (p) { ok = false; break; }
      }
      if (ok) best = Math.max(best, n === 2 ? 10 + (same === 2 ? 5 : 0) : n === 1 ? 2 + same : 0.5);
    }
  });
  return best;
}
function layGems(s, rand, care) {
  for (var i = 0; i < s.tray.length; i++) {
    var pc = s.tray[i];
    if (!isGem(pc.t) || rand() > care) continue;
    var slots = R.legalSlots(s).filter(function (x) { return x.wall !== 'free'; }), best = null, bs = 1, bt = pc.t;
    slots.forEach(function (x) {
      var near = {}; [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]].forEach(function (d) { var q = R.at(s, x.wall, x.col + d[0], x.row + d[1]); if (q && isGem(q.t)) near[q.t] = 1; });
      [pc.t].concat(Object.keys(near)).forEach(function (t) { var sc = gemScore(s, x, t); if (sc > bs) { bs = sc; best = x; bt = t; } });
    });
    if (best) { if (bt !== pc.t) R.setColour(s, pc.id, bt); if (R.place(s, i, best.wall, best.col, best.row).ok) i--; }
  }
}
function build(s, rand, care) { layGems(s, rand, care); R.autoPlace(s); }

function playChild(age, temper, parent, seed) {
  var rand = rng(seed), T = TEMPER[temper], s = R.newChild({ age: age });
  var m = { days: [], fires: { clean: 0, small: 0, wallFall: 0, caveIn: 0 }, lossFires: 0, blocksLost: 0, seals: [], lanterns: 0, played: 0 };
  var three = CARDS.slice(0, 3), focus = null, dare = false;
  function newBuilding() {
    dare = rand() < T.spire;
    var open = R.designs(s).filter(function (d) { return d.open; });
    R.chooseDesign(s, open[Math.floor(rand() * open.length)].id);
  }
  newBuilding();
  for (var d = 1; d <= opt.days; d++) {
    var ev0 = R.startDay(s, d % 7).events, late = ev0.filter(function (e) { return e.kind === 'lateGems'; })[0];
    if (late && m.days.length) m.days[m.days.length - 1].good += acts(late.pieces.length);   // they belong to last night
    var x0 = rand(), kind = x0 < T.mix.hard ? 'hard' : x0 < T.mix.hard + T.mix.usual ? 'usual' : 'great', D = DAY[kind];
    var day = { good: 0, straw: 0, played: false, kind: kind }, mine = [];
    /* Sunday: the weekly review -> 3 bonus pieces, and next week's three */
    if (d % 7 === 0 && rand() < REVIEW) {
      for (var b = 0; b < 3; b++) if (R.addBonus(s, 'gem', GEMS[Math.floor(rand() * GEMS.length)]).ok) day.good++;
      var pool = CARDS.filter(function (c) { return c !== 'truth'; }); three = [];
      while (three.length < 3) { var c0 = pool.splice(Math.floor(rand() * pool.length), 1)[0]; three.push(c0); }
    }
    /* the day: straw from a grown-up, "I saw it!", prayers, jobs */
    var n = poisson(rand, D.straw);
    for (var k = 0; k < n; k++) { var r = R.addPiece(s, 'W'); if (r.ok) { mine.push(r.piece.id); day.straw++; } }
    n = poisson(rand, D.seen * PARENT[parent]);
    for (k = 0; k < n; k++) { var card = focus && rand() < 0.5 ? focus : three[Math.floor(rand() * 3)], sr = R.seen(s, card, focus); if (sr.ok) day.good += acts(sr.pieces.length); }
    n = poisson(rand, D.pray); for (k = 0; k < n; k++) if (R.addPrayer(s).lantern) m.lanterns++;
    for (k = 0; k < 2; k++) if (rand() < D.silver && R.addPiece(s, 'S').ok) day.good++;
    if (rand() >= SKIP) {
      day.played = true; m.played++;
      /* the night account: gold, then the three cards, the sorry prayer for "not", the grown-up's confirm */
      if (R.addPiece(s, 'G').ok) day.good++;
      var answers = {}, N = D.night;
      three.forEach(function (id) {
        var x = rand(), pg = N[0], pb = age === 6 ? 0 : N[1];
        if (age === 6) pg = N[0] + N[1] / 2;
        answers[id] = x < pg ? 'good' : x < pg + pb ? 'both' : 'not';
      });
      R.nightAccount(s, answers);
      Object.keys(answers).forEach(function (id) { if (answers[id] === 'not' && rand() < T.sorry) { var o = R.ownUp(s, id); if (o.ok) day.good += o.pieces.length; } });
      if (rand() < 0.85) { var cf = R.confirmNight(s); if (cf.ok) day.good += acts(cf.pieces.length); }   // else they arrive in the morning
      focus = three[Math.floor(rand() * 3)];
      /* build */
      var sp = dare && !s.build.spireFell ? R.spireSlots(s) : [];
      if (sp.length) { var gi = -1; s.tray.forEach(function (p, idx) { if (gi < 0 && isGem(p.t)) gi = idx; }); if (gi >= 0) R.place(s, gi, 'spire', sp[0].col, 0); }
      build(s, rand, T.care);
      strawSpots(s).forEach(function (q) { if (mine.indexOf(q.id) >= 0 && rand() < T.repair) pullOne(s, q); });
      build(s, rand, T.care);
      if (R.isComplete(s)) { var inWay = strawSpots(s); if (inWay.length && rand() < T.lastLook) { inWay.sort(function (x, y) { return y.row - x.row; }).forEach(function (q) { pullOne(s, q); }); build(s, rand, T.care); } }
      var spireBusy = dare && !s.build.spireFell && s.spire.length && !s.spire.every(Boolean);
      if (!R.isFireNight(s) && !spireBusy) R.callFire(s);
      if (R.isFireNight(s)) {
        var fallAt = R.summary(s).fallAt;
        if (!opt.noLastLook && !s.mercy) C.wallOrder.forEach(function (w) {
          var spots = strawSpots(s, w);
          if (spots.length >= fallAt && rand() < T.lastLook) while (spots.length >= fallAt && pullOne(s, spots.pop())) { /* pulled */ }
        });
        var ev = R.fire(s);
        m.fires[ev.size]++;
        var knocks = ev.filter(function (e) { return e.kind === 'knock'; }).length;
        if (knocks || ev.size === 'wallFall' || ev.size === 'caveIn') { m.lossFires++; m.blocksLost += knocks; }
        var seal = ev.filter(function (e) { return e.kind === 'seal'; })[0];
        if (seal) { m.seals.push({ day: d, days: seal.building.days, slots: R.tally(s).total }); newBuilding(); }
      }
    }
    R.endDay(s);
    m.days.push(day);
  }
  return m;
}

function pad(v, n) { v = String(v); while (v.length < n) v = ' ' + v; return v; }
function f1(x) { return isFinite(x) ? x.toFixed(1) : '-'; }
function per(days, n) { return n ? (days / n >= 100 ? String(Math.round(days / n)) : (days / n).toFixed(1)) : 'never'; }

var parents = opt.parent === 'all' ? Object.keys(PARENT) : [opt.parent];
console.log('Build on the Rock v6 simulation: ' + opt.kids + ' children per profile, ' + opt.days + ' days, parent ' + opt.parent + (opt.noLastLook ? ', no Last look' : ''));
console.log('blocks per act ' + (C.blocksPerPiece || 1) + '  knocks per burn ' + (C.knocksPerBurn || 1) + '  gem cap ' + C.dailyCap.gem + '  straw cap ' + JSON.stringify(C.strawCapByAge) + '  fallAt ' + JSON.stringify(C.fallAt) + '  fire nights ' + JSON.stringify(C.fireNights) + '  seen/day ' + C.seenPerDay + '\n');
console.log('age temper  parent | good/day  <2 good  straw/day | 1st house  avg house  houses/180d | days per: block-loss  wall-fall  cave-in | lantern every');
var res = {};
[6, 8, 12].forEach(function (age) {
  Object.keys(TEMPER).forEach(function (temper) {
    parents.forEach(function (parent) {
      var t = { good: 0, straw: 0, played: 0, low: 0, f: { clean: 0, small: 0, wallFall: 0, caveIn: 0 }, loss: 0, blocks: 0, first: [], all: [], houses: 0, lanterns: 0 };
      for (var k = 0; k < opt.kids; k++) {
        var m = playChild(age, temper, parent, age * 100003 + k * 7919 + temper.length * 31 + parent.length * 17);
        m.days.forEach(function (d) { if (!d.played) return; t.played++; var bd = BYDAY[d.kind]; bd.n++; bd.good += d.good; bd.straw += d.straw; t.good += d.good; t.straw += d.straw; if (d.good < 2) t.low++; });
        Object.keys(t.f).forEach(function (key) { t.f[key] += m.fires[key]; });
        t.loss += m.lossFires; t.blocks += m.blocksLost; t.lanterns += m.lanterns; t.houses += m.seals.length;
        if (m.seals[0]) t.first.push(m.seals[0].days);
        m.seals.forEach(function (b) { t.all.push(b.days); });
      }
      var kidDays = opt.kids * opt.days, avg = function (a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : NaN; };
      var row = { good: t.good / t.played, low: t.low / t.played * 100, straw: t.straw / t.played, first: avg(t.first), avgHouse: avg(t.all), houses: t.houses / opt.kids,
        loss: per(kidDays, t.loss), wall: per(kidDays, t.f.wallFall + t.f.caveIn), cave: per(kidDays, t.f.caveIn), lantern: per(kidDays, t.lanterns), blocksPer: t.loss ? t.blocks / t.loss : 0 };
      res[age + temper + parent] = row;
      console.log(pad(age, 3) + ' ' + pad(temper, 7) + ' ' + pad(parent, 6) + ' | ' + pad(f1(row.good), 8) + ' ' + pad(f1(row.low) + '%', 8) + ' ' + pad(f1(row.straw), 10) + ' | ' +
        pad(f1(row.first), 9) + ' ' + pad(f1(row.avgHouse), 10) + ' ' + pad(f1(row.houses), 12) + ' | ' + pad(row.loss, 20) + ' ' + pad(row.wall, 10) + ' ' + pad(row.cave, 8) + ' | ' + pad(row.lantern, 8));
    });
  });
});
console.log('\nBy kind of day (all ages): ' + Object.keys(BYDAY).map(function (k) { var b = BYDAY[k]; return k + ' ' + f1(b.good / b.n) + ' good, ' + f1(b.straw / b.n) + ' straw'; }).join(' | '));
console.log('\nGreat (steady) child finishes a house this many days sooner than a rough one (first house / average house):');
[6, 8, 12].forEach(function (age) { parents.forEach(function (p) { var r = res[age + 'rough' + p], s = res[age + 'steady' + p]; console.log('  age ' + pad(age, 2) + ' ' + p + ': ' + f1(r.first - s.first) + ' / ' + f1(r.avgHouse - s.avgHouse)); }); });
console.log('\ngood/day and straw/day are for played nights (90%). <2 good = share of played days with fewer than 2 good pieces.');
console.log('block-loss = any fire that knocks out at least one block or fells a wall. wall-fall counts cave-ins too. 1st house = days to seal the first building.');
