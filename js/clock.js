// Single source of "now" so dev mode can fake the time for testing.
// The fake time is stored as an offset, so the clock keeps ticking from the faked moment.

const OFFSET_KEY = 'dev.timeOffsetMs';
const FAST_KEY = 'dev.fastTimers';

function read(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function write(key, value) {
  try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch {}
}

export function now() {
  return new Date(Date.now() + Number(read(OFFSET_KEY) || 0));
}
export function setFakeTime(date) { write(OFFSET_KEY, String(date.getTime() - Date.now())); }
export function addMinutes(min) { setFakeTime(new Date(now().getTime() + min * 60000)); }
export function clearFakeTime() { write(OFFSET_KEY, null); }
export function isFaked() { return Number(read(OFFSET_KEY) || 0) !== 0; }

export function fastTimers() { return read(FAST_KEY) === '1'; }
export function setFastTimers(on) { write(FAST_KEY, on ? '1' : null); }

const pad = (n) => String(n).padStart(2, '0');

// The "day" a moment belongs to. Before 3am still counts as the previous day.
export function dayKey(date = now(), startHour = 3) {
  const d = new Date(date);
  if (d.getHours() < startHour) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// A clock time ("06:30") on the morning of the current day.
export function atTime(hhmm, startHour = 3, ref = now()) {
  const [y, m, d] = dayKey(ref, startHour).split('-').map(Number);
  const [h, min] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

export function fmtTime(date) {
  let h = date.getHours();
  const ampm = h < 12 ? 'am' : 'pm';
  h = h % 12 || 12;
  return `${h}:${pad(date.getMinutes())}${ampm}`;
}

export function fmtDuration(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
}
