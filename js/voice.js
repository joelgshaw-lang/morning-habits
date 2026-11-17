// The read-aloud voice. A grown-up picks it in Grown-ups → 🔊 Voice.
// Saved in localStorage as { uri, rate } under 'app.voice'.

const KEY = 'app.voice';
// Apple's joke voices (singing, robots, whispers) are left out of the list.
const NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Junior|Ralph|Kathy|Fred|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley)\b/i;

export function voiceSettings() {
  try { return Object.assign({ uri: '', rate: 0.95 }, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { return { uri: '', rate: 0.95 }; }
}

export function saveVoiceSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

// English voices on this device, Australian first, then the more natural "Enhanced"/"Premium" ones.
export function englishVoices() {
  let list = [];
  try { list = speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang) && !NOVELTY.test(v.name)); } catch {}
  const score = (v) => (/AU/i.test(v.lang) ? 0 : 2) + (/premium|enhanced/i.test(v.name) ? 0 : 1);
  return list.sort((a, b) => score(a) - score(b) || a.name.localeCompare(b.name));
}

// Make an utterance with the chosen voice and speed. rateScale lets calm moments go a little slower.
export function utterance(text, rateScale = 1) {
  const s = voiceSettings();
  const u = new SpeechSynthesisUtterance(text);
  const v = s.uri && englishVoices().find((x) => x.voiceURI === s.uri);
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-AU';
  u.rate = (s.rate || 0.95) * rateScale;
  return u;
}

// iOS loads its voice list a moment after the page opens.
export function onVoicesReady(fn) {
  try { speechSynthesis.addEventListener('voiceschanged', fn); } catch {}
}
