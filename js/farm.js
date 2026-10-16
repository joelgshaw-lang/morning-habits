import { animalArt, snakeArt } from './farm-art.js';

// The farm: coins from chores buy mystery eggs, feed, a fence, sheep, cows and buildings.
// Prices and growth times come from a 90-day simulation (docs/farm-economy.md): a new stage every one to
// three weeks, a few steady wins every day, and the farmhouse after about two months.
// Animals never die. Hungry animals just stop laying until they're fed. The fox only comes through a broken fence.

export const KINDS = {
  chicken: { name: 'Chicken', baby: 'Chick', babyIcon: '🐣', icon: '🐔', feed: 1, grow: 5, sound: 'cluck', small: true },
  duck: { name: 'Duck', baby: 'Duckling', babyIcon: '🐤', icon: '🦆', feed: 1, grow: 5, sound: 'quack', small: true },
  lizard: { name: 'Lizard', baby: 'Baby lizard', babyIcon: '🦎', icon: '🦎', feed: 1, grow: 5, sound: 'chirp', small: true, rare: 'Rare!', perk: 'Lizards eat the bugs, so hens sometimes lay a golden egg.' },
  croc: { name: 'Crocodile', baby: 'Baby crocodile', babyIcon: '🐊', icon: '🐊', feed: 2, grow: 8, sound: 'snap', small: true, rare: 'Super rare!', perk: 'Foxes are too scared to come near your farm.' },
  sheep: { name: 'Sheep', baby: 'Lamb', babyIcon: '🐑', icon: '🐑', feed: 2, grow: 10, sound: 'baa' },
  cow: { name: 'Cow', baby: 'Calf', babyIcon: '🐮', icon: '🐄', feed: 3, grow: 16, sound: 'moo' },
};

export const GOODS = {
  egg: { icon: '🥚', name: 'Egg', price: 2 },
  duckegg: { icon: '🦆🥚', name: 'Duck egg', price: 4 },
  golden: { icon: '🌟', name: 'Golden egg', price: 10 },
  wool: { icon: '🧶', name: 'Wool', price: 10 },
  milk: { icon: '🥛', name: 'Milk', price: 5 },
};

export const SHOP = [
  { id: 'sellhen', icon: '🐔', name: 'Sell a hen', price: -8, level: 1, does: 'Make room in the coop. A grown hen goes to a new farm for 8 coins.' },
  { id: 'egg', icon: '🥚', name: 'Mystery egg', price: 12, level: 1, does: "Hatch it to see what's inside! Usually a chicken… sometimes a duck, a lizard, a crocodile… or a cheeky snake!" },
  { id: 'repair', icon: '🪵', name: 'Fix the fence', price: 6, level: 1, does: 'Keeps the fox out for another week.' },
  { id: 'box', icon: '🎁', name: 'Mystery box', price: 20, level: 2, does: 'Food, an egg, golden corn, a lamb, a decoration… or even a calf!' },
  { id: 'lamb', icon: '🐑', name: 'Lamb', price: 60, level: 2, does: 'Feed it and it grows wool to shear and sell.' },
  { id: 'strong', icon: '🧱', name: 'Strong fence', price: 40, level: 2, building: true, does: 'Fence repairs last two weeks instead of one.' },
  { id: 'pond', icon: '💧', name: 'Duck pond', price: 80, level: 2, building: true, needsDuck: true, does: 'Happy ducks lay 2 eggs a day.' },
  { id: 'calf', icon: '🐮', name: 'Calf', price: 150, level: 3, does: 'Grows into a cow that gives milk, and one day has a calf of her own.' },
  { id: 'barn', icon: '🛖', name: 'Big barn', price: 200, level: 4, building: true, does: 'Room for 14 small animals, 4 sheep and 3 cows.' },
  { id: 'mill', icon: '⚙️', name: 'Windmill', price: 300, level: 4, needs: 'barn', building: true, does: 'Grinds feed: small animals eat free, and everyone else costs 1 coin less.' },
  { id: 'house', icon: '🏡', name: 'Farmhouse', price: 500, level: 4, needs: 'mill', building: true, does: 'The last piece of your dream farm! 🎉' },
];

const LEVELS = [null,
  { name: 'Little Coop', icon: '🐣', next: 'Grow 4 hens or ducks' },
  { name: 'Barnyard', icon: '🌾', next: 'Shear your first wool' },
  { name: 'Big Farm', icon: '🐑', next: 'Grow a calf into a cow' },
  { name: 'Dream Farm', icon: '🐄', next: 'Build the barn, windmill and farmhouse' },
];
const DECOR = ['🌻', '🌷', '⛲', '🎃', '🪁', '🌳', '🍄'];
const FENCE_DAYS = 7;
const BARNYARD_BIRDS = 4;
const FOX_CHANCE = 0.35;   // each day the fence is down
const CALF_EVERY = 14;     // milkings
const pad = (n) => String(n).padStart(2, '0');

function dayNum(key) { const [y, m, d] = key.split('-').map(Number); return Math.round(new Date(y, m - 1, d).getTime() / 86400000); }
const rnd = (n) => Math.floor(Math.random() * n);

export function freshFarm(today) {
  return { animals: [], basket: {}, nest: [], fenceDays: FENCE_DAYS, built: {}, decor: [], feedPacks: 5, spent: 0, sold: 0,
    lastDay: today, events: [], level: 1, sheared: 0, nextId: 1, gift: true };
}

export const grown = (a) => a.growth >= KINDS[a.type].grow;
const capOf = (f) => (f.built.barn ? { small: 14, sheep: 4, cow: 3 } : { small: 8, sheep: 2, cow: 1 });
const countOf = (f, group) => f.animals.filter((a) => (group === 'small' ? KINDS[a.type].small : a.type === group)).length;
const roomFor = (f, type) => { const g = KINDS[type].small ? 'small' : type; return countOf(f, g) < capOf(f)[g]; };
const feedCost = (f, a) => Math.max(0, KINDS[a.type].feed - (f.built.mill ? 1 : 0));
const hasGrown = (f, type) => f.animals.some((a) => a.type === type && grown(a));

// Days since the farm was last opened: eggs in the nest hatch, the fence wears out, and the fox may visit.
// The fox takes at most one animal per absence, so a few missed days never wipe out a farm.
export function catchUp(f, today) {
  const gap = Math.min(14, dayNum(today) - dayNum(f.lastDay || today));
  if (gap <= 0) return false;
  let foxCame = false;
  for (let i = 1; i <= gap; i++) {
    const hatchable = f.nest.filter((n) => dayNum(n.day) < dayNum(f.lastDay) + i);
    f.nest = f.nest.filter((n) => !hatchable.includes(n));
    hatchable.forEach(() => {
      if (!roomFor(f, 'chicken')) {
        f.basket.egg = (f.basket.egg || 0) + 1;
        f.events.push({ icon: '🪺', text: "The coop was full, so your nest egg went back in the basket." });
        return;
      }
      f.animals.push({ id: f.nextId++, type: 'chicken', growth: 0 });
      f.events.push({ icon: '🐣', text: 'An egg in the nest hatched into a chick!' });
    });
    // The fox only comes once the fence has been broken for a whole day, only takes grown birds,
    // and leaves small flocks (3 or fewer) alone.
    const brokenAlready = f.fenceDays === 0;
    f.fenceDays = Math.max(0, f.fenceDays - 1);
    const prey = f.animals.filter((a) => (a.type === 'chicken' || a.type === 'duck') && grown(a));
    if (!foxCame && brokenAlready && prey.length > 3 && !hasGrown(f, 'croc') && Math.random() < FOX_CHANCE) {
      foxCame = true;
      const gone = prey[rnd(prey.length)];
      f.animals = f.animals.filter((a) => a !== gone);
      f.events.push({ icon: '🦊', fox: true, text: `A fox sneaked through the broken fence and took a ${KINDS[gone.type].name.toLowerCase()}. Fix the fence to keep your animals safe.` });
    }
  }
  f.lastDay = today;
  return true;
}

// Stages only go up, so a fox visit never takes a stage away.
function levelUp(f) {
  const before = f.level;
  const birds = f.animals.filter((a) => (a.type === 'chicken' || a.type === 'duck') && grown(a)).length;
  if (f.level < 2 && birds >= BARNYARD_BIRDS) f.level = 2;
  if (f.level < 3 && f.sheared >= 1) f.level = 3;
  if (f.level < 4 && hasGrown(f, 'cow')) f.level = 4;
  return f.level > before ? f.level : 0;
}

// Bars fill as the lamb grows and its wool comes in, and as the calf grows, so they move every day.
function levelProgress(f) {
  if (f.level === 1) {
    const n = f.animals.filter((a) => (a.type === 'chicken' || a.type === 'duck') && grown(a)).length;
    return { have: Math.min(BARNYARD_BIRDS, n), need: BARNYARD_BIRDS };
  }
  if (f.level === 2) {
    const best = Math.max(0, ...f.animals.filter((a) => a.type === 'sheep').map((a) => (grown(a) ? 0.6 + (a.wool || 0) * 0.13 : (a.growth / KINDS.sheep.grow) * 0.6)));
    return { have: Math.round(best * 10), need: 10 };
  }
  if (f.level === 3) {
    const best = Math.max(0, ...f.animals.filter((a) => a.type === 'cow').map((a) => Math.min(1, a.growth / KINDS.cow.grow)));
    return { have: Math.round(best * 10), need: 10 };
  }
  const done = ['barn', 'mill', 'house'].filter((b) => f.built[b]).length;
  return { have: done, need: 3 };
}

export function createFarm(ctx) {
  const { state, esc } = ctx;
  const farmOf = (id) => {
    state.farms ||= {};
    return (state.farms[id] ||= freshFarm(ctx.todayKey()));
  };
  const balance = (id) => ctx.earned(id) + farmOf(id).sold - farmOf(id).spent;
  const save = () => ctx.kvSet('farms', state.farms);
  const today = () => ctx.todayKey();

  // ---------- sounds (made with the Web Audio API, no files) ----------
  function voice(type, freqs, len = 0.12, gap = 0.1, vol = 0.12) {
    ctx.tone((ac) => freqs.forEach((f, i) => {
      const t = ac.currentTime + i * gap;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      const [a, b] = Array.isArray(f) ? f : [f, f];
      o.frequency.setValueAtTime(a, t);
      o.frequency.exponentialRampToValueAtTime(b, t + len);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + len + 0.02);
    }));
  }
  const SOUNDS = {
    cluck: () => voice('square', [[700, 500], [650, 480], [900, 600]], 0.07, 0.11, 0.06),
    quack: () => voice('sawtooth', [[420, 300], [400, 280]], 0.16, 0.2, 0.08),
    chirp: () => voice('sine', [[2200, 2600], [2400, 2900], [2300, 2700]], 0.05, 0.08, 0.06),
    snap: () => voice('square', [[160, 70], [150, 60]], 0.09, 0.14, 0.12),
    boing: () => voice('sine', [[220, 880], [880, 330]], 0.18, 0.18, 0.15),
    hiss: () => voice('sawtooth', [[3000, 2600], [3200, 2400], [2900, 2500]], 0.12, 0.13, 0.03),
    baa: () => voice('sawtooth', [[520, 480], [500, 460], [480, 420]], 0.13, 0.12, 0.07),
    moo: () => voice('sawtooth', [[190, 120]], 0.9, 0, 0.1),
    coins: () => voice('triangle', [1046, 1318, 1568, 2093], 0.12, 0.07, 0.12),
    crack: () => voice('square', [[300, 120]], 0.06, 0, 0.12),
    fox: () => voice('sawtooth', [[600, 900], [900, 500]], 0.2, 0.2, 0.06),
  };

  // ---------- drawing ----------
  // Spread animals evenly over the field (below the buildings), with a little jitter so it looks natural.
  function spot(a, i, n) {
    const cols = Math.max(2, Math.ceil(Math.sqrt(n * 1.8)));
    const rows = Math.ceil(n / cols);
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 4 + ((col + 0.5) / cols) * 80 + ((a.id * 7) % 7) - 3;
    const y = 26 + ((row + 0.5) / Math.max(rows, 2)) * 56 + ((a.id * 5) % 6) - 3;
    return `left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;--dur:${5 + (a.id % 5)}s;--delay:-${a.id % 4}s`;
  }

  function animalHTML(f, a, i) {
    const k = KINDS[a.type];
    const big = grown(a);
    const hungry = a.fedDay !== today();
    let mood = '';
    if (a.type === 'sheep' && (a.wool || 0) >= 3) mood = '✂️';
    else if (hungry) mood = '🍽️';
    return `<button class="animal ${big ? '' : 'baby'} ${a.type === 'cow' ? 'big' : ''} ${hungry ? 'hungry' : ''}" data-action="farm-tap" data-id="${a.id}" style="${spot(a, i, f.animals.length)}" aria-label="${big ? k.name : k.baby}">
      <span class="body">${animalArt(a.type, big, a.wool || 0)}</span>${mood ? `<span class="mood">${mood}</span>` : ''}</button>`;
  }

  // Close-ups along the bottom: one card per animal with how it's growing and what it needs.
  function stripHTML(f) {
    if (!f.animals.length) return '';
    return `<div class="pals">${f.animals.map((a) => {
      const k = KINDS[a.type];
      const big = grown(a);
      const hungry = a.fedDay !== today();
      let bar = 1;
      let note;
      if (!big) { bar = a.growth / k.grow; note = `🌱 ${a.growth}/${k.grow}`; }
      else if (a.type === 'sheep') { bar = (a.wool || 0) / 3; note = (a.wool || 0) >= 3 ? '✂️ Shear me!' : `🧶 ${a.wool || 0}/3`; }
      else if (a.type === 'cow') { bar = ((a.milks || 0) % CALF_EVERY) / CALF_EVERY; note = '🥛 Milk'; }
      else if (a.type === 'chicken' || a.type === 'duck') note = '🥚 Eggs';
      else note = a.type === 'croc' ? '🛡️ Guard' : '🐛 Bug hunter';
      return `<button class="pal ${hungry ? 'hungry' : ''}" data-action="farm-tap" data-id="${a.id}">
        ${animalArt(a.type, big, a.wool || 0)}
        <b>${big ? k.name : k.baby}</b>
        <span class="pal-bar"><i style="width:${Math.round(bar * 100)}%"></i></span>
        <small>${hungry ? '🍽️ Hungry' : note}</small></button>`;
    }).join('')}</div>`;
  }

  function fieldHTML(f) {
    const broken = f.fenceDays === 0;
    const wobbly = f.fenceDays > 0 && f.fenceDays <= 2;
    const bld = [
      '<span class="bld coop" title="Coop">🛖</span>',
      f.built.pond ? '<span class="bld pond" title="Duck pond"></span>' : '',
      f.built.barn ? `<svg class="bld barn" viewBox="0 0 60 50" aria-label="Big barn"><path d="M5 22 L30 4 L55 22 V48 H5 Z" fill="#c2410c" stroke="#7c2d12" stroke-width="2"/><rect x="22" y="28" width="16" height="20" fill="#fef3c7" stroke="#7c2d12" stroke-width="2"/><path d="M22 28 L38 48 M38 28 L22 48" stroke="#7c2d12" stroke-width="2"/></svg>` : '',
      f.built.mill ? `<svg class="bld mill" viewBox="0 0 60 70" aria-label="Windmill"><path d="M24 30 L36 30 L40 68 L20 68 Z" fill="#e7e5e4" stroke="#78716c" stroke-width="2"/><g class="blades"><path d="M30 30 L30 4 L36 6 Z M30 30 L56 30 L54 36 Z M30 30 L30 56 L24 54 Z M30 30 L4 30 L6 24 Z" fill="#a8a29e" stroke="#57534e"/></g><circle cx="30" cy="30" r="3" fill="#57534e"/></svg>` : '',
      f.built.house ? '<span class="bld house" title="Farmhouse">🏡</span>' : '',
    ].join('');
    return `
      <div class="field ${broken ? 'broken' : wobbly ? 'wobbly' : ''} ${f.built.strong ? 'strong' : ''}">
        <div class="buildings">${bld}</div>
        ${f.decor.map((d, i) => `<span class="decor" style="left:${8 + ((i * 29) % 80)}%">${d}</span>`).join('')}
        ${f.nest.length ? `<span class="nest" title="Eggs in the nest">🪺<small>${f.nest.length}</small></span>` : ''}
        ${f.animals.map((a, i) => animalHTML(f, a, i)).join('')}
        ${!f.animals.length ? '<div class="field-empty">Your farm is waiting!<br>Get a 🥚 mystery egg from the 🛒 shop.</div>' : ''}
        ${broken ? '<span class="fox">🦊</span>' : ''}
      </div>`;
  }

  function panelHTML(k, f) {
    const coins = balance(k.id);
    const lv = LEVELS[f.level];
    const prog = levelProgress(f);
    const hungry = f.animals.filter((a) => a.fedDay !== today());
    const plan = feedPlan(f);
    const goods = Object.entries(f.basket).filter(([, n]) => n > 0);
    const value = goods.reduce((s, [g, n]) => s + GOODS[g].price * n, 0);
    const canHatch = (f.basket.egg || 0) > 0 && f.nest.length < 2 && roomFor(f, 'chicken');
    return `
      <div class="farm-coins">🪙 <b>${coins}</b></div>
      ${goalHTML(k, f, coins)}
      <div class="farm-level">
        <div>${lv.icon} <b>${lv.name}</b></div>
        <div class="farm-next">${f.level < 4 || prog.have < prog.need ? `Next: ${LEVELS[f.level].next}` : '🎉 Dream farm complete!'}</div>
        <div class="farm-bar"><i style="width:${(prog.have / prog.need) * 100}%"></i><span>${prog.have} / ${prog.need}</span></div>
      </div>
      <button class="farm-btn feed" data-action="farm-feed" ${hungry.length ? '' : 'disabled'}>
        ${hungry.length ? `🌾 Feed everyone <small>${plan.free ? `${plan.free} free + ` : ''}🪙 ${plan.coins}</small>` : '✓ Everyone is fed today'}
      </button>
      <div class="farm-basket">
        <div class="basket-items">🧺 ${goods.length ? goods.map(([g, n]) => `${GOODS[g].icon}×${n}`).join(' ') : '<small>Feed grown animals to fill your basket</small>'}</div>
        <div class="basket-btns">
          ${goods.length ? `<button class="farm-btn sell" data-action="farm-sell">Sell for 🪙 ${value}</button>` : ''}
          ${canHatch ? '<button class="farm-btn hatch" data-action="farm-hatch">🪺 Hatch an egg</button>' : ''}
        </div>
      </div>
      <div class="farm-fence ${f.fenceDays <= 2 ? 'warn' : ''}">
        🪵 ${f.fenceDays ? `Fence: ${f.fenceDays} day${f.fenceDays === 1 ? '' : 's'} left` : 'Fence broken! 🦊'}
        <button class="farm-btn small" data-action="farm-buy" data-item="repair" ${f.fenceDays >= 5 ? 'disabled' : ''}>${f.fenceDays >= 5 ? 'OK ✓' : 'Fix 🪙 6'}</button>
      </div>
      <button class="farm-btn shop" data-action="farm-shop">🛒 Shop</button>`;
  }

  // Which hungry animals the free feeds cover first, and what the rest cost.
  function feedPlan(f) {
    let free = 0;
    let coins = 0;
    let packs = f.feedPacks;
    for (const a of f.animals.filter((x) => x.fedDay !== today()).sort((x, y) => grown(x) - grown(y))) {
      const c = feedCost(f, a);
      if (c === 0) continue;
      if (packs > 0) { packs--; free++; } else coins += c;
    }
    return { free, coins };
  }

  // The next thing worth saving for, so every coin feels like a step.
  function goalItem(f) {
    const has = (t) => f.animals.some((a) => a.type === t);
    let id = 'egg';
    if (f.level >= 2 && !has('sheep')) id = 'lamb';
    else if (f.level >= 3 && !has('cow')) id = 'calf';
    else if (f.level >= 4) id = ['barn', 'mill', 'house'].find((b) => !f.built[b]) || null;
    else if (f.level >= 2 && has('duck') && !f.built.pond) id = 'pond';
    else if (!roomFor(f, 'chicken')) id = f.level >= 2 ? 'box' : null;
    return id && SHOP.find((x) => x.id === id);
  }

  function goalHTML(k, f, coins) {
    const it = goalItem(f);
    if (!it) return '';
    const pct = Math.min(1, Math.max(0, coins) / it.price);
    return `<div class="farm-goal ${pct >= 1 ? 'ready' : ''}">
      <span>${pct >= 1 ? '✅ You can buy' : 'Saving for'} ${it.icon} ${it.name}</span>
      <div class="farm-bar"><i style="width:${Math.round(pct * 100)}%"></i><span>${Math.min(Math.max(0, coins), it.price)} / ${it.price}</span></div></div>`;
  }

  function bodyHTML(k) {
    const f = farmOf(k.id);
    return `<div class="farm"><div class="farm-left">${fieldHTML(f)}${stripHTML(f)}</div><aside class="farm-panel">${panelHTML(k, f)}</aside></div>`;
  }

  // The farm on the one-screen view: the animals, and just Feed, Sell, the next thing to buy and the fence.
  // No shop to browse, so a visit is a few seconds.
  function miniHTML(k) {
    const f = farmOf(k.id);
    const coins = balance(k.id);
    const plan = feedPlan(f);
    const hungry = f.animals.filter((a) => a.fedDay !== today()).length;
    const value = Object.entries(f.basket).reduce((s, [g, n]) => s + GOODS[g].price * n, 0);
    const it = goalItem(f);
    const pct = it ? Math.min(1, Math.max(0, coins) / it.price) : 0;
    const shown = f.animals.slice(0, 10);
    return `
      <div class="farm-mini">
        <div class="mini-head"><b>🐔 My farm</b><span>${LEVELS[f.level].icon} ${LEVELS[f.level].name}</span></div>
        <div class="mini-field ${f.fenceDays === 0 ? 'broken' : ''}">
          ${shown.map((a, i) => `<button class="animal mini ${grown(a) ? '' : 'baby'} ${a.fedDay !== today() ? 'hungry' : ''}" data-action="farm-tap" data-id="${a.id}" style="${spot(a, i, shown.length)}">
            <span class="body">${animalArt(a.type, grown(a), a.wool || 0)}</span>${a.type === 'sheep' && (a.wool || 0) >= 3 ? '<span class="mood">✂️</span>' : ''}</button>`).join('')}
          ${!f.animals.length && !f.gift ? '<div class="field-empty">Save up for a 🥚</div>' : ''}
          ${f.fenceDays === 0 ? '<span class="fox">🦊</span>' : ''}
        </div>
        <div class="mini-actions">
          ${f.gift ? '<button class="farm-btn feed" data-action="farm-gift">🎁 Open your gift egg!</button>' : ''}
          ${hungry ? `<button class="farm-btn feed" data-action="farm-feed">🌾 Feed ${plan.free ? `<small>${plan.free} free</small>` : ''} <small>🪙 ${plan.coins}</small></button>` : f.animals.length ? '<div class="mini-note">✓ Everyone is fed</div>' : ''}
          ${value ? `<button class="farm-btn sell" data-action="farm-sell">🧺 Sell for 🪙 ${value}</button>` : ''}
          ${f.fenceDays <= 2 && f.animals.length ? '<button class="farm-btn warn" data-action="farm-buy" data-item="repair">🪵 Fix the fence 🪙 6</button>' : ''}
          ${it ? `<div class="farm-goal ${pct >= 1 ? 'ready' : ''}">
            <span>${pct >= 1 ? '✅' : 'Saving for'} ${it.icon} ${it.name}</span>
            <div class="farm-bar"><i style="width:${Math.round(pct * 100)}%"></i><span>${Math.min(Math.max(0, coins), it.price)} / ${it.price}</span></div>
            ${pct >= 1 ? `<button class="farm-btn buy" data-action="farm-buy" data-item="${it.id}">Buy it! 🪙 ${it.price}</button>` : ''}
          </div>` : ''}
        </div>
      </div>`;
  }

  // Small farm picture for the side panel and home screen card.
  function previewIcons(id, max = 6) {
    const f = farmOf(id);
    if (!f.animals.length) return f.gift ? '🎁' : '';
    return f.animals.slice(0, max).map((a) => (grown(a) ? KINDS[a.type].icon : KINDS[a.type].babyIcon)).join('') + (f.animals.length > max ? '…' : '');
  }
  const hungryCount = (id) => farmOf(id).animals.filter((a) => a.fedDay !== today()).length;

  // ---------- overlays: hatching eggs, opening boxes, news ----------
  function overlay(html, onClick) {
    const el = document.createElement('div');
    el.className = 'farm-ov';
    el.innerHTML = `<div class="farm-sheet">${html}</div>`;
    document.body.appendChild(el);
    el.addEventListener('click', (e) => onClick?.(e, el));
    return el;
  }

  function rollEgg() {
    const r = Math.random();
    return r < 0.66 ? 'chicken' : r < 0.86 ? 'duck' : r < 0.93 ? 'lizard' : r < 0.98 ? 'snake' : 'croc';
  }

  // Tap the egg three times to crack it open.
  function hatchMystery(f, title = 'A mystery egg!', { gift = false } = {}) {
    return new Promise((resolve) => {
      let taps = 0;
      let type = rollEgg();
      if (gift) while (type === 'snake') type = rollEgg(); // a starter egg always stays on the farm
      // Saved before the animation, so closing the app mid-hatch never loses the animal or the coins.
      // A snake doesn't stay: it slithers off and leaves 3 free feeds behind.
      const a = type === 'snake' ? null : { id: f.nextId++, type, growth: 0 };
      if (a) f.animals.push(a); else f.feedPacks += 3;
      save();
      ctx.speak(`${title} Tap it three times to crack it open!`);
      const el = overlay(`
        <h2>${title}</h2><p>Tap it 3 times to crack it open!</p>
        <button class="big-egg" data-crack>🥚<span class="cracks"></span></button>`, (e) => {
        if (!e.target.closest('[data-crack]') || taps >= 3) return;
        taps++;
        SOUNDS.crack();
        const egg = el.querySelector('.big-egg');
        egg.classList.remove('wobble'); void egg.offsetWidth; egg.classList.add('wobble');
        egg.querySelector('.cracks').textContent = ['', '⚡', '⚡⚡', ''][taps];
        if (taps < 3) return;
        if (type === 'snake') {
          setTimeout(() => {
            el.querySelector('.farm-sheet').innerHTML = `
              <div class="snake-stage"><div class="snake-pop">${snakeArt()}</div></div>
              <h2>Ssssurprise! A snake!</h2>
              <p>It wiggled out, said “ssss!” and slithered off to find its family. It left you 3 free feeds. 🌾</p>
              <button class="farm-btn" data-done>Ha ha! 😄</button>`;
            SOUNDS.boing();
            setTimeout(() => SOUNDS.hiss(), 700);
            ctx.speak('Sssssurprise! A snake! It slithered away to find its family, and left you 3 free feeds.');
            el.addEventListener('click', (ev) => { if (ev.target.closest('[data-done]')) { el.remove(); resolve(null); } });
          }, 350);
          return;
        }
        const k = KINDS[type];
        setTimeout(() => {
          el.querySelector('.farm-sheet').innerHTML = `
            ${k.rare ? `<div class="rare">${k.rare}</div>` : ''}
            <div class="reveal-animal">${animalArt(type, false)}</div>
            <h2>It's a ${k.baby.toLowerCase()}!</h2>
            <p>${k.perk || `Feed it every day and it grows into a ${k.name.toLowerCase()}.`}</p>
            <button class="farm-btn" data-done>Yay! 🎉</button>`;
          SOUNDS[k.sound]();
          ctx.burst(el.querySelector('.reveal-animal'), k.rare ? 30 : 16);
          ctx.speak(`It's a ${k.baby.toLowerCase()}! ${k.rare || ''} ${k.perk || ''}`);
          el.addEventListener('click', (ev) => { if (ev.target.closest('[data-done]')) { el.remove(); resolve(a); } });
        }, 350);
      });
    });
  }

  function openBox(f) {
    return new Promise((resolve) => {
      const r = Math.random();
      let prize;
      if (r < 0.35) prize = { kind: 'feed' };
      else if (r < 0.6) prize = roomFor(f, 'chicken') ? { kind: 'egg' } : { kind: 'feed' };
      else if (r < 0.75) prize = { kind: 'corn' };
      else if (r < 0.87) prize = roomFor(f, 'sheep') ? { kind: 'lamb' } : { kind: 'feed' };
      else if (r < 0.97) { const d = DECOR.filter((x) => !f.decor.includes(x)); prize = d.length ? { kind: 'decor', icon: d[rnd(d.length)] } : { kind: 'feed' }; }
      else prize = roomFor(f, 'cow') ? { kind: 'calf' } : { kind: 'feed' };
      const el = overlay('<h2>A mystery box!</h2><p>Tap it to open!</p><button class="big-egg box" data-open>🎁</button>', async (e) => {
        if (!e.target.closest('[data-open]')) return;
        SOUNDS.crack();
        if (prize.kind === 'egg') { el.remove(); await hatchMystery(f, 'A mystery egg was inside!'); return resolve(); }
        let icon;
        let text;
        if (prize.kind === 'feed') { f.feedPacks += 5; icon = '🌾'; text = 'A bag of feed! 5 free feeds.'; }
        if (prize.kind === 'corn') {
          const baby = f.animals.filter((a) => !grown(a)).sort((a, b) => a.growth - b.growth)[0];
          if (baby) { baby.growth = KINDS[baby.type].grow; icon = '🌽'; text = `Golden corn! Your ${KINDS[baby.type].baby.toLowerCase()} grew up straight away!`; }
          else { f.feedPacks += 5; icon = '🌽'; text = 'Golden corn! 5 free feeds.'; }
        }
        if (prize.kind === 'lamb') { f.animals.push({ id: f.nextId++, type: 'sheep', growth: 0 }); icon = '🐑'; text = 'A baby lamb!'; SOUNDS.baa(); }
        if (prize.kind === 'calf') { f.animals.push({ id: f.nextId++, type: 'cow', growth: 0 }); icon = '🐮'; text = 'Super rare! A baby calf!'; SOUNDS.moo(); }
        if (prize.kind === 'decor') { f.decor.push(prize.icon); icon = prize.icon; text = 'Something pretty for your farm!'; }
        const up = levelUp(f);
        save();
        if (up) setTimeout(() => levelMoment(up), 2500);
        el.querySelector('.farm-sheet').innerHTML = `<div class="reveal-animal">${icon}</div><h2>${text}</h2><button class="farm-btn" data-done>Yay! 🎉</button>`;
        ctx.burst(el.querySelector('.reveal-animal'), 20);
        ctx.speak(text);
        el.addEventListener('click', (ev) => { if (ev.target.closest('[data-done]')) { el.remove(); resolve(); } });
      });
    });
  }

  function showNews(f) {
    if (!f.events.length) return Promise.resolve();
    const news = f.events.splice(0);
    save();
    const fox = news.some((n) => n.fox);
    if (fox) SOUNDS.fox();
    return new Promise((resolve) => {
      const el = overlay(`<h2>${fox ? 'Oh no!' : 'While you were away…'}</h2>
        ${news.map((n) => `<div class="news"><span>${n.icon}</span>${esc(n.text)}</div>`).join('')}
        <button class="farm-btn" data-done>OK</button>`, (e) => { if (e.target.closest('[data-done]')) { el.remove(); resolve(); } });
      ctx.speak(news.map((n) => n.text).join(' '));
    });
  }

  function levelMoment(n) {
    const lv = LEVELS[n];
    const el = overlay(`<div class="reveal-animal">${lv.icon}</div><h2>New farm stage: ${lv.name}!</h2>
      <p>${n === 2 ? 'The mystery box, lambs, the duck pond and a strong fence are in the shop now.' : n === 3 ? 'You can buy a calf now!' : 'The big barn, windmill and farmhouse are in the shop now.'}</p>
      <button class="farm-btn" data-done>Woohoo! 🎉</button>`, (e) => { if (e.target.closest('[data-done]')) el.remove(); });
    ctx.chime();
    ctx.burst(el.querySelector('.reveal-animal'), 30);
    ctx.speak(`New farm stage: ${lv.name}!`);
  }

  // ---------- actions ----------
  function feedAll(k) {
    const f = farmOf(k.id);
    const hungry = f.animals.filter((a) => a.fedDay !== today()).sort((a, b) => grown(a) - grown(b));
    const msgs = [];
    let fed = 0;
    let laid = 0;
    for (const a of hungry) {
      const c = feedCost(f, a);
      if (c === 0) { /* windmill: small animals eat free */ }
      else if (f.feedPacks > 0) f.feedPacks--;
      else if (balance(k.id) >= c) f.spent += c;
      else { msgs.push('Not enough coins to feed everyone. Do some extra chores!'); break; }
      a.fedDay = today();
      fed++;
      const kind = KINDS[a.type];
      if (!grown(a)) {
        a.growth++;
        if (grown(a)) msgs.push(`Your ${kind.baby.toLowerCase()} grew into a ${kind.name.toLowerCase()}!`);
        continue;
      }
      if (a.type === 'chicken') {
        if (hasGrown(f, 'lizard') && Math.random() < 0.15) { f.basket.golden = (f.basket.golden || 0) + 1; msgs.push('A golden egg! 🌟'); }
        else f.basket.egg = (f.basket.egg || 0) + 1;
        laid++;
      }
      if (a.type === 'duck') { f.basket.duckegg = (f.basket.duckegg || 0) + (f.built.pond ? 2 : 1); laid++; }
      if (a.type === 'sheep') a.wool = Math.min(3, (a.wool || 0) + 1);
      if (a.type === 'cow') {
        f.basket.milk = (f.basket.milk || 0) + 1;
        a.milks = (a.milks || 0) + 1;
        if (a.milks % CALF_EVERY === 0) {
          if (roomFor(f, 'cow')) { f.animals.push({ id: f.nextId++, type: 'cow', growth: 0 }); msgs.push('Your cow had a calf! 🐮'); }
          else msgs.push('Your cow could have a calf, but there is no room. Build the big barn!');
        }
      }
    }
    if (laid) msgs.unshift(`${laid} egg${laid === 1 ? '' : 's'} laid!`);
    if (f.animals.some((a) => a.type === 'sheep' && a.wool >= 3)) msgs.push('A sheep is ready to shear. Tap it! ✂️');
    const up = levelUp(f);
    save();
    ctx.renderKid();
    document.querySelectorAll('.animal').forEach((el, i) => setTimeout(() => el.classList.add('eat'), i * 60));
    ctx.pop();
    ctx.speak(fed ? `Yum! ${msgs.join(' ') || 'Everyone is fed.'}` : msgs.join(' '));
    if (msgs.length) ctx.toast(`🌾 ${esc(msgs.join(' · '))}`);
    if (up) setTimeout(() => levelMoment(up), 900);
  }

  function sellAll(k) {
    const f = farmOf(k.id);
    const value = Object.entries(f.basket).reduce((s, [g, n]) => s + GOODS[g].price * n, 0);
    if (!value) return;
    f.sold += value;
    f.basket = {};
    save();
    SOUNDS.coins();
    ctx.renderKid();
    ctx.burst(document.querySelector('.farm-coins'), 14);
    ctx.speak(`Sold for ${value} coins!`);
  }

  function hatchEgg(k) {
    const f = farmOf(k.id);
    if (!(f.basket.egg > 0) || f.nest.length >= 2 || !roomFor(f, 'chicken')) return;
    f.basket.egg--;
    f.nest.push({ day: today() });
    save();
    ctx.renderKid();
    ctx.speak('Your egg is in the nest. It will hatch tomorrow!');
    ctx.toast('🪺 Your egg is in the nest. It hatches tomorrow!');
  }

  function tapAnimal(k, el) {
    const f = farmOf(k.id);
    const a = f.animals.find((x) => x.id === Number(el.dataset.id));
    if (!a) return;
    const kind = KINDS[a.type];
    SOUNDS[kind.sound]();
    document.querySelectorAll(`[data-id="${a.id}"]`).forEach((x) => { x.classList.remove('hop'); void x.offsetWidth; x.classList.add('hop'); });
    if (a.type === 'sheep' && (a.wool || 0) >= 3) {
      a.wool = 0;
      f.basket.wool = (f.basket.wool || 0) + 1;
      f.sheared++;
      const up = levelUp(f);
      save();
      ctx.renderKid();
      ctx.speak('Snip snip! You sheared the wool!');
      ctx.toast('✂️ You sheared the wool! 🧶 It sells for 🪙 10.');
      if (up) setTimeout(() => levelMoment(up), 700);
      return;
    }
    const name = grown(a) ? kind.name : kind.baby;
    let status = a.fedDay === today() ? 'Fed and happy!' : 'Hungry!';
    if (!grown(a)) status += ` Growing: ${a.growth} of ${kind.grow}.`;
    if (a.type === 'sheep' && grown(a)) status += ` Wool: ${a.wool || 0} of 3.`;
    if (kind.perk && grown(a)) status += ` ${kind.perk}`;
    ctx.speak(`${name}. ${status}`);
    ctx.toast(`${grown(a) ? kind.icon : kind.babyIcon} <b>${name}</b>: ${esc(status)}`);
  }

  function shopHTML(k) {
    const f = farmOf(k.id);
    const coins = balance(k.id);
    return `
      <div class="shop-head"><h2>🛒 Farm shop</h2><span class="farm-coins">🪙 <b>${coins}</b></span><button class="farm-btn small" data-close>Close</button></div>
      <div class="shop-list">
        ${SHOP.map((it) => {
          const locked = f.level < it.level;
          const owned = it.building && f.built[it.id];
          const needs = it.needs && !f.built[it.needs];
          const full = (it.id === 'egg' && !roomFor(f, 'chicken')) || (it.id === 'lamb' && !roomFor(f, 'sheep')) || (it.id === 'calf' && !roomFor(f, 'cow'));
          const noDuck = it.needsDuck && !f.animals.some((a) => a.type === 'duck');
          const hens = f.animals.filter((a) => a.type === 'chicken' && grown(a)).length;
          if (it.id === 'sellhen') {
            if (!hens) return '';
            return `<div class="shop-item"><span class="shop-icon">${it.icon}</span><div><b>${it.name}</b><small>${it.does}</small></div>
              <button class="farm-btn small sellhen" data-buy="sellhen">+ 🪙 8</button></div>`;
          }
          const reason = locked ? `🔒 ${LEVELS[it.level].name}` : owned ? 'Built ✓' : needs ? `Build the ${SHOP.find((x) => x.id === it.needs).name.toLowerCase()} first` : noDuck ? 'Get a duck first' : full ? (f.built.barn ? 'No room' : 'No room: build the big barn') : '';
          return `<div class="shop-item ${locked ? 'locked' : ''}">
            <span class="shop-icon">${it.icon}</span>
            <div><b>${it.name}</b><small>${it.does}</small></div>
            <button class="farm-btn small" data-buy="${it.id}" ${reason || coins < it.price ? 'disabled' : ''}>${reason || `🪙 ${it.price}`}</button>
          </div>`;
        }).join('')}
      </div>`;
  }

  // First tap reads the item aloud; a second tap on the same button buys it (non-readers hear before they spend).
  function openShop(k) {
    let armed = null;
    const el = overlay(shopHTML(k), async (e) => {
      if (e.target.closest('[data-close]') || e.target === el) return el.remove();
      const item = e.target.closest('.shop-item');
      const b = e.target.closest('[data-buy]');
      const id = (b || item?.querySelector('[data-buy]'))?.dataset.buy;
      const it = SHOP.find((x) => x.id === id);
      if (!it) return;
      if (!b || armed !== id) {
        armed = id;
        el.querySelectorAll('[data-buy]').forEach((x) => {
          if (x.dataset.label) { x.innerHTML = x.dataset.label; delete x.dataset.label; }
          x.classList.remove('armed');
        });
        const btn = el.querySelector(`[data-buy="${id}"]`);
        ctx.speak(`${it.name}. ${it.does} ${btn.disabled ? btn.textContent : it.price > 0 ? `It costs ${it.price} coins. Tap again to buy.` : 'Tap again to sell.'}`, true);
        if (!btn.disabled) { btn.classList.add('armed'); btn.dataset.label = btn.innerHTML; btn.innerHTML = 'Tap again ✓'; }
        return;
      }
      if (b.disabled) return;
      el.remove();
      await buy(k, id);
    });
    el.classList.add('shop');
  }

  async function buy(k, id) {
    const f = farmOf(k.id);
    const it = SHOP.find((x) => x.id === id);
    if (!it || f.level < it.level) return;
    if (id === 'sellhen') {
      const hen = f.animals.filter((a) => a.type === 'chicken' && grown(a))[0];
      if (!hen) return;
      f.animals = f.animals.filter((a) => a !== hen);
      f.sold += 8;
      save();
      SOUNDS.coins();
      ctx.speak('Your hen went to a happy new farm. 8 coins!');
      return ctx.renderKid();
    }
    if (balance(k.id) < it.price) {
      ctx.speak(`You need ${it.price - balance(k.id)} more coins. Do some jobs to earn them!`, true);
      return ctx.toast(`🪙 You need ${it.price - balance(k.id)} more coins for the ${esc(it.name.toLowerCase())}.`);
    }
    if (it.building && f.built[id]) return;
    f.spent += it.price;
    save();
    SOUNDS.coins();
    if (id === 'egg') await hatchMystery(f);
    else if (id === 'box') await openBox(f);
    else if (id === 'repair') { f.fenceDays = f.built.strong ? FENCE_DAYS * 2 : FENCE_DAYS; ctx.toast('🪵 Fence fixed! The fox will stay out.'); ctx.speak('Fence fixed!'); }
    else if (id === 'lamb' || id === 'calf') {
      const type = id === 'lamb' ? 'sheep' : 'cow';
      f.animals.push({ id: f.nextId++, type, growth: 0 });
      SOUNDS[KINDS[type].sound]();
      ctx.speak(`Welcome, little ${KINDS[type].baby.toLowerCase()}!`);
    } else if (it.building) {
      f.built[id] = true;
      if (id === 'strong') f.fenceDays = Math.max(f.fenceDays, FENCE_DAYS * 2);
      ctx.chime();
      ctx.speak(id === 'house' ? 'You built the farmhouse! Your dream farm is complete!' : `You built the ${it.name.toLowerCase()}!`);
    }
    save();
    ctx.renderKid();
    if (id === 'house') ctx.burst(null, 60);
    if (id !== 'repair') ctx.purchased?.(it); // buying something ends the farm visit
  }

  // Called when a child opens the Farm tab: catch up on missed days, then show news and the starter gift.
  async function opened(k, { gift = true } = {}) {
    const f = farmOf(k.id);
    if (catchUp(f, today())) { save(); ctx.renderKid(); }
    await showNews(f);
    if (f.gift && gift) {
      f.gift = false; // saved together with the new animal inside hatchMystery
      await hatchMystery(f, 'A gift to start your farm!', { gift: true });
      ctx.renderKid();
    } else if (f.fenceDays <= 2 && f.animals.length) {
      SOUNDS.fox();
      ctx.speak(f.fenceDays ? 'Your fence is wobbly. Fix your fence!' : 'Your fence is broken! Fix it before the fox comes.', true);
    }
  }

  async function action(a, el) {
    const k = ctx.kid();
    if (!k) return;
    ctx.unlockAudio();
    switch (a) {
      case 'farm-feed': return feedAll(k);
      case 'farm-sell': return sellAll(k);
      case 'farm-hatch': return hatchEgg(k);
      case 'farm-tap': return tapAnimal(k, el);
      case 'farm-shop': return openShop(k);
      case 'farm-buy': return buy(k, el.dataset.item);
      case 'farm-gift': {
        const f = farmOf(k.id);
        if (!f.gift) return;
        f.gift = false;
        await hatchMystery(f, 'A gift to start your farm!', { gift: true });
        return ctx.renderKid();
      }
    }
  }

  return { bodyHTML, miniHTML, previewIcons, hungryCount, balance, action, opened, farmOf, catchUp: (id) => catchUp(farmOf(id), today()) };
}
