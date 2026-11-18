/* Tests for rules.js. Run: node rules.test.js */
'use strict';
var assert = require('assert');
var R = require('./rules.js');
var C = R.CONFIG;
var passed = 0;
function test(name, fn) {
  var keep = JSON.stringify(C);
  try { fn(); passed++; console.log('ok   ' + name); }
  catch (e) { console.log('FAIL ' + name + '\n     ' + e.message); process.exitCode = 1; }
  var old = JSON.parse(keep); Object.keys(old).forEach(function (k) { C[k] = old[k]; });
}
/* The tests below pin the plain Design v4 rules; the tuned extras are switched on test by test. */
var TUNED = JSON.parse(JSON.stringify(C));
C.fallAt = { 6: 3, 8: 3, 12: 3 }; C.caveInGraceDays = 0; C.crackFires = 1; C.fairness.enabled = false; C.mercyAfterCaveIn = false;
C.knockBesideIfBare = false; C.knockNearestIfBare = false; C.rubblePerDay = { 6: 4, 8: 5, 12: 6 }; C.rubbleBigPile = null;
C.fireNights = { 6: [2, 4, 6], 8: [3, 5], 12: [0] }; C.maxTierByAge = { 6: 3, 8: 3, 12: 3 };
C.ladder.enabled = false; C.practiceFirstFire = false; C.autoLayAtNight = false; C.carryOverMax = null; C.gospel.lampInGarden = false;
C.blocksPerPiece = 1; C.knocksPerBurn = 1;   // v6 stacks (2 blocks an act) are pinned off here and tested in the v6 tests at the end
C.commissions.enabled = false; C.pullsMatchStrawCap = false; C.windowsMustTouch = false; C.spire.enabled = false;
function on(keys) { keys.split(' ').forEach(function (k) { C[k] = JSON.parse(JSON.stringify(TUNED[k])); }); }   // switch tuned features back on
function kid(age) { var s = R.newChild({ name: 'T', age: age }); R.startDay(s, 1); return s; }
/* Drop a stone straight into a slot (test helper, bypasses the tray). */
function set(s, wall, col, row, t) { s.walls[wall][col][row] = { id: s.nextId++, t: t, seq: ++s.seq }; }
function fillWall(s, wall, t) { for (var c = 0; c < s.walls[wall].length; c++) for (var r = 0; r < s.walls[wall][c].length; r++) if (!(wall === 'front' && c === (s.bp.door ? s.bp.door.col : 2) && r === 0)) set(s, wall, c, r, t || 'S'); }
function fillAll(s) { ['front', 'left', 'right'].forEach(function (w) { fillWall(s, w); }); }
function straw(s) { var r = R.addPiece(s, 'W'); assert(r.ok, 'straw refused: ' + r.reason); return r.events[r.events.length - 1]; }
function newDay(s, wd) { R.endDay(s); R.startDay(s, wd == null ? 1 : wd); }
function kinds(ev) { return ev.map(function (e) { return e.kind; }); }

test('sizes by age: 3/4/5 rows, door is not a slot, 4 free slots', function () {
  assert.equal(R.summary(kid(6)).slots.total, 14 + 9 + 9);
  assert.equal(R.summary(kid(8)).slots.total, 19 + 12 + 12);
  assert.equal(R.summary(kid(12)).slots.total, 24 + 15 + 15);
  var s = kid(6);
  assert.equal(s.free.length, 4);
  assert(!R.legalSlots(s).some(function (x) { return x.wall === 'front' && x.col === 2 && x.row === 0; }));
  assert(R.legalSlots(s).some(function (x) { return x.wall === 'front' && x.col === 2 && x.row === 1; }), 'slot over the door rests on the door');
  assert.equal(R.legalSlots(s).length, 4 + 1 + 3 + 3);
});

test('daily caps: gold 1, silver 2, straw 2 at age 6 and 3 otherwise', function () {
  var s = kid(6);
  assert(R.addPiece(s, 'G').ok); assert.equal(R.addPiece(s, 'G').reason, 'cap');
  assert(R.addPiece(s, 'S').ok); assert(R.addPiece(s, 'S').ok); assert(!R.addPiece(s, 'S').ok);
  assert(R.addPiece(s, 'W').ok); assert(R.addPiece(s, 'W').ok); assert(!R.addPiece(s, 'W').ok);
  var t = kid(8); for (var i = 0; i < 3; i++) assert(R.addPiece(t, 'W').ok); assert(!R.addPiece(t, 'W').ok);
  newDay(s); assert(R.addPiece(s, 'G').ok, 'caps reset each day');
  assert(!R.addPiece(s, 'Z').ok);
});

test('a gem carries its fruit name and meta; pieces wait in the tray', function () {
  var s = kid(8), r = R.addPiece(s, 't', { act: 'waited without whining' });
  assert.equal(r.piece.f, 'patience'); assert.equal(r.piece.m.act, 'waited without whining');
  assert.equal(s.tray.length, 1);
  assert.equal(Object.keys(C.gems).length, 9);
});

test('placing: needs support; any open supported slot is allowed', function () {
  var s = kid(6); R.addPiece(s, 'G'); R.addPiece(s, 'S');
  assert.equal(R.place(s, 0, 'front', 0, 1).reason, 'slot');
  assert(R.place(s, 0, 'front', 0, 0).ok);
  assert.equal(R.place(s, 0, 'front', 0, 0).reason, 'slot');
  assert(R.place(s, 0, 'front', 0, 1).ok);
  assert.equal(R.place(s, 0, 'left', 0, 0).reason, 'noPiece');
  assert.equal(R.place(s, 0, 'front', 2, 0).reason, 'noPiece');
  R.addPiece(s, 't'); assert.equal(R.place(s, 0, 'front', 2, 0).reason, 'slot', 'door');
  assert.equal(R.place(s, 0, 'front', 9, 0).reason, 'slot');
});

test('free-build slots open only when all three walls are full', function () {
  var s = kid(6); R.addPiece(s, 'G');
  assert.equal(R.place(s, 0, 'free', 0, 0).reason, 'slot');
  fillAll(s);
  assert.deepEqual(R.legalSlots(s).map(function (x) { return x.wall; }), ['free', 'free', 'free', 'free']);
  assert(R.place(s, 0, 'free', 2, 0).ok);
  assert(!R.isComplete(s));
});

test('straw lands on the tallest wall (ties front, left, right), lowest open slot', function () {
  var s = kid(8);
  var e = straw(s); assert.deepEqual([e.wall, e.col, e.row], ['front', 0, 0], 'all empty: front');
  s = kid(8); set(s, 'right', 0, 0); set(s, 'right', 1, 0);
  e = straw(s); assert.deepEqual([e.wall, e.col, e.row], ['right', 2, 0]);
  s = kid(8); set(s, 'left', 0, 0); set(s, 'right', 0, 0);
  e = straw(s); assert.equal(e.wall, 'left', 'tie goes left before right');
});

test('more straw piles onto the same wall, even when another wall is taller', function () {
  var s = kid(8); set(s, 'left', 0, 0);
  assert.equal(straw(s).wall, 'left');
  fillWall(s, 'front');
  var e = straw(s); assert.equal(e.wall, 'left'); assert.deepEqual([e.col, e.row], [2, 0]);
});

test('straw: full wall -> next wall; full building -> bumps the newest stone to rubble', function () {
  var s = kid(6); fillWall(s, 'front');
  assert.equal(straw(s).wall, 'left', 'front full, so the next fullest');
  s = kid(6); fillAll(s);
  var newest = s.walls.right[2][2];
  var r = R.addPiece(s, 'W');
  assert.deepEqual(kinds(r.events), ['bump', 'strawLand']);
  assert.equal(s.rubble[0], newest);
  assert.equal(R.at(s, 'right', 2, 2).t, 'W');
  s.free[0] = { id: 99, t: 'G', seq: ++s.seq };
  R.addPiece(s, 'W');
  assert.equal(s.free[0].t, 'G', 'free slots are never touched by straw');
  assert.equal(s.rubble.length, 2);
});

test('straw is laid automatically and cannot be steered', function () {
  var s = kid(6); var r = R.addPiece(s, 'W');
  assert.equal(s.tray.length, 0); assert.equal(r.events[0].kind, 'strawLand');
  assert.deepEqual(R.strawTarget(s), { wall: 'front', col: 1, row: 0 });
});

test('wobble: 2 straw sways, 3 leans', function () {
  var s = kid(6); C.strawCapByAge[6] = 3;
  straw(s); assert.equal(R.wobble(s).front, 0);
  straw(s); assert.equal(R.wobble(s).front, 1);
  straw(s); assert.equal(R.wobble(s).front, 2);
  assert.equal(R.wobble(s).left, 0);
});

test('forgive: free, unlimited, marks the bale; a forgiven bale still burns', function () {
  var s = kid(8); straw(s); straw(s); straw(s);
  [0, 1, 3].forEach(function (c) { assert(R.forgive(s, 'front', c, 0).ok); });
  assert(R.at(s, 'front', 0, 0).forgiven);
  assert.equal(R.forgive(s, 'left', 0, 0).reason, 'notStraw');
  var ev = R.fire(s);
  assert.equal(ev.filter(function (e) { return e.kind === 'burn' && e.forgiven; }).length, 3);
  assert.equal(ev.size, 'wallFall');
});

test('pull: needs the pearl mark, 2 a day, wall settles and leaves a pearl seam', function () {
  var s = kid(8); straw(s); straw(s); straw(s);
  set(s, 'front', 0, 1, 'G'); set(s, 'front', 0, 2, 't');
  assert.equal(R.pull(s, 'front', 0, 0).reason, 'notForgiven');
  R.forgive(s, 'front', 0, 0); R.forgive(s, 'front', 1, 0); R.forgive(s, 'front', 3, 0);
  var r = R.pull(s, 'front', 0, 0);
  assert(r.ok); assert.equal(r.events[0].settled.length, 2);
  assert.equal(R.at(s, 'front', 0, 0).t, 'G'); assert.equal(R.at(s, 'front', 0, 1).t, 't'); assert.equal(R.at(s, 'front', 0, 2), null);
  assert.deepEqual(s.seams, [{ wall: 'front', col: 0, row: 0 }]);
  assert(R.pull(s, 'front', 1, 0).ok);
  assert.equal(R.pull(s, 'front', 3, 0).reason, 'pullCap');
  newDay(s); assert(R.pull(s, 'front', 3, 0).ok, 'pulls reset each day');
  assert.equal(R.summary(s).slots.straw, 0);
});

test('ordering: clean day >= put-right day > straw left in', function () {
  function day(mode) {
    var s = kid(8);
    if (mode !== 'clean') straw(s);
    ['G', 'S', 'S', 't', 'p', 'k'].forEach(function (t) { R.addPiece(s, t); });
    R.autoPlace(s);
    if (mode !== 'clean') { R.addPiece(s, 'b'); R.place(s, 0, 'front', 0, 1); } else { R.addPiece(s, 'b'); R.autoPlace(s); }
    if (mode === 'right') { R.forgive(s, 'front', 0, 0); R.pull(s, 'front', 0, 0); }
    R.fire(s);
    var t = R.summary(s);
    return { good: t.slots.filled - t.slots.straw, open: t.slots.total - t.slots.filled, holes: t.slots.holes, rubble: t.rubble };
  }
  var clean = day('clean'), right = day('right'), left = day('left');
  assert.deepEqual(right, clean, 'put right ends exactly level with a clean day');
  assert(left.good === clean.good - 1 && left.rubble === 1 && left.open === clean.open + 1, 'straw left in knocks a stone out to be re-laid');
  C.pullMode = 'pearlSlot';
  var p = day('right');
  assert(p.open < clean.open, 'pearlSlot mode would put a put-right day AHEAD of a clean day (why settle is the default)');
});

test('pearlSlot mode leaves a pearl piece in the slot', function () {
  C.pullMode = 'pearlSlot';
  var s = kid(8); straw(s); R.forgive(s, 'front', 0, 0); R.pull(s, 'front', 0, 0);
  assert.equal(R.at(s, 'front', 0, 0).t, 'P');
});

test('small fire: each straw burns to a hole and knocks the stone on it to rubble', function () {
  var s = kid(8); straw(s); straw(s);
  set(s, 'front', 0, 1, 'G'); set(s, 'front', 0, 2, 't'); set(s, 'left', 0, 0, 'S');
  var f = R.forecast(s);
  assert.deepEqual([f.size, f.burns, f.knocks, f.caveIn], ['small', 2, 1, false]);
  assert.equal(R.summary(s).slots.straw, 2, 'forecast changes nothing');
  var ev = R.fire(s);
  assert.deepEqual(kinds(ev), ['burn', 'knock', 'burn']);
  assert.equal(ev.size, 'small');
  assert.equal(R.at(s, 'front', 0, 0), null); assert.equal(R.at(s, 'front', 0, 1), null);
  assert.equal(R.at(s, 'front', 0, 2).t, 't', 'only the stone directly above moves');
  assert.equal(s.rubble.length, 1); assert.equal(s.rubble[0].t, 'G');
  assert.equal(R.at(s, 'left', 0, 0).t, 'S');
  assert.equal(R.summary(s).slots.holes, 2);
  assert(R.legalSlots(s).some(function (x) { return x.wall === 'front' && x.col === 0 && x.row === 0 && x.hole; }), 'holes can be refilled');
  assert(R.legalSlots(s).some(function (x) { return x.col === 0 && x.row === 1 && x.wall === 'front'; }), 'a hole under a stone can be refilled too');
});

test('wall fall at 3 straw: stones to rubble, wall cracked, mends after one clean stand', function () {
  var s = kid(8); set(s, 'front', 4, 0, 'G'); set(s, 'left', 0, 0, 'S');
  straw(s); straw(s); straw(s);
  var ev = R.fire(s);
  assert.equal(ev.size, 'wallFall');
  var fall = ev.filter(function (e) { return e.kind === 'wallFall'; })[0];
  assert.equal(fall.wall, 'front'); assert.equal(fall.pieces.length, 1);
  assert.equal(R.tally(s, 'front').filled, 0);
  assert.equal(R.at(s, 'left', 0, 0).t, 'S', 'other walls stand');
  assert.equal(s.rubble.length, 1, 'gold is in the rubble, straw is gone');
  assert(R.summary(s).walls.front.cracked);
  newDay(s, 3);
  ev = R.fire(s);
  assert(kinds(ev).indexOf('mend') >= 0); assert(!R.summary(s).walls.front.cracked);
});

test('cave-in: a wall falls while a wall is cracked -> everything down, nothing destroyed', function () {
  var s = kid(8); set(s, 'right', 0, 0, 'G'); set(s, 'right', 1, 0, 't'); set(s, 'left', 0, 0, 'k');
  set(s, 'front', 0, 0, 'S'); set(s, 'front', 1, 0, 'S'); set(s, 'front', 3, 0, 'S');
  straw(s); straw(s); straw(s);
  assert.equal(R.fire(s).size, 'wallFall');                 // front falls, cracked
  newDay(s, 3);
  straw(s); straw(s); straw(s);                             // piles on the fullest wall (right)
  assert.equal(R.tally(s, 'right').straw, 3);
  assert(R.forecast(s).caveIn);
  var ev = R.fire(s);
  assert.equal(ev.size, 'caveIn');
  assert.equal(R.summary(s).slots.filled, 0);
  assert.equal(s.rubble.length, 6, 'every stone is safe in the rubble');
  assert(!R.summary(s).walls.front.cracked, 'fresh start after a cave-in');
  assert.equal(s.stats.caveIns, 1);
});

test('cave-in grace: inside the grace days a second cave-in is only a wall fall', function () {
  C.caveInGraceDays = 14;
  var s = kid(8), d = 1, sizes = [];
  for (var i = 0; i < 4; i++) { straw(s); straw(s); straw(s); sizes.push(R.fire(s).size); d += 2; R.endDay(s); R.startDay(s, 3); s.day = d; }
  assert.deepEqual(sizes, ['wallFall', 'caveIn', 'wallFall', 'wallFall']);
  s.day = 40; straw(s); straw(s); straw(s);
  assert.equal(R.fire(s).size, 'caveIn', 'after the grace days the risk is back');
});

test('no cave-in when the cracked wall has stood through a fire in between', function () {
  var s = kid(8); straw(s); straw(s); straw(s); R.fire(s);
  newDay(s, 3); R.fire(s);                                  // clean fire: mends
  newDay(s, 5); straw(s); straw(s); straw(s);
  assert.equal(R.fire(s).size, 'wallFall');
});

test('free-build slots survive wall falls and cave-ins', function () {
  var s = kid(6); fillAll(s); s.free[0] = { id: 500, t: 'G', seq: ++s.seq };
  s.walls.front[0][0] = { id: 501, t: 'W' }; s.walls.front[1][0] = { id: 502, t: 'W' }; s.walls.front[3][0] = { id: 503, t: 'W' };
  R.fire(s);
  assert.equal(s.free[0].t, 'G');
});

test('rubble: 4 a day; tray pieces are always free to place', function () {
  C.rubblePerDay[12] = 4; var s = kid(12); for (var i = 0; i < 6; i++) s.rubble.push({ id: 900 + i, t: 'S' });
  for (i = 0; i < 4; i++) assert(R.placeRubble(s, 0, 'front', i < 2 ? i : i + 1, 0).ok);
  assert.equal(R.placeRubble(s, 0, 'left', 0, 0).reason, 'rubbleCap');
  for (i = 0; i < 3; i++) R.addPiece(s, 't');
  R.addPiece(s, 'G'); R.addPiece(s, 'S'); R.addPiece(s, 'S');
  var ev = R.autoPlace(s).events;
  assert.equal(ev.length, 6); assert.equal(s.tray.length, 0); assert.equal(s.rubble.length, 2);
  newDay(s); assert.equal(R.autoPlace(s).events.length, 2);
});

test('autoPlace fills holes first and stops when nothing fits', function () {
  var s = kid(6); set(s, 'front', 0, 1, 'G');               // hole under it at row 0
  R.addPiece(s, 'S');
  var e = R.autoPlace(s).events[0];
  assert.deepEqual([e.wall, e.col, e.row], ['front', 0, 0]);
  fillAll(s); s.free = s.free.map(function (x, i) { return { id: 700 + i, t: 'S' }; });
  R.addPiece(s, 't'); assert.equal(R.autoPlace(s).events.length, 0); assert.equal(s.tray.length, 1);
});

test('windows: any three gems; three of one fruit is pure', function () {
  var s = kid(12); set(s, 'front', 0, 0, 't'); set(s, 'front', 1, 0, 't'); set(s, 'front', 3, 0, 'p');
  assert.deepEqual(R.windows(s), { total: 1, pure: 0, mosaic: 1, gems: 3, list: [] });
  set(s, 'left', 0, 0, 't'); set(s, 'left', 1, 0, 'k'); set(s, 'left', 2, 0, 'k');
  assert.deepEqual(R.windows(s), { total: 2, pure: 1, mosaic: 1, gems: 6, list: [] });
});

test('fire nights by age', function () {
  function nights(age) { var s = R.newChild({ age: age }), out = []; for (var d = 0; d < 7; d++) { R.startDay(s, d); if (R.isFireNight(s)) out.push(d); } return out; }
  assert.deepEqual(nights(6), [2, 4, 6]); assert.deepEqual(nights(8), [3, 5]); assert.deepEqual(nights(12), [0]);
});

test('seal: complete + no straw + fire -> City, new blueprint, tray carries over', function () {
  var s = kid(6); fillAll(s);
  assert.equal(R.fire(s).some(function (e) { return e.kind === 'seal'; }), false, 'free slots still empty');
  for (var i = 0; i < 6; i++) { newDay(s); R.addPiece(s, 't'); R.addPiece(s, 'G'); }
  R.autoPlace(s);
  assert(R.isComplete(s)); assert.equal(s.tray.length, 8);
  var ev = R.fire(s);
  assert.deepEqual(kinds(ev), ['crown', 'seal']);
  var b = ev[1].building;
  assert.equal(b.stars, 2); assert.equal(b.name, 'Cottage'); assert.equal(b.layout.front[2].length, 3);
  assert.equal(s.city.length, 1); assert.equal(s.tray.length, 8, 'leftovers carried over');
  assert.equal(R.summary(s).slots.filled, 0);
  assert.doesNotThrow(function () { JSON.parse(JSON.stringify(s)); });
});

test('not sealed with straw in it or with a hole', function () {
  var s = kid(6); fillAll(s); s.free = s.free.map(function (x, i) { return { id: 700 + i, t: 'S' }; });
  R.addPiece(s, 'W');                                       // bumps the newest stone
  var ev = R.fire(s);
  assert.equal(ev.size, 'small'); assert.equal(s.city.length, 0);
  assert.equal(R.summary(s).slots.total - R.summary(s).slots.filled, 1); assert.equal(s.rubble.length, 1);
  newDay(s, 3);
  assert.equal(R.fire(s).some(function (e) { return e.kind === 'seal'; }), false, 'hole not filled yet');
  R.autoPlace(s);
  newDay(s, 5);
  assert(R.fire(s).some(function (e) { return e.kind === 'seal'; }));
});

test('callFire: only when complete and straw-free; makes tonight a fire night', function () {
  var s = kid(12); R.startDay(s, 2);
  assert.equal(R.callFire(s).reason, 'notReady'); assert(!R.isFireNight(s));
  fillAll(s); s.free = s.free.map(function (x, i) { return { id: 700 + i, t: 'S' }; });
  assert(R.summary(s).canCallFire); assert(R.callFire(s).ok); assert(R.isFireNight(s));
  assert(R.fire(s).some(function (e) { return e.kind === 'seal'; }));
});

test('blueprint progression: bigger blueprint every sealsPerTier sealed buildings', function () {
  C.sealsPerTier = 2; var s = kid(6);
  function sealOne() { fillAll(s); s.free = s.free.map(function (x, i) { return { id: 700 + i, t: 'S' }; }); R.fire(s); }
  sealOne(); assert.equal(s.bp.name, 'Cottage');
  sealOne(); assert.equal(s.bp.name, 'House'); assert.equal(s.walls.left.length, 4);
  sealOne(); sealOne(); assert.equal(s.bp.name, 'Hall'); assert.equal(s.bp.rows, 4); assert.equal(s.free.length, 5);
  for (var i = 0; i < 6; i++) sealOne();
  assert.equal(s.bp.name, 'Cathedral'); assert.equal(s.city.length, 10);
  C.progression = false;
  var t = kid(6); t.sealed = 9; fillAll(t); t.free = t.free.map(function (x, i) { return { id: i, t: 'S' }; }); R.fire(t);
  assert.equal(t.bp.name, 'Cottage');
});

test('nothing gold, silver or gem is ever destroyed (300 rough days)', function () {
  var s = R.newChild({ age: 6 }), seed = 7, given = 0;
  function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
  for (var d = 0; d < 300; d++) {
    R.startDay(s, d % 7);
    if (rnd() < 0.9) R.addPiece(s, 'W'); if (rnd() < 0.7) R.addPiece(s, 'W');
    ['G', 'S', 't', 'p'].forEach(function (t) { if (R.addPiece(s, t).ok) given++; });
    R.autoPlace(s);
    if (R.isFireNight(s)) R.fire(s);
    R.endDay(s);
  }
  var held = s.tray.length + s.rubble.length + R.summary(s).slots.filled - R.summary(s).slots.straw + s.free.filter(Boolean).length;
  s.city.forEach(function (b) { held += b.gold + b.silver + b.gems; });
  assert.equal(held, given);
  assert(s.stats.wallFalls > 0 && s.stats.caveIns > 0, 'the rough run really did lose walls');
});

test('gospel share: plants a seed and gives one lamp a day, placed like any stone', function () {
  var s = kid(8), r = R.addGospelShare(s, { who: 'Sam' });
  assert(r.ok); assert.equal(r.piece.t, 'L'); assert.deepEqual(s.seeds, [{ id: r.seed.id, day: 1 }]);
  var r2 = R.addGospelShare(s);
  assert(r2.ok); assert.equal(r2.piece, null, 'second lamp the same day is capped'); assert.equal(s.seeds.length, 2);
  assert(R.place(s, 0, 'front', 0, 0).ok); assert.equal(R.at(s, 'front', 0, 0).t, 'L');
  C.gospel.enabled = false; assert.equal(R.addGospelShare(s).reason, 'off');
});

test('neighbour: a stone per later day prayed, capped at 12, untouched by straw and fire', function () {
  var s = kid(8), n = R.addNeighbour(s, 'Mia').neighbour;
  assert.equal(R.prayFor(s, n.id).reason, 'tooSoon');
  newDay(s); assert(R.prayFor(s, n.id).ok); assert.equal(R.prayFor(s, n.id).reason, 'alreadyToday');
  straw(s); straw(s); straw(s); R.fire(s);
  assert.equal(s.neighbours[0].stones, 1, 'the fire does not touch a neighbour');
  for (var i = 0; i < 20; i++) { newDay(s); R.prayFor(s, n.id); }
  assert.equal(s.neighbours[0].stones, 12); assert.equal(R.prayFor(s, n.id).reason, 'houseDone');
  assert.equal(R.prayFor(s, 12345).reason, 'noNeighbour');
  assert.equal(R.summary(s).neighbours.length, 1);
});

test('knockBesideIfBare: off = bare straw costs nothing; on = it takes the stone beside it', function () {
  function run(on) {
    C.knockBesideIfBare = on;
    var s = kid(8); straw(s); set(s, 'front', 1, 0, 'G'); set(s, 'left', 0, 0, 'S');
    var ev = R.fire(s);
    return { knocks: ev.filter(function (e) { return e.kind === 'knock'; }), rubble: s.rubble.length, size: ev.size };
  }
  var off = run(false), on = run(true);
  assert.equal(off.knocks.length, 0); assert.equal(off.rubble, 0);
  assert.equal(on.knocks.length, 1); assert.deepEqual([on.knocks[0].wall, on.knocks[0].col, on.knocks[0].row], ['front', 1, 0]);
  assert.equal(on.rubble, 1); assert.equal(on.size, 'small');
  C.knockBesideIfBare = true;
  var s = kid(8); straw(s); set(s, 'front', 0, 1, 'G'); set(s, 'front', 1, 0, 'S');
  assert.equal(R.fire(s).filter(function (e) { return e.kind === 'knock'; })[0].row, 1, 'the stone on top still goes first, and only one stone per bale');
  assert.equal(s.rubble.length, 1);
});

test('tuned thresholds: walls fall at 2 straw (1 sways, 2 leans) at every age', function () {
  C.fallAt = TUNED.fallAt;
  [6, 8, 12].forEach(function (age) {
    var s = kid(age); straw(s);
    assert.equal(R.wobble(s).front, 1); assert.equal(R.forecast(s).size, 'small');
    straw(s);
    assert.equal(R.wobble(s).front, 2); assert.equal(R.summary(s).fallAt, 2); assert.equal(R.fire(s).size, 'wallFall');
  });
});

test('tuned fire nights: 6 Tue/Thu/Sat, 8 Mon/Wed/Fri, 12 Sun/Wed', function () {
  C.fireNights = TUNED.fireNights;
  function nights(age) { var s = R.newChild({ age: age }), out = []; for (var d = 0; d < 7; d++) { R.startDay(s, d); if (R.isFireNight(s)) out.push(d); R.fire(s); R.endDay(s); } return out; }
  assert.deepEqual(nights(6), [2, 4, 6]); assert.deepEqual(nights(8), [1, 3, 5]); assert.deepEqual(nights(12), [0, 3]);
});

test('a missed fire night is held the next night', function () {
  var s = R.newChild({ age: 12 }); R.startDay(s, 0);
  assert(R.isFireNight(s)); assert(R.endDay(s).record.missedFire);
  R.startDay(s, 1); assert(R.isFireNight(s), 'owed'); assert(R.summary(s).fireOwed);
  R.fire(s); R.endDay(s);
  R.startDay(s, 2); assert(!R.isFireNight(s));
  C.missedFireNextNight = false;
  s = R.newChild({ age: 12 }); R.startDay(s, 0); R.endDay(s); R.startDay(s, 1); assert(!R.isFireNight(s));
});

test('cracks last crackFires fires: a fall two fires later is still a cave-in', function () {
  C.crackFires = 3;
  var s = kid(8); straw(s); straw(s); straw(s); assert.equal(R.fire(s).size, 'wallFall');
  newDay(s, 3); assert.equal(R.fire(s).filter(function (e) { return e.kind === 'mend'; }).length, 0);
  newDay(s, 5); straw(s); straw(s); straw(s);
  assert.equal(R.fire(s).size, 'caveIn');
  s = kid(8); straw(s); straw(s); straw(s); R.fire(s);
  var mended = false;
  for (var i = 0; i < 3; i++) { newDay(s, 3); mended = R.fire(s).some(function (e) { return e.kind === 'mend'; }); }
  assert(mended, 'mends after standing through three fires');
});

test('mercy: at the very next fire after a cave-in no wall can fall', function () {
  C.mercyAfterCaveIn = true;
  var s = kid(8); straw(s); straw(s); straw(s); R.fire(s);
  newDay(s, 3); straw(s); straw(s); straw(s); assert.equal(R.fire(s).size, 'caveIn');
  newDay(s, 5); straw(s); straw(s); straw(s); set(s, 'front', 0, 1, 'G');
  assert(R.summary(s).mercy);
  var ev = R.fire(s);
  assert.equal(ev.size, 'small'); assert(ev.mercy); assert.equal(s.rubble.filter(function (p) { return p.t === 'G'; }).length, 1, 'straw still burns and knocks');
  newDay(s, 1); straw(s); straw(s); straw(s);
  assert.equal(R.fire(s).size, 'wallFall', 'mercy is one fire only');
});

test('fairness: two fall-fires in two weeks -> walls take one more straw; steps back after calm weeks', function () {
  C.fairness = JSON.parse(JSON.stringify(TUNED.fairness)); C.fairness.enabled = true; C.fairness.maxBonus = 1; C.caveInGraceDays = 99;
  var s = R.newChild({ age: 6 }), d = 0, seen = [];
  function day() { d++; var ev = R.startDay(s, 1).events; ev.forEach(function (e) { if (e.kind === 'fairness') seen.push(e.bonus); }); }
  function fall() { s.today.W = 0; straw(s); s.today.W = 0; straw(s); s.today.W = 0; straw(s); s.today.W = 0; if (R.summary(s).fallAt > 3) straw(s); return R.fire(s).size; }
  day(); assert.equal(R.summary(s).fallAt, 3); assert.equal(fall(), 'wallFall'); R.endDay(s);
  for (var i = 0; i < 4; i++) { day(); R.endDay(s); }
  day(); fall(); R.endDay(s);                                // second fall-fire, day 6
  while (d < 8) { day(); R.endDay(s); }
  assert.deepEqual(seen, [1], 'stepped up at the weekly look-back'); assert.equal(R.summary(s).fallAt, 4); assert.equal(R.summary(s).fairnessBonus, 1);
  straw(s); straw(s); assert.equal(R.wobble(s).front, 0); s.today.W = 0; straw(s);
  assert.equal(R.wobble(s).front, 1, 'three straw only sways now'); assert.equal(R.fire(s).size, 'small');
  for (i = 0; i < 10; i++) { day(); R.endDay(s); }
  assert.equal(R.summary(s).fairnessBonus, 1, 'stays while the falls are still inside the last two weeks');
  for (i = 0; i < 14; i++) { day(); R.endDay(s); }
  assert.equal(R.summary(s).fairnessBonus, 0, 'two calm weeks: back down'); assert.deepEqual(seen, [1, 0]);
  var old = R.newChild({ age: 6 }); delete old.fair; R.startDay(old, 1);
  assert.equal(R.summary(old).fallAt, 3, 'a save from before the fairness layer still loads');
});

test('fairness: a helped child has cracks that mend sooner', function () {
  C.fairness.enabled = true; C.crackFires = 3; C.fairness.crackFiresWhenHelped = 1;
  var s = kid(8); s.fair = { bonus: 1, fallDays: [], lastReview: 1, lastChange: 1 };
  for (var i = 0; i < 4; i++) { s.today.W = 0; straw(s); }
  assert.equal(R.fire(s).size, 'wallFall');
  newDay(s, 3); assert(R.fire(s).some(function (e) { return e.kind === 'mend'; }));
});

test('rubble (v6 blocks): 4 a day, 12 a day while the pile is over 16', function () {   // v5 was 2 / 6 over 8: doubled with the blocks
  C.rubblePerDay = TUNED.rubblePerDay; C.rubbleBigPile = TUNED.rubbleBigPile;
  var s = kid(12); for (var i = 0; i < 28; i++) s.rubble.push({ id: 900 + i, t: 'S' });
  assert.equal(R.summary(s).rubbleLeftToday, 12);
  assert.equal(R.autoPlace(s).events.length, 12); assert.equal(s.rubble.length, 16);
  newDay(s); assert.equal(R.autoPlace(s).events.length, 4, 'pile is 16 now: back to 4 a day');
});

test('knockNearestIfBare: a bare bale with nothing beside it takes the nearest stone in its wall', function () {
  C.knockBesideIfBare = true; C.knockNearestIfBare = true;
  var s = kid(8); set(s, 'front', 4, 0, 'G'); set(s, 'left', 0, 0, 'S'); straw(s);
  var k = R.fire(s).filter(function (e) { return e.kind === 'knock'; });
  assert.equal(k.length, 1); assert.deepEqual([k[0].wall, k[0].col, k[0].row], ['front', 4, 0]);
  s = kid(8); set(s, 'left', 0, 0, 'S'); s.walls.front[0][0] = { id: 77, t: 'W' };
  assert.equal(R.fire(s).filter(function (e) { return e.kind === 'knock'; }).length, 0, 'never reaches into another wall');
});

test('maxTierByAge caps how big a blueprint grows', function () {
  C.sealsPerTier = 1; C.maxTierByAge = { 6: 3, 8: 3, 12: 2 };
  var s = kid(12);
  for (var i = 0; i < 6; i++) { fillAll(s); s.free = s.free.map(function (x, j) { return { id: j, t: 'S' }; }); R.fire(s); }
  assert.equal(s.bp.tier, 2); assert.equal(R.summary(s).nextTierIn, 0);
});

test('shipped CONFIG is the tuned one', function () {
  assert.deepEqual(TUNED.fallAt, { 6: 2, 8: 2, 12: 2 }); assert.equal(TUNED.crackFires, 3); assert.equal(TUNED.caveInGraceDays, 28);
  assert(TUNED.fairness.enabled && TUNED.mercyAfterCaveIn && TUNED.knockBesideIfBare && TUNED.missedFireNextNight);
});

/* ---------- round 3 ---------- */
function gems(s, wall, cells, t) { cells.forEach(function (x, i) { set(s, wall, x[0], x[1], typeof t === 'string' ? t : t[i]); s.walls[wall][x[0]][x[1]].f = C.gems[s.walls[wall][x[0]][x[1]].t]; }); }
function full(s) { fillAll(s); s.free = s.free.map(function (x, i) { return { id: 7000 + i, t: 'S', seq: ++s.seq }; }); }

test('windows must touch: three gems in a line in one wall; pure = same fruit; list gives the cells', function () {
  on('windowsMustTouch');
  var s = kid(12);
  gems(s, 'front', [[0, 0], [1, 0], [3, 0]], 't');
  assert.equal(R.windows(s).total, 0, 'the door breaks the line');
  gems(s, 'front', [[0, 1], [1, 1]], ['p', 'k']); set(s, 'front', 2, 1, 'S');
  assert.equal(R.windows(s).total, 0, 'not three in a row yet');
  gems(s, 'front', [[0, 2]], 'b');
  var w = R.windows(s);
  assert.equal(w.total, 1); assert.equal(w.pure, 0); assert.equal(w.gems, 6);
  assert.deepEqual(w.list[0], { wall: 'front', cells: [{ col: 0, row: 0 }, { col: 0, row: 1 }, { col: 0, row: 2 }], pure: false });
  gems(s, 'left', [[0, 0], [1, 0], [2, 0]], 'e');
  w = R.windows(s);
  assert.equal(w.total, 2); assert.equal(w.pure, 1); assert.equal(w.mosaic, 1);
  assert.deepEqual(w.list[0], { wall: 'left', cells: [{ col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }], pure: true, fruit: 'gentleness' });
  gems(s, 'right', [[0, 0]], 'e'); gems(s, 'left', [[0, 1]], 'e');
  assert.equal(R.windows(s).total, 2, 'gems in different walls or off the line do not join; each gem counts once');
});

test('a knocked-out gem darkens its window; refilling the gap with a gem relights it', function () {
  on('windowsMustTouch');
  var s = kid(8); s.walls.front[0][0] = { id: 800, t: 'W' };
  gems(s, 'front', [[0, 1], [1, 1], [2, 1]], 't'); set(s, 'front', 1, 0, 'S');
  assert.equal(R.windows(s).total, 1); assert.equal(R.forecast(s).windowsLost, 1);
  var ev = R.fire(s), k = ev.filter(function (e) { return e.kind === 'knock'; })[0];
  assert(k.window, 'the knock event says it was a window stone'); assert.equal(ev.windowsLost, 1); assert.equal(s.lastFire.windowsLost, 1);
  assert.equal(R.windows(s).total, 0);
  newDay(s); R.addPiece(s, 'S'); assert(R.place(s, 0, 'front', 0, 0).ok);
  assert.equal(s.rubble[0].t, 't'); assert(R.placeRubble(s, 0, 'front', 0, 1).ok);
  assert.equal(R.windows(s).total, 1, 'relit');
});

test('commissions: three cards per building, pick one, a met commission is a star', function () {
  on('commissions ladder');
  assert(C.commissions.pool.every(function (x) { return !/pearl/i.test(x.id + x.label); }), 'never reward having no forgiveness');
  var seed = 3, rng = function () { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  var s = kid(12), cards = R.commissionChoices(s, rng);
  assert.equal(cards.length, 3); assert(cards[0].id && cards[0].text && cards[0].label);
  assert.deepEqual(R.commissionChoices(s, rng), cards, 'remembered for this building');
  assert.equal(R.commissionProgress(s), null);
  assert.equal(R.chooseCommission(s, 'nope').reason, 'notOffered');
  s.build.choices = ['goldTop', 'pure2', 'rainbow'];
  assert(R.chooseCommission(s, 'goldTop').ok);
  var top = s.walls.front[0].length - 1;
  set(s, 'front', 0, top, 'G'); set(s, 'front', 1, top, 'G');
  assert.deepEqual(R.commissionProgress(s), { id: 'goldTop', done: false, have: 2, need: 5, text: 'commission.goldTop', label: C.commissions.pool[4].label });
  full(s); for (var c = 0; c < 5; c++) s.walls.front[c][top].t = 'G';
  assert(R.commissionProgress(s).done); assert.equal(R.summary(s).commission.id, 'goldTop');
  var b = R.fire(s).filter(function (e) { return e.kind === 'seal'; })[0].building;
  assert.equal(b.stars, 3, 'sealed + never fell + commission'); assert.deepEqual(b.commission, { id: 'goldTop', done: true });
  var t = kid(6); assert.deepEqual(R.commissionChoices(t), R.commissionChoices(kid(6)), 'no rng: still the same cards every time');
  t.build.choices = ['rainbow', 'everyWall', 'silverSill']; R.chooseCommission(t, 'rainbow');
  gems(t, 'front', [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]], ['l', 'j', 'p', 't', 't']);
  assert.equal(R.commissionProgress(t).have, 4); t.walls.front[4][1].t = 'k'; assert(R.commissionProgress(t).done);
});

test('spire dare: opens per CONFIG.spire.opens, gems only, one a day, an extra star, never auto-filled', function () {
  on('spire'); assert.equal(C.spire.opens, 'anytime');
  var early = kid(6); assert.equal(R.spireSlots(early).length, 3, 'shipped setting: the dare is open from the first day');
  C.spire.opens = 'wallsFull';
  var s = kid(6);
  assert.equal(s.spire.length, 3); assert.equal(R.spireSlots(s).length, 0);
  fillAll(s); R.addPiece(s, 'G'); R.addPiece(s, 't'); R.addPiece(s, 'p');
  assert.equal(R.spireSlots(s).length, 3); assert(R.summary(s).spire.open);
  assert(!R.legalSlots(s).some(function (x) { return x.wall === 'spire'; }), 'legalSlots is unchanged');
  assert.equal(R.place(s, 0, 'spire', 0, 0).reason, 'gemsOnly');
  assert(R.place(s, 1, 'spire', 0, 0).ok); assert.equal(R.place(s, 1, 'spire', 1, 0).reason, 'slot', 'one a day');
  R.autoPlace(s); assert.equal(s.spire.filter(Boolean).length, 1);
  for (var i = 1; i < 3; i++) { newDay(s); R.addPiece(s, 'k'); assert(R.place(s, s.tray.length - 1, 'spire', i, 0).ok); }
  s.free = s.free.map(function (x, j) { return x || { id: 7100 + j, t: 'S' }; });
  assert(R.isComplete(s));
  var b = R.fire(s).filter(function (e) { return e.kind === 'seal'; })[0].building;
  assert(b.spireDone); assert.equal(b.stars, 3, 'sealed + never fell + spire'); assert.deepEqual(b.spire, ['t', 'k', 'k']);
});

test('spire dare: any straw burning anywhere topples it to the rubble', function () {
  on('spire');
  var s = kid(6); fillAll(s); R.addPiece(s, 't'); R.place(s, 0, 'spire', 1, 0);
  assert(!R.forecast(s).spireFall);
  s.walls.left[0][2] = { id: 801, t: 'W' };
  assert(R.forecast(s).spireFall);
  var ev = R.fire(s), sp = ev.filter(function (e) { return e.kind === 'spireFall'; })[0];
  assert.equal(sp.pieces.length, 1); assert.equal(sp.pieces[0].col, 1); assert.equal(sp.pieces[0].piece.t, 't');
  assert.equal(s.spire.filter(Boolean).length, 0); assert(s.rubble.some(function (p) { return p.t === 't'; }));
  assert(R.summary(s).spire.fell); assert(s.lastFire.spireFell);
});

test('stars are a balance that buys stickers', function () {
  var s = kid(6); full(s); R.fire(s);
  assert.equal(R.summary(s).starBalance, 2);
  assert.equal(R.spendStars(s, 3, { kind: 'flag' }).reason, 'notEnough');
  var r = R.spendStars(s, 2, { kind: 'flag', building: 1 });
  assert(r.ok); assert.equal(r.purchase.kind, 'flag'); assert.equal(r.purchase.building, 1);
  assert.equal(R.summary(s).starBalance, 0); assert.equal(R.summary(s).stars, 2, 'stars earned is unchanged');
  assert.equal(R.summary(s).purchases.length, 1);
});

test('no hoarding: endDay lays what is left in the tray', function () {
  on('autoLayAtNight');
  var s = kid(6); R.addPiece(s, 'G'); R.addPiece(s, 't'); s.rubble.push({ id: 802, t: 'S' });
  var r = R.endDay(s);
  assert.equal(r.record.autoLaid, 2); assert.equal(s.tray.length, 0); assert.equal(s.rubble.length, 1, 'rubble is not auto-laid');
  assert.equal(r.events.filter(function (e) { return e.kind === 'place'; }).length, 2);
  assert.equal(r.events[r.events.length - 1].kind, 'dayEnd');
});

test('at most 6 tray pieces carry into the next building; the rest go to the family landmark', function () {
  C.carryOverMax = 6;
  var s = kid(6); full(s); for (var i = 0; i < 10; i++) s.tray.push({ id: 900 + i, t: 'G' });
  var e = R.fire(s).filter(function (x) { return x.kind === 'seal'; })[0];
  assert.equal(s.tray.length, 6); assert.equal(e.gifted, 4); assert.equal(R.summary(s).family.stones, 4);
});

test('every 4 sealed buildings is a street and adds a set to the family landmark', function () {
  var s = kid(6), streets = [];
  for (var i = 0; i < 8; i++) { full(s); streets.push(R.fire(s).filter(function (x) { return x.kind === 'seal'; })[0].street); }
  assert.deepEqual(streets, [false, false, false, true, false, false, false, true]);
  assert.equal(R.summary(s).streets, 2); assert.equal(R.summary(s).family.sets, 2);
});

test('pull: needs made-right when switched on; pulls a day = straw a day for the age', function () {
  C.pullNeedsMadeRight = true; on('pullsMatchStrawCap');
  var s = kid(8); straw(s); straw(s); straw(s); newDay(s); straw(s);
  [0, 1, 3, 4].forEach(function (c) { R.forgive(s, 'front', c, 0); });
  assert.equal(R.pull(s, 'front', 0, 0).reason, 'notMadeRight');
  assert.equal(R.markMadeRight(s, 'left', 0, 0, 'mum').reason, 'notStraw');
  [0, 1, 3, 4].forEach(function (c) { assert(R.markMadeRight(s, 'front', c, 0, 'mum').ok); });
  assert.equal(R.at(s, 'front', 0, 0).madeRight, 'mum');
  assert.equal(R.summary(s).pullsLeftToday, 3);
  [0, 1, 3].forEach(function (c) { assert(R.pull(s, 'front', c, 0).ok); });
  assert.equal(R.pull(s, 'front', 4, 0).reason, 'pullCap');
  assert.equal(R.summary(kid(6)).pullsLeftToday, 2);
});

test('fairness is two extra straw at most, shown openly as mortar with its end day', function () {
  on('fairness');
  assert.equal(C.fairness.maxBonus, 2);
  var s = R.newChild({ age: 6 }), d = 0;
  function day() { d++; R.startDay(s, 1); }
  function fall() { for (var i = 0; i < R.summary(s).fallAt; i++) { s.today.W = 0; straw(s); } return R.fire(s).size; }
  assert.equal(R.summary(s).mortar, false); assert.equal(R.summary(s).mortarEndsDay, null);
  day(); fall(); R.endDay(s); day(); day(); fall(); R.endDay(s);
  while (d < 7) { day(); R.endDay(s); }
  assert.equal(R.summary(s).mortar, true); assert.equal(R.summary(s).fallAt, 4); assert.equal(R.summary(s).mortarEndsDay, 21);
  for (var k = 0; k < 3; k++) { day(); fall(); R.endDay(s); day(); R.endDay(s); }
  while (d < 15) { day(); R.endDay(s); }
  assert(R.summary(s).fairnessBonus <= 2, 'never more than two');
  while (d < R.summary(s).mortarEndsDay) { assert(R.summary(s).mortar); day(); R.endDay(s); }
  assert.equal(R.summary(s).mortar, false, 'ends on the day it said');
});

test('practice: the very first fire burns straw but knocks and fells nothing', function () {
  on('practiceFirstFire');
  var s = kid(8); assert(R.summary(s).practiceNext);
  straw(s); straw(s); straw(s); set(s, 'front', 0, 1, 'G');
  var ev = R.fire(s);
  assert.deepEqual(kinds(ev), ['burn', 'burn', 'burn', 'practice']); assert(ev.practice); assert.equal(ev.size, 'small');
  assert.equal(s.rubble.length, 0); assert.equal(R.at(s, 'front', 0, 1).t, 'G'); assert.equal(R.summary(s).slots.straw, 0);
  assert(!R.summary(s).walls.front.cracked); assert(!R.summary(s).practiceNext);
  newDay(s, 3); straw(s); straw(s); straw(s);
  assert.equal(R.fire(s).size, 'wallFall', 'the second fire is real');
});

test('blueprint ladder: one name per blueprint, ages start on different steps, sizes grow', function () {
  on('ladder');
  var a = kid(6), b = kid(8), c = kid(12);
  assert.deepEqual([a.bp.name, b.bp.name, c.bp.name], ['Cottage', 'Hall', 'Manor']);
  assert.deepEqual([R.tally(a).total, R.tally(b).total, R.tally(c).total], [32, 43, 54], 'the same first buildings as before');
  assert.equal(a.bp.id, 'cottage'); assert.deepEqual(a.bp.walls.front, { cols: 5, rows: 3 }); assert.equal(a.bp.rows, 3); assert.equal(a.bp.sideCols, 3);
  var names = [], sizes = [];
  for (var i = 0; i < 16; i++) { names.push(a.bp.name); sizes.push(R.tally(a).total + a.free.length); full(a); R.fire(a); }
  assert.deepEqual(names, ['Cottage', 'Farmhouse', 'Hall', 'Lodge', 'Manor', 'Manor', 'Chapel', 'Chapel', 'Guildhall', 'Guildhall', 'Abbey', 'Abbey', 'Castle', 'Castle', 'Castle', 'Cathedral']);
  for (i = 1; i < sizes.length; i++) assert(sizes[i] >= sizes[i - 1], 'never shrinks');
  assert.equal(sizes[0], 36); assert.equal(sizes[15], 110); assert.equal(R.summary(a).nextTierIn, 0);
  assert.equal(a.city[6].name, 'Chapel'); assert.equal(a.city[6].blueprint, 'chapel');
});

test('shaped blueprints: walls of different widths and heights, the door moves with the shape', function () {
  on('ladder'); C.shapes.enabled = true;
  var s = kid(6); full(s); R.fire(s);
  assert.equal(s.bp.name, 'Barn'); assert.equal(s.walls.front.length, 7); assert.equal(s.walls.left.length, 3);
  assert.equal(R.at(s, 'front', 3, 0), null); assert(!R.legalSlots(s).some(function (x) { return x.wall === 'front' && x.col === 3 && x.row === 0; }), 'door in the middle');
  assert(R.legalSlots(s).some(function (x) { return x.wall === 'front' && x.col === 2 && x.row === 0; }));
  assert.equal(R.tally(s).total, 20 + 9 + 9);
  full(s); R.fire(s);
  assert.equal(s.bp.name, 'Tower'); assert.equal(s.walls.front.length, 3); assert.equal(s.walls.front[0].length, 6); assert.equal(s.walls.left[0].length, 6);
  assert.equal(R.summary(s).walls.front.rows, 6); assert.equal(R.summary(s).walls.left.cols, 2);
  for (var i = 0; i < 3; i++) { s.today.W = 0; straw(s); }
  assert.deepEqual(strawAt(s), ['front:0:0', 'front:2:0', 'front:0:1'], 'straw skips the tower door');
  R.forgive(s, 'front', 0, 0); R.pull(s, 'front', 0, 0);
  assert.deepEqual(strawAt(s), ['front:0:0', 'front:2:0'], 'settling works on a tall wall');
  full(s); for (i = 0; i < 2; i++) { R.fire(s); full(s); }
  assert.doesNotThrow(function () { R.fire(s); R.summary(s); R.windows(s); R.commissionChoices(s); });
});
function strawAt(s) { var out = []; ['front', 'left', 'right'].forEach(function (w) { s.walls[w].forEach(function (col, c) { col.forEach(function (p, r) { if (p && p.t === 'W') out.push(w + ':' + c + ':' + r); }); }); }); return out.sort(function (x, y) { return x.split(':')[2] - y.split(':')[2] || x.split(':')[1] - y.split(':')[1]; }); }

test('gospel share plants a garden lamp, not a wall piece; names are kept; old L pieces still work', function () {
  on('gospel');
  var s = kid(8), r = R.addGospelShare(s, { name: 'Sam' });
  assert(r.ok); assert.equal(r.piece, null); assert.equal(s.tray.length, 0);
  assert.deepEqual(s.garden, [{ id: r.lamp.id, day: 1, name: 'Sam' }]); assert.equal(s.seeds[0].name, 'Sam');
  R.addGospelShare(s); assert.equal(R.summary(s).garden.length, 2); assert.equal(R.summary(s).seedList.length, 2); assert.equal(R.summary(s).seeds, 2);
  assert.equal(R.addNeighbour(s, { name: 'Mia' }).neighbour.name, 'Mia'); assert.equal(R.summary(s).neighbours[0].name, 'Mia');
  assert(R.addPiece(s, 'L').ok); assert(R.place(s, 0, 'front', 0, 0).ok, 'an old lamp piece can still be laid');
});

test('a saved game from before round 3 still loads and plays', function () {
  var s = kid(8); R.addPiece(s, 't'); R.autoPlace(s); straw(s);
  var old = JSON.parse(JSON.stringify(s));
  ['spire', 'garden', 'purchases', 'starBalance', 'family', 'fair', 'practiced'].forEach(function (k) { delete old[k]; });
  delete old.bp.walls; delete old.bp.door; delete old.bp.id; delete old.bp.spire; delete old.bp.nextIn; delete old.build.choices; delete old.today.spire;
  Object.keys(TUNED).forEach(function (k) { C[k] = JSON.parse(JSON.stringify(TUNED[k])); });
  assert.doesNotThrow(function () {
    R.summary(old); R.startDay(old, 2); R.addPiece(old, 'G'); R.autoPlace(old); R.forecast(old); R.fire(old); R.endDay(old);
    R.commissionChoices(old); R.spireSlots(old); R.addGospelShare(old); R.spendStars(old, 1, 'x');
  });
  assert.equal(R.summary(old).blueprint.name, 'Cottage'); assert.equal(R.summary(old).spire.total, 0);
});

test('nothing is destroyed with every round-3 feature on (300 rough days)', function () {
  Object.keys(TUNED).forEach(function (k) { C[k] = JSON.parse(JSON.stringify(TUNED[k])); });
  var s = R.newChild({ age: 8 }), seed = 11, given = 0;
  function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
  for (var d = 0; d < 300; d++) {
    R.startDay(s, d % 7);
    if (rnd() < 0.5) R.addPiece(s, 'W'); if (rnd() < 0.3) R.addPiece(s, 'W');
    ['G', 'S', 't', 'p', 't'].forEach(function (t) { var r = R.addPiece(s, t); if (r.ok) given += r.pieces.length; });   // v6: blocks, not acts
    R.autoPlace(s);
    var sp = R.spireSlots(s), gi = s.tray.map(function (p) { return p.t; }).indexOf('t');
    if (sp.length && gi >= 0) R.place(s, gi, 'spire', sp[0].col, 0);
    if (!R.isFireNight(s)) R.callFire(s);
    if (R.isFireNight(s)) R.fire(s);
    R.endDay(s);
  }
  var t = R.summary(s), held = s.tray.length + s.rubble.length + t.slots.filled - t.slots.straw + t.free.filled + t.spire.filled + t.family.stones;
  s.city.forEach(function (b) { held += b.gold + b.silver + b.gems; });
  assert.equal(held, given);
  assert(s.city.length > 3 && s.stats.wallFalls > 0);
});

/* ---------- v5: this week's three, the night account, designs, colours, animals, prayers ---------- */
function tuned(v6) { Object.keys(TUNED).forEach(function (k) { C[k] = JSON.parse(JSON.stringify(TUNED[k])); }); if (!v6) { C.blocksPerPiece = 1; C.knocksPerBurn = 1; } }   // v5 tests: one block an act
function pieceKinds(s) { var o = {}; s.tray.forEach(function (p) { o[p.t] = (o[p.t] || 0) + 1; }); return o; }

test('v5: gems a day are capped at 6 (was 9): 3 night cards + 2 seen + 1 twin', function () {
  tuned();
  assert.equal(TUNED.dailyCap.gem, 6);
  var s = kid(8);
  for (var i = 0; i < 6; i++) assert(R.addPiece(s, 't').ok);
  assert.equal(R.addPiece(s, 't').reason, 'cap');
  assert(R.addPiece(s, 'P').ok, 'pearls are never capped');
});

test('v5: owning up at night never adds straw and never adds a new piece (pearl rule, Nov 2026)', function () {
  tuned();
  var s = kid(6), before = R.tally(s).straw, strawToday = s.today.W;
  var r = R.nightAccount(s, { calm: 'not', kind: 'not', peace: 'not' });
  assert(r.ok); assert.deepEqual(r.not, ['calm', 'kind', 'peace']);
  assert.equal(R.tally(s).straw, before); assert.equal(s.today.W, strawToday);
  ['calm', 'kind', 'peace'].forEach(function (id) { var o = R.ownUp(s, id); assert(o.ok); assert.equal(o.pieces.length, 0); assert(o.shine); });
  assert.equal(R.ownUp(s, 'calm').reason, 'alreadyOwned');
  assert.equal(R.ownUp(s, 'work').reason, 'notOwned');
  assert.equal(s.tray.length, 0, 'empty rubble: thank-you words, the pearl shines, no new piece');
  assert.equal(R.tally(s).straw, before, 'still no straw');
  /* never worse off than hiding it: a "not" left unowned gets the same or less */
  var hid = kid(6); R.nightAccount(hid, { calm: 'not', kind: 'not', peace: 'not' });
  assert(hid.tray.length <= s.tray.length); assert.equal(R.tally(hid).straw, R.tally(s).straw);
});

test('v5: the sorry prayer\'s pearl brings back ONE block lost to fire, pearl-marked; none when the rubble is empty', function () {
  tuned();
  var s = kid(8); s.rubble.push({ id: 901, t: 'G' }, { id: 902, t: 'k', f: 'kindness' });
  var straw0 = R.tally(s).straw;
  R.nightAccount(s, { calm: 'not', kind: 'not', peace: 'good' });
  var o = R.ownUp(s, 'calm');
  assert(o.ok); assert.equal(o.pieces.length, 0, 'no new piece');
  assert.equal(o.restored.id, 902); assert(o.restored.pearl, 'pearl-marked');
  assert.equal(s.rubble.length, 1); assert.equal(s.tray.length, 1, 'one block back, to be laid next');
  assert.equal(R.tally(s).straw, straw0);
  R.ownUp(s, 'kind'); assert.equal(s.rubble.length, 0); assert.equal(s.tray.length, 2);
  s.pendingNight.not.push('work'); var e = R.ownUp(s, 'work');
  assert(e.ok && e.shine && !e.restored); assert.equal(s.tray.length, 2, 'empty rubble: no new piece');
});

/* ---------- quick log + grown-up check ---------- */
function check(s, keep, used) { return R.quickCheck(s, keep || {}, used || 0); }

test('quick: "I prayed" counts at once (max 5 a day); nothing else is given until a grown-up checks', function () {
  tuned();
  var s = kid(8);
  for (var i = 0; i < 6; i++) R.quickLog(s, 'prayer', 'me');
  assert.equal(s.prayers.n, 5);
  R.quickLog(s, 'great', 'sibling'); R.quickLog(s, 'tantrum', 'grownup');
  assert.equal(s.tray.length, 0); assert.equal(R.tally(s).straw, 0);
  assert.equal(R.summary(s).waiting, 2, 'prayers are not counted as waiting');
  assert.equal(R.quickLog(s, 'nope', 'me').reason, 'kind');
});

test('quick: cooled-down gem at most once a day', function () {
  tuned();
  var s = kid(8);
  R.quickLog(s, 'cooled', 'me'); R.quickLog(s, 'cooled', 'me'); R.quickLog(s, 'cooled', 'sibling');
  var r = check(s);
  assert.equal(r.pieces.length, 1); assert.equal(r.pieces[0].t, C.quick.cooledFruit);
  assert.equal(R.waitingFor(s).length, 0, 'all checked');
});

test('quick: great-attitude gem stays inside the daily gem cap', function () {
  tuned();
  var s = kid(8);
  for (var i = 0; i < C.dailyCap.gem - 1; i++) R.addPiece(s, 't');
  R.quickLog(s, 'great', 'me'); R.quickLog(s, 'great', 'grownup');
  var r = check(s);
  assert.equal(r.pieces.length, 1); assert.equal(s.today.gem, C.dailyCap.gem);
  assert(r.pieces[0].m.colour, 'the child colours it');
});

test('quick: unconfirmed bad never becomes straw; unconfirmed good arrives next morning', function () {
  tuned();
  var s = kid(8);
  R.quickLog(s, 'tantrum', 'sibling'); R.quickLog(s, 'disobeyed', 'grownup'); R.quickLog(s, 'negative', 'me');
  R.quickLog(s, 'great', 'sibling');
  newDay(s, 2);
  assert.equal(R.tally(s).straw, 0, 'no straw without a grown-up');
  assert.equal(s.tray.filter(function (p) { return p.m && p.m.quick === 'great' && p.m.late; }).length, 1);
  assert.equal(s.waiting.length, 0);
  var ev = R.startDay(kid(8), 1).events;   /* nothing waiting -> no late event */
  assert(!ev.some(function (e) { return e.kind === 'lateGems'; }));
});

test('quick: kept bad respects the straw caps; "not quite" gives nothing', function () {
  tuned();
  var s6 = kid(6);
  ['tantrum', 'disobeyed', 'negative'].forEach(function (k) { R.quickLog(s6, k, 'grownup'); });
  assert.equal(check(s6).straw.length, 1, 'age 6: one straw at night');
  var s8 = kid(8); straw(s8); straw(s8);
  ['tantrum', 'disobeyed', 'negative'].forEach(function (k) { R.quickLog(s8, k, 'grownup'); });
  assert.equal(check(s8).straw.length, 1, 'age 8: daily cap of 3 straw');
  var n = kid(8), e = R.quickLog(n, 'disobeyed', 'sibling').entry, keep = {}; keep[e.id] = false;
  var r = check(n, keep); assert.equal(r.straw.length, 0); assert.equal(r.notQuite, 1); assert.equal(R.tally(n).straw, 0);
});

test('quick: a tantrum then cooling down never pays better than a calm day', function () {
  tuned();
  function day(kinds, keepTantrum) {
    var s = kid(8), keep = {};
    kinds.forEach(function (k) { var e = R.quickLog(s, k, 'me').entry; if (k === 'tantrum' && !keepTantrum) keep[e.id] = false; });
    check(s, keep);
    return { good: s.tray.length, straw: R.tally(s).straw };
  }
  var calm = day(['cooled']), calmNone = day([]), both = day(['tantrum', 'cooled'], true), cooledFirst = day(['cooled', 'tantrum'], true);
  [both, cooledFirst].forEach(function (t) {
    assert(t.good <= calmNone.good && t.good <= calm.good, 'no more good pieces than a calm day');
    assert(t.straw >= calm.straw, 'and no less straw');
  });
  /* unchecked overnight: the waiting tantrum still blocks the cooled gem */
  var u = kid(8); R.quickLog(u, 'tantrum', 'sibling'); R.quickLog(u, 'cooled', 'me'); newDay(u, 2);
  assert.equal(u.tray.filter(function (p) { return p.m && p.m.quick; }).length, 0);
  /* "not quite" on the tantrum: the cooled gem comes */
  assert.equal(day(['tantrum', 'cooled'], false).good, 1);
});

test('v5: a bit of both gains nothing and loses nothing; good waits for the grown-up', function () {
  tuned();
  var s = kid(8);
  R.nightAccount(s, { calm: 'both', kind: 'good', peace: 'good' });
  assert.equal(s.tray.length, 0, 'nothing until a grown-up confirms');
  var r = R.confirmNight(s);
  assert(r.ok); assert.equal(r.pieces.length, 2);
  assert.deepEqual(s.tray.map(function (p) { return p.t; }), ['k', 'p'], 'kind words = kindness, make peace = peace');
  assert.equal(s.tray[0].m.card, 'kind');
  assert.equal(R.confirmNight(s).reason, 'nothingPending', 'one tap covers all three, once');
  assert.equal(R.tally(s).straw, 0);
});

test('v5: unconfirmed night gems arrive next morning anyway, on the night\'s own count', function () {
  tuned();
  var s = kid(8);
  for (var i = 0; i < 4; i++) R.addPiece(s, 'j');            // 4 gems already today
  R.nightAccount(s, { calm: 'good', kind: 'good', peace: 'good' });
  R.endDay(s);
  var ev = R.startDay(s, 2).events, late = ev.filter(function (e) { return e.kind === 'lateGems'; })[0];
  assert(late, 'they came in the morning'); assert.equal(late.pieces.length, 2, 'yesterday\'s cap of 6 still applied');
  assert(late.pieces.every(function (p) { return p.m.late; }));
  assert.equal(s.today.gem, 0, 'today starts with its own full count');
  assert.equal(s.pendingNight, null);
});

test('v5: seen gems: 2 a day; the focus card gives a twin (two pieces) once a day', function () {
  tuned();
  var s = kid(6);
  var a = R.seen(s, 'calm', 'calm');
  assert(a.ok && a.twin); assert.equal(a.pieces.length, 2); assert.equal(a.pieces[0].t, 't'); assert.equal(a.pieces[1].t, 't');
  var b = R.seen(s, 'calm', 'calm');
  assert(b.ok && !b.twin, 'the twin comes once a day');
  assert.equal(R.seen(s, 'kind', 'calm').reason, 'seenCap');
  assert.equal(s.tray.length, 3); assert.equal(R.seen(s, 'nope').reason, 'noCard');
  newDay(s); assert(R.seen(s, 'calm', 'calm').twin, 'a new day, a new twin');
});

test('v5: a twin gem is two pieces, so a twin + one more is NOT a window; three are', function () {
  tuned();
  var s = kid(6);
  R.seen(s, 'calm', 'calm');
  R.place(s, 0, 'front', 0, 0); R.place(s, 0, 'front', 1, 0);
  assert.equal(R.windows(s).total, 0);
  R.addPiece(s, 't'); R.place(s, 0, 'left', 0, 0);
  assert.equal(R.windows(s).total, 0, 'not in a line');
});

test('v5: a gem\'s colour is chosen at placing; three the same still make a pure window', function () {
  tuned();
  var s = kid(6);
  R.addPiece(s, 't', { card: 'calm' }); R.addPiece(s, 'k', { card: 'kind' }); R.addPiece(s, 'p', { card: 'peace' }); R.addPiece(s, 'G');
  s.tray.slice(0, 3).forEach(function (p) { assert(R.setColour(s, p.id, 'f').ok); });
  assert.equal(R.setColour(s, s.tray[3].id, 'f').reason, 'notGem');
  assert.equal(R.setColour(s, s.tray[0].id, 'zz').reason, 'colour');
  assert.equal(s.tray[1].m.card, 'kind', 'the card badge is kept');
  R.place(s, 0, 'front', 0, 0); R.place(s, 0, 'front', 1, 0); R.place(s, 0, 'front', 3, 0);
  assert.equal(R.windows(s).total, 0, 'the door breaks the line');
  R.addPiece(s, 'S'); R.addPiece(s, 'S');
  var w = R.windows(s); assert.equal(w.pure, 0);
  s = kid(6); ['t', 'k', 'p'].forEach(function (c) { R.addPiece(s, c); }); s.tray.forEach(function (p) { R.setColour(s, p.id, 'e'); });
  R.place(s, 0, 'left', 0, 0); R.place(s, 0, 'left', 0, 1); R.place(s, 0, 'left', 0, 2);
  w = R.windows(s); assert.equal(w.total, 1); assert.equal(w.pure, 1); assert.equal(w.list[0].fruit, 'gentleness');
});

test('v5: designs: pick only while the building is empty; 3 open, one more every 2 sealed, then named blueprints', function () {
  tuned();
  var s = kid(6);
  var open = R.designs(s).filter(function (d) { return d.open; }).map(function (d) { return d.id; });
  assert.deepEqual(open, ['cottage', 'tower', 'barn']);
  assert(R.chooseDesign(s, 'tower').ok); assert.equal(s.bp.style, 'tower'); assert.equal(s.walls.front.length, 5);   // v6: 5 narrow columns (v5: 3)
  assert.equal(R.chooseDesign(s, 'chapel').reason, 'locked');
  assert.equal(R.chooseDesign(s, 'nope').reason, 'noDesign');
  R.addPiece(s, 'G'); R.place(s, 0, 'front', 0, 0);
  assert.equal(R.chooseDesign(s, 'barn').reason, 'notEmpty');
  for (var i = 0; i < 2; i++) { full(s); R.fire(s); }
  assert.equal(s.sealed, 2); assert(R.isEmptyBuilding(s));
  assert.equal(s.bp.style, 'tower', 'the next building starts as the same design');
  assert(R.designs(s).filter(function (d) { return d.id === 'chapel'; })[0].open);
  assert(!R.designs(s).filter(function (d) { return d.id === 'lighthouse'; })[0].open);
  assert(R.chooseDesign(s, 'chapel').ok); assert.equal(s.bp.spire, 4, 'chapel has a steeple');
  assert.equal(s.city[0].style, 'tower');
  for (i = 0; i < 4; i++) { full(s); R.fire(s); }
  var d = R.designs(s);
  assert(d.filter(function (x) { return !x.named; }).every(function (x) { return x.open; }), 'all six after 6 sealed');
  assert(!d.filter(function (x) { return x.named; })[0].open);
  full(s); R.fire(s); full(s); R.fire(s);
  assert(d = R.designs(s).filter(function (x) { return x.id === 'bp1'; })[0], d.open);
  assert(R.chooseDesign(s, 'bp1').ok); assert.equal(s.bp.style, 'lighthouse'); assert.equal(s.bp.tier, 1, 'grown by a row');
});

test('v6: every design is about 56 slots at age 6, 80 at age 8, 120 at age 12 (twice v5)', function () {
  tuned();
  [[6, 56], [8, 80], [12, 120]].forEach(function (x) {
    var s = kid(x[0]); s.sealed = 99;   // every design open, so each one is really laid
    R.designs(s).filter(function (d) { return !d.named; }).forEach(function (d) {
      R.chooseDesign(s, d.id); var n = R.tally(s).total + s.free.length;
      assert(Math.abs(n - x[1]) <= 1, d.id + ' at age ' + x[0] + ' has ' + n); assert.equal(n, d.slots);
    });
  });
});

test('v5: roof and door colours are kept with the building in the City', function () {
  tuned();
  var s = kid(6); R.chooseDesign(s, 'barn'); R.setLook(s, { roof: 'red', door: 'blue' });
  full(s); R.fire(s);
  assert.deepEqual(s.city[0].look, { roof: 'red', door: 'blue' }); assert.equal(s.city[0].style, 'barn');
  assert.deepEqual(s.build.look, { roof: 'red', door: 'blue' }, 'the next building starts with the same colours');
});

test('v5: animals: first wall -> 1, all walls -> 2, sealed -> 3; they wait on the Rock if a wall falls', function () {
  tuned(); C.practiceFirstFire = false; C.caveInGraceDays = 0;
  var s = kid(6); R.chooseDesign(s, 'cottage');
  assert.equal(R.inviteAnimal(s, 'lamb').reason, 'noRoom');
  fillWall(s, 'front'); R.addPiece(s, 'S'); R.place(s, 0, 'left', 0, 0);   // a placement notices the full wall
  assert.equal(R.animals(s).peak, 1); assert(R.inviteAnimal(s, 'lamb').ok); assert.equal(R.inviteAnimal(s, 'cat').reason, 'noRoom');
  assert.equal(R.inviteAnimal(s, 'dragon').reason, 'kind');
  fillWall(s, 'left'); fillWall(s, 'right'); R.animals(s);
  assert(R.inviteAnimal(s, 'cat').ok); assert.deepEqual(R.animals(s).home, ['lamb', 'cat']);
  /* a wall falls: nobody is lost, they wait on the Rock */
  ['front', 'left', 'right'].forEach(function (w) { s.walls[w].forEach(function (col) { col.forEach(function (p, r) { if (p && r === 0 && w === 'front') col[r] = { id: s.nextId++, t: 'W', seq: ++s.seq }; }); }); });
  var ev = R.fire(s);
  assert.equal(ev.size, 'wallFall');
  var a = R.animals(s); assert.deepEqual(a.invited, ['lamb', 'cat']); assert.deepEqual(a.home, ['lamb']); assert.deepEqual(a.onRock, ['cat']);
  fillWall(s, 'front'); a = R.animals(s); assert.deepEqual(a.home, ['lamb', 'cat'], 'back when it is rebuilt');
  s.free = s.free.map(function (x, i) { return { id: 9000 + i, t: 'S', seq: ++s.seq }; });
  for (var g = 0; g < 4; g++) { R.fire(s); if (s.city.length) break; fillAll(s); s.free = s.free.map(function (x, i) { return { id: 9100 + g * 10 + i, t: 'S', seq: ++s.seq }; }); }
  assert.equal(s.city.length, 1); assert.deepEqual(s.city[0].animals, ['lamb', 'cat']); assert.equal(s.city[0].animalOwed, 1);
  assert(R.animals(s).canInvite && R.animals(s).forCity);
  var r = R.inviteAnimal(s, 'hen'); assert(r.ok); assert.equal(r.where, 'city');
  assert.deepEqual(s.city[0].animals, ['lamb', 'cat', 'hen']); assert.equal(R.animals(s).canInvite, false);
  assert.deepEqual(s.build.animals, [], 'the new building starts with no animals');
});

test('v5: prayers: at most 5 counted a day; every 10 hangs a lantern that never burns', function () {
  tuned();
  var s = kid(8), lit = 0;
  for (var i = 0; i < 7; i++) R.addPrayer(s);
  assert.equal(R.summary(s).prayers.n, 5);
  newDay(s); for (i = 0; i < 5; i++) if (R.addPrayer(s).lantern) lit++;
  assert.equal(lit, 1); assert.equal(R.summary(s).prayers.lanterns, 1); assert.equal(R.summary(s).prayers.ofLantern, 0);
  straw(s); straw(s); R.fire(s); assert.equal(R.summary(s).prayers.lanterns, 1);
});

test('v5: weekly review: 3 bonus pieces of any colour, outside the daily gem cap', function () {
  tuned();
  var s = kid(6);
  for (var i = 0; i < 6; i++) R.addPiece(s, 't');
  assert(R.addBonus(s, 'gem', 'l').ok); assert(R.addBonus(s, 'glass', 'j').ok); assert(R.addBonus(s, 'lantern').ok);
  assert.equal(R.addBonus(s, 'flag').reason, 'bonusCap');
  assert.equal(s.tray.length, 8); assert(s.tray[7].m.glass); assert.equal(R.summary(s).prayers.lanterns, 1);
  newDay(s); assert(R.addBonus(s, 'flag').ok); assert.equal(s.purchases[0].kind, 'flag');
});

test('v5: the day\'s sums: good pieces and straw', function () {
  tuned();
  var s = kid(8); R.addPiece(s, 'G'); R.addPiece(s, 'S'); R.seen(s, 'calm', 'calm'); R.addPiece(s, 'P'); straw(s);
  assert.equal(R.summary(s).todayGood, 5); assert.equal(R.summary(s).todayStraw, 1);
});

test('quick: tantrum checked first, cooled down checked later the same day -> still no cooled gem', function () {
  tuned();
  var s = kid(8);
  R.quickLog(s, 'tantrum', 'grownup'); check(s);
  R.quickLog(s, 'cooled', 'me'); var r = check(s);
  assert.equal(r.pieces.length, 0, 'tantrum + cooled never beats a calm day');
  var t = kid(8); R.quickLog(t, 'tantrum', 'grownup'); check(t); R.quickLog(t, 'cooled', 'me'); newDay(t);
  assert.equal(t.tray.filter(function (p) { return p.quick === 'cooled'; }).length, 0, 'nor by the morning arrival');
});

test('quick: great attitude has a daily limit', function () {
  tuned();
  var s = kid(8);
  for (var i = 0; i < 8; i++) R.quickLog(s, 'great', 'sibling');
  assert.equal(check(s).pieces.length, C.quick.greatPerDay);
});

test('night account runs once a day (no second pearl or second gems)', function () {
  tuned();
  var s = kid(8);
  assert(R.nightAccount(s, { calm: 'good', kind: 'not', peace: 'good' }).ok);
  assert.equal(R.nightAccount(s, { calm: 'good', kind: 'good', peace: 'good' }).reason, 'already');
  newDay(s); assert(R.nightAccount(s, { calm: 'good', kind: 'good', peace: 'good' }).ok, 'next day is fine');
});

/* ---- v6: each good act is a small stack of blocks; straw stays one ---- */
test('v6: a good act gives blocksPerPiece blocks (gold, silver, gem, bonus, quick log, twin)', function () {
  tuned(true); var B = C.blocksPerPiece; assert.equal(B, 2);
  var s = kid(8);
  ['G', 'S', 't'].forEach(function (t) { var r = R.addPiece(s, t, { x: 1 }); assert(r.ok); assert.equal(r.pieces.length, B); });
  assert.equal(s.tray.length, 3 * B);
  assert.equal(R.addBonus(s, 'gem', 'k').ok, true); assert.equal(s.tray.length, 4 * B);
  var tw = R.seen(s, 'calm', 'calm'); assert(tw.twin); assert.equal(tw.pieces.length, 2 * B, 'the twin is a second stack');
  R.quickLog(s, 'great', 'sibling'); assert.equal(check(s).pieces.length, B, 'a checked quick-log gem is a stack too');
});
test('v6: one straw act lands ONE straw block, and a burning bale knocks out one act of blocks', function () {
  tuned(true); C.practiceFirstFire = false; C.fairness.enabled = false;
  var s = kid(8), r = R.addPiece(s, 'W');
  assert(r.ok); assert.equal(r.pieces.length, 1); assert.equal(R.tally(s).straw, 1); assert.equal(s.tray.length, 0);
  var w = r.events[r.events.length - 1].wall, n = 0;
  for (var c = 0; c < s.walls[w].length; c++) for (var q = 0; q < s.walls[w][c].length; q++) if (!s.walls[w][c][q] && !(w === 'front' && c === s.bp.door.col && q === 0)) set(s, w, c, q, 'S');
  var ev = R.fire(s);
  assert.equal(ev.filter(function (e) { return e.kind === 'knock'; }).length, C.knocksPerBurn);
  assert.equal(s.rubble.length, C.knocksPerBurn, 'nothing destroyed: knocked blocks wait as rubble');
});
test('v6: daily caps count acts, not blocks', function () {
  tuned(true); var s = kid(8), B = C.blocksPerPiece;
  for (var i = 0; i < C.dailyCap.gem; i++) assert(R.addPiece(s, 'p').ok);
  assert.equal(R.addPiece(s, 'p').reason, 'cap'); assert.equal(s.tray.length, C.dailyCap.gem * B);
  assert(R.addPiece(s, 'G').ok); assert.equal(R.addPiece(s, 'G').reason, 'cap');
  for (i = 0; i < C.strawCapByAge[8]; i++) assert(R.addPiece(s, 'W').ok);
  assert.equal(R.addPiece(s, 'W').reason, 'cap'); assert.equal(R.tally(s).straw, C.strawCapByAge[8]);
});
test('v6: building sizes doubled, named blueprints too', function () {
  tuned(true);
  var s = kid(8), v5 = { bp1: 45, bp2: 40, bp3: 48, bp4: 40, bp5: 66, bp6: 47, bp7: 49, bp8: 66, bp9: 40, bp10: 48, bp11: 50, bp12: 40 };
  R.designs(s).forEach(function (d) {
    var was = d.named ? v5[d.id] : 40, k = d.slots / was;
    assert(k >= 1.85 && k <= 2.3, d.id + ' is ' + d.slots + ' slots, ' + k.toFixed(2) + 'x v5');
  });
});
test('v6: tapping lays one block at a time; the rest of the stack stays in the tray', function () {
  tuned(true); var s = kid(8);
  R.addPiece(s, 'S'); assert.equal(s.tray.length, 2);
  var sl = R.legalSlots(s)[0]; assert(R.place(s, 0, sl.wall, sl.col, sl.row).ok);
  assert.equal(s.tray.length, 1); assert.equal(s.tray[0].t, 'S');
});
test('v6: choosing a colour recolours the whole stack from that act; pure windows still need three the same', function () {
  tuned(true); var s = kid(8);
  R.addPiece(s, 't'); R.addPiece(s, 'k');
  assert(R.setColour(s, s.tray[0].id, 'l').ok);
  assert.deepEqual(s.tray.map(function (p) { return p.t; }), ['l', 'l', 'k', 'k']);
});
test('v6: the pearl from owning up still brings back ONE fire-lost block', function () {
  tuned(true); var s = kid(8);
  for (var i = 0; i < 4; i++) s.rubble.push({ id: 800 + i, t: 'S' });
  R.nightAccount(s, { calm: 'not', kind: 'good', peace: 'good' });
  var o = R.ownUp(s, 'calm'); assert(o.ok);
  assert.equal(s.rubble.length, 3); assert.equal(s.tray.length, 1); assert(s.tray[0].pearl);
});

/* ---------- v7: one pile for the day (precious stones / burns up), turned into blocks at night ---------- */
function blocks(s) { return s.tray.length; }
test('v7 pile: a seen card waits for the night check (nothing in the tray in the day); prayer counts at once', function () {
  tuned(true); var s = kid(8);
  assert(R.quickLog(s, 'seen', 'me', '', { card: 'calm', focus: 'kind' }).ok);
  R.quickLog(s, 'prayer', 'me');
  assert.equal(blocks(s), 0); assert.equal(s.prayers.n, 1);
  assert.equal(R.quickLog(s, 'seen', 'me', '', { card: 'nope' }).reason, 'noCard');
  var r = check(s); assert.equal(r.pieces.length, C.blocksPerPiece); assert.equal(r.pieces[0].t, R.cardDef('calm').fruit);
});
test('v7 pile: seen cards still capped at 2 a day; the focus card still gives its twin once', function () {
  tuned(true); var s = kid(8);
  ['calm', 'calm', 'kind', 'peace'].forEach(function (c) { R.quickLog(s, 'seen', 'sibling', '', { card: c, focus: 'calm' }); });
  var p = R.pileCount(s);
  var r = check(s);
  assert.equal(r.pieces.length, 3 * C.blocksPerPiece, '2 seen + 1 twin');
  assert.equal(r.pieces.filter(function (q) { return q.m.twin; }).length, 2 * C.blocksPerPiece, 'first block of the act is marked twin, plus the twin stack');
  assert.equal(p.blocks, r.pieces.length, 'the pile count equals what Keep all gives');
  R.quickLog(s, 'seen', 'me', '', { card: 'kind', focus: 'calm' });
  assert.equal(check(s).pieces.length, 0, 'still 2 a day after a second check');
});
test('v7 pile: count equals Keep all with every cap (great 2, cooled once and not on a tantrum day, night straw cap)', function () {
  tuned(true);
  [6, 8, 12].forEach(function (age) {
    var s = kid(age);
    ['great', 'great', 'great', 'cooled', 'cooled', 'tantrum', 'rude', 'fight', 'lie', 'other', 'disobeyed', 'negative'].forEach(function (k) { R.quickLog(s, k, 'grownup'); });
    R.quickLog(s, 'seen', 'me', '', { card: 'work', focus: 'work' });
    var p = R.pileCount(s), before = JSON.stringify(s);
    assert.equal(JSON.stringify(s), before, 'counting changes nothing');
    var straw0 = R.tally(s).straw, r = check(s);
    assert.equal(p.blocks, r.pieces.length, 'blocks age ' + age); assert.equal(p.straw, r.straw.length, 'straw age ' + age);
    assert.equal(r.straw.length, C.quick.nightStrawByAge[age === 6 ? 6 : age], 'night straw cap age ' + age);
    assert.equal(R.tally(s).straw - straw0 >= 0, true);
    assert.equal(r.pieces.filter(function (q) { return q.m.quick === 'cooled'; }).length, 0, 'no cooled gem on a kept-tantrum day');
    assert.equal(r.pieces.filter(function (q) { return q.m.quick === 'great'; }).length, 2 * C.blocksPerPiece, 'great 2 a day');
  });
});
test('v7 pile: unchecked burns-up taps never become straw; unchecked seen arrives next morning', function () {
  tuned(true); var s = kid(8);
  ['rude', 'fight', 'lie', 'other'].forEach(function (k) { R.quickLog(s, k, 'sibling'); });
  R.quickLog(s, 'seen', 'me', '', { card: 'kind' });
  newDay(s, 2);
  assert.equal(R.tally(s).straw, 0);
  assert.equal(s.tray.filter(function (q) { return q.m && q.m.seen && q.m.late; }).length, C.blocksPerPiece);
});

/* ---- nearby extras: one space out from the template ---- */
function give(s, n) { for (var i = 0; i < n; i++) s.tray.push({ id: s.nextId++, t: 'S' }); }
test('extras: only one space out, never inside, and only with support under them', function () {
  var s = kid(6); give(s, 3);
  var xs = R.extraSlots(s);
  assert(xs.length > 0, 'some nearby spots on an empty plot');
  xs.forEach(function (q) {
    assert.equal(q.row, 0, 'on an empty plot only ground-level spots have support');
    var C2 = s.walls[q.wall].length, out = (q.col < 0 || q.col >= C2 ? 1 : 0) + (q.row >= s.walls[q.wall][0].length ? 1 : 0) + q.out;
    assert.equal(out, 1, 'exactly one space out: ' + JSON.stringify(q));
    assert(q.col >= -1 && q.col <= C2);
  });
  assert(!xs.some(function (q) { return q.wall === 'front' && q.out === 1 && q.col === 2; }), 'the doorway stays clear');
  assert(!R.place(s, 0, 'front', -2, 0, 0).ok, 'two spaces out is refused');
  assert(!R.place(s, 0, 'front', 1, 1, 0).ok, 'a template slot is not an extra');
  assert(!R.place(s, 0, 'front', 0, 1, 1).ok, 'no floating porch stone');
  assert(!R.place(s, 0, 'front', 0, 3, 0).ok, 'nothing above an empty column');
  assert(R.place(s, 0, 'front', 0, 0, 1).ok, 'porch stone on the ground');
  assert(R.place(s, 0, 'front', 0, 1, 1).ok, 'and one on top of it');
  assert(R.place(s, 0, 'left', 3, 0, 0).ok, 'widen the left wall at the back');
  assert.equal(s.extras.length, 3);
  assert.equal(R.summary(s).slots.filled, 0, 'extras are not template slots');
  set(s, 'front', 0, 0, 'S'); set(s, 'front', 0, 1, 'S'); set(s, 'front', 0, 2, 'S');
  assert(R.extraSlots(s).some(function (q) { return q.wall === 'front' && q.col === 0 && q.row === 3 && q.out === 0; }), 'a chimney spot once the column is full');
});
test('extras: straw never lands on an extra, and an extra cannot take straw', function () {
  var s = kid(6); give(s, 2);
  R.place(s, 0, 'right', -1, 0, 0); R.place(s, 0, 'front', 4, 0, 1);
  for (var i = 0; i < 2; i++) { var e = straw(s); assert(e.kind === 'strawLand' && e.out == null && e.col >= 0 && e.col < s.walls[e.wall].length); }
  assert(s.extras.every(function (x) { return x.p.t !== 'W'; }));
  s.rubble.push({ id: s.nextId++, t: 'W' });
  assert.equal(R.placeRubble(s, s.rubble.length - 1, 'left', 3, 0, 0).reason, 'strawNotExtra');
});
test('extras: they belong to their wall and fall with it to the rubble', function () {
  var s = kid(6); give(s, 3);
  R.place(s, 0, 'left', 3, 0, 0); R.place(s, 0, 'left', 1, 0, 1); R.place(s, 0, 'front', 0, 0, 1);
  set(s, 'left', 0, 0, 'W'); set(s, 'left', 1, 0, 'W'); set(s, 'left', 2, 0, 'W');
  var ev = R.fire(s), fall = ev.filter(function (e) { return e.kind === 'wallFall'; })[0];
  assert.equal(fall.wall, 'left');
  assert.equal(fall.pieces.filter(function (q) { return q.extra; }).length, 2, 'both left extras fell');
  assert.equal(s.extras.length, 1); assert.equal(s.extras[0].wall, 'front', 'the front extra still stands');
  assert.equal(s.rubble.length, 2);
});
test('extras: a chimney stone on top of burning straw is knocked off', function () {
  var s = kid(6); give(s, 1);
  set(s, 'right', 0, 0, 'S'); set(s, 'right', 0, 1, 'S'); set(s, 'right', 0, 2, 'W');
  assert(R.place(s, 0, 'right', 0, 3, 0).ok);
  var k = R.fire(s).filter(function (e) { return e.kind === 'knock'; });
  assert.equal(k.length, 1); assert(k[0].extra && k[0].row === 3);
  assert.equal(s.extras.length, 0);
});
test('extras: sealing needs only the template; extras go to the City copy', function () {
  var s = kid(6); give(s, 2);
  R.place(s, 0, 'front', 0, 0, 1); R.place(s, 0, 'left', 3, 0, 0);
  fillAll(s); s.free = s.free.map(function () { return { id: s.nextId++, t: 'S' }; });
  assert(R.isComplete(s));
  var ev = R.fire(s), sealEv = ev.filter(function (e) { return e.kind === 'seal'; })[0];
  assert(sealEv, 'sealed with extras laid');
  assert.equal(sealEv.building.extras.length, 2);
  assert.equal(s.extras.length, 0, 'the next building starts with none');
  var t = kid(6); fillAll(t); t.free = t.free.map(function () { return { id: t.nextId++, t: 'S' }; });
  assert(R.fire(t).some(function (e) { return e.kind === 'seal'; }), 'and without any extras');
});
test('extras: capped at about a quarter of the template', function () {
  var s = kid(6), cap = R.summary(s).extras.cap;
  assert.equal(cap, Math.floor(32 * 0.25));
  give(s, cap + 1);
  for (var i = 0; i < cap; i++) { var q = R.extraSlots(s)[0]; assert(R.place(s, 0, q.wall, q.col, q.row, q.out).ok); }
  assert.equal(R.extraSlots(s).length, 0, 'no more spots at the cap');
  assert.equal(R.place(s, 0, 'right', 3, 0, 0).reason, 'extraCap');
  assert(R.legalSlots(s).length > 0, 'the template is still open');
});
test('extras: an old save with no extras still loads and plays', function () {
  var s = kid(6); delete s.extras;
  var old = JSON.parse(JSON.stringify(s));
  assert.equal(R.summary(old).extras.n, 0);
  give(old, 1); assert(R.place(old, 0, 'front', 0, 0, 1).ok);
  var o2 = JSON.parse(JSON.stringify(s)); set(o2, 'left', 0, 0, 'W'); o2.today.pulls = 0;
  o2.walls.left[0][0].forgiven = true; o2.walls.left[0][0].madeRight = true;
  R.pull(o2, 'left', 0, 0); R.fire(o2);
  assert(Array.isArray(o2.extras));
});

console.log(passed + ' tests passed' + (process.exitCode ? ', SOME FAILED' : ''));
