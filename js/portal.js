import { GROWN_MINUTES } from './config.js';
import { voiceSettings, saveVoiceSettings, englishVoices, utterance, onVoicesReady } from './voice.js';
import { fruitPortalHTML } from './fruit.js';

// The Grown-ups portal (grown-up PIN). Opens on a big card for each child. Tap a child to see just their things:
// jobs to check, coins, fruit and Open farm. Setup that rarely changes (job lists, voice, app update) sits behind ⚙️ Settings.

const ICONS = ['⭐', '🧹', '🧽', '🧺', '🗑️', '🍽️', '🫧', '🪴', '🐶', '🚗', '📚', '🛏️', '👟', '🧸', '🪟', '🧼', '🍳', '👕', '🪥', '🎒'];
const MORNING_IDEAS = [
  { name: 'Get dressed', icon: '👕' }, { name: 'Brush teeth', icon: '🪥' }, { name: 'Eat breakfast', icon: '🥣' },
  { name: 'Feed the pet', icon: '🐶' }, { name: 'Read', icon: '📚' }, { name: 'Pack lunch', icon: '🍎' },
];
const TABS = [['night', '🌙 Night jobs'], ['morning', '☀️ Morning jobs'], ['extras', '⭐ Extra jobs'], ['voice', '🔊 Voice'], ['app', '🔄 App']];

export function createPortal(ctx) {
  const { state, esc } = ctx;
  let el = null;
  let view = 'home'; // home (a card per child) | kid (one child's page) | settings
  let tab = 'night';  // which Settings page
  let kidId = null;
  let expiresAt = 0;
  let tick = null;
  const kids = () => state.settings.kids;
  const saveSettings = () => ctx.kvSet('settings', state.settings);
  const uid = (p) => `${p}${Date.now().toString(36)}`;

  async function open() {
    // Always asks for the PIN (never lets a recent PIN carry over from 🔔 or another grown-up screen).
    if (!(await ctx.grownUp('Grown-ups portal'))) return;
    view = 'home';
    kidId = kidId || kids()[0].id;
    // Grown-up time runs out after GROWN_MINUTES, then the PIN is needed again.
    expiresAt = Date.now() + GROWN_MINUTES * 60e3;
    clearInterval(tick);
    tick = setInterval(() => {
      const left = expiresAt - Date.now();
      if (left <= 0) { close(); return ctx.toast('🔒 Grown-up time is over. Enter the PIN to go back in.'); }
      const t = el?.querySelector('.portal-time');
      if (t) { t.textContent = `🔒 ${Math.floor(left / 60000)}:${String(Math.floor(left / 1000) % 60).padStart(2, '0')}`; t.classList.toggle('soon', left < 30000); }
    }, 1000);
    draw();
  }

  function close() {
    clearInterval(tick);
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

  const waitingOf = (id) => Object.keys(state.days[id]?.claims || {}).length;

  // Front page: a card per child. Everything waiting for a grown-up is listed right on the card with ✓ Yes / ✕ No,
  // so the night check is this one screen. Tap the top of a card for that child's page (farm, building, coins, jobs).
  function homeView() {
    return `<div class="gk-cards">${kids().map((k) => {
        const asked = (state.days[k.id]?.reminders || []).length;
        return `<div class="gk-card" style="--kid:${k.color}">
          <button class="gk-open" data-kid="${k.id}"><span class="gk-av">${k.avatar}</span><b>${esc(k.name)}</b>
            <span class="gk-coins">🪙 <span data-coins-of="${k.id}">${ctx.coinsOf(k.id)}</span></span><span class="gk-more">Open ›</span></button>
          <div class="gk-list">${waitingSection(k, true)}${ctx.quickSection(k)}
            ${asked ? `<div class="gk-note">🔔 Asked ${asked}× today</div>` : ''}</div>
        </div>`;
      }).join('')}</div>${practiceSection()}`;
  }

  // ---------- 🏋️ Practice for gold (21 Nov 2026, Joel): a grown-up runs a short, fun drill; a ✓ gives a gold shard;
  // 3 shards = a gold block sent to Build on the Rock (never blocked by its daily gold cap). At most 3 a day per child.
  const DRILLS = {
    obey: { icon: '🙋', name: 'Obey straight away', label: 'Practised obeying straight away',
      intro: (n) => `Grown-up: give ${n} one small job, like “Please put your shoes by the door.”<br><b>${n}: do it the FIRST time, with a smile!</b>`, secs: 10 },
    calm: { icon: '🧘', name: 'Calm down', label: 'Practised calming down',
      intro: (n) => `${n}: let's practise calming down. Breathe slowly with the circle, three times.<br><b>Then say: “I'm calm.”</b>`, secs: 18 },
  };
  const PRACTICE_PER_DAY = 3, SHARDS_PER_GOLD = 3;
  const pr = (id) => { const all = (state.practice ||= {}); const p = (all[id] ||= { shards: 0, day: '', today: 0, total: 0 });
    const d = ctx.todayKey(); if (p.day !== d) { p.day = d; p.today = 0; } return p; };
  const gems = (n) => '◆'.repeat(n) + '◇'.repeat(SHARDS_PER_GOLD - n);
  function practiceSection() {
    return `<div class="practice-card"><h3>🏋️ Practice for gold</h3>
      <p class="note">A quick, fun practice. Tick ✓ when they did it well. Every ✓ is a gold shard: ${SHARDS_PER_GOLD} shards make a gold block in their building. Up to ${PRACTICE_PER_DAY} a day each.</p>
      ${kids().map((k) => { const p = pr(k.id), done = p.today >= PRACTICE_PER_DAY;
        return `<div class="practice-row" style="--kid:${k.color}"><span class="gk-av">${k.avatar}</span><b>${esc(k.name)}</b>
          <span class="shards" title="${p.shards} of ${SHARDS_PER_GOLD} to a gold block">${gems(p.shards)}</span>
          ${done ? '<small>All 3 done today 🎉</small>' : Object.entries(DRILLS).map(([id, d]) => `<button class="farm-btn small" data-practice="${k.id}:${id}">${d.icon} ${d.name}</button>`).join('')}</div>`; }).join('')}</div>`;
  }
  function runDrill(kidId, drillId) {
    const k = ctx.kid(kidId), d = DRILLS[drillId]; if (!k || !d) return;
    const ov = document.createElement('div'); ov.className = 'farm-ov practice-ov'; document.body.appendChild(ov);
    let timer = null;
    const close = () => { clearInterval(timer); ov.remove(); draw(); };
    const show = (html) => { ov.innerHTML = `<div class="farm-sheet practice-sheet" style="--kid:${k.color}">${html}</div>`; };
    const intro = () => { show(`<h2>${d.icon} ${d.name}</h2><p class="drill-intro">${d.intro(esc(k.name))}</p>
      <div class="drill-btns"><button class="farm-btn big go" data-d="go">Ready… go!</button><button class="farm-btn small" data-d="close">Not now</button></div>`); };
    const check = () => { clearInterval(timer); show(`<h2>${d.icon} How did ${esc(k.name)} go?</h2><p class="drill-intro">Grown-up: only tick if it was done well.</p>
      <div class="drill-btns"><button class="farm-btn big ok" data-d="yes">✓ Did it!</button><button class="farm-btn small" data-d="again">↺ Try again</button></div>`); };
    const go = () => {
      let left = d.secs; ctx.speak && ctx.speak('Ready, go!');
      const face = () => drillId === 'calm'
        ? `<div class="pbreathe"><div class="pring"></div><b class="pword">${Math.floor((d.secs - left) / 3) % 2 ? 'Breathe out…' : 'Breathe in…'}</b></div>`
        : `<div class="count">${left}</div><p class="drill-intro">First time. With a smile!</p>`;
      const paint = () => show(`<h2>${d.icon} ${d.name}</h2>${face()}<div class="drill-btns"><button class="farm-btn big ok" data-d="done">${drillId === 'calm' ? "I'm calm 🙂" : 'Done!'}</button></div>`);
      paint(); timer = setInterval(() => { left--; if (left <= 0) { clearInterval(timer); check(); return; }   // only the words change, so the breathing circle keeps its rhythm
        const c = ov.querySelector('.count'), w = ov.querySelector('.pbreathe .pword'); if (c) c.textContent = left; if (w) w.textContent = Math.floor((d.secs - left) / 3) % 2 ? 'Breathe out…' : 'Breathe in…'; }, 1000);
    };
    const yes = async () => {
      const p = pr(kidId); if (p.today >= PRACTICE_PER_DAY) return close();
      p.today++; p.total++; p.shards++;
      let gold = false; if (p.shards >= SHARDS_PER_GOLD) { p.shards = 0; gold = true; ctx.sendToRock(kidId, { kind: 'gold', label: d.label, practice: true }); }
      await ctx.kvSet('practice', state.practice);
      show(`<div class="cheer">${gold ? '🥇' : '🎉'}</div><h2>${gold ? `${SHARDS_PER_GOLD} shards = a GOLD BLOCK!` : '+1 gold shard!'}</h2>
        <p class="drill-intro">${gold ? `It's on its way to ${esc(k.name)}'s building.` : `<span class="shards big">${gems(p.shards)}</span><br>${SHARDS_PER_GOLD - p.shards} more to a gold block.`}</p>
        <div class="drill-btns"><button class="farm-btn big" data-d="close">Done</button></div>`);
      ctx.speak && ctx.speak(gold ? 'A gold block!' : 'Well done!');
    };
    ov.addEventListener('click', (e) => { const b = e.target.closest('[data-d]'); if (!b) return;
      ({ go, done: check, yes, again: intro, close })[b.dataset.d](); });
    intro();
  }

  // One child's page: open farm, jobs to check, coins, fruit.
  function kidView() {
    const k = ctx.kid(kidId);
    return `<div class="gk-head" style="--kid:${k.color}"><span class="gk-av">${k.avatar}</span><b>${esc(k.name)}</b>
        <span class="gk-coins">🪙 <span class="coin-num" data-coins-of="${k.id}">${ctx.coinsOf(k.id)}</span></span>
        <button class="farm-btn gk-farm" data-open-farm="${k.id}">🐔 Open farm</button>
        <button class="farm-btn gk-farm gk-rock" data-open-rock="${k.id}">🏰 Open building</button></div>
      ${rebuildHTML(k)}
      ${waitingSection(k)}${ctx.quickSection(k)}${coinsSection(k)}${tickSection(k)}${recentHTML(k)}
      <h3>🍓 Fruit</h3>${fruitPortalHTML(k, esc)}`;
  }

  // 🧱 Rebuild pack (21 Nov 2026, Joel): coins buy back up to 12 fallen blocks in Build on the Rock, straight into the
  // tray, outside the game's daily rebuild limit. Only shows when the building has fallen blocks to give back.
  const REBUILD = { price: 20, blocks: 12 };
  // A smaller pack (fewer than 12 blocks fallen) costs less: 🪙 5 for every 3 blocks, up to 🪙 20.
  const rebuildPrice = (n) => Math.min(REBUILD.price, Math.max(5, Math.ceil(n / 3) * 5));
  function fallenBlocks(id) {
    try {
      const db = JSON.parse(localStorage.getItem(`rock-live.${id}`) || 'null');
      const pile = db?.kids?.me?.s?.rubble?.length || 0;
      const queued = JSON.parse(localStorage.getItem(`rock.inbox.${id}`) || '[]').filter((x) => x.kind === 'rebuild').reduce((n, x) => n + (x.n || 0), 0);
      return Math.max(0, pile - queued);
    } catch { return 0; }
  }
  function rebuildHTML(k) {
    const n = fallenBlocks(k.id);
    if (!n) return '';
    const get = Math.min(n, REBUILD.blocks), price = rebuildPrice(get);
    const can = ctx.coinsOf(k.id) >= price;
    return `<div class="claim-row gk-rebuild"><span>🧱</span><b>Rebuild pack</b><small>${n} fallen block${n === 1 ? '' : 's'} · get back ${get} now</small>
      <button class="farm-btn small ok" data-rebuild="${k.id}" ${can ? '' : 'disabled'}>🪙 ${price}</button></div>`;
  }
  async function buyRebuild(id) {
    const n = Math.min(fallenBlocks(id), REBUILD.blocks), price = rebuildPrice(n);
    if (!n || ctx.coinsOf(id) < price) return;
    state.coinAdjust = [...(state.coinAdjust || []), { kidId: id, n: -price, why: '🧱 Rebuild pack', t: ctx.clock.now().toISOString() }];
    await ctx.kvSet('coinAdjust', state.coinAdjust);
    ctx.sendToRock(id, { kind: 'rebuild', n, label: 'Rebuild pack' });
    await ctx.refreshSummary();
    ctx.toast(`🧱 ${n} fallen blocks are waiting in ${esc(ctx.kid(id).name)}'s building. Open it to lay them!`);
  }

  function waitingSection(k, short = false) {
    const claims = state.days[k.id]?.claims || {};
    const pending = ctx.listFor(k, 'extras').filter((h) => claims[h.id]);
    return pending.length ? `<h3>${short ? 'Says they did' : `${esc(k.name)} says they did these`}</h3>
        ${pending.map((h) => `<div class="claim-row"><span>${h.icon}</span><b>${esc(h.name)}</b><small>🪙 ${h.coins || 2}</small>
          <button class="farm-btn small ok" data-confirm="${h.id}" data-for="${k.id}">✓ Yes</button><button class="farm-btn small" data-reject="${h.id}" data-for="${k.id}">✕ No</button></div>`).join('')}` : '';
  }

  function tickSection(k) {
    const d = state.days[k.id];
    const list = ctx.listFor(k, 'extras');
    return `<h3>✅ Tick a job ${esc(k.name)} did</h3>
      <div class="grown-jobs" style="--kid:${k.color}">
        ${list.map((h) => `<button class="grown-job ${d?.extras[h.id] ? 'done' : ''}" data-job="${h.id}">
          <span class="gj-icon">${h.icon}</span><span>${esc(h.name)}</span><small>${d?.extras[h.id] ? '✓ Done · tap to undo' : `🪙 ${h.coins || 2}`}</small></button>`).join('')}
      </div>`;
  }

  // Add or take away coins by hand (a missed job, a kindness, a correction). Saved as a list, so it shows its history.
  // (Plus is saved as "⭐ Bonus", minus as "↩️ Taken off". Good and hard moments with a reason go through 🪙± on the board.)
  function coinsSection(k) {
    return `<h3>Give or take coins</h3>
      <div class="coin-adjust" style="--kid:${k.color}">
        <div class="ca-btns">${[-10, -5, -1].map((n) => `<button class="ca minus" data-adj="${n}">− ${-n}</button>`).join('')}${[1, 5, 10].map((n) => `<button class="ca plus" data-adj="${n}">+ ${n}</button>`).join('')}</div>
      </div>
      ${askedHTML(k)}`;
  }
  function recentHTML(k) {
    const mine = (state.coinAdjust || []).filter((a) => a.kidId === k.id).slice(-3).reverse();
    return `${mine.length ? `<h3>Recent coin changes</h3>${mine.map((a) => `<div class="claim-row"><span>${a.n > 0 ? '➕' : '➖'}</span><b>${a.n > 0 ? '+' : '−'}🪙 ${Math.abs(a.n)}</b><small>${esc(a.why)} · ${new Date(a.t).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })}</small></div>`).join('')}` : ''}`;
  }
  // 🔔 Today's asks for this child (only shown here, never on the family board).
  function askedHTML(k) {
    const list = state.days[k.id]?.reminders || [];
    if (!list.length) return '';
    return `<h3>🔔 Had to ask ${esc(k.name)} today: ${list.length}</h3>${list.map((x) => `<div class="claim-row"><span>${x.icon || '🔔'}</span><b>${esc(x.who || 'A grown-up')} asked${x.name ? ` about ${esc(x.name)}` : ''}</b><small>${x.routine} · ${new Date(x.t).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}</small></div>`).join('')}
      <p class="pf-note">The first ask in the morning and the first at night are −🪙 20 each. A day never goes below zero.</p>`;
  }
  async function adjustCoins(n, fromRect) {
    const k = ctx.kid(kidId);
    const before = ctx.coinsOf(kidId);
    if (n < 0) n = Math.max(n, -before); // never below zero
    if (!n) return ctx.toast(`${esc(k.name)} has no coins to take away.`);
    state.coinAdjust = [...(state.coinAdjust || []), { kidId, n, why: n > 0 ? '⭐ Bonus' : '↩️ Taken off', t: ctx.clock.now().toISOString() }];
    await ctx.kvSet('coinAdjust', state.coinAdjust);
    await ctx.refreshSummary();
    draw();
    if (n > 0) {
      await new Promise((r) => setTimeout(r, 60));
      ctx.flyCoins(n, fromRect, el?.querySelector(`[data-coins-of="${kidId}"]`), before);
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
      <div class="job-row-edit"><span class="ji">⏰</span><b>Everyone starts by <span class="start-by">${state.settings.startBy || '07:15'}</span><small> or that morning's job coins are lost (stars still count)</small></b>
        <span class="stepper"><button data-start-by="-5">−5 min</button><button data-start-by="5">+5 min</button></span></div>
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

  function appTab() {
    return `<div class="job-row-edit"><span class="ji">🔄</span><b>App version ${esc(ctx.version() || '?')}<small> Gets the newest version from the internet. Jobs, coins and farms are kept.</small></b>
        <button class="farm-btn small" data-update-now="1">Update now</button></div>
      <div class="job-row-edit"><span class="ji">🔨</span><b>Farm set-up<small> Each child gets one free set-up of their farm (move anything, as often as they like). Give everyone another one here.</small></b>
        <button class="farm-btn small" data-farm-setup="1">Give again</button></div>
      <div class="job-row-edit"><span class="ji">🏰</span><b>Build on the Rock (pretend try-out)<small> The pretend-day test page. Each child's real building opens from their page. Needs internet.</small></b>
        <a class="farm-btn small" href="docs/rock/play.html" target="_blank" rel="noopener" style="text-decoration:none">Open</a></div>
      <div class="job-row-edit"><span class="ji">🌍</span><b>Rock World (new, test)<small> The new 3D building game, to try before the children get it. Test buttons for wood, hay, stubble, next day and fire. Its saves are kept apart from the children's. Needs internet.</small></b>
        <a class="farm-btn small" href="docs/rock-world/world.html" target="_blank" rel="noopener" style="text-decoration:none">Open</a></div>
      <div class="job-row-edit"><span class="ji">🧪</span><b>Building test space<small> Endless blocks, gems, straw and crafting to try things out, with Fire now and Start again. Kept apart from the children's buildings.</small></b>
        <button class="farm-btn small" data-open-rock-test="1">Open</button></div>`;
  }

  const SPEEDS = [[0.8, 'Slow'], [0.9, 'Calm'], [0.95, 'Normal'], [1.05, 'Quick']];
  const SAMPLE = 'Hi Judah! Make your bed next. Hold the picture to tick it. Well done, 5 coins!';
  function voiceTab() {
    const set = voiceSettings();
    const list = englishVoices();
    const row = (v) => `<div class="job-row-edit voice-row ${set.uri === v.voiceURI ? 'on' : ''}"><span class="ji">${/premium|enhanced/i.test(v.name) ? '⭐' : '🗣️'}</span>
      <b>${esc(v.name)}<small> ${esc(v.lang)}${v.localService ? '' : ' · needs internet'}</small></b>
      <button class="farm-btn small" data-try-voice="${esc(v.voiceURI)}">▶ Try</button>
      <button class="farm-btn small ${set.uri === v.voiceURI ? 'sellhen' : ''}" data-use-voice="${esc(v.voiceURI)}">${set.uri === v.voiceURI ? '✓ Using' : 'Use'}</button></div>`;
    return `<p>Choose the voice that reads the app aloud. ⭐ voices (Enhanced or Premium) sound much more natural.</p>
      <p><b>To get more voices on the iPad:</b> Settings → Accessibility → Spoken Content → Voices → English. Download an Enhanced or Premium voice, then come back here.</p>
      <div class="voice-speeds"><b>Speed</b> ${SPEEDS.map(([r, n]) => `<button class="farm-btn small ${Math.abs(set.rate - r) < 0.001 ? 'sellhen' : ''}" data-voice-rate="${r}">${n}</button>`).join('')}</div>
      <div class="job-row-edit voice-row ${set.uri ? '' : 'on'}"><span class="ji">📱</span><b>iPad default<small> Australian</small></b>
        <button class="farm-btn small" data-try-voice="">▶ Try</button>
        <button class="farm-btn small ${set.uri ? '' : 'sellhen'}" data-use-voice="">${set.uri ? 'Use' : '✓ Using'}</button></div>
      ${list.length ? list.map(row).join('') : '<p>No voices found yet. Close this and open it again in a moment.</p>'}`;
  }
  onVoicesReady(() => { if (el && tab === 'voice') draw(); });
  function sayWith(uri) {
    try {
      const set = voiceSettings();
      saveVoiceSettings({ ...set, uri });
      const u = utterance(SAMPLE);
      saveVoiceSettings(set);
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch {}
  }

  function draw() {
    const body = view === 'kid' ? kidView() : view === 'settings'
      ? { night: nightTab, morning: morningTab, extras: extrasTab, voice: voiceTab, app: appTab }[tab]() : homeView();
    const left = view === 'home' ? '<h2>👨‍👩‍👧 Grown-ups</h2>' : '<button class="farm-btn small gk-back" data-home>← All children</button>';
    const html = `<div class="farm-sheet portal">
      <div class="portal-head">${left}<span class="portal-time" title="Grown-up time left">🔒 ${GROWN_MINUTES}:00</span>
        ${view === 'home' ? '<button class="farm-btn small" data-settings>⚙️ Settings</button>' : ''}<button class="farm-btn small" data-close>Done</button></div>
      ${view === 'settings' ? `<nav class="portal-tabs">${TABS.map(([id, name]) => `<button class="${id === tab ? 'on' : ''}" data-tab="${id}">${name}</button>`).join('')}</nav>` : ''}
      <div class="portal-body">${body}</div></div>`;
    if (!el) {
      el = document.createElement('div');
      el.className = 'farm-ov portal-ov';
      document.body.appendChild(el);
      el.addEventListener('click', onClick);
    }
    const scroll = el.dataset.at === view + tab + kidId ? el.querySelector('.portal-body')?.scrollTop || 0 : 0;
    el.dataset.at = view + tab + kidId;
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
    await ctx.dayPut(d);
    await ctx.refreshSummary();
    const gained = ctx.coinsOf(id) - before;
    if (el) draw(); else ctx.render();
    await new Promise((r) => setTimeout(r, 60));
    // In the portal: the child's chip. On the board: the child's coins show for a few seconds while they fly in.
    const target = el ? el.querySelector(`[data-coins-of="${id}"]`) : ctx.coinTarget(id);
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
    if ('lock' in ds) { close(); return ctx.toast('🔒 Locked. The PIN is needed to come back in.'); }
    if ('home' in ds) { view = 'home'; return draw(); }
    if ('settings' in ds) { view = 'settings'; return draw(); }
    if (ds.tab) { tab = ds.tab; return draw(); }
    if (ds.startBy) {
      // Move the start-by time (default 7:15) by 5 minutes, between 6:00 and 9:00.
      const [h, m] = (state.settings.startBy || '07:15').split(':').map(Number);
      const mins = Math.max(360, Math.min(540, h * 60 + m + Number(ds.startBy)));
      state.settings.startBy = `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
      saveSettings();
      return draw();
    }
    if ('tryVoice' in ds) return sayWith(ds.tryVoice);
    if (ds.updateNow) return ctx.updateNow();
    if (ds.farmSetup) {
      for (const f of Object.values(state.farms || {})) if (f.world) f.world.setupDone = false;
      ctx.kvSet('farms', state.farms);
      return ctx.toast('🔨 Done! Every child can set up their whole farm once more.');
    }
    if ('useVoice' in ds) { saveVoiceSettings({ ...voiceSettings(), uri: ds.useVoice }); draw(); return sayWith(ds.useVoice); }
    if (ds.voiceRate) { saveVoiceSettings({ ...voiceSettings(), rate: Number(ds.voiceRate) }); draw(); return sayWith(voiceSettings().uri); }
    if (ds.kid) { kidId = ds.kid; if (view === 'home') view = 'kid'; return draw(); }
    if (ds.icon && t.closest('.icon-pick')) { t.parentElement.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === t)); return; }
    if (ds.confirm) return confirmClaim(ds.for || kidId, ds.confirm, t.getBoundingClientRect());
    if (ds.adj) return adjustCoins(Number(ds.adj), t.getBoundingClientRect());
    if (ds.reject) {
      const id = ds.for || kidId;
      const d = await ctx.loadDay(id);
      if (d.claims) delete d.claims[ds.reject];
      await ctx.dayPut(d);
      state.days[id] = d;
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
    if (ds.openRock) { el.remove(); el = null; return ctx.openRock(ds.openRock); }
    if (ds.rebuild) { await buyRebuild(ds.rebuild); return draw(); }
    if (ds.openRockTest) { el.remove(); el = null; return ctx.openRockTest(); }
    if (ds.keep || ds.drop) { if (await ctx.quickHandle(t)) draw(); return; }
    if (ds.practice) { const [id, dr] = ds.practice.split(':'); return runDrill(id, dr); }
  }

  return { open, confirmClaim };
}
