// The Fruit Tree: one shared family tree. Prayer is water; fruit is what God grows.
// See docs/fruit-tree-concept.md. Kept apart from coins, streaks and the leaderboard on purpose.

import { dayAll, dayPut } from './db.js';
import * as clock from './clock.js';
import { FRUITS, CARDS, FRUIT_PER_DAY, BREATH } from './config.js';

const HOLD_MS = 800;
const RAIN_MS = 8000;      // the drop button rests while it rains, so prayers can't be spammed
const BREATHS = 4;         // 4 breaths × 8s ≈ 30s, short enough for a 6-year-old mid-meltdown
const BREATH_MS = 8000;
const TELL_MS = 12000;     // quiet time after "Now tell Jesus what happened"

// Canopy circles [cx, cy, r] in the SVG viewBox (0 0 640 600).
const CANOPY = [[320, 250, 165], [180, 290, 105], [460, 290, 105], [230, 160, 110], [410, 160, 110], [320, 105, 100]];
const LEAF = ['#4caf50', '#43a047', '#5cb85c', '#4caf50', '#66bb6a', '#57b55a'];

function seeded(seed) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

// Fixed, evenly spread fruit spots inside the canopy, so each fruit always lands in the same place.
// Fruit fill spots in this (random-looking) order rather than one branch at a time.
const SLOTS = (() => {
  const r = seeded(42);
  const pts = [];
  for (let i = 0; pts.length < 110 && i < 30000; i++) {
    const x = 40 + r() * 560;
    const y = 20 + r() * 400;
    const inside = CANOPY.some(([cx, cy, cr]) => Math.hypot(x - cx, y - cy) < cr - 22);
    if (inside && pts.every(([px, py]) => Math.hypot(x - px, y - py) > 34)) pts.push([x, y]);
  }
  return pts;
})();

// Past the first 110 fruit, spots take a second and third fruit, nudged over like a bunch.
function slotFor(i) {
  const [x, y] = SLOTS[i % SLOTS.length];
  const layer = Math.floor(i / SLOTS.length);
  return [x + layer * 12 * (layer % 2 ? 1 : -1), y + layer * 9];
}

const pad = (n) => String(n).padStart(2, '0');

export function createTree(ctx) {
  const { state, app, overlay, esc } = ctx;
  let fruit = [];          // every fruit ever grown, oldest first: { kidId, dayKey, t, card, fruit }
  let weekDrops = {};      // kidId -> prayers this week (each child only ever sees their own)
  let todayCount = 0;
  let weekFruit = 0;
  let rainUntil = 0;
  let undoInfo = null;
  let hold = null;
  let calm = null;         // Stop & Pray session: { kidId, feeling, phase, timers }

  function weekStartKey() {
    const [y, m, d] = ctx.todayKey().split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7)); // back to Monday
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  }

  async function load() {
    const all = await dayAll();
    const wk = weekStartKey();
    const today = ctx.todayKey();
    fruit = all
      .flatMap((d) => (d.fruit || []).map((f) => ({ ...f, kidId: d.kidId, dayKey: d.dayKey })))
      .sort((a, b) => (a.t < b.t ? -1 : 1));
    weekDrops = {};
    todayCount = 0;
    for (const d of all) {
      if (d.dayKey >= wk) weekDrops[d.kidId] = (weekDrops[d.kidId] || 0) + (d.drops || []).length;
      if (d.dayKey === today) todayCount += (d.drops || []).length + (d.fruit || []).length;
    }
    weekFruit = fruit.filter((f) => f.dayKey >= wk).length;
  }

  // ---------- drawing ----------

  function treeSVG(sel) {
    const fruitEls = fruit.map((f, i) => {
      const [x, y] = slotFor(i);
      const cls = sel ? (f.kidId === sel.id ? 'mine' : 'dim') : '';
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="fruit ${cls}" data-action="tree-fruit" data-i="${i}">${FRUITS[f.fruit]?.icon || '🍏'}</text>`;
    }).join('');
    return `
      <svg viewBox="0 0 640 600" class="tree-svg" role="img" aria-label="Family fruit tree with ${fruit.length} fruit">
        <ellipse cx="320" cy="570" rx="300" ry="26" fill="#9bd27f"/>
        <g class="roots">
          <path d="M320 545 C 290 560, 250 566, 196 576"/>
          <path d="M320 545 C 352 561, 398 566, 446 577"/>
          <path d="M314 550 C 306 566, 298 578, 282 592"/>
          <path d="M328 550 C 340 566, 352 578, 368 592"/>
        </g>
        <g class="sway">
          <path d="M292 562 C 302 470, 298 400, 284 330 L 356 330 C 342 400, 338 470, 348 562 Z" fill="#8b5a2b"/>
          <g class="branches">
            <path d="M302 370 C 262 330, 222 305, 186 292"/>
            <path d="M338 370 C 378 330, 418 305, 456 292"/>
            <path d="M320 340 C 318 270, 318 200, 320 132"/>
            <path d="M306 345 C 282 268, 252 212, 234 168"/>
            <path d="M334 345 C 358 268, 388 212, 406 168"/>
          </g>
          ${CANOPY.map(([cx, cy, r], i) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${LEAF[i]}"/>`).join('')}
          ${fruitEls}
          <text x="478" y="212" class="bird">🐦</text>
        </g>
      </svg>`;
  }

  function panelPick() {
    return `
      <h2 class="panel-title">Who are you?</h2>
      <div class="tree-faces">
        ${state.settings.kids.map((k) => `
          <button class="face-btn" style="--kid:${k.color}" data-action="tree-pick" data-kid="${k.id}">
            <span class="face">${k.avatar || '🙂'}</span><span>${esc(k.name)}</span>
          </button>`).join('')}
      </div>
      <button class="btn calm-btn" data-action="tree-calm">🌧️ Feeling upset? Stop &amp; Pray</button>`;
  }

  function panelKid(k) {
    const n = weekDrops[k.id] || 0;
    const raining = Date.now() < rainUntil;
    return `
      <div class="panel-head">
        <button class="btn" data-action="tree-unpick" aria-label="Back">←</button>
        <span class="face">${k.avatar || '🙂'}</span>
        <h2>${esc(k.name)}</h2>
        <button class="btn calm-mini" data-action="tree-calm" aria-label="Stop and Pray">🌧️</button>
      </div>
      <button class="drop-btn ${raining ? 'raining' : ''}" data-action="tree-drop">
        <span class="drop-icon">💧</span><span>${raining ? 'It’s raining on the roots…' : 'I stopped to pray'}</span>
      </button>
      <p class="drop-count">You talked to God <b>${n}</b> time${n === 1 ? '' : 's'} this week.</p>
      <div class="cards-grid">
        ${CARDS.map((c) => `
          <div class="card" role="button" data-card="${c.id}">
            <span class="card-icon">${c.icon}</span>
            <span class="card-label">${esc(c.label)}</span>
            <span class="card-fruit">${FRUITS[c.fruit].icon} ${FRUITS[c.fruit].name}</span>
          </div>`).join('')}
      </div>`;
  }

  async function render() {
    await load();
    const sel = state.treeKid ? ctx.kid(state.treeKid) : null;
    const caption = todayCount === 0
      ? '🌱 The roots are still strong. Jesus holds the tree.'
      : `This week: 💧 ${Object.values(weekDrops).reduce((a, b) => a + b, 0)} prayers · ${weekFruit} new fruit`;
    app.innerHTML = `
      <section class="screen tree-screen" style="--kid:${sel?.color || '#16a34a'}">
        <header class="top">
          <h1>🌳 Our Fruit Tree</h1>
          <button class="btn" data-action="tree-morning">☀️ Morning</button>
          ${ctx.clockHTML()}
        </header>
        <div class="tree-body">
          <div class="tree-wrap ${sel ? 'has-sel' : ''}">
            ${treeSVG(sel)}
            <p class="tree-caption">${caption}</p>
          </div>
          <aside class="tree-panel">${sel ? panelKid(sel) : panelPick()}</aside>
        </div>
      </section>`;
  }

  // ---------- prayer drops ----------

  function dripSound() {
    ctx.tone((ac) => {
      [880, 660, 990].forEach((f, i) => {
        const t = ac.currentTime + i * 0.18;
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.frequency.setValueAtTime(f, t);
        o.frequency.exponentialRampToValueAtTime(f * 0.6, t + 0.15);
        g.gain.setValueAtTime(0.12, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
        o.connect(g).connect(ac.destination);
        o.start(t);
        o.stop(t + 0.25);
      });
    });
  }

  function rain() {
    const wrap = app.querySelector('.tree-wrap');
    if (!wrap) return;
    const box = document.createElement('div');
    box.className = 'rain';
    box.innerHTML = Array.from({ length: 16 }, (_, i) =>
      `<span style="left:${15 + ((i * 37) % 70)}%;animation-delay:${(i % 6) * 0.18}s">💧</span>`).join('');
    wrap.appendChild(box);
    wrap.classList.add('watered');
    dripSound();
    setTimeout(() => { box.remove(); wrap.classList.remove('watered'); }, 3200);
  }

  async function addDrop(kidId, src, extra = {}) {
    const day = await ctx.loadDay(kidId);
    day.drops.push({ t: clock.now().toISOString(), src, ...extra });
    await dayPut(day);
    weekDrops[kidId] = (weekDrops[kidId] || 0) + 1;
  }

  async function prayed() {
    const k = ctx.kid(state.treeKid);
    if (!k || Date.now() < rainUntil) return;
    rainUntil = Date.now() + RAIN_MS;
    await addDrop(k.id, 'tap');
    const n = weekDrops[k.id];
    ctx.speak(`Thank you for talking to God. You talked to God ${n} time${n === 1 ? '' : 's'} this week. He heard every one.`);
    await render();
    rain();
    setTimeout(() => { if (state.treeKid === k.id && !hold) render(); }, RAIN_MS + 50);
  }

  // ---------- fruit ----------

  async function plant(cardId) {
    const k = ctx.kid(state.treeKid);
    const card = CARDS.find((c) => c.id === cardId);
    if (!k || !card) return;
    const day = await ctx.loadDay(k.id);
    if (day.fruit.length >= FRUIT_PER_DAY) {
      ctx.speak('Your branch is full for today. Tell the family about it at dinner!');
      ctx.toast('🧺 Your branch is full for today. Tell the family at dinner!');
      return;
    }
    const f = FRUITS[card.fruit];
    const entry = { t: clock.now().toISOString(), card: card.id, fruit: card.fruit };
    day.fruit.push(entry);
    await dayPut(day);
    undoInfo = { kidId: k.id, t: entry.t };
    await render();
    // Blossom first, then it ripens into the fruit.
    const el = app.querySelector(`.fruit[data-i="${fruit.length - 1}"]`);
    if (el) {
      el.textContent = '🌸';
      el.classList.add('blossom');
      setTimeout(() => {
        el.textContent = f.icon;
        el.classList.replace('blossom', 'ripe');
        ctx.pop();
        ctx.burst(el, 10);
      }, 1200);
    }
    ctx.speak(`Thank you, God, for growing ${f.name.toLowerCase()} in ${k.name}!`);
    ctx.toast(`<span>${f.icon} ${esc(f.name)} is growing!</span> <button class="btn" data-action="tree-undo">↩️ Undo</button>`);
  }

  async function undo() {
    if (!undoInfo) return;
    const day = await ctx.loadDay(undoInfo.kidId);
    day.fruit = day.fruit.filter((f) => f.t !== undoInfo.t);
    await dayPut(day);
    undoInfo = null;
    ctx.hideToast();
    render();
  }

  function tellFruit(el) {
    const f = fruit[Number(el.dataset.i)];
    if (!f) return;
    const info = FRUITS[f.fruit];
    const k = ctx.kid(f.kidId);
    const card = CARDS.find((c) => c.id === f.card);
    el.classList.remove('wiggle');
    void el.getBoundingClientRect(); // restart the animation
    el.classList.add('wiggle');
    ctx.speak(`${info.name}. ${info.meaning}.`, true);
    ctx.toast(`<span>${info.icon} <b>${esc(info.name)}</b>: ${esc(info.meaning)}${k && card ? ` · ${esc(k.name)}: “${esc(card.label)}”` : ''}</span>`);
  }

  // Cards use press-and-hold like the morning tiles: a tap only reads the card aloud.
  function startHold(cardEl) {
    cancelHold();
    ctx.unlockAudio();
    const card = CARDS.find((c) => c.id === cardEl.dataset.card);
    cardEl.classList.remove('hint');
    cardEl.classList.add('holding');
    ctx.speak(card.label);
    hold = {
      cardEl,
      started: Date.now(),
      timer: setTimeout(() => { hold = null; cardEl.classList.remove('holding'); plant(card.id); }, HOLD_MS),
    };
  }

  function cancelHold() {
    if (!hold) return;
    clearTimeout(hold.timer);
    const { cardEl, started } = hold;
    hold = null;
    cardEl.classList.remove('holding');
    if (Date.now() - started < 400) {
      cardEl.classList.add('hint');
      setTimeout(() => ctx.speak('Hold your finger down to grow it.'), 900);
    }
  }

  document.addEventListener('pointerdown', (e) => {
    const c = e.target.closest('.card[data-card]');
    if (c) startHold(c);
  }, true);
  document.addEventListener('pointerup', cancelHold);
  document.addEventListener('pointercancel', cancelHold);

  // ---------- Stop & Pray ----------

  function clearCalmTimers() {
    calm?.timers.forEach(clearTimeout);
    if (calm) calm.timers = [];
  }

  function later(fn, ms) { calm.timers.push(setTimeout(fn, ms)); }

  function openCalm(kidId) {
    ctx.unlockAudio();
    calm = { kidId, feeling: null, phase: kidId ? 'feel' : 'who', timers: [] };
    renderCalm();
    ctx.speak(kidId ? 'How are you feeling?' : 'Who needs a calm moment with God?', true);
  }

  function closeCalm() {
    clearCalmTimers();
    calm = null;
    overlay.innerHTML = '';
    overlay.classList.remove('show');
  }

  function startBreathing() {
    const b = BREATH[calm.feeling];
    calm.phase = 'breathe';
    renderCalm();
    for (let i = 0; i < BREATHS; i++) {
      later(() => setBreath('in', b.in, i), i * BREATH_MS);
      later(() => setBreath('out', b.out, i), i * BREATH_MS + BREATH_MS / 2);
    }
    later(() => {
      calm.phase = 'tell';
      renderCalm();
      ctx.speak('Now tell Jesus what happened.', true);
      later(() => { calm.phase = 'repair'; renderCalm(); ctx.speak('Do you need to make something right?', true); }, TELL_MS);
    }, BREATHS * BREATH_MS);
  }

  function setBreath(dir, words, i) {
    const label = overlay.querySelector('.breath-dir');
    const text = overlay.querySelector('.breath-words');
    const count = overlay.querySelector('.breath-count');
    if (label) label.textContent = dir === 'in' ? 'Breathe in…' : 'Breathe out…';
    if (text) text.textContent = words;
    if (count) count.textContent = '● '.repeat(i + 1) + '○ '.repeat(BREATHS - i - 1);
    ctx.speak(words.replace(/…/g, ''), true);
  }

  async function finishCalm(choice) {
    const { kidId, feeling } = calm;
    closeCalm();
    if (kidId) await addDrop(kidId, 'calm', { feeling });
    if (choice === 'sorry') ctx.speak('Go and make it right. God goes with you.', true);
    else ctx.speak('Well done for stopping to pray.', true);
    ctx.toast('💧 Your prayer watered the tree.');
    await render();
    rain();
  }

  function renderCalm() {
    const k = calm.kidId ? ctx.kid(calm.kidId) : null;
    const b = calm.feeling ? BREATH[calm.feeling] : null;
    let body = '';
    if (calm.phase === 'who') {
      body = `
        <h2>Who needs a calm moment?</h2>
        <div class="calm-faces">
          ${state.settings.kids.map((x) => `<button class="face-btn" style="--kid:${x.color}" data-action="calm-who" data-kid="${x.id}"><span class="face">${x.avatar || '🙂'}</span><span>${esc(x.name)}</span></button>`).join('')}
        </div>`;
    } else if (calm.phase === 'feel') {
      body = `
        <h2>How are you feeling${k ? `, ${esc(k.name)}` : ''}?</h2>
        <div class="feelings">
          ${Object.entries(BREATH).map(([id, f]) => `<button class="feeling" data-action="calm-feel" data-feel="${id}"><span>${f.face}</span>${f.label}</button>`).join('')}
        </div>`;
    } else if (calm.phase === 'breathe') {
      body = `
        <div class="breath-wrap"><div class="breath-circle"></div><div class="breath-face">${b.face}</div></div>
        <p class="breath-dir">Let's pray together…</p>
        <h2 class="breath-words">${esc(b.in)}</h2>
        <p class="small">${esc(b.ref)} · <span class="breath-count"></span></p>`;
    } else if (calm.phase === 'tell') {
      body = `
        <div class="pray-icon glow">🙏</div>
        <h2>Now tell Jesus what happened.</h2>
        <p>He is listening. Take your time.</p>
        <div class="pray-actions"><button class="btn calm-secondary" data-action="calm-told">I've finished</button></div>`;
    } else if (calm.phase === 'repair') {
      body = `
        <div class="pray-icon">💛</div>
        <h2>Do you need to make something right?</h2>
        <div class="pray-actions">
          <button class="btn big calm-primary" data-action="calm-done" data-choice="sorry">🫂 Yes, I'll go say sorry</button>
          <button class="btn big calm-primary" data-action="calm-done" data-choice="ok">😌 I'm OK now</button>
        </div>`;
    }
    overlay.innerHTML = `<div class="prayer-screen calm">
      <button class="btn calm-secondary calm-close" data-action="calm-close" aria-label="Close">✕</button>
      ${body}</div>`;
    overlay.classList.add('show');
  }

  // ---------- wiring ----------

  async function action(a, el) {
    switch (a) {
      case 'tree-open': state.view = 'tree'; return ctx.render();
      case 'tree-morning': state.view = 'picker'; state.treeKid = null; return ctx.render();
      case 'tree-pick': {
        ctx.unlockAudio();
        state.treeKid = el.dataset.kid;
        const k = ctx.kid(state.treeKid);
        ctx.speak(`Hi ${k.name}! Hold a card to grow fruit, or tap the water drop if you stopped to pray.`);
        return render();
      }
      case 'tree-unpick': state.treeKid = null; return render();
      case 'tree-drop': return prayed();
      case 'tree-fruit': return tellFruit(el);
      case 'tree-undo': return undo();
      case 'tree-calm': return openCalm(state.treeKid);
    }
  }

  function calmAction(a, el) {
    switch (a) {
      case 'calm-who': calm.kidId = el.dataset.kid; calm.phase = 'feel'; renderCalm(); return ctx.speak('How are you feeling?', true);
      case 'calm-feel': calm.feeling = el.dataset.feel; return startBreathing();
      case 'calm-told': clearCalmTimers(); calm.phase = 'repair'; renderCalm(); return ctx.speak('Do you need to make something right?', true);
      case 'calm-done': return finishCalm(el.dataset.choice);
      case 'calm-close': return closeCalm();
    }
  }

  return {
    render,
    action,
    calmAction,
    busy: () => !!calm,
    reset() { closeCalm(); state.treeKid = null; cancelHold(); },
  };
}
