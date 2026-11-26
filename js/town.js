// 🏘️ The Town Square (26 Nov 2026). The kids asked (Joel's dictated note) for their own farmer, a farmers market stall to sell
// produce and juice, and "a town square with a couple of farms". Joel: they love the farm but aren't excited about the building.
//
// So the building moved into the farm world they love (research: Stardew Valley's community-centre bundles, Animal Crossing's
// town that grows when you give). The gold, silver and gems a child earns from real life (finished routines, prayers, kept
// good moments: the same pieces Build on the Rock gets) also land in their 🎒 town bag. All the children give them to ONE
// shared town project at a time. When a project has everything, the builders work overnight and it opens the next day,
// with a perk for everyone. Hard moments never touch the town: it only ever grows. Who gave is shown by name, never by count.
//
// Also here: each child's own 🧺 market stall (make juice, bread, cakes, scarves and posies from the basket, which sell for more
// than the parts), the 👗 dress-up shop (outfits and hats for their farmer), and farm gates to visit a brother's or sister's farm.
//
// Saved:  state.town (kv 'town', shared): { done: [ids], cur: { id, got: {gold, silver, gem}, by: {kidId: true}, fullDay } }
//         on each child's farm f: me (js/avatar.js), bag {gold, silver, gem}, bagDay/bagToday (daily cap), stall (true once built),
//         seen [project ids whose opening they've celebrated], wishDay (fountain).
import { farmerSVG, freshMe, has, SKINS, HAIR_COLOURS, HAIRS, OUTFITS, HATS } from './avatar.js';

const ART = 'farm-art/';
export const PIECE_KINDS = { gold: { icon: '🟡', name: 'gold' }, silver: { icon: '⚪', name: 'silver' }, gem: { icon: '💎', name: 'gems' } };
const BAG_CAP = 8;   // pieces a day per child, so ten quick prayers can't build the whole town in a morning

// The town projects, built one after another. x/y: where the foot of the building stands on the town picture (in %), w: width in %.
export const PROJECTS = [
  { id: 'fountain', name: 'Wishing fountain', icon: '⛲', img: 'fountain', x: 50, y: 59, w: 13, need: { gold: 2, silver: 2, gem: 0 },
    perk: 'Tap the fountain once a day for a little surprise.', open: 'The wishing fountain is splashing! Tap it once a day for a surprise.' },
  { id: 'bakery', name: 'Village bakery', icon: '🥖', img: 't-bakery', x: 18, y: 63, w: 21, need: { gold: 5, silver: 5, gem: 2 },
    perk: 'Bake bread and honey cakes at your market stall.', open: 'The bakery smells amazing! You can bake bread and honey cakes at your market stall now.' },
  { id: 'bandstand', name: 'Bandstand', icon: '🎵', img: 't-bandstand', x: 82, y: 64, w: 17, need: { gold: 8, silver: 8, gem: 4 },
    perk: 'Saturday is Market Day: everything you make sells for 3 more coins. Tap it for music!', open: 'The band is playing! Saturdays are Market Day now.' },
  { id: 'church', name: 'Little church', icon: '⛪', img: 't-church', x: 43, y: 36, w: 20, need: { gold: 12, silver: 12, gem: 6 },
    perk: 'Ring the bell, and remember: build your life on the Rock.', open: 'The little church is built on the rock! Tap it to ring the bell.' },
  { id: 'clock', name: 'Clock tower', icon: '🕰️', img: 't-clock', x: 64, y: 35, w: 8.5, need: { gold: 16, silver: 16, gem: 8 },
    perk: 'Everyone gets 1 extra build move on their farm every day.', open: 'The clock tower is ticking! You get 1 extra build move on your farm every day.' },
];
export const VERSE = 'Everyone who hears my words and does them is like a wise man who built his house on the rock. (Matthew 7:24)';

// Market stall recipes: goods from the basket in, one made thing out. `needs` a town project for some.
export const RECIPES = [
  { id: 'applejuice', name: 'Apple juice', in: { apple: 3 } },
  { id: 'carrotjuice', name: 'Carrot juice', in: { carrot: 3 } },
  { id: 'posy', name: 'Sunflower posy', in: { sunflower: 3 } },
  { id: 'scarf', name: 'Woolly scarf', in: { wool: 2 } },
  { id: 'omelette', name: 'Big omelette', in: { egg: 2, turkeyegg: 1 } },
  { id: 'bread', name: 'Fresh bread', in: { wheat: 3 }, needs: 'bakery' },
  { id: 'cake', name: 'Honey cake', in: { honey: 1, egg: 2, wheat: 1 }, needs: 'bakery' },
];
export const STALL = { price: 150, stars: 12 };
const MARKET_DAY_BONUS = 3;
// Where each child's stall and farm gate stand (by their place in the family list).
const STALL_AT = [{ x: 31, y: 85 }, { x: 50, y: 95 }, { x: 69, y: 85 }];
const GATE_AT = [{ x: 11, y: 38 }, { x: 89, y: 38 }, { x: 87, y: 96 }];

export function createTown(api) {
  const { ctx, state, esc, farmOf, balance, starsLeft, save, today, GOODS, priceOf, sound, overlay } = api;
  const kids = () => state.settings?.kids || [];
  const town = () => (state.town ||= { done: [], cur: null });
  const saveTown = () => ctx.kvSet('town', state.town);
  const isDone = (id) => town().done.includes(id);
  const view = { visit: null };   // a brother's or sister's farm being visited (view only)

  // ---------- the town bag ----------
  function addPiece(kidId, kind) {
    if (!PIECE_KINDS[kind]) return false;
    const f = farmOf(kidId);
    if (f.bagDay !== today()) { f.bagDay = today(); f.bagToday = 0; }
    if (f.bagToday >= BAG_CAP) return false;
    f.bagToday++;
    (f.bag ||= { gold: 0, silver: 0, gem: 0 })[kind] = (f.bag[kind] || 0) + 1;
    save();
    return true;
  }
  const bagOf = (f) => (f.bag ||= { gold: 0, silver: 0, gem: 0 });

  // ---------- the current project (builds overnight once it has everything) ----------
  function current() {
    const t = town();
    // A finished project opens the day after it got its last piece ("the builders worked all night").
    if (t.cur?.fullDay && t.cur.fullDay < today()) { t.done.push(t.cur.id); t.cur = null; saveTown(); }
    if (!t.cur) {
      const next = PROJECTS.find((p) => !t.done.includes(p.id));
      if (!next) return null;
      t.cur = { id: next.id, got: { gold: 0, silver: 0, gem: 0 }, by: {} };
      saveTown();
    }
    return t.cur;
  }
  const projectOf = (id) => PROJECTS.find((p) => p.id === id);
  const left = (cur, kind) => Math.max(0, projectOf(cur.id).need[kind] - (cur.got[kind] || 0));
  const isFull = (cur) => Object.keys(PIECE_KINDS).every((kd) => left(cur, kd) === 0);

  function give(k, kind, all) {
    const f = farmOf(k.id), bag = bagOf(f), cur = current();
    if (!cur || cur.fullDay) return;
    const n = Math.min(bag[kind] || 0, left(cur, kind), all ? 99 : 1);
    if (!n) return;
    bag[kind] -= n;
    cur.got[kind] += n;
    cur.by[k.id] = true;
    const p = projectOf(cur.id);
    let said = `You gave ${n} ${PIECE_KINDS[kind].name === 'gems' && n === 1 ? 'gem' : PIECE_KINDS[kind].name} to the ${p.name.toLowerCase()}!`;
    if (isFull(cur)) {
      cur.fullDay = today();
      (town().credit ||= {})[cur.id] = { ...cur.by };   // remember who helped (shown when it opens)
      said = `That's everything! The builders will work all night. The ${p.name.toLowerCase()} opens tomorrow!`;
      setTimeout(() => ctx.burst(null, 50), 200);
      ctx.chime();
    } else sound('coins');
    save(); saveTown();
    ctx.renderKid();
    flyPiece(kind);
    ctx.speak(said, true);
  }
  function flyPiece(kind) {
    const to = document.querySelector('.tw-site, .tw-proj');
    if (!to) return;
    const r = to.getBoundingClientRect(), el = document.createElement('div');
    el.className = 'tw-fly'; el.textContent = PIECE_KINDS[kind].icon;
    el.style.left = `${r.left + r.width / 2}px`; el.style.top = `${r.top + r.height / 2}px`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }

  // ---------- celebrations: each child sees each new building open once ----------
  async function celebrate(k) {
    const f = farmOf(k.id);
    f.seen ||= [];
    for (const id of town().done) {
      if (f.seen.includes(id)) continue;
      f.seen.push(id); save();
      const p = projectOf(id), names = whoNames(town().credit?.[id]);
      ctx.chime(); ctx.burst(null, 60);
      ctx.speak(`Hooray! ${p.open}`, true);
      await new Promise((res) => {
        const el = overlay(`<div class="tw-open"><img src="${ART}${p.img}.webp" alt=""></div><h2>🎉 The ${esc(p.name.toLowerCase())} is open!</h2>
          <p>${esc(p.open)}</p>${names ? `<p class="tw-by">Built together by ${esc(names)} 💛</p>` : ''}<button class="farm-btn feed" data-close>Yay!</button>`,
        (e) => { if (e.target.closest('[data-close]') || e.target === el) { el.remove(); res(); } });
      });
    }
  }
  const whoNames = (by) => {
    const list = kids().filter((x) => by?.[x.id]).map((x) => x.name);
    return list.length > 1 ? `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}` : list[0] || '';
  };

  // ---------- drawing ----------
  const meOf = (id) => farmOf(id).me || null;
  const at = (x, y, w, z = 0) => `left:${x}%;top:${y}%;width:${w}%;z-index:${Math.round(y * 10) + z}`;

  function sceneHTML(k) {
    const t = town(), cur = current();
    let html = '';
    for (const p of PROJECTS) {
      if (t.done.includes(p.id)) {
        html += `<button class="tw-b tw-built" data-action="farm-town-tap" data-p="${p.id}" style="${at(p.x, p.y, p.w)}" aria-label="${esc(p.name)}"><img src="${ART}${p.img}.webp" alt="" draggable="false"></button>`;
      } else if (cur && cur.id === p.id) {
        const pct = Object.keys(PIECE_KINDS).reduce((n, kd) => n + (cur.got[kd] || 0), 0) / Math.max(1, Object.values(p.need).reduce((a, b) => a + b, 0));
        const img = cur.fullDay || pct >= 0.5 ? 't-frame' : 't-site';
        html += `<button class="tw-b tw-site${cur.fullDay ? ' working' : ''}" data-action="farm-town-proj" style="${at(p.x, p.y, Math.max(11, p.w))}" aria-label="Building the ${esc(p.name)}">
          <img src="${ART}${img}.webp" alt="" draggable="false"><i class="tw-tag">${p.icon} ${cur.fullDay ? 'Opens tomorrow!' : `${Math.round(pct * 100)}%`}</i></button>`;
      }
    }
    // Market stalls: one plot for each child (built or a little building site sign).
    kids().slice(0, 3).forEach((x, i) => {
      const s = STALL_AT[i], fx = farmOf(x.id), mine = x.id === k.id;
      if (fx.stall) html += `<button class="tw-b tw-stall" data-action="${mine ? 'farm-town-stall' : 'farm-town-noop'}" style="${at(s.x, s.y, 14)}" aria-label="${esc(x.name)}'s market stall"><img src="${ART}t-stall.webp" alt="" draggable="false"><i class="tw-name" style="--kc:${x.color || '#888'}">${esc(x.name)}'s stall</i></button>`;
      else if (mine) html += `<button class="tw-b tw-plot" data-action="farm-town-stall" style="${at(s.x, s.y, 10)}" aria-label="Build my market stall"><img src="${ART}t-site.webp" alt="" draggable="false"><i class="tw-name" style="--kc:${x.color || '#888'}">Your stall?</i></button>`;
      if (fx.me) html += `<div class="tw-me${mine ? ' mine' : ''}" style="${at(s.x + (fx.stall ? 7.5 : 5.5), s.y + 1, 6.5, 5)}">${farmerSVG(fx.me, { wave: mine })}</div>`;
    });
    // Farm gates: visit a brother's or sister's farm, or go home.
    kids().slice(0, 3).forEach((x, i) => {
      const g = GATE_AT[i], mine = x.id === k.id;
      html += `<button class="tw-b tw-gate" data-action="${mine ? 'farm-town-home' : 'farm-town-visit'}" data-kid="${x.id}" style="${at(g.x, g.y, 11)}" aria-label="${mine ? 'Back to my farm' : `Visit ${esc(x.name)}'s farm`}">
        <img src="${ART}t-gate.webp" alt="" draggable="false"><i class="tw-name" style="--kc:${x.color || '#888'}">${mine ? '🏠 My farm' : `🏡 ${esc(x.name)}`}</i></button>`;
    });
    html += `<button class="tw-b tw-shop" data-action="farm-town-dress" style="${at(13, 86, 13)}" aria-label="Dress-up shop"><img src="${ART}t-dress.webp" alt="" draggable="false"><i class="tw-name">👗 Dress-up</i></button>`;
    html += `<button class="tw-b tw-board" data-action="farm-town-board" style="${at(66, 50, 7)}" aria-label="Town noticeboard"><img src="${ART}t-board.webp" alt="" draggable="false"></button>`;
    return `<div class="field tw"><div class="tw-stage"><img class="tw-ground" src="${ART}ground-town.jpg" alt="" draggable="false">${html}</div>
      <div class="w2-hud"><button class="w2-btn ready" data-action="farm-town-home">🐔 Back to my farm</button><button class="w2-btn" data-action="farm-town-me">🧑‍🌾 My farmer</button></div></div>`;
  }

  function panelHTML(k) {
    const f = farmOf(k.id), bag = bagOf(f), cur = current(), p = cur && projectOf(cur.id);
    const coins = balance(k.id);
    const bagRow = Object.entries(PIECE_KINDS).map(([kd, v]) => `<span class="tw-pc">${v.icon}<b>${bag[kd] || 0}</b></span>`).join('');
    let proj = '<div class="tw-card"><b>🎉 The whole town is built!</b><small>More to build is coming.</small></div>';
    if (cur) {
      const rows = Object.entries(PIECE_KINDS).filter(([kd]) => p.need[kd]).map(([kd, v]) => {
        const got = cur.got[kd] || 0, need = p.need[kd], can = !cur.fullDay && (bag[kd] || 0) > 0 && got < need;
        return `<div class="tw-need"><span>${v.icon} ${got} / ${need}</span><div class="farm-bar"><i style="width:${(got / need) * 100}%"></i></div>
          <button class="farm-btn small${can ? ' feed' : ''}" data-action="farm-town-give" data-kind="${kd}" ${can ? '' : 'disabled'}>${got >= need ? '✓' : 'Give'}</button></div>`;
      }).join('');
      const names = whoNames(cur.by);
      proj = `<div class="tw-card tw-proj"><b>🔨 Now building: ${p.icon} ${esc(p.name)}</b><small>${esc(p.perk)}</small>${rows}
        ${cur.fullDay ? '<div class="tw-note">🌙 The builders are working tonight. It opens tomorrow!</div>' : ''}
        ${names ? `<small class="tw-by">Helping: ${esc(names)} 💛</small>` : '<small class="tw-by">Everyone in the family can help.</small>'}</div>`;
    }
    const stall = f.stall
      ? '<button class="farm-btn sell" data-action="farm-town-stall">🧺 My market stall</button>'
      : `<button class="farm-btn" data-action="farm-town-stall">🧺 Build my market stall <small>🪙 ${STALL.price} + ⭐ ${STALL.stars}</small></button>`;
    return `<div class="farm-coins">🪙 <b>${coins}</b> <span class="farm-stars">⭐ ${starsLeft(k.id)}</span></div>
      <div class="tw-bag"><div><b>🎒 My town pieces</b>${bagRow}</div><small>From your jobs, prayers and kind moments.</small></div>
      ${proj}${stall}
      <button class="farm-btn" data-action="farm-town-dress">👗 Dress-up shop</button>`;
  }

  function visitHTML(k) {
    const x = kids().find((y) => y.id === view.visit), fx = farmOf(view.visit);
    return `<div class="farm"><div class="farm-left"><div class="tw-visit">${api.fieldFor(fx)}</div></div>
      <aside class="farm-panel"><div class="tw-card"><b>👋 ${esc(x?.name || '')}'s farm</b><small>Just looking! Nothing changes on ${esc(x?.name || 'their')}'s farm.</small></div>
      ${fx.me ? `<div class="tw-visit-me">${farmerSVG(fx.me, { wave: true })}</div>` : ''}
      <div class="tw-card"><small>${fx.animals.length} animal${fx.animals.length === 1 ? '' : 's'}</small></div>
      <button class="farm-btn feed" data-action="farm-town-back">🏘️ Back to town</button></aside></div>`;
  }

  function bodyHTML(k) {
    if (view.visit) return visitHTML(k);
    return `<div class="farm town">${`<div class="farm-left">${sceneHTML(k)}</div>`}<aside class="farm-panel">${panelHTML(k)}</aside></div>`;
  }

  // ---------- the market stall ----------
  const marketDay = () => isDone('bandstand') && new Date(`${today()}T12:00:00`).getDay() === 6;
  const madePrice = (f, id) => priceOf(f, id) + (marketDay() ? MARKET_DAY_BONUS : 0);
  const canMake = (f, r) => (!r.needs || isDone(r.needs)) && Object.entries(r.in).every(([g, n]) => (f.basket[g] || 0) >= n);
  const partsValue = (f, r) => Object.entries(r.in).reduce((s, [g, n]) => s + priceOf(f, g) * n, 0);

  function stallHTML(k) {
    const f = farmOf(k.id);
    const made = Object.entries(f.basket).filter(([g, n]) => n > 0 && RECIPES.some((r) => r.id === g));
    const value = Object.entries(f.basket).filter(([, n]) => n > 0).reduce((s, [g, n]) => s + (RECIPES.some((r) => r.id === g) ? madePrice(f, g) : priceOf(f, g)) * n, 0);
    return `<div class="shop-head"><h2>🧺 ${esc(k.name)}'s market stall</h2><button class="farm-btn small" data-close>Close</button></div>
      ${marketDay() ? '<p class="star-note">🎵 It\'s Market Day! Everything you make sells for 3 more coins.</p>' : '<p class="star-note">Make things from your basket. They sell for more than the bits that go in!</p>'}
      <div class="tw-basket">🧺 ${Object.entries(f.basket).filter(([, n]) => n > 0).map(([g, n]) => `${GOODS[g]?.icon || '❓'}×${n}`).join(' ') || '<small>Your basket is empty. Feed your animals and pick your crops!</small>'}</div>
      <div class="shop-list">${RECIPES.map((r) => {
        const locked = r.needs && !isDone(r.needs);
        const ok = canMake(f, r);
        const inTxt = Object.entries(r.in).map(([g, n]) => `${n} ${GOODS[g].icon}`).join(' + ');
        return `<div class="shop-item ${locked ? 'locked' : ''}"><span class="shop-icon">${GOODS[r.id].icon}</span>
          <div><b>${esc(r.name)}</b><small>${inTxt} → sells for 🪙 ${madePrice(f, r.id)} <span class="tw-dim">(the bits are 🪙 ${partsValue(f, r)})</span></small></div>
          <button class="farm-btn small" data-make="${r.id}" ${ok ? '' : 'disabled'}>${locked ? `🔒 Needs the ${projectOf(r.needs).name.toLowerCase()}` : 'Make it!'}</button></div>`;
      }).join('')}</div>
      ${value ? `<button class="farm-btn sell" data-sellall>Sell everything at my stall for 🪙 ${value}${made.length ? '' : ''}</button>` : ''}`;
  }
  function openStall(k) {
    const f = farmOf(k.id);
    if (!f.stall) return buildStall(k);
    ctx.speak('Your market stall! Make things from your basket, then sell them.', true);
    const el = overlay(stallHTML(k), (e) => {
      if (e.target.closest('[data-close]') || e.target === el) return el.remove();
      const mk = e.target.closest('[data-make]');
      if (mk && !mk.disabled) {
        const r = RECIPES.find((x) => x.id === mk.dataset.make), g = farmOf(k.id);
        if (!canMake(g, r)) return;
        for (const [id, n] of Object.entries(r.in)) g.basket[id] -= n;
        g.basket[r.id] = (g.basket[r.id] || 0) + 1;
        save(); sound('pop');
        ctx.speak(`You made ${r.name.toLowerCase()}!`, true);
        el.querySelector('.farm-sheet').innerHTML = stallHTML(k);
        return;
      }
      if (e.target.closest('[data-sellall]')) {
        const g = farmOf(k.id);
        const value = Object.entries(g.basket).filter(([, n]) => n > 0).reduce((s, [id, n]) => s + (RECIPES.some((r) => r.id === id) ? madePrice(g, id) : priceOf(g, id)) * n, 0);
        g.sold += value; g.basket = {};
        save(); sound('coins');
        el.remove(); ctx.renderKid(); ctx.burst(document.querySelector('.farm-coins'), 18);
        ctx.speak(`Sold at your stall for ${value} coins!`, true);
      }
    });
    el.classList.add('shop');
  }
  function buildStall(k) {
    const f = farmOf(k.id);
    if (f.stall) return;
    const short = balance(k.id) < STALL.price ? `You need ${STALL.price - balance(k.id)} more coins.` : starsLeft(k.id) < STALL.stars ? `You need ${STALL.stars - starsLeft(k.id)} more job stars.` : '';
    ctx.speak(`Your own market stall! Make apple juice, carrot juice, scarves and more, and sell them for extra coins. It costs ${STALL.price} coins and ${STALL.stars} job stars. ${short}`, true);
    const el = overlay(`<div class="tw-open"><img src="${ART}t-stall.webp" alt=""></div><h2>🧺 Your own market stall</h2>
      <p>Turn apples into juice, wool into scarves, sunflowers into posies. Things you make sell for more than the bits that go in!</p>
      <button class="farm-btn feed" data-yes ${short ? 'disabled' : ''}>${short ? esc(short) : `Build it! 🪙 ${STALL.price} + ⭐ ${STALL.stars}`}</button><button class="farm-btn" data-close>Not yet</button>`, (e) => {
      if (e.target.closest('[data-close]') || e.target === el) return el.remove();
      const b = e.target.closest('[data-yes]');
      if (!b || b.disabled) return;
      const g = farmOf(k.id);
      if (g.stall || balance(k.id) < STALL.price || starsLeft(k.id) < STALL.stars) return;
      g.spent += STALL.price; g.starsSpent = (g.starsSpent || 0) + STALL.stars; g.stall = true;
      save(); el.remove(); ctx.chime(); ctx.burst(null, 40); ctx.renderKid();
      ctx.speak('You built your market stall! Tap it to make things and sell them.', true);
    });
  }

  // ---------- my farmer + the dress-up shop ----------
  function makerHTML(me, tab, k) {
    const coins = balance(k.id);
    const tabs = [['look', '🙂 Face'], ['hair', '💇 Hair'], ['clothes', '👕 Clothes'], ['hat', '🎩 Hats']];
    let opts = '';
    if (tab === 'look') opts = SKINS.map((c, i) => `<button class="tw-sw${me.skin === i ? ' on' : ''}" data-set="skin" data-v="${i}" style="background:${c}" aria-label="Skin ${i + 1}"></button>`).join('');
    if (tab === 'hair') opts = `<div class="tw-row">${HAIRS.map((h) => `<button class="tw-opt${me.hair === h.id ? ' on' : ''}" data-set="hair" data-v="${h.id}">${farmerSVG({ ...me, hair: h.id, hat: 'none' }, { size: 72, head: true })}<small>${h.name}</small></button>`).join('')}</div>
      <div class="tw-row">${HAIR_COLOURS.map((h) => `<button class="tw-sw${me.hairColor === h.id ? ' on' : ''}" data-set="hairColor" data-v="${h.id}" style="background:${h.c}" aria-label="${h.name}"></button>`).join('')}</div>`;
    const item = (list, key) => list.map((o) => {
      const own = has(me, o);
      return `<button class="tw-opt${me[key] === o.id ? ' on' : ''}${own ? '' : ' buy'}" data-${own ? 'set' : 'buy'}="${key}" data-v="${o.id}">${farmerSVG({ ...me, [key]: o.id }, { size: 64 })}<small>${o.name}</small>${own ? '' : `<i>🪙 ${o.price}</i>`}</button>`;
    }).join('');
    if (tab === 'clothes') opts = `<div class="tw-row">${item(OUTFITS, 'outfit')}</div>`;
    if (tab === 'hat') opts = `<div class="tw-row">${item(HATS, 'hat')}</div>`;
    return `<div class="shop-head"><h2>🧑‍🌾 My farmer</h2><span class="farm-coins">🪙 <b>${coins}</b></span><button class="farm-btn small feed" data-close>✓ Done</button></div>
      <div class="tw-maker"><div class="tw-big">${farmerSVG(me, { wave: true })}</div>
      <div class="tw-pick"><div class="tw-tabs">${tabs.map(([id, n]) => `<button class="farm-btn small${tab === id ? ' sellhen' : ''}" data-tab="${id}">${n}</button>`).join('')}</div><div class="tw-opts">${opts}</div></div></div>`;
  }
  function openMaker(k, tab = 'look') {
    const f = farmOf(k.id);
    const first = !f.me;
    if (first) { f.me = freshMe(kids().findIndex((x) => x.id === k.id)); save(); }
    let armed = null;
    ctx.speak(first ? `Make your own farmer, ${k.name}! Choose your face, your hair and your clothes.` : 'Your farmer! Change anything you like.', true);
    const el = overlay(makerHTML(f.me, tab, k), (e) => {
      const g = farmOf(k.id);
      if (e.target.closest('[data-close]')) { el.remove(); ctx.renderKid(); return ctx.speak('Looking great!', true); }
      const t = e.target.closest('[data-tab]');
      if (t) { tab = t.dataset.tab; armed = null; }
      const s = e.target.closest('[data-set]');
      if (s) { const key = s.dataset.set; g.me[key] = key === 'skin' ? Number(s.dataset.v) : s.dataset.v; armed = null; save(); sound('pop'); }
      const b = e.target.closest('[data-buy]');
      if (b) {   // first tap reads it out, second tap buys it (like the farm shop)
        const key = b.dataset.buy, list = key === 'outfit' ? OUTFITS : HATS, o = list.find((x) => x.id === b.dataset.v);
        if (armed !== o.id) {
          armed = o.id;
          ctx.speak(balance(k.id) >= o.price ? `${o.name}. ${o.price} coins. Tap again to buy it.` : `${o.name} costs ${o.price} coins. You need ${o.price - balance(k.id)} more.`, true);
          b.classList.add('armed');
          return;
        }
        if (has(g.me, o) || balance(k.id) < o.price) return;
        g.spent += o.price; (g.me.owned ||= []).push(o.id); g.me[key] = o.id; armed = null;
        save(); sound('coins'); ctx.burst(null, 20);
        ctx.speak(`You bought the ${o.name.toLowerCase()}!`, true);
      }
      el.querySelector('.farm-sheet').innerHTML = makerHTML(g.me, tab, k);
    });
    el.classList.add('shop', 'tw-ov');
  }

  // ---------- noticeboard ----------
  function openBoard(k) {
    const t = town(), cur = current(), p = cur && projectOf(cur.id);
    const next = PROJECTS.find((x) => !t.done.includes(x.id) && x.id !== cur?.id);
    ctx.speak(`The town noticeboard. ${p ? `Now building the ${p.name.toLowerCase()}.` : ''} Town pieces come from finishing your morning and night jobs, praying, and kind moments.`, true);
    const el = overlay(`<h2>📌 Town noticeboard</h2>
      <div class="tw-card"><b>Where town pieces come from</b><small>⚪ silver: finish your morning jobs, and your night jobs<br>🟡 gold: prayer time<br>💎 gems: kind, brave and helpful moments a grown-up keeps at night</small><small>Up to ${BAG_CAP} pieces a day. They also go to your building on the Rock.</small></div>
      ${p ? `<div class="tw-card"><b>Now building: ${p.icon} ${esc(p.name)}</b><small>${esc(p.perk)}</small></div>` : ''}
      ${next ? '<div class="tw-card"><b>After that: ❓ a surprise!</b></div>' : ''}
      ${t.done.length ? `<div class="tw-card"><b>Built so far</b><small>${t.done.map((id) => `${projectOf(id).icon} ${esc(projectOf(id).name)}`).join(' · ')}</small></div>` : ''}
      <button class="farm-btn" data-close>Close</button>`, (e) => { if (e.target.closest('[data-close]') || e.target === el) el.remove(); });
  }

  // ---------- tapping a finished building ----------
  function tapBuilt(k, id, el) {
    el?.classList.remove('bounce'); void el?.offsetWidth; el?.classList.add('bounce');
    const f = farmOf(k.id);
    if (id === 'fountain') {
      if (f.wishDay === today()) return ctx.speak('Splash! You already made a wish today. Come back tomorrow!', true);
      f.wishDay = today();
      const decor = ['🌻', '🌷', '🎃', '🪁', '🌳', '🍄'].filter((d) => !f.decor.includes(d));
      if (decor.length && Math.random() < 0.25) { const d = decor[Math.floor(Math.random() * decor.length)]; f.decor.push(d); ctx.toast(`⛲ Your wish came true: a ${d} for your farm!`); ctx.speak('Your wish came true! Something pretty for your farm!', true); }
      else { f.sold += 2; ctx.toast('⛲ Splash! A lucky 🪙 2!'); ctx.speak('Splash! You found 2 lucky coins!', true); }
      save(); sound('coins'); ctx.renderKid();
      return;
    }
    if (id === 'church') { sound('bell'); return ctx.speak(`Ding dong! ${VERSE}`, true); }
    if (id === 'bandstand') { sound('tune'); return ctx.speak(marketDay() ? "It's Market Day! Things you make sell for more today." : 'La la la! On Saturdays it is Market Day.', true); }
    if (id === 'clock') { sound('bell'); return ctx.speak('Tick tock! You get 1 extra build move on your farm every day.', true); }
    if (id === 'bakery') return ctx.speak('Mmm, fresh bread! Bake bread and honey cakes at your market stall.', true);
  }

  async function opened(k) {
    view.visit = null;
    current();
    ctx.renderKid();
    await celebrate(k);
    if (!farmOf(k.id).me) openMaker(k);
    else ctx.speak(`Welcome to town, ${k.name}!`, true);
  }

  function action(a, el, k) {
    switch (a) {
      case 'farm-town-give': return give(k, el.dataset.kind, false);
      case 'farm-town-proj': { const cur = current(); const p = cur && projectOf(cur.id); return p && ctx.speak(cur.fullDay ? `The ${p.name.toLowerCase()} opens tomorrow!` : `We're building the ${p.name.toLowerCase()}! Give your town pieces to help.`, true); }
      case 'farm-town-tap': return tapBuilt(k, el.dataset.p, el);
      case 'farm-town-stall': return openStall(k);
      case 'farm-town-dress': return openMaker(k, 'clothes');
      case 'farm-town-me': return openMaker(k);
      case 'farm-town-board': return openBoard(k);
      case 'farm-town-visit': { view.visit = el.dataset.kid; ctx.renderKid(); const x = kids().find((y) => y.id === view.visit); return ctx.speak(`Visiting ${x?.name}'s farm!`, true); }
      case 'farm-town-back': view.visit = null; return ctx.renderKid();
      case 'farm-town-noop': return ctx.speak('That is not your stall. Build your own!', true);
    }
  }

  const extraMoves = () => (isDone('clock') ? 1 : 0);
  const title = (k) => (view.visit ? `👋 ${kids().find((y) => y.id === view.visit)?.name || ''}'s farm` : '🏘️ Town Square');
  const reset = () => { view.visit = null; };
  return { reset, title, bodyHTML, action, opened, addPiece, meOf, extraMoves, current, isDone, visiting: () => !!view.visit };
}
