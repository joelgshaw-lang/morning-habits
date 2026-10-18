// The Grown-ups portal (grown-up PIN): check jobs children have claimed, allocate after-dinner jobs,
// change morning jobs, add extra jobs with your own prices, add or take away coins, and open a child's farm or mine any time.

const ICONS = ['⭐', '🧹', '🧽', '🧺', '🗑️', '🍽️', '🫧', '🪴', '🐶', '🚗', '📚', '🛏️', '👟', '🧸', '🪟', '🧼', '🍳', '👕', '🪥', '🎒'];
const MORNING_IDEAS = [
  { name: 'Get dressed', icon: '👕' }, { name: 'Brush teeth', icon: '🪥' }, { name: 'Eat breakfast', icon: '🥣' },
  { name: 'Feed the pet', icon: '🐶' }, { name: 'Read', icon: '📚' }, { name: 'Pack lunch', icon: '🍎' },
];
const TABS = [['check', '✅ Check jobs'], ['coins', '🪙 Coins'], ['night', '🌙 Night jobs'], ['morning', '☀️ Morning jobs'], ['extras', '⭐ Extra jobs'], ['open', '🔓 Farm & mine']];

export function createPortal(ctx) {
  const { state, esc } = ctx;
  let el = null;
  let tab = 'check';
  let kidId = null;
  const kids = () => state.settings.kids;
  const saveSettings = () => ctx.kvSet('settings', state.settings);
  const uid = (p) => `${p}${Date.now().toString(36)}`;

  async function open(startTab, startKid) {
    if (!(await ctx.grownUp('Grown-ups portal', true))) return;
    tab = startTab || 'check';
    // Open on the first child with jobs waiting to be checked.
    const waiting = kids().find((k) => Object.keys(state.days[k.id]?.claims || {}).length);
    kidId = startKid || waiting?.id || kidId || kids()[0].id;
    draw();
  }

  function close() {
    el?.remove();
    el = null;
    ctx.endGrace(); // the next grown-up action asks for the PIN again
    ctx.render();
  }

  // ---------- drawing ----------
  function kidChips(withPending = false) {
    return `<div class="who-tabs">${kids().map((k) => {
      const n = withPending ? Object.keys(state.days[k.id]?.claims || {}).length : 0;
      return `<button class="who ${k.id === kidId ? 'on' : ''}" style="--kid:${k.color}" data-kid="${k.id}">${k.avatar} ${esc(k.name)}${n ? ` <span class="badge">${n}</span>` : ''} <small>🪙 <span class="coin-num">${ctx.coinsOf(k.id)}</span></small></button>`;
    }).join('')}</div>`;
  }

  function coinStepper(kind, id, coins) {
    return `<span class="stepper"><button data-step="-1" data-kind="${kind}" data-id="${id}">−</button><b>🪙 ${coins}</b><button data-step="1" data-kind="${kind}" data-id="${id}">+</button></span>`;
  }

  function addForm(kind, withCoins = true) {
    return `<div class="add-form" data-form="${kind}">
      <div class="icon-pick">${ICONS.map((i, n) => `<button class="${n === 0 ? 'on' : ''}" data-icon="${i}">${i}</button>`).join('')}</div>
      <div class="add-row"><input type="text" placeholder="New job name" maxlength="40">
        ${withCoins ? '<select>' + [1, 2, 3, 4, 5, 6, 8, 10].map((c) => `<option value="${c}" ${c === 2 ? 'selected' : ''}>🪙 ${c}</option>`).join('') + '</select>' : ''}
        <button class="farm-btn small" data-add="${kind}">＋ Add</button></div></div>`;
  }

  function checkTab() {
    const k = ctx.kid(kidId);
    const d = state.days[kidId];
    const claims = d?.claims || {};
    const list = ctx.listFor(k, 'extras');
    const pending = list.filter((h) => claims[h.id]);
    return `${kidChips(true)}
      ${pending.length ? `<h3>⏳ ${esc(k.name)} says they did these</h3>
        ${pending.map((h) => `<div class="claim-row"><span>${h.icon}</span><b>${esc(h.name)}</b><small>🪙 ${h.coins || 2}</small>
          <button class="farm-btn small ok" data-confirm="${h.id}">✓ Done</button><button class="farm-btn small" data-reject="${h.id}">✕ Not yet</button></div>`).join('')}`
        : `<p>No jobs waiting for ${esc(k.name)}.</p>`}
      <h3>Or tick a job ${esc(k.name)} did</h3>
      <div class="grown-jobs" style="--kid:${k.color}">
        ${list.map((h) => `<button class="grown-job ${d?.extras[h.id] ? 'done' : ''}" data-job="${h.id}">
          <span class="gj-icon">${h.icon}</span><span>${esc(h.name)}</span><small>${d?.extras[h.id] ? '✓ Done · tap to undo' : `🪙 ${h.coins || 2}`}</small></button>`).join('')}
      </div>`;
  }

  // Add or take away coins by hand (a missed job, a kindness, a correction). Saved as a list, so it shows its history.
  const WHY = ['⭐ Extra job', '💛 Kindness', '🧾 Owed from before', '↩️ Correction'];
  let why = WHY[0];
  function coinsTab() {
    const k = ctx.kid(kidId);
    const mine = (state.coinAdjust || []).filter((a) => a.kidId === kidId).slice(-8).reverse();
    return `${kidChips()}
      <div class="coin-adjust" style="--kid:${k.color}">
        <div class="ca-balance">${k.avatar} ${esc(k.name)} has <b>🪙 <span class="coin-num">${ctx.coinsOf(kidId)}</span></b></div>
        <div class="ca-why">${WHY.map((w) => `<button class="${w === why ? 'on' : ''}" data-why="${esc(w)}">${w}</button>`).join('')}</div>
        <div class="ca-btns">${[-10, -5, -1].map((n) => `<button class="ca minus" data-adj="${n}">− ${-n}</button>`).join('')}${[1, 5, 10].map((n) => `<button class="ca plus" data-adj="${n}">+ ${n}</button>`).join('')}</div>
      </div>
      ${mine.length ? `<h3>Recent changes for ${esc(k.name)}</h3>${mine.map((a) => `<div class="claim-row"><span>${a.n > 0 ? '➕' : '➖'}</span><b>${a.n > 0 ? '+' : '−'}🪙 ${Math.abs(a.n)}</b><small>${esc(a.why)} · ${new Date(a.t).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</small></div>`).join('')}` : ''}`;
  }
  async function adjustCoins(n, fromRect) {
    const k = ctx.kid(kidId);
    const before = ctx.coinsOf(kidId);
    if (n < 0) n = Math.max(n, -before); // never below zero
    if (!n) return ctx.toast(`${esc(k.name)} has no coins to take away.`);
    state.coinAdjust = [...(state.coinAdjust || []), { kidId, n, why, t: ctx.clock.now().toISOString() }];
    await ctx.kvSet('coinAdjust', state.coinAdjust);
    await ctx.refreshSummary();
    draw();
    if (n > 0) {
      await new Promise((r) => setTimeout(r, 60));
      ctx.flyCoins(n, fromRect, el?.querySelector('.ca-balance .coin-num'), before);
      ctx.speak(`${n} coin${n === 1 ? '' : 's'} for ${k.name}!`, true);
    } else ctx.toast(`➖ Took away 🪙 ${-n} from ${esc(k.name)}.`);
  }

  function nightTab() {
    const alloc = state.settings.nightAlloc ||= {};
    return `<p>After-dinner jobs: tap a child to give them the job (tap again to take it off). These are timed by “Start night chores”.</p>
      ${state.settings.houseJobs.map((j) => `<div class="job-row-edit"><span class="ji">${j.icon}</span><b>${esc(j.name)}</b>
        ${coinStepper('house', j.id, j.coins || 2)}
        <span class="assign">${kids().map((k) => `<button class="${(alloc[k.id] || []).includes(j.id) ? 'on' : ''}" style="--kid:${k.color}" data-assign="${j.id}" data-to="${k.id}">${k.avatar}</button>`).join('')}</span>
        <button class="del" data-del-house="${j.id}" aria-label="Remove">🗑</button></div>`).join('')}
      <h3>Add an after-dinner job</h3>${addForm('house')}`;
  }

  function morningTab() {
    const k = ctx.kid(kidId);
    return `${kidChips()}
      <p>${esc(k.name)}'s morning jobs, in order.</p>
      ${k.habits.map((h, i) => `<div class="job-row-edit"><span class="ji">${h.icon}</span><b>${esc(h.name)}${h.type === 'timer' ? ' ⏱' : ''}</b>
        <button class="del" data-up="${i}" ${i ? '' : 'disabled'} aria-label="Move up">⬆️</button>
        <button class="del" data-del-morning="${h.id}" aria-label="Remove">🗑</button></div>`).join('')}
      <h3>Add a morning job for ${esc(k.name)}</h3>
      <div class="idea-list">${MORNING_IDEAS.filter((x) => !k.habits.some((h) => h.name === x.name)).map((x) => `<button class="idea" data-morning-idea="${esc(x.name)}" data-icon="${x.icon}">${x.icon} ${esc(x.name)}</button>`).join('')}</div>
      ${addForm('morning', false)}`;
  }

  function extrasTab() {
    return `<p>Jobs children can claim during the day. Set the coins for each one, or add your own.</p>
      ${state.settings.extraChores.map((c) => `<div class="job-row-edit"><span class="ji">${c.icon}</span><b>${esc(c.name)}</b>
        ${coinStepper('extra', c.id, c.coins || 2)}
        <button class="del" data-del-extra="${c.id}" aria-label="Remove">🗑</button></div>`).join('')}
      <h3>Add a helpful job</h3>${addForm('extra')}`;
  }

  function openTab() {
    return `<p>Open a farm or the mine for a child. No code, no time limit, and it doesn't use up their farm visits.</p>
      ${kids().map((k) => `<div class="job-row-edit" style="--kid:${k.color}"><span class="ji">${k.avatar}</span><b>${esc(k.name)}</b>
        <button class="farm-btn small" data-open-farm="${k.id}">🐔 Open farm</button>
        <button class="farm-btn small" data-open-mine="${k.id}">⛏ Open mine</button></div>`).join('')}`;
  }

  function draw() {
    const body = { check: checkTab, coins: coinsTab, night: nightTab, morning: morningTab, extras: extrasTab, open: openTab }[tab]();
    const html = `<div class="farm-sheet portal">
      <div class="portal-head"><h2>👨‍👩‍👧 Grown-ups</h2><button class="farm-btn small" data-close>Done</button></div>
      <nav class="portal-tabs">${TABS.map(([id, name]) => `<button class="${id === tab ? 'on' : ''}" data-tab="${id}">${name}</button>`).join('')}</nav>
      <div class="portal-body">${body}</div></div>`;
    if (!el) {
      el = document.createElement('div');
      el.className = 'farm-ov portal-ov';
      document.body.appendChild(el);
      el.addEventListener('click', onClick);
    }
    const scroll = el.querySelector('.portal-body')?.scrollTop || 0;
    el.innerHTML = html;
    el.querySelector('.portal-body').scrollTop = scroll;
  }

  // ---------- actions ----------
  async function confirmClaim(id, jobId, fromRect) {
    const k = ctx.kid(id);
    const d = await ctx.loadDay(id);
    state.days[id] = d;
    if (d.claims) delete d.claims[jobId];
    const h = ctx.listFor(k, 'extras').find((x) => x.id === jobId);
    if (!h || d.extras[jobId]) { await ctx.dayPut(d); return; }
    const before = ctx.coinsOf(id);
    d.extras[jobId] = ctx.clock.now().toISOString();
    d.log.push({ t: d.extras[jobId], routine: 'extras', habit: jobId, action: 'done', by: 'grown-up' });
    if (ctx.doneCount(k, d, 'extras') <= 4) ctx.sendToMine(id, { swings: 1, hands: 1 });
    await ctx.dayPut(d);
    await ctx.refreshSummary();
    const gained = ctx.coinsOf(id) - before;
    if (el) draw(); else ctx.render();
    await new Promise((r) => setTimeout(r, 60));
    const target = el ? el.querySelector(`.who[data-kid="${id}"] .coin-num`) : document.querySelector(`[data-col="${id}"] .coin-num`);
    if (gained > 0) ctx.flyCoins(gained, fromRect, target, before);
    ctx.speak(`${h.name}! ${gained} coins for ${k.name}. Thank you for helping!`, true);
  }

  async function toggleJob(jobId, rect) {
    const k = ctx.kid(kidId);
    const d = await ctx.loadDay(kidId);
    state.days[kidId] = d;
    if (d.extras[jobId]) {
      delete d.extras[jobId];
      d.log.push({ t: ctx.clock.now().toISOString(), routine: 'extras', habit: jobId, action: 'undo', by: 'grown-up' });
      if (ctx.doneCount(k, d, 'extras') < 4) ctx.sendToMine(kidId, { swings: -1, hands: -1 });
      await ctx.dayPut(d);
      await ctx.refreshSummary();
      return draw();
    }
    return confirmClaim(kidId, jobId, rect);
  }

  function readForm(kind) {
    const f = el.querySelector(`[data-form="${kind}"]`);
    const name = f.querySelector('input').value.trim();
    const icon = f.querySelector('.icon-pick .on')?.dataset.icon || '⭐';
    const coins = Number(f.querySelector('select')?.value || 2);
    return name ? { name, icon, coins } : null;
  }

  async function onClick(e) {
    const t = e.target.closest('button');
    if (!t) return;
    const ds = t.dataset;
    if ('close' in ds) return close();
    if (ds.tab) { tab = ds.tab; return draw(); }
    if (ds.kid) { kidId = ds.kid; return draw(); }
    if (ds.icon && t.closest('.icon-pick')) { t.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === t)); return; }
    if (ds.confirm) return confirmClaim(kidId, ds.confirm, t.getBoundingClientRect());
    if (ds.why) { why = ds.why; return draw(); }
    if (ds.adj) return adjustCoins(Number(ds.adj), t.getBoundingClientRect());
    if (ds.reject) {
      const d = await ctx.loadDay(kidId);
      if (d.claims) delete d.claims[ds.reject];
      await ctx.dayPut(d);
      state.days[kidId] = d;
      return draw();
    }
    if (ds.job) return toggleJob(ds.job, t.getBoundingClientRect());
    if (ds.step) {
      const list = ds.kind === 'house' ? state.settings.houseJobs : state.settings.extraChores;
      const j = list.find((x) => x.id === ds.id);
      j.coins = Math.max(1, Math.min(10, (j.coins || 2) + Number(ds.step)));
      saveSettings();
      return draw();
    }
    if (ds.assign) {
      const alloc = state.settings.nightAlloc ||= {};
      const mine = (alloc[ds.to] ||= []);
      alloc[ds.to] = mine.includes(ds.assign) ? mine.filter((x) => x !== ds.assign) : [...mine, ds.assign];
      saveSettings();
      return draw();
    }
    if (ds.delHouse) {
      state.settings.houseJobs = state.settings.houseJobs.filter((j) => j.id !== ds.delHouse);
      for (const id of Object.keys(state.settings.nightAlloc || {})) state.settings.nightAlloc[id] = state.settings.nightAlloc[id].filter((x) => x !== ds.delHouse);
      saveSettings();
      return draw();
    }
    if (ds.delExtra) {
      state.settings.extraChores = state.settings.extraChores.filter((c) => c.id !== ds.delExtra);
      saveSettings();
      return draw();
    }
    if (ds.delMorning) {
      const k = ctx.kid(kidId);
      if (k.habits.length <= 1) return ctx.toast('Keep at least one morning job.');
      k.habits = k.habits.filter((h) => h.id !== ds.delMorning);
      saveSettings();
      return draw();
    }
    if (ds.up) {
      const k = ctx.kid(kidId);
      const i = Number(ds.up);
      [k.habits[i - 1], k.habits[i]] = [k.habits[i], k.habits[i - 1]];
      saveSettings();
      return draw();
    }
    if (ds.morningIdea) {
      ctx.kid(kidId).habits.push({ id: uid('m-'), name: ds.morningIdea, icon: ds.icon });
      saveSettings();
      return draw();
    }
    if (ds.add) {
      const v = readForm(ds.add);
      if (!v) return ctx.toast('Type a name for the job first.');
      if (ds.add === 'house') state.settings.houseJobs.push({ id: uid('h-'), name: v.name, icon: v.icon, coins: v.coins });
      if (ds.add === 'extra') {
        const other = state.settings.extraChores.findIndex((c) => /^other/.test(c.id));
        state.settings.extraChores.splice(other < 0 ? state.settings.extraChores.length : other, 0, { id: uid('x-'), name: v.name, icon: v.icon, coins: v.coins, custom: true });
      }
      if (ds.add === 'morning') ctx.kid(kidId).habits.push({ id: uid('m-'), name: v.name, icon: v.icon });
      saveSettings();
      ctx.toast(`✓ Added “${esc(v.name)}”`);
      return draw();
    }
    if (ds.openFarm) { el.remove(); el = null; return ctx.openFarm(ds.openFarm); }
    if (ds.openMine) { el.remove(); el = null; return ctx.openMine(ds.openMine); }
  }

  return { open, confirmClaim };
}
