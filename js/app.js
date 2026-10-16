import { openDB, kvGet, kvSet, dayGet, dayPut, dayDelete, dayAll } from './db.js';
import * as clock from './clock.js';
import { DEFAULT_SETTINGS } from './config.js';
import { summarize, startOffer, startCoins, fmtMinutes, nightFinishedAt, COINS, EXTRAS_DAY_CAP } from './family.js';
import { createFarm } from './farm.js';
import { askPin } from './pinpad.js';

const app = document.getElementById('app');
const overlay = document.getElementById('overlay');
const toastEl = document.getElementById('toast');

const IDLE_MS = 60 * 1000;        // shared iPad: back to "Who are you?" after 1 idle minute
const ALL_DONE_HOME_MS = 12000;   // ...or 12s after finishing everything
const HOLD_MS = 800;              // press-and-hold to tick a habit, so exploring taps don't count
const UNDO_MS = 8000;
const FOCUS_HOME_MS = 9000;      // after a tick, the board resets soon so kids go and do the next job
const SESSION_MS = 2 * 60 * 1000;   // farm time per visit (mine time doesn't count)
const COOLDOWN_MS = 10 * 60 * 1000; // break after farm time runs out
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
  dinners: {},       // dayKey -> when a grown-up tapped "Dinner's finished"
  sum: null,         // coins, streaks and tonight's family race (from family.js)
  farms: null,       // each child's farm (farm.js), saved in IndexedDB
  days: {},          // today's record for every child (the family board shows all three)
  farmKid: null,     // child whose farm screen is open
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
// A grown-up opens the mine with the PIN (inside mine.html) for 20 minutes; 🔑 shows when it needs opening.
function mineOpenLeft() { try { return Math.max(0, Number(localStorage.getItem('mine4.openUntil') || 0) - Date.now()); } catch { return 0; } }
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

// ---------- coins, streaks, dinner race ----------

async function refreshSummary() {
  state.dinners = (await kvGet('dinners')) || {};
  state.sum = summarize(state.settings, await dayAll(), state.dinners, todayKey());
  if (!state.farms) state.farms = (await kvGet('farms')) || {};
}
const farm = createFarm({
  state, esc, kid: (id) => kid(id), todayKey: () => todayKey(), kvSet, earned: (id) => state.sum?.coins[id] || 0,
  speak: (...a) => speak(...a), unlockAudio: () => unlockAudio(), tone: (fn) => tone(fn), pop: (...a) => pop(...a),
  chime: () => chime(), burst: (...a) => burst(...a), toast: (h) => toast(h), renderKid: () => renderKid(),
});
// Spendable coins: earned from jobs, plus farm sales, minus farm spending.
const coinsOf = (id) => (state.sum ? farm.balance(id) : 0);
const streakOf = (id) => state.sum?.streak[id] || 0;
const dinnerToday = () => state.dinners[todayKey()];

// ---------- farm codes and farm time ----------
// Chores need no sign-in: the family board shows everyone. A child's own 4-digit code opens their farm
// (where coins get spent), once their routine is done, for 2 minutes. Then a 10-minute break.

const readJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
const writeJSON = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };
const sessions = readJSON('sessions', {});
const nowMs = () => clock.now().getTime();
const cooldownLeft = (id) => Math.max(0, (sessions[id]?.cooldownUntil || 0) - nowMs());
const sessionLeft = (id) => Math.max(0, SESSION_MS - (sessions[id]?.used || 0));
const sessionPaused = () => !!state.prayer || state.mineOpen;

function beginSession(id) {
  const s = (sessions[id] ||= { used: 0, lastSeen: 0, cooldownUntil: 0 });
  if (nowMs() - s.lastSeen >= COOLDOWN_MS) { s.used = 0; s.warned = false; }
  s.lastSeen = nowMs();
  writeJSON('sessions', sessions);
}

let timesUpShown = false;
function sessionTick() {
  const s = state.farmKid && sessions[state.farmKid];
  if (!s || timesUpShown) return;
  const n = nowMs();
  const dt = Math.max(0, Math.min(5000, n - s.lastSeen)); // ignore jumps (iPad asleep, dev time skips)
  s.lastSeen = n;
  if (!sessionPaused()) s.used += dt;
  writeJSON('sessions', sessions);
  const chip = app.querySelector('.session-chip');
  if (chip) {
    chip.textContent = sessionPaused() ? '⏸ Paused' : `⏳ ${clock.fmtDuration(sessionLeft(state.farmKid))}`;
    chip.classList.toggle('low', sessionLeft(state.farmKid) <= 30000);
  }
  if (s.used >= SESSION_MS) return timesUp();
  if (!s.warned && SESSION_MS - s.used <= 30000) { s.warned = true; speak('30 seconds left.'); }
}

function timesUp() {
  const k = kid(state.farmKid);
  const s = sessions[k.id];
  s.used = 0;
  s.warned = false;
  s.cooldownUntil = nowMs() + COOLDOWN_MS;
  writeJSON('sessions', sessions);
  timesUpShown = true;
  const el = document.createElement('div');
  el.className = 'all-done-moment times-up';
  el.style.setProperty('--kid', k.color);
  el.innerHTML = `<div><div class="big-emoji">⏰</div><h2>Farm time's up, ${esc(k.name)}!</h2><p>Your animals will be here later. Come back in 10 minutes.</p></div>`;
  document.body.appendChild(el);
  speak(`Farm time's up, ${k.name}! Your animals will be here later. Come back in 10 minutes.`, true);
  setTimeout(() => { el.remove(); timesUpShown = false; goHome(); }, 4000);
}

let grownUntil = 0; // after the grown-up PIN, a few minutes without asking again (e.g. several reminders in a row)

async function grownUp(note, grace = false) {
  if (grace && Date.now() < grownUntil) return true;
  // Same grown-up PIN as the mine uses.
  let saved = null;
  try { saved = localStorage.getItem('mine3.pin'); } catch {}
  if (saved) {
    const ok = !!(await askPin({ title: 'Enter the grown-up PIN', note: `👨‍👩‍👧 Grown-ups only · ${note}`, expect: String(saved) }));
    if (ok && grace) grownUntil = Date.now() + 5 * 60000;
    return ok;
  }
  const code = await askPin({ title: 'Choose a 4-digit grown-up PIN', note: `👨‍👩‍👧 Grown-ups only · ${note}`, create: true });
  if (code) { try { localStorage.setItem('mine3.pin', code); } catch {} }
  return !!code;
}

// The child's own code (made the first time). Returns true if they got it right.
async function askKidCode(id) {
  const k = kid(id);
  const pins = readJSON('kidPins', {});
  if (readAloudOn(id)) speak(pins[id] ? `Hi ${k.name}! Type your secret code to open your farm.` : `Hi ${k.name}! Make a secret code with 4 numbers.`, true);
  if (!pins[id]) {
    const code = await askPin({ title: `Make your secret code, ${esc(k.name)}`, note: `${k.avatar || ''} 4 numbers only you know`, color: k.color, create: true });
    if (!code) return false;
    pins[id] = code;
    writeJSON('kidPins', pins);
    return true;
  }
  const r = await askPin({ title: `Hi ${esc(k.name)}! Type your secret code`, note: `${k.avatar || ''} to open your farm`, color: k.color, expect: pins[id], forgot: true });
  if (r === 'forgot') {
    if (!(await grownUp(`reset ${k.name}'s code`))) return false;
    delete pins[id];
    writeJSON('kidPins', pins);
    toast(`Code cleared. ${esc(k.name)} can make a new one.`);
    return askKidCode(id);
  }
  return !!r;
}

// The farm opens once the child's current routine is done (any time during the day), for 2 minutes.
function farmLocked(k, d) {
  const r = defaultTab();
  if (r === 'extras') return false;
  return doneCount(k, d, r) < listFor(k, r).length;
}

async function openFarm(id) {
  unlockAudio();
  const k = kid(id);
  if (farmLocked(k, state.days[id])) {
    if (readAloudOn(id)) speak(`Finish your jobs first, ${k.name}, then your farm opens.`, true);
    return toast(`🔒 Finish your jobs first, then your farm opens.`);
  }
  const cd = cooldownLeft(id);
  if (cd) {
    if (readAloudOn(id)) speak(`Your farm is resting, ${k.name}. Come back soon.`, true);
    return toast(`😴 Farm break, ${esc(k.name)}. Back in ${clock.fmtDuration(cd)}`);
  }
  if (!(await askKidCode(id))) return;
  beginSession(id);
  state.farmKid = id;
  state.kidId = id;
  state.day = state.days[id];
  state.autoHomeAt = 0;
  speak(`${k.name}'s farm! You have 2 minutes.`);
  renderKid();
  farm.opened(k);
}

// ---------- reminders: a grown-up taps when they had to remind a child (−1 coin each) ----------

async function openReminders() {
  if (!(await grownUp('reminders', true))) return;
  const r = homeRoutine();
  const days = await Promise.all(state.settings.kids.map((k) => loadDay(k.id)));
  const el = document.createElement('div');
  el.className = 'farm-ov reminders-ov';
  el.innerHTML = `
    <div class="farm-sheet">
      <h2>🔔 Had to remind someone?</h2>
      <p>Each reminder is −🪙 ${-COINS.reminder}. A ${r} with no reminders earns +🪙 ${COINS.noReminders}.</p>
      ${state.settings.kids.map((k, i) => {
        const n = (days[i].reminders || []).length;
        return `<div class="remind-row" style="--kid:${k.color}">
          <span class="face">${k.avatar}</span><b>${esc(k.name)}</b><span class="remind-count">🔔 ${n}</span>
          <button class="farm-btn remind" data-remind="${k.id}">🔔 Remind −🪙 ${-COINS.reminder}</button>
          <button class="farm-btn small" data-unremind="${k.id}" ${n ? '' : 'disabled'}>↩️</button>
        </div>`;
      }).join('')}
      <button class="farm-btn" data-close>Done</button>
    </div>`;
  document.body.appendChild(el);
  el.addEventListener('click', async (e) => {
    if (e.target.closest('[data-close]')) { el.remove(); return render(); }
    const add = e.target.closest('[data-remind]');
    const undoBtn = e.target.closest('[data-unremind]');
    const id = add?.dataset.remind || undoBtn?.dataset.unremind;
    if (!id) return;
    const d = await loadDay(id);
    d.reminders ||= [];
    if (add) d.reminders.push({ t: clock.now().toISOString(), routine: homeRoutine() });
    else d.reminders.pop();
    await dayPut(d);
    el.remove();
    await refreshSummary();
    openReminders();
  });
}

async function dinnerFinished() {
  if (!(await grownUp("Dinner's finished"))) return;
  state.dinners[todayKey()] = clock.now().toISOString();
  await kvSet('dinners', state.dinners);
  speak("Dinner's finished! Race to your night jobs. Start quickly for more coins!", true);
  await render();
}

async function startNight() {
  const k = kid();
  if (state.day.nightStartedAt) return;
  state.day.nightStartedAt = clock.now().toISOString();
  state.day.log.push({ t: state.day.nightStartedAt, routine: 'night', action: 'start' });
  await dayPut(state.day);
  const coins = startCoins(dinnerToday(), state.day.nightStartedAt);
  await refreshSummary();
  renderKid();
  burst(app.querySelector('.tiles'), 16);
  pop(true);
  speak(`Go ${k.name}! ${coins ? `${coins} coins for a quick start! ` : ''}Finish in 20 minutes for ${COINS.under40 + COINS.under20} coins.`);
  if (coins) toast(`🪙 +${coins} for a quick start!`);
}

// The night chores clock: green for the first 20 minutes, then amber until 40.
function nightTimerText(startIso, finishedMs) {
  const took = (finishedMs || nowMs()) - new Date(startIso).getTime();
  const min20 = 20 * 60000;
  const min40 = 40 * 60000;
  if (finishedMs) {
    return took <= min20 ? `⚡ Done in ${fmtMinutes(took)}! Super fast: 🪙 ${COINS.under40 + COINS.under20}` : took <= min40 ? `✅ Done in ${fmtMinutes(took)}! Under 40 minutes: 🪙 ${COINS.under40}` : `✅ Done in ${fmtMinutes(took)}. Try for under 40 tomorrow!`;
  }
  const t = clock.fmtDuration(took);
  if (took < min20) return `⏱ ${t} · finish in ${clock.fmtDuration(min20 - took)} for 🪙 ${COINS.under40 + COINS.under20}`;
  if (took < min40) return `⏱ ${t} · finish in ${clock.fmtDuration(min40 - took)} for 🪙 ${COINS.under40}`;
  return `⏱ ${t} · keep going, nearly bedtime!`;
}

function nightTimerHTML(k, d) {
  const fin = nightFinishedAt(k, d);
  const took = (fin || nowMs()) - new Date(d.nightStartedAt).getTime();
  const left = Math.max(0, 1 - took / (40 * 60000));
  const zone = took < 20 * 60000 ? 'fast' : took < 40 * 60000 ? 'ok' : 'late';
  return `
    <div class="night-timer ${zone} ${fin ? 'finished' : ''}" ${fin ? '' : `data-night-start="${d.nightStartedAt}"`}>
      <div class="night-timer-fill" style="width:${(left * 100).toFixed(1)}%"></div>
      <span class="night-timer-mark" title="20 minutes"></span>
      <div class="night-timer-label">${nightTimerText(d.nightStartedAt, fin)}</div>
    </div>`;
}

function raceBarHTML() {
  const din = dinnerToday();
  if (homeRoutine() !== 'night' || clock.now().getHours() < 16) return '';
  const fam = state.sum?.family;
  if (!din) return '';
  const best = fam?.bestTime != null ? `Record ${fmtMinutes(fam.bestTime)}` : '';
  const last = fam?.lastTime != null ? `Last time ${fmtMinutes(fam.lastTime)}` : '';
  const compare = [last, best].filter(Boolean).join(' · ');
  if (fam?.win) {
    const how = fam.record ? '⚡ New family record!' : fam.beatLast ? '🚀 Faster than last time!' : '';
    return `<div class="race-bar won">🏆 Family win${fam.time != null ? ` in ${fmtMinutes(fam.time)}` : ''}! ${how} <small>${compare}</small></div>`;
  }
  return `<div class="race-bar">🍽️ Race on since ${clock.fmtTime(new Date(din))} · ⏱ <span data-race="${din}">${fmtMinutes(nowMs() - new Date(din).getTime())}</span> <small>${compare || 'First race: set the record!'}</small></div>`;
}

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

function tileHTML(k, h, d, nudgeId, r) {
  const at = mapFor(d, r)[h.id];
  const open = clock.atTime(state.settings.windowOpen, state.settings.dayStartHour);
  if (at) {
    const early = r === 'morning' && new Date(at) < open;
    const undo = state.undo?.habitId === h.id && state.undo?.routine === r && state.undo?.kidId === k.id;
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
        <span class="tile-coin">${tileCoins(h, r) === '💛' ? '💛' : `🪙 ${tileCoins(h, r)}`}</span>
      </div>`;
  }
  return `
    <div class="tile ${nudgeId === h.id ? 'nudge' : ''}" role="button" data-hold data-habit="${h.id}">
      <span class="tile-icon">${h.icon}</span>
      <span class="tile-name">${esc(h.name)}</span>
      <span class="tile-sub">👇 Hold${r === 'extras' ? '' : ' when done'}</span>
      <span class="tile-coin">${tileCoins(h, r) === '💛' ? '💛' : `🪙 ${tileCoins(h, r)}`}</span>
    </div>`;
}

// What a job is worth right now: morning jobs pay more before the window closes; extra chores by effort.
const extrasCoinsToday = (k, d) => Math.min(EXTRAS_DAY_CAP, listFor(k, 'extras').filter((c) => d.extras[c.id]).reduce((a, c) => a + (c.coins || 2), 0));

function tileCoins(h, r) {
  if (r === 'extras') return extrasCoinsToday(kid(), state.day) >= EXTRAS_DAY_CAP ? '💛' : h.coins || 2;
  if (r === 'night') return COINS.nightJob;
  return windowInfo('morning').phase === 'closed' ? COINS.morningLate : COINS.morningOnTime;
}

// A peek at the child's farm, with a button to go there.
const nextJob = (k, d, r) => listFor(k, r).find((h) => !mapFor(d, r)[h.id]);

// What starting the morning right now is worth.
function earlyOffer() {
  const s = state.settings;
  const hit = COINS.earlyStart.find(([t]) => clock.now() <= clock.atTime(t, s.dayStartHour));
  return hit ? `Start now for 🪙 ${hit[1]} (by ${clock.fmtTime(clock.atTime(hit[0], s.dayStartHour))})` : '';
}

// The family board: every child's next job side by side. No sign-in for chores: walk up, hold your job,
// walk away. Each child's farm opens with their code once their jobs are done.
function columnHTML(k, d, r) {
  const list = listFor(k, r);
  const n = doneCount(k, d, r);
  const total = list.length;
  const all = r !== 'extras' && n === total;
  const started = firstDoneTime(d);
  const notStarted = r === 'morning' && !started && !state.runs[k.id];
  const nightGate = r === 'night' && !d.nightStartedAt && !nightFinishedAt(k, d) && n === 0;
  const offer = nightGate && dinnerToday() ? startOffer(dinnerToday(), nowMs()) : null;
  const next = r === 'extras' ? null : nextJob(k, d, r);
  const asked = (d.reminders || []).length;
  let main;
  if (notStarted) {
    main = `<button class="go-btn col-go" data-action="go">
      <span class="lights"><i class="r"></i><i class="y"></i><i class="g"></i></span>
      <span class="go-text">Ready, set, go!</span><span class="go-sub">${earlyOffer() || 'Start my morning'}</span></button>`;
  } else if (nightGate) {
    main = `<button class="go-btn night-go col-go" data-action="start-night">
      <span class="go-icon">🌙</span><span class="go-text">Start night chores!</span>
      <span class="go-sub">Under 20 min = 🪙 ${COINS.under40 + COINS.under20}</span>
      ${offer ? `<span class="go-sub" data-offer="${dinnerToday()}">${offer.coins ? `Start now for 🪙 ${offer.coins}` : 'The family is waiting!'}</span>` : ''}</button>`;
  } else if (r === 'extras') {
    const earned = extrasCoinsToday(k, d);
    main = `<div class="col-note">⭐ Extra jobs · 🪙 ${earned}/${EXTRAS_DAY_CAP} today</div>
      <div class="tiles extras col-extras">${list.map((h) => tileHTML(k, h, d, null, r)).join('')}</div>`;
  } else if (all) {
    main = `<div class="all-done-card"><div class="big">${r === 'night' ? '🌙' : '🏆'}</div><h2>${r === 'night' ? 'All done. Sleep tight!' : 'All done!'}</h2></div>`;
  } else {
    main = `${r === 'night' && d.nightStartedAt ? nightTimerHTML(k, d) : ''}
      ${tileHTML(k, next, d, null, r).replace('class="tile', 'class="tile next-tile')}
      <div class="next-hint">${next.type === 'timer' ? 'Tap to start your prayer timer' : 'Do it, then hold here ✓'}</div>
      <div class="job-row">${list.map((h) => tileHTML(k, h, d, null, r).replace('class="tile', `class="tile mini-tile ${h === next ? 'is-next' : ''}`)).join('')}</div>`;
  }
  const cd = cooldownLeft(k.id);
  const locked = farmLocked(k, d);
  const farmBtn = locked
    ? `<div class="farm-lock">🔒 🐔 Farm opens when your jobs are done</div>`
    : cd ? `<button class="farm-open resting" data-action="open-farm">😴 Farm in <span data-cooldown="${k.id}">${clock.fmtDuration(cd)}</span></button>`
      : `<button class="farm-open" data-action="open-farm">🐔 My farm <span class="peek">${farm.previewIcons(k.id, 5)}</span></button>`;
  return `
    <div class="col" data-col="${k.id}" style="--kid:${k.color}">
      <div class="col-head">
        <span class="face">${k.avatar || '🙂'}</span><b>${esc(k.name)}</b>
        <span class="col-coins">🪙 ${coinsOf(k.id)} · 🔥 ${streakOf(k.id)}${asked ? ` · 🔔 ${asked}` : ''}</span>
      </div>
      <div class="col-main">${main}</div>
      ${farmBtn}
    </div>`;
}

function renderBoard() {
  const r = defaultTab();
  const dinnerBtn = homeRoutine() === 'night' && clock.now().getHours() >= 16 && !dinnerToday();
  app.innerHTML = `
    <section class="screen board tab-${r}">
      <header class="top">
        <h1>${r === 'morning' ? '☀️ Morning jobs' : r === 'night' ? '🌙 Night jobs' : '⭐ Extra jobs'}</h1>
        ${dinnerBtn ? '<button class="btn dinner-btn" data-action="dinner">🍽️ Dinner\'s finished</button>' : ''}
        <button class="btn remind-btn ${dinnerBtn ? '' : 'alone'}" data-action="reminders" aria-label="Reminders (grown-ups)">🔔</button>
        ${clockHTML()}
      </header>
      ${r === 'extras' ? '' : windowBarHTML(r)}
      ${raceBarHTML()}
      <div class="board-cols">${state.settings.kids.map((k) => columnHTML(k, state.days[k.id], r)).join('')}</div>
    </section>`;
}

function renderFarmScreen(k) {
  app.innerHTML = `
    <section class="screen morning tab-farm" style="--kid:${k.color}">
      <header class="top">
        <button class="btn back" data-action="home" aria-label="Back to the family board">🏠</button>
        <div class="me">${k.avatar || '🙂'}</div>
        <div class="hello"><h1>🐔 ${esc(k.name)}'s farm</h1><p>Feed your animals, sell what they make, and grow your farm!</p></div>
        <div class="chips">
          <div class="session-chip" title="Farm time left">⏳ ${clock.fmtDuration(sessionLeft(k.id))}</div>
          <div class="coin-chip">🪙 ${coinsOf(k.id)} · 🔥 ${streakOf(k.id)}</div>
        </div>
        <button class="btn mine-mini" data-action="mine" aria-label="Mine (a grown-up opens it)">⛏${mineOpenLeft() ? '' : '🔑'}</button>
        <button class="btn speak ${readAloudOn() ? 'on' : ''}" data-action="toggle-speak" aria-pressed="${readAloudOn()}" aria-label="Read aloud">${readAloudOn() ? '🔊' : '🔇'}</button>
      </header>
      ${farm.bodyHTML(k)}
    </section>`;
}

function renderKid() {
  if (state.farmKid) return renderFarmScreen(kid(state.farmKid));
  return renderBoard();
}

// Switch to the child whose column was tapped, so ticks, timers and undo act on them.
function useKid(id) {
  state.kidId = id;
  state.day = state.days[id];
  state.tab = defaultTab();
}

async function render() {
  state.renderedDay = todayKey();
  await refreshSummary();
  for (const k of state.settings.kids) state.days[k.id] = await loadDay(k.id);
  if (state.kidId) state.day = state.days[state.kidId];
  if (!state.farmKid) state.tab = defaultTab();
  renderKid();
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
  sessionTick();
  app.querySelectorAll('[data-cooldown]').forEach((el) => {
    const left = cooldownLeft(el.dataset.cooldown);
    if (!left) return render();
    el.textContent = clock.fmtDuration(left);
  });
  app.querySelectorAll('[data-offer]').forEach((el) => {
    const o = startOffer(el.dataset.offer, nowMs());
    el.textContent = o.coins ? `Start now for 🪙 ${o.coins} · drops in ${clock.fmtDuration(o.msToDrop)}` : 'Start now. The family is waiting!';
  });
  app.querySelectorAll('[data-night-start]').forEach((el) => {
    const took = nowMs() - new Date(el.dataset.nightStart).getTime();
    el.querySelector('.night-timer-label').textContent = nightTimerText(el.dataset.nightStart);
    el.querySelector('.night-timer-fill').style.width = `${(Math.max(0, 1 - took / (40 * 60000)) * 100).toFixed(1)}%`;
    el.classList.toggle('ok', took >= 20 * 60000 && took < 40 * 60000);
    el.classList.toggle('late', took >= 40 * 60000);
    el.classList.toggle('fast', took < 20 * 60000);
  });
  app.querySelectorAll('[data-race]').forEach((el) => { el.textContent = fmtMinutes(nowMs() - new Date(el.dataset.race).getTime()); });
  const idle = Date.now() - state.lastTouch > (state.mineOpen ? 3 * IDLE_MS : IDLE_MS) && state.prayer?.phase !== 'confirm';
  const away = state.kidId || state.prayer || state.farmKid;
  // The automatic trip home waits while the child is still tapping (e.g. feeding their animals).
  const autoHome = state.autoHomeAt && Date.now() > state.autoHomeAt && Date.now() - state.lastTouch > 4000 && !document.querySelector('.farm-ov');
  if (away && (idle || autoHome)) goHome();
}

// ---------- actions ----------

function goHome() {
  document.querySelectorAll('.farm-ov').forEach((el) => el.remove());
  if (state.mineOpen) { state.mineOpen = false; document.querySelector('.mine-frame')?.remove(); }
  closeOverlay();
  state.kidId = null;
  state.day = null;
  state.farmKid = null;
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
  const before = state.sum;
  await refreshSummary();
  afterDone(habitId, h.type !== 'timer', r);
  coinNews(before);
}

// Shared feedback after any habit is completed (tile tap or prayer timer).
function afterDone(habitId, allowUndo, r = 'morning') {
  const k = kid();
  const h = listFor(k, r).find((x) => x.id === habitId);
  const all = r !== 'extras' && doneCount(k, state.day, r) === listFor(k, r).length;
  // Extra chores give mine swings for the first 4 a day only.
  if (h.type !== 'timer' && (r !== 'extras' || doneCount(k, state.day, 'extras') <= 4)) sendToMine(k.id, r === 'extras' ? { swings: 1, hands: 1 } : { swings: 1 });
  if (all) sendToMine(k.id, { gold: 1, icon: r === 'night' ? '🌙' : '☀️' });
  if (allowUndo) {
    clearTimeout(state.undo?.timer);
    state.undo = { habitId, routine: r, kidId: k.id, timer: setTimeout(() => { state.undo = null; if (state.kidId === k.id && !state.prayer) renderKid(); }, UNDO_MS) };
  }
  renderKid();
  const tile = app.querySelector(`[data-col="${k.id}"] [data-habit="${habitId}"]`) || app.querySelector(`[data-habit="${habitId}"]`);
  tile?.classList.add('just-done');
  burst(tile);
  if (all) {
    pop(true);
    speak(r === 'night' ? `${h.name}, done! Night routine finished. Sleep tight!` : `${h.name}, done! You finished everything. Amazing!`);
    allDoneMoment(r);
    state.autoHomeAt = Date.now() + ALL_DONE_HOME_MS;
  } else {
    pop();
    const next = r === 'extras' ? null : nextJob(k, state.day, r);
    speak(next ? `${h.name}, done! ${pick(PRAISE)} Next is ${next.name}. Off you go!` : `${h.name}, done! Thank you for helping!`);
    state.nextNote = next ? `👉 Next: ${next.icon} <b>${esc(next.name)}</b>. Off you go!` : '';
    if (next) setTimeout(() => toast(state.nextNote), 300);
    state.autoHomeAt = Date.now() + FOCUS_HOME_MS;
  }
}

// Celebrate coins just earned: night jobs done, bedtime bonus, and the family win.
function coinNews(before) {
  const id = state.kidId;
  const gained = coinsOf(id) - (before?.coins[id] || 0);
  const famWon = state.sum?.family?.win && !before?.family?.win;
  const had = new Set((before?.todayCoins[id] || []).map((c) => c.why));
  const fresh = (state.sum.todayCoins[id] || []).filter((c) => !had.has(c.why)).map((c) => c.why);
  const note = state.nextNote || '';
  state.nextNote = '';
  if (gained > 0) setTimeout(() => toast(`<span>🪙 +${gained} coins! ${fresh.join(' · ')}${note ? `<br>${note}` : ''}</span>`), 600);
  if (famWon) setTimeout(familyWinMoment, 3700);
}

function familyWinMoment() {
  const fam = state.sum.family;
  const el = document.createElement('div');
  el.className = 'all-done-moment family-win';
  const how = fam.record ? '⚡ New family record!' : fam.beatLast ? '🚀 Faster than last time!' : 'Everyone finished their night jobs!';
  el.innerHTML = `<div><div class="big-emoji">🏆</div><h2>Family win!</h2><p>${how}${fam.time != null ? ` ${fmtMinutes(fam.time)} from dinner.` : ''}</p></div>`;
  document.body.appendChild(el);
  chime();
  speak(`Family win! ${how}`, true);
  setTimeout(() => burst(null, 40), 200);
  setTimeout(() => burst(null, 40), 900);
  el.addEventListener('click', () => el.remove());
  setTimeout(() => el.remove(), 5000);
}

async function undo() {
  if (!state.undo || !state.day || state.undo.kidId !== state.kidId) return;
  const { habitId, routine } = state.undo;
  clearTimeout(state.undo.timer);
  state.undo = null;
  delete mapFor(state.day, routine)[habitId];
  if (routine !== 'extras' || doneCount(kid(), state.day, 'extras') < 4) sendToMine(state.kidId, routine === 'extras' ? { swings: -1, hands: -1 } : { swings: -1 });
  state.day.log.push({ t: clock.now().toISOString(), routine, habit: habitId, action: 'undo' });
  state.autoHomeAt = 0;
  await dayPut(state.day);
  await refreshSummary();
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
    if (!state.kidId) render();
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
    delete state.dinners[todayKey()];
    await kvSet('dinners', state.dinners);
    for (const id of Object.keys(sessions)) delete sessions[id];
    writeJSON('sessions', sessions);
  } else if (action === 'dev-export') return exportData();
  else if (action === 'dev-hide') setDev(false);
  await render();
}

// ---------- events ----------

document.addEventListener('pointerdown', (e) => {
  state.lastTouch = Date.now();
  const tile = e.target.closest('.tile[data-hold]');
  if (!tile) return;
  const col = tile.closest('[data-col]');
  if (col) useKid(col.dataset.col);
  startHold(tile);
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
  const col = el.closest('[data-col]');
  if (col && a !== 'open-farm') useKid(col.dataset.col);
  if (a.startsWith('farm-')) return farm.action(a, el);
  switch (a) {
    case 'open-farm': return openFarm(el.closest('[data-col]').dataset.col);
    case 'dinner': return dinnerFinished();
    case 'reminders': return openReminders();
    case 'start-night': return startNight();
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
  // Extra chores saved before prices existed take the default price.
  for (const c of s.extraChores) if (c.coins == null) c.coins = DEFAULT_SETTINGS.extraChores.find((d) => d.id === c.id)?.coins ?? 2;
  // New default night jobs (toilet, in bed) join each child's saved night routine.
  for (const dk of DEFAULT_SETTINGS.kids) {
    const k = s.kids.find((x) => x.id === dk.id);
    for (const h of dk.nightHabits) if (k && !k.nightHabits.some((x) => x.id === h.id)) k.nightHabits.push(structuredClone(h));
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
