// 🧑‍🌾 My farmer (26 Nov 2026, the kids' idea via Joel's dictated note): each child makes their own farmer.
// Skin, hair style and hair colour are free (choosing how you look should never cost anything). Outfits and hats
// beyond the starter ones are bought with coins in the Dress-up shop in the Town Square (js/town.js).
// Drawn as one small SVG from layers, so every mix works. Saved on the child's farm as f.me:
//   { skin, hair, hairColor, outfit, hat, owned: [ids of bought outfits and hats] }

export const SKINS = ['#fbe0c8', '#f3c89a', '#e0ac69', '#c68642', '#8d5524', '#5e3a1f'];
export const HAIR_COLOURS = [
  { id: 'brown', c: '#6b4423', name: 'Brown' }, { id: 'dark', c: '#2b1d14', name: 'Black' }, { id: 'blonde', c: '#e9c35e', name: 'Blonde' },
  { id: 'ginger', c: '#c8642b', name: 'Ginger' }, { id: 'light', c: '#a0713f', name: 'Light brown' }, { id: 'pink', c: '#ff8fc7', name: 'Pink' },
  { id: 'blue', c: '#4f9dff', name: 'Blue' }, { id: 'purple', c: '#9d6bff', name: 'Purple' }, { id: 'green', c: '#3fbf7f', name: 'Green' },
  { id: 'silver', c: '#d9dde4', name: 'Silver' },
];
export const HAIRS = [
  { id: 'short', name: 'Short' }, { id: 'spiky', name: 'Spiky' }, { id: 'curly', name: 'Curly' }, { id: 'long', name: 'Long' },
  { id: 'pony', name: 'Ponytail' }, { id: 'pigtails', name: 'Pigtails' }, { id: 'bun', name: 'Bun' },
];
// price 0 = everyone has it. top/bottom: colours; kind picks the shape.
export const OUTFITS = [
  { id: 'overalls-blue', name: 'Blue overalls', icon: '👖', price: 0, kind: 'overalls', top: '#f2f2f2', bottom: '#3f74c9' },
  { id: 'overalls-red', name: 'Red overalls', icon: '👖', price: 0, kind: 'overalls', top: '#fff3c4', bottom: '#d9473f' },
  { id: 'overalls-green', name: 'Green overalls', icon: '👖', price: 0, kind: 'overalls', top: '#fde2e4', bottom: '#3c9a5f' },
  { id: 'overalls-purple', name: 'Purple overalls', icon: '👖', price: 0, kind: 'overalls', top: '#e8f4ff', bottom: '#8a5cd6' },
  { id: 'check', name: 'Check shirt and jeans', icon: '👕', price: 30, kind: 'shirt', top: '#d84a3a', bottom: '#3d5f99', check: true },
  { id: 'rain', name: 'Yellow raincoat', icon: '🧥', price: 40, kind: 'coat', top: '#ffd23f', bottom: '#2f4f8f' },
  { id: 'chef', name: 'Chef', icon: '👨‍🍳', price: 50, kind: 'chef', top: '#ffffff', bottom: '#333a45' },
  { id: 'explorer', name: 'Explorer', icon: '🧭', price: 70, kind: 'shirt', top: '#c9a86a', bottom: '#7a6340', pockets: true },
  { id: 'cowboy', name: 'Cowboy', icon: '🤠', price: 70, kind: 'cowboy', top: '#4d8fd6', bottom: '#5b3a22' },
  { id: 'dress', name: 'Flower dress', icon: '👗', price: 80, kind: 'dress', top: '#ff9ec7', bottom: '#ff9ec7', flowers: true },
  { id: 'fairy', name: 'Fairy', icon: '🧚', price: 100, kind: 'dress', top: '#b9a3ff', bottom: '#b9a3ff', wings: true },
  { id: 'hero', name: 'Superhero', icon: '🦸', price: 100, kind: 'hero', top: '#2f6fe0', bottom: '#2f6fe0', cape: '#e3342f' },
  { id: 'knight', name: 'Knight', icon: '🛡️', price: 120, kind: 'knight', top: '#b8c2cc', bottom: '#8a96a3' },
  { id: 'astro', name: 'Astronaut', icon: '🧑‍🚀', price: 150, kind: 'astro', top: '#f4f6f8', bottom: '#f4f6f8' },
];
export const HATS = [
  { id: 'none', name: 'No hat', icon: '🙂', price: 0 },
  { id: 'straw', name: 'Straw hat', icon: '👒', price: 0 },
  { id: 'cap', name: 'Cap', icon: '🧢', price: 0 },
  { id: 'bow', name: 'Big bow', icon: '🎀', price: 20 },
  { id: 'chefhat', name: 'Chef hat', icon: '👨‍🍳', price: 30 },
  { id: 'beanie', name: 'Beanie', icon: '🧶', price: 30 },
  { id: 'cowboyhat', name: 'Cowboy hat', icon: '🤠', price: 40 },
  { id: 'bunny', name: 'Bunny ears', icon: '🐰', price: 40 },
  { id: 'flowers', name: 'Flower crown', icon: '🌼', price: 50 },
  { id: 'helmet', name: 'Space helmet', icon: '🪐', price: 60 },
  { id: 'crown', name: 'Crown', icon: '👑', price: 100 },
];

/** A new farmer: a different starting look for each child so nobody looks the same on day one. */
export function freshMe(seed = 0) {
  return { skin: [0, 1, 2][seed % 3], hair: 'short', hairColor: ['brown', 'blonde', 'ginger'][seed % 3],
    outfit: ['overalls-blue', 'overalls-red', 'overalls-green'][seed % 3], hat: 'straw', owned: [] };
}
export const has = (me, item) => !item.price || (me?.owned || []).includes(item.id);

const shade = (hex, f) => {   // f < 1 darker, > 1 lighter
  const n = parseInt(hex.slice(1), 16), ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)))));
  return `#${ch.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
};

function hairBack(id, c) {
  const d = shade(c, 0.8);
  if (id === 'long') return `<path d="M27 40 C24 66 26 86 32 92 L68 92 C74 86 76 66 73 40 Z" fill="${d}"/>`;
  if (id === 'pony') return `<path d="M68 32 C86 34 88 58 80 74 C78 62 74 50 66 44 Z" fill="${d}"/>`;
  if (id === 'pigtails') return `<circle cx="23" cy="52" r="9" fill="${d}"/><circle cx="77" cy="52" r="9" fill="${d}"/><path d="M19 58 C14 70 18 78 24 80 C22 72 24 64 27 58Z M81 58 C86 70 82 78 76 80 C78 72 76 64 73 58Z" fill="${d}"/>`;
  if (id === 'curly') return `<g fill="${d}"><circle cx="27" cy="44" r="8"/><circle cx="73" cy="44" r="8"/><circle cx="28" cy="56" r="7"/><circle cx="72" cy="56" r="7"/></g>`;
  if (id === 'bun') return `<circle cx="50" cy="12" r="10" fill="${d}"/>`;
  return '';
}
function hairFront(id, c) {
  const l = shade(c, 1.18);
  const cap = `M28 42 C26 22 38 13 50 13 C62 13 74 22 72 42 C66 32 58 28 50 29 C42 28 34 32 28 42 Z`;
  if (id === 'spiky') return `<path d="M27 42 L26 26 L34 30 L36 15 L44 24 L50 11 L56 24 L64 15 L66 30 L74 26 L73 42 C66 33 58 29 50 30 C42 29 34 33 27 42Z" fill="${c}"/><path d="M40 22 L44 24 L50 14" stroke="${l}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
  if (id === 'curly') return `<g fill="${c}"><circle cx="32" cy="30" r="8"/><circle cx="41" cy="22" r="8"/><circle cx="51" cy="19" r="9"/><circle cx="61" cy="22" r="8"/><circle cx="69" cy="30" r="8"/><circle cx="29" cy="39" r="6"/><circle cx="71" cy="39" r="6"/></g><circle cx="47" cy="18" r="2.5" fill="${l}"/>`;
  const fringe = id === 'long' || id === 'pigtails' || id === 'bun' || id === 'pony'
    ? `<path d="${cap}" fill="${c}"/><path d="M33 36 C40 30 46 34 50 29 C54 34 62 30 67 36" stroke="${shade(c, 0.85)}" stroke-width="2" fill="none"/>`
    : `<path d="${cap}" fill="${c}"/><path d="M30 38 C38 26 52 34 60 25 C64 30 68 33 71 38" fill="${c}"/>`;
  return `${fringe}<path d="M38 20 C44 16 52 15 58 17" stroke="${l}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>`;
}
function hat(id, hairC) {
  switch (id) {
    case 'straw': return `<ellipse cx="50" cy="27" rx="33" ry="8" fill="#e6c36a"/><path d="M34 27 C34 12 66 12 66 27 Z" fill="#f0d27e"/><rect x="34" y="21" width="32" height="5" fill="#d9473f"/><ellipse cx="50" cy="27" rx="33" ry="8" fill="none" stroke="#c9a24c" stroke-width="1.5"/>`;
    case 'cap': return `<path d="M30 30 C30 12 70 12 70 30 Z" fill="#3f74c9"/><path d="M50 30 L84 31 C82 36 70 36 60 34 Z" fill="#2f5aa0"/><circle cx="50" cy="14" r="2.5" fill="#2f5aa0"/>`;
    case 'cowboyhat': return `<path d="M14 30 C26 36 74 36 86 30 C84 38 16 38 14 30Z" fill="#8a5a33"/><path d="M33 31 C32 14 40 10 50 16 C60 10 68 14 67 31 Z" fill="#a06c40"/><rect x="33" y="25" width="34" height="4" fill="#5b3a22"/>`;
    case 'crown': return `<path d="M32 28 L34 12 L42 20 L50 8 L58 20 L66 12 L68 28 Z" fill="#ffd23f" stroke="#e0a800" stroke-width="1.5"/><circle cx="50" cy="20" r="3" fill="#e3342f"/><circle cx="40" cy="23" r="2" fill="#3f74c9"/><circle cx="60" cy="23" r="2" fill="#3fbf7f"/>`;
    case 'flowers': return `<path d="M29 30 C38 22 62 22 71 30" stroke="#5aa060" stroke-width="3" fill="none"/>${[[31, 29, '#ff8fc7'], [40, 24, '#ffd23f'], [50, 22, '#fff'], [60, 24, '#9d6bff'], [69, 29, '#ff8fc7']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="${c}"/><circle cx="${x}" cy="${y}" r="1.6" fill="#f2a900"/>`).join('')}`;
    case 'bow': return `<path d="M50 20 L36 12 C32 16 32 24 36 28 Z M50 20 L64 12 C68 16 68 24 64 28 Z" fill="#ff5fa2"/><circle cx="50" cy="20" r="4" fill="#e0408a"/>`;
    case 'chefhat': return `<rect x="36" y="18" width="28" height="12" fill="#fff" stroke="#d7dbe0"/><circle cx="40" cy="14" r="8" fill="#fff"/><circle cx="50" cy="10" r="9" fill="#fff"/><circle cx="60" cy="14" r="8" fill="#fff"/>`;
    case 'beanie': return `<path d="M29 34 C28 12 72 12 71 34 Z" fill="#e3342f"/><rect x="28" y="29" width="44" height="7" rx="3" fill="#b8241f"/><circle cx="50" cy="11" r="5" fill="#fff"/>`;
    case 'bunny': return `<path d="M38 22 C30 2 36 -4 42 4 C46 10 44 18 43 23Z M62 22 C70 2 64 -4 58 4 C54 10 56 18 57 23Z" fill="#fff" stroke="#e8d6dc" stroke-width="1.5"/><path d="M39 18 C36 8 39 4 41 8 Z M61 18 C64 8 61 4 59 8Z" fill="#ffc2d6"/>`;
    case 'helmet': return `<circle cx="50" cy="40" r="30" fill="rgba(170,215,255,.28)" stroke="#e6ebf0" stroke-width="4"/><path d="M30 26 C36 18 44 15 52 15" stroke="#fff" stroke-width="3" fill="none" opacity=".8" stroke-linecap="round"/>`;
    default: return '';
  }
}
function outfitBody(o, skin) {
  const sd = shade(skin, 0.88);
  const arms = (c) => `<path d="M30 76 C22 80 20 92 22 100" stroke="${c}" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M70 76 C78 80 80 92 78 100" stroke="${c}" stroke-width="9" stroke-linecap="round" fill="none"/><circle cx="22" cy="102" r="5" fill="${skin}"/><circle cx="78" cy="102" r="5" fill="${skin}"/>`;
  const legs = (c, boots = '#5b3a22') => `<rect x="38" y="108" width="10" height="18" rx="4" fill="${c}"/><rect x="52" y="108" width="10" height="18" rx="4" fill="${c}"/><ellipse cx="42" cy="128" rx="8" ry="4.5" fill="${boots}"/><ellipse cx="58" cy="128" rx="8" ry="4.5" fill="${boots}"/>`;
  const torso = (c) => `<path d="M32 74 C32 68 40 64 50 64 C60 64 68 68 68 74 L66 110 L34 110 Z" fill="${c}"/>`;
  let back = '', body = '';
  switch (o.kind) {
    case 'overalls': body = `${legs(o.bottom)}${arms(o.top)}${torso(o.top)}<path d="M36 84 L64 84 L65 110 L35 110 Z" fill="${o.bottom}"/><rect x="38" y="66" width="5" height="20" fill="${o.bottom}"/><rect x="57" y="66" width="5" height="20" fill="${o.bottom}"/><circle cx="40.5" cy="85" r="2" fill="#ffd23f"/><circle cx="59.5" cy="85" r="2" fill="#ffd23f"/><rect x="45" y="92" width="10" height="7" rx="1.5" fill="${shade(o.bottom, 0.85)}"/>`; break;
    case 'shirt': case 'cowboy': body = `${legs(o.bottom)}${arms(o.top)}${torso(o.top)}${o.check ? `<g stroke="${shade(o.top, 0.7)}" stroke-width="2" opacity=".6"><path d="M40 66 V108 M50 64 V108 M60 66 V108 M33 78 H67 M33 90 H67 M34 102 H66"/></g>` : ''}${o.pockets ? `<rect x="37" y="76" width="9" height="8" rx="1" fill="${shade(o.top, 0.85)}"/><rect x="54" y="76" width="9" height="8" rx="1" fill="${shade(o.top, 0.85)}"/>` : ''}<rect x="34" y="100" width="32" height="10" fill="${o.bottom}"/>${o.kind === 'cowboy' ? '<path d="M44 66 L50 76 L56 66" fill="#e3342f"/><rect x="34" y="99" width="32" height="4" fill="#3b2414"/><rect x="47" y="98" width="6" height="6" rx="1" fill="#ffd23f"/>' : ''}`; break;
    case 'coat': body = `${legs(o.bottom, '#2f4f8f')}${arms(o.top)}${torso(o.top)}<path d="M50 66 V110" stroke="${shade(o.top, 0.75)}" stroke-width="1.5"/>${[74, 84, 94].map((y) => `<circle cx="54" cy="${y}" r="1.8" fill="${shade(o.top, 0.6)}"/>`).join('')}`; break;
    case 'chef': body = `${legs(o.bottom, '#222')}${arms(o.top)}${torso(o.top)}${[74, 84, 94].map((y) => `<circle cx="45" cy="${y}" r="1.8" fill="#bbb"/><circle cx="55" cy="${y}" r="1.8" fill="#bbb"/>`).join('')}<path d="M42 66 L50 72 L58 66" fill="#e3342f"/>`; break;
    case 'dress': back = o.wings ? `<g fill="rgba(210,230,255,.85)" stroke="#b9c8ff" stroke-width="1"><ellipse cx="24" cy="76" rx="14" ry="20" transform="rotate(-20 24 76)"/><ellipse cx="76" cy="76" rx="14" ry="20" transform="rotate(20 76 76)"/></g>` : '';
      body = `${legs(skin, o.wings ? '#b9a3ff' : '#e3342f')}${arms(skin)}<path d="M36 70 C36 66 44 64 50 64 C56 64 64 66 64 70 L74 112 L26 112 Z" fill="${o.top}"/>${o.flowers ? [[40, 90], [56, 98], [48, 104], [62, 86], [36, 104]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#fff"/><circle cx="${x}" cy="${y}" r="1" fill="#ffd23f"/>`).join('') : '<g fill="#fff" opacity=".85"><circle cx="40" cy="96" r="1.4"/><circle cx="58" cy="90" r="1.4"/><circle cx="50" cy="104" r="1.4"/><circle cx="64" cy="104" r="1.4"/></g>'}<path d="M38 74 H62" stroke="${shade(o.top, 0.8)}" stroke-width="3"/>`; break;
    case 'hero': back = `<path d="M34 68 C24 90 20 110 24 126 L76 126 C80 110 76 90 66 68 Z" fill="${o.cape}"/>`;
      body = `${legs(o.bottom, '#e3342f')}${arms(o.top)}${torso(o.top)}<path d="M50 74 L56 82 L50 92 L44 82 Z" fill="#ffd23f"/><rect x="34" y="100" width="32" height="5" fill="#ffd23f"/>`; break;
    case 'knight': body = `${legs('#8a96a3', '#5f6b78')}${arms('#b8c2cc')}${torso('#b8c2cc')}<path d="M40 74 H60 V92 C60 100 50 104 50 104 C50 104 40 100 40 92 Z" fill="#3f74c9" stroke="#ffd23f" stroke-width="2"/><path d="M50 78 V98 M43 86 H57" stroke="#ffd23f" stroke-width="2.5"/>`; break;
    case 'astro': body = `${legs('#f4f6f8', '#9aa4ae')}${arms('#f4f6f8')}${torso('#f4f6f8')}<rect x="40" y="76" width="20" height="14" rx="3" fill="#9aa4ae"/><circle cx="45" cy="83" r="2.5" fill="#e3342f"/><circle cx="52" cy="83" r="2.5" fill="#3fbf7f"/><rect x="34" y="96" width="32" height="4" fill="#ff8a3d"/>`; break;
  }
  return { back, body: `${body}<rect x="45" y="58" width="10" height="9" fill="${sd}"/>` };
}

/** The farmer as an SVG string. opts.wave: one arm waves (CSS class), opts.size: px height (or leave to CSS). */
export function farmerSVG(me, opts = {}) {
  me ||= freshMe();
  const skin = SKINS[me.skin] || SKINS[0];
  const hc = (HAIR_COLOURS.find((h) => h.id === me.hairColor) || HAIR_COLOURS[0]).c;
  const o = OUTFITS.find((x) => x.id === me.outfit) || OUTFITS[0];
  const hatId = me.hat || 'none';
  const helmet = hatId === 'helmet';
  const { back, body } = outfitBody(o, skin);
  const face = `<ellipse cx="50" cy="42" rx="20" ry="19" fill="${skin}"/>
    <ellipse cx="30" cy="44" rx="3.5" ry="5" fill="${skin}"/><ellipse cx="70" cy="44" rx="3.5" ry="5" fill="${skin}"/>
    <ellipse cx="42" cy="44" rx="3" ry="3.8" fill="#2b1d14"/><ellipse cx="58" cy="44" rx="3" ry="3.8" fill="#2b1d14"/>
    <circle cx="43" cy="42.6" r="1.1" fill="#fff"/><circle cx="59" cy="42.6" r="1.1" fill="#fff"/>
    <ellipse cx="36" cy="51" rx="4" ry="2.5" fill="#ff9aa2" opacity=".55"/><ellipse cx="64" cy="51" rx="4" ry="2.5" fill="#ff9aa2" opacity=".55"/>
    <path d="M44 52 C47 56 53 56 56 52" stroke="#8a3b2b" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  // Hats sit on top of the hair; a hat that covers the head hides spiky/curly tops a little by drawing over them.
  const style = opts.size ? ` style="height:${opts.size}px;width:auto"` : '';
  return `<svg class="farmer${opts.wave ? ' wave' : ''}" viewBox="${opts.head ? '14 0 72 72' : '0 0 100 136'}"${style} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="50" cy="130" rx="24" ry="5" fill="rgba(0,0,0,.18)"/>
    ${back}${hairBack(me.hair, hc)}${body}${face}${hairFront(me.hair, hc)}${hat(hatId, hc)}${helmet ? '' : ''}
  </svg>`;
}
