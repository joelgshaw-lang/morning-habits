// The painted farm (Nov 2026): the same farm, drawn as a tilted grid of squares on a painted paddock.
// Everything the child owns (buildings, decorations, animals, garden beds) sits on a square and can be moved.
// It only draws and arranges: coins, stars, the shop, feeding and selling all stay in farm.js.
//
// Saved on each farm as f.world (the old flat farm ignores it, so switching back loses nothing):
//   n        grid size (6 to 10 squares a side on the starter land; grows as the farm fills up, never shrinks)
//   land     which land the child has bought: 0 or missing = starter, 1 = meadow, 2 = river, 3 = hilltop (see LAND)
//   landV    2 once land uses the 24 Nov 2026 numbers (see landOf)
//   at       { pieceId: [i, j] } where each piece sits (its back corner square)
//   beds     [{ id, crop, growth }] garden beds; crop is null (bare soil) or a key of CROPS
//   movesDay / movesUsed   build moves used today
//   setupDone  true once the child has finished their one-time free set-up (until then, moves are unlimited)
//   cropDay  the last day the crops grew (they grow once on each day the jobs are done)

const ART = 'farm-art/';

// seed: coins to plant · grow: job days until ripe · yield: how many are picked · good: what goes in the basket
export const CROPS = {
  carrots: { name: 'Carrots', icon: '🥕', seed: 5, grow: 2, yield: 3, good: 'carrot', level: 1 },
  wheat: { name: 'Wheat', icon: '🌾', seed: 6, grow: 3, yield: 4, good: 'wheat', level: 1 },
  sunflowers: { name: 'Sunflowers', icon: '🌻', seed: 10, grow: 4, yield: 4, good: 'sunflower', level: 2 },
};
export const CROP_GOODS = {
  carrot: { icon: '🥕', name: 'Carrot', price: 5 },
  wheat: { icon: '🌾', name: 'Wheat', price: 6 },
  sunflower: { icon: '🌻', name: 'Sunflower', price: 10 },
};
export const BED = { price: 40, stars: 4 };

// Land (Nov 2026): the starter land grows by itself up to 10 squares a side. After that, bigger land is bought in the shop.
// Buying it makes the paddock bigger straight away. Every square keeps its number, so everything stays exactly where
// it was (the new squares are added along the front edges, where there is the most room).
// 24 Nov 2026 (Joel): a cheaper first step (Meadow land), and every land has its own painted picture around the edges.
export const LAND = [
  { name: 'Starter land', max: 10, ground: 'ground.jpg' },
  { name: 'Meadow land', max: 12, ground: 'ground-meadow.jpg' },
  { name: 'River land', max: 14, ground: 'ground-river.jpg' },
  { name: 'Hilltop land', max: 16, ground: 'ground-hills.jpg' },
];
/** Which land this farm has. Farms saved before 24 Nov 2026 counted Bigger land as 1 and Biggest as 2: they move up one
 *  (Meadow land was slotted in below them), so nobody loses land. */
export function landOf(w) {
  if (!w) return 0;
  if (!w.landV) { if (w.land) { w.land += 1; w.n = Math.max(w.n, landMax(w)); } w.landV = 2; }
  return w.land || 0;
}
export const landMax = (w) => LAND[Math.min(LAND.length - 1, w?.land || 0)].max;
/** Buys the next land: the paddock grows to its full size at once. */
export function growLand(w) {
  w.land = Math.min(LAND.length - 1, landOf(w) + 1);
  w.n = Math.max(w.n, landMax(w));
}
export const maxBeds = (level) => level + 1;   // 2 beds on a Little Coop farm, up to 5 on a Dream Farm

// img: picture · s: squares along each side · w: picture width in squares · dy: how far the foot sits below the front corner
// back: prefers the back of the farm, so tall things don't hide small ones
const PIECE = {
  hut: { img: 'hut', s: 1, w: 1, dy: 0.1, back: 1, name: 'shed' },
  house: { img: 'house', s: 2, w: 2.25, dy: 0.04, back: 1, name: 'farmhouse' },
  manor: { img: 'manor', s: 2, w: 2.2, dy: 0.06, back: 1, name: 'big farmhouse' },
  barn: { img: 'barn', s: 2, w: 1.9, dy: 0.06, back: 1, name: 'barn' },
  coop: { img: 'coop', s: 1, w: 1.2, dy: 0.12, back: 1, name: 'chicken coop' },
  mill: { img: 'windmill', s: 1, w: 0.62, dy: -0.12, back: 1, name: 'windmill' },
  well: { img: 'well', s: 1, w: 0.72, dy: -0.1, name: 'well' },
  stand: { img: 'stall', s: 1, w: 1.2, dy: 0.12, name: 'farm stand' },
  hive: { img: 'hive', s: 1, w: 0.62, dy: -0.08, name: 'beehive' },
  veg: { img: 'wheelbarrow', s: 1, w: 0.85, dy: -0.06, name: 'vegetable patch' },
  tree: { img: 'tree', s: 1, w: 0.95, dy: -0.12, name: 'apple tree' },
  pond: { img: 'pond', s: 1, w: 1.1, dy: 0.04, name: 'duck pond' },
  burrow: { img: 'burrow', s: 1, w: 1.05, dy: 0.02, name: 'wombat burrow' },
  gumtree: { img: 'gumtree', s: 1, w: 1.05, dy: -0.1, back: 1, name: 'gum tree' },
  paddock: { img: 'paddock', s: 2, w: 1.95, dy: 0.14, name: 'bush paddock' },
  rockpool: { img: 'rockpool', s: 2, w: 2, dy: 0.1, name: 'rock pool' },
  jetty: { img: 'jetty', s: 1, w: 1, dy: 0.06, name: 'jetty' },
  pony: { img: 'pony', s: 1, w: 0.8, dy: -0.1, name: 'pony' },
  dog: { img: 'dog', s: 1, w: 0.5, dy: -0.16, name: 'farm dog' },
  nest: { img: 'nest', s: 1, w: 0.6, dy: -0.16, name: 'nest' },
  bed: { img: 'soil', s: 1, w: 1.02, dy: 0.13, name: 'garden bed' },
  sunflowerclump: { img: 'sunflowerclump', s: 1, w: 0.6, dy: -0.12, name: 'sunflowers' },
  tulips: { img: 'tulips', s: 1, w: 0.62, dy: -0.14, name: 'tulips' },
  fountain: { img: 'fountain', s: 1, w: 0.72, dy: -0.1, name: 'fountain' },
  pumpkin: { img: 'pumpkin', s: 1, w: 0.58, dy: -0.16, name: 'pumpkin' },
  kite: { img: 'kite', s: 1, w: 0.7, dy: -0.14, name: 'kite' },
  leafytree: { img: 'leafytree', s: 1, w: 0.9, dy: -0.12, name: 'tree' },
  mushroom: { img: 'mushroom', s: 1, w: 0.5, dy: -0.18, name: 'mushroom' },
  // Special land pieces (24 Nov 2026): bought in the shop, two squares each way, just for looks.
  beach: { img: 'beach', s: 2, w: 2.05, dy: 0.12, name: 'beach corner' },
  hill: { img: 'hill', s: 2, w: 2.05, dy: 0.12, back: 1, name: 'grassy hill' },
  wildflowers: { img: 'wildflowers', s: 2, w: 2.05, dy: 0.12, name: 'wildflower patch' },
  bush: { img: 'bush', s: 2, w: 2.05, dy: 0.12, back: 1, name: 'little bush forest' },
  herd: { s: 1, name: 'animals' },
};
const DECOR_KIND = { '🌻': 'sunflowerclump', '🌷': 'tulips', '⛲': 'fountain', '🎃': 'pumpkin', '🪁': 'kite', '🌳': 'leafytree', '🍄': 'mushroom' };
const BUILT = ['barn', 'coop', 'mill', 'stand', 'hive', 'veg', 'pond', 'burrow', 'gumtree', 'paddock', 'rockpool', 'jetty', 'pony', 'dog', 'wildflowers', 'beach', 'hill', 'bush'];

// Animals that live at a building when it's built, and where they stand (in squares from the building's back corner).
// inside: they are drawn on top of the building (in the paddock, in the pool).
const HOMES = {
  gumtree: { spots: [[1.3, 0.75]] },
  burrow: { spots: [[1.25, 0.95]] },
  paddock: { spots: [[0.95, 0.95], [1.5, 1.25]], inside: true },
  pond: { spots: [[1.3, 0.6], [0.6, 1.35], [1.45, 1.3], [0.15, 0.95]] },
  rockpool: { spots: [[0.85, 0.8], [1.35, 0.85], [0.8, 1.35], [1.35, 1.4], [1.1, 1.1], [1.65, 1.15]], inside: true },
};
const HOME_OF = { koala: 'gumtree', wombat: 'burrow', roo: 'paddock', duck: 'pond' };
const homeFor = (type, KINDS, built) => {
  const h = KINDS[type].group === 'sea' ? 'rockpool' : HOME_OF[type];
  return h && built[h] ? h : null;
};
const HERD_SPOTS = { 1: [[0.6, 0.6]], 2: [[0.6, 0.6], [1.5, 0.75], [0.75, 1.5], [1.6, 1.65]] };

// ---------- painted animal pictures ----------
const BABY = { turkey: 'poult', komodo: 'komodobaby', pig: 'piglet', chicken: 'chick', duck: 'duckling', sheep: 'lamb', cow: 'calf', lizard: 'lizardbaby', croc: 'crocbaby', snake: 'snakebaby', dino: 'dinobaby' };
const IMG = { chicken: 'hen', roo: 'roojoey' };
// How wide each grown animal is on the farm, in squares.
const WIDE = { turkey: 0.55, komodo: 0.9, pig: 0.62, chicken: 0.4, duck: 0.4, sheep: 0.62, cow: 0.85, lizard: 0.55, snake: 0.5, croc: 0.85, dino: 0.8, koala: 0.5, roo: 0.55, wombat: 0.62,
  platypus: 0.62, kookaburra: 0.42, echidna: 0.55, crab: 0.5, squid: 0.42, turtle: 0.6, puffer: 0.45, octopus: 0.52, manta: 0.7 };

/** Same call as animalArt() in farm-art.js, so the farm can swap one for the other. */
export function paintArt(type, isGrown = true, wool = 0, mood = 'happy') {
  const own = !isGrown && BABY[type];
  const bubble = mood === 'sick' ? '<i class="pa-b">🤒</i>' : mood === 'sleepy' ? '<i class="pa-b">💤</i>' : mood === 'hungry' ? '<i class="pa-b">🍽️</i>' : '';
  return `<span class="art pa pa-${mood}${!isGrown && !own ? ' pa-small' : ''}"><img src="${ART}a-${own || IMG[type] || type}.webp" alt="" draggable="false">${bubble}</span>`;
}

// ---------- the grid: diamond squares, each --tw wide and 0.55 --tw tall ----------
// --tw (one square's width) is set in styles.css from the size of the field, so the farm fills whatever space it has.
// at(u, v, dy): the CSS position of grid point (u, v), dy squares lower. wide(w): a width of w squares.
function geo(n) {
  return { n,
    at: (u, v, dy = 0) => `left:calc(50% + ${((u - v) / 2).toFixed(3)} * var(--tw));top:calc(var(--cy) + ${((u + v - n) * 0.275 + dy).toFixed(3)} * var(--tw))`,
    wide: (w) => `width:calc(${w.toFixed(3)} * var(--tw))` };
}
const cells = (i, j, s) => { const out = []; for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) out.push(`${i + a},${j + b}`); return out; };

// Everything that should be on the farm right now, most important first (earlier pieces keep their square in a clash).
function wanted(f, KINDS) {
  const list = [{ id: 'home', kind: f.built.manor ? 'manor' : f.built.house ? 'house' : 'hut' }, { id: 'well', kind: 'well' }];
  for (const b of BUILT) if (f.built[b]) list.push({ id: b, kind: b });
  if (f.built.orchard) for (const n of [1, 2, 3]) list.push({ id: `orchard${n}`, kind: 'tree' });
  const w = f.world;
  for (const b of w.beds) list.push({ id: `bed:${b.id}`, kind: 'bed', bed: b });
  const count = {};
  for (const a of f.animals) count[a.type] = (count[a.type] || 0) + 1;
  for (const type of Object.keys(count)) if (!homeFor(type, KINDS, f.built)) list.push({ id: `herd:${type}`, kind: 'herd', type, s: count[type] > 1 ? 2 : 1 });
  if (f.nest.length) list.push({ id: 'nest', kind: 'nest' });
  for (const d of f.decor) if (DECOR_KIND[d]) list.push({ id: `decor:${d}`, kind: DECOR_KIND[d] });
  return list.map((p) => ({ s: PIECE[p.kind].s, ...p }));
}

// The best free square for a new piece: buildings go to the back, everything else to the middle and front,
// and everything likes a little room around it.
// The far left and right corners of the grid reach the painted trees at the edges of the picture, so nothing is put
// there (24 Nov 2026, Joel: animals walking on top of trees). A square (i, j) is in a corner when |i - j| is large.
const inCorner = (i, j, s, n) => Math.abs(i - j) + (s - 1) > n - 4 && n > 8;

function findSpot(p, fits, n, used) {
  let best = null, bestScore = Infinity;
  for (let i = 0; i <= n - p.s; i++) for (let j = 0; j <= n - p.s; j++) {
    if (!fits(i, j, p.s) || inCorner(i, j, p.s, n)) continue;
    const depth = i + j + p.s;
    let crowd = 0;
    for (let a = i - 1; a <= i + p.s; a++) for (let b = j - 1; b <= j + p.s; b++) if (used.has(`${a},${b}`)) crowd++;
    const score = (PIECE[p.kind].back ? depth : Math.abs(depth - n * 1.15) + 0.5) + Math.abs(i - j) * 0.3 + crowd * 0.7;
    if (score < bestScore) { bestScore = score; best = [i, j]; }
  }
  return best;
}

/** Works out where every piece sits (placing new ones, re-placing any that clash) and remembers it on f.world. */
export function layout(f, KINDS) {
  const w = (f.world ||= { n: 6, at: {}, beds: [{ id: 1, crop: null, growth: 0 }], nextBed: 2, landV: 2 });
  landOf(w);
  const list = wanted(f, KINDS);
  for (;;) {
    const used = new Set();
    const fits = (i, j, s) => i >= 0 && j >= 0 && i + s <= w.n && j + s <= w.n && cells(i, j, s).every((c) => !used.has(c));
    const pieces = [];
    let ok = true;
    for (const p of list) {
      let at = w.at[p.id];
      if (!at || !fits(at[0], at[1], p.s) || inCorner(at[0], at[1], p.s, w.n)) at = findSpot(p, fits, w.n, used);   // anything already in a corner moves in once
      if (!at) { ok = false; break; }
      cells(at[0], at[1], p.s).forEach((c) => used.add(c));
      pieces.push({ ...p, i: at[0], j: at[1] });
    }
    // Keep the farm roomy (at least 4 squares in 10 free) so there is always somewhere to move things: the land grows as it fills up.
    if ((!ok || used.size > w.n * w.n * 0.6) && w.n < landMax(w)) { w.n++; continue; }
    for (const p of pieces) w.at[p.id] = [p.i, p.j];
    return { w, pieces, used };
  }
}

/** Can this piece (or a new one-square piece when id is null) go with its FRONT square on (i, j)? Returns its back corner or null. */
export function spotFor(f, KINDS, id, i, j) {
  const { w, pieces, used } = layout(f, KINDS);
  const p = id ? pieces.find((x) => x.id === id) : { s: 1 };
  if (!p) return null;
  const own = id ? new Set(cells(p.i, p.j, p.s)) : new Set();
  const ai = i - p.s + 1, aj = j - p.s + 1;
  if (ai < 0 || aj < 0 || ai + p.s > w.n || aj + p.s > w.n) return null;
  return cells(ai, aj, p.s).every((c) => !used.has(c) || own.has(c)) ? [ai, aj] : null;
}

const ripe = (b) => !!b.crop && b.growth >= CROPS[b.crop].grow;
export const ripeBeds = (f) => (f.world?.beds || []).filter(ripe);

// ---------- drawing ----------
function pieceHTML(p, g, env) {
  const d = PIECE[p.kind];
  let img = d.img, tag = '';
  if (p.kind === 'bed') {
    const b = p.bed, c = CROPS[b.crop];
    img = !c ? 'soil' : ripe(b) ? b.crop : 'sprouts';
    if (c && !ripe(b)) { const left = c.grow - b.growth; tag = `<i class="w2-tag">${c.icon} ${left} more job day${left === 1 ? '' : 's'}</i>`; }
    if (ripe(b) && !env.mode.on) tag = '<i class="w2-tag ready">🧺 Pick me!</i>';
  }
  if (p.kind === 'nest') tag = `<i class="w2-tag">🥚 ${env.f.nest.length}</i>`;
  const style = `${g.at(p.i + p.s, p.j + p.s, d.dy)};${g.wide(d.w)};z-index:${Math.round((p.i + p.j + 2 * p.s) * 100)}`;
  const inner = `<img src="${ART}${img}.webp" alt="" draggable="false">${tag}`;
  if (env.mode.on) return `<button class="w2-it pick${env.mode.sel?.piece === p.id ? ' sel' : ''}" data-action="farm-pick" data-piece="${p.id}" style="${style}" aria-label="Move the ${d.name}">${inner}</button>`;
  if (p.kind === 'bed' && ripe(p.bed)) return `<button class="w2-it ripe" data-action="farm-bed" data-bed="${p.bed.id}" style="${style}" aria-label="Pick the ${CROPS[p.bed.crop].name.toLowerCase()}">${inner}</button>`;
  if (p.kind === 'pony') return `<button class="w2-it w2-pony" data-action="farm-pony" style="${style}" aria-label="Pony">${inner}</button>`;
  return `<div class="w2-it" style="${style}">${inner}</div>`;
}

// Up to a few animals of one kind standing together, with a number when there are more.
// Tall leafy pieces: animals next to one barely stroll, so they don't walk over the tree.
const TALL = new Set(['tree', 'gumtree', 'leafytree', 'bush', 'hill']);
function groupHTML(list, type, oi, oj, spots, g, env, baseZ = 0, nearTree = false) {
  const { KINDS, grown } = env;
  // Show first the ones that need something (ready to shear, then hungry), so a tap always reaches them.
  const order = [...list].sort((a, b) => env.needs(b) - env.needs(a) || a.id - b.id);
  const shown = order.slice(0, spots.length);
  let out = shown.map((a, k) => {
    const [du, dv] = spots[k], u = oi + du, v = oj + dv;
    const wide = (WIDE[type] || 0.5) * (grown(a) ? 1 : BABY[type] ? 0.72 : 0.7);
    const z = Math.max(Math.round((u + v) * 100) + 40, baseZ ? baseZ + 1 + k : 0);
    // Each animal strolls a little way along the squares and back, at its own pace (less room inside a paddock or pool).
    const reach = baseZ || nearTree ? 0.06 : 0.26, dur = 11 + (a.id % 7) * 1.3;
    return env.animalBtn(a, `${g.at(u, v)};${g.wide(wide)};z-index:${z};--delay:-${(a.id % 5) * 0.6}s;--wx:calc(var(--tw) * ${reach});--wy:calc(var(--tw) * ${(a.id % 2 ? reach : -reach) * 0.55});--dur:${dur.toFixed(1)}s;--wd:-${((a.id * 3.7) % dur).toFixed(1)}s`);
  }).join('');
  if (list.length > shown.length) {
    const far = spots[spots.length - 1];
    const name = type === 'chicken' ? 'hens' : KINDS[type].name.toLowerCase() + (/(sheep|fish)$/i.test(KINDS[type].name) ? '' : 's');
    out += `<span class="w2-badge" style="${g.at(oi + far[0] + 0.3, oj + far[1] + 0.3)}">${list.length} ${name}</span>`;
  }
  return out;
}

// Which squares glow for the thing that's picked up. Each is the square the piece's FRONT will stand on.
function targets(env, w, pieces, used) {
  const sel = env.mode.sel;
  if (!env.mode.on || !sel || env.movesLeft <= 0) return [];
  if (sel.seed) return pieces.filter((p) => p.kind === 'bed' && !p.bed.crop).map((p) => [p.i, p.j]);
  const p = sel.piece ? pieces.find((x) => x.id === sel.piece) : { s: 1 };
  if (!p) return [];
  const own = sel.piece ? new Set(cells(p.i, p.j, p.s)) : new Set();
  const out = [];
  for (let i = p.s - 1; i < w.n; i++) for (let j = p.s - 1; j < w.n; j++) {
    if (inCorner(i - p.s + 1, j - p.s + 1, p.s, w.n)) continue;
    if (cells(i - p.s + 1, j - p.s + 1, p.s).every((c) => !used.has(c) || own.has(c))) out.push([i, j]);
  }
  return out;
}

function trayHTML(env, w) {
  const { f, mode, movesLeft, coins, stars, level } = env;
  const emptyBed = w.beds.some((b) => !b.crop);
  const sel = mode.sel || {};
  const hint = movesLeft <= 0 ? 'No moves left today. More tomorrow, when your jobs are done!'
    : sel.seed ? (emptyBed ? 'Now tap a glowing garden bed.' : 'Your garden beds are all full.')
      : sel.piece || sel.newbed ? 'Now tap a glowing square.' : 'Tap something to move it, or pick seeds to plant.';
  const setup = !w.setupDone;   // the one-time set-up: as many moves as they like, until they say they're finished
  if (setup && mode.asking) return `<div class="w2-tray"><div class="w2-tray-top"><b>All finished setting up?</b><span>You get this big set-up once. After this it's a few moves a day.</span></div>
    <div class="w2-tray-btns"><button class="farm-btn small" data-action="farm-build" data-finish="no">Keep going</button><button class="farm-btn small feed" data-action="farm-build" data-finish="yes">✓ Yes, I'm finished</button></div></div>`;
  const seeds = Object.entries(CROPS).filter(([, c]) => level >= c.level).map(([id, c]) =>
    `<button class="farm-btn small${sel.seed === id ? ' sellhen' : ''}" data-action="farm-pick" data-seed="${id}" ${movesLeft <= 0 || coins < c.seed || !emptyBed ? 'disabled' : ''}>${c.icon} ${c.name} <small>🪙 ${c.seed}</small></button>`).join('');
  const more = w.beds.length < maxBeds(level)
    ? `<button class="farm-btn small${sel.newbed ? ' sellhen' : ''}" data-action="farm-pick" data-newbed="1" ${movesLeft <= 0 || coins < BED.price || stars < BED.stars ? 'disabled' : ''}>➕ Garden bed <small>🪙 ${BED.price} + ⭐ ${BED.stars}</small></button>` : '';
  return `<div class="w2-tray"><div class="w2-tray-top"><b>🔨 ${setup ? 'Set-up time! Move as many things as you like' : `${Math.max(0, movesLeft)} move${movesLeft === 1 ? '' : 's'} left today`}</b><span>${hint}</span></div>
    <div class="w2-tray-btns">${seeds}${more}<button class="farm-btn small feed" data-action="farm-build" data-finish="${setup ? 'ask' : ''}">✓ Done</button></div></div>`;
}

/**
 * The whole painted field.
 * env: { f, KINDS, grown, level, mode: { on, sel }, movesLeft, coins, stars, broken,
 *        animalBtn(animal, style) -> the tappable animal, needs(animal) -> 2 ready to shear / 1 hungry / 0 }
 */
export function worldHTML(env) {
  const { f, KINDS, mode } = env;
  const { w, pieces, used } = layout(f, KINDS);
  const g = geo(w.n);
  const byType = {};
  for (const a of f.animals) (byType[a.type] ||= []).push(a);
  let html = '';
  // Squares around each tall leafy piece, so herds next to a tree stay put.
  const treeNear = new Set();
  for (const p of pieces) if (TALL.has(p.kind)) for (let a = p.i - 1; a <= p.i + p.s; a++) for (let b = p.j - 1; b <= p.j + p.s; b++) treeNear.add(`${a},${b}`);
  const nearTree = (p) => cells(p.i, p.j, p.s).some((c) => treeNear.has(c));
  for (const p of pieces) {
    if (p.kind === 'herd') html += groupHTML(byType[p.type] || [], p.type, p.i, p.j, HERD_SPOTS[p.s], g, env, 0, nearTree(p));
    else html += pieceHTML(p, g, env);
  }
  for (const [type, list] of Object.entries(byType)) {
    const h = homeFor(type, KINDS, f.built);
    const p = h && pieces.find((x) => x.id === h);
    if (!p) continue;
    // Friends who share a home (the rock pool crew) each take the next free spot.
    const taken = (p.taken ||= { n: 0 });
    const spots = HOMES[h].spots.slice(taken.n, taken.n + (KINDS[type].group === 'sea' ? 1 : HOMES[h].spots.length));
    taken.n += KINDS[type].group === 'sea' ? 1 : 0;
    if (spots.length) html += groupHTML(list, type, p.i, p.j, spots, g, env, HOMES[h].inside ? Math.round((p.i + p.j + 2 * p.s) * 100) : 0);
  }
  // 🧑‍🌾 The child's own farmer (26 Nov 2026) stands by the farmhouse and strolls a little.
  const home = pieces.find((p) => p.id === 'home');
  if (env.me && home) html += `<div class="w2-me" style="${g.at(home.i + home.s + 0.35, home.j + home.s - 0.25, 0.02)};${g.wide(0.6)};z-index:${Math.round((home.i + home.j + 2 * home.s + 0.6) * 100)}">${env.me}</div>`;
  const glow = targets(env, w, pieces, used).map(([i, j]) => `<i class="w2-tile" data-action="farm-tile" data-i="${i}" data-j="${j}" style="${g.at(i + 0.5, j + 0.5)}"></i>`).join('');
  const ready = ripeBeds(f).length;
  const view = env.view || { u: 1, x: 0, y: 0 };
  const nextLand = LAND[landOf(w) + 1];
  const tight = !mode.on && nextLand && w.n >= landMax(w) && used.size > w.n * w.n * 0.5;
  return `
    <div class="field w2${mode.on ? ' building' : ''}">
      <div class="w2-stage" style="--n:${w.n};transform:translate(${view.x}px,${view.y}px) scale(${view.u})">
        <div class="w2-ground" style="background-image:url(${ART}${LAND[Math.min(LAND.length - 1, w.land || 0)].ground})"></div>${html}${glow}
        ${env.broken ? `<img class="w2-fox" src="${ART}fox.webp" alt="A fox at the broken fence">` : ''}
      </div>
      ${!f.animals.length ? '<div class="field-empty w2-empty">Your farm is waiting!<br>Get a 🥚 mystery egg from the 🛒 shop.</div>' : ''}
      ${mode.on ? '' : `<div class="w2-hud">
        <button class="w2-btn${w.setupDone ? '' : ' ready'}" data-action="farm-build">🔨 ${w.setupDone ? `Build <small>${Math.max(0, env.movesLeft)} move${env.movesLeft === 1 ? '' : 's'}</small>` : 'Set up my farm'}</button>
        ${env.townBtn ? '<button class="w2-btn w2-town" data-action="farm-town">🏘️ Town</button>' : ''}
        ${ready ? `<button class="w2-btn ready" data-action="farm-bed" data-bed="all">🧺 Pick ${ready > 1 ? 'everything' : 'it'}</button>` : ''}
        ${tight ? `<button class="w2-btn w2-hint" data-action="farm-shop">🌾 Getting crowded! ${nextLand.name} is in the 🛒 shop</button>` : ''}</div>`}
      <div class="w2-view">
        <button class="w2-round" data-action="farm-full" aria-label="${env.full ? 'Leave full screen' : 'Full screen'}">${env.full ? '✕' : '⛶'}</button>
      </div>
      <div class="w2-zoom">
        <button class="w2-round" data-action="farm-zoom" data-z="in" aria-label="Zoom in">➕</button>
        <button class="w2-round" data-action="farm-zoom" data-z="out" aria-label="Zoom out" ${view.u <= 1.01 ? 'disabled' : ''}>➖</button>
      </div>
    </div>${mode.on ? trayHTML(env, w) : ''}`;
}
