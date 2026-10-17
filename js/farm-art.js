// Cute hand-drawn farm animals as inline SVG (no image files). viewBox 0 0 100 100.

const eye = (x, y, r = 4.6) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#2b2118"/><circle cx="${x + 1.5}" cy="${y - 1.6}" r="${r * 0.38}" fill="#fff"/>`;
const eyes = (y, gap = 10, r) => eye(50 - gap, y, r) + eye(50 + gap, y, r);
const blush = (y, gap = 18) => `<ellipse cx="${50 - gap}" cy="${y}" rx="5.5" ry="3.2" fill="#ff8fa3" opacity=".6"/><ellipse cx="${50 + gap}" cy="${y}" rx="5.5" ry="3.2" fill="#ff8fa3" opacity=".6"/>`;
const shadow = (rx = 26) => `<ellipse cx="50" cy="95" rx="${rx}" ry="4" fill="#000" opacity=".13"/>`;
const birdFeet = '<path d="M42 86 v6 m-4 2 l4 -2 l4 2 M58 86 v6 m-4 2 l4 -2 l4 2" stroke="#ff9a1f" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
const webFeet = '<path d="M36 90 l6 -5 l6 5 z M52 90 l6 -5 l6 5 z" fill="#ff9a1f"/>';
const shell = '<path d="M20 74 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 V88 q-30 10 -60 0 Z" fill="#fffaf0" stroke="#e8d9c2" stroke-width="2"/>';

const ART = {
  chick: () => `${shadow(22)}${birdFeet}
    <circle cx="50" cy="60" r="28" fill="#ffd93b" stroke="#ebb700" stroke-width="2"/>
    <path d="M46 33 q1 -9 6 -3 q4 -7 6 2" fill="#ffd93b" stroke="#ebb700" stroke-width="2"/>
    ${eyes(55, 10)}${blush(64, 17)}<path d="M45 61 h10 l-5 6 z" fill="#ff8a00"/>${shell}`,
  chicken: () => `${shadow(28)}${birdFeet}
    <path d="M80 44 q12 -6 8 10 q8 2 -2 12 q-6 -8 -6 -22z" fill="#f3efe8" stroke="#ddd5c8" stroke-width="2"/>
    <ellipse cx="50" cy="60" rx="31" ry="29" fill="#fff" stroke="#ddd5c8" stroke-width="2"/>
    <circle cx="43" cy="30" r="6.5" fill="#ff5252"/><circle cx="50" cy="27" r="7" fill="#ff5252"/><circle cx="57" cy="30" r="6.5" fill="#ff5252"/>
    <ellipse cx="22" cy="64" rx="7" ry="12" fill="#f1ece4"/><ellipse cx="78" cy="64" rx="7" ry="12" fill="#f1ece4"/>
    ${eyes(52, 11)}${blush(62, 19)}<path d="M45 57 h10 l-5 6 z" fill="#ff9a1f"/><path d="M48 63 q2 8 4 0" fill="#ff5252"/>`,
  duckling: () => `${shadow(22)}${webFeet}
    <circle cx="50" cy="60" r="28" fill="#ffe14d" stroke="#ebc000" stroke-width="2"/>
    <path d="M48 33 q2 -8 6 -1" fill="none" stroke="#ebc000" stroke-width="3" stroke-linecap="round"/>
    ${eyes(54, 10)}${blush(63, 18)}<ellipse cx="50" cy="64" rx="10" ry="4.5" fill="#ff8a00"/>`,
  duck: () => `${shadow(28)}${webFeet}
    <ellipse cx="50" cy="62" rx="32" ry="28" fill="#fff" stroke="#dcd6cc" stroke-width="2"/>
    <path d="M47 35 q3 -9 8 -2" fill="none" stroke="#dcd6cc" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="21" cy="66" rx="7" ry="11" fill="#f0ece6"/><ellipse cx="79" cy="66" rx="7" ry="11" fill="#f0ece6"/>
    ${eyes(54, 11)}${blush(64, 19)}<ellipse cx="50" cy="65" rx="12" ry="5" fill="#ff9a1f"/>`,
  lizard: () => `${shadow(26)}
    <path d="M68 74 q24 4 18 -14 q-5 -9 -12 -2" fill="none" stroke="#5fc46a" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="50" cy="72" rx="20" ry="17" fill="#6fd47a" stroke="#3fa34d" stroke-width="2"/>
    <ellipse cx="34" cy="86" rx="6" ry="4" fill="#5fc46a"/><ellipse cx="66" cy="86" rx="6" ry="4" fill="#5fc46a"/>
    <circle cx="50" cy="44" r="23" fill="#6fd47a" stroke="#3fa34d" stroke-width="2"/>
    <circle cx="40" cy="40" r="8" fill="#fff"/><circle cx="60" cy="40" r="8" fill="#fff"/>${eyes(41, 10, 4.4)}
    <path d="M42 54 q8 6 16 0" fill="none" stroke="#2b5e32" stroke-width="2.5" stroke-linecap="round"/>${blush(52, 16)}
    <circle cx="44" cy="70" r="3" fill="#4bb359"/><circle cx="56" cy="76" r="2.5" fill="#4bb359"/><circle cx="52" cy="66" r="2" fill="#4bb359"/>`,
  croc: () => `${shadow(32)}
    <ellipse cx="50" cy="76" rx="30" ry="14" fill="#5cb85c" stroke="#3c8d3c" stroke-width="2"/>
    <path d="M30 66 l4 -6 l4 6 M44 64 l4 -6 l4 6 M58 64 l4 -6 l4 6" fill="#4aa64a"/>
    <rect x="22" y="44" width="56" height="26" rx="13" fill="#6ac46a" stroke="#3c8d3c" stroke-width="2"/>
    <circle cx="38" cy="38" r="10" fill="#6ac46a" stroke="#3c8d3c" stroke-width="2"/><circle cx="62" cy="38" r="10" fill="#6ac46a" stroke="#3c8d3c" stroke-width="2"/>
    <circle cx="38" cy="37" r="6" fill="#fff"/><circle cx="62" cy="37" r="6" fill="#fff"/>${eye(38, 38, 3.6)}${eye(62, 38, 3.6)}
    <circle cx="44" cy="52" r="1.8" fill="#2f6b2f"/><circle cx="56" cy="52" r="1.8" fill="#2f6b2f"/>
    <path d="M30 62 q20 8 40 0" fill="none" stroke="#2f6b2f" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M36 63 l2 4 l2 -3 M60 63 l2 3 l2 -4" fill="#fff" stroke="#fff"/>${blush(58, 22)}`,
  lamb: (wool = 0) => sheepArt(0.85, wool),
  sheep: (wool = 0) => sheepArt(1, wool),
  calf: () => cowArt(true),
  cow: () => cowArt(false),
  dinoBaby: () => dinoArt(true),
  dino: () => dinoArt(false),
};

// A friendly round dinosaur with back plates; the baby still has a bit of eggshell.
function dinoArt(baby) {
  const s = baby ? 0.85 : 1.05;
  return `<g transform="translate(50 60) scale(${s}) translate(-50 -60)">${shadow(30)}
    <path d="M70 74 q22 2 24 -14 q-10 6 -24 2z" fill="#7ec8e3" stroke="#3f8fb0" stroke-width="2"/>
    <path d="M30 38 l5 -9 l5 8 l6 -10 l5 10 l6 -9 l5 9 l5 -7 l4 9" fill="#f6a5c0" stroke="#d9668e" stroke-width="2" stroke-linejoin="round"/>
    <ellipse cx="50" cy="66" rx="28" ry="24" fill="#7ec8e3" stroke="#3f8fb0" stroke-width="2"/>
    <ellipse cx="50" cy="72" rx="16" ry="14" fill="#d8f1fa"/>
    <circle cx="50" cy="44" r="20" fill="#7ec8e3" stroke="#3f8fb0" stroke-width="2"/>
    ${eyes(42, 8, 4.4)}${blush(50, 14)}
    <path d="M44 51 q6 5 12 0" fill="none" stroke="#2d6a80" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="36" cy="88" rx="7" ry="5" fill="#6bb8d4"/><ellipse cx="64" cy="88" rx="7" ry="5" fill="#6bb8d4"/>
    ${baby ? shell : ''}</g>`;
}

// Fluffier as the wool grows (0 to 3).
function sheepArt(scale, wool) {
  const r = 12 + wool * 1.6;
  const puffs = [[34, 50], [50, 44], [66, 50], [30, 64], [70, 64], [40, 74], [60, 74], [50, 70]];
  return `<g transform="translate(50 60) scale(${scale}) translate(-50 -60)">${shadow(26)}
    <rect x="36" y="78" width="7" height="14" rx="3" fill="#5b4a42"/><rect x="57" y="78" width="7" height="14" rx="3" fill="#5b4a42"/>
    ${puffs.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="#e6e0d6" stroke-width="2"/>`).join('')}
    <ellipse cx="29" cy="54" rx="9" ry="5" fill="#e9c9bd" transform="rotate(-25 29 54)"/><ellipse cx="71" cy="54" rx="9" ry="5" fill="#e9c9bd" transform="rotate(25 71 54)"/>
    <ellipse cx="50" cy="60" rx="15" ry="17" fill="#f6e3d8"/>
    <circle cx="44" cy="44" r="5" fill="#fff"/><circle cx="50" cy="42" r="5.5" fill="#fff"/><circle cx="56" cy="44" r="5" fill="#fff"/>
    ${eyes(57, 7, 3.8)}${blush(66, 11)}<path d="M47 67 q3 3 6 0" fill="none" stroke="#9a6b5e" stroke-width="2" stroke-linecap="round"/></g>`;
}

function cowArt(baby) {
  const s = baby ? 0.85 : 1;
  return `<g transform="translate(50 60) scale(${s}) translate(-50 -60)">${shadow(28)}
    <ellipse cx="50" cy="86" rx="24" ry="9" fill="${baby ? '#d9a066' : '#fff'}" stroke="#d8cfc4" stroke-width="2"/>
    ${baby ? '' : '<path d="M32 30 q-8 -10 -2 -14 q2 6 8 8z M68 30 q8 -10 2 -14 q-2 6 -8 8z" fill="#fff3cf" stroke="#d8c48e" stroke-width="1.5"/>'}
    <ellipse cx="22" cy="44" rx="11" ry="6" fill="${baby ? '#c98d55' : '#fff'}" stroke="#d8cfc4" stroke-width="2" transform="rotate(-20 22 44)"/>
    <ellipse cx="78" cy="44" rx="11" ry="6" fill="${baby ? '#c98d55' : '#fff'}" stroke="#d8cfc4" stroke-width="2" transform="rotate(20 78 44)"/>
    <circle cx="50" cy="50" r="27" fill="${baby ? '#d9a066' : '#fff'}" stroke="#d8cfc4" stroke-width="2"/>
    ${baby ? '<path d="M38 30 q12 10 24 0 q-2 14 -12 16 q-10 -2 -12 -16z" fill="#fff"/>' : '<path d="M30 40 q8 -10 16 -2 q-4 10 -14 8z" fill="#2b2b2b"/><path d="M66 58 q8 -4 8 6 q-8 4 -10 -2z" fill="#2b2b2b"/>'}
    ${eyes(48, 10)}${blush(57, 19)}
    <ellipse cx="50" cy="64" rx="16" ry="10" fill="#ffc2c8" stroke="#e8a1aa" stroke-width="1.5"/>
    <ellipse cx="44" cy="64" rx="2.4" ry="3" fill="#c97683"/><ellipse cx="56" cy="64" rx="2.4" ry="3" fill="#c97683"/>
    ${baby ? '' : '<circle cx="50" cy="80" r="5" fill="#ffcf33" stroke="#c99a00" stroke-width="1.5"/>'}</g>`;
}

const BABY = { chicken: 'chick', duck: 'duckling', lizard: 'lizard', croc: 'croc', sheep: 'lamb', cow: 'calf', dino: 'dinoBaby' };

export function animalArt(type, isGrown, wool = 0) {
  const key = isGrown ? type : BABY[type];
  return `<svg viewBox="0 0 100 100" class="art" aria-hidden="true">${ART[key](wool)}</svg>`;
}

// The surprise snake from a mystery egg (it slithers away, so it never lives on the farm).
export function snakeArt() {
  return `<svg viewBox="0 0 100 100" class="art" aria-hidden="true">
    <ellipse cx="50" cy="94" rx="34" ry="4" fill="#000" opacity=".13"/>
    <path d="M14 82 C 14 60, 46 60, 46 76 S 76 94, 78 64" fill="none" stroke="#3f9e4f" stroke-width="19" stroke-linecap="round"/>
    <path d="M14 82 C 14 60, 46 60, 46 76 S 76 94, 78 64" fill="none" stroke="#7bd36b" stroke-width="14" stroke-linecap="round"/>
    <path d="M14 82 C 14 60, 46 60, 46 76 S 76 94, 78 64" fill="none" stroke="#c9f2a8" stroke-width="4" stroke-dasharray="3 9" stroke-linecap="round"/>
    <circle cx="78" cy="48" r="17" fill="#7bd36b" stroke="#3f9e4f" stroke-width="2"/>
    ${eye(72, 44, 4.2)}${eye(85, 44, 4.2)}
    <ellipse cx="68" cy="53" rx="4" ry="2.4" fill="#ff8fa3" opacity=".6"/><ellipse cx="89" cy="53" rx="4" ry="2.4" fill="#ff8fa3" opacity=".6"/>
    <path d="M73 55 q5 4 10 0" fill="none" stroke="#2f6b2f" stroke-width="2" stroke-linecap="round"/>
    <path class="tongue" d="M78 60 v9 m0 0 l-4 5 m4 -5 l4 5" stroke="#ff4d6d" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  </svg>`;
}
