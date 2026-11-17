// Coins, streaks and the after-dinner race.
// Everything is worked out from the saved days, so undoing a tick also takes back its coins.

// Balanced with a simulation (see docs/farm-economy.md): a keen child earns ~46 coins a day,
// an average one ~35, a forgetful one ~24, so each farm stage takes one to three weeks.
export const COINS = {
  morningOnTime: 2, // each morning job done by the end of the morning window…
  morningLate: 1,   // …or later that day
  morningAll: 3,    // every morning job done on time
  // Morning rule: start by settings.startBy (7:15), or that morning's job coins are lost. Job stars still count.
  nightJob: 1,      // each night job
  startMax: 4,      // start night jobs within 5 minutes of "Dinner's finished"…
  startStep: 1,     // …then 1 fewer coin for every 5 minutes of waiting
  startStepMin: 5,
  under40: 2,       // all night jobs done within 40 minutes of pressing Start…
  under20: 3,       // …and 3 more if it took under 20 minutes
  familyWin: 3,     // everyone finished their night jobs (each child gets this)
  beatLast: 2,      // the family finished faster than last time
  record: 3,        // the family set a new record
  asked: -20,       // a grown-up had to ask (🔔). At most once per routine (morning, night), and a day never goes below zero.
  // "Last night 🛏️": next morning a grown-up says how bedtime went.
  bedStayed: 15,    // stayed in bed
  bedOnce: 5,       // got up once
  bedNot: 0,        // got up more than once
};
// Extra chores are priced by effort in config.js (1 to 5 coins each). A grown-up ticks them,
// up to this many coins a day.
export const EXTRAS_DAY_CAP = 20;

// Which set of rules a day follows. Saved on each day's plan, so days from before these rules
// (16 Nov 2026) keep the coins they earned at the time, and nobody's coins drop below what they've spent.
export const RULES_VERSION = 2;
// The old rules, only for those older days. Don't use these for anything new.
const OLD_COINS = { firstThing: 20, firstThingMin: 45, before7: 5, reminder: -1, noReminders: 2, bedtime: 3 };
const OLD_BEDTIME_JOBS = ['toilet', 'teeth', 'inbed'];

// The bedtime bonus from the grown-up's "Last night 🛏️" choice: 'stayed', 'once' or 'not'.
export function bedtimeBonus(how) {
  return how === 'stayed' ? COINS.bedStayed : how === 'once' ? COINS.bedOnce : COINS.bedNot;
}

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

// A child's after-dinner house jobs, as allocated by a grown-up.
export function houseJobsFor(settings, kid) {
  return (settings.nightAlloc?.[kid.id] || []).map((id) => settings.houseJobs?.find((j) => j.id === id)).filter(Boolean);
}

// The jobs and prices a day was planned with. Saved on the day record (app.js keeps today's up to date),
// so changing jobs later never rewrites past coins or streaks.
// Minutes practised so far: { acc: ms already counted, start: ms when the timer was last started, or null when paused }.
export const practiceMs = (p) => (p ? (p.acc || 0) + (p.start ? Date.now() - p.start : 0) : 0);

export function planFor(settings, kid) {
  return {
    habits: kid.habits.map((h) => (h.bonusTo ? { id: h.id, minutes: h.minutes, bonusTo: h.bonusTo } : { id: h.id })),
    house: houseJobsFor(settings, kid).map((h) => ({ id: h.id, coins: h.coins || 2 })),
    bedtime: kid.nightHabits.map((h) => ({ id: h.id })),
    extras: Object.fromEntries(settings.extraChores.map((c) => [c.id, c.coins || 2])),
    startBy: settings.startBy || '07:15',
    rules: RULES_VERSION,
  };
}
const planOf = (settings, kid, day) => day?.plan || planFor(settings, kid);

// When a child's last after-dinner house job was ticked (the part "Start night chores" times), or null.
export function nightFinishedAt(settings, kid, day) {
  const jobs = planOf(settings, kid, day).house;
  if (!day || !allIn(jobs, day.nightDone)) return null;
  return Math.max(...jobs.map((h) => ms(day.nightDone[h.id])));
}

// When the morning really started: the Start button counts if a job was ticked within 20 minutes of it
// (so pressing Start early and wandering off doesn't pay), otherwise the first job ticked.
export function morningStart(day) {
  const ticks = Object.values(day?.done || {}).map(ms).sort((a, b) => a - b);
  if (!ticks.length) return null;
  const pressed = day.startedAt ? ms(day.startedAt) : null;
  return pressed && ticks[0] - pressed <= 20 * 60000 ? pressed : ticks[0];
}

// Old rules only: toilet, teeth and in bed ticked by bedtime.
function oldBedtimeBonus(settings, kid, day, bedtime) {
  const jobs = OLD_BEDTIME_JOBS.filter((id) => planOf(settings, kid, day).bedtime.some((h) => h.id === id));
  if (!day || jobs.length < OLD_BEDTIME_JOBS.length) return false;
  const limit = onDay(day.dayKey, bedtime);
  return jobs.every((id) => day.nightDone?.[id] && ms(day.nightDone[id]) <= limit);
}

// The "start by" time (7:15) on a day, as a timestamp.
export function startByMs(settings, day) {
  return onDay(day.dayKey, day.plan?.startBy || settings.startBy || '07:15');
}

// Did this child start the morning by the start-by time? (Uses the real start: see morningStart.)
export function startedInTime(settings, day) {
  const began = morningStart(day);
  return began != null && began <= startByMs(settings, day);
}

// The family's night for each day: did everyone finish, how fast, and did they beat last time or the record?
function familyNights(settings, byDay, dinners) {
  const out = {};
  let last = null;
  let best = null;
  for (const key of Object.keys(byDay).sort()) {
    // Children with no house jobs tonight don't hold up the family win.
    const racing = settings.kids.filter((k) => planOf(settings, k, byDay[key][k.id]).house.length);
    const finishes = racing.map((k) => nightFinishedAt(settings, k, byDay[key][k.id]));
    const win = racing.length > 0 && finishes.every(Boolean);
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
  if (!day) return [];
  if (!day.plan?.rules) return oldDayCoins(settings, kid, day, fam); // a day from before these rules
  const plan = day.plan;
  const items = [];
  // Morning: coins only if the morning started by 7:15 (stars count either way).
  const close = onDay(day.dayKey, settings.windowClose);
  const morning = plan.habits.filter((h) => day.done?.[h.id]);
  if (morning.length && startedInTime(settings, day)) {
    const onTime = morning.filter((h) => ms(day.done[h.id]) <= close).length;
    if (onTime) items.push({ coins: onTime * COINS.morningOnTime, why: `${onTime} morning job${onTime === 1 ? '' : 's'} on time` });
    if (morning.length > onTime) items.push({ coins: (morning.length - onTime) * COINS.morningLate, why: 'Morning jobs done late' });
    if (onTime === plan.habits.length) items.push({ coins: COINS.morningAll, why: 'Whole morning on time' });
  }
  // 🎹 Practice bonus: +1 coin for each whole minute past the job's minutes, up to bonusTo (keyboard: 8 to 15 min).
  for (const h of plan.habits) {
    const p = h.bonusTo && day.done?.[h.id] && day.practice?.[h.id];
    if (!p) continue;
    const extra = Math.max(0, Math.min(h.bonusTo, Math.floor(practiceMs(p) / 60000)) - h.minutes);
    if (extra) items.push({ coins: extra, why: `${extra} extra keyboard minute${extra === 1 ? '' : 's'}` });
  }
  // "Last night 🛏️", chosen by a grown-up this morning.
  const bed = day.lastNight ? bedtimeBonus(day.lastNight.how) : 0;
  if (bed) items.push({ coins: bed, why: day.lastNight.how === 'stayed' ? 'Stayed in bed last night' : 'Only got up once last night' });
  // After-dinner house jobs and the night race.
  const house = plan.house.filter((h) => day.nightDone?.[h.id]);
  const houseCoins = house.reduce((a, h) => a + (h.coins || 2), 0);
  if (houseCoins) items.push({ coins: houseCoins, why: `${house.length} after-dinner job${house.length === 1 ? '' : 's'}` });
  const bedtime = plan.bedtime.filter((h) => day.nightDone?.[h.id]).length;
  if (bedtime) items.push({ coins: bedtime * COINS.nightJob, why: `${bedtime} bedtime job${bedtime === 1 ? '' : 's'}` });
  const extras = Object.keys(day.extras || {});
  const priceOf = (id) => plan.extras[id] ?? settings.extraChores.find((c) => c.id === id)?.coins ?? 2;
  const extraCoins = Math.min(EXTRAS_DAY_CAP, extras.reduce((a, id) => a + priceOf(id), 0));
  if (extraCoins) items.push({ coins: extraCoins, why: `${extras.length} extra chore${extras.length === 1 ? '' : 's'}` });
  const start = startCoins(fam?.dinner, day.nightStartedAt);
  if (start) items.push({ coins: start, why: 'Quick start after dinner' });
  const finished = nightFinishedAt(settings, kid, day);
  const took = finished && day.nightStartedAt ? finished - ms(day.nightStartedAt) : null;
  if (took != null && took <= 40 * 60000) items.push({ coins: COINS.under40, why: 'Done in under 40 minutes' });
  if (took != null && took <= 20 * 60000) items.push({ coins: COINS.under20, why: 'Super fast: under 20 minutes' });
  if (fam?.win) items.push({ coins: COINS.familyWin, why: 'Family win' });
  if (fam?.beatLast) items.push({ coins: COINS.beatLast, why: 'Faster than last time' });
  if (fam?.record) items.push({ coins: COINS.record, why: 'New family record' });
  // 🔔 A grown-up had to ask: −20, at most once in the morning and once at night.
  const askedIn = new Set((day.reminders || []).map((x) => x.routine).filter((r) => r === 'morning' || r === 'night'));
  for (const r of askedIn) items.push({ coins: COINS.asked, why: `A grown-up had to ask (${r})` });
  // The day never goes below zero.
  const total = items.reduce((a, b) => a + b.coins, 0);
  if (total < 0) items.push({ coins: -total, why: 'A day never goes below zero' });
  return items;
}

// The old rules (days saved before 16 Nov 2026). Kept so past coins never change.
function oldDayCoins(settings, kid, day, fam) {
  const items = [];
  if (!day) return items;
  const plan = planOf(settings, kid, day);
  const close = onDay(day.dayKey, settings.windowClose);
  const morning = plan.habits.filter((h) => day.done?.[h.id]);
  const onTime = morning.filter((h) => ms(day.done[h.id]) <= close).length;
  if (onTime) items.push({ coins: onTime * COINS.morningOnTime, why: `${onTime} morning job${onTime === 1 ? '' : 's'} on time` });
  if (morning.length > onTime) items.push({ coins: (morning.length - onTime) * COINS.morningLate, why: 'Morning jobs done late' });
  if (onTime === plan.habits.length) items.push({ coins: COINS.morningAll, why: 'Whole morning on time' });
  const began = morningStart(day);
  if (began && began < onDay(day.dayKey, '07:00')) items.push({ coins: OLD_COINS.before7, why: 'Started before 7am' });
  const reminded = (r) => (day.reminders || []).filter((x) => x.routine === r).length;
  if (began && began <= close && morning.length === plan.habits.length && plan.habits.length && !reminded('morning')
    && Math.max(...morning.map((h) => ms(day.done[h.id]))) - began <= OLD_COINS.firstThingMin * 60000) {
    items.push({ coins: OLD_COINS.firstThing, why: 'Morning jobs first thing, no delay' });
  }
  if (onTime === plan.habits.length && !reminded('morning')) items.push({ coins: OLD_COINS.noReminders, why: 'Morning with no reminders' });
  const house = plan.house.filter((h) => day.nightDone?.[h.id]);
  const houseCoins = house.reduce((a, h) => a + (h.coins || 2), 0);
  if (houseCoins) items.push({ coins: houseCoins, why: `${house.length} after-dinner job${house.length === 1 ? '' : 's'}` });
  const bedtime = plan.bedtime.filter((h) => day.nightDone?.[h.id]).length;
  if (bedtime) items.push({ coins: bedtime * COINS.nightJob, why: `${bedtime} bedtime job${bedtime === 1 ? '' : 's'}` });
  const extras = Object.keys(day.extras || {});
  const priceOf = (id) => plan.extras[id] ?? settings.extraChores.find((c) => c.id === id)?.coins ?? 2;
  const extraCoins = Math.min(EXTRAS_DAY_CAP, extras.reduce((a, id) => a + priceOf(id), 0));
  if (extraCoins) items.push({ coins: extraCoins, why: `${extras.length} extra chore${extras.length === 1 ? '' : 's'}` });
  const start = startCoins(fam?.dinner, day.nightStartedAt);
  if (start) items.push({ coins: start, why: 'Quick start after dinner' });
  const finished = nightFinishedAt(settings, kid, day);
  if (allIn([...plan.house, ...plan.bedtime], day.nightDone) && !reminded('night')) items.push({ coins: OLD_COINS.noReminders, why: 'Night with no reminders' });
  const n = (day.reminders || []).length;
  if (n) items.push({ coins: n * OLD_COINS.reminder, why: `${n} reminder${n === 1 ? '' : 's'}` });
  const took = finished && day.nightStartedAt ? finished - ms(day.nightStartedAt) : null;
  if (took != null && took <= 40 * 60000) items.push({ coins: COINS.under40, why: 'Done in under 40 minutes' });
  if (took != null && took <= 20 * 60000) items.push({ coins: COINS.under20, why: 'Super fast: under 20 minutes' });
  if (oldBedtimeBonus(settings, kid, day, settings.nightClose)) items.push({ coins: OLD_COINS.bedtime, why: 'In bed on time' });
  if (fam?.win) items.push({ coins: COINS.familyWin, why: 'Family win' });
  if (fam?.beatLast) items.push({ coins: COINS.beatLast, why: 'Faster than last time' });
  if (fam?.record) items.push({ coins: COINS.record, why: 'New family record' });
  return items;
}

// ⭐ Job stars: one for every job done that day (morning, after-dinner, bedtime, confirmed extras).
// Stars only come from chores, never from selling, and big farm things cost stars as well as coins.
function dayStars(settings, kid, day) {
  if (!day) return 0;
  const plan = planOf(settings, kid, day);
  return plan.habits.filter((h) => day.done?.[h.id]).length
    + [...plan.house, ...plan.bedtime].filter((h) => day.nightDone?.[h.id]).length
    + Object.keys(day.extras || {}).length;
}

const dayComplete = (settings, kid, day) => {
  if (!day) return false;
  const plan = planOf(settings, kid, day);
  const night = [...plan.house, ...plan.bedtime];
  // A child with no night jobs tonight has nothing to finish at night.
  return allIn(plan.habits, day.done) && (!night.length || allIn(night, day.nightDone));
};

export function summarize(settings, days, dinners, today) {
  const byDay = {};
  for (const d of days) (byDay[d.dayKey] ||= {})[d.kidId] = d;
  (byDay[today] ||= {});
  const fam = familyNights(settings, byDay, dinners);
  const coins = {};
  const stars = {};
  const todayCoins = {};
  const streak = {};
  for (const k of settings.kids) {
    coins[k.id] = 0;
    stars[k.id] = 0;
    for (const key of Object.keys(byDay)) {
      stars[k.id] += dayStars(settings, k, byDay[key][k.id]);
      const items = dayCoins(settings, k, byDay[key][k.id], fam[key]);
      const sum = items.reduce((a, b) => a + b.coins, 0);
      coins[k.id] += sum;
      if (key === today) todayCoins[k.id] = items;
    }
    // Streak: days in a row with every morning and night job done. Today counts once it's complete.
    let n = 0;
    let key = dayComplete(settings, k, byDay[today][k.id]) ? today : addDays(today, -1);
    while (dayComplete(settings, k, byDay[key]?.[k.id])) { n++; key = addDays(key, -1); }
    streak[k.id] = n;
  }
  return { coins, stars, todayCoins, streak, family: fam[today] };
}

export function fmtMinutes(msVal) {
  const m = Math.round(msVal / 60000);
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`;
}
