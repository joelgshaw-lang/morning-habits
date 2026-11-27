// 🪙± Coins from the front board (18 Nov 2026).
// Any grown-up taps 🪙± on a child's column (no PIN) and picks a good or hard moment. It waits (⏳) until a
// grown-up checks it at night with the PIN: ✓ Keep adds or takes the coins (as a Grown-ups coin change, so it
// shows in their history) and sends a Build on the Rock piece: a gem for a good moment, wood, hay or stubble
// for a hard one. ✕ Not quite drops it. Saved in IndexedDB as 'quickLog'.

export const GOOD = [
  { id: 'obey', icon: '🙋', label: 'Obeyed straight away', fruit: 'f' },   // 24 Nov 2026 (Joel): obeying straight away is a key thing to work on
  { id: 'kind', icon: '💛', label: 'Kind', fruit: 'k' },
  { id: 'helpful', icon: '🤝', label: 'Helpful', fruit: 'l' },
  { id: 'attitude', icon: '😊', label: 'Great attitude', fruit: 'j' },
  { id: 'calm', icon: '🧘', label: 'Calmed down', fruit: 'r' },
  { id: 'truth', icon: '🙌', label: 'Told the truth', fruit: 'b' },
  { id: 'patient', icon: '⏳', label: 'Waited well', fruit: 't' },
];
// 1 Cor 3:12: wood, hay, stubble. Bigger things are wood, unkind words are hay, the small grumbles stubble.
export const HARD = [
  { id: 'tantrum', icon: '😡', label: 'Tantrum', material: 'wood' },   // a blow-up: wood (content.js: wood = fights and blow-ups)
  { id: 'listen', icon: '🙉', label: "Didn't listen", material: 'stubble' },
  { id: 'unkind', icon: '🗯️', label: 'Unkind words', material: 'hay' },
  { id: 'rude', icon: '😤', label: 'Rude', material: 'hay' },
  { id: 'fight', icon: '🥊', label: 'Fighting', material: 'wood' },
  { id: 'disobeyed', icon: '🙅', label: 'Disobeyed', material: 'wood' },
];
const AMOUNTS = [1, 2, 5];
// Gem colour for each good moment's fruit (k kindness, l love, j joy, r self-control, b goodness, t patience).
const GEM_COLOR = { k: '#ec4899', l: '#ef4444', j: '#facc15', r: '#22c55e', b: '#38bdf8', t: '#a855f7', f: '#f97316', p: '#14b8a6', e: '#f9a8d4' };
// Build on the Rock fruit codes → the Fruit Friend who jumps out with the gem (js/fruit-art.js).
const FRIEND_OF = { l: 'love', j: 'joy', p: 'peace', t: 'patience', k: 'kindness', b: 'goodness', f: 'faithfulness', e: 'gentleness', r: 'selfcontrol' };
const MATERIAL = { wood: '🪵 wood', hay: '🌾 hay', stubble: '🥀 stubble' };

import { FRIENDS } from './fruit-art.js';

export function createQuick(ctx) {
  const { state, esc } = ctx;
  let amount = 2;
  const list = () => (state.quickLog ||= []);
  const save = () => ctx.kvSet('quickLog', list());
  const waitingFor = (id) => list().filter((q) => q.kidId === id && q.status === 'waiting');
  const waitingAll = () => list().filter((q) => q.status === 'waiting');
  const signed = (n) => (n > 0 ? `+${n}` : `−${-n}`);

  async function load() { state.quickLog = (await ctx.kvGet('quickLog')) || []; }

  // The little ⏳ note on a child's column: what's waiting for tonight's check.
  function chipHTML(k) {
    const w = waitingFor(k.id);
    if (!w.length) return '';
    const plus = w.filter((q) => q.n > 0).reduce((a, q) => a + q.n, 0), minus = w.filter((q) => q.n < 0).reduce((a, q) => a + q.n, 0);
    return `<span class="col-waiting quick-wait" title="Waiting for tonight's check">⏳${plus ? ` +${plus}` : ''}${minus ? ` −${-minus}` : ''}</span>`;
  }

  // The front-board sheet: pick an amount and a moment. No PIN; it waits for the night check.
  function openAdd(id) {
    const k = ctx.kid(id);
    amount = 2; // never carry an amount over from another child
    const draw = () => `<h2>${k.avatar} ${esc(k.name)}: coins</h2>
      <p class="pf-note">A grown-up checks these tonight with the PIN.</p>
      <div class="qk-amounts">${AMOUNTS.map((a) => `<button class="${a === amount ? 'on' : ''}" data-amt="${a}">🪙 ${a}</button>`).join('')}</div>
      <h3>➕ Good moment</h3><div class="qk-grid good">${GOOD.map((g) => `<button data-good="${g.id}">${g.icon}<small>${esc(g.label)}</small></button>`).join('')}</div>
      <h3>➖ Hard moment</h3><div class="qk-grid hard">${HARD.map((h) => `<button data-hard="${h.id}">${h.icon}<small>${esc(h.label)}</small></button>`).join('')}</div>
      ${waitingFor(id).length ? `<h3>⏳ Waiting for tonight</h3>${waitingFor(id).map(rowHTML(false)).join('')}` : ''}
      <button class="farm-btn small" data-c="close">Done</button>`;
    const el = ctx.sheet(draw(), async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const ds = b.dataset;
      if (ds.c === 'close') return el.remove();
      if (ds.amt) amount = Number(ds.amt);
      if (ds.good || ds.hard) {
        const m = ds.good ? GOOD.find((g) => g.id === ds.good) : HARD.find((h) => h.id === ds.hard);
        list().push({ id: `q${Date.now().toString(36)}`, kidId: id, kind: m.id, icon: m.icon, label: m.label, fruit: m.fruit, material: m.material,
          n: ds.good ? amount : -amount, t: ctx.clock.now().toISOString(), status: 'waiting' });
        await save();
        // 24 Nov 2026 (Joel): the sheet stays open so several can be logged in a row (e.g. kind words, kind words).
        el.querySelector('.farm-sheet').innerHTML = draw();
        ctx.renderKid();
        return bigMoment(k, m, !!ds.good);
      }
      if (ds.undoQuick) { state.quickLog = list().filter((q) => q.id !== ds.undoQuick); await save(); }
      el.querySelector('.farm-sheet').innerHTML = draw();
      ctx.renderKid();
    });
    el.classList.add('qk-ov');
  }

  // 💎 Big moment (24 Nov 2026, Joel): a good moment bursts with gold, silver and a big flashing gem, and the matching
  // Fruit Friend jumps out. A hard moment shows a big stinky pile of hay: "Hey, that is stinky and sad."
  // Full screen, gone after a few seconds or a tap. It says where the piece goes, so the child knows it counted.
  // 25 Nov 2026 (Joel): the voice must not say "stinky" every time, so the hard-moment words take turns.
  const SAD_LINES = [
    ['Oh no. That one is hay and stubble.', "Oh no. That one is hay and stubble. Let's make it right."],
    ["That one won't last in the fire.", "That one won't last in the fire. Let's make it right."],
    ['Hmm. That was a hard moment.', "Hmm. That was a hard moment. Let's make it right."],
    ['Hey, that is stinky and sad.', 'Hey, that is stinky and sad.'],
  ];
  let sadTurn = Math.floor(Math.random() * SAD_LINES.length);
  function bigMoment(k, m, good) {
    const [sadHead, sadSay] = SAD_LINES[sadTurn++ % SAD_LINES.length];
    document.querySelector('.big-moment')?.remove();
    const ov = document.createElement('div');
    ov.className = `big-moment ${good ? 'bm-good' : 'bm-sad'}`;
    const c = GEM_COLOR[m.fruit] || '#38bdf8';
    const friend = good && FRIENDS[FRIEND_OF[m.fruit]];
    const bits = good ? Array.from({ length: 12 }, (_, i) => `<i class="bm-spark ${['gold', 'silver', 'gem'][i % 3]}" style="--c:${c}"></i>`).join('') : '';
    ov.innerHTML = good
      ? `<div class="bm-burst"></div>${bits}
        <div class="bm-row">
        <svg class="bm-gem" viewBox="0 0 200 180" style="--gem:${c}" aria-hidden="true">
          <polygon points="50,10 150,10 195,62 100,175 5,62" fill="${c}"/>
          <polygon points="50,10 75,62 5,62" fill="#fff" opacity=".45"/><polygon points="150,10 125,62 195,62" fill="#000" opacity=".12"/>
          <polygon points="50,10 150,10 125,62 75,62" fill="#fff" opacity=".28"/><polygon points="75,62 125,62 100,175" fill="#fff" opacity=".18"/>
          <polygon points="5,62 75,62 100,175" fill="#000" opacity=".08"/><polygon points="195,62 125,62 100,175" fill="#000" opacity=".2"/>
          <polygon points="62,22 88,22 72,44" fill="#fff" opacity=".85"/></svg>
        ${friend ? `<div class="bm-friend">${friend.svg}</div>` : ''}</div>
        <h2>WOW, ${esc(k.name)}!</h2><p>${m.icon} ${esc(m.label)}! A big gem for you! 💎</p>
        <small>It goes on your building tonight, when a grown-up says yes.</small>`
      : `<div class="bm-pile"><span>🌾</span><span>🌾</span><span>🌾</span><span>🌾</span><span>🌾</span><span>🌾</span>
          <i class="bm-fly">🪰</i><i class="bm-fly f2">🪰</i><b class="bm-stink">〰️</b><b class="bm-stink s2">〰️</b><b class="bm-stink s3">〰️</b></div>
        <h2>${sadHead}</h2><p>${m.icon} ${esc(m.label)}. Let's make it right. 💛</p>
        <small>It goes on your building tonight, when a grown-up says yes.</small>`;
    document.body.appendChild(ov);
    if (good) { ctx.chime?.(); ctx.speak?.(`Wow, ${k.name}! ${m.label}! A big gem for you!`); }
    else ctx.speak?.(sadSay);
    const close = () => ov.remove();
    ov.addEventListener('click', close);
    setTimeout(close, good ? 4500 : 3500);
  }

  // One waiting row. check = true shows ✓ Keep / ✕ Not quite (night check); false shows a remove button (front board).
  const rowHTML = (check) => (q) => `<div class="claim-row qk-row"><span>${q.icon}</span><b>${esc(q.label)}</b>
    <small>🪙 ${signed(q.n)}${q.material ? ` · ${MATERIAL[q.material]}` : ''} · ${new Date(q.t).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}</small>
    ${check ? `<button class="farm-btn small ok" data-keep="${q.id}">✓ Yes</button><button class="farm-btn small" data-drop="${q.id}">✕ No</button>`
      : `<button class="farm-btn small" data-undo-quick="${q.id}">✕ Remove</button>`}</div>`;

  // For the Grown-ups child page: this child's waiting moments with Keep / Not quite.
  function sectionHTML(k) {
    const w = waitingFor(k.id);
    return w.length ? `<h3>🌙 Coins from the front board</h3>${w.map(rowHTML(true)).join('')}` : '';
  }

  // The night check from the board (PIN): every child's waiting moments in one sheet.
  async function openCheck() {
    if (!(await ctx.grownUp('night check of coins'))) return;
    const draw = () => {
      const kids = state.settings.kids.filter((k) => waitingFor(k.id).length);
      return `<h2>🌙 Tonight's coin check</h2>
        ${kids.length ? kids.map((k) => `<h3 style="color:${k.color}">${k.avatar} ${esc(k.name)}</h3>${waitingFor(k.id).map(rowHTML(true)).join('')}`).join('') : '<p>All checked. Thank you!</p>'}
        <button class="farm-btn small" data-c="close">Done</button>`;
    };
    const el = ctx.sheet(draw(), async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.c === 'close') { el.remove(); return ctx.renderKid(); }
      if (await handle(b)) el.querySelector('.farm-sheet').innerHTML = draw();
    });
  }

  // ✓ Keep / ✕ Not quite. Returns true if it handled the tap.
  async function handle(b) {
    const ds = b.dataset;
    const q = list().find((x) => x.id === (ds.keep || ds.drop));
    if (!q || q.status !== 'waiting') return false;
    q.status = ds.keep ? 'kept' : 'dropped';
    q.checkedAt = ctx.clock.now().toISOString();
    ctx.sendToRock(q.kidId, { kind: 'night' });   // a night a grown-up checked: it counts toward the child's level in Build on the Rock (once a night)
    if (ds.keep) {
      // A kept moment is a coin change like the ones in Grown-ups → coins (it shows in their history), never below zero.
      const have = ctx.coinsOf(q.kidId);
      const n = q.n < 0 ? Math.max(q.n, -have) : q.n;
      if (n) {
        state.coinAdjust = [...(state.coinAdjust || []), { kidId: q.kidId, n, why: `${q.icon} ${q.label}`, t: q.checkedAt, quick: q.id }];
        await ctx.kvSet('coinAdjust', state.coinAdjust);
      }
      ctx.sendToRock(q.kidId, q.n > 0 ? { kind: 'gem', fruit: q.fruit, label: q.label } : { kind: 'straw', material: q.material, moment: q.kind, label: q.label });
      ctx.toast(`🏰 Sent to ${esc(ctx.kid(q.kidId)?.name || '')}'s building: ${q.icon} ${esc(q.label)} (${q.n > 0 ? '💎 gem' : MATERIAL[q.material]})`);
    }
    await save();
    await ctx.refreshSummary();
    return true;
  }

  // 🌱 Growing bonus (21 Nov 2026, Joel): a child who had FEWER kept hard moments yesterday than the day before
  // gets bonus coins the next day. Waits until yesterday's moments are all checked. Once per day per child
  // (marked on the coin change with `grow: <yesterday>`), so it shows in their coin history like any other.
  const GROW_BONUS = 3;
  async function growBonus() {
    if (!state.settings) return;
    const start = state.settings.dayStartHour, now = ctx.clock.now().getTime();
    const key = (ms) => ctx.clock.dayKey(new Date(ms), start);
    const y = key(now - 86400000), d = key(now - 2 * 86400000);
    const adj = state.coinAdjust || [];
    let gave = false;
    for (const k of state.settings.kids) {
      if (adj.some((a) => a.kidId === k.id && a.grow === y)) continue;
      const hard = (day) => list().filter((q) => q.kidId === k.id && q.n < 0 && q.status !== 'dropped' && key(Date.parse(q.t)) === day);
      const yHard = hard(y);
      if (yHard.some((q) => q.status === 'waiting')) continue; // not checked yet: decide once it is
      const before = hard(d).length, after = yHard.length;
      if (after >= before) continue;
      adj.push({ kidId: k.id, n: GROW_BONUS, why: `🌱 Fewer hard moments (${before} → ${after})`, t: new Date(now).toISOString(), grow: y });
      ctx.toast(`🌱 ${esc(k.name)}: fewer hard moments yesterday (${before} → ${after})! +${GROW_BONUS} 🪙`);
      gave = true;
    }
    if (gave) { state.coinAdjust = adj; await ctx.kvSet('coinAdjust', adj); }
    return gave;
  }

  return { load, chipHTML, openAdd, openCheck, sectionHTML, handle, waitingFor, waitingAll, growBonus };
}
