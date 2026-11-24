// 🌱 Growing (21 Nov 2026, Joel's reminders): memory verses, "where am I growing", a plan for tomorrow, and a
// 60-second "picture it" the next morning.
//
// One 🌱 button in each column's footer opens the child's growing sheet:
//   📖 Memory verse: a 1-minute game where words disappear one step at a time. Practising (all 4 steps) gives
//      🪙 1 once a day. After 3 days of practice a grown-up can hear the whole verse (PIN): ✓ = 🪙 10 and the next verse.
//   🌱 How I'm growing: the last 7 days of front-board moments a grown-up kept. The fruit with the most good moments
//      is "Growing", the fruit with the most hard moments is "Working on".
//   📝 Plan for tomorrow: pick a fruit (the "working on" one is suggested) and its small "I will" step. Also asked
//      before Build on the Rock opens after 3pm, so the plan is made before the stones are laid.
//   🌅 Picture it: the morning after a plan, 60 seconds with eyes closed seeing themselves live it out today.
//      Finishing sends a precious stone in that fruit's colour to Build on the Rock (once a day).
// Saved in IndexedDB as 'grow': { [kidId]: { verse, learned: [ids], practiced: {day: 1}, plans: {day: {fruit}}, pictured: {day: 1} } }

import { FRUITS, fruitById } from './fruits.js';
import { STORIES } from './stories.js';

// Kid wording (Joel's list, 21 Nov 2026). Change the words or order here; the game follows.
export const VERSES = [
  { id: 'fruit', ref: 'Galatians 5:22–23', text: 'The fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness and self-control.' },
  { id: 'complain', ref: 'Philippians 2:14', text: 'Do everything without complaining or arguing.' },
  { id: 'vine', ref: 'John 15:5', text: 'I am the vine; you are the branches. If you stay joined to me, you will bear much fruit.' },
  { id: 'fire', ref: '1 Corinthians 3:13', text: 'The fire will test what kind of work each one has done.' },
  { id: 'disciples', ref: 'Matthew 28:19–20', text: 'Go and make disciples of all nations. And surely I am with you always.' },
  { id: 'glory', ref: '2 Corinthians 3:18', text: 'With unveiled faces we all see the glory of the Lord, and we are being changed to be more like him.' },
  // 24 Nov 2026 (Joel's list): added at the end so nobody's place in the list moves.
  { id: 'earth', ref: 'Habakkuk 2:14', text: 'The earth will be filled with the knowledge of the glory of the Lord, as the waters cover the sea.' },
];
const STORY_COINS = 1;   // once a day, for listening to the story and answering the questions
const PRACTICE_COINS = 1;
const LEARNED_COINS = 10;
const DAYS_BEFORE_CHECK = 3;
const PICTURE_MS = 60000;

// Front-board moments (quick.js) -> the fruit they belong to.
const GEM_FRUIT = { l: 'love', j: 'joy', p: 'peace', t: 'patience', k: 'kindness', b: 'goodness', f: 'faithfulness', e: 'gentleness', r: 'selfcontrol' };
const HARD_FRUIT = { tantrum: 'selfcontrol', listen: 'faithfulness', unkind: 'kindness', rude: 'gentleness', fight: 'peace', disobeyed: 'faithfulness' };
const GEM_OF = Object.fromEntries(Object.entries(GEM_FRUIT).map(([g, f]) => [f, g]));

export function createGrow(ctx) {
  const { state, esc } = ctx;
  const all = () => (state.grow ||= {});
  const of = (id) => {
    const g = (all()[id] ||= {});
    g.verse ||= 0; g.learned ||= []; g.practiced ||= {}; g.plans ||= {}; g.pictured ||= {}; g.story ||= 0; g.storyDays ||= {};
    g.reviews ||= {}; g.reviewLater ||= null;
    return g;
  };
  const save = () => ctx.kvSet('grow', all());
  const dayAt = (offsetDays) => ctx.clock.dayKey(new Date(ctx.clock.now().getTime() + offsetDays * 86400000), state.settings.dayStartHour);
  const today = () => ctx.todayKey();
  const tomorrow = () => dayAt(1);
  const hour = () => ctx.clock.now().getHours();
  const verseOf = (id) => VERSES[Math.min(of(id).verse, VERSES.length - 1)];
  const allLearned = (id) => of(id).learned.length >= VERSES.length;
  const practiceDays = (id) => Object.keys(of(id).practiced).filter((d) => of(id).practiced[d] === verseOf(id).id).length;

  async function addCoins(id, n, why) {
    state.coinAdjust = [...(state.coinAdjust || []), { kidId: id, n, why, t: ctx.clock.now().toISOString() }];
    await ctx.kvSet('coinAdjust', state.coinAdjust);
    await ctx.refreshSummary();
  }

  // ---------- what to show on the 🌱 button ----------
  const goalToday = (id) => of(id).plans[today()];
  const needsPicture = (id) => !!goalToday(id) && !of(id).pictured[today()] && hour() < 15;
  const needsPlan = (id) => !of(id).plans[tomorrow()];
  function btnHTML(id) {
    const sub = needsPicture(id) ? '🌅 My goal' : hour() >= 15 && needsPlan(id) ? '📝 Plan' : of(id).practiced[today()] ? '✓ Verse' : '📖 Verse';
    return `<button class="pray-btn grow-btn ${needsPicture(id) || !of(id).practiced[today()] ? '' : 'resting'}" data-action="grow" aria-label="My growing">🌱<small>${sub}</small></button>`;
  }

  // ---------- 🌱 How I'm growing (last 7 days of kept front-board moments) ----------
  function growth(id) {
    const since = ctx.clock.now().getTime() - 7 * 86400000;
    const good = {}, hard = {};
    (state.quickLog || []).filter((q) => q.kidId === id && q.status === 'kept' && Date.parse(q.t) >= since).forEach((q) => {
      if (q.n > 0 && GEM_FRUIT[q.fruit]) good[GEM_FRUIT[q.fruit]] = (good[GEM_FRUIT[q.fruit]] || 0) + 1;
      if (q.n < 0 && HARD_FRUIT[q.kind]) hard[HARD_FRUIT[q.kind]] = (hard[HARD_FRUIT[q.kind]] || 0) + 1;
    });
    const top = (m) => Object.entries(m).sort((a, b) => b[1] - a[1])[0];
    const g = top(good), h = top(hard);
    return { growing: g && { fruit: fruitById(g[0]), n: g[1] }, working: h && { fruit: fruitById(h[0]), n: h[1] } };
  }

  // ---------- the growing sheet ----------
  function open(id) {
    const k = ctx.kid(id);
    ctx.unlockAudio();
    const draw = () => {
      const g = growth(id), v = verseOf(id), plan = goalToday(id), next = of(id).plans[tomorrow()];
      return `<h2>🌱 ${esc(k.name)}'s growing</h2>
        <div class="grow-cards">
          <div class="grow-card good"><small>🌱 Growing in</small><b>${g.growing ? `${esc(g.growing.fruit.name)}` : '—'}</b><small>${g.growing ? `${g.growing.n} good moment${g.growing.n === 1 ? '' : 's'} this week` : 'Good moments show up here'}</small></div>
          <div class="grow-card work"><small>💪 Working on</small><b>${g.working ? `${esc(g.working.fruit.name)}` : '—'}</b><small>${g.working ? `${g.working.n} hard moment${g.working.n === 1 ? '' : 's'} this week` : 'Nothing hard this week!'}</small></div>
        </div>
        ${plan ? `<div class="grow-goal"><small>🎯 My goal today</small><b>${esc(fruitById(plan.fruit).name)}</b><span>${esc(fruitById(plan.fruit).practice)}</span>
          ${of(id).pictured[today()] ? '<small>✓ Pictured it this morning</small>' : '<button class="farm-btn small ok" data-g="picture">🌅 Picture it (1 minute)</button>'}</div>` : ''}
        <div class="grow-actions">
          <button class="farm-btn" data-g="verse">📖 ${allLearned(id) ? 'All verses learned! Practise one' : `Memory verse <small>${esc(v.ref)}</small>`}</button>
          <button class="farm-btn" data-g="story">📜 ${of(id).storyDays[today()] ? 'Bible story ✓' : `Bible story <small>${esc(storyOf(id).title)}</small>`}</button>
          <button class="farm-btn" data-g="plan">📝 ${next ? `Tomorrow: ${esc(fruitById(next.fruit).name)} ✓` : 'Plan for tomorrow'}</button>
        </div>
        ${weeksHTML(id)}
        <div class="grow-actions"><button class="farm-btn" data-g="review">🗓️ My week${of(id).reviews[weekKey()] ? ' ✓' : ''}</button></div>
        <p class="pf-note">Verses learned: ${of(id).learned.length} of ${VERSES.length}</p>
        <button class="farm-btn small" data-g="close">Done</button>`;
    };
    const el = ctx.sheet(draw(), (e) => {
      const b = e.target.closest('[data-g]');
      if (!b) return;
      const w = b.dataset.g;
      el.remove();
      if (w === 'verse') return openVerse(id);
      if (w === 'story') return openStory(id);
      if (w === 'review') return openReview(id);
      if (w === 'plan') return openPlan(id);
      if (w === 'picture') return openPicture(id);
    });
    el.classList.add('grow-ov');
  }

  // ---------- 📖 Memory verse game ----------
  // Step 0: read it (read aloud). Steps 1-2: a third, then two thirds of the words hidden (tap a gap to peek).
  // Step 3: only first letters. Finishing step 3 is today's practice.
  function maskWords(text, step) {
    const words = text.split(' ');
    return words.map((w, i) => {
      const m = w.match(/^([^A-Za-z]*)([A-Za-z’']+)(.*)$/);
      if (!m) return esc(w);
      const [, pre, core, post] = m;
      const hide = step === 3 || (step === 1 && i % 3 === 1) || (step === 2 && i % 3 !== 0);
      if (!hide || step === 0) return esc(w);
      const shown = step === 3 ? core[0] + '_'.repeat(Math.max(1, core.length - 1)) : '_'.repeat(core.length);
      return `${esc(pre)}<button class="vw" data-peek="${esc(core)}">${shown}</button>${esc(post)}`;
    }).join(' ');
  }
  const STEP_SAY = ['Read it together, out loud.', 'Some words are hiding. Say the whole verse!', 'More words are hiding. Say it again!', 'Only the first letters now. You can do it!'];
  function openVerse(id, idx = null) {
    const k = ctx.kid(id), g = of(id);
    const v = idx != null ? VERSES[idx] : allLearned(id) ? VERSES[Math.floor(Math.random() * VERSES.length)] : verseOf(id);
    let step = 0;
    const draw = () => `<h2>📖 ${esc(v.ref)}</h2>
      <div class="verse-steps">${[0, 1, 2, 3].map((s) => `<i class="${s <= step ? 'on' : ''}"></i>`).join('')}</div>
      <p class="verse-say">${STEP_SAY[step]}</p>
      <div class="verse-text">${maskWords(v.text, step)}</div>
      <div class="verse-ref">${esc(v.ref)}</div>
      <div class="grow-actions">
        ${step === 0 ? '<button class="farm-btn" data-v="read">🔊 Read it to me</button>' : ''}
        <button class="farm-btn ok" data-v="next">${step < 3 ? 'I said it! Next ›' : '✓ I said it all!'}</button>
      </div>
      <button class="farm-btn small" data-v="close">Not now</button>`;
    ctx.speakFor(id, `${v.text} ${v.ref}.`);
    const el = ctx.sheet(draw(), async (e) => {
      const peek = e.target.closest('[data-peek]');
      if (peek) { peek.textContent = peek.dataset.peek; peek.classList.add('peeked'); return; }
      const b = e.target.closest('[data-v]');
      if (!b) return;
      const w = b.dataset.v;
      if (w === 'close') return el.remove();
      if (w === 'read') return ctx.speak(`${v.text} ${v.ref}.`, true);
      if (step < 3) { step++; el.querySelector('.farm-sheet').innerHTML = draw(); ctx.speakFor(id, STEP_SAY[step]); return; }
      el.remove();
      await practised(id, v);
    });
    el.classList.add('grow-ov');
  }
  async function practised(id, v) {
    const k = ctx.kid(id), g = of(id);
    const first = !g.practiced[today()];
    if (first) g.practiced[today()] = v.id;
    await save();
    if (first) await addCoins(id, PRACTICE_COINS, `📖 Verse practice (${v.ref})`);
    ctx.chime();
    ctx.renderKid();
    const learning = !allLearned(id) && v.id === verseOf(id).id;
    const ready = learning && practiceDays(id) >= DAYS_BEFORE_CHECK;
    ctx.speakFor(id, `Well done, ${k.name}!${ready ? ' Ask a grown-up to hear you say it all.' : ''}`);
    const el = ctx.sheet(`<div class="reveal-animal">📖</div><h2>Well done, ${esc(k.name)}!</h2>
      <p>${first ? `+ 🪙 ${PRACTICE_COINS} for practising today.` : 'Extra practice: brilliant!'}</p>
      ${learning ? `<p class="pf-note">${ready ? 'Ready? Say the whole verse to a grown-up, with no peeking.' : `Practise on ${DAYS_BEFORE_CHECK - practiceDays(id)} more day${DAYS_BEFORE_CHECK - practiceDays(id) === 1 ? '' : 's'}, then say it to a grown-up for 🪙 ${LEARNED_COINS}.`}</p>` : ''}
      <div class="grow-actions">${ready ? `<button class="farm-btn ok" data-x="check">🙋 Say it to a grown-up (🪙 ${LEARNED_COINS})</button>` : ''}
      <button class="farm-btn" data-x="close">OK</button></div>`, async (e) => {
      const b = e.target.closest('[data-x]');
      if (!b) return;
      el.remove();
      if (b.dataset.x === 'check') await grownUpCheck(id);
    });
  }
  async function grownUpCheck(id) {
    const k = ctx.kid(id), v = verseOf(id);
    if (!(await ctx.grownUp('hear the memory verse'))) return;
    const el = ctx.sheet(`<h2>🙋 ${esc(k.name)}: ${esc(v.ref)}</h2>
      <div class="verse-text">${esc(v.text)}</div>
      <p class="pf-note">Did ${esc(k.name)} say it all, with no peeking? A little help with one word is fine.</p>
      <div class="grow-actions"><button class="farm-btn ok" data-y="yes">✓ Said it all (🪙 ${LEARNED_COINS})</button><button class="farm-btn" data-y="no">↺ Nearly! Keep practising</button></div>`, async (e) => {
      const b = e.target.closest('[data-y]');
      if (!b) return;
      el.remove();
      if (b.dataset.y !== 'yes') { ctx.speakFor(id, 'Nearly there! Keep practising.'); return ctx.toast('📖 Nearly there! Keep practising.'); }
      const g = of(id);
      if (!g.learned.includes(v.id)) g.learned.push(v.id);
      g.verse = Math.min(VERSES.length, g.verse + 1);
      await save();
      await addCoins(id, LEARNED_COINS, `📖 Learned ${v.ref}`);
      ctx.chime();
      ctx.speakFor(id, `${k.name} learned ${v.ref}! ${LEARNED_COINS} coins!`);
      ctx.toast(`📖 ${esc(k.name)} learned ${esc(v.ref)}! +${LEARNED_COINS} 🪙`);
      ctx.renderKid();
    });
  }

  // ---------- 📈 Growing over the weeks + 🗓️ weekly review (24 Nov 2026, Joel) ----------
  // Shaped by docs/research-obey-kind-calm.md: wins first, the child compared only with their own past, "times calmed
  // down" going up rather than tantrums going down, one hard moment retold with what to try next time (no new
  // punishment), one focus for next week, a short prayer, then a small celebration.
  const REVIEW_COINS = 3;
  const NEXT_TIME = { tantrum: 'Breathe and pray: "Jesus, calm my heart."', listen: 'Stop, look and listen the first time.', unkind: 'Swap it for a kind word.',
    rude: 'Use a gentle voice.', fight: 'Walk away and get a grown-up.', disobeyed: 'Say "Yes!" and do it straight away.' };
  // A week ends on review day, so the review looks back over the week that is just finishing (e.g. Monday to Sunday).
  const weekKey = (ms = ctx.clock.now().getTime()) => {
    const start = ((state.settings.reviewDay ?? 0) + 1) % 7;
    const d = new Date(ms - (state.settings.dayStartHour || 3) * 3600000); d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() - start + 7) % 7));
    return ctx.clock.dayKey(d, 0);
  };
  // Kept front-board moments for this child in each of the last n weeks (oldest first).
  function weeks(id, n = 6) {
    const now = ctx.clock.now().getTime(), out = [];
    for (let w = n - 1; w >= 0; w--) {
      const key = weekKey(now - w * 7 * 86400000);
      const list = (state.quickLog || []).filter((q) => q.kidId === id && q.status === 'kept' && weekKey(Date.parse(q.t)) === key);
      out.push({ key, good: list.filter((q) => q.n > 0).length, calm: list.filter((q) => q.n > 0 && ['calm', 'obey', 'patient'].includes(q.kind)).length, hard: list.filter((q) => q.n < 0) });
    }
    return out;
  }
  function weeksHTML(id) {
    const ws = weeks(id), top = Math.max(1, ...ws.map((w) => w.good));
    if (!ws.some((w) => w.good)) return '';
    const best = ws[ws.length - 1].good > 0 && ws[ws.length - 1].good >= top;
    return `<div class="grow-weeks"><small>🌱 Good moments each week${best ? ' · 🏆 Best week yet!' : ''}</small>
      <div class="gw-bars">${ws.map((w, i) => `<div class="gw-bar${i === ws.length - 1 ? ' now' : ''}"><i style="height:${Math.round((w.good / top) * 100)}%"></i><b>${w.good}</b><span>${i === ws.length - 1 ? 'This' : `${ws.length - 1 - i}w`}</span></div>`).join('')}</div></div>`;
  }
  const reviewDue = (id) => {
    if (!state.settings) return false;
    const now = ctx.clock.now(), g = of(id);
    return now.getDay() === (state.settings.reviewDay ?? 0) && !g.reviews[weekKey()] && g.reviewLater !== today();
  };
  async function reviewLater(id) { of(id).reviewLater = today(); await save(); ctx.renderKid(); ctx.toast('🗓️ My week is in the 🌱 button when you\'re ready.'); }
  function openReview(id) {
    const k = ctx.kid(id), g = of(id);
    const ws = weeks(id), thisW = ws[ws.length - 1];
    const now = ctx.clock.now().getTime();
    const wins = (state.quickLog || []).filter((q) => q.kidId === id && q.status === 'kept' && q.n > 0 && Date.parse(q.t) >= now - 7 * 86400000).slice(-3).reverse();
    const hardCount = {};
    (state.quickLog || []).filter((q) => q.kidId === id && q.status === 'kept' && q.n < 0 && Date.parse(q.t) >= now - 7 * 86400000).forEach((q) => { hardCount[q.kind] = (hardCount[q.kind] || 0) + 1; });
    const hardTop = Object.entries(hardCount).sort((a, b) => b[1] - a[1])[0];
    const hardQ = hardTop && (state.quickLog || []).find((q) => q.kidId === id && q.kind === hardTop[0]);
    let step = 0, pick = growth(id).working?.fruit.id || null;
    const STEPS = 5;
    const say = [() => wins.length ? `Your wins this week. ${wins.map((w) => w.label).join('. ')}.` : 'This week is a fresh start!',
      () => `You're growing! ${thisW.good} good moments this week.`,
      () => hardQ ? `One hard thing: ${hardQ.label}. Next time I can: ${NEXT_TIME[hardQ.kind] || 'ask Jesus for help.'}` : 'No hard moments to talk about. Wonderful!',
      () => 'Which fruit will you grow next week?',
      () => `Let's pray. ${pick ? `Dear Jesus, please grow ${fruitById(pick).name.toLowerCase()} in me this week. Amen.` : 'Dear Jesus, thank you for this week. Amen.'}`];
    const draw = () => `<h2>🗓️ ${esc(k.name)}'s week <small>${step + 1} of ${STEPS}</small></h2>
      ${step === 0 ? `<p class="verse-say">⭐ Wins this week (a grown-up reads them out)</p>
        ${wins.length ? `<ul class="review-wins">${wins.map((w) => `<li>${w.icon} ${esc(w.label)}</li>`).join('')}</ul>` : '<p class="pf-note">No moments logged this week. A fresh start!</p>'}` : ''}
      ${step === 1 ? `<p class="verse-say">📈 You compared with you</p>${weeksHTML(id) || '<p class="pf-note">Your growing chart starts this week.</p>'}
        ${thisW.calm ? `<p class="pf-note">🧘 Calmed down, obeyed or waited well: ${thisW.calm} time${thisW.calm === 1 ? '' : 's'} this week.</p>` : ''}` : ''}
      ${step === 2 ? `<p class="verse-say">💪 One hard moment, and what to try next time</p>
        ${hardQ ? `<div class="grow-goal"><small>${hardQ.icon} ${esc(hardQ.label)}${hardTop[1] > 1 ? ` (${hardTop[1]} times)` : ''}</small><b>Next time I can…</b><span>${esc(NEXT_TIME[hardQ.kind] || 'Ask Jesus for help.')}</span></div>`
          : '<p class="pf-note">No hard moments kept this week. 🎉</p>'}<p class="pf-note">No new consequences here. Just a plan.</p>` : ''}
      ${step === 3 ? `<p class="verse-say">🎯 My fruit for next week</p>
        <div class="plan-fruits">${FRUITS.map((f) => `<button class="${f.id === pick ? 'on' : ''}" data-f="${f.id}">${f.art}<b>${esc(f.name)}</b></button>`).join('')}</div>` : ''}
      ${step === 4 ? `<p class="verse-say">🙏 Pray together</p><div class="verse-text">Dear Jesus, thank you for this week.${pick ? ` Please grow ${esc(fruitById(pick).name.toLowerCase())} in me.` : ''} Amen.</div>
        ${pick ? `<div class="verse-ref">${esc(fruitById(pick).verse)}</div>` : ''}` : ''}
      <div class="grow-actions">${step > 0 ? '<button class="farm-btn" data-r="back">‹ Back</button>' : ''}
        <button class="farm-btn ok" data-r="next" ${step === 3 && !pick ? 'disabled' : ''}>${step < STEPS - 1 ? 'Next ›' : `Amen! 🎉 (🪙 ${REVIEW_COINS})`}</button></div>
      <button class="farm-btn small" data-r="close">Later</button>`;
    ctx.unlockAudio();
    ctx.speakFor(id, say[0]());
    const el = ctx.sheet(draw(), async (e) => {
      const f = e.target.closest('[data-f]');
      if (f) { pick = f.dataset.f; el.querySelector('.farm-sheet').innerHTML = draw(); ctx.speakFor(id, fruitById(pick).name); return; }
      const b = e.target.closest('[data-r]');
      if (!b) return;
      const w = b.dataset.r;
      if (w === 'close') { el.remove(); g.reviewLater = today(); await save(); return ctx.renderKid(); }
      if (w === 'back') step = Math.max(0, step - 1);
      else if (step < STEPS - 1) step++;
      else {
        el.remove();
        const first = !g.reviews[weekKey()];
        g.reviews[weekKey()] = { t: ctx.clock.now().toISOString(), focus: pick, good: thisW.good };
        Object.keys(g.reviews).sort().slice(0, -26).forEach((d) => delete g.reviews[d]);
        if (pick) g.weekFocus = { fruit: pick, week: weekKey() };
        await save();
        if (first) await addCoins(id, REVIEW_COINS, '🗓️ Weekly review');
        ctx.chime();
        ctx.speakFor(id, `Amen! Well done, ${k.name}! Have a great week.`);
        ctx.toast(`🗓️ ${esc(k.name)}'s week done!${first ? ` +${REVIEW_COINS} 🪙` : ''}`);
        return ctx.renderKid();
      }
      el.querySelector('.farm-sheet').innerHTML = draw();
      ctx.speakFor(id, say[step]());
    });
    el.classList.add('grow-ov');
  }

  // ---------- 📜 Bible story + quiz (24 Nov 2026) ----------
  // Read the story (read aloud line by line), then 3 questions: only the first tap counts, a miss shows the right answer,
  // and it always moves on. Finishing gives 🪙 1 once a day and moves to the next story tomorrow.
  const storyOf = (id) => STORIES[of(id).story % STORIES.length];
  const shuffle = (a) => a.map((x) => [Math.random(), x]).sort((p, q) => p[0] - q[0]).map((p) => p[1]);
  function openStory(id) {
    const k = ctx.kid(id), g = of(id), st = storyOf(id);
    let phase = 'read', qi = 0, right = 0, picked = null, order = [];
    const ask = () => { order = shuffle(st.qs[qi].a.map((t, i) => ({ t, ok: i === 0 }))); picked = null; ctx.speakFor(id, `${st.qs[qi].q} ${order.map((o) => o.t).join('. Or, ')}?`); };
    const draw = () => phase === 'read'
      ? `<h2>${st.icon} ${esc(st.title)}</h2><div class="story-text">${st.lines.map((l) => `<p>${esc(l)}</p>`).join('')}</div>
        <div class="verse-ref">${esc(st.ref)} · read it together in your Bible</div>
        <div class="grow-actions"><button class="farm-btn" data-s="read">🔊 Read it to me</button><button class="farm-btn ok" data-s="quiz">Questions ›</button></div>
        <button class="farm-btn small" data-s="close">Not now</button>`
      : phase === 'quiz'
        ? `<h2>${st.icon} Question ${qi + 1} of ${st.qs.length}</h2><p class="verse-say">${esc(st.qs[qi].q)}</p>
          <div class="story-answers">${order.map((o, i) => `<button data-a="${i}" class="${picked == null ? '' : o.ok ? 'right' : i === picked ? 'wrong' : 'dim'}" ${picked == null ? '' : 'disabled'}>${esc(o.t)}</button>`).join('')}</div>
          ${picked != null ? `<div class="grow-actions"><button class="farm-btn ok" data-s="next">${qi + 1 < st.qs.length ? 'Next ›' : 'Finish ✓'}</button></div>` : ''}`
        : `<div class="reveal-animal">${st.icon}</div><h2>Well done, ${esc(k.name)}!</h2><p>${right} of ${st.qs.length} right. 🪙 ${STORY_COINS} for today's story.</p>
          <p class="pf-note">${esc(st.title)} · ${esc(st.ref)}</p><div class="grow-actions"><button class="farm-btn" data-s="close">OK</button></div>`;
    ctx.speakFor(id, `${st.title}. ${st.lines.join(' ')}`);
    const el = ctx.sheet(draw(), async (e) => {
      const a = e.target.closest('[data-a]');
      if (a && picked == null) {
        picked = Number(a.dataset.a);
        const ok = order[picked].ok;
        if (ok) { right++; ctx.chime(); ctx.speakFor(id, 'Yes! That\'s right.'); }
        else ctx.speakFor(id, `It was: ${order.find((o) => o.ok).t}`);
        el.querySelector('.farm-sheet').innerHTML = draw();
        return;
      }
      const b = e.target.closest('[data-s]');
      if (!b) return;
      const w = b.dataset.s;
      if (w === 'close') { el.remove(); return ctx.renderKid(); }
      if (w === 'read') return ctx.speak(`${st.title}. ${st.lines.join(' ')}`, true);
      if (w === 'quiz') { phase = 'quiz'; qi = 0; ask(); }
      else if (w === 'next') {
        if (qi + 1 < st.qs.length) { qi++; ask(); }
        else {
          phase = 'done';
          const first = !g.storyDays[today()];
          if (first) { g.storyDays[today()] = st.id; g.story++; Object.keys(g.storyDays).sort().slice(0, -30).forEach((d) => delete g.storyDays[d]); }
          await save();
          if (first) await addCoins(id, STORY_COINS, `📜 Bible story: ${st.title}`);
          ctx.speakFor(id, `Well done, ${k.name}! ${right} out of ${st.qs.length}.`);
        }
      }
      el.querySelector('.farm-sheet').innerHTML = draw();
    });
    el.classList.add('grow-ov');
  }

  // ---------- 📝 Plan for tomorrow ----------
  function openPlan(id, then = null) {
    const k = ctx.kid(id), g = of(id);
    const sugg = growth(id).working?.fruit.id;
    let pick = g.plans[tomorrow()]?.fruit || sugg || null;
    const draw = () => `<h2>📝 ${esc(k.name)}'s plan for tomorrow</h2>
      <p class="verse-say">Which fruit will you grow tomorrow?${sugg ? ` <small>(💪 you're working on ${esc(fruitById(sugg).name)})</small>` : ''}</p>
      <div class="plan-fruits">${FRUITS.map((f) => `<button class="${f.id === pick ? 'on' : ''}" data-f="${f.id}">${f.art}<b>${esc(f.name)}</b></button>`).join('')}</div>
      ${pick ? `<div class="grow-goal"><small>I will…</small><span>${esc(fruitById(pick).practice)}</span></div>` : ''}
      <div class="grow-actions"><button class="farm-btn ok" data-p="save" ${pick ? '' : 'disabled'}>✓ That's my plan${then ? ' · then build' : ''}</button>
      <button class="farm-btn small" data-p="skip">${then ? 'Skip, just build' : 'Not now'}</button></div>`;
    ctx.speakFor(id, 'Which fruit will you grow tomorrow?');
    const el = ctx.sheet(draw(), async (e) => {
      const f = e.target.closest('[data-f]');
      if (f) { pick = f.dataset.f; el.querySelector('.farm-sheet').innerHTML = draw(); ctx.speakFor(id, `${fruitById(pick).name}. I will: ${fruitById(pick).practice}`); return; }
      const b = e.target.closest('[data-p]');
      if (!b) return;
      el.remove();
      if (b.dataset.p === 'save' && pick) {
        g.plans[tomorrow()] = { fruit: pick, t: ctx.clock.now().toISOString() };
        // keep the last 30 plans
        Object.keys(g.plans).sort().slice(0, -30).forEach((d) => delete g.plans[d]);
        await save();
        ctx.chime();
        ctx.toast(`📝 Tomorrow ${esc(k.name)} grows ${esc(fruitById(pick).name)}. Picture it in the morning!`);
        ctx.renderKid();
      }
      if (then) then();
    });
    el.classList.add('grow-ov');
  }

  // ---------- 🌅 Picture it (60 seconds) ----------
  const PICTURE_SAY = [
    'Close your eyes. Picture today.',
    'Where are you? Who is with you?',
    'See yourself doing it. What do you say? What do you do?',
    'How does it feel? Ask Jesus to help you today.',
  ];
  function openPicture(id) {
    const k = ctx.kid(id), plan = goalToday(id);
    if (!plan) return;
    const f = fruitById(plan.fruit);
    const start = Date.now();
    let said = -1, timer = null;
    const el = ctx.sheet(`<h2>🌅 ${esc(k.name)}'s goal today</h2>
      <div class="grow-goal"><b>${esc(f.name)}</b><span>${esc(f.practice)}</span></div>
      <div class="picture-ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="52" class="pr-bg"/><circle cx="60" cy="60" r="52" class="pr-fg" pathLength="100"/></svg><b class="pr-num">60</b></div>
      <p class="verse-say pr-say">${PICTURE_SAY[0]}</p>
      <div class="grow-actions"><button class="farm-btn ok" data-q="done" disabled>✓ I can see it!</button><button class="farm-btn small" data-q="close">Not now</button></div>`, async (e) => {
      const b = e.target.closest('[data-q]');
      if (!b) return;
      clearInterval(timer);
      el.remove();
      if (b.dataset.q !== 'done') return;
      const g = of(id);
      if (g.pictured[today()]) return;
      g.pictured[today()] = 1;
      await save();
      ctx.sendToRock(id, { kind: 'gem', fruit: GEM_OF[f.id] || 'l', label: `Pictured my goal: ${f.name}`, from: 'goal' });
      ctx.chime();
      ctx.speakFor(id, `Go for it, ${k.name}! A precious stone for your building.`);
      ctx.toast(`🌅 Go for it! 💎 A precious stone for ${esc(k.name)}'s building`);
      ctx.renderKid();
    });
    el.classList.add('grow-ov');
    ctx.speakFor(id, `Your goal today is ${f.name}. ${f.practice} ${PICTURE_SAY[0]}`);
    timer = setInterval(() => {
      if (!el.isConnected) return clearInterval(timer);
      const ms = ctx.fast() ? (Date.now() - start) * 20 : Date.now() - start;
      const left = Math.max(0, Math.ceil((PICTURE_MS - ms) / 1000));
      el.querySelector('.pr-num').textContent = left;
      el.querySelector('.pr-fg').style.strokeDashoffset = String(Math.min(100, (ms / PICTURE_MS) * 100));
      const step = Math.min(PICTURE_SAY.length - 1, Math.floor(ms / (PICTURE_MS / PICTURE_SAY.length)));
      if (step !== said) { said = step; el.querySelector('.pr-say').textContent = PICTURE_SAY[step]; if (step) ctx.speakFor(id, PICTURE_SAY[step]); }
      if (left <= 0) {
        clearInterval(timer);
        el.querySelector('[data-q="done"]').disabled = false;
        el.querySelector('.pr-say').textContent = 'Open your eyes. You can do it today!';
        ctx.speakFor(id, 'Open your eyes. You can do it today!');
      }
    }, 250);
  }

  // Before Build on the Rock (after 3pm): make tomorrow's plan first, then build.
  function beforeRock(id, go) {
    if (hour() >= 15 && needsPlan(id)) return openPlan(id, go);
    go();
  }

  return { btnHTML, open, openVerse, openPlan, openPicture, beforeRock, growth, of, reviewDue, openReview, reviewLater };
}
