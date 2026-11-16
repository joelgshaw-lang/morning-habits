// Farm animals in the "Sticker Plus" look: thick dark outline, white sticker edge, bright flat colours,
// big shiny eyes and a little life of their own (breathing, blinking, wagging). Inline SVG, no image files.
// Every CSS class, id and keyframe starts with "fa-" so nothing clashes with the rest of the app.
// The CSS is put on the page once, the first time this file is imported, so it works offline with no extra file.
//
//   animalArt(type, isGrown, wool = 0, mood = 'happy')  -> '<svg class="art ...">'   mood: happy | hungry | sleepy
//   snakeArt()                                          -> the big grown snake for the hatch moment
//   goldenArt(type, mood)                               -> rare sparkly version (golden hen, rainbow sheep, others just sparkle)
//   eggArt()                                            -> a wobbling mystery egg (also used for an unknown type)
//
// Drawing space is 120 x 120 with the feet on y = 106; the viewBox is shifted down a little so feet sit near the
// bottom of the box like the old art did.

const INK = '#2d1f17';
const VIEW = '0 -6 120 120';
const MOODS = ['happy', 'hungry', 'sleepy'];
let uid = 0;
let dl = 0;
const r1 = (n) => Math.round(n * 10) / 10;

// ---------- the CSS (added to the page once) ----------
const CSS = `
svg.fa{overflow:visible}
.fa .fa-k{stroke:${INK};stroke-width:3;stroke-linejoin:round;stroke-linecap:round}
.fa .fa-babyg .fa-k{stroke-width:3.8}
.fa .fa-think .fa-k{stroke-width:1.8}
.fa .fa-hb,.fa .fa-body,.fa .fa-tail,.fa .fa-ear,.fa .fa-wing,.fa .fa-arm,.fa .fa-blink,.fa .fa-wink,.fa .fa-z,.fa .fa-think,.fa .fa-drool,.fa .fa-spark,.fa .fa-snot,.fa .fa-tongue,.fa .fa-idle,.fa .fa-eggwob{animation-delay:var(--fa-dl,0s);animation-iteration-count:infinite;animation-timing-function:ease-in-out}
.fa .fa-hb{animation-name:fa-bob;animation-duration:3.2s}
.fa-hen .fa-hb{animation-name:fa-peck;animation-duration:4.2s}
.fa-duck .fa-hb{animation-name:fa-wobble;animation-duration:1.9s}
.fa-cow .fa-hb{animation-name:fa-sway;animation-duration:4.6s}
.fa-croc .fa-hb{animation-duration:4.8s}
.fa-dino .fa-hb,.fa-lizard .fa-hb{animation-name:fa-nod;animation-duration:2.6s}
.fa-snake .fa-hb{animation-name:fa-sway;animation-duration:3s}
.fa.fa-m-sleepy .fa-hb{animation-name:fa-doze;animation-duration:5s}
.fa .fa-body{animation-name:fa-breathe;animation-duration:3s}
.fa.fa-m-sleepy .fa-body{animation-duration:5s}
.fa.fa-m-hungry .fa-body{animation-name:fa-grumble;animation-duration:3.4s}
.fa .fa-tail{animation-name:fa-wag;animation-duration:var(--fa-wt,2s)}
.fa.fa-m-sleepy .fa-tail{animation-duration:6s}
.fa .fa-ear{animation-name:fa-flick;animation-duration:5s}
.fa .fa-ear-r{animation-delay:calc(var(--fa-dl,0s) - 2.3s)}
.fa .fa-wing{animation-name:fa-wingrest;animation-duration:3s}
.fa .fa-arm{animation-name:fa-armwave;animation-duration:2.2s}
.fa .fa-blink,.fa .fa-wink{transform-box:fill-box;transform-origin:center;animation-timing-function:linear}
.fa .fa-blink{animation-name:fa-blink;animation-duration:4.4s}
.fa .fa-wink{animation-name:fa-wink;animation-duration:6.5s}
.fa .fa-woke{opacity:0}
.fa .fa-z{animation-name:fa-z;animation-duration:3s;animation-timing-function:ease-out;opacity:0}
.fa .fa-think{animation-name:fa-float;animation-duration:2.4s}
.fa .fa-drool{transform-box:fill-box;transform-origin:50% 0;animation-name:fa-drip;animation-duration:2.6s}
.fa .fa-snot{transform-box:fill-box;transform-origin:85% 85%;animation-name:fa-snotgrow;animation-duration:3.4s}
.fa .fa-spark{transform-box:fill-box;transform-origin:center;animation-name:fa-twinkle;animation-duration:2.2s}
.fa .fa-tongue{animation-name:fa-tongue;animation-duration:2.6s}
.fa .fa-eggwob{animation-name:fa-eggwob;animation-duration:3.6s}
.fa .fa-idle{transform-box:fill-box;transform-origin:50% 100%}
.fa .fa-idle-bob{animation-name:fa-nbob;animation-duration:2.8s}
.fa .fa-idle-sway{animation-name:fa-nsway;animation-duration:4s}
.fa .fa-idle-breathe{animation-name:fa-nbreathe;animation-duration:3.6s}
.fa .fa-idle-float{animation-name:fa-nfloat;animation-duration:3.4s}
.fa .fa-idle-glide{animation-name:fa-nglide;animation-duration:4.4s;transform-origin:50% 50%}
.fa.fa-m-sleepy .fa-idle{animation-duration:6s}
@keyframes fa-bob{0%,100%{transform:rotate(0)}50%{transform:rotate(-3deg) translateY(-1px)}}
@keyframes fa-peck{0%,55%,100%{transform:rotate(0)}60%,64%{transform:rotate(-7deg)}69%,74%{transform:rotate(3deg)}80%{transform:rotate(0)}}
@keyframes fa-wobble{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
@keyframes fa-sway{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(4deg) translateY(1px)}}
@keyframes fa-nod{0%,100%{transform:rotate(0)}30%{transform:rotate(-5deg)}60%{transform:rotate(2deg)}}
@keyframes fa-doze{0%,100%{transform:rotate(0)}50%{transform:rotate(4deg) translateY(1.5px)}}
@keyframes fa-breathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.02,1.045)}}
@keyframes fa-grumble{0%,58%,100%{transform:scale(1,1)}62%{transform:scale(1.03,.97) translateX(-1px)}66%{transform:scale(.98,1.03) translateX(1px)}70%{transform:scale(1.03,.97) translateX(-1px)}76%{transform:scale(1,1)}}
@keyframes fa-wag{0%,100%{transform:rotate(calc(var(--fa-wag,8deg) * -1))}50%{transform:rotate(var(--fa-wag,8deg))}}
@keyframes fa-flick{0%,76%,100%{transform:rotate(0)}80%{transform:rotate(var(--fa-fl,-22deg))}84%{transform:rotate(0)}88%{transform:rotate(calc(var(--fa-fl,-22deg) * .5))}92%{transform:rotate(0)}}
@keyframes fa-wingrest{0%,100%{transform:rotate(0)}50%{transform:rotate(-5deg)}}
@keyframes fa-armwave{0%,100%{transform:rotate(0)}50%{transform:rotate(-16deg)}}
@keyframes fa-blink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.08)}}
@keyframes fa-wink{0%,84%,100%{transform:scaleY(1)}87%,93%{transform:scaleY(.08)}}
@keyframes fa-z{0%{opacity:0;transform:translate(0,0)}20%{opacity:1}100%{opacity:0;transform:translate(9px,-20px)}}
@keyframes fa-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-2.5px)}}
@keyframes fa-drip{0%,30%{transform:scaleY(.4);opacity:1}75%{transform:scaleY(1.3);opacity:1}100%{transform:translateY(9px) scaleY(1);opacity:0}}
@keyframes fa-snotgrow{0%,100%{transform:scale(.35)}50%{transform:scale(1.15)}}
@keyframes fa-twinkle{0%,100%{transform:scale(0) rotate(0);opacity:0}50%{transform:scale(1) rotate(45deg);opacity:1}}
@keyframes fa-tongue{0%,62%,100%{transform:scaleY(0)}68%,74%{transform:scaleY(1)}71%{transform:scaleY(.6)}}
@keyframes fa-eggwob{0%,58%,100%{transform:rotate(0)}64%{transform:rotate(-8deg)}70%{transform:rotate(7deg)}76%{transform:rotate(-5deg)}82%{transform:rotate(3deg)}88%{transform:rotate(0)}}
@keyframes fa-nbob{0%,100%{transform:translateY(0) scale(1,1)}50%{transform:translateY(-2px) scale(1.02,.98)}}
@keyframes fa-nsway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}
@keyframes fa-nbreathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.03,.975)}}
@keyframes fa-nfloat{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-5px) rotate(1deg)}}
@keyframes fa-nglide{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-4px) rotate(4deg)}}
@media (prefers-reduced-motion:reduce){.fa *{animation:none!important}.fa .fa-z{opacity:1}.fa .fa-tongue{transform:scaleY(1)}}
`;
(function addCSS() {
  if (typeof document === 'undefined' || document.getElementById('fa-css')) return;
  const s = document.createElement('style');
  s.id = 'fa-css';
  s.textContent = CSS;
  (document.head || document.documentElement).appendChild(s);
})();

// ---------- tiny drawing kit (shapes with class fa-k get the dark outline) ----------
const P = (d, fill, ex = '') => `<path d="${d}" fill="${fill}" class="fa-k"${ex}/>`;
const F = (d, fill, ex = '') => `<path d="${d}" fill="${fill}"${ex}/>`;
const E = (cx, cy, rx, ry, fill, ex = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" class="fa-k"${ex}/>`;
const EF = (cx, cy, rx, ry, fill, ex = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}"${ex}/>`;
const C = (cx, cy, r, fill, ex = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" class="fa-k"${ex}/>`;
const CF = (cx, cy, r, fill, ex = '') => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${ex}/>`;
const R = (x, y, w, h, rx, fill, ex = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" class="fa-k"${ex}/>`;
const L = (d, col = INK, w = 3, ex = '') => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${ex}/>`;
const legs = (d, col, w) => L(d, INK, w + 3.6) + L(d, col, w);
const grp = (cls, o, inner, vars = '') => `<g class="${cls}" style="transform-origin:${o[0]}px ${o[1]}px;${vars}">${inner}</g>`;
const at = (x, y, rot, s, inner) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">${inner}</g>`;
const cheeks = (pts, rx = 4.6, ry = 2.8) => pts.map(([x, y]) => EF(x, y, rx, ry, '#ff6f91', ' opacity=".6"')).join('');
function cloud(cx, cy, rx, ry, n, r) {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const x = r1(cx + rx * Math.cos(a)), y = r1(cy + ry * Math.sin(a));
    d += i === 0 ? `M${x} ${y}` : ` A${r} ${r} 0 0 1 ${x} ${y}`;
  }
  return d + 'Z';
}

// Eyes: open (happy), big pleading with worried brows (hungry), shut (sleepy).
function eyes(sp, mood) {
  const open = (big) => sp.pts.map(([x, y], i) => {
    const s = sp.s * (big ? 1.14 : 1);
    const [lx, ly] = big ? (sp.white ? [0.8, -s * .3] : [0, 0]) : (sp.look ? sp.look[i] : [0, 0]);
    let g;
    if (sp.white) {
      g = E(x, y, r1(s * .84), r1(s), '#fff', ' style="stroke-width:2.4"') + CF(r1(x + lx), r1(y + ly), r1(s * .52), INK)
        + CF(r1(x + lx + s * .2), r1(y + ly - s * .22), r1(s * (big ? .25 : .18)), '#fff');
    } else {
      g = EF(x, y, r1(s * .74), r1(s), INK) + CF(r1(x + s * .24 + lx), r1(y - s * .36 + ly), r1(s * (big ? .42 : .32)), '#fff')
        + CF(r1(x - s * .22), r1(y + s * .42), r1(s * (big ? .2 : .14)), '#fff');
    }
    if (!big && sp.lid && sp.lid[i]) {
      const rx = sp.white ? s * .84 : s * .74, ry = s, k = s * (sp.lidK || .1);
      const w = rx * Math.sqrt(1 - (k / ry) ** 2);
      g += `<path d="M${r1(x - w)} ${r1(y - k)} A${r1(rx)} ${r1(ry)} 0 0 1 ${r1(x + w)} ${r1(y - k)}Z" fill="${sp.lid[i]}" class="fa-k" style="stroke-width:2.2"/>`;
    }
    return `<g class="${sp.wink === i ? 'fa-wink' : 'fa-blink'}">${g}</g>`;
  }).join('');
  if (mood === 'sleepy') {
    return sp.pts.map(([x, y]) => L(`M${r1(x - sp.s * .85)} ${y} Q${x} ${r1(y + sp.s * .9)} ${r1(x + sp.s * .85)} ${y}`, sp.shut || INK, 2.6)).join('');
  }
  if (mood === 'hungry') {
    const brows = sp.pts.map(([x, y], i) => {
      const s = sp.s;
      return i === 0 ? L(`M${r1(x - s * .9)} ${r1(y - s * 1.35)} L${r1(x + s * .7)} ${r1(y - s * 1.85)}`, sp.shut || INK, 2.4)
        : L(`M${r1(x - s * .7)} ${r1(y - s * 1.85)} L${r1(x + s * .9)} ${r1(y - s * 1.35)}`, sp.shut || INK, 2.4);
    }).join('');
    return open(true) + brows;
  }
  return open(false) + (sp.extra || '');
}

// Head and body wrappers: a still "pose" for the mood, then a moving group inside it.
function head(o, pivot, inner) {
  const [px, py] = pivot;
  const pose = { happy: o.happyPose || 0, hungry: -4, sleepy: o.sleepyPose == null ? 9 : o.sleepyPose }[o.mood] || 0;
  let t = `rotate(${pose} ${px} ${py})` + (o.mood === 'sleepy' ? ' translate(0 3)' : '');
  if (o.baby && o.baby.head) t += ` translate(${px} ${py}) scale(${o.baby.head}) translate(${-px} ${-py})`;
  return `<g transform="${t}">${grp('fa-hb', pivot, inner)}</g>`;
}
const body = (cx, inner) => grp('fa-body', [cx, 104], inner);
const drool = (x, y) => F(`M${x} ${y} C ${x - 2.4} ${y + 4}, ${x - 2.4} ${y + 7}, ${x} ${y + 7} C ${x + 2.4} ${y + 7}, ${x + 2.4} ${y + 4}, ${x} ${y}Z`, '#a9e2ff', ` class="fa-drool" stroke="${INK}" stroke-width="1.4"`);
// A bit of eggshell worn like a cap, for hatchlings.
const CAP = P('M-16 4 C -16 -14, 16 -14, 16 4 L 12 0 L 8 6 L 4 0 L 0 6 L -4 0 L -8 6 L -12 0 Z', '#fff8ec') + CF(-6, -5, 1.8, '#c7b6ff') + CF(5, -7, 2.2, '#c7b6ff');

// ---------- farm animals ----------
function hen(o) {
  const p = o.pal, m = o.mood, b = !!o.baby;
  const tail = grp('fa-tail', [86, 80], P('M80 78 C 81 60, 89 45, 99 39 C 105 45, 99 63, 90 80 Z', p.tail2)
    + P('M83 80 C 91 63, 103 52, 113 51 C 116 60, 105 73, 90 84 Z', p.tail) + P('M86 85 C 96 76, 109 71, 117 73 C 116 82, 103 88, 90 90 Z', p.tail2)
    + L('M85 74 C 89 62, 94 52, 98 45 M88 80 C 96 70, 104 61, 110 56 M91 86 C 99 81, 107 78, 113 76', p.wingLine, 1.6), '--fa-wag:5deg;--fa-wt:2.6s');
  const lg = legs('M54 92 V104 M48.5 106 L54 103 L59.5 106 M68 92 V104 M62.5 106 L68 103 L73.5 106', p.leg, 3.4);
  const bd = body(62, P('M32 68 C 32 52, 48 46, 62 50 C 80 54, 93 64, 93 79 C 93 94, 79 101, 62 101 C 44 101, 32 90, 32 68 Z', p.body)
    + L('M38 77 q4 3 8 0 M37 85 q4 3 8 0 M43 93 q4 3 8 0', p.shade, 2)
    + grp('fa-wing', [62, 72], P('M58 72 C 68 62, 87 66, 87 79 C 87 91, 72 95, 62 89 C 68 84, 62 79, 58 72 Z', p.wing) + L('M67 81 q8 2 14 -2 M66 87 q6 1 12 -2', p.wingLine, 2)));
  const comb = b ? P('M40 23 C 37 14, 44 11, 45 18 C 47 11, 54 13, 50 22 Z', p.body)
    : P('M30 28 C 26 16, 36 11, 40 21 C 40 7, 53 7, 51 21 C 57 13, 66 19, 57 29 Z', p.comb);
  const beak = m === 'hungry'
    ? F('M45 44 L 30 47 L 45 52 Z', '#7a2b2b') + P('M46 40.5 L 27 45 L 46 47.5 Q 49 44 46 40.5 Z', p.beak) + P('M45 49.5 L 31 51 L 44 56 Q 47 52.5 45 49.5 Z', p.beak) + drool(36, 56)
    : P('M46 41.5 L 28 47.5 L 46 53 Q 50 47 46 41.5 Z', p.beak) + L('M31 47.5 L 42 47.5', INK, 1.4);
  const hd = head(o, [48, 60], comb + C(44, 40, 20, p.body) + (b ? '' : P('M38 52 C 33 59, 38 66, 42 61 C 44 58, 43 54, 38 52 Z', p.comb))
    + cheeks([[28, 44], [58, 46]]) + eyes({ pts: [[35, 36], [51, 35]], s: 5.4 }, m) + beak);
  return tail + lg + bd + hd;
}

function duck(o) {
  const p = o.pal, m = o.mood;
  const tail = grp('fa-tail', [92, 74], P('M86 76 C 94 70, 99 62, 106 52 C 109 64, 106 76, 94 84 Z', p.body), '--fa-wag:12deg;--fa-wt:1.1s');
  const lg = legs('M52 94 V102 M68 94 V102', p.leg, 3.4) + E(47, 104, 9, 3.6, p.leg) + E(72, 104, 9, 3.6, p.leg);
  const bd = body(62, P('M34 52 C 33 62, 34 70, 40 76 L 58 72 C 54 66, 54 60, 56 54 Z', p.body)
    + P('M28 82 C 28 68, 42 63, 56 65 C 72 67, 84 66, 94 68 C 101 74, 99 88, 91 94 C 83 101, 68 103, 55 103 C 39 103, 28 95, 28 82 Z', p.body)
    + grp('fa-wing', [60, 76], P('M56 78 C 64 70, 84 71, 87 81 C 86 91, 72 94, 61 90 C 65 86, 61 82, 56 78 Z', p.wing) + L('M66 84 q8 2 14 -2', p.wingLine, 2)));
  const bill = m === 'hungry'
    ? F('M45 47 C 34 48, 20 47, 15 46 L 18 56 C 30 57, 40 55, 46 52 Z', '#8a2f3a') + P('M46 43 C 34 38, 18 38, 13 44 C 15 48, 30 49.5, 46 48.5 Z', p.bill)
      + P('M45 51 C 34 53, 23 55, 18 56 C 23 62, 38 62, 46 56 Z', p.bill) + drool(26, 60)
    : P('M46 43 C 34 39, 18 40, 15 47 C 15 53, 30 58, 46 53 Z', p.bill) + L('M18 48.5 C 26 52, 38 51, 45 48', INK, 2) + CF(24, 44, 1.3, INK);
  const curl = 'M45 24 C 43 15, 50 10, 54 14 C 57 17, 54 21, 51 19';
  const hd = head(o, [46, 64], L(curl, INK, 7) + L(curl, p.body, 3.2) + C(45, 42, 20, p.body)
    + cheeks([[59, 47]]) + eyes({ pts: [[38, 36], [53, 35]], s: 5.2, look: [[-1, .6], [1.2, -.8]] }, m) + bill);
  return tail + lg + bd + hd;
}

// The wool grows from 0 (just shorn) to 3 (big and fluffy, ready to shear).
function sheep(o) {
  const p = o.pal, m = o.mood;
  const w = Math.max(0, Math.min(3, +o.wool || 0));
  const rx = r1(20 + w * 3.8), ry = r1(14.5 + w * 2.6), cy = r1(74 - w * 1.3), pr = r1(w ? 6.5 + w * .7 : 4.6);
  const lg = R(53, 84, 9, 21, 4.5, p.legB) + R(83, 84, 9, 21, 4.5, p.legB) + R(44, 86, 9, 20, 4.5, p.leg) + R(74, 86, 9, 20, 4.5, p.leg);
  const tx = r1(68 + rx + 1);
  const tail = grp('fa-tail', [tx - 6, cy], P(cloud(tx, cy - 2, 7 + w * .4, 6 + w * .3, 6, 3.8 + w * .2), p.wool), '--fa-wag:16deg;--fa-wt:.9s');
  const sx = rx / 30, sy = ry / 22;
  const curls = [[58, 63], [74, 74], [57, 81], [80, 59]].map(([x, y]) => `M${r1(68 + (x - 68) * sx)} ${r1(cy + (y - 70) * sy)} q4 -4 8 0`).join(' ');
  const bd = body(68, P(cloud(68, cy, rx, ry, w ? 12 : 14, pr), p.wool) + (w > 0 ? L(curls, p.shade, 2) : ''));
  const earL = grp('fa-ear', [27, 57], P('M28 54 C 16 49, 7 54, 9 59 C 11 64, 20 62, 28 60 Z', p.face) + F('M24 56 C 18 54, 13 56, 13.5 58.5 C 15 60.5, 20 59.5, 24 58.5 Z', p.earIn), '--fa-fl:20deg');
  const earR = grp('fa-ear fa-ear-r', [47, 57], P('M46 54 C 58 49, 67 54, 65 59 C 63 64, 54 62, 46 60 Z', p.face) + F('M50 56 C 56 54, 61 56, 60.5 58.5 C 59 60.5, 54 59.5, 50 58.5 Z', p.earIn), '--fa-fl:-20deg');
  const mouth = m === 'hungry' ? E(37, 72, 3, 3.6, '#7a2b3a', ' style="stroke:#ffd6cf;stroke-width:1.6"') + drool(34, 74)
    : m === 'sleepy' ? L('M34 71 q3 1.5 6 0', '#ffd6cf', 2) : L('M32.5 69.5 q4.5 5 9 0', '#ffd6cf', 2.2);
  const hd = head(o, [40, 74], earL + earR + P('M37 45 C 48 45, 52 53, 51 62 C 50 72, 44 79, 37 79 C 30 79, 24 72, 23 62 C 22 53, 26 45, 37 45 Z', p.face)
    + P(cloud(37, 47 - w * .4, 10 + w * 1.4, 5.5 + w * .7, 7, 3.6 + w * .5), p.wool) + cheeks([[27, 67], [47, 67]])
    + eyes({ pts: [[31, 59], [43, 59]], s: 5, white: true, look: [[.5, .8], [.5, .8]], shut: '#fff1e8' }, m) + mouth);
  return lg + tail + bd + hd;
}

function cow(o) {
  const p = o.pal, m = o.mood;
  const clip = o.id + 'c', hclip = o.id + 'h';
  const tail = grp('fa-tail', [102, 64], L('M102 64 C 112 68, 114 80, 109 90', INK, 3.2) + P('M109 86 C 104 90, 105 98, 109 99 C 113 98, 115 90, 109 86 Z', p.spot), '--fa-wag:16deg;--fa-wt:1.9s');
  const leg = (x, c) => R(x, 86, 11, 20, 5, c) + R(x, 99, 11, 7, 3.5, p.hoof);
  const lg = leg(54, p.shade) + leg(90, p.shade) + leg(46, p.body) + leg(82, p.body) + (o.baby ? '' : E(78, 95, 8, 4.5, p.udder));
  const bd = body(72, R(40, 52, 66, 44, 20, p.body) + `<clipPath id="${clip}"><rect x="40" y="52" width="66" height="44" rx="20"/></clipPath>`
    + `<g clip-path="url(#${clip})">${EF(68, 58, 12, 9, p.spot)}${EF(98, 80, 10, 12, p.spot)}${EF(56, 90, 8, 6, p.spot)}</g>` + R(40, 52, 66, 44, 20, 'none'));
  const earL = grp('fa-ear', [21, 46], P('M21 42 C 9 37, 3 43, 6 48 C 9 52, 16 51, 22 48 Z', p.body) + F('M17 44 C 11 42, 8 45, 9.5 47 C 11 48.5, 15 48, 18 47 Z', p.muzzle), '--fa-fl:18deg');
  const earR = grp('fa-ear fa-ear-r', [51, 44], P('M51 41 C 63 35, 70 40, 67 45 C 65 49, 58 49, 51 47 Z', p.body) + F('M55 43 C 61 40, 65 42, 64 44.5 C 62.5 46.5, 58 46, 55 45.5 Z', p.muzzle), '--fa-fl:-18deg');
  const horns = o.baby ? C(25, 32, 3.4, p.horn) + C(47, 31, 3.4, p.horn)
    : P('M25 33 C 17 27, 16 17, 21 17 C 23 22, 27 26, 32 29 Z', p.horn) + P('M44 29 C 50 24, 54 16, 58 18 C 58 24, 55 30, 49 33 Z', p.horn);
  const mouth = m === 'hungry' ? E(35, 70.5, 5, 4.2, '#7a2b3a', ' style="stroke-width:2"') + drool(41, 74)
    : m === 'sleepy' ? L('M30 70 q5 2 10 0', INK, 2) : L('M26 68.5 q9 7 18 0', INK, 2.2) + P('M37 71.5 C 38 78, 45 78, 44 70 Z', '#ff6b81', ' style="stroke-width:2"');
  const hd = head(o, [44, 64], horns + earL + earR + E(36, 48, 20, 18, p.body)
    + `<clipPath id="${hclip}"><ellipse cx="36" cy="48" rx="20" ry="18"/></clipPath><g clip-path="url(#${hclip})">${EF(49, 38, 10, 10, p.spot)}</g>` + E(36, 48, 20, 18, 'none')
    + P('M30 31 C 31 25, 36 26, 36 30 C 38 25, 43 27, 41 32', p.spot, ' style="stroke-width:2"')
    + cheeks([[19, 56], [53, 55]]) + eyes({ pts: [[28, 46], [45, 45]], s: 5, lid: [p.body, p.spot], lidK: .05, look: [[0, .8], [0, .8]] }, m)
    + E(35, 64, 19, 12, p.muzzle) + EF(28, 62, 2.4, 3, p.muzzleDark) + EF(42, 62, 2.4, 3, p.muzzleDark) + mouth);
  return tail + lg + bd + hd;
}

function croc(o) {
  const p = o.pal, m = o.mood;
  const tail = grp('fa-tail', [88, 86], P('M86 78 C 100 80, 110 74, 116 60 C 120 76, 112 94, 88 96 Z', p.body) + F('M100 77 l3 -5 l2 5 Z M108 70 l3 -5 l1.5 5 Z', p.dark), '--fa-wag:6deg;--fa-wt:2.8s');
  const lg = E(90, 101, 8, 5, p.dark);
  const bd = body(70, P('M54 73 l4 -7 l4 7 Z M65 71.5 l4 -7 l4 7 Z M76 72 l4 -7 l4 7 Z', p.dark) + E(70, 86, 28, 15, p.body)
    + F('M46 91 C 56 100, 82 100, 95 90 C 90 98, 79 101, 70 101 C 58 101, 49 98, 46 91 Z', p.belly)
    + CF(80, 80, 2.2, p.dark) + CF(87, 84, 1.6, p.dark) + CF(62, 79, 1.8, p.dark)
    + E(52, 100, 8, 6, p.body) + E(77, 101, 8, 6, p.body) + L('M47 104 v2 M51 104.5 v2 M72 105 v2 M76 105.5 v2', '#fff', 1.6));
  const open = m === 'hungry';
  const jaw = `<g transform="rotate(${open ? 16 : 0} 56 80)">`
    + P('M8 78 C 4 84, 10 91, 22 91 L 55 88 C 60 86, 60 82, 56 80 Z', p.body) + F('M10 85 C 14 89, 20 90, 26 90 L 50 88 C 40 89, 22 89, 10 85 Z', p.belly)
    + (open ? P('M16 82 l2.5 -4.5 l2.5 4.5 Z M28 83 l2.5 -4.5 l2.5 4.5 Z M40 83 l2.5 -4.5 l2.5 4.5 Z', '#fff', ' style="stroke-width:1.4"') : '') + '</g>';
  const inside = open ? F('M7 77 L 57 80 L 46 94 C 30 97, 12 92, 7 77 Z', p.mouth) + F('M18 88 C 24 82, 36 84, 40 90 C 32 93, 22 92, 18 88 Z', p.tongue) : '';
  const grin = open ? P('M12 77.5 l2.5 4.5 l2.5 -4.5 Z M24 78.5 l2.5 4.5 l2.5 -4.5 Z M36 79.5 l2.5 4.5 l2.5 -4.5 Z', '#fff', ' style="stroke-width:1.4"') + drool(30, 90)
    : L('M9 78 C 24 81, 42 82, 57 74', INK, 2.4) + P('M14 79.4 l2.5 4.5 l2.5 -4.5 Z M25 80.4 l2.5 4.5 l2.5 -4.5 Z M36 80.6 l2.5 4.5 l2.5 -4.5 Z', '#fff', ' style="stroke-width:1.4"');
  const snot = m === 'sleepy' ? C(9, 57, 4.6, '#d3f1ff', ' class="fa-snot fa-k" opacity=".9" style="stroke-width:1.6"') : '';
  const brow = m === 'happy' && !o.baby ? L('M29 41 q7 -6 14 -2', INK, 2.6) : '';
  const hd = head(o, [58, 82], inside + jaw + C(36, 53, 9.5, p.body) + C(51, 51, 9.5, p.body)
    + P('M62 70 C 62 58, 54 54, 46 56 C 34 58, 28 62, 22 64 L 9 66 C 3 67, 2 76, 8 78 L 56 82 C 62 80, 63 76, 62 70 Z', p.body)
    + C(10, 64, 3.6, p.body) + CF(10, 64, 1.3, INK) + CF(46, 66, 1.6, p.dark) + CF(52, 70, 1.3, p.dark) + grin + snot + cheeks([[44, 72]])
    + (o.baby ? at(44, 39, -4, .78, CAP) : '')
    + eyes({ pts: [[36, 52], [51, 50]], s: 6, white: true, look: [[-.6, .4], [-.6, .4]], lid: o.baby ? null : [null, p.body], lidK: .25, wink: o.baby ? -1 : 0, extra: brow }, m));
  return tail + lg + bd + hd;
}

function dino(o) {
  const p = o.pal, m = o.mood;
  const tail = grp('fa-tail', [80, 88], P('M78 80 C 96 84, 108 80, 116 66 C 120 84, 106 98, 80 98 Z', p.body) + P('M104 80 L 110 72 L 111 82 Z', p.spike, ' style="stroke-width:2.2"'), '--fa-wag:7deg;--fa-wt:2.1s');
  const lg = R(52, 88, 14, 18, 6, p.body) + R(74, 88, 14, 18, 6, p.body) + L('M55 104 v2 M60 104 v2 M77 104 v2 M82 104 v2', '#fff', 1.8);
  const bd = body(66, P('M58 47 L 63 36 L 69 47 Z M71 52 L 80 44 L 81 56 Z M81 62 L 92 58 L 88 70 Z M87 75 L 98 76 L 89 84 Z', p.spike)
    + P('M44 64 C 44 50, 58 44, 70 50 C 84 57, 92 72, 90 86 C 88 98, 76 103, 63 103 C 50 103, 42 95, 42 82 Z', p.body)
    + F('M48 66 C 56 70, 60 84, 58 99 C 52 99, 46 93, 45 83 C 44 75, 45 70, 48 66 Z', p.belly) + L('M47 78 q5 1 10 0 M47 86 q5 1 10 0 M48 93 q4 1 8 0', p.bellyLine, 1.6)
    + CF(78, 66, 3, p.spot) + CF(84, 79, 2.4, p.spot) + CF(73, 91, 2, p.spot)
    + grp('fa-arm', [49, 72], P('M50 69 C 42 68, 36 71, 37 76 C 40 78, 44 76, 50 75 Z', p.body)));
  const crest = o.shell ? P('M14 30 C 14 12, 52 6, 60 26 L 56 22 L 51 28 L 46 21 L 40 28 L 34 21 L 28 28 L 23 22 L 18 29 Z', '#fff8ec') + CF(30, 15, 2, '#c7b6ff') + CF(44, 13, 2.4, '#c7b6ff')
    : P('M29 20 L 33 10 L 38 19 Z M39 18 L 45 9 L 48 19 Z', p.spike);
  const mouth = m === 'hungry'
    ? F('M13 41 C 24 46, 42 47, 55 43 C 52 54, 40 58, 28 56 C 20 54, 14 49, 13 41 Z', '#7a2b3a') + F('M24 53 C 30 49, 40 50, 44 54 C 36 57, 30 57, 24 53 Z', '#ff7f8f')
      + P('M18 43 l2.5 4 l2.5 -4 Z M30 45 l2.5 4 l2.5 -4 Z M42 45 l2.5 4 l2.5 -4 Z', '#fff', ' style="stroke-width:1.4"') + L('M13 41 C 18 52, 30 58, 42 56 C 48 55, 53 50, 55 43', INK, 2.4) + drool(24, 56)
    : m === 'sleepy' ? L('M16 44 C 26 49, 40 49, 50 45', INK, 2.2)
      : L('M13 42 C 24 51, 40 51, 54 45', INK, 2.4) + P('M20 46.5 l2.4 4 l2.4 -4 Z M33 48.2 l2.4 4 l2.4 -4 Z', '#fff', ' style="stroke-width:1.4"');
  const hd = head(o, [54, 56], (o.shell ? '' : crest) + P('M62 40 C 62 24, 48 15, 33 17 C 18 19, 9 28, 9 39 C 9 50, 18 56, 31 56 L 53 57 C 60 55, 62 49, 62 40 Z', p.body)
    + (o.shell ? crest : '') + CF(14, 32, 1.6, INK) + CF(19, 31, 1.6, INK) + CF(55, 30, 2.2, p.spot) + CF(51, 23, 1.6, p.spot)
    + cheeks([[24, 41], [54, 39]]) + eyes({ pts: [[29, 30], [45, 28]], s: 5.6 }, m) + mouth);
  return tail + lg + bd + hd;
}

// A chubby gecko with big eyes on top and a curly tail.
function lizard(o) {
  const p = o.pal, m = o.mood;
  const tail = grp('fa-tail', [82, 92], P('M80 90 C 96 96, 112 92, 112 78 C 112 66, 100 64, 96 72 C 102 71, 105 77, 101 83 C 96 89, 88 88, 80 84 Z', p.body)
    + CF(106, 80, 1.8, p.spot) + CF(98, 88.5, 1.6, p.spot), '--fa-wag:9deg;--fa-wt:2.4s');
  const lg = E(45, 103, 9, 4.6, p.body) + E(79, 103, 9, 4.6, p.body) + L('M38 103.5 v2 M42.5 104.5 v2 M81.5 104.5 v2 M86 103.5 v2', '#fff', 1.6);
  const bd = body(62, E(62, 86, 24, 18, p.body) + EF(62, 91, 13, 11, p.belly) + L('M55 88 q7 2 14 0 M56 94 q6 2 12 0', p.dark, 1.4)
    + CF(78, 78, 2.8, p.spot) + CF(84, 88, 2.2, p.spot) + CF(44, 79, 2.2, p.spot)
    + grp('fa-arm', [44, 86], E(41, 92, 5.5, 8, p.body, ' transform="rotate(20 41 92)"')) + E(83, 92, 5.5, 8, p.body, ' transform="rotate(-20 83 92)"'));
  const mouth = m === 'hungry'
    ? P('M48 56 Q 60 70 72 56 Z', '#7a2b3a', ' style="stroke-width:2.2"') + F('M54 62 Q 60 58 66 62 Q 60 66 54 62 Z', '#ff7f8f') + drool(68, 60)
    : m === 'sleepy' ? L('M52 59 q8 3 16 0', INK, 2.2) : L('M45 56 q15 11 30 0', INK, 2.4);
  const hd = head(o, [60, 70], C(48, 34, 9.5, p.body) + C(72, 34, 9.5, p.body) + E(60, 50, 27, 20, p.body)
    + CF(60, 31, 2.6, p.spot) + CF(36, 52, 2, p.spot) + CF(84, 52, 2, p.spot)
    + (o.baby ? at(60, 23, 0, .6, CAP) : '')
    + CF(56, 53, 1.2, INK) + CF(64, 53, 1.2, INK) + cheeks([[42, 57], [78, 57]])
    + eyes({ pts: [[48, 38], [72, 38]], s: 7, white: true, look: [[.6, .8], [-.6, .8]], shut: INK }, m) + mouth);
  return tail + lg + bd + hd;
}

// A friendly coiled snake whose tongue flicks now and then.
function snake(o) {
  const p = o.pal, m = o.mood;
  const neck = 'M62 84 C 80 82, 88 76, 86 64';
  const tail = grp('fa-tail', [36, 100], P('M38 95 C 28 95, 18 99, 10 96 C 14 104, 28 106, 38 104 Z', p.body), '--fa-wag:10deg;--fa-wt:1.8s');
  const bd = body(62, E(62, 96, 30, 10, p.body) + L('M42 99 q20 5 40 0', p.dark, 1.8) + CF(48, 94, 2.2, p.spot) + CF(76, 95, 2.2, p.spot) + CF(62, 101, 1.8, p.spot)
    + E(58, 84, 21, 8.5, p.body) + CF(48, 83, 2, p.spot) + CF(66, 86, 1.8, p.spot)
    + L(neck, INK, 20) + L(neck, p.body, 14) + L(neck, p.belly, 5, ' stroke-dasharray="3 6"'));
  const tongue = m === 'sleepy' ? '' : grp('fa-tongue', [86, 63], L('M86 63 V70 M86 70 L83 74 M86 70 L89 74', '#ff4d6d', 2.4));
  const mouth = m === 'hungry' ? E(86, 62, 3.4, 3, '#7a2b3a', ' style="stroke-width:1.8"') + drool(91, 63)
    : m === 'sleepy' ? L('M82 61 q4 2 8 0', INK, 2) : L('M79 59 q7 6 14 0', INK, 2.2);
  const hd = head(o, [86, 70], (m === 'hungry' ? '' : tongue) + E(86, 51, 19, 16, p.body) + CF(78, 39, 2, p.spot) + CF(95, 40, 1.6, p.spot)
    + (o.baby ? at(86, 37, 6, .7, CAP) : '')
    + CF(83, 56, 1, INK) + CF(89, 56, 1, INK) + cheeks([[72, 57], [100, 56]])
    + eyes({ pts: [[79, 47], [94, 47]], s: 5.2 }, m) + mouth);
  return tail + bd + hd;
}

function egg() {
  return grp('fa-eggwob', [60, 106], P('M60 40 C 78 40, 88 66, 88 82 C 88 97, 76 106, 60 106 C 44 106, 32 97, 32 82 C 32 66, 42 40, 60 40 Z', '#fff8ec')
    + CF(48, 56, 4, '#c7b6ff') + CF(70, 52, 3, '#c7b6ff') + CF(76, 90, 4.5, '#c7b6ff') + CF(44, 94, 3, '#c7b6ff')
    + F('M33 72 L 42 66 L 50 72 L 58 64 L 66 72 L 74 65 L 87 71 L 87 78 L 74 72 L 66 79 L 58 71 L 50 79 L 42 73 L 33 79 Z', INK)
    + `<g class="fa-blink">${EF(51, 74, 2.4, 2.6, '#fff')}${EF(67, 74, 2.4, 2.6, '#fff')}${CF(51.6, 74.6, 1.2, INK)}${CF(67.6, 74.6, 1.2, INK)}</g>`
    + cheeks([[42, 86], [78, 86]]));
}

// ---------- new characters: Aussie Island Mates and the Rock Pool Crew ----------
// Each one is drawn whole (body shapes get the outline), then the face on top. b = baby (no joey in the pouch).
const NC = (() => {
  const n = (v) => +(+v).toFixed(2);
  const E = (cx, cy, rx, ry, f, rot) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}" class="fa-k"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`;
  const C = (cx, cy, r, f) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" class="fa-k"/>`;
  const P = (d, f) => `<path d="${d}" fill="${f}" class="fa-k"/>`;
  const R = (x, y, w, h, rx, f, rot) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${f}" class="fa-k"${rot ? ` transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"` : ''}/>`;
  const L = (d, c, w) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + 6}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const D = {
    E: (cx, cy, rx, ry, f, op = 1, rot) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${f}" opacity="${op}"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`,
    C: (cx, cy, r, f, op = 1) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${f}" opacity="${op}"/>`,
    P: (d, f, op = 1) => `<path d="${d}" fill="${f}" opacity="${op}"/>`,
    S: (d, c, w, op = 1) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`,
    shine: (cx, cy, rx, ry, rot = -25) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".55" transform="rotate(${rot} ${cx} ${cy})"/>`,
  };
  const ncEyes = (pts, s = 1) => pts.map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="${n(4.4 * s)}" ry="${n(5.8 * s)}" fill="${INK}"/><circle cx="${n(x + 1.6 * s)}" cy="${n(y - 2.2 * s)}" r="${n(1.9 * s)}" fill="#fff"/>`).join('');
  function spikes(cx, cy, rx, ry, a0, a1, count, len, closeToCentre = true) {
    const pt = (deg, out) => { const a = deg * Math.PI / 180; return `${n(cx + (rx + out) * Math.cos(a))} ${n(cy + (ry + out) * Math.sin(a))}`; };
    const step = (a1 - a0) / count;
    let d = `M${pt(a0, 0)}`;
    for (let k = 0; k < count; k++) d += ` L${pt(a0 + (k + 0.5) * step, len)} L${pt(a0 + (k + 1) * step, 0)}`;
    return d + (closeToCentre ? ` L${cx} ${cy}Z` : 'Z');
  }
  const list = [
  (b) => { const G = '#a3a7b5', Lt = '#e6e7ee', N = '#3d3646';
    return { id: 'koala', idle: 'sway',
      body: C(30, 42, 17, G) + C(90, 42, 17, G) + E(60, 90, 27, 20, G) + E(45, 107, 10, 5.5, G) + E(75, 107, 10, 5.5, G) + E(60, 92, 15, 13, Lt) + E(60, 58, 30, 25, G) +
        L('M84 108 Q90 98 88 86', '#7a5a3a', 3) + P('M88 90 Q102 84 106 72 Q92 74 88 90z', '#6cc04a') + P('M88 98 Q76 96 72 88 Q84 86 88 98z', '#59ad3c') +
        E(40, 94, 9, 7, G, -20) + E(85, 94, 9, 7, G, 20) + E(60, 64, 8, 10, N),
      deco: D.C(30, 43, 8, '#f7d9e2') + D.C(90, 43, 8, '#f7d9e2') + D.shine(44, 42, 8, 3.5) + D.E(57, 59, 2.4, 1.6, '#fff', .6),
      eyes: [[[46, 54], [74, 54]], .95], cheeks: [[39, 66], [81, 66]], mouth: 'M55 78 q5 3.5 10 0' }; },
  (b) => { const B = '#d9884a', Bl = '#f6d6a8', J = '#c97a3e';
    return { id: 'roo', idle: 'bob',
      body: P('M66 98 Q96 104 114 86 Q110 106 72 110z', B) + E(48, 108, 15, 5, B) + E(70, 108, 13, 5, B) + E(58, 82, 22, 25, B) + E(58, 86, 14, 17, Bl) +
        (b ? '' : E(54, 74, 2.6, 5.5, J, -15) + E(62, 74, 2.6, 5.5, J, 15) + C(58, 83, 7.5, J)) + P('M44 88 Q58 96 72 88 L71 98 Q58 108 45 98z', '#e9b27a') +
        E(42, 72, 4, 9, B, 25) + E(74, 72, 4, 9, B, -25) + E(46, 20, 6.5, 14, B, -14) + E(66, 20, 6.5, 14, B, 14) + E(56, 42, 18, 16, B) + E(56, 50, 10, 7, Bl),
      deco: D.E(46, 21, 3, 9, '#f4a6a0', 1, -14) + D.E(66, 21, 3, 9, '#f4a6a0', 1, 14) + D.E(56, 46, 3.5, 2.6, INK) + D.shine(46, 32, 5, 2.5) + (b ? '' : ncEyes([[55.5, 82.5], [60.5, 82.5]], .38)),
      eyes: [[[49, 39], [63, 39]], .85], cheeks: [[44, 47], [68, 47]], cheekR: [3.5, 2.2], mouth: 'M52 53 q4 3 8 0' }; },
  (b) => { const W = '#8d6b56', W2 = '#7a5b48', H = '#ff8a3d';
    return { id: 'wombat', idle: 'bob',
      body: R(26, 92, 18, 18, 7, W2) + R(76, 92, 18, 18, 7, W2) + E(60, 82, 42, 22, W) + C(32, 48, 9, W) + C(88, 48, 9, W) + E(60, 66, 30, 24, W) + R(50, 63, 20, 14, 6, '#3d2f2a') +
        P('M38 46 Q38 26 60 26 Q82 26 82 46z', H) + R(34, 43, 52, 7, 3.5, H),
      deco: D.C(32, 48, 4.5, '#c99a84') + D.C(88, 48, 4.5, '#c99a84') + D.P('M57 29 h6 v14 h-6z', '#ffc08f') + D.E(54, 66, 3, 1.6, '#fff', .5) + D.shine(46, 34, 5, 2.5),
      eyes: [[[47, 58], [73, 58]], .85], cheeks: [[40, 71], [80, 71]], mouth: 'M54 83 q6 4 12 0' }; },
  (b) => { const B = '#8a5a3c', BILL = '#4f5d73';
    return { id: 'platypus', idle: 'bob',
      body: P('M80 82 Q106 74 114 88 Q110 104 82 100z', '#6b4430') + E(78, 105, 10, 5, BILL) + E(44, 105, 10, 5, BILL) + E(62, 88, 30, 19, B) + C(38, 66, 17, B) + E(16, 72, 15, 7.5, BILL, -6),
      deco: D.E(60, 97, 16, 6, '#c99a74') + D.S('M92 84 l10 4 M90 92 l12 2', '#8a5a3c', 2, .8) + D.C(7, 69.5, 1.3, INK) + D.C(11.5, 68.8, 1.3, INK) + D.S('M6 75 q9 4 18 0', '#2b3444', 2) + D.shine(32, 56, 5, 2.5) + D.shine(70, 78, 8, 2.5, -8),
      eyes: [[[34, 62], [46, 62]], .8], cheeks: [[49, 71]], mouth: '' }; },
  (b) => { const CR = '#f6ead6', BR = '#8a5a3c';
    return { id: 'kookaburra', idle: 'bob',
      body: P('M66 86 L102 110 L94 119 L60 96z', '#c8703c') + R(10, 100, 100, 9, 4.5, '#9a6a44') + E(58, 78, 24, 25, CR) + P('M68 60 Q94 68 86 98 Q72 102 66 82z', BR) + C(52, 46, 22, CR) +
        P('M42 59 L8 61 L42 67z', '#e8d9b8') + P('M42 50 L6 58 L44 60z', '#3d3646'),
      deco: D.E(78, 74, 4.5, 8, '#4aa3df', 1, -15) + D.S('M74 86 l8 2 M76 92 l7 1', '#6b4430', 2) + D.P('M32 40 Q44 20 66 26 Q74 30 72 38 Q54 30 34 44z', '#a87a55') + D.S('M38 46 Q52 40 74 46', '#8a5a3c', 4) +
        D.E(50, 101, 5, 3, '#e3a86c') + D.E(62, 101, 5, 3, '#e3a86c') + D.C(28, 104, 1.6, '#7a5230') + D.C(96, 104, 1.6, '#7a5230'),
      eyes: [[[48, 44], [62, 44]], .85], cheeks: [[66, 55]], mouth: '' }; },
  (b) => {
    return { id: 'echidna', idle: 'breathe',
      body: P(spikes(66, 86, 34, 22, 195, 372, 12, 12), '#f2deb4') + E(42, 106, 8, 4, '#3d2f2a') + E(84, 106, 8, 4, '#3d2f2a') + E(66, 88, 36, 20, '#5e4334') + E(34, 88, 15, 13, '#a8826a') + P('M22 90 Q2 94 2 98 Q8 101 24 96z', '#3d2f2a'),
      deco: D.shine(36, 82, 4, 2) + D.E(66, 96, 14, 5, '#7a5a48'),
      eyes: [[[30, 85], [40, 85]], .62], cheeks: [[44, 92]], cheekR: [3.5, 2.2], mouth: 'M32 94 q3 2 6 0' }; },

  (b) => { const K = '#ff6b3d', K2 = '#e04f22';
    return { id: 'crab', idle: 'bob',
      body: L('M34 96 L24 108', K2, 5) + L('M44 98 L40 110', K2, 5) + L('M54 98 L58 110', K2, 5) + R(64, 30, 9, 14, 1.5, '#e04f22') + C(98, 46, 11, '#9de3d8') + C(76, 72, 29, '#7fd6c8') +
        E(40, 88, 20, 13, K) + L('M26 86 L16 78', K, 5) + P('M7 72 Q3 58 18 56 Q26 58 24 66 L14 69z', K) + P('M8 75 L22 72 Q25 82 15 85 Q7 83 8 75z', K) + E(59, 92, 7, 5, K, -20) +
        L('M34 78 L30 58', K, 4) + L('M44 78 L46 56', K, 4) + C(30, 52, 8, '#fff') + C(46, 50, 8, '#fff'),
      deco: D.S('M52 66 Q76 50 100 66 M50 84 Q76 70 102 84', '#36a394', 2.5, .7) + D.S('M98 42 a4 4 0 1 1 -4 4', '#36a394', 2) +
        `<rect x="70" y="80" width="13" height="19" rx="6.5" fill="#8a5a3c" stroke="${INK}" stroke-width="2"/>` + D.C(80, 90, 1.4, '#ffd36b') +
        `<circle cx="88" cy="62" r="6.5" fill="#fff3b0" stroke="${INK}" stroke-width="2"/>` + D.S('M88 56 v12 M82 62 h12', INK, 1.5) +
        D.C(68, 22, 4, '#fff', .8) + D.C(74, 14, 3, '#fff', .6) + D.shine(64, 52, 7, 3),
      eyes: [[[31, 53], [47, 51]], .62], cheeks: [[28, 91], [52, 91]], cheekR: [4, 2.4], mouth: 'M36 92 q4 3 8 0' }; },
  (b) => { const T = '#3f76d9';
    return { id: 'squid', idle: 'float',
      body: L('M45 84 Q38 96 44 108', T, 6) + L('M55 86 Q52 98 56 110', T, 6) + L('M65 86 Q68 98 64 110', T, 6) + L('M75 84 Q82 96 76 108', T, 6) +
        P('M44 30 L20 50 L42 56z', '#ff5a5f') + P('M76 30 L100 50 L78 56z', '#ff5a5f') + P('M60 8 C 78 24 80 54 78 72 L42 72 C 40 54 42 24 60 8z', '#4f8ff7') + E(60, 78, 22, 12, '#7fb0ff'),
      deco: `<rect x="42.6" y="59" width="34.8" height="6" fill="#ff5a5f"/>` + `<circle cx="60" cy="38" r="9" fill="#bfe9ff" stroke="${INK}" stroke-width="2.6"/>` + D.E(57, 35, 3, 2, '#fff', .9, -30) + D.shine(51, 26, 2.5, 7, 15),
      eyes: [[[52, 77], [68, 77]], .72], cheeks: [[45, 82], [75, 82]], cheekR: [4, 2.4], mouth: 'M56 84 q4 3 8 0', ground: 'float' }; },
  (b) => { const SK = '#9fe0a8', DK = '#2c8a5c';
    return { id: 'turtle', idle: 'float',
      body: E(104, 86, 6, 3, SK) + E(96, 94, 13, 6, SK, 30) + C(24, 70, 15, SK) + R(26, 80, 76, 10, 5, '#f2e3a0') + P('M28 84 Q30 44 66 44 Q100 44 102 84z', '#3fae7a') + E(50, 98, 18, 7, SK, 20),
      deco: D.P('M58 54 L74 54 L80 66 L74 78 L58 78 L52 66z', DK, .55) + D.P('M36 78 Q38 62 46 57 L50 66 L46 78z', DK, .55) + D.P('M94 78 Q92 62 86 57 L82 66 L86 78z', DK, .55) + D.shine(50, 52, 8, 3, -10) + D.C(20, 60, 1.5, '#6cbf78') + D.C(28, 58, 1.5, '#6cbf78'),
      eyes: [[[19, 66], [29, 66]], .68], cheeks: [[33, 74]], cheekR: [3.5, 2.2], mouth: 'M17 76 q5 3 10 0', ground: 'float' }; },
  (b) => {
    return { id: 'puffer', idle: 'float',
      body: P(spikes(58, 64, 29, 29, 0, 360, 18, 8, false), '#f2a92e') + P('M84 64 L110 48 L104 64 L110 80z', '#ff9f45') + C(58, 64, 30, '#ffc94a'),
      deco: D.E(58, 80, 18, 10, '#fff1c2') + [[38, 46], [80, 46], [32, 64], [86, 60], [70, 38], [46, 38]].map(([x, y]) => D.C(x, y, 2.4, '#c9842a', .7)).join('') +
        `<ellipse cx="78" cy="76" rx="7" ry="4" fill="#ff9f45" stroke="${INK}" stroke-width="2" transform="rotate(-30 78 76)"/>` + `<ellipse cx="58" cy="74" rx="4" ry="4.2" fill="#e2557a" stroke="${INK}" stroke-width="2.2"/>` + D.shine(44, 44, 7, 3),
      eyes: [[[48, 57], [68, 57]], 1], cheeks: [[39, 67], [77, 66]], mouth: '', ground: 'float' }; },
  (b) => { const A = '#9a52da';
    return { id: 'octopus', idle: 'sway',
      body: L('M40 70 Q22 82 26 98 Q30 106 36 100', A, 9) + L('M50 76 Q40 92 46 106 Q50 110 54 104', A, 9) + L('M70 76 Q80 92 74 106 Q70 110 66 104', A, 9) + L('M80 70 Q98 82 94 98 Q90 106 84 100', A, 9) +
        L('M84 62 Q106 56 102 34', A, 9) + P('M28 70 Q24 20 60 20 Q96 20 92 70 Q60 82 28 70z', '#b36bf0') + P('M92 32 Q102 14 112 32 Q102 38 92 32z', '#ff9fb7'),
      deco: D.C(44, 34, 4, '#d8a8ff', .85) + D.C(76, 31, 3, '#d8a8ff', .85) + D.C(83, 46, 3.5, '#d8a8ff', .85) + D.S('M102 19 V33 M97 23 L99 33 M107 23 L105 33', '#e0708e', 1.5) + D.shine(40, 30, 7, 3) +
        [[28, 98], [48, 104], [72, 104], [92, 98]].map(([x, y]) => D.C(x, y, 1.6, '#f2d7ff')).join(''),
      eyes: [[[50, 50], [70, 50]], 1], cheeks: [[42, 60], [78, 60]], mouth: 'M55 63 q5 4 10 0', ground: 'float' }; },
  (b) => { const H = '#2f4a8f';
    return { id: 'manta', idle: 'glide',
      body: L('M60 92 Q62 108 78 114', H, 3) + E(50, 40, 4.5, 10, H, -20) + E(70, 40, 4.5, 10, H, 20) + P('M60 40 Q82 44 114 70 Q88 74 74 90 Q60 100 46 90 Q32 74 6 70 Q38 44 60 40z', '#3c5aa6'),
      deco: D.P('M30 62 Q42 56 50 63 Q40 68 30 62z', '#6f8fd6', .8) + D.P('M90 62 Q78 56 70 63 Q80 68 90 62z', '#6f8fd6', .8) + D.C(22, 68, 1.8, '#bfe9ff') + D.C(98, 68, 1.8, '#bfe9ff') + D.C(60, 88, 1.8, '#bfe9ff') + D.shine(56, 47, 6, 2.5, -10),
      eyes: [[[50, 58], [70, 58]], .85], cheeks: [[42, 68], [78, 68]], mouth: 'M50 74 q10 6 20 0', ground: 'float' }; },
  ];
  const out = {};
  list.forEach((f) => { out[f(false).id] = f; });
  return out;
})();

// Draw one new character with its face for the mood. Coordinates are the original ones (feet on y = 110), moved up 4.
function ncDraw(key, o) {
  const c = NC[key](!!o.baby);
  const m = o.mood;
  const [ep, es] = c.eyes;
  const s = r1(5.8 * es * (o.baby ? 1.15 : 1));
  const [crx, cry] = c.cheekR || [5, 3];
  let mouth = '';
  const mm = c.mouth && /M([\d.]+) ([\d.]+) q[\d.]+ [\d.]+ ([\d.]+)/.exec(c.mouth);
  if (mm) {
    const [x, y, w] = [+mm[1], +mm[2], +mm[3]];
    mouth = m === 'hungry' ? E(r1(x + w / 2), y + 2, r1(Math.max(2.8, w * .28)), 3.4, '#7a2b3a', ' style="stroke-width:1.8"') + drool(r1(x + w / 2 + 3.5), y + 4)
      : m === 'sleepy' ? L(`M${r1(x + w * .25)} ${y + 1} q${r1(w * .25)} 1.4 ${r1(w * .5)} 0`, INK, 2.2)
        : L(c.mouth, INK, 2.6);
  } else if (m === 'hungry' && A[key].dr) mouth = drool(...A[key].dr);
  const face = c.deco + cheeks(c.cheeks, crx, cry) + eyes({ pts: ep, s }, m) + mouth;
  return `<g transform="translate(0 -4)"><g class="fa-idle fa-idle-${c.idle}">${c.body}${face}</g></g>`;
}

// ---------- palettes ----------
const GOLD = (id) => `<linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6b8"/><stop offset=".45" stop-color="#ffd23f"/><stop offset="1" stop-color="#e59a12"/></linearGradient>`
  + `<linearGradient id="${id}d" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd85a"/><stop offset="1" stop-color="#cf8410"/></linearGradient>`;
const RAINBOW = (id) => `<linearGradient id="${id}r" x1="0" y1="0" x2="1" y2=".35"><stop offset="0" stop-color="#ff8f9e"/><stop offset=".2" stop-color="#ffbd6e"/><stop offset=".4" stop-color="#ffe66e"/><stop offset=".6" stop-color="#8fe38f"/><stop offset=".8" stop-color="#7fc6ff"/><stop offset="1" stop-color="#bf9cff"/></linearGradient>`;
const PAL = {
  hen: { body: '#fffaf2', shade: '#e3d5c2', tail: '#f2b866', tail2: '#dc8d3c', wing: '#f6d9a6', wingLine: '#c99a55', comb: '#ff4f5a', beak: '#ffa62b', leg: '#ffa62b' },
  henGold: (id) => ({ defs: GOLD(id), pal: { body: `url(#${id}g)`, shade: '#c98a12', tail: `url(#${id}g)`, tail2: `url(#${id}d)`, wing: `url(#${id}d)`, wingLine: '#a86a08', comb: '#ff4f5a', beak: '#ff8a1f', leg: '#ff8a1f' } }),
  chick: { body: '#ffe066', shade: '#e8b520', tail: '#ffe066', tail2: '#ffcf33', wing: '#ffcf33', wingLine: '#d99a10', comb: '#ff4f5a', beak: '#ff9a1f', leg: '#ff9a1f' },
  duck: { body: '#ffd84d', wing: '#f6c21c', wingLine: '#c99300', bill: '#ff9a1f', leg: '#ff9a1f' },
  duckling: { body: '#fff08a', wing: '#ffe14d', wingLine: '#d9ae00', bill: '#ffa62b', leg: '#ffa62b' },
  sheep: { wool: '#fffdf8', shade: '#e2d8c6', face: '#4b3d3f', earIn: '#f0a4a0', leg: '#3b302f', legB: '#2a2120' },
  lamb: { wool: '#fffdf8', shade: '#e2d8c6', face: '#6b5658', earIn: '#ffb3ae', leg: '#4d3f3e', legB: '#3a2f2e' },
  sheepRainbow: (id) => ({ defs: RAINBOW(id), pal: { wool: `url(#${id}r)`, shade: '#ffffff', face: '#4b3d3f', earIn: '#f0a4a0', leg: '#3b302f', legB: '#2a2120' } }),
  cow: { body: '#fffdf8', shade: '#e9e1d4', spot: '#3a2f2c', muzzle: '#ffb8c4', muzzleDark: '#c9677a', horn: '#f6e6c4', hoof: '#3a2f2c', udder: '#ffb3bd' },
  calf: { body: '#fffdf8', shade: '#efe4d6', spot: '#b9773f', muzzle: '#ffc6cf', muzzleDark: '#c9677a', horn: '#f6e6c4', hoof: '#6b4a32', udder: '#ffb3bd' },
  croc: { body: '#4cbf62', dark: '#2f8f45', belly: '#d6f5b8', mouth: '#a8334a', tongue: '#ff7f8f' },
  crocBaby: { body: '#72d685', dark: '#3fa85a', belly: '#e6fad0', mouth: '#a8334a', tongue: '#ff7f8f' },
  dino: { body: '#9b7cf0', belly: '#ddd1ff', bellyLine: '#b9a6f5', spike: '#ffb340', spot: '#7f62d9' },
  lizard: { body: '#3fcfb4', dark: '#2a9e88', belly: '#d9fbf2', spot: '#ffd23f' },
  lizardBaby: { body: '#79e3cd', dark: '#3bb39b', belly: '#ecfffa', spot: '#ffe27a' },
  snake: { body: '#9ad94a', dark: '#5e9e26', belly: '#f3ffc9', spot: '#4f8f1e' },
  snakeBaby: { body: '#bdea80', dark: '#7bb83e', belly: '#fbffe6', spot: '#6aa83a' },
};

// ---------- per-animal data: drawing, shadow [x, width], where the zzz go, favourite food ----------
const A = {
  hen: { draw: hen, pal: PAL.hen, happyPose: -5, shadow: [62, 32], z: [62, 30], food: 'corn' },
  duck: { draw: duck, pal: PAL.duck, shadow: [62, 34], z: [64, 30], food: 'bread' },
  sheep: { draw: sheep, pal: PAL.sheep, shadow: [66, 34], z: [52, 40], food: 'clover' },
  cow: { draw: cow, pal: PAL.cow, shadow: [72, 36], z: [62, 30], food: 'hay' },
  croc: { draw: croc, pal: PAL.croc, sleepyPose: 2, shadow: [64, 44], z: [62, 48], food: 'fish' },
  dino: { draw: dino, pal: PAL.dino, shadow: [70, 34], z: [68, 30], food: 'melon' },
  lizard: { draw: lizard, pal: PAL.lizard, sleepyPose: 5, shadow: [64, 32], z: [84, 28], food: 'bug' },
  snake: { draw: snake, pal: PAL.snake, sleepyPose: 6, shadow: [60, 34], z: [100, 36], food: 'egg', think: [36, 24], thinkFrom: [70, 44] },
  egg: { draw: egg, pal: {}, shadow: [60, 26], z: [60, 30], food: 'egg' },
  koala: { nc: 1, shadow: [62, 34], food: 'leaf' },
  roo: { nc: 1, shadow: [64, 36], food: 'grass' },
  wombat: { nc: 1, shadow: [60, 40], food: 'carrot' },
  platypus: { nc: 1, shadow: [62, 38], food: 'worm', dr: [14, 79] },
  kookaburra: { nc: 1, shadow: [60, 42], food: 'bug', dr: [12, 65] },
  echidna: { nc: 1, shadow: [62, 38], food: 'bug' },
  crab: { nc: 1, shadow: [56, 38], food: 'kelp' },
  squid: { nc: 1, float: 1, shadow: [60, 24], food: 'shrimp', z: [84, 20], think: [104, 8], thinkFrom: [72, 28] },
  turtle: { nc: 1, float: 1, shadow: [62, 36], food: 'kelp' },
  puffer: { nc: 1, float: 1, shadow: [60, 26], food: 'shrimp', dr: [58, 79] },
  octopus: { nc: 1, float: 1, shadow: [60, 32], food: 'fish', z: [66, 8], think: [22, 10], thinkFrom: [42, 30] },
  manta: { nc: 1, float: 1, shadow: [60, 34], food: 'shrimp' },
};
Object.keys(A).forEach((k) => {
  const a = A[k];
  if (!a.nc) return;
  a.draw = (o) => ncDraw(k, o);
  if (!a.z) { const pts = NC[k](false).eyes[0]; a.z = [Math.max(...pts.map((q) => q[0])) + 8, Math.min(...pts.map((q) => q[1])) - 20]; }
});

// ---------- foods for the hungry thought bubble (about 22 x 16, centred on 0,0) ----------
const FOOD = {
  corn: `<g transform="rotate(35)">${P('M-1 5 C -9 1, -9 -6, -6 -9 C -4 -4, -2 0, 0 4 Z', '#6cc24a')}${E(0, -1, 4.6, 8.6, '#ffd23f')}${L('M-2 -7 V5 M2 -7 V5 M-4 -3 H4 M-4 1 H4', '#e8a317', 1)}${P('M1 5 C 9 1, 9 -6, 6 -9 C 4 -4, 2 0, 0 4 Z', '#6cc24a')}</g>`,
  bread: P('M-9 7 V-1 C -12 -3, -11 -9, -6 -9 H6 C 11 -9, 12 -3, 9 -1 V7 Z', '#d98a3a') + F('M-6 5 V-2 C -8 -3, -8 -6, -5 -6 H5 C 8 -6, 8 -3, 6 -2 V5 Z', '#ffe2b0'),
  clover: L('M0 2 C 1 6, 3 8, 5 9', '#3e9a3a', 1.8) + C(-4, -2, 4.4, '#6cc24a') + C(4, -2, 4.4, '#6cc24a') + C(0, -7, 4.4, '#6cc24a') + CF(0, -3, 1.4, '#3e9a3a'),
  hay: R(-10, -7, 20, 14, 3, '#f2c94c') + L('M-7 -3 H7 M-7 1 H7 M-7 4.5 H7', '#c99a2e', 1) + F('M-3 -7 h6 v14 h-6 Z', '#d9483b'),
  fish: P('M-10 0 C -6 -7, 4 -7, 7 0 C 4 7, -6 7, -10 0 Z', '#ff9a4d') + P('M6 0 L 12 -5 L 12 5 Z', '#ff9a4d') + CF(-5, -1, 1.4, INK),
  melon: P('M-11 -3 A 11 11 0 0 0 11 -3 Z', '#5bc46a') + F('M-8.4 -3 A 8.4 8.4 0 0 0 8.4 -3 Z', '#ff5a6e') + CF(-3, 0, .9, INK) + CF(2, 1.5, .9, INK) + CF(4, -1, .9, INK),
  bug: E(0, 1.5, 8, 7, '#ff4f5a') + L('M0 -5 V8', INK, 1.4) + C(0, -6, 3.6, INK) + CF(-4, 0, 1.6, INK) + CF(4, 0, 1.6, INK) + CF(-3.5, 5, 1.3, INK) + CF(3.5, 5, 1.3, INK),
  egg: E(0, 0, 7, 9, '#fff8ec') + CF(-2.5, -3, 1.6, '#c7b6ff') + CF(2.5, 3, 1.3, '#c7b6ff'),
  leaf: P('M-10 7 C -8 -5, 2 -10, 10 -9 C 9 1, 1 8, -10 7 Z', '#6cc24a') + L('M-8 5 C -2 0, 3 -4, 8 -7', '#3e9a3a', 1.3),
  grass: P('M-9 8 L -7 -5 L -3 8 Z M-3 8 L 0 -9 L 3 8 Z M3 8 L 7 -5 L 9 8 Z', '#6cc24a'),
  carrot: P('M-4 -4 C -2 -6, 2 -6, 4 -4 L 0.6 10 Q 0 11, -0.6 10 Z', '#ff8a2b') + L('M-2 0 h2 M-1 4 h2', '#d9661a', 1) + P('M0 -5 L -5 -11 M0 -5 L 0 -12 M0 -5 L 5 -11', '#6cc24a', ' style="stroke-width:2.2"') + L('M0 -5 L -4 -10 M0 -5 L 0 -11 M0 -5 L 4 -10', '#6cc24a', 1.6),
  worm: L('M-9 3 C -6 -5, -2 -5, 0 1 C 2 7, 6 7, 9 0', INK, 6.6) + L('M-9 3 C -6 -5, -2 -5, 0 1 C 2 7, 6 7, 9 0', '#ff9ab0', 3.6) + CF(8.6, 0.4, .9, INK),
  kelp: L('M-4 9 C -9 3, 1 -2, -4 -9', INK, 5.6) + L('M-4 9 C -9 3, 1 -2, -4 -9', '#3fae5a', 3) + L('M4 9 C 9 3, -1 -2, 4 -9', INK, 5.6) + L('M4 9 C 9 3, -1 -2, 4 -9', '#2f9a4a', 3),
  shrimp: P('M-8 -3 C -2 -10, 9 -6, 8 3 C 7 8, 1 8, -1 4 C 1 2, 3 1, 2 -1 C 0 -3, -4 -1, -8 -3 Z', '#ff8a6b') + P('M-8 -3 L -11 -7 L -11 0 Z', '#ff8a6b', ' style="stroke-width:1.4"') + CF(3, -3, 1, INK),
};
// The bubble sits at [cx, cy]; its two little dots lead back towards the head at [hx, hy].
const thought = (food, [cx, cy] = [97, 19], [hx, hy] = [62, 50]) => {
  const dot = (t, r, w) => C(r1(hx + (cx - hx) * t), r1(hy + (cy - hy) * t), r, '#fff', ` style="stroke-width:${w}"`);
  return `<g class="fa-think">${dot(.23, 2.2, 1.6)}${dot(.42, 3.4, 1.8)}${P(cloud(cx, cy, 17, 12.5, 8, 6.5), '#fff', ' style="stroke-width:2"')}${at(cx, cy, 0, .95, FOOD[food] || FOOD.clover)}</g>`;
};
const zzz = ([x, y]) => `<g font-family="Fredoka, ui-rounded, 'Arial Rounded MT Bold', system-ui, sans-serif" font-weight="700" fill="#fff" stroke="${INK}" stroke-width="2.4" paint-order="stroke" stroke-linejoin="round">`
  + ['z', 'z', 'Z'].map((t, i) => `<text class="fa-z" x="${r1(x + i * 6)}" y="${r1(y - i * 6)}" font-size="${9 + i * 3}" style="animation-delay:${i}s">${t}</text>`).join('') + '</g>';
const STAR = 'M0 -7 C 1 -1.5 1.5 -1 7 0 C 1.5 1 1 1.5 0 7 C -1 1.5 -1.5 1 -7 0 C -1.5 -1 -1 -1.5 0 -7Z';
const sparkles = () => [[18, 28, 0], [104, 46, .7], [26, 86, 1.3], [98, 96, .4], [64, 8, 1.7], [10, 60, 1]].map(([x, y, d]) =>
  `<g transform="translate(${x} ${y})"><path class="fa-spark" d="${STAR}" fill="#fff6b0" stroke="#e8a317" stroke-width="1" style="animation-delay:${d}s"/></g>`).join('');

// The sticker look: a white edge all round plus a soft drop shadow. One filter per picture so ids never clash.
const sticker = (id) => `<filter id="${id}s" x="-20%" y="-20%" width="140%" height="145%" color-interpolation-filters="sRGB">`
  + '<feMorphology in="SourceAlpha" operator="dilate" radius="3.3" result="w"/><feFlood flood-color="#fff"/><feComposite in2="w" operator="in" result="e"/>'
  + '<feOffset in="w" dy="3.2" result="o"/><feFlood flood-color="#1b1230" flood-opacity=".28"/><feComposite in2="o" operator="in" result="h"/>'
  + '<feMerge><feMergeNode in="h"/><feMergeNode in="e"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

// ---------- one whole picture ----------
function render(key, opts = {}) {
  const a = A[key];
  const id = 'fa' + (++uid);
  let pal = opts.pal || a.pal, defs = '';
  if (typeof pal === 'function') { const g = pal(id); pal = g.pal; defs = g.defs; }
  const o = Object.assign({ key, id, happyPose: a.happyPose, sleepyPose: a.sleepyPose }, opts, { pal });
  o.mood = MOODS.includes(o.mood) ? o.mood : 'happy';
  const k = o.baby ? o.baby.k : 1;
  const tx = (x) => r1(60 + (x - 60) * k), ty = (y) => r1(106 + (y - 106) * k);
  const [sx, srx] = a.shadow;
  const shadow = `<ellipse cx="${tx(sx)}" cy="${a.float ? 108 : 106}" rx="${r1(srx * k)}" ry="${r1(4.5 * k + .5)}" fill="#1b1230" opacity="${a.float ? .12 : .22}"/>`;
  const inner = o.baby ? `<g class="fa-babyg" transform="translate(60 106) scale(${k}) translate(-60 -106)">${a.draw(o)}</g>` : a.draw(o);
  const extra = o.mood === 'hungry' ? (o.baby ? at(0, 10, 0, 1, thought(a.food, a.think, a.thinkFrom)) : thought(a.food, a.think, a.thinkFrom)) : o.mood === 'sleepy' ? zzz([tx(a.z[0]), ty(a.z[1])]) : '';
  dl = (dl + 1.37) % 5;
  return `<svg viewBox="${VIEW}" class="art fa fa-${key} fa-m-${o.mood}${o.baby ? ' fa-baby' : ''}" style="--fa-dl:-${r1(dl)}s" aria-hidden="true" focusable="false">`
    + `<defs>${sticker(id)}${defs}</defs>${shadow}<g filter="url(#${id}s)">${inner}</g>${extra}${o.sparkle ? sparkles() : ''}</svg>`;
}

// Game ids -> which drawing, and how the baby looks.
const SP_BABY = { k: .72, head: 1.28 };
const NC_BABY = { k: .74 };
const KIND = {
  chicken: ['hen', { pal: PAL.chick, baby: SP_BABY }],
  duck: ['duck', { pal: PAL.duckling, baby: SP_BABY }],
  sheep: ['sheep', { pal: PAL.lamb, baby: { k: .74, head: 1.25 } }],
  cow: ['cow', { pal: PAL.calf, baby: { k: .74, head: 1.25 } }],
  croc: ['croc', { pal: PAL.crocBaby, baby: { k: .74, head: 1.25 } }],
  dino: ['dino', { baby: { k: .7, head: 1.3 }, shell: true }],
  lizard: ['lizard', { pal: PAL.lizardBaby, baby: { k: .74, head: 1.25 } }],
  snake: ['snake', { pal: PAL.snakeBaby, baby: { k: .74, head: 1.25 } }],
};
['koala', 'roo', 'wombat', 'platypus', 'kookaburra', 'echidna', 'crab', 'squid', 'turtle', 'puffer', 'octopus', 'manta']
  .forEach((t) => { KIND[t] = [t, { baby: NC_BABY }]; });
const ALIAS = { hen: 'chicken', chick: 'chicken', crocodile: 'croc', dinosaur: 'dino', gecko: 'lizard', kangaroo: 'roo', joey: 'roo', hermit: 'crab', hermitcrab: 'crab', pufferfish: 'puffer', ray: 'manta', mantaray: 'manta' };

/** Every animal type the art knows about. */
export const ART_TYPES = Object.keys(KIND);

export function animalArt(type, isGrown, wool = 0, mood = 'happy') {
  const t = KIND[type] ? type : ALIAS[String(type).toLowerCase().replace(/[^a-z]/g, '')];
  const spec = KIND[t];
  if (!spec) return eggArt();
  return render(spec[0], Object.assign({ wool, mood }, isGrown ? {} : spec[1]));
}

// The big pop-out moment when a snake hatches from a mystery egg.
export function snakeArt(mood = 'happy') {
  return render('snake', { mood });
}

// Rare finds: a golden hen and a rainbow sheep; any other animal just sparkles.
export function goldenArt(type, mood = 'happy') {
  const t = KIND[type] ? type : ALIAS[String(type).toLowerCase().replace(/[^a-z]/g, '')];
  if (t === 'chicken') return render('hen', { pal: PAL.henGold, mood, sparkle: true });
  if (t === 'sheep') return render('sheep', { pal: PAL.sheepRainbow, mood, wool: 3, sparkle: true });
  if (KIND[t]) return render(KIND[t][0], { mood, wool: 3, sparkle: true });
  return eggArt();
}

export function eggArt() {
  return render('egg', {});
}
