// Coins, streaks and the after-dinner race.
// Everything is worked out from the saved days, so undoing a tick also takes back its coins.

// Balanced with a 90-day simulation (see docs/farm-economy.md): a keen child earns ~30 coins a day,
// an average one ~20, a forgetful one ~16, so each farm stage takes one to three weeks.
export const COINS = {
  morningOnTime: 2, // each morning job done by the end of the morning window…
  morningLate: 1,   // …or later that day
  morningAll: 3,    // every morning job done on time
  earlyStart: [['06:45', 4], ['07:00', 3], ['07:15', 2]], // starting the morning by these times
  nightJob: 1,      // each night job
  startMax: 4,      // start night jobs within 5 minutes of "Dinner's finished"…
  startStep: 1,     // …then 1 fewer coin for every 5 minutes of waiting
  startStepMin: 5,
  under40: 2,       // all night jobs done within 40 minutes of pressing Start…
  under20: 3,       // …and 3 more if it took under 20 minutes
  bedtime: 3,       // toilet, teeth and in bed by bedtime
  familyWin: 3,     // everyone finished their night jobs (each child gets this)
  beatLast: 2,      // the family finished faster than last time
  record: 3,        // the family set a new record
  reminder: -1,     // each time a grown-up had to remind them (tapped on the 🔔 Reminders button)
  noReminders: 2,   // a whole morning or night routine done with no reminders
};
// Extra chores are priced by effort in config.js (1 to 5 coins each). A grown-up ticks them,
// up to this many coins a day.
export const EXTRAS_DAY_CAP = 20;
export const BEDTIME_JOBS = ['toilet', 'teeth', 'inbed'];

const ms = (iso) => new Date(iso).getTime();
const pad = (n) => String(n).padStart(2, '0');

function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

function onDay(key, hhmm) {
  const [y, m, d] = key.split('-').map(Number);
  const [h, min] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, h, min).getTime();
}

export function startCoins(dinnerIso, startIso) {
  if (!dinnerIso || !startIso) return 0;
  const waitMin = Math.max(0, (ms(startIso) - ms(dinnerIso)) / 60000);
  return Math.max(0, COINS.startMax - COINS.startStep * Math.floor(waitMin / COINS.startStepMin));
}

// What starting right now is worth, and how long until it drops.
export function startOffer(dinnerIso, nowMs) {
  const waited = Math.max(0, nowMs - ms(dinnerIso));
  const step = COINS.startStepMin * 60000;
  const coins = Math.max(0, COINS.startMax - COINS.startStep * Math.floor(waited / step));
  return { coins, msToDrop: coins > 0 ? step - (waited % step) : 0 };
}

const allIn = (list, map) => list.length > 0 && list.every((h) => map?.[h.id]);

// When a child's last night job was ticked, or null if not finished.
export function nightFinishedAt(kid, day) {
  if (!day || !allIn(kid.nightHabits, day.nightDone)) return null;
  return Math.max(...kid.nightHabits.map((h) => ms(day.nightDone[h.id])));
}

// When the morning really started: the Start button counts if a job was ticked within 20 minutes of it
// (so pressing Start early and wandering off doesn't pay), otherwise the first job ticked.
export function morningStart(day) {
  const ticks = Object.values(day?.done || {}).map(ms).sort((a, b) => a - b);
  if (!ticks.length) return null;
  const pressed = day.startedAt ? ms(day.startedAt) : null;
  return pressed && ticks[0] - pressed <= 20 * 60000 ? pressed : ticks[0];
}

export function bedtimeBonus(kid, day, bedtime) {
  const jobs = BEDTIME_JOBS.filter((id) => kid.nightHabits.some((h) => h.id === id));
  if (!day || jobs.length < BEDTIME_JOBS.length) return false;
  const limit = onDay(day.dayKey, bedtime);
  return jobs.every((id) => day.nightDone?.[id] && ms(day.nightDone[id]) <= limit);
}

// The family's night for each day: did everyone finish, how fast, and did they beat last time or the record?
function familyNights(settings, byDay, dinners) {
  const out = {};
  let last = null;
  let best = null;
  for (const key of Object.keys(byDay).sort()) {
    const finishes = settings.kids.map((k) => nightFinishedAt(k, byDay[key][k.id]));
    const win = finishes.every(Boolean);
    const dinner = dinners[key];
    const time = win && dinner ? Math.max(...finishes) - ms(dinner) : null;
    out[key] = {
      win,
      dinner,
      time,
      lastTime: last,
      bestTime: best,
      beatLast: time != null && last != null && time < last,
      record: time != null && best != null && time < best,
    };
    if (time != null) {
      last = time;
      best = best == null ? time : Math.min(best, time);
    }
  }
  return out;
}

// Coins earned on one day by one child, as a list of reasons, for showing and adding up.
function dayCoins(settings, kid, day, fam) {
  const items = [];
  if (!day) return items;
  const close = onDay(day.dayKey, settings.windowClose);
  const morning = kid.habits.filter((h) => day.done?.[h.id]);
  const onTime = morning.filter((h) => ms(day.done[h.id]) <= close).length;
  if (onTime) items.push({ coins: onTime * COINS.morningOnTime, why: `${onTime} morning job${onTime === 1 ? '' : 's'} on time` });
  if (morning.length > onTime) items.push({ coins: (morning.length - onTime) * COINS.morningLate, why: 'Morning jobs done late' });
  if (onTime === kid.habits.length) items.push({ coins: COINS.morningAll, why: 'Whole morning on time' });
  const began = morningStart(day);
  const early = began && COINS.earlyStart.find(([t]) => began <= onDay(day.dayKey, t));
  if (early) items.push({ coins: early[1], why: `Started by ${early[0].replace(/^0/, '')}` });
  const reminded = (r) => (day.reminders || []).filter((x) => x.routine === r).length;
  if (onTime === kid.habits.length && !reminded('morning')) items.push({ coins: COINS.noReminders, why: 'Morning with no reminders' });
  const nightJobs = kid.nightHabits.filter((h) => day.nightDone?.[h.id]).length;
  if (nightJobs) items.push({ coins: nightJobs * COINS.nightJob, why: `${nightJobs} night job${nightJobs === 1 ? '' : 's'}` });
  const extras = settings.extraChores.filter((c) => day.extras?.[c.id]);
  const extraCoins = Math.min(EXTRAS_DAY_CAP, extras.reduce((a, c) => a + (c.coins || 2), 0));
  if (extraCoins) items.push({ coins: extraCoins, why: `${extras.length} extra chore${extras.length === 1 ? '' : 's'}` });
  const start = startCoins(fam?.dinner, day.nightStartedAt);
  if (start) items.push({ coins: start, why: 'Quick start after dinner' });
  const finished = nightFinishedAt(kid, day);
  if (finished && !reminded('night')) items.push({ coins: COINS.noReminders, why: 'Night with no reminders' });
  const n = (day.reminders || []).length;
  if (n) items.push({ coins: n * COINS.reminder, why: `${n} reminder${n === 1 ? '' : 's'}` });
  const took = finished && day.nightStartedAt ? finished - ms(day.nightStartedAt) : null;
  if (took != null && took <= 40 * 60000) items.push({ coins: COINS.under40, why: 'Done in under 40 minutes' });
  if (took != null && took <= 20 * 60000) items.push({ coins: COINS.under20, why: 'Super fast: under 20 minutes' });
  if (bedtimeBonus(kid, day, settings.nightClose)) items.push({ coins: COINS.bedtime, why: 'In bed on time' });
  if (fam?.win) items.push({ coins: COINS.familyWin, why: 'Family win' });
  if (fam?.beatLast) items.push({ coins: COINS.beatLast, why: 'Faster than last time' });
  if (fam?.record) items.push({ coins: COINS.record, why: 'New family record' });
  return items;
}

const dayComplete = (kid, day) => !!day && allIn(kid.habits, day.done) && allIn(kid.nightHabits, day.nightDone);

export function summarize(settings, days, dinners, today) {
  const byDay = {};
  for (const d of days) (byDay[d.dayKey] ||= {})[d.kidId] = d;
  (byDay[today] ||= {});
  const fam = familyNights(settings, byDay, dinners);
  const coins = {};
  const todayCoins = {};
  const streak = {};
  for (const k of settings.kids) {
    coins[k.id] = 0;
    for (const key of Object.keys(byDay)) {
      const items = dayCoins(settings, k, byDay[key][k.id], fam[key]);
      const sum = items.reduce((a, b) => a + b.coins, 0);
      coins[k.id] += sum;
      if (key === today) todayCoins[k.id] = items;
    }
    // Streak: days in a row with every morning and night job done. Today counts once it's complete.
    let n = 0;
    let key = dayComplete(k, byDay[today][k.id]) ? today : addDays(today, -1);
    while (dayComplete(k, byDay[key]?.[k.id])) { n++; key = addDays(key, -1); }
    streak[k.id] = n;
  }
  return { coins, todayCoins, streak, family: fam[today] };
}

export function fmtMinutes(msVal) {
  const m = Math.round(msVal / 60000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}
