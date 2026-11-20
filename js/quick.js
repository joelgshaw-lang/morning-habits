// 🪙± Coins from the front board (18 Nov 2026).
// Any grown-up taps 🪙± on a child's column (no PIN) and picks a good or hard moment. It waits (⏳) until a
// grown-up checks it at night with the PIN: ✓ Keep adds or takes the coins (as a Grown-ups coin change, so it
// shows in their history) and sends a Build on the Rock piece: a gem for a good moment, wood, hay or stubble
// for a hard one. ✕ Not quite drops it. Saved in IndexedDB as 'quickLog'.

export const GOOD = [
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
const MATERIAL = { wood: '🪵 wood', hay: '🌾 hay', stubble: '🥀 stubble' };

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
        ctx.toast(`${m.icon} ${signed(ds.good ? amount : -amount)} for ${esc(k.name)}, waiting for tonight's check`);
        el.remove(); // logged: close straight away (reopen to remove it)
        return ctx.renderKid();
      }
      if (ds.undoQuick) { state.quickLog = list().filter((q) => q.id !== ds.undoQuick); await save(); }
      el.querySelector('.farm-sheet').innerHTML = draw();
      ctx.renderKid();
    });
    el.classList.add('qk-ov');
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
      ctx.sendToRock(q.kidId, q.n > 0 ? { kind: 'gem', fruit: q.fruit, label: q.label } : { kind: 'straw', material: q.material, label: q.label });
    }
    await save();
    await ctx.refreshSummary();
    return true;
  }

  return { load, chipHTML, openAdd, openCheck, sectionHTML, handle, waitingFor, waitingAll };
}
