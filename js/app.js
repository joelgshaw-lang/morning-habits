import { openDB, kvGet, kvSet, dayGet, dayPut, dayDelete, dayAll } from './db.js';
import * as clock from './clock.js';
import { DEFAULT_SETTINGS, GROWN_PIN, BREATHS_PER_DAY, BREATH_MS } from './config.js';
import { summarize, startOffer, startCoins, fmtMinutes, nightFinishedAt, morningStart, houseJobsFor, planFor, COINS, EXTRAS_DAY_CAP, startByMs, bedtimeBonus, practiceMs } from './family.js';
import { createPortal } from './portal.js';
import { createQuick } from './quick.js';
import { createFarm } from './farm.js';
import { askPin } from './pinpad.js';
import { utterance } from './voice.js';
import { initFruit, openFruitTime, skipFruitToday, runNightFruit, fruitTileHTML, fruitBadgeHTML, sayBadge, fruitOfWeek } from './fruit.js';

const app = document.getElementById('app');
const overlay = document.getElementById('overlay');
const toastEl = document.getElementById('toast');

const IDLE_MS = 60 * 1000;        // shared iPad: back to "Who are you?" after 1 idle minute
const ALL_DONE_HOME_MS = 12000;   // ...or 12s after finishing everything
const HOLD_MS = 800;              // press-and-hold to tick a habit, so exploring taps don't count
const UNDO_MS = 8000;
const FOCUS_HOME_MS = 9000;      // after a tick, the board resets soon so kids go and do the next job
const SESSION_MS = 3 * 60 * 1000;   // farm time per visit
const FARM_VISITS_PER_DAY = 2;      // a child can open their farm twice a day on their own
const COIN_SHOW_MS = 8000;          // a child's coins show on the board for a few seconds after they earn, then hide again
const PRAISE = ['Great job!', 'Awesome!', 'You did it!', 'Super star!', 'Way to go!', 'Nice work!', 'Brilliant!', 'Keep it up!', 'Fantastic!', 'Well done!'];

const state = {
  settings: null,
  prefs: { readAloud: {} },
  kidId: null,
  day: null,
  prayer: null,      // prayer screen being shown: { kidId, phase }
  runs: {},          // running prayer timers by kid: { startMs, duration, startedAt }
  undos: {},         // the last tick of each child, undoable for a few seconds
  autoHomeAt: 0,
  lastTouch: Date.now(),
  renderedDay: null,
  reloadPending: false,
  tab: 'morning',    // routine shown on a child's screen: morning | extras | night
  dinners: {},       // dayKey -> when a grown-up tapped "Dinner's finished"
  sum: null,         // coins, streaks and tonight's family race (from family.js)
  farms: null,       // each child's farm (farm.js), saved in IndexedDB
  days: {},          // today's record for every child (the family board shows all three)
  farmKid: null,     // child whose farm screen is open
  coinShow: {},      // child id -> until when their coins show on the board (only just after earning)
};

// ---------- helpers ----------

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const kid = (id = state.kidId) => state.settings.kids.find((k) => k.id === id);
const todayKey = () => clock.dayKey(clock.now(), state.settings.dayStartHour);
// Three routines per child: morning (timed), extra chores (any time), night (timed).
// An extra chore that's already in the child's own routine (Eliana's trash) is left out.
// Night = after-dinner house jobs (allocated by a grown-up), then the bedtime list.
const listFor = (k, r) => (r === 'morning' ? k.habits : r === 'night' ? [...houseJobsFor(state.settings, k), ...k.nightHabits]
  : state.settings.extraChores.filter((c) => ![...k.habits, ...k.nightHabits].some((h) => h.id === c.id)));
const isHouseJob = (h) => /^h-/.test(h?.id || '') || !!h?.house;
const mapFor = (day, r) => (r === 'morning' ? day.done : r === 'night' ? day.nightDone : day.extras);
const doneCount = (k, day, r = 'morning') => listFor(k, r).filter((h) => mapFor(day, r)[h.id]).length;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function loadDay(kidId) {
  const id = `${todayKey()}|${kidId}`;
  let rec = await dayGet(id);
  if (!rec) {
    rec = { id, dayKey: todayKey(), kidId, done: {}, prayerAttempts: [] };
    // Jobs claimed yesterday but not checked yet move to today, so a grown-up can still say yes in the morning.
    const yKey = clock.dayKey(new Date(clock.now().getTime() - 86400000), state.settings.dayStartHour);
    const y = await dayGet(`${yKey}|${kidId}`);
    if (y?.claims && Object.keys(y.claims).length) {
      rec.claims = { ...y.claims };
      y.claims = {};
      await dayPut(y);
      await dayPut(rec);
    }
  }
  rec.log ||= []; // every done/undo, so Stage 2 coins can't be farmed by tick-undo-tick
  rec.drops ||= []; // Fruit Tree: times this child stopped to pray
  rec.fruit ||= []; // Fruit Tree: moments planted
  rec.nightDone ||= {};
  rec.extras ||= {};
  rec.plan = planFor(state.settings, kid(kidId)); // today follows the current jobs; saved with the day
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

// ---------- coins, streaks, dinner race ----------

async function refreshSummary() {
  state.dinners = (await kvGet('dinners')) || {};
  const all = await dayAll();
  state.sum = summarize(state.settings, all, state.dinners, todayKey());
  state.coinAdjust = (await kvGet('coinAdjust')) || []; // coins a grown-up added or took away in the portal
  if (!state.quickLog) state.quickLog = (await kvGet('quickLog')) || []; // 🪙± moments from the front board (quick.js)
  if (!state.practice) state.practice = (await kvGet('practice')) || {}; // 🏋️ practice drills: gold shards per child (portal.js)
  if (!state.farms) state.farms = (await kvGet('farms')) || {};
}
const farm = createFarm({
  state, esc, kid: (id) => kid(id), todayKey: () => todayKey(), kvSet, earned: (id) => (state.sum?.coins[id] || 0) + (state.coinAdjust || []).filter((a) => a.kidId === id).reduce((n, a) => n + a.n, 0),
  speak: (...a) => speak(...a), unlockAudio: () => unlockAudio(), tone: (fn) => tone(fn), pop: (...a) => pop(...a),
  chime: () => chime(), burst: (...a) => burst(...a), toast: (h) => toast(h), renderKid: () => renderKid(), sessionText: () => sessionText(),
  stars: (id) => state.sum?.stars?.[id] || 0, worked: (id) => workedToday(kid(id), state.days?.[id]),
});
// "Your animals work as hard as you do": the farm only produces on days a routine is finished
// (all morning jobs, or all after-dinner jobs) or at least two extra jobs were done.
function workedToday(k, d) {
  if (!k || !d) return false;
  if (doneCount(k, d, 'morning') === listFor(k, 'morning').length) return true;
  if (houseJobsFor(state.settings, k).length && nightFinishedAt(state.settings, k, d)) return true;
  return Object.keys(d.extras || {}).length >= 2;
}
const portal = createPortal({
  state, esc, kid: (id) => kid(id), clock, todayKey: () => todayKey(), loadDay, dayPut, kvSet, refreshSummary: () => refreshSummary(),
  coinsOf: (id) => coinsOf(id), flyCoins: (...a) => flyCoins(...a), speak: (...a) => speak(...a), toast: (h) => toast(h),
  grownUp: (...a) => grownUp(...a), render: () => render(), listFor: (...a) => listFor(...a), doneCount: (...a) => doneCount(...a),
  openFarm: (id) => openFarm(id, { grown: true }),
  endGrace: () => { grownUntil = 0; }, coinTarget: (id) => coinTarget(id),
  version: () => state.appVersion || '', updateNow: () => updateNow(),
  quickSection: (k) => quick.sectionHTML(k), quickHandle: (b) => quick.handle(b), quickWaiting: (id) => quick.waitingFor(id).length,
  openRock: (id) => openRock(id), openRockTest: () => openRockTest(),
  sendToRock: (...a) => sendToRock(...a),
});
const quick = createQuick({
  state, esc, kid: (id) => kid(id), clock, kvGet, kvSet, toast: (h) => toast(h), sheet: (...a) => sheet(...a), grownUp: (...a) => grownUp(...a),
  coinsOf: (id) => coinsOf(id), refreshSummary: () => refreshSummary(), renderKid: () => renderKid(), sendToRock: (...a) => sendToRock(...a),
});

// ---------- Build on the Rock (docs/rock/play.html in live mode, shown in a frame) ----------
// Real life sends it pieces through a small inbox in localStorage (the page collects them):
// gold = a finished prayer timer, silver = a finished morning or night routine (once each a day),
// a gem or wood / hay / stubble = a front-board moment a grown-up kept at night (quick.js).
function sendToRock(kidId, item) {
  try { const key = `rock.inbox.${kidId}`, list = JSON.parse(localStorage.getItem(key) || '[]'); list.push({ t: clock.now().toISOString(), ...item }); localStorage.setItem(key, JSON.stringify(list)); } catch {}
}
// The grown-ups test space: the same game with endless blocks, Fire now and Start again, saved apart from the children.
function openRockTest() {
  state.rockOpen = true;
  state.rockTest = true;
  state.autoHomeAt = 0;
  state.lastTouch = Date.now();
  const el = document.createElement('div');
  el.className = 'rock-frame';
  const q = new URLSearchParams({ live: '1', sandbox: '1', kid: 'grownup-test', name: 'Test space', age: '12' });
  el.innerHTML = `<iframe src="./docs/rock/play.html?${q}" title="Build on the Rock: test space" allow="autoplay"></iframe>`;
  document.body.appendChild(el);
}
function openRock(id) {
  const k = kid(id);
  state.rockTest = false;
  state.rockOpen = true;
  state.kidId = id;
  state.day = state.days[id];
  state.autoHomeAt = 0;
  state.lastTouch = Date.now();
  const el = document.createElement('div');
  el.className = 'rock-frame';
  const q = new URLSearchParams({ live: '1', kid: id, name: k.name, age: String(k.age || 8) });
  el.innerHTML = `<iframe src="./docs/rock/play.html?${q}" title="Build on the Rock" allow="autoplay"></iframe>`;
  document.body.appendChild(el);
}
function closeRock() {
  state.rockOpen = false;
  document.querySelector('.rock-frame')?.remove();
  state.lastTouch = Date.now();
  if (state.rockTest) { state.rockTest = false; return render(); }
  renderKid();
}
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin) return;
  if (e.data?.type === 'rock-activity') state.lastTouch = Date.now();
  if (e.data?.type === 'rock-close') closeRock();
});

// ---------- app version and updates ----------
// The version is the name of the offline copy the iPad is using (sw.js VERSION). It shows small in the corner of
// every screen and in Grown-ups, so "has the update arrived?" is never a guess.
async function showVersion() {
  try {
    const keys = (await caches.keys()).filter((k) => k.startsWith('morning-')).sort();
    state.appVersion = keys.length ? keys[keys.length - 1].replace('morning-', '') : '';
  } catch { state.appVersion = ''; }
  const el = document.getElementById('ver');
  if (el) el.textContent = state.appVersion;
}
// Quietly ask the website whether there's a newer version (when the app comes back to the front, and every half hour).
function checkForUpdate() { navigator.serviceWorker?.getRegistration().then((r) => r?.update()).catch(() => {}); }
// Grown-ups → Update now: throw away the saved copy of the app and load it fresh from the website.
// Only the app's files are replaced. Jobs, coins and farms are stored separately and are not touched.
async function updateNow() {
  try {
    const res = await fetch(`./sw.js?now=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('offline');
  } catch { return toast('📶 No internet right now, so the app can\'t update. Check the Wi-Fi and try again.'); }
  toast('🔄 Getting the newest version…');
  try {
    const r = await navigator.serviceWorker?.getRegistration();
    await r?.unregister();
    for (const k of await caches.keys()) await caches.delete(k);
  } catch {}
  location.reload();
}
// Spendable coins: earned from jobs, plus farm sales, minus farm spending.
const coinsOf = (id) => (state.sum ? farm.balance(id) : 0);
const streakOf = (id) => state.sum?.streak[id] || 0;
const dinnerToday = () => state.dinners[todayKey()];

// ---------- farm codes and farm time ----------
// Chores need no sign-in: the family board shows everyone. A child's own 4-digit code opens their farm
// (where coins get spent) once their routine is done: twice a day, 3 minutes each.
// A grown-up can open anyone's farm any time from the Grown-ups portal.

const readJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
const writeJSON = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };
const sessions = readJSON('sessions', {});
const nowMs = () => clock.now().getTime();
const visitsLeft = (id) => { const f = farm.farmOf(id); return FARM_VISITS_PER_DAY - (f.visitDay === todayKey() ? f.visits || 0 : 0); };
const sessionLeft = (id) => Math.max(0, SESSION_MS - (sessions[id]?.used || 0));
const sessionText = () => (sessionPaused() ? '⏸ Paused' : `${state.farmByGrown ? '👨‍👩‍👧 ' : ''}⏳ ${clock.fmtDuration(sessionLeft(state.farmKid))}`);
// Farm time doesn't tick while praying. A farm a grown-up opened has 3 minutes too (18 Nov 2026).
const sessionPaused = () => !!state.prayer;

function beginSession(id) {
  const s = (sessions[id] ||= {});
  Object.assign(s, { used: 0, warned: false, lastSeen: nowMs() });
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
  // (two chips while the painted farm is full screen: the header's and the one in the corner)
  for (const chip of app.querySelectorAll('.session-chip')) {
    chip.textContent = sessionText();
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
  writeJSON('sessions', sessions);
  timesUpShown = true;
  const el = document.createElement('div');
  el.className = 'all-done-moment times-up';
  el.style.setProperty('--kid', k.color);
  const more = state.farmByGrown ? 'A grown-up can open it again with the PIN.' : visitsLeft(k.id) ? 'You have one more farm visit today.' : 'See your animals again tomorrow!';
  el.innerHTML = `<div><div class="big-emoji">⏰</div><h2>Farm time's up, ${esc(k.name)}!</h2><p>${more}</p></div>`;
  document.body.appendChild(el);
  speak(`Farm time's up, ${k.name}! ${more}`, true);
  setTimeout(() => { el.remove(); timesUpShown = false; goHome(); }, 4000);
}

// grace = true lets one grown-up action follow another within a minute without the PIN again.
// The portal never uses it (it always asks), and closing the portal or the reminders sheet ends it.
let grownUntil = 0;

async function grownUp(note, grace = false) {
  if (grace && Date.now() < grownUntil) return true;
  // Same grown-up PIN as the mine uses (GROWN_PIN in config.js).
  const ok = !!(await askPin({ title: 'Enter the grown-up PIN', note: `👨‍👩‍👧 Grown-ups only · ${note}`, expect: GROWN_PIN, length: GROWN_PIN.length }));
  if (ok && grace) grownUntil = Date.now() + 60000;
  return ok;
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

// The farm opens once the child's current routine is done (any time during the day), for 3 minutes.
// Morning: once the morning jobs are done. Daytime: the morning done, or a confirmed extra job.
// Night: closed. Night ends with "🌙 Going up!", not the farm.
function farmLocked(k, d) {
  const r = defaultTab();
  const morningDone = doneCount(k, d, 'morning') === listFor(k, 'morning').length;
  if (r === 'morning') return !morningDone;
  if (r === 'extras') return !morningDone && !Object.keys(d.extras).length;
  return true;
}
const farmLockText = () => {
  const r = defaultTab();
  return r === 'night' ? '🌙 Farm tomorrow' : r === 'extras' ? '🔒 Farm after a job' : '🔒 Farm after jobs';
};

async function openFarm(id, { grown = false } = {}) {
  unlockAudio();
  const k = kid(id);
  if (grown) return enterFarm(k, true);
  if (farmLocked(k, state.days[id])) {
    if (readAloudOn(id)) speak(`Finish your jobs first, ${k.name}, then your farm opens.`, true);
    return toast(`🔒 Finish your jobs first, then your farm opens.`);
  }
  if (visitsLeft(id) <= 0) {
    if (readAloudOn(id)) speak(`That's your farm visits for today, ${k.name}. See your animals tomorrow!`, true);
    return toast('🌙 No more farm visits today. See your animals tomorrow!');
  }
  if (!(await askKidCode(id))) return;
  const f = farm.farmOf(id);
  if (f.visitDay !== todayKey()) { f.visitDay = todayKey(); f.visits = 0; }
  f.visits++;
  kvSet('farms', state.farms);
  enterFarm(k, false);
}

// A grown-up opening the farm gets 3 minutes too (then the PIN again), and it doesn't use up a visit.
function enterFarm(k, grown) {
  const id = k.id;
  state.farmByGrown = grown;
  beginSession(id);
  state.farmKid = id;
  state.kidId = id;
  state.day = state.days[id];
  state.autoHomeAt = 0;
  speak(`${k.name}'s farm! You have 3 minutes.`);
  renderKid();
  farm.opened(k);
}

// ---------- reminders: a grown-up taps 🔔 when they had to ask a child ----------
// The first ask in a routine (morning or night) is −20. More asks in the same routine are noted but cost nothing
// more, and a day never goes below zero (family.js). The routine comes from the time of day, using the same
// windows as the board (morning until 11am, night from an hour before night opens), so a 1pm ask is never "night".
const reminderRoutine = () => { const t = defaultTab(); return t === 'extras' ? null : t; };
const WHO_KEY = 'remind.who'; // the last grown-up who asked (Dad or Mum), remembered on this iPad
const whoAsked = () => { try { return localStorage.getItem(WHO_KEY) || 'Dad'; } catch { return 'Dad'; } };
const askedIn = (d, r) => (d?.reminders || []).find((x) => x.routine === r);

async function openReminders() {
  if (!(await grownUp('reminders'))) return;
  const el = document.createElement('div');
  el.className = 'farm-ov reminders-ov';
  document.body.appendChild(el);
  const draw = async () => {
    const r = reminderRoutine();
    const days = await Promise.all(state.settings.kids.map((k) => loadDay(k.id)));
    days.forEach((d) => { state.days[d.kidId] = d; });
    const who = whoAsked();
    el.innerHTML = `<div class="farm-sheet">
      <h2>🔔 Had to ask someone?</h2>
      ${!r ? '<p>🔔 is for the morning and night routines. Come back then.</p>' : `
      <p>The first ask this ${r} is −🪙 ${-COINS.asked}. Asking again this ${r} costs nothing more. A day never goes below zero.</p>
      <div class="remind-who">Who asked? ${['Dad', 'Mum'].map((w) => `<button class="farm-btn small ${w === who ? 'sellhen' : ''}" data-who="${w}">${w === 'Dad' ? '👨' : '👩'} ${w}</button>`).join('')}</div>
      ${state.settings.kids.map((k, i) => {
        const d = days[i];
        const first = askedIn(d, r);
        const n = (d.reminders || []).filter((x) => x.routine === r).length;
        const open = listFor(k, r).filter((h) => !mapFor(d, r)[h.id]);
        const jobs = open.length ? open.map((h) => `<button class="farm-btn remind" data-remind="${k.id}" data-job="${h.id}" aria-label="Asked about ${esc(h.name)}">${h.icon}</button>`).join('')
          : `<button class="farm-btn remind" data-remind="${k.id}" data-job="">🔔 Asked</button>`;
        return `<div class="remind-row" style="--kid:${k.color}">
          <span class="face">${k.avatar}</span><b>${esc(k.name)}</b>
          <span class="remind-count">${first ? `🔔 ${n} · ${first.icon || '🔔'} −🪙 ${-COINS.asked}` : '🔔 0'}</span>
          <span class="remind-jobs">${first ? '' : '<small>Asked about:</small>'}${jobs}</span>
          <button class="farm-btn small" data-unremind="${k.id}" ${n ? '' : 'disabled'} aria-label="Undo the last ask">↩️</button>
        </div>`;
      }).join('')}`}
      <button class="farm-btn" data-close>Done</button>
    </div>`;
  };
  el.addEventListener('click', async (e) => {
    if (e.target.closest('[data-close]')) { el.remove(); grownUntil = 0; return render(); }
    const w = e.target.closest('[data-who]');
    if (w) { try { localStorage.setItem(WHO_KEY, w.dataset.who); } catch {} return draw(); }
    const add = e.target.closest('[data-remind]');
    const undoBtn = e.target.closest('[data-unremind]');
    const id = add?.dataset.remind || undoBtn?.dataset.unremind;
    const r = reminderRoutine();
    if (!id || !r) return;
    const k = kid(id);
    const d = await loadDay(id);
    d.reminders ||= [];
    if (add) {
      const h = listFor(k, r).find((x) => x.id === add.dataset.job);
      const first = !askedIn(d, r);
      d.reminders.push({ t: clock.now().toISOString(), routine: r, job: h?.id || null, icon: h?.icon || '🔔', name: h?.name || '', who: whoAsked() });
      // One grace line for the child, said once (the first ask in this routine).
      if (first) speak(`${k.name}, ${whoAsked()} had to ask${h ? ` about ${h.name}` : ''}. That's OK. Tomorrow is a fresh start.`, true);
    } else {
      // Take back the last ask in this routine.
      const i = d.reminders.map((x) => x.routine).lastIndexOf(r);
      if (i >= 0) d.reminders.splice(i, 1);
    }
    await dayPut(d);
    await refreshSummary();
    draw();
  });
  await draw();
}

// ---------- extra jobs: a child claims one, a grown-up confirms it ----------

function sheet(html, onClick) {
  const el = document.createElement('div');
  el.className = 'farm-ov';
  el.innerHTML = `<div class="farm-sheet">${html}</div>`;
  document.body.appendChild(el);
  el.addEventListener('click', (e) => onClick(e, el));
  return el;
}

// Big icons for every extra job; tapping one asks "Did you finish it?".
function extrasSheet() {
  const k = kid();
  const d = state.day;
  const claims = d.claims || {};
  const list = listFor(k, 'extras').filter((h) => !/^other/.test(h.id));
  speak(`${k.name}, which job did you do?`);
  sheet(`<h2>⭐ Which job did you do, ${esc(k.name)}?</h2>
    <div class="job-grid">${list.map((h) => `<button class="job-pick ${d.extras[h.id] ? 'done' : claims[h.id] ? 'claimed' : ''}" data-pick="${h.id}" ${d.extras[h.id] ? 'disabled' : ''}>
      <span>${h.icon}</span><b>${esc(h.name)}</b><small>${d.extras[h.id] ? '✓ Done' : claims[h.id] ? '⏳ Checking' : `🪙 ${h.coins || 2}`}</small></button>`).join('')}</div>
    <button class="farm-btn small" data-c="close">Close</button>`, (e, el) => {
    if (e.target.closest('[data-c="close"]')) return el.remove();
    const p = e.target.closest('[data-pick]');
    if (!p || p.disabled) return;
    el.remove();
    claimJob(p.dataset.pick);
  });
}

async function claimJob(jobId) {
  unlockAudio();
  const k = kid();
  const d = state.day;
  const h = listFor(k, 'extras').find((x) => x.id === jobId);
  if (!h || d.extras[h.id]) return;
  speak(`${h.name}. Did you finish it?`);
  sheet(`<div class="reveal-animal">${h.icon}</div><h2>${esc(h.name)}</h2><p>Did you finish it? A grown-up checks, then you get 🪙 ${h.coins || 2}.</p>
    <div class="claim-btns">
      <button class="farm-btn feed" data-c="now">✋ Yes! Grown-up, check now</button>
      <button class="farm-btn" data-c="later">⏳ Yes, check it later</button>
      <button class="farm-btn small" data-c="no">Not yet</button>
    </div>`, async (e, el) => {
    const c = e.target.closest('[data-c]')?.dataset.c;
    if (!c) return;
    el.remove();
    if (c === 'no') return;
    (d.claims ||= {})[h.id] = clock.now().toISOString();
    await dayPut(d);
    if (c === 'now' && (await grownUp(`check ${k.name}'s job`))) {
      useKid(k.id);
      await portal.confirmClaim(k.id, h.id);
      return;
    }
    speak(`Great! Your ${h.coins || 2} coins are waiting. A grown-up will check it soon.`);
    toast(`⏳ 🪙 ${h.coins || 2} waiting: a grown-up checks your job, then the coins are yours.`);
    renderKid();
  });
}

// ---------- breath prayers: one guided breath, held on the board ----------
// Hold 🙏 for one slow breath (about 5 seconds). The button swells: "Breathe in… Jesus loves me… breathe out…",
// then a chime and "Amen!". Up to 3 a day. Prayer is time with God, not a way to earn: no coins.
const BREATH_WORDS = [[0, 'Breathe in…'], [0.4, 'Jesus loves me…'], [0.7, 'breathe out…']];

function startBreath(btn, id, pointerId) {
  unlockAudio();
  btn.classList.add('breathing');
  btn.style.setProperty('--breath-ms', `${BREATH_MS}ms`);
  const hold = { kind: 'breath', kidId: id, el: btn, started: Date.now() };
  const say = (words) => { const l = holdEl(hold)?.querySelector('small'); if (l) l.textContent = words; };
  say(BREATH_WORDS[0][1]);
  hold.timers = BREATH_WORDS.slice(1).map(([at, words]) => setTimeout(() => say(words), at * BREATH_MS));
  if (readAloudOn(id)) speakSlow('Breathe in. Jesus loves me. Breathe out.');
  hold.timer = setTimeout(() => { endHold(pointerId, false); logBreathPrayer(id); }, BREATH_MS);
  holds.set(pointerId, hold);
}

async function logBreathPrayer(id) {
  const d = state.days[id];
  if ((d.breaths || 0) >= BREATHS_PER_DAY) return;
  d.breaths = (d.breaths || 0) + 1;
  await dayPut(d);
  chime();
  if (readAloudOn(id)) speak('Amen!', true);
  const btn = app.querySelector(`[data-col="${id}"] .breath-btn`);
  if (btn) { btn.classList.add('amen'); const l = btn.querySelector('small'); if (l) l.textContent = 'Amen!'; }
  setTimeout(() => { if (!state.farmKid && !state.prayer) renderKid(); }, 1800);
}

// ---------- 🙏 "I prayed" (20 Nov 2026): replaces the breath-prayer Hold button ----------
// A child taps 🙏 after praying and says what kind of prayer it was. No coins (prayer isn't a way to earn),
// but it sends Build on the Rock a piece: thank you = gold, for someone = silver, sorry / help me grow = a precious
// stone in the colour of their fruit this week. Up to 10 a day, at least 30 minutes apart. No grown-up check.
const PRAYED_PER_DAY = 10;
const PRAYED_GAP_MS = 30 * 60000;
const PRAYER_KINDS = [
  { id: 'thanks', icon: '🙌', label: 'Thank you, God', rock: 'gold', piece: 'Gold', rockLabel: 'Thank-you prayer' },
  { id: 'someone', icon: '🤲', label: 'For someone', rock: 'silver', piece: 'Silver', rockLabel: 'Prayed for someone' },
  { id: 'grow', icon: '💖', label: 'Sorry / help me grow', rock: 'gem', piece: 'A precious stone', rockLabel: 'Sorry / help me grow prayer' },
];
const GEM_OF_FRUIT = { love: 'l', joy: 'j', peace: 'p', patience: 't', kindness: 'k', goodness: 'b', faithfulness: 'f', gentleness: 'e', selfcontrol: 'r' };
const prayedList = (d) => d?.prayed || [];
// ms until this child may tap "I prayed" again (0 = now), or null when today's 10 are used.
function prayedWait(d) {
  const list = prayedList(d);
  if (list.length >= PRAYED_PER_DAY) return null;
  const last = list.length ? new Date(list[list.length - 1].t).getTime() : 0;
  return Math.max(0, last + PRAYED_GAP_MS - nowMs());
}
function prayedBtnHTML(d) {
  const wait = prayedWait(d), n = prayedList(d).length;
  const sub = wait === null ? '💛 Amen' : wait > 0 ? `in ${Math.ceil(wait / 60000)} min` : n ? `${n} today` : 'I prayed';
  return `<button class="pray-btn ${wait === 0 ? '' : 'resting'}" data-action="i-prayed" aria-label="I prayed">🙏<small>${sub}</small></button>`;
}
function openPrayed(id) {
  const k = kid(id), d = state.days[id];
  const wait = prayedWait(d);
  if (wait === null) { speakFor(id, `Ten prayers today, ${k.name}. Amen!`); return toast('💛 Ten prayers today. Amen!'); }
  if (wait > 0) {
    const at = clock.fmtTime(new Date(nowMs() + wait));
    speakFor(id, `You can tell me again at ${at}. Keep talking to God any time!`);
    return toast(`🙏 Tell me again at ${at}. You can talk to God any time!`);
  }
  unlockAudio();
  speakFor(id, `What did you pray, ${k.name}?`);
  const el = sheet(`<h2>🙏 What did you pray, ${esc(k.name)}?</h2>
    <div class="pray-kinds">${PRAYER_KINDS.map((p) => `<button data-kind="${p.id}"><span>${p.icon}</span><b>${esc(p.label)}</b><small>${p.piece} for your building</small></button>`).join('')}</div>
    <button class="farm-btn small" data-c="close">Not now</button>`, async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.c) return el.remove();
    const p = PRAYER_KINDS.find((x) => x.id === b.dataset.kind);
    if (!p || prayedWait(state.days[id]) !== 0) return el.remove();
    el.remove();
    const day = state.days[id];
    const t = clock.now().toISOString();
    (day.prayed ||= []).push({ t, kind: p.id });
    day.log.push({ t, habit: 'prayed', action: p.id });
    await dayPut(day);
    sendToRock(id, { kind: p.rock, label: p.rockLabel, from: 'prayer', ...(p.rock === 'gem' ? { fruit: GEM_OF_FRUIT[fruitOfWeek(id)] || 'l' } : {}) });
    chime();
    burst(app.querySelector(`[data-col="${id}"] .pray-btn`), 14);
    speakFor(id, `Amen! ${p.piece} for your building.`);
    toast(`🙏 Amen! ${p.icon} ${p.piece} for ${esc(k.name)}'s building`);
    renderKid();
  });
}

// ---------- "🌙 Going up!": the last iPad tap of the night ----------
// After the after-dinner jobs, each child taps Going up. It runs the night fruit question (js/fruit.js),
// then says goodnight. Bath, teeth and bed happen upstairs; next morning a grown-up says how bedtime went.
async function goingUp(id) {
  unlockAudio();
  const k = kid(id);
  const d = state.days[id];
  if (d.wentUp) return;
  await runNightFruit(k); // resolves { done } when the child finishes or closes it; goodnight either way
  d.wentUp = clock.now().toISOString();
  d.log.push({ t: d.wentUp, routine: 'night', action: 'going-up' });
  await dayPut(d);
  const el = document.createElement('div');
  el.className = 'all-done-moment';
  el.style.setProperty('--kid', k.color);
  el.innerHTML = `<div><div class="big-emoji">🌙</div><h2>Goodnight, ${esc(k.name)}!</h2><p>Up you go. Sleep well. God is with you.</p></div>`;
  document.body.appendChild(el);
  speak(`Goodnight, ${k.name}! Up you go. Sleep well. God is with you.`, true);
  setTimeout(() => burst(null, 24), 150);
  el.addEventListener('click', () => el.remove());
  setTimeout(() => el.remove(), 4000);
  goHome();
}

// ---------- "Last night 🛏️": next morning a grown-up says how bedtime went ----------
// One PIN, then a choice for each child who hasn't had one yet today. Pays the bedtime bonus (family.js COINS).
const BED_CHOICES = [['stayed', '🛏️ Stayed in bed'], ['once', '🚶 Got up once'], ['not', '🌙 Not this time']];
const lastNightDue = (d) => defaultTab() === 'morning' && !d.lastNight;

async function openLastNight(firstId) {
  if (!(await grownUp('how bedtime went'))) return;
  const order = [firstId, ...state.settings.kids.map((k) => k.id).filter((id) => id !== firstId)];
  sheet(`<h2>🛏️ Last night</h2><p>Did they stay in bed?</p>
    ${order.filter((id) => lastNightDue(state.days[id])).map((id) => { const k = kid(id); return `<div class="remind-row bed-row" style="--kid:${k.color}">
      <span class="face">${k.avatar}</span><b>${esc(k.name)}</b>
      <span class="remind-jobs">${BED_CHOICES.map(([how, label]) => `<button class="farm-btn small" data-bed="${how}" data-kid="${id}">${label} <small>🪙 ${bedtimeBonus(how)}</small></button>`).join('')}</span></div>`; }).join('')}
    <button class="farm-btn small" data-c="close">Done</button>`, async (e, el) => {
    if (e.target.closest('[data-c="close"]')) return el.remove();
    const b = e.target.closest('[data-bed]');
    if (!b) return;
    const id = b.dataset.kid;
    const d = state.days[id];
    if (d.lastNight) return;
    const before = state.sum;
    d.lastNight = { how: b.dataset.bed, t: clock.now().toISOString() };
    await dayPut(d);
    await refreshSummary();
    b.closest('.remind-row').remove();
    if (!el.querySelector('[data-bed]')) el.remove();
    renderKid();
    coinNews(before, id);
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
  const fin = nightFinishedAt(state.settings, k, d);
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
  speechSynthesis.speak(utterance(text));
}
// Said slowly and calmly (the breath prayer).
function speakSlow(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance(text, 0.7));
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

// The morning bar: one line ("Start by 7:15 · if we have to ask, −20") and a sun that slides down to 7:15,
// so children who can't read the clock can see how long is left. (The night bar is hidden by styles.css.)
const startByText = () => clock.fmtTime(clock.atTime(state.settings.startBy || '07:15', state.settings.dayStartHour)).replace(/am$/, '');
function windowBarHTML(r = 'morning') {
  const s = state.settings;
  if (r === 'morning') {
    const now = clock.now();
    const open = clock.atTime(s.windowOpen, s.dayStartHour);
    const by = clock.atTime(s.startBy || '07:15', s.dayStartHour);
    const left = now < open ? 1 : now < by ? (by - now) / (by - open) : 0;
    const phase = now < open ? 'before' : now < by ? 'open' : 'closed';
    const pct = (left * 100).toFixed(1);
    const fill = phase === 'open' ? `hsl(${Math.round(120 * left)}, 80%, 50%)` : '';
    const label = phase === 'closed' ? '🌞 Keep going!' : `Start by ${startByText()}`;
    return `
    <div class="window-bar ${phase}" data-routine="morning" role="progressbar" aria-valuenow="${Math.round(left * 100)}" aria-valuemin="0" aria-valuemax="100">
      <div class="window-fill" style="width:${pct}%;${fill ? `background:${fill}` : ''}"></div>
      ${phase === 'closed' ? '' : `<span class="sun-edge" style="left:clamp(28px,${pct}%,calc(100% - 28px))">☀️</span>`}
      <div class="window-label">${label}</div>
    </div>`;
  }
  const w = windowInfo(r);
  const label = w.phase === 'before' ? `🌙 Night routine starts at ${clock.fmtTime(w.open)}` : w.phase === 'open' ? 'Night jobs, then Going up!' : '😴 Bedtime. Sleep well!';
  return `
    <div class="window-bar ${w.phase} night" data-routine="${r}">
      <div class="window-fill" style="width:${(w.left * 100).toFixed(1)}%"></div>
      <div class="window-label">${label}</div>
    </div>`;
}

function clockHTML() {
  return `<div class="clock">${clock.fmtTime(clock.now())}${clock.isFaked() ? ' <span class="fake">DEV</span>' : ''}</div>`;
}

function tileHTML(k, h, d, nudgeId, r) {
  const at = mapFor(d, r)[h.id];
  if (h.type === 'practice' && r === 'morning') return practiceTileHTML(k, h, d, at, nudgeId);
  const open = clock.atTime(state.settings.windowOpen, state.settings.dayStartHour);
  if (at) {
    const early = r === 'morning' && new Date(at) < open;
    const u = state.undos[k.id];
    const undo = u?.habitId === h.id && u?.routine === r;
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
        <span class="tile-coin">${coinTag(tileCoins(h, r, k, d))}</span>
      </div>`;
  }
  return `
    <div class="tile ${nudgeId === h.id ? 'nudge' : ''}" role="button" data-hold data-habit="${h.id}">
      <span class="tile-icon">${h.icon}</span>
      <span class="tile-name">${esc(h.name)}</span>
      <span class="tile-sub">👇 Hold${r === 'extras' ? '' : ' when done'}</span>
      <span class="tile-coin">${coinTag(tileCoins(h, r, k, d))}</span>
    </div>`;
}

// What a job is worth right now: morning jobs pay more before the window closes; extra chores by effort.
const extrasCoinsToday = (k, d) => Math.min(EXTRAS_DAY_CAP, listFor(k, 'extras').filter((c) => d.extras[c.id]).reduce((a, c) => a + (c.coins || 2), 0));

// (k and d are the column's own child and day, not whoever touched the iPad last.)
function tileCoins(h, r, k, d) {
  if (r === 'extras') return extrasCoinsToday(k, d) >= EXTRAS_DAY_CAP ? '💛' : h.coins || 2;
  if (r === 'night') return h.coins || COINS.nightJob;
  if (!morningInTime(d)) return '⭐';
  return windowInfo('morning').phase === 'closed' ? COINS.morningLate : COINS.morningOnTime;
}
const coinTag = (c) => (typeof c === 'number' ? `🪙 ${c}` : c);

// Is this morning still worth coins? Yes if it started by 7:15, or hasn't started and it's not 7:15 yet.
// (A Start press counts if a job follows within 20 minutes, like family.js morningStart.)
function morningInTime(d) {
  if (!d) return true;
  const by = startByMs(state.settings, d);
  const began = morningStart(d) ?? (d.startedAt && nowMs() - new Date(d.startedAt).getTime() <= 20 * 60000 ? new Date(d.startedAt).getTime() : nowMs());
  return began <= by;
}

// A peek at the child's farm, with a button to go there.
const nextJob = (k, d, r) => listFor(k, r).find((h) => !mapFor(d, r)[h.id]);

// Under "Ready, set, go!": before 7:15 the rule, after it a kind word (jobs still earn stars).
function earlyOffer() {
  return clock.now() <= clock.atTime(state.settings.startBy || '07:15', state.settings.dayStartHour)
    ? '' : 'Jobs still earn ⭐ stars';
}

// On a child's own column, when a grown-up had to ask this routine: which job, and a grace line.
function askedNoteHTML(d, r) {
  const a = askedIn(d, r);
  if (!a) return '';
  return `<div class="asked-note">🔔 ${esc(a.who || 'A grown-up')} had to ask${a.job ? ` about ${a.icon}` : ''}<small>That's OK. Tomorrow is a fresh start.</small></div>`;
}

// The family board: every child's next job side by side. No sign-in for chores: walk up, hold your job,
// walk away. Each child's farm opens with their code once their jobs are done.
// To keep it fair, the board never shows coin totals, streaks or 🔔 counts side by side. A child's coins
// show for a few seconds just after they earn (and on their own farm screen); 🔔 counts are in the portal.
function columnHTML(k, d, r) {
  const list = listFor(k, r);
  const n = doneCount(k, d, r);
  const total = list.length;
  const all = r !== 'extras' && n === total;
  const started = firstDoneTime(d);
  const notStarted = r === 'morning' && !started && !state.runs[k.id];
  const hasHouse = houseJobsFor(state.settings, k).length > 0;
  const nightGate = r === 'night' && hasHouse && !d.nightStartedAt && !nightFinishedAt(state.settings, k, d) && n === 0;
  const offer = nightGate && dinnerToday() ? startOffer(dinnerToday(), nowMs()) : null;
  const next = r === 'extras' ? null : nextJob(k, d, r);
  let main;
  if (notStarted) {
    main = `<button class="go-btn col-go" data-action="go">
      <span class="lights"><i class="r"></i><i class="y"></i><i class="g"></i></span>
      <span class="go-text">Ready, set, go!</span><span class="go-sub">${earlyOffer()}</span></button>`;
  } else if (nightGate) {
    main = `<button class="go-btn night-go col-go" data-action="start-night">
      <span class="go-icon">🌙</span><span class="go-text">Start night chores!</span>
      <span class="go-sub">${houseJobsFor(state.settings, k).map((j) => j.icon).join(' ')} · under 20 min = 🪙 ${COINS.under40 + COINS.under20}</span>
      ${offer ? `<span class="go-sub" data-offer="${dinnerToday()}">${offer.coins ? `Start now for 🪙 ${offer.coins}` : "Let's all finish together!"}</span>` : ''}</button>`;
  } else if (r === 'extras') {
    const done = list.filter((h) => d.extras[h.id]);
    const claims = d.claims || {};
    main = `<div class="col-note">⭐ Jobs you can do · tap one when it's done</div>
      <div class="icon-grid">${list.filter((h) => !d.extras[h.id] && !/^other/.test(h.id)).map((h) => `<button class="icon-job ${claims[h.id] ? 'claimed' : ''}" data-action="claim" data-job="${h.id}" aria-label="${esc(h.name)}">${h.icon}<small>${claims[h.id] ? '⏳' : `🪙${h.coins || 2}`}</small></button>`).join('')}</div>
      ${done.length ? `<div class="done-today">Done today: ${done.map((h) => h.icon).join(' ')}</div>` : ''}`;
  } else if (all && r === 'night') {
    // Night jobs done (or none tonight): one big "Going up!", the last iPad tap of the day.
    main = d.wentUp
      ? '<div class="all-done-card"><div class="big">🌙</div><h2>Gone up. Sleep tight!</h2></div>'
      : `${d.nightStartedAt && total ? nightTimerHTML(k, d) : ''}
        <button class="going-up" data-action="going-up"><span class="gu-moon">🌙</span><b>Going up!</b><small>${total ? 'Night jobs done! ' : ''}My last tap tonight</small></button>`;
  } else if (all) {
    // Keyboard may still be counting bonus minutes after everything else is done.
    const playing = r === 'morning' && list.find((h) => h.type === 'practice' && d.practice?.[h.id]?.start);
    main = playing ? tileHTML(k, playing, d, null, r).replace('class="tile', 'class="tile next-tile')
      : '<div class="all-done-card"><div class="big">🏆</div><h2>All done!</h2></div>';
  } else {
    // A running 🎤/🎹 timer takes the big tile, so the child can see their minutes.
    const playing = r === 'morning' && list.find((h) => h.type === 'practice' && d.practice?.[h.id]?.start);
    const big = playing || next;
    main = `${r === 'night' && d.nightStartedAt ? nightTimerHTML(k, d) : ''}
      ${r === 'night' ? '<div class="part-label">🍽️ After-dinner job</div>' : ''}
      ${tileHTML(k, big, d, null, r).replace('class="tile', 'class="tile next-tile')}
      <div class="job-row">${list.map((h) => tileHTML(k, h, d, null, r).replace('class="tile', `class="tile mini-tile ${h === big ? 'is-next' : ''}`)).join('')}</div>`;
  }
  if (r !== 'extras') main += askedNoteHTML(d, r);
  const left = visitsLeft(k.id);
  const farmBtn = farmLocked(k, d)
    ? `<div class="farm-lock">${farmLockText()}</div>`
    : left > 0
      ? `<button class="farm-open" data-action="open-farm">🐔 My farm <small>${left} left today</small></button>`
      : '<div class="farm-lock">🌙 Farm again tomorrow</div>';
  // 🍓 Fruit time: only after this child's "Ready, set, go!" (it never blocks the start), with a free "Not today".
  // (At night the fruit question is part of "Going up!".)
  const fruitRow = r === 'morning' && !notStarted ? fruitTileHTML(k) : '';
  const breaths = d.breaths || 0;
  const showCoins = (state.coinShow[k.id] || 0) > Date.now();
  return `
    <div class="col" data-col="${k.id}" style="--kid:${k.color}">
      <div class="col-head">
        <span class="face">${k.avatar || '🙂'}</span><b>${esc(k.name)}</b>
        ${fruitBadgeHTML(k)}
        ${parentCoinsHTML(k, d)}
        ${showCoins ? coinChipHTML(k.id) : ''}
      </div>
      <div class="col-main">${main}</div>
      ${fruitRow}
      ${r === 'extras' ? `<div class="col-farm-line">${farm.tallyHTML(k.id)}<span class="col-goal">${farm.goalText(k.id, coinsOf(k.id))}</span></div>` : ''}
      <div class="col-foot">
        <button class="star-btn" data-action="extras-sheet" aria-label="Extra jobs">⭐</button>
        ${prayedBtnHTML(d)}
        ${farmBtn}
      </div>
    </div>`;
}

// A child's coins, shown on their column only for a few seconds after they earn.
const coinChipHTML = (id) => `<span class="col-coins" data-coins-until="${state.coinShow[id] || 0}">🪙 <span class="coin-num">${coinsOf(id)}</span></span>`;

// Show a child's coins for a few seconds and return the number to fly coins into (null on other screens).
function coinTarget(id) {
  state.coinShow[id] = Date.now() + COIN_SHOW_MS;
  const head = app.querySelector(`[data-col="${id}"] .col-head`);
  if (head) {
    let chip = head.querySelector('.col-coins');
    if (!chip) { head.insertAdjacentHTML('beforeend', coinChipHTML(id)); chip = head.querySelector('.col-coins'); }
    chip.dataset.coinsUntil = String(state.coinShow[id]);
    return chip.querySelector('.coin-num');
  }
  return null;
}

const pendingCount = () => state.settings.kids.reduce((n, k) => n + Object.keys(state.days[k.id]?.claims || {}).length, 0) + quick.waitingAll().length;

// The grown-ups' coin button on each column (no PIN): tap to add or take off coins. It shows the points
// waiting for a grown-up's check (jobs the child says they did, and front-board moments), so they're visible at a glance.
function parentCoinsHTML(k, d) {
  const claimed = Object.keys(d.claims || {}).reduce((t, id) => t + (listFor(k, 'extras').find((c) => c.id === id)?.coins || 2), 0);
  const w = quick.waitingFor(k.id);
  const plus = claimed + w.filter((q) => q.n > 0).reduce((a, q) => a + q.n, 0);
  const minus = w.filter((q) => q.n < 0).reduce((a, q) => a - q.n, 0);
  return `<button class="col-parent ${plus || minus ? 'has' : ''}" data-action="quick-add" aria-label="Grown-ups: add or take off coins">
    ${plus || minus ? `${plus ? `<b class="up">+${plus}</b>` : ''}${minus ? `<b class="down">−${minus}</b>` : ''}` : '🪙 ±'}</button>`;
}

function renderBoard() {
  const r = defaultTab();
  const dinnerBtn = homeRoutine() === 'night' && clock.now().getHours() >= 16 && !dinnerToday();
  app.innerHTML = `
    <section class="screen board tab-${r}">
      <header class="top">
        <h1>${r === 'morning' ? '☀️ Morning jobs' : r === 'night' ? '🌙 Night jobs' : '⭐ Extra jobs'}</h1>
        ${r === 'morning' && state.settings.kids.some((k) => lastNightDue(state.days[k.id])) ? '<button class="btn last-night-btn" data-action="last-night">🛏️ Last night</button>' : ''}
        ${dinnerBtn ? '<button class="btn dinner-btn" data-action="dinner">🍽️ Dinner done</button>' : ''}
        <button class="btn extras-btn ${dinnerBtn ? '' : 'alone'}" data-action="portal" aria-label="Grown-ups">👨‍👩‍👧 Grown-ups${pendingCount() ? ` <span class="badge">${pendingCount()}</span>` : ''}</button>
        <button class="btn remind-btn" data-action="reminders" aria-label="Reminders (grown-ups)">🔔</button>
        ${clockHTML()}
      </header>
      ${r === 'extras' ? '' : windowBarHTML(r)}
      ${raceBarHTML()}
      <div class="board-cols">${state.settings.kids.map((k) => columnHTML(k, state.days[k.id], r)).join('')}</div>
    </section>`;
  showHolds();
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
          <div class="coin-chip">🪙 ${coinsOf(k.id)} · ⭐ ${farm.starsLeft(k.id)} · 🔥 ${streakOf(k.id)}</div>
        </div>
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

// "Judah, it's go time!" at 7:00 and 7:10 (15 and 5 minutes before the start-by time), once each,
// for every child who hasn't started their morning yet. Remembered per day, so a reload doesn't repeat it.
function goTimeVoice() {
  if (defaultTab() !== 'morning' || state.farmKid) return;
  const by = clock.atTime(state.settings.startBy || '07:15', state.settings.dayStartHour).getTime();
  const now = nowMs();
  const said = readJSON('goTime', {});
  if (said.day !== todayKey()) Object.assign(said, { day: todayKey(), done: [] });
  for (const before of [15, 5]) {
    const at = by - before * 60000;
    if (now < at || now > at + 5 * 60000 || said.done.includes(before)) continue;
    said.done.push(before);
    writeJSON('goTime', said);
    const waiting = state.settings.kids.filter((k) => state.days[k.id] && !firstDoneTime(state.days[k.id]) && !state.runs[k.id]);
    if (!waiting.length) continue;
    const names = waiting.map((k) => k.name);
    const who = names.length === 1 ? names[0] : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
    speak(`${who}, it's go time!`, true);
    toast(`⏰ ${esc(who)}, it's go time!`);
  }
}

// Light refresh every second: clock, window bar, idle timeout, 3am rollover.
function tick() {
  if (!state.settings) return; // still starting up
  if (todayKey() !== state.renderedDay) {
    navigator.serviceWorker?.getRegistration().then((r) => r?.update()).catch(() => {});
    return render();
  }
  const bar = app.querySelector('.window-bar');
  if (bar) {
    const tmp = document.createElement('div');
    tmp.innerHTML = windowBarHTML(bar.dataset.routine);
    bar.replaceWith(...tmp.children);
  }
  const c = app.querySelector('.clock');
  if (c) c.outerHTML = clockHTML();
  sessionTick();
  app.querySelectorAll('[data-offer]').forEach((el) => {
    const o = startOffer(el.dataset.offer, nowMs());
    el.textContent = o.coins ? `Start now for 🪙 ${o.coins} · drops in ${clock.fmtDuration(o.msToDrop)}` : "Let's all finish together!";
  });
  // Coins shown just after earning hide again after a few seconds.
  app.querySelectorAll('.col-coins[data-coins-until]').forEach((el) => { if (Number(el.dataset.coinsUntil) < Date.now()) el.remove(); });
  goTimeVoice();
  app.querySelectorAll('[data-night-start]').forEach((el) => {
    const took = nowMs() - new Date(el.dataset.nightStart).getTime();
    el.querySelector('.night-timer-label').textContent = nightTimerText(el.dataset.nightStart);
    el.querySelector('.night-timer-fill').style.width = `${(Math.max(0, 1 - took / (40 * 60000)) * 100).toFixed(1)}%`;
    el.classList.toggle('ok', took >= 20 * 60000 && took < 40 * 60000);
    el.classList.toggle('late', took >= 40 * 60000);
    el.classList.toggle('fast', took < 20 * 60000);
  });
  app.querySelectorAll('[data-race]').forEach((el) => { el.textContent = fmtMinutes(nowMs() - new Date(el.dataset.race).getTime()); });
  const idle = Date.now() - state.lastTouch > (state.rockOpen ? 3 * IDLE_MS : IDLE_MS) && state.prayer?.phase !== 'confirm';
  const away = (state.kidId || state.prayer || state.farmKid) && !document.querySelector('.fr-ov'); // not during Fruit time
  // The automatic trip home waits while the child is still tapping (e.g. feeding their animals).
  const autoHome = state.autoHomeAt && Date.now() > state.autoHomeAt && Date.now() - state.lastTouch > 4000 && !document.querySelector('.farm-ov');
  if (away && (idle || autoHome)) goHome();
}

// ---------- actions ----------

function goHome() {
  document.querySelectorAll('.farm-ov').forEach((el) => el.remove());
  closeOverlay();
  state.kidId = null;
  state.day = null;
  state.farmKid = null;
  state.farmByGrown = false;
  if (state.rockOpen) { state.rockOpen = false; document.querySelector('.rock-frame')?.remove(); }
  state.autoHomeAt = 0;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  if (state.reloadPending) return location.reload();
  render();
}

// Tick a job for one child. The child is passed in (not "whoever touched last"), so two children
// holding jobs at the same time each get their own tick and coins.
async function completeHabit(id, habitId) {
  const r = defaultTab();
  const k = kid(id);
  const d = state.days[id];
  const h = listFor(k, r).find((x) => x.id === habitId);
  if (!h || !d || mapFor(d, r)[habitId]) return;
  const at = clock.now().toISOString();
  mapFor(d, r)[habitId] = at;
  d.log.push({ t: at, routine: r, habit: habitId, action: 'done' });
  await dayPut(d);
  const before = state.sum;
  await refreshSummary();
  afterDone(id, habitId, h.type !== 'timer', r);
  coinNews(before, id);
}

// Say something for one child, if read-aloud is on for them.
function speakFor(id, text) { if (readAloudOn(id)) speak(text, true); }

// Shared feedback after any habit is completed (tile hold or prayer timer).
function afterDone(id, habitId, allowUndo, r = 'morning') {
  const k = kid(id);
  const d = state.days[id];
  const h = listFor(k, r).find((x) => x.id === habitId);
  const all = r !== 'extras' && doneCount(k, d, r) === listFor(k, r).length;
  if (all && !(d.rockSent ||= {})[r]) { d.rockSent[r] = true; dayPut(d); sendToRock(k.id, { kind: 'silver', label: r === 'night' ? 'Night jobs done' : 'Morning jobs done' }); }
  if (allowUndo) {
    clearTimeout(state.undos[k.id]?.timer);
    state.undos[k.id] = { habitId, routine: r, timer: setTimeout(() => { delete state.undos[k.id]; if (!state.prayer && !state.farmKid) renderKid(); }, UNDO_MS) };
  }
  renderKid();
  const tile = app.querySelector(`[data-col="${k.id}"] [data-habit="${habitId}"]`) || app.querySelector(`[data-habit="${habitId}"]`);
  state.coinFrom = tile?.getBoundingClientRect();
  tile?.classList.add('just-done');
  burst(tile);
  if (all && r === 'night') {
    // Night jobs done: the column now shows the big "🌙 Going up!" button.
    pop(true);
    speakFor(id, `${h.name}, done! Night jobs finished, ${k.name}. When you're ready for bed, tap Going up!`);
    burst(app.querySelector(`[data-col="${k.id}"] .going-up`), 24);
    state.autoHomeAt = Date.now() + FOCUS_HOME_MS;
  } else if (all) {
    pop(true);
    speakFor(id, `${h.name}, done! You finished everything. Amazing!`);
    allDoneMoment(k, r);
    state.autoHomeAt = Date.now() + ALL_DONE_HOME_MS;
  } else {
    pop();
    const next = r === 'extras' ? null : nextJob(k, d, r);
    speakFor(id, next ? `${h.name}, done! ${pick(PRAISE)} Next is ${next.name}. Off you go!` : `${h.name}, done! Thank you for helping!`);
    state.nextNote = next ? `👉 ${esc(k.name)}, next: ${next.icon} <b>${esc(next.name)}</b>. Off you go!` : '';
    if (next) setTimeout(() => toast(state.nextNote), 300);
    state.autoHomeAt = Date.now() + FOCUS_HOME_MS;
  }
}

// Big "+5" and gold coins flying from where they were earned into the child's coin counter, which counts up.
function flyCoins(amount, fromRect, targetEl, startValue) {
  if (!amount) return;
  const from = fromRect || { left: innerWidth / 2 - 40, top: innerHeight / 2 - 40, width: 80, height: 80 };
  const fx = from.left + from.width / 2;
  const fy = from.top + from.height / 2;
  const plus = document.createElement('div');
  plus.className = 'coin-plus';
  plus.textContent = `+${amount} 🪙`;
  plus.style.left = `${fx}px`;
  plus.style.top = `${fy}px`;
  document.body.appendChild(plus);
  setTimeout(() => plus.remove(), 1800);
  const t = targetEl?.getBoundingClientRect();
  const tx = t ? t.left + t.width / 2 : innerWidth - 80;
  const ty = t ? t.top + t.height / 2 : 40;
  const n = Math.min(amount, 10);
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div');
    c.className = 'flying-coin';
    c.textContent = '🪙';
    c.style.left = `${fx + (Math.random() * 60 - 30)}px`;
    c.style.top = `${fy + (Math.random() * 40 - 20)}px`;
    c.style.setProperty('--dx', `${tx - fx}px`);
    c.style.setProperty('--dy', `${ty - fy}px`);
    c.style.animationDelay = `${0.25 + i * 0.09}s`;
    document.body.appendChild(c);
    setTimeout(() => { c.remove(); tone((ac) => { const o = ac.createOscillator(); const g = ac.createGain(); o.type = 'triangle'; o.frequency.value = 1320 + i * 60; g.gain.setValueAtTime(0.06, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.12); o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.14); }); }, 250 + i * 90 + 750);
  }
  if (!targetEl) return;
  const end = startValue + amount;
  targetEl.textContent = startValue;
  const steps = Math.min(amount, 20);
  for (let i = 1; i <= steps; i++) {
    setTimeout(() => {
      targetEl.textContent = Math.round(startValue + (amount * i) / steps);
      if (i === steps) { targetEl.textContent = end; targetEl.parentElement?.classList.add('coin-bump'); setTimeout(() => targetEl.parentElement?.classList.remove('coin-bump'), 600); }
    }, 1000 + i * (900 / steps));
  }
}

// Celebrate coins just earned by one child: jobs, night race, bedtime bonus, and the family win.
function coinNews(before, id = state.kidId) {
  // Compare earned-before with earned-after. (Comparing the spendable balance, which includes farm
  // spending and sales, with earned-before made this 0 or less for anyone who had spent coins.)
  const gained = (state.sum?.coins[id] || 0) - (before?.coins[id] || 0);
  const famWon = state.sum?.family?.win && !before?.family?.win;
  const had = new Set((before?.todayCoins[id] || []).map((c) => c.why));
  const fresh = (state.sum.todayCoins[id] || []).filter((c) => !had.has(c.why)).map((c) => c.why);
  const note = state.nextNote || '';
  state.nextNote = '';
  if (gained > 0) {
    // The child's coins show on their column for a few seconds while the coins fly in.
    flyCoins(gained, state.coinFrom, coinTarget(id), coinsOf(id) - gained);
    setTimeout(() => toast(`<span>🪙 +${gained} coin${gained === 1 ? '' : 's'}! ${fresh.join(' · ')}${note ? `<br>${note}` : ''}</span>`), 600);
  }
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

async function undo(id = state.kidId) {
  const u = state.undos[id];
  const d = state.days[id];
  if (!u || !d) return;
  const { habitId, routine } = u;
  clearTimeout(u.timer);
  delete state.undos[id];
  delete mapFor(d, routine)[habitId];
  d.log.push({ t: clock.now().toISOString(), routine, habit: habitId, action: 'undo' });
  state.autoHomeAt = 0;
  await dayPut(d);
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

function allDoneMoment(k, r = 'morning') {
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
  const k = kid(); // the child whose column was tapped (kept, even if a sibling touches the iPad meanwhile)
  const el = document.createElement('div');
  el.className = 'rsg';
  document.body.appendChild(el);
  const steps = [['Ready…', 'r', 440], ['Set…', 'y', 440], ['GO!', 'g', 880]];
  for (const [word, light, freq] of steps) {
    el.dataset.light = light;
    el.innerHTML = `<div class="rsg-lights"><i class="r"></i><i class="y"></i><i class="g"></i></div><div class="rsg-word">${word}</div>`;
    beep(freq, light === 'g' ? 0.6 : 0.25);
    speakFor(k.id, word.replace('…', ''));
    await new Promise((r) => setTimeout(r, light === 'g' ? 700 : 900));
  }
  el.remove();
  going = false;
  const d = state.days[k.id];
  if (!d || firstDoneTime(d)) return;
  const at = clock.now().toISOString();
  d.startedAt = at;
  d.log.push({ t: at, action: 'start' });
  await dayPut(d);
  renderKid();
  burst(app.querySelector(`[data-col="${k.id}"] .next-tile`), 20);
  // Matches the morning rules: start by 7:15, and do the jobs before anyone has to ask.
  const inTime = clock.now() <= clock.atTime(state.settings.startBy || '07:15', state.settings.dayStartHour);
  speakFor(k.id, inTime ? `Let's go, ${k.name}! You started in time. Now do your jobs before anyone has to ask!`
    : `Let's go, ${k.name}! Every job still earns a star.`);
}

// ---------- press-and-hold (job tiles and the 🙏 breath) ----------
// Every finger has its own hold, remembered by its pointerId together with the child whose column it is in.
// So two children can hold at the same time: each tick goes to the right child, and lifting one finger
// only cancels that finger's hold.
const holds = new Map(); // pointerId -> { kind: 'tile' | 'breath', kidId, el, habitId, started, timer, timers }

// The element a hold is on. If the board was redrawn meanwhile, find the new copy of it.
function holdEl(x) {
  if (x.el?.isConnected) return x.el;
  const col = app.querySelector(`[data-col="${x.kidId}"]`);
  x.el = x.kind === 'breath' ? col?.querySelector('.breath-btn')
    : col?.querySelector(`.next-tile[data-habit="${x.habitId}"]`) || col?.querySelector(`[data-habit="${x.habitId}"]`);
  return x.el;
}
// After the board is redrawn, show the holds that are still going.
function showHolds() {
  for (const x of holds.values()) holdEl(x)?.classList.add(x.kind === 'breath' ? 'breathing' : 'holding');
}

function startHold(tile, id, pointerId) {
  endHold(pointerId, false);
  unlockAudio();
  const h = listFor(kid(id), defaultTab()).find((x) => x.id === tile.dataset.habit);
  if (!h) return;
  tile.classList.remove('hint');
  tile.classList.add('holding');
  speakFor(id, h.name);
  holds.set(pointerId, {
    kind: 'tile', kidId: id, el: tile, habitId: h.id, started: Date.now(),
    timer: setTimeout(() => { endHold(pointerId, false); completeHabit(id, h.id); }, HOLD_MS),
  });
}

// Stop one finger's hold. lifted = the finger came up before the hold finished.
function endHold(pointerId, lifted) {
  const x = holds.get(pointerId);
  if (!x) return;
  holds.delete(pointerId);
  clearTimeout(x.timer);
  (x.timers || []).forEach(clearTimeout);
  const el = holdEl(x);
  el?.classList.remove('holding', 'breathing');
  if (!lifted) return;
  if (x.kind === 'breath') {
    const label = el?.querySelector('small');
    if (label) label.textContent = 'Hold';
    toast('🙏 Keep your finger on 🙏 for one slow breath');
    return;
  }
  if (Date.now() - x.started < 400 && el) {
    // A quick tap: show how to finish instead of ticking it.
    el.classList.add('hint');
    const sub = el.querySelector('.tile-sub');
    if (sub) sub.textContent = '👇 Keep your finger down!';
    setTimeout(() => speakFor(x.kidId, 'Hold your finger down to finish.'), 600);
  }
}

// ---------- practice timers: 🎤 Singing and 🎹 Keyboard ----------
// Tap the tile to start (tap again to pause). The job ticks itself at h.minutes (7).
// Keyboard (bonusTo) keeps counting: +1 coin a minute from 8 to 15 (family.js), then stops by itself;
// ⏹ Stop ends it sooner. Morning only. Saved on the day as d.practice[habitId] = { acc, start }.
const practiceOf = (d, id) => d?.practice?.[id];
const mmss = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}`;
const capMs = (h) => (h.bonusTo || h.minutes) * 60000;
function practiceRunning() {
  return state.settings?.kids.some((k) => Object.values(state.days[k.id]?.practice || {}).some((p) => p.start)) || false;
}

function practiceTileHTML(k, h, d, at, nudgeId) {
  const p = practiceOf(d, h.id);
  const ms = Math.min(practiceMs(p), capMs(h));
  const running = !!p?.start;
  const bonus = h.bonusTo ? Math.max(0, Math.floor(ms / 60000) - h.minutes) : 0;
  const live = `<span data-practice="${k.id}:${h.id}">${mmss(ms)}</span>`;
  if (at) {
    // Done. Keyboard may still be counting bonus minutes.
    return `
      <div class="tile done ${running ? 'practising' : ''}" role="button" data-action="habit" data-habit="${h.id}">
        <span class="tile-icon">${h.icon}</span>
        <span class="tile-name">${esc(h.name)}</span>
        <span class="tile-sub">${running ? `⏱ ${live} · 🪙 +<span data-bonus="${k.id}:${h.id}">${bonus}</span>` : `✓ ${Math.floor(ms / 60000)} min${bonus ? ` · 🪙 +${bonus}` : ''}`}</span>
        ${running ? `<button class="undo-chip" data-action="practice-stop" data-habit="${h.id}">⏹ Stop</button>` : ''}
      </div>`;
  }
  const sub = running ? `⏱ ${live}` : p ? `⏸ ${live} · tap` : `⏱ ${h.minutes} min${h.bonusTo ? ` · up to ${h.bonusTo}` : ''} · tap`;
  return `
    <div class="tile ${running ? 'running' : ''} ${nudgeId === h.id ? 'nudge' : ''}" role="button" data-action="habit" data-habit="${h.id}">
      <span class="tile-icon">${h.icon}</span>
      <span class="tile-name">${esc(h.name)}</span>
      <span class="tile-sub">${sub}</span>
      <span class="tile-coin">${coinTag(tileCoins(h, 'morning', k, d))}</span>
    </div>`;
}

async function togglePractice(id, h) {
  const d = state.days[id];
  if (!d) return;
  if (defaultTab() !== 'morning') return toast(`${h.icon} ${h.name} is a morning job.`);
  const p = ((d.practice ||= {})[h.id] ||= { acc: 0, start: null });
  if (p.start) { p.acc += Date.now() - p.start; p.start = null; speakFor(id, `${h.name} paused.`); }
  else { p.start = Date.now(); unlockAudio(); speakFor(id, `${h.name} timer started. ${h.minutes} minutes!`); }
  state.lastTouch = Date.now();
  await dayPut(d);
  updateWakeLock();
  renderKid();
}

async function stopPractice(id, habitId) {
  const d = state.days[id];
  const p = practiceOf(d, habitId);
  if (!p?.start) return;
  const h = listFor(kid(id), 'morning').find((x) => x.id === habitId);
  p.acc = Math.min(capMs(h), p.acc + Date.now() - p.start);
  p.start = null;
  await dayPut(d);
  const before = state.sum;
  await refreshSummary();
  updateWakeLock();
  renderKid();
  coinNews(before, id);
  const bonus = Math.max(0, Math.floor(p.acc / 60000) - h.minutes);
  speakFor(id, bonus ? `Great practice! ${bonus} extra coin${bonus === 1 ? '' : 's'}!` : `${h.name} finished. Well done!`);
}

// Every quarter second: update the clocks, tick the job at 7 minutes, stop at the cap.
const practiceBusy = new Set(); // "kid:habit" while saving, so a tick or stop never runs twice (kept out of the saved day)
function checkPractice() {
  for (const k of state.settings?.kids || []) {
    const d = state.days[k.id];
    for (const [hid, p] of Object.entries(d?.practice || {})) {
      if (!p.start) continue;
      const h = k.habits.find((x) => x.id === hid);
      if (!h) continue;
      const ms = practiceMs(p);
      document.querySelectorAll(`[data-practice="${k.id}:${hid}"]`).forEach((el) => { el.textContent = mmss(Math.min(ms, capMs(h))); });
      document.querySelectorAll(`[data-bonus="${k.id}:${hid}"]`).forEach((el) => { el.textContent = String(Math.max(0, Math.floor(ms / 60000) - h.minutes)); });
      const key = `${k.id}:${hid}`;
      if (practiceBusy.has(key)) continue;
      if (!d.done[hid] && ms >= h.minutes * 60000) {
        practiceBusy.add(key);
        if (!h.bonusTo) { p.acc = h.minutes * 60000; p.start = null; }
        completePractice(k.id, h).finally(() => practiceBusy.delete(key));
      } else if (d.done[hid] && ms >= capMs(h)) {
        practiceBusy.add(key);
        stopPractice(k.id, hid).finally(() => practiceBusy.delete(key));
      }
    }
  }
}

// Tick a practice job as a morning job, even if the board has moved on from the morning.
async function completePractice(id, h) {
  const d = state.days[id];
  if (d.done[h.id]) return;
  const at = clock.now().toISOString();
  d.done[h.id] = at;
  d.log.push({ t: at, routine: 'morning', habit: h.id, action: 'done' });
  await dayPut(d);
  const before = state.sum;
  await refreshSummary();
  afterDone(id, h.id, false, 'morning');
  coinNews(before, id);
  if (h.bonusTo) setTimeout(() => speakFor(id, `Keep going for bonus coins, up to ${h.bonusTo} minutes!`), 2500);
  updateWakeLock();
}

// ---------- prayer timer ----------

let wakeLock = null;

async function updateWakeLock() {
  const want = (Object.keys(state.runs).length > 0 || practiceRunning()) && !document.hidden;
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
  checkPractice();
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
  const day = state.days[kidId] || await loadDay(kidId); // the board's own copy, so later ticks don't save over it
  const end = clock.now().toISOString();
  day.prayerAttempts.push({ start: run.startedAt, end, completed });
  delete day.prayerRun;
  if (completed) {
    day.done.pray = end;
    day.log.push({ t: end, habit: 'pray', action: 'done' });
    sendToRock(kidId, { kind: 'gold', label: 'Prayer time' }); // time with God
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
    afterDone(kidId, 'pray', false);
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
  const id = state.prayer?.kidId;
  closeOverlay();
  state.lastTouch = Date.now();
  if (finished) afterDone(id, 'pray', false);
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
  const pray = e.target.closest('.breath-btn');
  const tile = !pray && e.target.closest('.tile[data-hold]');
  const col = (pray || tile)?.closest('[data-col]');
  if (!col) return;
  const id = col.dataset.col;
  useKid(id);
  if (pray) {
    const busy = [...holds.values()].some((x) => x.kind === 'breath' && x.kidId === id);
    if (!pray.disabled && !busy && (state.days[id]?.breaths || 0) < BREATHS_PER_DAY) startBreath(pray, id, e.pointerId);
    return;
  }
  startHold(tile, id, e.pointerId);
}, true);
// Only the finger that lifts loses its hold.
document.addEventListener('pointerup', (e) => endHold(e.pointerId, true));
document.addEventListener('pointercancel', (e) => endHold(e.pointerId, true));
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
    case 'portal': return portal.open();
    case 'claim': return claimJob(el.dataset.job);
    case 'going-up': return goingUp(col.dataset.col);
    case 'last-night': return openLastNight(col?.dataset.col || state.settings.kids[0].id);
    case 'extras-sheet': return extrasSheet();
    case 'i-prayed': return openPrayed(col?.dataset.col || state.kidId);
    case 'quick-add': return quick.openAdd(col?.dataset.col || state.kidId);
    case 'quick-check': return quick.openCheck();
    case 'start-night': return startNight();
    case 'home': return goHome();
    case 'go': return readySetGo();
    case 'fruit-time': unlockAudio(); return openFruitTime(kid());
    case 'fruit-skip': return skipFruitToday(kid());
    case 'fruit-badge': return sayBadge(kid());
    case 'undo': e.stopPropagation(); return undo(col?.dataset.col);
    case 'practice-stop': e.stopPropagation(); return stopPractice(col?.dataset.col, el.dataset.habit);
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
      if (h.type === 'practice') return togglePractice(kid().id, h);
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
  // v12: Music becomes Singing and Keyboard (7-minute timers), in the same place in each child's list.
  if ((s.version || 1) < 12) {
    const practice = DEFAULT_SETTINGS.kids[0].habits.filter((h) => h.type === 'practice');
    for (const k of s.kids || []) {
      if (k.habits.some((h) => h.type === 'practice')) continue;
      const i = k.habits.findIndex((h) => h.id === 'music');
      const add = practice.map((h) => structuredClone(h));
      if (i < 0) k.habits.push(...add); else k.habits.splice(i, 1, ...add);
    }
  }
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
  // v9: the bedtime list follows the new default order (bath before pyjamas, toilet and bed last).
  if ((s.version || 1) < 9) {
    for (const dk of DEFAULT_SETTINGS.kids) {
      const k = s.kids.find((x) => x.id === dk.id);
      if (!k) continue;
      const order = dk.nightHabits.map((h) => h.id);
      k.nightHabits.sort((a, b) => (order.indexOf(a.id) + 1 || 99) - (order.indexOf(b.id) + 1 || 99));
      const shower = k.nightHabits.find((h) => h.id === 'shower');
      if (shower && shower.name === 'Shower or bath') shower.name = 'Bath or shower';
    }
  }
  // v10: "Tidy my room" and "Pack my bag" are no longer bedtime jobs (past days keep their own list).
  if ((s.version || 1) < 10) for (const k of s.kids) k.nightHabits = (k.nightHabits || []).filter((h) => h.id !== 'room' && h.id !== 'bag');
  // v11: night is the after-dinner house jobs only. Bath, pyjamas, teeth, toilet and bed happen upstairs
  // after "Going up!" (past days keep their own list, so their coins don't change).
  if ((s.version || 1) < 11) for (const k of s.kids) k.nightHabits = (k.nightHabits || []).filter((h) => !['shower', 'pjs', 'teeth', 'toilet', 'inbed'].includes(h.id));
  // New default night jobs join each child's saved night routine.
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
  await initFruit({ kids: state.settings.kids, dayStartHour: state.settings.dayStartHour, onChange: () => { if (!state.farmKid) renderKid(); } });
  // ?dev=0 turns dev mode off. ?dev=1 turns it on only after the grown-up PIN (asked once the board shows).
  const dev = new URLSearchParams(location.search).get('dev');
  if (dev === '0') setDev(false);
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
    document.addEventListener('visibilitychange', () => { if (!document.hidden) checkForUpdate(); });
    setInterval(checkForUpdate, 30 * 60 * 1000);
    showVersion(); setTimeout(showVersion, 4000); setTimeout(showVersion, 15000);
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
  if (dev !== null && dev !== '0' && !devOn() && (await grownUp('turn on dev mode (fake time)'))) {
    setDev(true);
    await render();
  }
}

init().catch((err) => {
  app.innerHTML = `<div class="error"><h1>Something went wrong 😕</h1><p>${esc(err.message || err)}</p><button class="btn" onclick="location.reload()">Try again</button></div>`;
});
