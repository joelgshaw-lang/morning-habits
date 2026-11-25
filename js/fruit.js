// 🍓 Fruit Check-in: a child meets the fruits of the Spirit, 3 at a time, with their Fruit Friends.
//
// WHAT OTHER FILES USE FROM HERE
//   initFruit({ dayStartHour, onChange })  Load every child's fruit progress (call once at start-up).
//   openFruitTime(kid)        The morning "🍓 Fruit time" (about a minute): 3 fruit cards, then a 2-question quiz.
//   skipFruitToday(kid)       The free "Not today" on the morning tile.
//   runNightFruit(kid)        THE NIGHT CHECK-IN. For the next developer: call this from the "🌙 Going up!" button.
//                             It shows 1 quiz question about that morning's fruits, then "How did your fruit go TODAY?"
//                             (one star tap), then a big "Goodnight 🌙". It returns a Promise that finishes when the
//                             child closes it: { done: true } if they finished, { done: false } if they closed it early.
//                             Then you can say goodnight / mark them as gone up. Safe to call even if the child skipped
//                             the morning (it uses the last fruits they met) or has never met any fruit (short message).
//   nightFruitDone(kidId)     True once the night check-in is finished today.
//   fruitTileHTML(kid)        The morning tile for a child's column ('' once done or "Not today" today).
//   fruitBadgeHTML(kid)       Small picture of the child's chosen Fruit Friend for the top of their column.
//   nightFruitButtonHTML(kid) TEMPORARY "🍓 Night fruit" button on the night column, until "Going up!" replaces it.
//   fruitPortalHTML(kid, esc) The grown-ups' 🍓 Fruit tab (one child at a time).
//
// HOW IT WORKS
// - Days use clock.dayKey (a new day starts at 3am), so morning and night always share the same 3 fruits.
// - Each child has their own place in the 9. They meet the next 3 only after finishing the last 3,
//   so a missed day skips nothing. After all 9 they pick ANY fruit as their own, kept for a week.
// - Stars: under-8s get 3 big stars with faces, 8 and up get 5. Every star number gets the same warm reply.
// - Quiz: answers in a fresh random order every time, only the first tap counts, no hints. A miss is gentle
//   (the friend says who it is, then the right one is shown). It always ends on a win.
// - Saved in the app's storage (IndexedDB "kv" store) under "fruit.<child id>".

import { kvGet, kvSet } from './db.js';
import * as clock from './clock.js';
import { utterance } from './voice.js';
import { FRUITS, fruitById } from './fruits.js';

const ORDER = FRUITS.map((f) => f.id);
const WEEK_DAYS = 7;
const REPLY = 'Thank you for being honest. God loves you, and he’s still growing you.';
const OVERLAY_IDLE_MS = 3 * 60 * 1000; // a forgotten fruit screen closes itself after 3 minutes of no touches

let dayStartHour = 3;
let onChange = () => {};
const cache = {}; // child id -> saved fruit progress

// ---------- saved progress ----------

function blank() {
  return {
    met: 0,        // how many of the 9 this child has met so far, in order (0 to 9)
    review: 0,     // after all 9: which group of 3 comes round next
    days: {},      // dayKey -> { set, advanced, morning, of, morningStars, quiz, night }
    stars: {},     // fruit id -> the latest morning stars { n, of, day }
    chosen: null,  // the child's own fruit { fruit, day } kept for a week
    quiet: false,  // true = don't read aloud on the fruit screens
  };
}
const data = (id) => (cache[id] ||= blank());
const save = (id) => kvSet(`fruit.${id}`, data(id)).catch(() => {});
const today = () => clock.dayKey(clock.now(), dayStartHour);
const dayRec = (id, dk = today()) => (data(id).days[dk] ||= {});

export async function initFruit(opts = {}) {
  dayStartHour = opts.dayStartHour ?? 3;
  onChange = opts.onChange || onChange;
  for (const k of opts.kids || []) {
    const saved = await kvGet(`fruit.${k.id}`).catch(() => null);
    cache[k.id] = Object.assign(blank(), saved || {});
  }
}

// Whole days from dayKey a to dayKey b ("2026-11-16" style).
function daysBetween(a, b) {
  const t = (s) => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d); };
  return Math.round((t(b) - t(a)) / 864e5);
}

// Today's 3 fruits for a child. Fixed for the day once the morning starts, so night matches.
function todaysSet(id) {
  const d = data(id);
  const rec = d.days[today()];
  if (rec?.set) return rec.set;
  if (d.met < ORDER.length) return ORDER.slice(d.met, d.met + 3);
  const g = d.review % 3;
  return ORDER.slice(g * 3, g * 3 + 3);
}

// The fruits for tonight: this morning's, or the last 3 the child actually met.
function nightSet(id) {
  const d = data(id);
  if (d.days[today()]?.advanced) return d.days[today()].set;
  const last = Object.keys(d.days).filter((k) => d.days[k].advanced).sort().pop();
  return last ? d.days[last].set : null;
}

const ageOf = (k) => Number(k.age) || 8;
const starMax = (k) => (ageOf(k) < 8 ? 3 : 5);
const chosenFruit = (id) => (data(id).chosen ? fruitById(data(id).chosen.fruit) : null);
// The fruit a child chose this week (its id, e.g. 'kindness'), or null. Used by "I prayed" for its precious stone.
export const fruitOfWeek = (id) => chosenFruit(id)?.id || null;
const weekIsUp = (id) => !!data(id).chosen && daysBetween(data(id).chosen.day, today()) >= WEEK_DAYS;

// Keep the saved history small: drop days older than 60 days.
function prune(id) {
  const d = data(id);
  for (const k of Object.keys(d.days)) if (daysBetween(k, today()) > 60) delete d.days[k];
}

// ---------- speech (the app's chosen voice) ----------

let quiet = false;
function say(...lines) {
  if (quiet || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    for (const line of lines.flat().filter(Boolean)) {
      speechSynthesis.speak(utterance(String(line).replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '').trim()));
    }
  } catch {}
}

// ---------- small pieces of screen ----------

const esc0 = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const art = (f, cls = '') => `<span class="fr-art ${cls}">${f.art}</span>`;

const STAR_PATH = 'M50 4l13.6 28.4 31 3.9-22.8 21.4 5.9 30.7L50 73.4 22.3 88.4l5.9-30.7L5.4 36.3l31-3.9z';
// A star with a face: a little smile, a bigger smile, a big happy grin. No sad faces.
const MOUTHS = ['M40 56 Q50 61 60 56', 'M37 54 Q50 66 63 54', 'M35 52 Q50 72 65 52 Z'];
function starSVG(face) {
  return `<svg viewBox="0 0 100 92" aria-hidden="true"><path d="${STAR_PATH}" class="fr-star-shape"/>
    ${face == null ? '' : `<circle cx="40" cy="44" r="4.2" class="fr-star-eye"/><circle cx="60" cy="44" r="4.2" class="fr-star-eye"/>
    <path d="${MOUTHS[face]}" class="fr-star-mouth ${face === 2 ? 'open' : ''}"/>`}</svg>`;
}
function starsHTML(k, given) {
  const max = starMax(k);
  const labels = max === 3 ? ['A little', 'Some', 'Lots!'] : null;
  return `<div class="fr-stars ${max === 3 ? 'faces' : ''}" role="group" aria-label="Tap the stars">
    ${Array.from({ length: max }, (_, i) => `<button class="fr-star ${i < given ? 'on' : ''}" data-fr="star" data-n="${i + 1}" aria-label="${i + 1} of ${max} stars">
      ${starSVG(max === 3 ? i : null)}${labels ? `<small>${labels[i]}</small>` : ''}</button>`).join('')}
  </div>${max === 5 ? '<div class="fr-scale"><span>Still growing</span><span>Lots of fruit!</span></div>' : ''}`;
}
const starText = (n, of) => '★'.repeat(n) + '☆'.repeat(Math.max(0, of - n));

// ---------- the fruit screen (one overlay, redrawn for each step) ----------

let run = null; // the check-in being shown right now

function openOverlay(k, mode) {
  return new Promise((resolve) => {
    closeOverlay(false);
    quiet = !!data(k.id).quiet;
    const el = document.createElement('div');
    el.className = 'fr-ov';
    el.style.setProperty('--kid', k.color || '#16a34a');
    document.body.appendChild(el);
    run = { k, mode, el, resolve, lastTouch: Date.now(), finished: false };
    el.addEventListener('click', onClick);
    el.addEventListener('pointerdown', () => { if (run) run.lastTouch = Date.now(); });
    run.idle = setInterval(() => { if (run && Date.now() - run.lastTouch > OVERLAY_IDLE_MS) closeOverlay(false); }, 5000);
  });
}

function closeOverlay(finished) {
  if (!run) return;
  const r = run;
  run = null;
  clearInterval(r.idle);
  r.el.remove();
  try { if (!finished) speechSynthesis.cancel(); } catch {}
  r.resolve({ done: !!finished || r.finished });
  onChange();
}

function draw(body, { progress = '' } = {}) {
  const k = run.k;
  run.el.innerHTML = `<div class="fr-sheet ${run.mode}">
    <div class="fr-bar">
      <span class="fr-kid">${run.mode === 'night' ? '🌙' : '🍓'} ${esc0(k.name)}</span>
      <span class="fr-progress">${progress}</span>
      <button class="fr-icon" data-fr="quiet" aria-label="${quiet ? 'Read aloud is off' : 'Read aloud is on'}">${quiet ? '🔇' : '🔊'}</button>
      <button class="fr-icon" data-fr="close" aria-label="Close">✕</button>
    </div>
    <div class="fr-body">${body}</div></div>`;
}

const dots = (n, at) => Array.from({ length: n }, (_, i) => `<i class="${i < at ? 'done' : i === at ? 'now' : ''}"></i>`).join('');

// ----- morning: 3 fruit cards -----

function cardScreen() {
  const f = fruitById(run.set[run.i]);
  const given = run.stars[f.id] || 0;
  draw(`
    <div class="fr-top">
      <button class="fr-friend" data-fr="intro" aria-label="Hear ${esc0(f.friend)}">${art(f)}</button>
      <div class="fr-title">
        <div class="fr-who">${esc0(f.friend)}</div>
        <h2>${f.name} <small>${esc0(f.word)}</small></h2>
        <div class="fr-hand">✋ ${esc0(f.hand)}</div>
        <p class="fr-vine">🌿 The Holy Spirit grows ${f.lower} in me as I stay close to Jesus, like a branch on a vine.</p>
      </div>
    </div>
    <div class="fr-pair">
      <button class="fr-pic yes" data-fr="pic-yes">${f.yesPic}<span class="fr-cap"><b>✓ This is ${f.lower}</b>${esc0(f.yes)}</span></button>
      <button class="fr-pic no" data-fr="pic-no">${f.noPic}<span class="fr-cap"><b>✗ This is not ${f.lower}</b>${esc0(f.no)}</span></button>
    </div>
    <div class="fr-ask">How much did I see God growing ${f.lower} in me?</div>
    ${starsHTML(run.k, given)}
    <div class="fr-nav">
      ${run.i > 0 ? '<button class="fr-btn soft" data-fr="back">← Back</button>' : '<span></span>'}
      <div class="fr-reply" aria-live="polite">${given ? REPLY : ''}</div>
      <button class="fr-btn go" data-fr="next" ${given ? '' : 'disabled'}>Next →</button>
    </div>`, { progress: `<span class="fr-dots">${dots(3, run.i)}</span>` });
}

const introLines = (f) => [
  `Hi, I'm ${f.friend}! I'm ${f.lower}: ${f.word}.`,
  `The Holy Spirit grows ${f.lower} in me as I stay close to Jesus, like a branch on a vine.`,
];
function speakCard() {
  const f = fruitById(run.set[run.i]);
  say(introLines(f), `This is ${f.lower}. ${f.yes}.`, `This is not ${f.lower}. ${f.no}.`, `How much did I see God growing ${f.lower} in me? Tap the stars.`);
}

// ----- the quiz (morning: 2 questions; night: 1) -----

function makeQuestion(type, target, set) {
  return type === 'who'
    ? { type, target, options: shuffle(set), tapped: null }
    : { type, target, options: shuffle(['yes', 'no']), tapped: null };
}

function quizScreen() {
  const q = run.quiz[run.qi];
  const f = fruitById(q.target);
  const answered = q.tapped != null;
  const right = q.type === 'who' ? q.target : 'yes';
  let opts;
  if (q.type === 'who') {
    opts = `<div class="fr-choices who">${q.options.map((id) => {
      const o = fruitById(id);
      const cls = answered ? (id === right ? 'right' : id === q.tapped ? 'wrong' : 'dim') : '';
      return `<button class="fr-choice ${cls}" data-fr="answer" data-a="${id}" ${answered ? 'disabled' : ''} aria-label="${esc0(o.friend)}">
        ${art(o)}${answered && (id === right || id === q.tapped) ? `<b>${esc0(o.friend.split(' ')[0])} · ${o.name}</b>` : ''}</button>`;
    }).join('')}</div>`;
  } else {
    opts = `<div class="fr-choices pics">${q.options.map((a) => {
      const cls = answered ? (a === right ? 'right' : a === q.tapped ? 'wrong' : 'dim') : '';
      const pic = a === 'yes' ? f.yesPic : f.noPic;
      const cap = answered ? `<span class="fr-cap"><b>${a === 'yes' ? `✓ This is ${f.lower}` : `✗ This is not ${f.lower}`}</b>${esc0(a === 'yes' ? f.yes : f.no)}</span>` : '';
      return `<button class="fr-choice fr-pic ${cls}" data-fr="answer" data-a="${a}" ${answered ? 'disabled' : ''}>${pic}${cap}</button>`;
    }).join('')}</div>`;
  }
  const qText = q.type === 'who' ? `Which one is ${f.name}?` : `Which picture shows ${f.lower}?`;
  const total = run.quiz.length;
  draw(`
    <div class="fr-quiz-head"><div class="fr-label">${run.mode === 'night' ? 'Night question' : `Fruit quiz · ${run.qi + 1} of ${total}`}</div>
      <h2>${qText}</h2></div>
    ${opts}
    <div class="fr-reply" aria-live="polite">${answered ? (q.tapped === right ? `🎉 Yes! ${q.type === 'who' ? `That's ${esc0(f.friend)}.` : `That is ${f.lower}.`}` : `That's OK! ${q.type === 'who' ? `This one is ${esc0(f.friend)}, ${f.lower}.` : `This one shows ${f.lower}.`}`) : ''}</div>
    <div class="fr-nav"><span></span>${answered ? '<button class="fr-btn go" data-fr="quiz-next">Next →</button>' : ''}</div>`,
  { progress: run.mode === 'night' ? '' : `<span class="fr-dots">${dots(total, run.qi)}</span>` });
}
const askQuestion = () => {
  const q = run.quiz[run.qi];
  const f = fruitById(q.target);
  say(q.type === 'who' ? `Which one is ${f.name}?` : `Which picture shows ${f.lower}?`);
};

function answer(a) {
  const q = run.quiz[run.qi];
  if (q.tapped != null) return; // only the first tap counts
  q.tapped = a;
  const f = fruitById(q.target);
  const right = q.type === 'who' ? q.target : 'yes';
  const ok = a === right;
  q.right = ok;
  quizScreen();
  if (ok) {
    burst(run.el.querySelector('.fr-choice.right'));
    say(q.type === 'who' ? `Yes! That's ${f.friend}. ${f.name}! ${f.hand}!` : `Yes! That is ${f.lower}. ${f.yes}.`);
  } else if (q.type === 'who') {
    const o = fruitById(a);
    say(`I'm ${o.friend}. I'm ${o.lower}!`, `This is ${f.friend}. ${f.friend.split(' ')[0]} is ${f.lower}. ${f.hand}!`);
  } else {
    say(`That one is not ${f.lower}. ${f.no}.`, `This one is ${f.lower}. ${f.yes}.`);
  }
}

// After a miss, an easy win to finish on: do the hand action together.
function winScreen() {
  const f = fruitById(run.winFruit);
  draw(`<div class="fr-win">
      ${art(f, 'big')}
      <h2>Do ${f.lower}’s hand action with me!</h2>
      <div class="fr-hand big">✋ ${esc0(f.hand)}</div>
      <button class="fr-btn go huge" data-fr="did-it">I did it! 🙌</button></div>`);
  say(`Let's do ${f.lower}'s hand action together. ${f.hand}!`);
}

// ----- morning: the end, choosing your own fruit, keeping it -----

function endScreen() {
  const k = run.k;
  const d = data(k.id);
  const mine = chosenFruit(k.id);
  const metIds = d.met >= 9 ? ORDER : ORDER.slice(0, d.met);
  draw(`<div class="fr-end">
      <h2>🎉 Well done, ${esc0(k.name)}!</h2>
      ${mine ? `<div class="fr-mine">${art(mine)}<div><div class="fr-label">My fruit this week</div><h3>${mine.name}</h3>
          <div class="fr-hand">✋ ${esc0(mine.hand)}</div><p>💪 ${esc0(mine.practice)}</p></div></div>`
      : `<p class="fr-note">${d.met >= 9 ? '' : `You've met ${d.met} of the 9 Fruit Friends. Tomorrow: 3 more!`}</p>`}
      <div class="fr-nine">${ORDER.map((id) => { const f = fruitById(id); return `<span class="${metIds.includes(id) ? 'met' : ''}">${art(f)}</span>`; }).join('')}</div>
      <button class="fr-btn go huge" data-fr="finish">Done ✓</button></div>`);
  say(mine ? `Well done, ${k.name}! Ask the Holy Spirit to help you grow ${mine.lower} today. ${mine.practice}`
    : d.met >= 9 ? `Well done, ${k.name}!` : `Well done, ${k.name}! Tomorrow you'll meet three more Fruit Friends.`);
}

// Any of the 9 can be picked. Fruits with fewer stars come first, as a hint only.
function pickScreen() {
  const k = run.k;
  const d = data(k.id);
  const ratio = (id) => (d.stars[id] ? d.stars[id].n / d.stars[id].of : 1);
  const low = Math.min(...ORDER.map(ratio));
  const allSame = ORDER.every((id) => ratio(id) === low);
  const hint = (id) => !allSame && ratio(id) === low;
  const order = allSame ? ORDER : [...ORDER.filter(hint), ...ORDER.filter((id) => !hint(id))];
  const sel = run.picked && fruitById(run.picked);
  draw(`<div class="fr-pick">
      <h2>Which fruit would you like the Holy Spirit to grow in you?</h2>
      <p class="fr-note">Pick any one. It will be your fruit for a week.${allSame ? '' : ' 🌱 = you gave it fewer stars.'}</p>
      <div class="fr-grid">${order.map((id) => { const f = fruitById(id); return `<button class="fr-choice ${run.picked === id ? 'right' : ''}" data-fr="pick" data-a="${id}">
        ${art(f)}<b>${hint(id) ? '🌱 ' : ''}${f.name}</b></button>`; }).join('')}</div>
      <div class="fr-nav">${d.chosen ? '<button class="fr-btn soft" data-fr="back-keep">← Back</button>' : '<span></span>'}
        ${sel ? `<button class="fr-btn go" data-fr="pick-ok">Make ${sel.name} my fruit ✓</button>` : ''}</div></div>`);
}

function keepScreen() {
  const mine = chosenFruit(run.k.id);
  draw(`<div class="fr-keep">
      ${art(mine, 'big')}
      <p class="fr-note">A whole week growing ${mine.lower}!</p>
      <button class="fr-btn go huge" data-fr="keep">Keep growing ${mine.name}</button>
      <button class="fr-btn soft small" data-fr="choose-new">Choose a new one</button></div>`);
  say(`A whole week growing ${mine.lower}! Keep growing ${mine.lower}, or choose a new one.`);
}

// Where the morning goes after the quiz.
function afterQuiz() {
  const id = run.k.id;
  const d = data(id);
  const rec = dayRec(id);
  rec.morning = 'done';
  rec.quiz = run.quiz.map((q) => ({ type: q.type, fruit: q.target, right: !!q.right }));
  save(id);
  run.finished = true;
  if (d.met >= 9 && !d.chosen) {
    run.step = 'pick';
    pickScreen();
    return say('You have met all 9 Fruit Friends! Which fruit would you like the Holy Spirit to grow in you? Tap any one.');
  }
  if (weekIsUp(id)) { run.step = 'keep'; return keepScreen(); }
  run.step = 'end';
  endScreen();
}

// The child has seen all 3 cards: save the stars and move their place on through the 9.
function finishCards() {
  const id = run.k.id;
  const d = data(id);
  const rec = dayRec(id);
  const of = starMax(run.k);
  rec.of = of;
  rec.morningStars = { ...run.stars };
  for (const [fid, n] of Object.entries(run.stars)) d.stars[fid] = { n, of, day: today() };
  if (!rec.advanced) {
    rec.advanced = true;
    if (d.met < ORDER.length) d.met = Math.min(ORDER.length, d.met + 3);
    else d.review = (d.review + 1) % 3;
  }
  prune(id);
  save(id);
}

// ----- night: 1 question, then "How did your fruit go today?" -----

function nightStarScreen() {
  const f = fruitById(run.nightFruit);
  const given = run.nightStars || 0;
  draw(`
    <div class="fr-top">
      <button class="fr-friend" data-fr="night-say" aria-label="Hear ${esc0(f.friend)}">${art(f)}</button>
      <div class="fr-title"><div class="fr-who">${esc0(f.friend)}</div><h2>${f.name} <small>${esc0(f.word)}</small></h2>
        <div class="fr-hand">✋ ${esc0(f.hand)}</div></div>
    </div>
    <div class="fr-ask">How did ${f.lower} go TODAY?</div>
    ${starsHTML(run.k, given)}
    <div class="fr-nav"><span></span><div class="fr-reply" aria-live="polite">${given ? REPLY : ''}</div>
      <button class="fr-btn go" data-fr="goodnight" ${given ? '' : 'disabled'}>Goodnight 🌙</button></div>`);
}

function saveNight() {
  const id = run.k.id;
  const rec = dayRec(id);
  const q = run.quiz?.[0];
  rec.night = { fruit: run.nightFruit, n: run.nightStars, of: starMax(run.k), quiz: q ? { type: q.type, fruit: q.target, right: !!q.right } : null, at: clock.now().toISOString() };
  prune(id);
  save(id);
}

// ---------- taps ----------

function onClick(e) {
  const b = e.target.closest('[data-fr]');
  if (!b || !run || b.disabled) return;
  const a = b.dataset.fr;
  const k = run.k;
  switch (a) {
    case 'close': return closeOverlay(false);
    case 'quiet': {
      quiet = !quiet;
      data(k.id).quiet = quiet;
      save(k.id);
      if (quiet) try { speechSynthesis.cancel(); } catch {}
      b.textContent = quiet ? '🔇' : '🔊';
      if (!quiet) say('Read aloud is on.');
      return;
    }
    case 'intro': wiggle(b); return say(introLines(fruitById(run.set[run.i])));
    case 'pic-yes': { const f = fruitById(run.set[run.i]); return say(`This is ${f.lower}. ${f.yes}.`); }
    case 'pic-no': { const f = fruitById(run.set[run.i]); return say(`This is not ${f.lower}. ${f.no}.`); }
    case 'star': {
      const n = Number(b.dataset.n);
      if (run.step === 'night') { run.nightStars = n; nightStarScreen(); } else { run.stars[run.set[run.i]] = n; cardScreen(); }
      return say(REPLY);
    }
    case 'back': run.i = Math.max(0, run.i - 1); cardScreen(); return speakCard();
    case 'next': {
      if (run.i < run.set.length - 1) { run.i++; cardScreen(); return speakCard(); }
      finishCards();
      // Quiz: question 1 "Which one is …?", question 2 "Which picture shows …?" about a different fruit.
      const [t1, t2] = shuffle(run.set);
      run.quiz = [makeQuestion('who', t1, run.set), makeQuestion('pic', t2, run.set)];
      run.qi = 0;
      run.step = 'quiz';
      quizScreen();
      return askQuestion();
    }
    case 'answer': return answer(b.dataset.a);
    case 'quiz-next': {
      const q = run.quiz[run.qi];
      if (run.qi < run.quiz.length - 1) { run.qi++; quizScreen(); return askQuestion(); }
      // Always end on a win: after a miss on the last question, do the hand action together.
      if (!q.right) { run.winFruit = q.target; run.step = 'win'; return winScreen(); }
      return run.mode === 'night' ? toNightStars() : afterQuiz();
    }
    case 'did-it': {
      burst(b);
      say('Yes! Well done!');
      return run.mode === 'night' ? toNightStars() : afterQuiz();
    }
    case 'pick': {
      run.picked = b.dataset.a;
      const f = fruitById(run.picked);
      pickScreen();
      return say(`${f.name}. ${f.friend}. ${f.hand}.`);
    }
    case 'pick-ok': {
      const f = fruitById(run.picked);
      data(k.id).chosen = { fruit: f.id, day: today() };
      save(k.id);
      run.step = 'end';
      endScreen();
      return say(`${f.name} is your fruit this week. The Holy Spirit will help you grow it, as you stay close to Jesus.`);
    }
    case 'keep': {
      data(k.id).chosen.day = today(); // a new week with the same fruit
      save(k.id);
      run.step = 'end';
      return endScreen();
    }
    case 'choose-new': run.picked = null; run.step = 'pick'; pickScreen(); return say('Which fruit would you like the Holy Spirit to grow in you? Tap any one.');
    case 'back-keep': run.step = 'keep'; return keepScreen();
    case 'finish': return closeOverlay(true);
    case 'night-say': { const f = fruitById(run.nightFruit); wiggle(b); return say(`${f.friend}. ${f.name}. How did ${f.lower} go today?`); }
    case 'goodnight': {
      saveNight();
      run.finished = true;
      say(`${REPLY} Goodnight, ${k.name}!`);
      return closeOverlay(true);
    }
  }
}

function toNightStars() {
  run.step = 'night';
  run.nightStars = 0;
  nightStarScreen();
  const f = fruitById(run.nightFruit);
  say(`How did ${f.lower} go today? Tap the stars.`);
}

// ---------- little bits of joy ----------

function wiggle(el) {
  if (!el) return;
  el.classList.remove('fr-wiggle');
  void el.offsetWidth;
  el.classList.add('fr-wiggle');
}

function burst(el) {
  if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('span');
    s.className = 'fr-spark';
    s.textContent = ['✨', '⭐', '🍓', '💛'][i % 4];
    const ang = (i / 12) * Math.PI * 2;
    s.style.left = `${r.left + r.width / 2}px`;
    s.style.top = `${r.top + r.height / 2}px`;
    s.style.setProperty('--dx', `${Math.cos(ang) * 140}px`);
    s.style.setProperty('--dy', `${Math.sin(ang) * 140}px`);
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }
}

// ---------- what the rest of the app calls ----------

// Morning "🍓 Fruit time": 3 cards, a 2-question quiz, then (after all 9) choosing or keeping their own fruit.
export function openFruitTime(k) {
  const set = todaysSet(k.id);
  const rec = dayRec(k.id);
  rec.set = set; // fixed for today, so the night uses the same 3
  save(k.id);
  const p = openOverlay(k, 'morning');
  Object.assign(run, { set, i: 0, stars: { ...(rec.morningStars || {}) }, step: 'card' });
  cardScreen();
  speakCard();
  return p;
}

// The free "Not today".
export function skipFruitToday(k) {
  dayRec(k.id).morning = 'skipped';
  save(k.id);
  onChange();
}

// Did the child grow? Tonight's stars for a fruit against the last night they rated that same fruit (as a share of
// the stars, so 3-star and 5-star nights compare fairly). { fruit, before, after, of } when tonight is higher, else null.
export function nightGrowth(kidId) {
  const d = data(kidId), t = today(), now = d.days[t]?.night;
  if (!now || !now.n) return null;
  const prev = Object.keys(d.days).filter((k) => k < t && d.days[k].night?.fruit === now.fruit && d.days[k].night.n).sort().pop();
  if (!prev) return null;
  const p = d.days[prev].night;
  return now.n / now.of > p.n / (p.of || now.of) ? { fruit: fruitById(now.fruit), before: p.n, after: now.n, of: now.of } : null;
}

export function nightFruitDone(kidId) {
  return !!data(kidId).days[today()]?.night;
}

// The night check-in. See the note at the top of this file.
// opts.fruit (25 Nov 2026, Joel): the fruit the child planned to work on today (🌱 plan). The quiz question and the
// star rating are both about it, so the fruit they worked on is always rated at night.
export function runNightFruit(k, opts = {}) {
  const set = nightSet(k.id);
  const p = openOverlay(k, 'night');
  if (!set) {
    // Never met a fruit yet: no quiz, just a gentle hello.
    run.step = 'none';
    draw(`<div class="fr-keep"><div class="fr-big-emoji">🍓</div>
      <h2>Tomorrow morning you can meet the Fruit Friends!</h2>
      <p class="fr-note">Tap 🍓 Fruit time after Ready, set, go.</p>
      <button class="fr-btn go huge" data-fr="finish">Goodnight 🌙</button></div>`);
    say(`Tomorrow morning you can meet the Fruit Friends! Goodnight, ${k.name}!`);
    return p;
  }
  // One question about this morning's fruits: a "which one is" or a "which picture shows", at random.
  const goal = opts.fruit && fruitById(opts.fruit) ? opts.fruit : null;
  const target = goal || set[Math.floor(Math.random() * set.length)];
  const qset = set.includes(target) ? set : [target, ...set.slice(0, 2)];
  run.quiz = [makeQuestion(Math.random() < 0.5 ? 'who' : 'pic', target, qset)];
  run.qi = 0;
  run.step = 'quiz';
  // The star question is about today's planned fruit, else the child's own fruit, else tonight's quiz fruit.
  run.nightFruit = goal || chosenFruit(k.id)?.id || target;
  quizScreen();
  askQuestion();
  return p;
}

// The morning tile under a child's jobs. Shown only until Fruit time is done (or "Not today") today.
export function fruitTileHTML(k) {
  const rec = data(k.id).days[today()];
  if (rec?.morning === 'done' || rec?.morning === 'skipped') return '';
  const first = fruitById(todaysSet(k.id)[0]);
  return `<div class="fruit-tile-row">
    <button class="fruit-tile" data-action="fruit-time" aria-label="Fruit time">
      <span class="fruit-tile-art">${first.art}</span><span><b>🍓 Fruit time</b><small>1 minute</small></span></button>
    <button class="fruit-skip" data-action="fruit-skip">Not today</button></div>`;
}

// The child's chosen Fruit Friend, small, at the top of their column all day.
export function fruitBadgeHTML(k) {
  const f = chosenFruit(k.id);
  if (!f) return '';
  return `<button class="fruit-badge" data-action="fruit-badge" aria-label="My fruit: ${f.name}">${f.art}</button>`;
}
export function sayBadge(k) {
  const f = chosenFruit(k.id);
  if (!f) return;
  quiet = false;
  say(`${k.name}'s fruit is ${f.lower}. ${f.friend}. ${f.hand}!`);
}

// TEMPORARY: the next developer replaces this with the "🌙 Going up!" button, which calls runNightFruit(kid).
export function nightFruitButtonHTML(k) {
  return nightFruitDone(k.id) ? '' : '<button class="fruit-night-btn" data-action="fruit-night">🍓 Night fruit</button>';
}

// ---------- grown-ups: 🍓 Fruit tab (one child at a time) ----------

export function fruitPortalHTML(k, esc = esc0) {
  const d = data(k.id);
  const mine = chosenFruit(k.id);
  const set = todaysSet(k.id).map(fruitById);
  const talk = mine || set[0];
  const fmt = (dk) => { const [y, m, dd] = dk.split('-').map(Number); return new Date(y, m - 1, dd).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }); };
  const recent = Object.keys(d.days).sort().reverse().slice(0, 7).map((dk) => {
    const r = d.days[dk];
    const morning = r.morning === 'skipped' ? '☀️ Not today'
      : r.morningStars && Object.keys(r.morningStars).length
        ? `☀️ ${Object.entries(r.morningStars).map(([fid, n]) => `${fruitById(fid).name} <span class="pf-stars">${starText(n, r.of || 5)}</span>`).join(' · ')}` : '';
    const night = r.night ? `🌙 ${fruitById(r.night.fruit).name} <span class="pf-stars">${starText(r.night.n, r.night.of)}</span>` : '';
    if (!morning && !night) return '';
    return `<div class="pf-day"><b>${fmt(dk)}</b><span>${[morning, night].filter(Boolean).join('<br>')}</span></div>`;
  }).join('');
  const until = mine ? (() => { const [y, m, dd] = d.chosen.day.split('-').map(Number); const t = new Date(y, m - 1, dd + WEEK_DAYS); return t.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' }); })() : '';
  return `<div class="portal-fruit" style="--kid:${k.color}">
    ${mine ? `<div class="pf-mine">${art(mine)}<div>
        <div class="pf-label">${esc(k.name)}'s fruit this week</div>
        <h3>${mine.name} <small>${esc(mine.word)} · ${esc(mine.friend)}</small></h3>
        <div class="pf-hand">✋ Hand action: <b>${esc(mine.hand)}</b></div>
        <div>📖 ${esc(mine.verse)}</div><div>💪 ${esc(mine.practice)}</div>
        <small>Chosen ${fmt(d.chosen.day)} · asks again on ${until}</small></div></div>`
    : `<div class="pf-mine none"><div><div class="pf-label">${esc(k.name)} hasn't picked a fruit yet</div>
        <p>Met ${Math.min(9, d.met)} of the 9 Fruit Friends. After all 9, ${esc(k.name)} picks any fruit as their own for a week.</p>
        <div>Today's fruits: ${set.map((f) => `<b>${f.name}</b> (✋ ${esc(f.hand)})`).join(', ')}</div></div></div>`}
    <h3>Ask at dinner or bedtime</h3>
    <div class="pf-q">🍽️ “Where did you see someone in our family show ${talk.lower} today?”</div>
    <div class="pf-q">🛏️ “Where did God help you with ${talk.lower} today? Let’s ask the Holy Spirit to grow it tomorrow.”</div>
    <h3>Recent stars</h3>
    ${recent || `<p>No fruit check-ins yet for ${esc(k.name)}.</p>`}
    <p class="pf-note">This is for a chat, not a score. Fewer stars just means that fruit is still growing.</p>
  </div>`;
}
