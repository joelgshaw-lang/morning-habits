import { openDB, kvGet, kvSet, dayGet, dayPut, dayDelete, dayAll } from './db.js';
import * as clock from './clock.js';
import { DEFAULT_SETTINGS } from './config.js';

const app = document.getElementById('app');
const overlay = document.getElementById('overlay');
const toastEl = document.getElementById('toast');

const IDLE_MS = 60 * 1000;        // shared iPad: back to "Who are you?" after 1 idle minute
const ALL_DONE_HOME_MS = 12000;   // ...or 12s after finishing everything
const HOLD_MS = 800;              // press-and-hold to tick a habit, so exploring taps don't count
const UNDO_MS = 8000;
const PRAISE = ['Great job!', 'Awesome!', 'You did it!', 'Super star!', 'Way to go!', 'Nice work!', 'Brilliant!', 'Keep it up!', 'Fantastic!', 'Well done!'];

const state = {
  settings: null,
  prefs: { readAloud: {} },
  kidId: null,
  day: null,
  prayer: null,      // prayer screen being shown: { kidId, phase }
  runs: {},          // running prayer timers by kid: { startMs, duration, startedAt }
  undo: null,
  autoHomeAt: 0,
  lastTouch: Date.now(),
  renderedDay: null,
  reloadPending: false,
  mineOpen: false,   // the Mine and the Temple is open over the child's screen
  tab: 'morning',    // routine shown on a child's screen: morning | extras | night
  warmth: 0,         // current child's lifetime egg warmth
};

// ---------- helpers ----------

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const kid = (id = state.kidId) => state.settings.kids.find((k) => k.id === id);
const todayKey = () => clock.dayKey(clock.now(), state.settings.dayStartHour);
// Three routines per child: morning (timed), extra chores (any time), night (timed).
// An extra chore that's already in the child's own routine (Eliana's trash) is left out.
const listFor = (k, r) => (r === 'morning' ? k.habits : r === 'night' ? k.nightHabits
  : state.settings.extraChores.filter((c) => ![...k.habits, ...k.nightHabits].some((h) => h.id === c.id)));
const mapFor = (day, r) => (r === 'morning' ? day.done : r === 'night' ? day.nightDone : day.extras);
const doneCount = (k, day, r = 'morning') => listFor(k, r).filter((h) => mapFor(day, r)[h.id]).length;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function loadDay(kidId) {
  const id = `${todayKey()}|${kidId}`;
  const rec = (await dayGet(id)) || { id, dayKey: todayKey(), kidId, done: {}, prayerAttempts: [] };
  rec.log ||= []; // every done/undo, so Stage 2 coins can't be farmed by tick-undo-tick
  rec.drops ||= []; // Fruit Tree: times this child stopped to pray
  rec.fruit ||= []; // Fruit Tree: moments planted
  rec.nightDone ||= {};
  rec.extras ||= {};
  return rec;
}

// ---------- egg growth ----------
// Every finished job warms the egg; extra chores warm it twice as much.
// Lifetime warmth, so undoing a tick takes its warmth back. Stage 2 builds the farm on top of the hen.
const EGG_STAGES = [
  { at: 0, icon: '🥚', name: 'Egg', say: 'Something is growing…' },
  { at: 10, icon: '🥚', name: 'Wobbly egg', say: 'Your egg is wobbling!', cls: 'wobble' },
  { at: 25, icon: '🥚', name: 'Cracking egg', say: 'Crack! Something is in there…', cls: 'crack' },
  { at: 45, icon: '🐣', name: 'Hatching!', say: "It's hatching!" },
  { at: 70, icon: '🐥', name: 'Baby chick', say: 'Your chick is here! Keep caring for it.' },
  { at: 100, icon: '🐔', name: 'Hen', say: 'Your hen is all grown up! Soon she can lay eggs on your farm.' },
];
const warmthOf = (day, r) => Object.keys(mapFor(day, r)).length * (r === 'extras' ? 2 : 1);
const dayWarmth = (day) => warmthOf(day, 'morning') + warmthOf(day, 'night') + warmthOf(day, 'extras');

async function warmthByKid() {
  const out = {};
  for (const d of await dayAll()) out[d.kidId] = (out[d.kidId] || 0) + dayWarmth({ done: {}, nightDone: {}, extras: {}, ...d });
  return out;
}

function eggStage(w) {
  let i = 0;
  while (i + 1 < EGG_STAGES.length && w >= EGG_STAGES[i + 1].at) i++;
  const next = EGG_STAGES[i + 1];
  return { ...EGG_STAGES[i], index: i, next, toNext: next ? next.at - w : 0, pct: next ? (w - EGG_STAGES[i].at) / (next.at - EGG_STAGES[i].at) : 1 };
}

// When the child started: the Ready-set-go tap, or else their first tick.
function firstDoneTime(day) {
  const times = [day.startedAt, ...Object.values(day.done)].filter(Boolean).sort();
  return times.length ? new Date(times[0]) : null;
}

function windowInfo(r = 'morning') {
  const s = state.settings;
  const now = clock.now();
  const open = clock.atTime(r === 'night' ? s.nightOpen : s.windowOpen, s.dayStartHour);
  const close = clock.atTime(r === 'night' ? s.nightClose : s.windowClose, s.dayStartHour);
  if (now < open) return { phase: 'before', open, close, left: 1, mins: Math.ceil((open - now) / 60000) };
  if (now < close) return { phase: 'open', open, close, left: (close - now) / (close - open), mins: Math.ceil((close - now) / 60000) };
  return { phase: 'closed', open, close, left: 0, mins: 0 };
}

// Which tab a child's screen opens on: morning until 11am, night from an hour before it opens.
function defaultTab() {
  const now = clock.now();
  if (now.getHours() < 11 && now.getHours() >= state.settings.dayStartHour) return 'morning';
  const night = clock.atTime(state.settings.nightOpen, state.settings.dayStartHour);
  return now >= new Date(night - 3600000) || now.getHours() < state.settings.dayStartHour ? 'night' : 'extras';
}

// The routine the home screen shows: morning before noon, night after.
const homeRoutine = () => (clock.now().getHours() < 12 && clock.now().getHours() >= state.settings.dayStartHour ? 'morning' : 'night');

function greeting() {
  const h = clock.now().getHours();
  return h >= 3 && h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function runLeft(kidId) {
  const r = state.runs[kidId];
  return r ? r.duration - (Date.now() - r.startMs) : 0;
}

// ---------- the Mine and the Temple (mine.html, shown in a frame) ----------
// Habits feed it through a small inbox in localStorage that the mine collects:
// each habit = 1 swing, a finished morning/night routine or prayer timer = gold by the mole, an extra chore = a helping hand.
function sendToMine(kidId, item) {
  try { const key = `mine4.inbox.${kidId}`, list = JSON.parse(localStorage.getItem(key) || '[]'); list.push(item); localStorage.setItem(key, JSON.stringify(list)); } catch {}
}
function mineSwings(kidId) {
  try {
    const save = JSON.parse(localStorage.getItem(`mine4.${kidId}`) || 'null');
    const inbox = JSON.parse(localStorage.getItem(`mine4.inbox.${kidId}`) || '[]');
    return Math.max(0, (save?.swings || 0) + inbox.reduce((n, it) => n + (it.swings || 0), 0));
  } catch { return 0; }
}
// Digging waits until the morning jobs are done, so the game never competes with getting ready.
function mineLocked(k = kid()) {
  const w = windowInfo('morning');
  return w.phase !== 'closed' && doneCount(k, state.day, 'morning') < listFor(k, 'morning').length;
}
function openMine() {
  const k = kid();
  if (mineLocked(k)) {
    toast('⛏ Finish your morning jobs first, then dig!');
    return speak('Finish your morning jobs first, then you can dig!');
  }
  state.mineOpen = true;
  state.autoHomeAt = 0; // don't jump home from inside the mine
  state.lastTouch = Date.now();
  const el = document.createElement('div');
  el.className = 'mine-frame';
  el.innerHTML = `<iframe src="./mine.html?embed=1&kid=${encodeURIComponent(k.id)}" title="The Mine and the Temple" allow="autoplay"></iframe>`;
  document.body.appendChild(el);
}
function closeMine() {
  state.mineOpen = false;
  document.querySelector('.mine-frame')?.remove();
  state.lastTouch = Date.now();
  if (state.kidId) renderKid();
}
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin) return;
  if (e.data?.type === 'mine-activity') state.lastTouch = Date.now();
  if (e.data?.type === 'mine-close') closeMine();
});

// ---------- speech & sound ----------

// Default on for kids under 8 (Judah can't read much yet); each child can toggle it.
function readAloudOn(id = state.kidId) {
  if (!id) return false;
  const pref = state.prefs.readAloud[id];
  return pref === undefined ? kid(id).age < 8 : pref;
}

function speak(text, force = false) {
  if (!(force || readAloudOn()) || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-AU';
  u.rate = 0.95;
  speechSynthesis.speak(u);
}

let audioCtx;
function unlockAudio() {
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback'; // play even with the silent switch on
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch {}
}

function tone(fn) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume().then(() => fn(audioCtx)).catch(() => {});
  else fn(audioCtx);
}

// Soft bell made from a few decaying sine partials (no audio files needed).
function chime() {
  tone((ctx) => {
    const t0 = ctx.currentTime;
    [[660, 0], [990, 0], [880, 0.6], [1320, 0.6]].forEach(([f, delay], i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = f;
      const start = t0 + delay;
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(i % 2 ? 0.08 : 0.2, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, start + 2.5);
      o.connect(g).connect(ctx.destination);
      o.start(start);
      o.stop(start + 2.6);
    });
  });
}

function pop(big = false) {
  tone((ctx) => {
    const notes = big ? [523, 659, 784, 1047] : [520];
    notes.forEach((f, i) => {
      const t = ctx.currentTime + i * 0.12;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * 2, t + 0.12);
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 0.35);
    });
  });
}

// ---------- rendering ----------

function windowBarHTML(r = 'morning') {
  const w = windowInfo(r);
  const openTxt = clock.fmtTime(w.open);
  const closeTxt = clock.fmtTime(w.close);
  const night = r === 'night';
  let label;
  if (w.phase === 'before') label = night ? `🌙 Night routine starts at ${openTxt}` : `🐦 Early bird time! Start now`;
  else if (w.phase === 'open') label = night ? `${w.mins} min until bedtime` : `${w.mins} min left`;
  else label = night ? '😴 Bedtime. Sleep well!' : '🌙 Morning finished. See you tomorrow!';
  // Fill turns green → yellow → red as the morning runs out.
  const fill = w.phase === 'open' ? `hsl(${Math.round(120 * w.left)}, 80%, 50%)` : '';
  const pct = (w.left * 100).toFixed(1);
  return `
    <div class="window-bar ${w.phase} ${night ? 'night' : ''}" data-routine="${r}" role="progressbar" aria-valuenow="${Math.round(w.left * 100)}" aria-valuemin="0" aria-valuemax="100">
      <div class="window-fill" style="width:${pct}%;${fill ? `background:${fill}` : ''}"></div>
      ${w.phase === 'open' ? `<span class="sun-edge" style="left:${pct}%">${night ? '🌙' : '☀️'}</span>` : ''}
      <div class="window-label">${label}</div>
    </div>
    <div class="window-ends"><span>${w.phase === 'before' ? `Opens ${openTxt}` : openTxt}</span><span>${night ? 'Bedtime' : 'Ends'} ${closeTxt}</span></div>`;
}

function clockHTML() {
  return `<div class="clock">${clock.fmtTime(clock.now())}${clock.isFaked() ? ' <span class="fake">DEV</span>' : ''}</div>`;
}

async function renderPicker() {
  const days = await Promise.all(state.settings.kids.map((k) => loadDay(k.id)));
  const warmth = await warmthByKid();
  const r = homeRoutine();
  const w = windowInfo(r);
  app.innerHTML = `
    <section class="screen picker">
      <header class="top">
        <h1>Who are you?</h1>
        ${clockHTML()}
      </header>
      ${windowBarHTML(r)}
      <div class="cards">
        ${state.settings.kids.map((k, i) => {
          const d = days[i];
          const list = listFor(k, r);
          const map = mapFor(d, r);
          const n = doneCount(k, d, r);
          const all = n === list.length;
          const started = r === 'morning' ? firstDoneTime(d) : n > 0;
          const extras = doneCount(k, d, 'extras');
          let status;
          if (state.runs[k.id]) status = `🙏 Praying <span data-countdown="${k.id}">${clock.fmtDuration(runLeft(k.id))}</span>`;
          else if (all) status = r === 'night' ? '🌙 All done!' : '🎉 All done!';
          else if (started && r === 'morning') status = `Started ${clock.fmtTime(started)}`;
          else if (started) status = `${n} of ${list.length} done`;
          else status = w.phase === 'closed' ? (r === 'night' ? 'Sleep well' : 'See you tomorrow') : '👆 Tap to start';
          const nudge = !started && !state.runs[k.id] && w.phase !== 'closed' && (r === 'morning' || w.phase === 'open');
          return `
          <button class="kid-card ${all ? 'all-done' : ''} ${nudge ? 'nudge' : ''}" style="--kid:${k.color}" data-action="open-kid" data-kid="${k.id}">
            <div class="avatar">${k.avatar || '🙂'}</div>
            <div class="kid-name">${esc(k.name)}</div>
            <div class="dots" aria-label="${n} of ${list.length} done">
              ${list.map((h) => `<span class="dot ${map[h.id] ? 'on' : ''}">${map[h.id] ? '✓' : ''}</span>`).join('')}
            </div>
            <div class="egg-badge">${eggStage(warmth[k.id] || 0).icon} ${eggStage(warmth[k.id] || 0).name}${extras ? ` · ⭐ ${extras} extra` : ''}${mineSwings(k.id) ? ` · ⛏ ${mineSwings(k.id)}` : ''}</div>
            <div class="card-status">${status}</div>
          </button>`;
        }).join('')}
      </div>
    </section>`;
}

function tileHTML(k, h, d, nudgeId, r) {
  const at = mapFor(d, r)[h.id];
  const open = clock.atTime(state.settings.windowOpen, state.settings.dayStartHour);
  if (at) {
    const early = r === 'morning' && new Date(at) < open;
    const undo = state.undo?.habitId === h.id && state.undo?.routine === r;
    return `
      <div class="tile done" role="button" data-action="habit" data-habit="${h.id}">
        ${early ? '<span class="early" title="Early bird">🐦</span>' : ''}
        <span class="tile-icon">${h.icon}</span>
        <span class="tile-name">${esc(h.name)}</span>
        ${undo ? '<button class="undo-chip" data-action="undo">↩️ Undo</button>' : `<span class="tile-sub">✓ ${clock.fmtTime(new Date(at))}</span>`}
      </div>`;
  }
  if (h.type === 'timer') {
    const running = state.runs[k.id];
    return `
      <div class="tile ${running ? 'running' : ''} ${nudgeId === h.id ? 'nudge' : ''}" role="button" data-action="habit" data-habit="${h.id}">
        <span class="tile-icon">${h.icon}</span>
        <span class="tile-name">${esc(h.name)}</span>
        <span class="tile-sub">${running ? `⏱ <span data-countdown="${k.id}">${clock.fmtDuration(runLeft(k.id))}</span> left` : `⏱ ${k.prayerMinutes} min · tap`}</span>
      </div>`;
  }
  return `
    <div class="tile ${nudgeId === h.id ? 'nudge' : ''}" role="button" data-hold data-habit="${h.id}">
      <span class="tile-icon">${h.icon}</span>
      <span class="tile-name">${esc(h.name)}</span>
      <span class="tile-sub">👇 Hold${r === 'extras' ? '' : ' when done'}</span>
    </div>`;
}

function petBoxHTML(all, r) {
  const st = eggStage(state.warmth);
  return `
    <div class="pet-box ${all ? 'happy' : ''}">
      <div class="pet big ${st.cls || ''}">${st.icon}</div>
      <div class="pet-name">${st.name}</div>
      <div class="pet-caption">${st.say}</div>
      ${st.next ? `
        <div class="warmth" aria-label="Warmth">
          <div class="warmth-fill" style="width:${(st.pct * 100).toFixed(0)}%"></div>
          <span>🔥 ${st.toNext} more to grow</span>
        </div>` : ''}
      <div class="pet-tip">${r === 'extras' ? '⭐ Extra chores warm it twice as much!' : 'Every job warms your egg. Extra chores warm it ×2!'}</div>
    </div>`;
}

const TABS = [['morning', '☀️', 'Morning'], ['extras', '⭐', 'Extra chores'], ['night', '🌙', 'Night'], ['mine', '⛏', 'Mine']];

function renderKid() {
  const k = kid();
  const d = state.day;
  const r = state.tab;
  const list = listFor(k, r);
  const n = doneCount(k, d, r);
  const total = list.length;
  const all = r !== 'extras' && n === total;
  const nudgeId = r === 'morning' && n === 0 && !state.runs[k.id] ? list[0]?.id : null;
  const started = firstDoneTime(d);
  const notStarted = r === 'morning' && !started && !state.runs[k.id];
  const lastDone = Object.values(mapFor(d, r)).sort().at(-1);
  let title;
  let sub;
  if (r === 'morning') {
    title = all ? `🎉 Amazing, ${esc(k.name)}!` : `${greeting()}, ${esc(k.name)}!`;
    sub = notStarted ? '🚦 Tap the big button to start your morning!' : all ? `All done by ${clock.fmtTime(new Date(lastDone))}. What a start!` : n === 0 ? `☀️ Started ${clock.fmtTime(started)}. Pick a habit!` : `${n} of ${total} done${started ? ` · started ${clock.fmtTime(started)}` : ''}. Keep going!`;
  } else if (r === 'night') {
    title = all ? `🌙 Sleep tight, ${esc(k.name)}!` : `${greeting()}, ${esc(k.name)}!`;
    sub = all ? `Night routine done at ${clock.fmtTime(new Date(lastDone))}. Sweet dreams!` : n === 0 ? '🌙 Time to get ready for bed.' : `${n} of ${total} done. Nearly there!`;
  } else {
    title = `⭐ Extra chores, ${esc(k.name)}!`;
    sub = n === 0 ? 'Help out any time today. Hold a job when you finish it.' : `${n} extra job${n === 1 ? '' : 's'} done today. Thank you for helping!`;
  }
  const tabCount = (t) => (t === 'mine' ? (mineLocked(k) ? '🔒' : mineSwings(k.id) || '') : t === 'extras' ? doneCount(k, d, t) || '' : `${doneCount(k, d, t)}/${listFor(k, t).length}`);
  app.innerHTML = `
    <section class="screen morning tab-${r}" style="--kid:${k.color}">
      <header class="top">
        <button class="btn back" data-action="home" aria-label="Back to Who are you">🏠</button>
        <div class="me">${k.avatar || '🙂'}</div>
        <div class="hello">
          <h1>${title}</h1>
          <p>${sub}</p>
        </div>
        <button class="btn speak ${readAloudOn() ? 'on' : ''}" data-action="toggle-speak" aria-pressed="${readAloudOn()}" aria-label="Read aloud">
          ${readAloudOn() ? '🔊' : '🔇'}
        </button>
      </header>
      <nav class="tabs">
        ${TABS.map(([id, icon, name]) => `
          <button class="tab ${id === r ? 'on' : ''} ${id === 'mine' ? 'mine-tab' : ''}" data-action="${id === 'mine' ? 'mine' : 'tab'}" data-tab="${id}">
            <span>${icon}</span> ${name} <small>${tabCount(id)}</small>
          </button>`).join('')}
      </nav>
      ${r === 'extras' ? '' : windowBarHTML(r)}
      <div class="morning-body">
        ${notStarted ? `
        <div class="start-panel">
          <button class="go-btn" data-action="go">
            <span class="lights"><i class="r"></i><i class="y"></i><i class="g"></i></span>
            <span class="go-text">Ready, set, go!</span>
            <span class="go-sub">Start my morning</span>
          </button>
        </div>` : `
        <div class="tiles ${r === 'extras' ? 'extras' : ''}">
          ${list.map((h) => tileHTML(k, h, d, nudgeId, r)).join('')}
          ${r === 'extras' ? '' : `
          <div class="tile finish ${all ? 'lit' : ''}" aria-hidden="true">
            <span class="tile-icon">${r === 'night' ? '🌙' : '🏆'}</span>
            <span class="tile-name">${all ? (r === 'night' ? 'Sleep tight!' : 'You did it!') : 'Finish line'}</span>
            <span class="tile-sub">${n} / ${total}</span>
          </div>`}
        </div>`}
        <aside class="side">
          ${petBoxHTML(all, r)}
          ${r === 'extras' ? `<div class="habit-progress extras-progress"><span>⭐ × ${n}</span></div>` : `
          <div class="habit-progress" aria-label="${n} of ${total} done">
            <div class="habit-fill" style="width:${(n / total) * 100}%"></div>
            <span>${'⭐'.repeat(n)}${'☆'.repeat(total - n)}</span>
          </div>`}
        </aside>
      </div>
    </section>`;
}

async function render() {
  state.renderedDay = todayKey();
  if (state.kidId) {
    state.day = await loadDay(state.kidId);
    state.warmth = (await warmthByKid())[state.kidId] || 0;
    renderKid();
  } else {
    await renderPicker();
  }
  renderDevBar();
}

// Light refresh every second: clock, window bar, idle timeout, 3am rollover.
function tick() {
  if (todayKey() !== state.renderedDay) {
    navigator.serviceWorker?.getRegistration().then((r) => r?.update()).catch(() => {});
    return render();
  }
  const bar = app.querySelector('.window-bar');
  if (bar) {
    const tmp = document.createElement('div');
    tmp.innerHTML = windowBarHTML(bar.dataset.routine);
    bar.nextElementSibling.remove();
    bar.replaceWith(...tmp.children);
  }
  const c = app.querySelector('.clock');
  if (c) c.outerHTML = clockHTML();
  const idle = Date.now() - state.lastTouch > (state.mineOpen ? 3 * IDLE_MS : IDLE_MS) && state.prayer?.phase !== 'confirm';
  const away = state.kidId || state.prayer;
  if (away && (idle || (state.autoHomeAt && Date.now() > state.autoHomeAt))) goHome();
}

// ---------- actions ----------

function openKid(id) {
  unlockAudio();
  const k = kid(id);
  state.kidId = id;
  state.autoHomeAt = 0;
  state.tab = defaultTab();
  const w = windowInfo(state.tab);
  // Speak before any await so iOS treats it as part of the tap.
  if (state.tab === 'morning') {
    speak(w.phase === 'open' ? `Good morning ${k.name}! You have ${w.mins} minutes. Let's go!`
      : w.phase === 'before' ? `Good morning ${k.name}! Early bird! Let's start the day.` : `Hi ${k.name}!`);
  } else if (state.tab === 'night') {
    speak(`Good evening ${k.name}! Time for your night routine.`);
  } else {
    speak(`Hi ${k.name}! Want to do an extra job to help?`);
  }
  return render();
}

function goHome() {
  if (state.mineOpen) { state.mineOpen = false; document.querySelector('.mine-frame')?.remove(); }
  closeOverlay();
  state.kidId = null;
  state.day = null;
  state.undo = null;
  state.autoHomeAt = 0;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  if (state.reloadPending) return location.reload();
  render();
}

async function completeHabit(habitId) {
  const r = state.tab;
  const h = listFor(kid(), r).find((x) => x.id === habitId);
  const at = clock.now().toISOString();
  mapFor(state.day, r)[habitId] = at;
  state.day.log.push({ t: at, routine: r, habit: habitId, action: 'done' });
  await dayPut(state.day);
  afterDone(habitId, h.type !== 'timer', r);
}

// Shared feedback after any habit is completed (tile tap or prayer timer).
function afterDone(habitId, allowUndo, r = 'morning') {
  const k = kid();
  const h = listFor(k, r).find((x) => x.id === habitId);
  const all = r !== 'extras' && doneCount(k, state.day, r) === listFor(k, r).length;
  const before = eggStage(state.warmth);
  state.warmth += r === 'extras' ? 2 : 1;
  const grew = eggStage(state.warmth).index > before.index;
  if (h.type !== 'timer') sendToMine(k.id, r === 'extras' ? { swings: 1, hands: 1 } : { swings: 1 });
  if (all) sendToMine(k.id, { gold: 1, icon: r === 'night' ? '🌙' : '☀️' });
  if (allowUndo) {
    clearTimeout(state.undo?.timer);
    state.undo = { habitId, routine: r, timer: setTimeout(() => { state.undo = null; if (state.kidId === k.id && !state.prayer) renderKid(); }, UNDO_MS) };
  }
  renderKid();
  const tile = app.querySelector(`[data-habit="${habitId}"]`);
  tile?.classList.add('just-done');
  burst(tile);
  if (all) {
    pop(true);
    speak(r === 'night' ? `${h.name}, done! Night routine finished. Sleep tight!` : `${h.name}, done! You finished everything. Amazing!`);
    allDoneMoment(r);
    if (grew) setTimeout(growMoment, 3600);
    state.autoHomeAt = Date.now() + ALL_DONE_HOME_MS + (grew ? 4000 : 0);
  } else if (grew) {
    pop(true);
    growMoment();
  } else {
    pop();
    speak(r === 'extras' ? `${h.name}, done! Thank you for helping!` : `${h.name}, done! ${pick(PRAISE)}`);
  }
}

async function undo() {
  if (!state.undo || !state.day) return;
  const { habitId, routine } = state.undo;
  clearTimeout(state.undo.timer);
  state.undo = null;
  delete mapFor(state.day, routine)[habitId];
  state.warmth -= routine === 'extras' ? 2 : 1;
  sendToMine(state.kidId, routine === 'extras' ? { swings: -1, hands: -1 } : { swings: -1 });
  state.day.log.push({ t: clock.now().toISOString(), routine, habit: habitId, action: 'undo' });
  state.autoHomeAt = 0;
  await dayPut(state.day);
  renderKid();
}

function burst(fromEl, count = 14) {
  const r = fromEl?.getBoundingClientRect();
  const box = document.createElement('div');
  box.className = 'burst';
  box.style.left = `${r ? r.left + r.width / 2 : innerWidth / 2}px`;
  box.style.top = `${r ? r.top + r.height / 2 : innerHeight / 2}px`;
  box.innerHTML = Array.from({ length: count }, (_, i) =>
    `<span style="--a:${(360 / count) * i}deg;--d:${90 + (i % 3) * 50}px">${['⭐', '✨', '🎉', '💛'][i % 4]}</span>`).join('');
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 1600);
}

function allDoneMoment(r = 'morning') {
  const k = kid();
  const el = document.createElement('div');
  el.className = 'all-done-moment';
  el.style.setProperty('--kid', k.color);
  el.innerHTML = `<div><div class="big-emoji">${r === 'night' ? '🌙' : '🎉'}</div><h2>${r === 'night' ? 'Sleep tight' : 'All done'}, ${esc(k.name)}!</h2><p>Finished at ${clock.fmtTime(clock.now())}</p></div>`;
  document.body.appendChild(el);
  setTimeout(() => burst(null, 30), 150);
  setTimeout(() => burst(null, 30), 700);
  el.addEventListener('click', () => el.remove());
  setTimeout(() => el.remove(), 3500);
}

// The egg reached a new stage.
function growMoment() {
  const k = kid();
  if (!k) return;
  const st = eggStage(state.warmth);
  const el = document.createElement('div');
  el.className = 'all-done-moment grow-moment';
  el.style.setProperty('--kid', k.color);
  el.innerHTML = `<div><div class="big-emoji ${st.cls || ''}">${st.icon}</div><h2>${st.name}!</h2><p>${st.say}</p></div>`;
  document.body.appendChild(el);
  chime();
  speak(st.say.replace('…', '.'));
  setTimeout(() => burst(null, 30), 200);
  el.addEventListener('click', () => el.remove());
  setTimeout(() => el.remove(), 4000);
  renderKid();
}

// ---------- ready, set, go ----------

let going = false;

function beep(freq, len = 0.25) {
  tone((ctx) => {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'triangle';
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + len + 0.05);
  });
}

// Traffic-light countdown, then the start time is saved and the habit tiles appear.
async function readySetGo() {
  if (going) return;
  going = true;
  unlockAudio();
  const k = kid();
  const el = document.createElement('div');
  el.className = 'rsg';
  document.body.appendChild(el);
  const steps = [['Ready…', 'r', 440], ['Set…', 'y', 440], ['GO!', 'g', 880]];
  for (const [word, light, freq] of steps) {
    el.dataset.light = light;
    el.innerHTML = `<div class="rsg-lights"><i class="r"></i><i class="y"></i><i class="g"></i></div><div class="rsg-word">${word}</div>`;
    beep(freq, light === 'g' ? 0.6 : 0.25);
    speak(word.replace('…', ''));
    await new Promise((r) => setTimeout(r, light === 'g' ? 700 : 900));
  }
  el.remove();
  going = false;
  if (state.kidId !== k.id) return;
  const at = clock.now().toISOString();
  state.day.startedAt = at;
  state.day.log.push({ t: at, action: 'start' });
  await dayPut(state.day);
  renderKid();
  burst(app.querySelector('.tiles'), 20);
  speak(`Let's go, ${k.name}!`);
}

// ---------- press-and-hold tiles ----------

let hold = null;

function startHold(tile) {
  cancelHold();
  unlockAudio();
  const h = listFor(kid(), state.tab).find((x) => x.id === tile.dataset.habit);
  tile.classList.remove('hint');
  tile.classList.add('holding');
  speak(h.name);
  hold = {
    tile,
    started: Date.now(),
    timer: setTimeout(() => { hold = null; tile.classList.remove('holding'); completeHabit(h.id); }, HOLD_MS),
  };
}

function cancelHold() {
  if (!hold) return;
  clearTimeout(hold.timer);
  const { tile, started } = hold;
  hold = null;
  tile.classList.remove('holding');
  if (Date.now() - started < 400) {
    // A quick tap: show how to finish instead of ticking it.
    tile.classList.add('hint');
    const sub = tile.querySelector('.tile-sub');
    if (sub) sub.textContent = '👇 Keep your finger down!';
    setTimeout(() => speak('Hold your finger down to finish.'), 600);
  }
}

// ---------- prayer timer ----------

let wakeLock = null;

async function updateWakeLock() {
  const want = Object.keys(state.runs).length > 0 && !document.hidden;
  try {
    if (want && !wakeLock && 'wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!want && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {}
}

function prayerDurationMs(k) {
  const ms = k.prayerMinutes * 60000;
  return clock.fastTimers() ? ms / 60 : ms; // dev mode: 1 minute becomes 1 second
}

function openPrayer() {
  const k = kid();
  state.prayer = { kidId: k.id, phase: state.runs[k.id] ? 'running' : 'ready' };
  renderPrayer();
  if (state.prayer.phase === 'ready') speak(`Prayer time. ${k.prayerMinutes} minutes. Tap start when you are ready.`);
}

async function startPrayer() {
  unlockAudio();
  const k = kid();
  const run = { startMs: Date.now(), duration: prayerDurationMs(k), startedAt: clock.now().toISOString() };
  state.runs[k.id] = run;
  state.day.prayerRun = run; // saved so the timer survives a reload
  await dayPut(state.day);
  state.prayer = { kidId: k.id, phase: 'running' };
  updateWakeLock();
  renderPrayer();
}

// Runs every 250ms for all kids, so a timer keeps going while siblings use the iPad.
function checkRuns() {
  for (const id of Object.keys(state.runs)) {
    const left = runLeft(id);
    if (left <= 0) { finishPrayer(id); continue; }
    document.querySelectorAll(`[data-countdown="${id}"]`).forEach((el) => { el.textContent = clock.fmtDuration(left); });
    if (state.prayer?.kidId === id) {
      const ring = overlay.querySelector('.ring-fg');
      if (ring) ring.style.strokeDashoffset = String(RING_C * (1 - left / state.runs[id].duration));
    }
  }
}

async function endRun(kidId, completed) {
  const run = state.runs[kidId];
  if (!run) return null;
  delete state.runs[kidId];
  updateWakeLock();
  const day = state.kidId === kidId && state.day ? state.day : await loadDay(kidId);
  const end = clock.now().toISOString();
  day.prayerAttempts.push({ start: run.startedAt, end, completed });
  delete day.prayerRun;
  if (completed) {
    day.done.pray = end;
    day.log.push({ t: end, habit: 'pray', action: 'done' });
    sendToMine(kidId, { swings: 1, gold: 1, icon: '🙏' }); // time with God: gold by the mole
  }
  await dayPut(day);
  return day;
}

async function finishPrayer(kidId) {
  if (!(await endRun(kidId, true))) return;
  chime();
  const k = kid(kidId);
  if (state.prayer?.kidId === kidId) {
    state.prayer.phase = 'done';
    renderPrayer();
    if (state.kidId === kidId) speak('Amen! Prayer done. Well done.');
  } else if (state.kidId === kidId) {
    afterDone('pray', false);
  } else {
    toast(`🙏 Amen, ${esc(k.name)}! Prayer finished.`);
    if (!state.kidId) renderPicker();
  }
}

async function stopPrayer() {
  const kidId = state.prayer.kidId;
  await endRun(kidId, false);
  state.prayer.phase = 'stopped';
  renderPrayer();
  speak('Try again, you can do it.');
}

function closeOverlay() {
  state.prayer = null;
  overlay.innerHTML = '';
  overlay.classList.remove('show');
}

function closePrayer() {
  const finished = state.prayer?.phase === 'done';
  closeOverlay();
  state.lastTouch = Date.now();
  if (finished) afterDone('pray', false);
  else renderKid();
}

const RING_R = 150;
const RING_C = 2 * Math.PI * RING_R;

function renderPrayer() {
  const p = state.prayer;
  const k = kid(p.kidId);
  let body = '';
  if (p.phase === 'ready') {
    body = `
      <div class="pray-icon">🙏</div>
      <h2>Prayer time</h2>
      <p>Pray for ${k.prayerMinutes} minutes. Start the timer when you're ready.</p>
      <div class="pray-actions">
        <button class="btn big calm-primary" data-action="pray-start">▶ Start</button>
        <button class="btn calm-secondary" data-action="pray-close">Back</button>
      </div>`;
  } else if (p.phase === 'running' || p.phase === 'confirm') {
    const run = state.runs[k.id];
    const left = runLeft(k.id);
    body = `
      <div class="ring-wrap">
        <div class="breathe"></div>
        <svg viewBox="0 0 340 340" class="ring" aria-hidden="true">
          <circle cx="170" cy="170" r="${RING_R}" class="ring-bg"/>
          <circle cx="170" cy="170" r="${RING_R}" class="ring-fg"
            style="stroke-dasharray:${RING_C};stroke-dashoffset:${RING_C * (1 - left / run.duration)}"/>
        </svg>
        <div class="ring-time" data-countdown="${k.id}">${clock.fmtDuration(left)}</div>
      </div>
      <p class="calm-text">Take your time. God is listening. 💛</p>
      ${p.phase === 'confirm' ? `
        <div class="confirm">
          <p>Stop early? Your Pray habit won't be finished.</p>
          <div class="pray-actions">
            <button class="btn big calm-primary" data-action="pray-keep">Keep praying</button>
            <button class="btn calm-secondary" data-action="pray-stop">Stop</button>
          </div>
        </div>` : `
        <div class="pray-actions">
          <button class="btn calm-secondary" data-action="home">🏠 Let others use the iPad</button>
          <button class="btn calm-secondary" data-action="pray-confirm">Stop</button>
        </div>
        <p class="small">The timer keeps going and chimes when you're done.</p>`}`;
  } else if (p.phase === 'done') {
    body = `
      <div class="pray-icon glow">🙏</div>
      <h2>Amen!</h2>
      <p>You prayed for the whole ${k.prayerMinutes} minutes. Well done!</p>
      <div class="pray-actions"><button class="btn big calm-primary" data-action="pray-close">✓ Back to my habits</button></div>`;
  } else if (p.phase === 'stopped') {
    body = `
      <div class="pray-icon">💛</div>
      <h2>Try again, you can do it.</h2>
      <p>Every bit of prayer counts. Start again when you're ready.</p>
      <div class="pray-actions">
        <button class="btn big calm-primary" data-action="pray-start">▶ Try again</button>
        <button class="btn calm-secondary" data-action="pray-close">Back</button>
      </div>`;
  }
  overlay.innerHTML = `<div class="prayer-screen">${body}</div>`;
  overlay.classList.add('show');
}

function hideToast() {
  clearTimeout(toast.timer);
  toastEl.classList.remove('show');
}

function toast(html) {
  clearTimeout(toast.timer);
  toastEl.innerHTML = html;
  toastEl.classList.add('show');
  toast.timer = setTimeout(() => toastEl.classList.remove('show'), 6000);
}

// ---------- dev mode (open the app with ?dev=1; ?dev=0 turns it off) ----------

function devOn() { try { return localStorage.getItem('dev.mode') === '1'; } catch { return false; } }
function setDev(on) { try { on ? localStorage.setItem('dev.mode', '1') : localStorage.removeItem('dev.mode'); } catch {} }

function toLocalInput(d) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function renderDevBar() {
  let bar = document.getElementById('devbar');
  document.body.classList.toggle('dev', devOn());
  if (!devOn()) { bar?.remove(); return; }
  if (!bar) { bar = document.createElement('div'); bar.id = 'devbar'; document.body.appendChild(bar); }
  bar.innerHTML = `
    <b>DEV</b>
    <input type="datetime-local" id="dev-time" value="${toLocalInput(clock.now())}">
    <button data-action="dev-set">Set time</button>
    <button data-action="dev-add" data-min="5">+5m</button>
    <button data-action="dev-add" data-min="15">+15m</button>
    <button data-action="dev-add" data-min="1440">+1 day</button>
    <button data-action="dev-real">Real time</button>
    <label><input type="checkbox" id="dev-fast" ${clock.fastTimers() ? 'checked' : ''}> Fast timers</label>
    <button data-action="dev-reset">Clear today</button>
    <button data-action="dev-export">Export JSON</button>
    <button data-action="dev-hide">Hide</button>`;
}

async function exportData() {
  const data = {
    exportedAt: new Date().toISOString(),
    settings: await kvGet('settings'),
    prefs: await kvGet('prefs'),
    days: await dayAll(),
  };
  const name = `morning-tracker-${todayKey()}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; } catch {}
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function devAction(action, el) {
  if (action === 'dev-set') {
    const v = document.getElementById('dev-time').value;
    if (v) clock.setFakeTime(new Date(v));
  } else if (action === 'dev-add') clock.addMinutes(Number(el.dataset.min));
  else if (action === 'dev-real') clock.clearFakeTime();
  else if (action === 'dev-reset') {
    if (!confirm("Clear today's ticks for all kids?")) return;
    state.runs = {};
    await Promise.all(state.settings.kids.map((k) => dayDelete(`${todayKey()}|${k.id}`)));
  } else if (action === 'dev-export') return exportData();
  else if (action === 'dev-hide') setDev(false);
  await render();
}

// ---------- events ----------

document.addEventListener('pointerdown', (e) => {
  state.lastTouch = Date.now();
  const tile = e.target.closest('.tile[data-hold]');
  if (tile) startHold(tile);
}, true);
document.addEventListener('pointerup', cancelHold);
document.addEventListener('pointercancel', cancelHold);
document.addEventListener('contextmenu', (e) => { if (e.target.closest('.tile')) e.preventDefault(); });

document.addEventListener('change', (e) => {
  if (e.target.id === 'dev-fast') clock.setFastTimers(e.target.checked);
});

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const a = el.dataset.action;
  if (a.startsWith('dev-')) return devAction(a, el);
  switch (a) {
    case 'open-kid': return openKid(el.dataset.kid);
    case 'home': return goHome();
    case 'go': return readySetGo();
    case 'mine': return openMine();
    case 'undo': e.stopPropagation(); return undo();
    case 'toggle-speak': {
      state.prefs.readAloud[state.kidId] = !readAloudOn();
      await kvSet('prefs', state.prefs);
      renderKid();
      if (readAloudOn()) speak('Read aloud is on.', true);
      return;
    }
    case 'tab': {
      state.tab = el.dataset.tab;
      state.undo = null;
      renderKid();
      const name = TABS.find((t) => t[0] === state.tab)[2];
      return speak(state.tab === 'extras' ? 'Extra chores. Thank you for helping!' : `${name} routine.`);
    }
    case 'habit': {
      const h = listFor(kid(), state.tab).find((x) => x.id === el.dataset.habit);
      if (mapFor(state.day, state.tab)[h.id]) return speak(`${h.name} is already done. Nice!`);
      if (h.type === 'timer') return openPrayer();
      return;
    }
    case 'pray-start': return startPrayer();
    case 'pray-confirm': state.prayer.phase = 'confirm'; return renderPrayer();
    case 'pray-keep': state.prayer.phase = 'running'; return renderPrayer();
    case 'pray-stop': return stopPrayer();
    case 'pray-close': return closePrayer();
  }
});

// Catch up timers and re-request the wake lock when the iPad wakes or the app returns.
document.addEventListener('visibilitychange', () => {
  updateWakeLock();
  if (!document.hidden) { checkRuns(); tick(); }
});

// ---------- start ----------

// Fill in fields added to DEFAULT_SETTINGS since this iPad first saved its settings.
function migrate(s) {
  if ((s.version || 1) >= DEFAULT_SETTINGS.version) return s;
  for (const [key, val] of Object.entries(DEFAULT_SETTINGS)) if (!(key in s)) s[key] = structuredClone(val);
  for (const dk of DEFAULT_SETTINGS.kids) {
    const k = s.kids.find((x) => x.id === dk.id);
    if (k) for (const [key, val] of Object.entries(dk)) if (!(key in k)) k[key] = structuredClone(val);
  }
  // New default extra chores join the saved list (before "Another helpful job"), keeping any edits.
  for (const c of DEFAULT_SETTINGS.extraChores) {
    if (s.extraChores.some((x) => x.id === c.id)) continue;
    const other = s.extraChores.findIndex((x) => x.id === 'other');
    s.extraChores.splice(other < 0 ? s.extraChores.length : other, 0, structuredClone(c));
  }
  s.version = DEFAULT_SETTINGS.version;
  return s;
}

async function init() {
  await openDB();
  const saved = await kvGet('settings');
  state.settings = migrate(saved || structuredClone(DEFAULT_SETTINGS));
  await kvSet('settings', state.settings);
  state.prefs = (await kvGet('prefs')) || { readAloud: {} };
  const dev = new URLSearchParams(location.search).get('dev');
  if (dev !== null) setDev(dev !== '0');
  navigator.storage?.persist?.();

  // Resume any prayer timers that were running before a reload.
  for (const k of state.settings.kids) {
    const d = await loadDay(k.id);
    if (d.prayerRun) state.runs[k.id] = d.prayerRun;
  }
  updateWakeLock();

  if ('serviceWorker' in navigator) {
    const hadController = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('./sw.js').catch(() => {});
    // New version deployed: reload now if nobody is mid-morning, otherwise on the next trip home.
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController) return;
      if (!state.kidId && !state.prayer && !Object.keys(state.runs).length) location.reload();
      else state.reloadPending = true;
    });
  }
  await render();
  setInterval(tick, 1000);
  setInterval(checkRuns, 250);
}

init().catch((err) => {
  app.innerHTML = `<div class="error"><h1>Something went wrong 😕</h1><p>${esc(err.message || err)}</p><button class="btn" onclick="location.reload()">Try again</button></div>`;
});
