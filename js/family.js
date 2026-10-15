// Coins, streaks and the after-dinner race.
// Everything is worked out from the saved days, so undoing a tick also takes back its coins.

export const COINS = {
  startMax: 10,     // start night jobs within 5 minutes of "Dinner's finished"…
  startStep: 2,     // …then 2 fewer coins for every 5 minutes of waiting
  startStepMin: 5,
  nightDone: 10,    // all night jobs done
  bedtime: 5,       // toilet, teeth and in bed by bedtime
  familyWin: 5,     // everyone finished their night jobs (each child gets this)
  beatLast: 5,      // the family finished faster than last time
  record: 5,        // the family set a new record
};
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
  const start = startCoins(fam?.dinner, day.nightStartedAt);
  if (start) items.push({ coins: start, why: 'Quick start after dinner' });
  if (nightFinishedAt(kid, day)) items.push({ coins: COINS.nightDone, why: 'Night jobs done' });
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
