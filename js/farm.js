import { animalArt as stickerArt, snakeArt as stickerSnake } from './farm-art.js';
import * as W from './farm-world.js';
import * as clock from './clock.js';

// The farm: coins from chores buy mystery eggs, feed, a fence, sheep, cows and buildings.
// Prices and growth times come from a 90-day simulation (docs/farm-economy.md): a new stage every one to
// three weeks, a few steady wins every day, and the farmhouse after about two months.
// Animals never die. Hungry animals just stop laying until they're fed. The fox only comes through a broken fence,
// and for children under 8 it only gives the animals a fright (no eggs that day): it never takes one.

export const KINDS = {
  chicken: { name: 'Chicken', baby: 'Chick', babyIcon: '🐣', icon: '🐔', feed: 1, grow: 5, sound: 'cluck', small: true },
  duck: { name: 'Duck', baby: 'Duckling', babyIcon: '🐤', icon: '🦆', feed: 1, grow: 5, sound: 'quack', small: true },
  lizard: { name: 'Lizard', baby: 'Baby lizard', babyIcon: '🦎', icon: '🦎', feed: 1, grow: 5, sound: 'chirp', small: true, rare: 'Rare!', perk: 'Lizards eat the bugs, so hens sometimes lay a golden egg.' },
  croc: { name: 'Crocodile', baby: 'Baby crocodile', babyIcon: '🐊', icon: '🐊', feed: 2, grow: 8, sound: 'snap', small: true, rare: 'Super rare!', perk: 'Foxes are too scared to come near your farm.' },
  sheep: { name: 'Sheep', baby: 'Lamb', babyIcon: '🐑', icon: '🐑', feed: 2, grow: 10, sound: 'baa' },
  cow: { name: 'Cow', baby: 'Calf', babyIcon: '🐮', icon: '🐄', feed: 3, grow: 16, sound: 'moo' },
  snake: { name: 'Snake', baby: 'Baby snake', babyIcon: '🐍', icon: '🐍', feed: 1, grow: 5, sound: 'hiss', small: true, rare: 'Rare!', perk: 'Snakes chase the mice out of the feed shed: 1 free feed every day you work.' },
  // Pigs (Nov 2026, painted farm only): a piglet grows into a pig that snuffles up a truffle every second day it is fed on a job day.
  pig: { name: 'Pig', baby: 'Piglet', babyIcon: '🐷', icon: '🐖', feed: 2, grow: 8, sound: 'oink', perk: 'Pigs snuffle up a truffle every second day you work.' },
  // 24 Nov 2026 (Joel): a rare Komodo dragon hatches now and then from mystery and rare eggs and the treasure chest.
  komodo: { name: 'Komodo dragon', baby: 'Baby Komodo dragon', babyIcon: '🦎', icon: '🦎', feed: 2, grow: 8, sound: 'snap', small: true, rare: 'Super rare!', perk: 'The biggest lizard in the world! Foxes keep well away from your farm.' },
  dino: { name: 'Dinosaur', baby: 'Baby dinosaur', babyIcon: '🦕', icon: '🦕', feed: 3, grow: 20, sound: 'roar', rare: 'Ultra rare!', perk: 'Foxes run away from your dinosaur, and your hens feel brave: more golden eggs!' },

  // New friends (Nov 2026): the Aussie Island Mates and the Rock Pool Crew. Each one is a named character,
  // one of each per farm. They make nothing to sell (so they add no coins), eat free with the "Feed everyone"
  // tap, and egg-layers really hatch from eggs. Sea creatures only live in the rock pool.
  // who/full: their name; about: personality; fact: a true fact read aloud; pal: the line on their card.
  koala: { name: 'Koala', baby: 'Baby koala', who: 'Kip', full: 'Kip the koala', group: 'mate', babyIcon: '🐨', icon: '🐨', feed: 0, grow: 6, sound: 'grunt', pal: '😴 Napper',
    about: 'Kip is a sleepy hugger. He naps anywhere, but always wakes up for gum leaves.', fact: 'Koalas sleep up to 20 hours a day!', arrive: 'You planted a gum tree, and Kip the koala climbed right in!' },
  roo: { name: 'Kangaroo', baby: 'Joey', who: 'Skip and Joey', full: 'Skip and Joey the kangaroos', plural: true, group: 'mate', babyIcon: '🦘', icon: '🦘', feed: 0, grow: 6, sound: 'boing', pal: '🦘 Bouncers',
    about: 'Skip is bouncy and fast. Joey peeks out of the pouch so he never misses a thing.', fact: 'A baby kangaroo is called a joey, and it lives in its mum\'s pouch!', arrive: 'You built a bush paddock, and Skip and Joey came bouncing in!' },
  wombat: { name: 'Wombat', baby: 'Baby wombat', who: 'Digby', full: 'Digby the wombat', group: 'mate', babyIcon: '🦡', icon: '🦡', feed: 0, grow: 6, sound: 'snuffle', pal: '⛏️ Digger',
    about: 'Digby is a strong little digger in a hard hat.', fact: 'Wombat poo is cube-shaped!', arrive: 'You built a burrow, and Digby the wombat dug his way in!',
    perk: 'Digby sometimes digs up something pretty for your farm.' },
  platypus: { name: 'Platypus', baby: 'Puggle', who: 'Paddles', full: 'Paddles the platypus', group: 'mate', babyIcon: '🦫', icon: '🦫', feed: 0, grow: 6, sound: 'bloop', pal: '🌟 One of a kind',
    about: 'Paddles has a duck bill, a beaver tail and otter feet, and is proud to be one of a kind.', fact: 'Platypuses lay eggs! A baby platypus is called a puggle.' },
  kookaburra: { name: 'Kookaburra', baby: 'Kookaburra chick', who: 'Kooky', full: 'Kooky the kookaburra', group: 'mate', babyIcon: '🐦', icon: '🐦', feed: 0, grow: 5, sound: 'laugh', pal: '😂 Laugher',
    about: 'Kooky laughs at everything, loudest at sunrise, and wakes the whole farm.', fact: 'Kookaburras hatch from eggs, high up in a hollow tree!' },
  echidna: { name: 'Echidna', baby: 'Puggle', who: 'Spike', full: 'Spike the echidna', group: 'mate', babyIcon: '🦔', icon: '🦔', feed: 0, grow: 6, sound: 'snuffle', pal: '🦔 Shy and kind',
    about: 'Spike is shy and spiky outside, soft and friendly inside, and curls up when surprised.', fact: 'Echidnas lay eggs too! A baby echidna is also called a puggle.' },
  crab: { name: 'Hermit crab', baby: 'Baby crab', who: 'Clawdia', full: 'Clawdia the hermit crab', group: 'sea', babyIcon: '🦀', icon: '🦀', feed: 0, grow: 5, sound: 'click', pal: '🏠 Builder',
    about: 'Her shell is a tiny house, and she is always making it better: a door, a window, a chimney.', fact: 'Hermit crabs move into a bigger shell as they grow!', arrive: 'You built a rock pool, and Clawdia the hermit crab scuttled in!' },
  squid: { name: 'Squid', baby: 'Baby squid', who: 'Rocket', full: 'Rocket the squid', group: 'sea', babyIcon: '🦑', icon: '🦑', feed: 0, grow: 5, sound: 'whoosh', pal: '🚀 Rocket',
    about: 'Rocket blasts off backwards like a real rocket.', fact: 'Squids really do jet through the water, and they hatch from eggs!' },
  turtle: { name: 'Sea turtle', baby: 'Hatchling', who: 'Myrtle', full: 'Myrtle the sea turtle', group: 'sea', babyIcon: '🐢', icon: '🐢', feed: 0, grow: 7, sound: 'bloop', pal: '🐢 Wise',
    about: 'Myrtle is slow, wise and kind. She has swum all the way around the island, twice!', fact: 'Sea turtles hatch from eggs buried in the sand!' },
  puffer: { name: 'Pufferfish', baby: 'Baby puffer', who: 'Puff', full: 'Puff the pufferfish', group: 'sea', babyIcon: '🐡', icon: '🐡', feed: 0, grow: 5, sound: 'puff', pal: '🎈 Puffer',
    about: 'Puff is small and a bit jumpy, puffs up big when surprised, then giggles.', fact: 'Pufferfish hatch from tiny eggs!' },
  octopus: { name: 'Octopus', baby: 'Baby octopus', who: 'Inky', full: 'Inky the octopus', group: 'sea', babyIcon: '🐙', icon: '🐙', feed: 0, grow: 6, sound: 'bloop', pal: '🐚 Gardener',
    about: 'Inky has eight arms and eight ideas, and builds a garden of shells round her den.', fact: 'Real octopuses make shell gardens, and octopus mums guard their eggs!' },
  manta: { name: 'Manta ray', baby: 'Baby manta', who: 'Zoom', full: 'Zoom the manta ray', group: 'sea', babyIcon: '🌊', icon: '🌊', feed: 0, grow: 6, sound: 'whoosh', pal: '🌀 Glider',
    about: 'Zoom glides like a spaceship and does barrel rolls just for fun.', fact: 'Manta ray babies don\'t hatch from a nest. They are born rolled up like a burrito, then unroll and swim!', arrive: 'You built a jetty out to deep water, and Zoom the manta ray glided in!' },
};
// Which new friends hatch from which egg (always one you don't have yet).
const BUSH_EGG = ['platypus', 'echidna', 'kookaburra'];
const POOL_EGG = ['turtle', 'squid', 'puffer', 'octopus'];
const GROUP_NAME = { mate: '🦘 Aussie Island Mates', sea: '🌊 Rock Pool Crew' };

// 24 Nov 2026 (Joel): halved. A full farm was making 600 to 1000 coins a day against 25 to 70 from jobs, so coin
// penalties and prices meant little. Now a full farm makes about 300 a day.
export const GOODS = {
  egg: { icon: '🥚', name: 'Egg', price: 8 },
  duckegg: { icon: '🦆🥚', name: 'Duck egg', price: 10 },
  golden: { icon: '🌟', name: 'Golden egg', price: 20 },
  rainbow: { icon: '🌈', name: 'Rainbow egg', price: 50 },
  wool: { icon: '🧶', name: 'Wool', price: 15 },
  milk: { icon: '🥛', name: 'Milk', price: 10 },
  apple: { icon: '🍎', name: 'Apple', price: 3 },
  honey: { icon: '🍯', name: 'Honey', price: 10 },
  truffle: { icon: '🍄', name: 'Truffle', price: 8 },
};
Object.assign(GOODS, W.CROP_GOODS); // carrots, wheat and sunflowers from the painted farm's garden beds
// The farm stand adds 1 coin for every 5 to everything sold.
const priceOf = (f, g) => GOODS[g].price + (f.built.stand ? Math.max(1, Math.round(GOODS[g].price / 5)) : 0);
// About 1 in 30 eggs a hen lays is a rainbow egg (worth GOODS.rainbow).
const RAINBOW_CHANCE = 0.03;

// What a child gets for selling a grown animal. They choose which one, say goodbye, and can bring it back
// within 10 seconds (see "selling an animal" below).
// 21 Nov 2026 (Joel): an animal always sells for LESS than it cost, so buying and selling never makes coins.
// An animal remembers what was paid for it (`paid`) and sells for 70% of that (a 🪙 30 egg hen sells for 🪙 20,
// a 🪙 1500 dinosaur egg dinosaur for 🪙 1050). Animals born on the farm, gifts, new friends and animals from
// before 21 Nov use this table, which sits under the cheapest way to get each one (mystery egg 🪙 30,
// piglet 120, lamb 150, calf 350; the new friends' homes cost 150 to 450).
const SELL_SHARE = 0.7;
export const SELL = { chicken: 20, duck: 20, lizard: 20, snake: 20, croc: 20, komodo: 20, sheep: 100, pig: 80, cow: 240, dino: 20,
  platypus: 60, echidna: 60, kookaburra: 60, wombat: 80, koala: 100, roo: 120,
  crab: 80, turtle: 70, squid: 70, puffer: 70, octopus: 70, manta: 150 };
// "hen" reads better than "chicken" when saying goodbye.
export const sellPrice = (a) => (a.paid > 0 ? Math.max(5, Math.floor((a.paid * SELL_SHARE) / 5) * 5) : SELL[a.type]);
// What each egg costs, so a hatched animal knows what was paid for it.
const EGG_PAID = { mystery: 30, rare: 90, dino: 1500, bush: 150, pool: 150, treasure: 300 };
const animalWord = (type) => (type === 'chicken' ? 'hen' : KINDS[type].name.toLowerCase());
// The words for saying goodbye: "your hen" for farm animals, "Kip the koala" for the named friends.
function byeWords(type) {
  const k = KINDS[type];
  if (k.who) return { yours: k.full, Yours: k.full, short: k.who, keep: k.who, It: k.who, goes: k.plural ? 'go' : 'goes', is: k.plural ? 'are' : 'is', place: 'home' };
  const w = animalWord(type);
  return { yours: `your ${w}`, Yours: `Your ${w}`, short: w, keep: `my ${w}`, It: 'It', goes: 'goes', is: 'is', place: 'farm' };
}

// The shop words below take their prices straight from GOODS (above), so they always match what things really sell for.
// stars: ⭐ job stars needed too (about 1 for every 10 coins on big things). Stars only come from doing jobs,
// so however much the farm sells, the next big thing still takes real chores.
export const SHOP = [
  // Selling a grown animal: the child picks which one next. Only shows when they have a grown animal.
  { id: 'sell', sell: true, icon: '👋', name: 'Sell an animal', price: 0, level: 1, does: 'Choose a grown animal to go to a happy new farm, and get coins for it.' },
  { id: 'egg', icon: '🥚', name: 'Mystery egg', price: 30, level: 1, does: "Hatch it to see what's inside! Usually a chicken… sometimes a duck, a lizard, a cheeky snake, a crocodile, a Komodo dragon… or, very rarely, a dinosaur!" },
  { id: 'repair', icon: '🪵', name: 'Fix the fence', price: 10, level: 1, does: 'Keeps the fox out for another week.' },
  { id: 'veg', icon: '🥕', name: 'Vegetable patch', price: 60, stars: 5, level: 1, building: true, does: 'Grows carrots and greens: 2 free feeds every day you feed your animals.' },
  { id: 'coop', icon: '🛖', name: 'Chicken coop', price: 100, stars: 10, level: 1, building: true, does: 'A cosy home for your hens: room for 4 more small animals, and the fox can never take a hen from the coop.' },
  { id: 'rareegg', icon: '💎', name: 'Rare egg', price: 90, stars: 5, level: 2, does: 'A sparkly egg with rarer animals: ducks, lizards, snakes, crocodiles, a rare Komodo dragon… and a 1 in 20 chance of a dinosaur!' },
  { id: 'box', icon: '🎁', name: 'Mystery box', price: 45, level: 2, does: 'Food, an egg, golden corn, a lamb, a decoration… or even a calf!' },
  { id: 'treasure', icon: '💰', name: 'Treasure chest', price: 300, stars: 20, level: 3, does: 'Bigger surprises: a rare egg (maybe a Komodo dragon!), a calf, a piglet, two rainbow eggs or golden corn for every baby.' },
  { id: 'lamb', icon: '🐑', name: 'Lamb', price: 150, stars: 15, level: 2, does: 'Feed it and it grows wool to shear and sell.' },
  // Painted farm only (painted: true): hidden from the shop when the painted farm is switched off.
  { id: 'piglet', icon: '🐷', name: 'Piglet', price: 120, stars: 12, level: 2, painted: true, does: `Grows into a pig that snuffles up a truffle every second day you work. Truffles sell for ${GOODS.truffle.price}!` },
  { id: 'shears', icon: '✂️', name: 'Sheep shears', price: 25, level: 2, building: true, tool: true, does: `You need these to shear your sheep. Every bag of wool sells for ${GOODS.wool.price} coins!` },
  { id: 'strong', icon: '🧱', name: 'Strong fence', price: 80, stars: 8, level: 2, building: true, does: 'Fence repairs last two weeks instead of one.' },
  { id: 'hive', icon: '🐝', name: 'Beehive', price: 120, stars: 10, level: 2, building: true, does: `Busy bees make a jar of honey every 3 days you feed your animals. Honey sells for ${GOODS.honey.price}!` },
  { id: 'dog', icon: '🐕', name: 'Farm dog', price: 200, stars: 20, level: 2, building: true, does: 'A loyal farm dog. The fox never comes near your farm again, even if the fence breaks.' },
  { id: 'pond', icon: '💧', name: 'Duck pond', price: 160, stars: 15, level: 2, building: true, needsDuck: true, does: 'Happy ducks lay 2 eggs a day.' },
  { id: 'calf', icon: '🐮', name: 'Calf', price: 350, stars: 30, level: 3, does: 'Grows into a cow that gives milk, and one day has a calf of her own.' },
  { id: 'orchard', icon: '🍎', name: 'Apple orchard', price: 250, stars: 25, level: 3, building: true, does: `Three apple trees: 2 apples every day you feed your animals. Apples sell for ${GOODS.apple.price} each.` },
  { id: 'stand', icon: '🏪', name: 'Farm stand', price: 300, stars: 30, level: 3, building: true, does: 'Sell from your own stand: everything you sell is worth more (1 extra coin for every 5).' },
  { id: 'bottles', icon: '🍼', name: 'Milk bottles', price: 20, level: 3, building: true, tool: true, does: `You need these to milk your cow. Every bottle of milk sells for ${GOODS.milk.price} coins.` },
  // New friends: homes bring a visitor (home: who moves in); eggs hatch one you don't have yet.
  { id: 'bushegg', icon: '🪺', name: 'Bush egg', price: 150, stars: 15, level: 3, egg: BUSH_EGG, does: 'Platypuses, echidnas and kookaburras all lay eggs! Hatch Paddles the platypus, Spike the echidna or Kooky the kookaburra: always one you don\'t have yet.' },
  { id: 'burrow', icon: '🕳️', name: 'Wombat burrow', price: 200, stars: 20, level: 3, building: true, home: 'wombat', does: 'Dig a cosy burrow and Digby the wombat moves in. He sometimes digs up something pretty for your farm.' },
  { id: 'gumtree', icon: '🌳', name: 'Gum tree', price: 250, stars: 25, level: 4, building: true, home: 'koala', does: 'Plant a big gum tree and Kip the sleepy koala comes to live in it.' },
  { id: 'paddock', icon: '🌾', name: 'Bush paddock', price: 350, stars: 35, level: 4, building: true, home: 'roo', does: 'A wide grassy paddock, and Skip the kangaroo bounces in with Joey in the pouch.' },
  { id: 'rockpool', icon: '🌊', name: 'Rock pool', price: 400, stars: 40, level: 4, building: true, home: 'crab', does: 'A sparkly rock pool for sea friends (up to 6). Clawdia the hermit crab moves in straight away!' },
  { id: 'poolegg', icon: '🫧', name: 'Rock pool egg', price: 150, stars: 15, level: 4, needs: 'rockpool', egg: POOL_EGG, does: 'Sea turtles, squid, pufferfish and octopuses hatch from eggs! Hatch Myrtle, Rocket, Puff or Inky: always one you don\'t have yet.' },
  { id: 'jetty', icon: '🛶', name: 'Jetty', price: 450, stars: 45, level: 4, needs: 'rockpool', building: true, home: 'manta', does: 'A wooden jetty out to deep water, and Zoom the manta ray glides in to live in your rock pool.' },
  // Land (24 Nov 2026): a cheaper first step, then river and hilltop land, each with its own painted picture.
  { id: 'landm', icon: '🌼', name: 'Meadow land', price: 1000, stars: 15, level: 2, painted: true, land: 1, does: 'A bit more room, with wildflowers and a stone wall all around. Everything stays right where it is.' },
  { id: 'land1', icon: '🏞️', name: 'River land', price: 2500, stars: 40, level: 3, painted: true, land: 2, does: 'A bigger paddock with a river, a bridge and willow trees. Everything stays right where it is.' },
  { id: 'land2', icon: '⛰️', name: 'Hilltop land', price: 6000, stars: 90, level: 4, painted: true, land: 3, does: 'The biggest paddock of all, with rolling hills, a lake and mountains. Everything stays right where it is.' },
  // Special land pieces (24 Nov 2026): just for looks, two squares each way. Need Meadow land (so there's room).
  { id: 'wildflowers', icon: '🌸', name: 'Wildflower patch', price: 600, stars: 12, level: 2, painted: true, building: true, minLand: 1, does: 'A bright patch of wildflowers for your farm.' },
  { id: 'bush', icon: '🌲', name: 'Little bush forest', price: 900, stars: 20, level: 3, painted: true, building: true, minLand: 1, does: 'Three tall trees, a mossy log and ferns: a shady corner for your farm.' },
  { id: 'hill', icon: '⛰️', name: 'Grassy hill', price: 1200, stars: 25, level: 3, painted: true, building: true, minLand: 1, does: 'A little hill with rocks and a winding path to the top.' },
  { id: 'beach', icon: '🏖️', name: 'Beach corner', price: 1500, stars: 30, level: 3, painted: true, building: true, minLand: 1, does: 'Sand, a sandcastle, a beach umbrella and little waves.' },
  { id: 'barn', icon: '🛖', name: 'Big barn', price: 500, stars: 50, level: 4, building: true, does: 'Room for 14 small animals, 4 sheep, 3 cows and 2 dinosaurs.' },
  { id: 'pony', icon: '🐴', name: 'Pony', price: 600, stars: 50, level: 4, building: true, does: 'Your very own pony! Tap it to go for a gallop around the farm.' },
  { id: 'mill', icon: '⚙️', name: 'Windmill', price: 700, stars: 70, level: 4, needs: 'barn', building: true, does: 'Grinds feed: small animals eat free, and everyone else costs 1 coin less.' },
  { id: 'house', icon: '🏡', name: 'Farmhouse', price: 1200, stars: 120, level: 4, needs: 'mill', building: true, does: 'A cosy farmhouse for your farm family. Next dream: the big beautiful farmhouse!' },
  { id: 'manor', icon: '🏰', name: 'Big beautiful farmhouse', price: 3000, stars: 300, level: 4, needs: 'house', building: true, does: 'The ultimate dream: a big, beautiful farmhouse with a porch, flowers and a light in every window. 🎉' },
  { id: 'dinoegg', icon: '🦕', name: 'Dinosaur egg', price: 1500, stars: 150, level: 4, does: 'Very rare and very special: a real baby dinosaur for your farm!' },
];

const LEVELS = [null,
  { name: 'Little Coop', icon: '🐣', next: 'Grow 4 hens or ducks' },
  { name: 'Barnyard', icon: '🌾', next: 'Shear your first wool' },
  { name: 'Big Farm', icon: '🐑', next: 'Grow a calf into a cow' },
  { name: 'Dream Farm', icon: '🐄', next: 'Build the barn, windmill, farmhouse and big farmhouse' },
];
const DECOR = ['🌻', '🌷', '⛲', '🎃', '🪁', '🌳', '🍄'];
const FENCE_DAYS = 7;
const BARNYARD_BIRDS = 4;
const FOX_CHANCE = 0.35;   // each day the fence is down
const CALF_EVERY = 14;     // milkings
const NEED_BOTTLES = 'Your cow has milk! Buy milk bottles in the shop to collect it. 🍼';
const pad = (n) => String(n).padStart(2, '0');

function dayNum(key) { const [y, m, d] = key.split('-').map(Number); return Math.round(new Date(y, m - 1, d).getTime() / 86400000); }
const rnd = (n) => Math.floor(Math.random() * n);

export function freshFarm(today) {
  return { animals: [], basket: {}, nest: [], fenceDays: FENCE_DAYS, built: {}, decor: [], feedPacks: 5, spent: 0, sold: 0,
    lastDay: today, events: [], level: 1, sheared: 0, nextId: 1, gift: true };
}

export const grown = (a) => a.growth >= KINDS[a.type].grow;
const capOf = (f) => { const c = f.built.barn ? { small: 14, sheep: 4, pig: 4, cow: 3, dino: 2 } : { small: 8, sheep: 2, pig: 2, cow: 1, dino: 1 }; if (f.built.coop) c.small += 4; return c; };
const countOf = (f, group) => f.animals.filter((a) => (group === 'small' ? KINDS[a.type].small : a.type === group)).length;
const roomFor = (f, type) => {
  const k = KINDS[type];
  // New friends: one of each, and sea creatures only live in the rock pool.
  if (k.group) return !f.animals.some((a) => a.type === type) && (k.group !== 'sea' || !!f.built.rockpool);
  const g = k.small ? 'small' : type;
  return countOf(f, g) < capOf(f)[g];
};
// Which friends from an egg's list could still hatch (ones you don't have yet, with somewhere to live).
const missingOf = (f, list) => list.filter((t) => roomFor(f, t));
const feedCost = (f, a) => Math.max(0, KINDS[a.type].feed - (f.built.mill ? 1 : 0));
const hasGrown = (f, type) => f.animals.some((a) => a.type === type && grown(a));

// ---------- Farm troubles (21 Nov 2026, Joel) ----------
// About once a week something goes wrong: a storm, a flood, a sick animal, pests in the garden or wind,
// and since 24 Nov 2026 a fire, a heatwave, mice in the feed shed or an animal getting out.
// Never two days in a row, at most one new trouble each time the farm is opened, and at most 2 waiting.
// While a storm or flood repair waits, the animals are too unsettled to make anything (they still eat and grow).
// A sick animal makes nothing and doesn't grow until the vet comes. Nothing ever dies.
const TROUBLE_CHANCE = 1 / 6;   // about 1 in 6 days; with "never two in a row" this lands near once a week
const STORM_HITS = { coop: 'chicken coop', barn: 'big barn', house: 'farmhouse', manor: 'big farmhouse', hive: 'beehive', mill: 'windmill', pond: 'duck pond', veg: 'vegetable patch' };
const STORM_COST = { coop: 20, barn: 40, house: 30, manor: 40, hive: 20, mill: 30, pond: 20, veg: 15 };
const FLOOD_COST = 15;
export const vetCost = (type) => (type === 'cow' || type === 'dino' || type === 'croc' || type === 'komodo' ? 50 : type === 'sheep' || type === 'pig' || KINDS[type].group ? 30 : 15);

function rollTrouble(f, day) {
  f.trouble ||= [];
  if (f.trouble.length >= 2 || f.animals.length < 2) return null;
  if (f.troubleDay != null && day - f.troubleDay < 2) return null; // never two days in a row
  if (Math.random() >= TROUBLE_CHANCE) return null;
  const hits = Object.keys(STORM_HITS).filter((b) => f.built[b] && !f.trouble.some((t) => t.hit === b));
  const beds = (f.world?.beds || []).filter((b) => b.crop);
  const sickable = f.animals.filter((a) => grown(a) && !a.sick);
  const choices = [];
  if (hits.length || (!f.built.strong && f.fenceDays > 0)) choices.push(['storm', 3]);
  if (sickable.length) choices.push(['sick', 3]);
  if (!f.trouble.some((t) => t.kind === 'flood')) choices.push(['flood', 2]);
  if (beds.length) choices.push(['pests', 1]);
  if (f.feedPacks >= 2) choices.push(['wind', 1]);
  // 24 Nov 2026 (Joel): a fire, and three more of Claude's: heatwave, mice in the feed shed, an animal gets out.
  if (hits.length) choices.push(['fire', 1]);
  if (f.animals.filter((a) => grown(a)).length >= 3 && !f.trouble.some((t) => t.kind === 'heat')) choices.push(['heat', 1]);
  if (f.feedPacks >= 2 && !hasGrown(f, 'snake')) choices.push(['mice', 1]);   // a grown snake keeps the mice away
  const roamers = f.animals.filter((a) => grown(a) && ['sheep', 'cow', 'pig'].includes(a.type));
  if (roamers.length && !f.trouble.some((t) => t.kind === 'escape')) choices.push(['escape', 1]);
  let r = Math.random() * choices.reduce((n, c) => n + c[1], 0);
  const kind = (choices.find((c) => (r -= c[1]) < 0) || choices[0] || [])[0];
  if (!kind) return null;
  f.troubleDay = day;
  const id = (f.troubleId = (f.troubleId || 0) + 1);
  if (kind === 'storm') {
    if (!hits.length) { // no buildings yet: the storm blows the fence down (the strong fence stands firm)
      f.fenceDays = 0;
      return { icon: '⛈️', text: 'A big storm blew your fence down! Fix the fence before the fox finds the gap.' };
    }
    const hit = hits[rnd(hits.length)];
    f.trouble.push({ id, kind, hit, icon: '⛈️', name: `Fix the ${STORM_HITS[hit]}`, cost: STORM_COST[hit] });
    return { icon: '⛈️', text: `A big storm damaged your ${STORM_HITS[hit]}! Your animals are too unsettled to make anything until it's fixed.` };
  }
  if (kind === 'sick') {
    const a = sickable[rnd(sickable.length)];
    a.sick = true;
    const nm = KINDS[a.type].who || `your ${KINDS[a.type].name.toLowerCase()}`;
    f.trouble.push({ id, kind, animal: a.id, icon: '🤒', name: `Vet for ${nm}`, cost: vetCost(a.type) });
    return { icon: '🤒', text: `Oh no, ${nm} is sick! Call the vet to make ${KINDS[a.type].who ? 'them' : 'it'} better.` };
  }
  if (kind === 'flood') {
    const lost = beds.length ? beds[rnd(beds.length)] : null;
    if (lost) { lost.crop = null; lost.growth = 0; }
    f.trouble.push({ id, kind, icon: '🌊', name: 'Clean up after the flood', cost: FLOOD_COST });
    return { icon: '🌊', text: `Heavy rain flooded the paddock${lost ? ' and washed away one garden bed' : ''}! Clean up the mud so your animals can get back to work.` };
  }
  if (kind === 'pests') {
    const b = beds[rnd(beds.length)];
    b.growth = Math.max(0, (b.growth || 0) - 1);
    return { icon: '🐛', text: 'Hungry caterpillars nibbled a garden bed, so it needs one more job day to grow.' };
  }
  if (kind === 'fire') {
    const hit = hits[rnd(hits.length)], cost = Math.round(STORM_COST[hit] * 1.5 / 5) * 5;
    f.trouble.push({ id, kind, hit, icon: '🔥', name: `Rebuild the ${STORM_HITS[hit]}`, cost });
    return { icon: '🔥', text: `Lightning started a grass fire! The firefighters put it out and every animal is safe, but your ${STORM_HITS[hit]} got burnt. Rebuild it so your animals can settle down.` };
  }
  if (kind === 'heat') {
    f.trouble.push({ id, kind, icon: '🥵', name: 'Fill the water troughs', cost: 10 });
    return { icon: '🥵', text: "A heatwave! Your animals are too hot to make anything. Fill up the water troughs to cool them down." };
  }
  if (kind === 'mice') {
    const ate = Math.min(2, f.feedPacks);
    f.feedPacks -= ate;
    return { icon: '🐀', text: `Mice got into the feed shed and ate ${ate} bags of feed! (A snake on your farm would chase them away.)` };
  }
  if (kind === 'escape') {
    const a = roamers[rnd(roamers.length)];
    f.trouble.push({ id, kind, icon: '🚪', name: `Thank the neighbour for your ${KINDS[a.type].name.toLowerCase()}`, cost: 10 });
    return { icon: '🚪', text: `Your ${KINDS[a.type].name.toLowerCase()} pushed the gate open and wandered next door! The neighbour brought it back. Say thank you with 10 coins.` };
  }
  const blown = Math.min(3, f.feedPacks);
  f.feedPacks -= blown;
  return { icon: '💨', text: `A strong wind blew ${blown} bags of feed away!` };
}
// Storm and flood repairs that are still waiting stop the farm making things.
const unsettled = (f) => (f.trouble || []).some((t) => t.kind !== 'sick' && t.kind !== 'escape');   // an animal that got out doesn't stop the farm

// Days since the farm was last opened: eggs in the nest hatch, the fence wears out, and the fox may visit.
// The fox takes at most one animal per absence, so a few missed days never wipe out a farm.
// gentle (children under 8): the fox only gives the animals a fright, so hens and ducks lay no eggs today.
// It never takes an animal, because little ones grieve.
export function catchUp(f, today, { gentle = false } = {}) {
  const gap = Math.min(14, dayNum(today) - dayNum(f.lastDay || today));
  if (gap <= 0) return false;
  let foxCame = false;
  for (let i = 1; i <= gap; i++) {
    const hatchable = f.nest.filter((n) => dayNum(n.day) < dayNum(f.lastDay) + i);
    f.nest = f.nest.filter((n) => !hatchable.includes(n));
    hatchable.forEach(() => {
      if (!roomFor(f, 'chicken')) {
        f.basket.egg = (f.basket.egg || 0) + 1;
        f.events.push({ icon: '🪺', text: "The coop was full, so your nest egg went back in the basket." });
        return;
      }
      f.animals.push({ id: f.nextId++, type: 'chicken', growth: 0 });
      f.events.push({ icon: '🐣', text: 'An egg in the nest hatched into a chick!' });
    });
    // The fox only comes once the fence has been broken for a whole day, only takes grown birds,
    // and leaves small flocks (3 or fewer) alone.
    const brokenAlready = f.fenceDays === 0;
    f.fenceDays = Math.max(0, f.fenceDays - 1);
    const prey = f.animals.filter((a) => ((a.type === 'chicken' && !f.built.coop) || a.type === 'duck') && grown(a)); // hens in the coop are safe
    if (!foxCame && brokenAlready && prey.length > 3 && !f.built.dog && !hasGrown(f, 'croc') && !hasGrown(f, 'komodo') && !hasGrown(f, 'dino') && Math.random() < FOX_CHANCE) {
      foxCame = true;
      if (gentle) {
        f.scaredDay = today; // feedAll checks this: no eggs today
        f.events.push({ icon: '🦊', fox: true, gentle: true, text: "A fox sniffed at the broken fence and gave your animals a fright! They're all safe, but too scared to lay eggs today. Fix the fence to keep the fox away." });
        continue;
      }
      const gone = prey[rnd(prey.length)];
      f.animals = f.animals.filter((a) => a !== gone);
      f.events.push({ icon: '🦊', fox: true, text: `A fox sneaked through the broken fence and took a ${KINDS[gone.type].name.toLowerCase()}. Fix the fence to keep your animals safe.` });
    }
  }
  const ev = rollTrouble(f, dayNum(today));
  if (ev) f.events.push(ev);
  f.lastDay = today;
  return true;
}

// Stages only go up, so a fox visit never takes a stage away.
function levelUp(f) {
  const before = f.level;
  const birds = f.animals.filter((a) => (a.type === 'chicken' || a.type === 'duck') && grown(a)).length;
  if (f.level < 2 && birds >= BARNYARD_BIRDS) f.level = 2;
  if (f.level < 3 && f.sheared >= 1) f.level = 3;
  if (f.level < 4 && hasGrown(f, 'cow')) f.level = 4;
  return f.level > before ? f.level : 0;
}

// Bars fill as the lamb grows and its wool comes in, and as the calf grows, so they move every day.
function levelProgress(f) {
  if (f.level === 1) {
    const n = f.animals.filter((a) => (a.type === 'chicken' || a.type === 'duck') && grown(a)).length;
    return { have: Math.min(BARNYARD_BIRDS, n), need: BARNYARD_BIRDS };
  }
  if (f.level === 2) {
    const best = Math.max(0, ...f.animals.filter((a) => a.type === 'sheep').map((a) => (grown(a) ? 0.6 + (a.wool || 0) * 0.13 : (a.growth / KINDS.sheep.grow) * 0.6)));
    return { have: Math.round(best * 10), need: 10 };
  }
  if (f.level === 3) {
    const best = Math.max(0, ...f.animals.filter((a) => a.type === 'cow').map((a) => Math.min(1, a.growth / KINDS.cow.grow)));
    return { have: Math.round(best * 10), need: 10 };
  }
  const done = ['barn', 'mill', 'house', 'manor'].filter((b) => f.built[b]).length;
  return { have: done, need: 4 };
}

export function createFarm(ctx) {
  const { state, esc } = ctx;
  const farmOf = (id) => {
    state.farms ||= {};
    const f = (state.farms[id] ||= freshFarm(ctx.todayKey()));
    if (!f.toolsChecked) { // farms that already sheared or milked before tools existed keep doing it
      if (f.sheared > 0) f.built.shears = true;
      if (f.basket.milk || f.animals.some((a) => a.milks)) f.built.bottles = true;
      f.toolsChecked = true;
    }
    if (id === 'judah' && !f.snakeHome) { // Judah's mystery-egg snake slithered away before snakes could stay
      f.snakeHome = true;
      f.animals.push({ id: f.nextId++, type: 'snake', growth: KINDS.snake.grow });
      f.events.push({ icon: '🐍', text: 'Your snake came home! Snakes stay on the farm now. Feed it every day.' });
      ctx.kvSet('farms', state.farms);
    }
    return f;
  };
  const balance = (id) => ctx.earned(id) + farmOf(id).sold - farmOf(id).spent;
  const starsLeft = (id) => Math.max(0, ctx.stars(id) - (farmOf(id).starsSpent || 0));
  const save = () => ctx.kvSet('farms', state.farms);
  const today = () => ctx.todayKey();

  // ---------- the painted farm (Grown-ups → Open → New painted farm) ----------
  // When it's on, the field is the painted, build-your-own farm (js/farm-world.js) and every animal picture is painted.
  // When it's off, everything is exactly the old farm. The saved farm is the same either way.
  const painted = () => true; // the painted farm is the only farm now (18 Nov 2026); the old farm's drawing code is left unused
  // Pigs only have a painted picture, so a pig still shows (painted) if the painted farm is switched off again.
  const animalArt = (...a) => (painted() || a[0] === 'pig' ? W.paintArt(...a) : stickerArt(...a));
  const snakeArt = () => (painted() ? W.paintArt('snake', true) : stickerSnake());
  const mode = { on: false, sel: null };          // build mode, and what's picked up
  // Moves: placing, moving or planting one thing. 3 on a day the jobs are done, 1 otherwise, 8 on Saturday (Build Day).
  const movesMax = (k) => (clock.now().getDay() === 6 ? 8 : ctx.worked(k.id) ? 3 : 1);
  // Until a child has finished their one-time set-up (f.world.setupDone), moves are free and unlimited.
  const settingUp = (f) => !f.world?.setupDone;
  const movesLeft = (k) => { const f = farmOf(k.id), w = f.world; return settingUp(f) ? 99 : movesMax(k) - (w && w.movesDay === today() ? w.movesUsed || 0 : 0); };
  function useMove(f) { const w = f.world; if (settingUp(f)) return; if (w.movesDay !== today()) { w.movesDay = today(); w.movesUsed = 0; } w.movesUsed++; }
  // Crops grow one step on each day the jobs are done (like the animals, they work when you work).
  function growCrops(k, f) {
    const w = f.world;
    if (!w || !ctx.worked(k.id) || w.cropDay === today()) return 0;
    w.cropDay = today();
    let ready = 0;
    for (const b of w.beds) if (b.crop && b.growth < W.CROPS[b.crop].grow && ++b.growth >= W.CROPS[b.crop].grow) ready++;
    return ready;
  }
  function worldField(k, f) {
    return W.worldHTML({ f, KINDS, grown, level: f.level, mode, movesLeft: movesLeft(k), coins: balance(k.id), stars: starsLeft(k.id), broken: f.fenceDays === 0,
      view: pz, full: !!mode.full, animalBtn: (a, style) => animalHTML(f, a, style), needs: (a) => (a.type === 'sheep' && (a.wool || 0) >= 3 ? 2 : a.fedDay !== today() ? 1 : 0) });
  }
  function toggleBuild(k, el) {
    const f = farmOf(k.id), fin = el?.dataset.finish;
    if (mode.on && f.world && settingUp(f)) { // leaving the one-time set-up takes a second tap, so a slip doesn't end it
      if (fin === 'ask') { mode.asking = true; mode.sel = null; ctx.renderKid(); return ctx.speak('All finished setting up? You get this big set-up once. After this it is a few moves a day.', true); }
      if (fin === 'no') { mode.asking = false; return ctx.renderKid(); }
      if (fin === 'yes') { f.world.setupDone = true; save(); ctx.chime(); }
    }
    mode.on = !mode.on; mode.sel = null; mode.asking = false;
    ctx.renderKid();
    if (mode.on && settingUp(f)) return ctx.speak('Set-up time! Tap something, then tap a glowing square to move it. Move as many things as you like. Tap Done when your farm is just how you want it.', true);
    if (mode.on) ctx.speak(movesLeft(k) > 0 ? `Build time! You have ${movesLeft(k)} move${movesLeft(k) === 1 ? '' : 's'} today. Tap something to move it, or pick seeds to plant.` : 'No moves left today. More tomorrow, when your jobs are done!', true);
  }
  function pick(k, el) {
    const d = el.dataset;
    // Seeds chosen, then a garden bed tapped: plant there. (The bed is also a "move me" button in Build mode and sits
    // on top of its glowing square, so without this the tap picked the bed up instead: bug Joel found, 24 Nov 2026.)
    if (mode.sel?.seed && d.piece?.startsWith('bed:')) {
      const p = W.layout(farmOf(k.id), KINDS).pieces.find((x) => x.id === d.piece);
      if (p && !p.bed.crop) return placeAt(k, p.i, p.j);
    }
    const sel = d.seed ? { seed: d.seed } : d.newbed ? { newbed: true } : { piece: d.piece };
    const same = mode.sel && (mode.sel.seed === sel.seed && mode.sel.piece === sel.piece && !!mode.sel.newbed === !!sel.newbed);
    mode.sel = same ? null : sel;
    ctx.renderKid();
    if (mode.sel) ctx.speak(sel.seed ? 'Now tap a glowing garden bed.' : 'Now tap a glowing square.', true);
  }
  function placeAt(k, i, j) {
    const f = farmOf(k.id), sel = mode.sel;
    if (!mode.on || !sel || movesLeft(k) <= 0) return;
    const { w, pieces } = W.layout(f, KINDS);
    let said;
    if (sel.seed) {
      const c = W.CROPS[sel.seed], p = pieces.find((x) => x.kind === 'bed' && x.i === i && x.j === j);
      if (!c || !p || p.bed.crop || f.level < c.level || balance(k.id) < c.seed) return;
      p.bed.crop = sel.seed; p.bed.growth = 0;
      f.spent += c.seed;
      said = `${c.name} planted! They grow on days your jobs are done.`;
    } else if (sel.newbed) {
      if (w.beds.length >= W.maxBeds(f.level) || balance(k.id) < W.BED.price || starsLeft(k.id) < W.BED.stars || !W.spotFor(f, KINDS, null, i, j)) return;
      const b = { id: w.nextBed++, crop: null, growth: 0 };
      w.beds.push(b); w.at[`bed:${b.id}`] = [i, j];
      f.spent += W.BED.price; f.starsSpent = (f.starsSpent || 0) + W.BED.stars;
      said = 'A new garden bed! Pick some seeds to plant in it.';
    } else {
      const at = W.spotFor(f, KINDS, sel.piece, i, j);
      if (!at) return;
      w.at[sel.piece] = at;
    }
    useMove(f);
    mode.sel = null;
    if (movesLeft(k) <= 0) { mode.on = false; said = `${said ? `${said} ` : ''}That was your last move today. See you tomorrow!`; }
    save();
    ctx.pop();
    ctx.renderKid();
    if (said) ctx.speak(said, true);
  }
  // Picking ripe crops: one bed, or all of them. They go in the basket to sell with everything else.
  function harvest(k, which) {
    const f = farmOf(k.id);
    const beds = W.ripeBeds(f).filter((b) => which === 'all' || b.id === Number(which));
    if (!beds.length) return;
    const got = {};
    for (const b of beds) {
      const c = W.CROPS[b.crop];
      f.basket[c.good] = (f.basket[c.good] || 0) + c.yield;
      got[c.good] = (got[c.good] || 0) + c.yield;
      b.crop = null; b.growth = 0;
    }
    save();
    SOUNDS.coins();
    ctx.renderKid();
    const words = Object.entries(got).map(([g, n]) => `${n} ${GOODS[g].name.toLowerCase()}${n === 1 ? '' : 's'}`).join(' and ');
    ctx.speak(`You picked ${words}! Sell them from your basket.`, true);
    ctx.toast(`🧺 You picked ${Object.entries(got).map(([g, n]) => `${GOODS[g].icon}×${n}`).join(' ')}! Sell them from your basket.`);
  }

  // ---------- sounds (made with the Web Audio API, no files) ----------
  function voice(type, freqs, len = 0.12, gap = 0.1, vol = 0.12) {
    ctx.tone((ac) => freqs.forEach((f, i) => {
      const t = ac.currentTime + i * gap;
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = type;
      const [a, b] = Array.isArray(f) ? f : [f, f];
      o.frequency.setValueAtTime(a, t);
      o.frequency.exponentialRampToValueAtTime(b, t + len);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + len);
      o.connect(g).connect(ac.destination);
      o.start(t);
      o.stop(t + len + 0.02);
    }));
  }
  const SOUNDS = {
    cluck: () => voice('square', [[700, 500], [650, 480], [900, 600]], 0.07, 0.11, 0.06),
    quack: () => voice('sawtooth', [[420, 300], [400, 280]], 0.16, 0.2, 0.08),
    chirp: () => voice('sine', [[2200, 2600], [2400, 2900], [2300, 2700]], 0.05, 0.08, 0.06),
    snap: () => voice('square', [[160, 70], [150, 60]], 0.09, 0.14, 0.12),
    roar: () => voice('sawtooth', [[140, 90], [180, 110], [120, 70]], 0.25, 0.22, 0.12),
    boing: () => voice('sine', [[220, 880], [880, 330]], 0.18, 0.18, 0.15),
    hiss: () => voice('sawtooth', [[3000, 2600], [3200, 2400], [2900, 2500]], 0.12, 0.13, 0.03),
    laugh: () => voice('square', [[700, 1000], [800, 1100], [900, 1250], [1100, 700], [1000, 640], [900, 560]], 0.07, 0.1, 0.045), // kookaburra "koo-koo-ka-ka"
    grunt: () => voice('sawtooth', [[120, 80], [110, 70]], 0.22, 0.26, 0.09),
    snuffle: () => voice('triangle', [[320, 200], [340, 220], [300, 190]], 0.06, 0.09, 0.08),
    click: () => voice('square', [[2000, 1700], [2200, 1900], [2000, 1700]], 0.025, 0.08, 0.05),
    bloop: () => voice('sine', [[300, 700], [360, 820]], 0.12, 0.16, 0.12),
    whoosh: () => voice('triangle', [[200, 1200]], 0.35, 0, 0.08),
    puff: () => voice('sine', [[200, 520], [620, 260]], 0.15, 0.15, 0.12),
    baa: () => voice('sawtooth', [[520, 480], [500, 460], [480, 420]], 0.13, 0.12, 0.07),
    moo: () => voice('sawtooth', [[190, 120]], 0.9, 0, 0.1),
    oink: () => voice('sawtooth', [[260, 180], [280, 190]], 0.12, 0.16, 0.08),
    neigh: () => voice('sawtooth', [[620, 900], [880, 520], [600, 380]], 0.16, 0.1, 0.08),
    coins: () => voice('triangle', [1046, 1318, 1568, 2093], 0.12, 0.07, 0.12),
    crack: () => voice('square', [[300, 120]], 0.06, 0, 0.12),
    fox: () => voice('sawtooth', [[600, 900], [900, 500]], 0.2, 0.2, 0.06),
    foxSoft: () => voice('sine', [[520, 640], [600, 480]], 0.22, 0.24, 0.05), // a quiet "yip yip" for little ones
  };
  // Children under 8 get the gentle fox: it scares the animals but never takes one, with a softer sound.
  const isGentle = (id) => (ctx.kid(id)?.age ?? 99) < 8;

  // ---------- zoom and pan (state survives re-draws) ----------
  const zoom = { ws: 1, u: 1, x: 0, y: 0 };
  function applyZoom(animate = true) {
    const world = document.querySelector('.field .farm-world');
    if (!world) return;
    const field = world.parentElement, W = field.clientWidth, H = field.clientHeight;
    zoom.u = Math.max(1, Math.min(zoom.ws * 1.4, zoom.u));
    zoom.x = Math.min(0, Math.max(W - W * zoom.u, zoom.x));
    zoom.y = Math.min(0, Math.max(H - H * zoom.u, zoom.y));
    world.classList.toggle('dragging', !animate);
    world.style.transform = `translate(${zoom.x}px,${zoom.y}px) scale(${zoom.u / zoom.ws})`;
  }
  function zoomBy(factor, cx, cy) {
    const world = document.querySelector('.field .farm-world');
    if (!world) return;
    const field = world.parentElement;
    const px = cx ?? field.clientWidth / 2, py = cy ?? field.clientHeight / 2;
    const u0 = zoom.u;
    zoom.u = Math.max(1, Math.min(zoom.ws * 1.4, zoom.u * factor));
    zoom.x = px - (px - zoom.x) * (zoom.u / u0);
    zoom.y = py - (py - zoom.y) * (zoom.u / u0);
    applyZoom(cx === undefined);
  }
  // Drag to pan (when zoomed in) and pinch to zoom. A drag doesn't count as a tap on an animal.
  let drag = null, pinch = null, swallowClick = false;
  document.addEventListener('pointerdown', (e) => {
    const field = e.target.closest('.field');
    if (!field || !field.querySelector('.farm-world') || e.target.closest('.zoom-btns') || zoom.u <= 1) return;
    drag = { x: e.clientX, y: e.clientY, zx: zoom.x, zy: zoom.y, moved: false };
  });
  document.addEventListener('pointermove', (e) => {
    if (!drag || pinch) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 8) return;
    drag.moved = true;
    zoom.x = drag.zx + dx; zoom.y = drag.zy + dy;
    applyZoom(false);
  });
  document.addEventListener('pointerup', () => { if (drag?.moved) swallowClick = true; drag = null; });
  document.addEventListener('click', (e) => { if (swallowClick) { swallowClick = false; if (e.target.closest('.field')) { e.stopPropagation(); e.preventDefault(); } } }, true);
  const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
  document.addEventListener('touchstart', (e) => {
    const field = e.target.closest('.field');
    if (!field || !field.querySelector('.farm-world') || e.touches.length !== 2 || zoom.ws <= 1.05) return;
    const r = field.getBoundingClientRect();
    pinch = { d: dist(e.touches), u: zoom.u, cx: (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left, cy: (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top };
    drag = null;
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!pinch || e.touches.length !== 2) return;
    e.preventDefault();
    zoomBy((pinch.u * dist(e.touches) / pinch.d) / zoom.u, pinch.cx, pinch.cy);
  }, { passive: false });
  document.addEventListener('touchend', () => { if (pinch) { pinch = null; swallowClick = true; setTimeout(() => { swallowClick = false; }, 400); } });

  // ---------- zoom and pan on the painted farm (Nov 2026) ----------
  // The whole painted field (.w2-stage) is scaled with one CSS transform, so it stays quick on an old iPad.
  // u: how far zoomed in (1 = the whole farm) · x, y: how far it's been dragged. Kept across re-draws in pz,
  // and also written into the field's HTML (farm-world.js) so a re-draw never jumps.
  const pz = { u: 1, x: 0, y: 0 };
  const PZ_MAX = 3;
  const stageEl = () => document.querySelector('.field.w2 .w2-stage');
  function pzApply(live = false) {
    const st = stageEl();
    if (!st) return;
    const field = st.parentElement, Wd = field.clientWidth, Ht = field.clientHeight;
    pz.u = Math.max(1, Math.min(PZ_MAX, pz.u));
    pz.x = Math.min(0, Math.max(Wd - Wd * pz.u, pz.x));
    pz.y = Math.min(0, Math.max(Ht - Ht * pz.u, pz.y));
    st.classList.toggle('moving', live);
    st.style.transform = `translate(${pz.x}px,${pz.y}px) scale(${pz.u})`;
    const out = field.querySelector('[data-z="out"]');
    if (out) out.disabled = pz.u <= 1.01;
  }
  function pzBy(factor, cx, cy, live = false) {
    const st = stageEl();
    if (!st) return;
    const field = st.parentElement;
    const px = cx ?? field.clientWidth / 2, py = cy ?? field.clientHeight / 2;
    const u0 = pz.u;
    pz.u = Math.max(1, Math.min(PZ_MAX, pz.u * factor));
    pz.x = px - (px - pz.x) * (pz.u / u0);
    pz.y = py - (py - pz.y) * (pz.u / u0);
    pzApply(live);
  }
  // Drag to move around (when zoomed in) and pinch to zoom. A drag or pinch never counts as a tap,
  // so moving around in Build mode can't drop something on the wrong square.
  let pdrag = null, ppinch = null;
  const onButtons = (t) => t.closest('.w2-hud, .w2-view, .w2-zoom');
  document.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || ppinch || !e.target.closest('.field.w2') || onButtons(e.target) || pz.u <= 1) return;
    pdrag = { x: e.clientX, y: e.clientY, zx: pz.x, zy: pz.y, moved: false };
  });
  document.addEventListener('pointermove', (e) => {
    if (!pdrag || ppinch || !e.isPrimary) return;
    const dx = e.clientX - pdrag.x, dy = e.clientY - pdrag.y;
    if (!pdrag.moved && Math.hypot(dx, dy) < 10) return;
    pdrag.moved = true;
    pz.x = pdrag.zx + dx; pz.y = pdrag.zy + dy;
    pzApply(true);
  });
  const endDrag = () => { if (pdrag?.moved) { swallowClick = true; setTimeout(() => { swallowClick = false; }, 400); pzApply(); } pdrag = null; };
  document.addEventListener('pointerup', endDrag);
  document.addEventListener('pointercancel', endDrag);
  document.addEventListener('touchstart', (e) => {
    const field = e.target.closest('.field.w2');
    if (!field || e.touches.length !== 2) return;
    const r = field.getBoundingClientRect();
    ppinch = { d: dist(e.touches), u: pz.u, cx: (e.touches[0].clientX + e.touches[1].clientX) / 2 - r.left, cy: (e.touches[0].clientY + e.touches[1].clientY) / 2 - r.top };
    pdrag = null;
  }, { passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!ppinch || e.touches.length !== 2) return;
    e.preventDefault();
    pzBy((ppinch.u * dist(e.touches) / ppinch.d) / pz.u, ppinch.cx, ppinch.cy, true);
  }, { passive: false });
  document.addEventListener('touchend', () => {
    if (!ppinch) return;
    ppinch = null; swallowClick = true; setTimeout(() => { swallowClick = false; }, 400);
    pzApply();
  });

  // ---------- drawing ----------
  // Spread animals evenly over the field (below the buildings), with a little jitter so it looks natural.
  // width: how much of the field (in %) the land animals spread over (less once the rock pool takes the right side).
  function spot(a, i, n, width = 80) {
    const cols = Math.max(2, Math.ceil(Math.sqrt(n * 1.8 * (width / 80))));
    const rows = Math.ceil(n / cols);
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = 4 + ((col + 0.5) / cols) * width + ((a.id * 7) % 7) - 3;
    const y = 26 + ((row + 0.5) / Math.max(rows, 2)) * 56 + ((a.id * 5) % 6) - 3;
    return `left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;--dur:${5 + (a.id % 5)}s;--delay:-${a.id % 4}s`;
  }
  // Sea friends swim in the rock pool (right side of the field), up to 6 spots.
  const POOL_SPOTS = [[66, 25], [80, 28], [63, 41], [78, 44], [66, 57], [81, 60]];
  function poolSpot(a, i) {
    const [x, y] = POOL_SPOTS[i % POOL_SPOTS.length];
    return `left:${x}%;top:${y}%;--dur:${5 + (a.id % 5)}s;--delay:-${a.id % 4}s`;
  }

  // Night: from when the night window opens until the new day starts (3am).
  function isNight() {
    const s = state.settings || {};
    const startH = s.dayStartHour ?? 3;
    const now = clock.now();
    if (now.getHours() < startH) return true;
    return s.nightOpen ? now >= clock.atTime(s.nightOpen, startH) : now.getHours() >= 18;
  }
  // The face each animal's picture shows: hungry until fed today, sleepy at night, otherwise happy.
  const moodOf = (a) => (a.sick ? 'sick' : a.fedDay !== today() ? 'hungry' : isNight() ? 'sleepy' : 'happy');
  const nameOf = (a) => { const k = KINDS[a.type]; return k.full || (grown(a) ? k.name : k.baby); };

  function animalHTML(f, a, where) {
    const k = KINDS[a.type];
    const big = grown(a);
    const hungry = a.fedDay !== today();
    let mood = '';
    if (a.type === 'sheep' && (a.wool || 0) >= 3) mood = '✂️';
    else if (hungry) mood = '🍽️';
    return `<button class="animal ${big ? '' : 'baby'} ${a.type === 'cow' ? 'big' : ''} ${hungry ? 'hungry' : ''} ${!hungry && isNight() ? 'sleepy' : ''}" data-action="farm-tap" data-id="${a.id}" style="${where}" aria-label="${nameOf(a)}">
      <span class="body">${animalArt(a.type, big, a.wool || 0, moodOf(a))}</span>${mood ? `<span class="mood ${mood === '✂️' ? 'shear' : 'eat'}">${mood}</span>` : ''}</button>`;
  }

  // Close-ups along the bottom: one card per animal with how it's growing and what it needs.
  function stripHTML(f) {
    if (!f.animals.length) return '';
    return `<div class="pals">${f.animals.map((a) => {
      const k = KINDS[a.type];
      const big = grown(a);
      const hungry = a.fedDay !== today();
      let bar = 1;
      let note;
      if (!big) { bar = a.growth / k.grow; note = `🌱 ${a.growth}/${k.grow}`; }
      else if (a.type === 'sheep') { bar = (a.wool || 0) / 3; note = (a.wool || 0) >= 3 ? (f.built.shears ? '✂️ Shear me!' : '✂️ Needs shears') : `🧶 ${a.wool || 0}/3`; }
      else if (a.type === 'cow') { bar = ((a.milks || 0) % CALF_EVERY) / CALF_EVERY; note = f.built.bottles ? '🥛 Milk' : '🍼 Needs bottles'; }
      else if (a.type === 'chicken' || a.type === 'duck') note = '🥚 Eggs';
      else if (a.type === 'pig') note = '🍄 Truffles';
      else if (k.pal) note = k.pal;
      else note = a.type === 'croc' || a.type === 'komodo' ? '🛡️ Guard' : a.type === 'snake' ? '🐭 Mouse catcher' : '🐛 Bug hunter';
      return `<button class="pal ${hungry ? 'hungry' : ''}" data-action="farm-tap" data-id="${a.id}">
        ${animalArt(a.type, big, a.wool || 0, moodOf(a))}
        <b>${k.who || (big ? k.name : k.baby)}</b>
        <span class="pal-bar"><i style="width:${Math.round(bar * 100)}%"></i></span>
        <small>${hungry ? '🍽️ Hungry' : note}</small></button>`;
    }).join('')}</div>`;
  }

  function fieldHTML(f) {
    const broken = f.fenceDays === 0;
    const wobbly = f.fenceDays > 0 && f.fenceDays <= 2;
    const bld = [
      f.built.coop ? '' : '<span class="bld coop" title="Coop">🛖</span>',
      f.built.pond ? '<span class="bld pond" title="Duck pond"></span>' : '',
      f.built.barn ? `<svg class="bld barn" viewBox="0 0 60 50" aria-label="Big barn"><path d="M5 22 L30 4 L55 22 V48 H5 Z" fill="#c2410c" stroke="#7c2d12" stroke-width="2"/><rect x="22" y="28" width="16" height="20" fill="#fef3c7" stroke="#7c2d12" stroke-width="2"/><path d="M22 28 L38 48 M38 28 L22 48" stroke="#7c2d12" stroke-width="2"/></svg>` : '',
      f.built.mill ? `<svg class="bld mill" viewBox="0 0 60 70" aria-label="Windmill"><path d="M24 30 L36 30 L40 68 L20 68 Z" fill="#e7e5e4" stroke="#78716c" stroke-width="2"/><g class="blades"><path d="M30 30 L30 4 L36 6 Z M30 30 L56 30 L54 36 Z M30 30 L30 56 L24 54 Z M30 30 L4 30 L6 24 Z" fill="#a8a29e" stroke="#57534e"/></g><circle cx="30" cy="30" r="3" fill="#57534e"/></svg>` : '',
      f.built.coop ? `<svg class="bld coop" viewBox="0 0 60 50" aria-label="Chicken coop"><path d="M8 24 L30 8 L52 24 Z" fill="#b45309" stroke="#78350f" stroke-width="2"/><rect x="12" y="24" width="36" height="20" fill="#fde68a" stroke="#78350f" stroke-width="2"/><path d="M26 44 V32 a4 4 0 0 1 8 0 V44" fill="#78350f"/><path d="M34 44 L46 50" stroke="#78350f" stroke-width="2"/></svg>` : '',
      f.built.veg ? `<svg class="bld veg" viewBox="0 0 80 44" aria-label="Vegetable patch"><rect x="2" y="18" width="76" height="24" rx="6" fill="#92400e"/>${[10, 24, 38, 52, 66].map((x) => `<path d="M${x} 20 l-5 -12 M${x} 20 l0 -15 M${x} 20 l5 -12" stroke="#16a34a" stroke-width="3" stroke-linecap="round"/><path d="M${x - 4} 22 L${x + 4} 22 L${x} 35 Z" fill="#f97316"/>`).join('')}</svg>` : '',
      f.built.hive ? `<span class="bld hive-wrap"><svg class="hive" viewBox="0 0 50 60" aria-label="Beehive"><rect x="22" y="44" width="6" height="14" fill="#78350f"/><path d="M8 46 Q8 8 25 8 Q42 8 42 46 Z" fill="#fbbf24" stroke="#92400e" stroke-width="2"/><path d="M12 20 H38 M9 30 H41 M8 40 H42" stroke="#92400e" stroke-width="2"/><circle cx="25" cy="40" r="4" fill="#78350f"/></svg><span class="bee">🐝</span></span>` : '',
      f.built.orchard ? `<svg class="bld orchard" viewBox="0 0 100 60" aria-label="Apple orchard">${[18, 50, 82].map((x) => `<rect x="${x - 3}" y="36" width="6" height="22" fill="#78350f"/><circle cx="${x}" cy="26" r="16" fill="#16a34a"/>${[[-7, 20], [5, 18], [-2, 31], [8, 29]].map(([dx, y]) => `<circle cx="${x + dx}" cy="${y}" r="3" fill="#dc2626"/>`).join('')}`).join('')}</svg>` : '',
      f.built.stand ? `<svg class="bld stand" viewBox="0 0 70 62" aria-label="Farm stand"><rect x="8" y="30" width="54" height="22" fill="#d97706" stroke="#78350f" stroke-width="2"/><path d="M4 30 L12 12 H58 L66 30 Z" fill="#fff" stroke="#dc2626" stroke-width="2"/>${[12, 26, 40, 54].map((x) => `<path d="M${x} 12 L${x + 7} 12 L${x + 9} 30 L${x - 1} 30 Z" fill="#ef4444"/>`).join('')}<text x="35" y="46" text-anchor="middle" font-size="12">🥚🍎🍯</text><rect x="10" y="52" width="4" height="10" fill="#78350f"/><rect x="56" y="52" width="4" height="10" fill="#78350f"/></svg>` : '',
      f.built.house && !f.built.manor ? '<span class="bld house" title="Farmhouse">🏡</span>' : '',
      f.built.burrow ? `<svg class="bld burrow" viewBox="0 0 70 40" style="width:70px;height:40px" aria-label="Wombat burrow"><path d="M2 40 Q10 6 35 6 Q60 6 68 40 Z" fill="#a16207" stroke="#713f12" stroke-width="2"/><path d="M22 40 Q22 20 35 20 Q48 20 48 40 Z" fill="#3f2a14"/><path d="M8 32 l4 -6 M60 30 l-3 -6 M30 10 l2 -4" stroke="#65a30d" stroke-width="3" stroke-linecap="round"/></svg>` : '',
      f.built.gumtree ? `<svg class="bld gumtree" viewBox="0 0 64 84" style="width:64px;height:84px" aria-label="Gum tree"><path d="M28 84 Q30 56 24 40 M32 84 Q34 52 44 36 M30 60 Q36 48 30 34" stroke="#e7e5e4" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M28 84 Q30 56 24 40 M32 84 Q34 52 44 36" stroke="#a8a29e" stroke-width="2" fill="none" stroke-dasharray="3 6"/>${[[20, 30, 15], [44, 26, 16], [32, 16, 15], [12, 44, 10], [52, 42, 10]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.75}" fill="#6b9080" stroke="#4a6b5d" stroke-width="1.5"/>`).join('')}</svg>` : '',
      f.built.paddock ? `<svg class="bld paddock" viewBox="0 0 96 50" style="width:96px;height:50px" aria-label="Bush paddock"><rect x="0" y="24" width="96" height="26" rx="8" fill="#eab308" opacity=".75"/>${[8, 20, 34, 48, 62, 76, 88].map((x) => `<path d="M${x} 46 l-3 -12 M${x} 46 l0 -14 M${x} 46 l3 -12" stroke="#a16207" stroke-width="2" stroke-linecap="round"/>`).join('')}<path d="M2 22 H94 M2 32 H94" stroke="#78350f" stroke-width="3"/>${[4, 34, 64, 92].map((x) => `<rect x="${x - 2}" y="16" width="5" height="24" fill="#78350f"/>`).join('')}</svg>` : '',
      f.built.manor ? `<svg class="bld manor" viewBox="0 0 120 80" aria-label="Big beautiful farmhouse"><rect x="14" y="34" width="92" height="42" fill="#fff7ed" stroke="#9a3412" stroke-width="2"/><path d="M6 36 L60 6 L114 36 Z" fill="#dc2626" stroke="#7f1d1d" stroke-width="2"/><rect x="84" y="10" width="10" height="18" fill="#9a3412"/>${[24, 44, 70, 90].map((x) => `<rect x="${x}" y="42" width="10" height="10" fill="#fde047" stroke="#9a3412"/>`).join('')}<path d="M52 76 V58 a8 8 0 0 1 16 0 V76" fill="#7c2d12"/><rect x="10" y="62" width="100" height="4" fill="#9a3412"/>${[16, 30, 92, 104].map((x) => `<circle cx="${x}" cy="76" r="3" fill="#f472b6"/>`).join('')}</svg>` : '',
    ].join('');
    // The farm grows bigger as it's built: the world gets wider and starts zoomed out to fit, and
    // children can zoom in (➕ / pinch) and drag around to see their animals up close.
    const shown = bld.split('class="bld ').length - 1 + (f.built.pony ? 1 : 0) + (f.built.dog ? 1 : 0) + (f.built.rockpool ? 2 : 0);
    // The rock pool sits on the right of the field; land animals spread over the rest, sea friends swim in it.
    const pool = !!f.built.rockpool;
    const land = f.animals.filter((a) => !pool || KINDS[a.type].group !== 'sea');
    const sea = pool ? f.animals.filter((a) => KINDS[a.type].group === 'sea') : [];
    const poolHTML = pool ? `<svg class="rockpool" viewBox="0 0 120 100" preserveAspectRatio="none" aria-label="Rock pool" style="position:absolute;left:60%;top:22%;width:38%;height:58%;pointer-events:none">
        <ellipse cx="58" cy="52" rx="56" ry="46" fill="#a8a29e" stroke="#78716c" stroke-width="2"/>
        ${[[10, 30], [22, 10], [60, 6], [98, 14], [112, 50], [96, 88], [56, 96], [16, 80]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="8" fill="#d6d3d1" stroke="#78716c" stroke-width="1.5"/>`).join('')}
        <ellipse cx="58" cy="52" rx="46" ry="37" fill="#38bdf8"/><ellipse cx="58" cy="56" rx="38" ry="28" fill="#0ea5e9" opacity=".6"/>
        <path d="M30 40 q6 -4 12 0 M64 70 q6 -4 12 0 M74 34 q6 -4 12 0" stroke="#e0f2fe" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="20" cy="56" r="3" fill="#fda4af"/><circle cx="96" cy="66" r="3" fill="#fde68a"/>
        ${f.built.jetty ? '<path d="M120 22 L84 40 L88 46 L120 30 Z" fill="#b45309" stroke="#78350f" stroke-width="1.5"/><path d="M94 35 l3 5 M104 30 l3 5 M114 25 l3 5" stroke="#78350f" stroke-width="1.5"/>' : ''}
      </svg>` : '';
    const ws = Math.min(2.4, 1 + Math.max(0, shown - 3) * 0.12 + Math.max(0, f.animals.length - 8) * 0.04);
    if (zoom.ws !== ws) { zoom.ws = ws; zoom.u = 1; zoom.x = 0; zoom.y = 0; }
    return `
      <div class="field ${broken ? 'broken' : wobbly ? 'wobbly' : ''} ${f.built.strong ? 'strong' : ''}">
        <div class="farm-world" style="width:${ws * 100}%;height:${ws * 100}%;transform:translate(${zoom.x}px,${zoom.y}px) scale(${zoom.u / ws})">
          <div class="buildings">${bld}</div>
          ${poolHTML}
          ${f.decor.map((d, i) => `<span class="decor" style="left:${8 + ((i * 29) % 80)}%">${d}</span>`).join('')}
          ${f.nest.length ? `<span class="nest" title="Eggs in the nest">🪺<small>${f.nest.length}</small></span>` : ''}
          ${f.built.dog ? '<span class="farm-dog" title="Farm dog">🐕</span>' : ''}
          ${f.built.pony ? '<button class="pony" data-action="farm-pony" aria-label="Pony">🐴</button>' : ''}
          ${land.map((a, i) => animalHTML(f, a, spot(a, i, land.length, pool ? 50 : 80))).join('')}
          ${sea.map((a, i) => animalHTML(f, a, poolSpot(a, i))).join('')}
        </div>
        ${!f.animals.length ? '<div class="field-empty">Your farm is waiting!<br>Get a 🥚 mystery egg from the 🛒 shop.</div>' : ''}
        ${broken ? '<span class="fox">🦊</span>' : ''}
        ${ws > 1.05 ? '<div class="zoom-btns"><button data-action="farm-zoom" data-z="in" aria-label="Zoom in">➕</button><button data-action="farm-zoom" data-z="out" aria-label="Zoom out">➖</button></div>' : ''}
      </div>`;
  }

  function panelHTML(k, f) {
    const coins = balance(k.id);
    const lv = LEVELS[f.level];
    const prog = levelProgress(f);
    const hungry = f.animals.filter((a) => a.fedDay !== today());
    const plan = feedPlan(f);
    const goods = Object.entries(f.basket).filter(([, n]) => n > 0);
    const value = goods.reduce((s, [g, n]) => s + priceOf(f, g) * n, 0);
    const canHatch = (f.basket.egg || 0) > 0 && f.nest.length < 2 && roomFor(f, 'chicken');
    return `
      <div class="farm-coins">🪙 <b>${coins}</b> <span class="farm-stars">⭐ ${starsLeft(k.id)}</span></div>
      ${troubleHTML(f, coins)}
      <button class="farm-btn shop" data-action="farm-shop">🛒 Shop</button>
      ${goalHTML(k, f, coins)}
      <div class="farm-level">
        <div>${lv.icon} <b>${lv.name}</b></div>
        <div class="farm-next">${f.level < 4 || prog.have < prog.need ? `Next: ${LEVELS[f.level].next}` : '🎉 Dream farm complete!'}</div>
        <div class="farm-bar"><i style="width:${(prog.have / prog.need) * 100}%"></i><span>${prog.have} / ${prog.need}</span></div>
      </div>
      <button class="farm-btn feed" data-action="farm-feed" ${hungry.length ? '' : 'disabled'}>
        ${hungry.length ? `🌾 Feed everyone <small>${plan.free ? `${plan.free} free + ` : ''}🪙 ${plan.coins}</small>` : '✓ Everyone is fed today'}
      </button>
      <div class="farm-basket">
        <div class="basket-items">🧺 ${goods.length ? goods.map(([g, n]) => `${GOODS[g].icon}×${n}`).join(' ') : '<small>Feed grown animals to fill your basket</small>'}</div>
        <div class="basket-btns">
          ${goods.length ? `<button class="farm-btn sell" data-action="farm-sell">Sell for 🪙 ${value}</button>` : ''}
          ${canHatch ? '<button class="farm-btn hatch" data-action="farm-hatch">🪺 Hatch an egg</button>' : ''}
        </div>
      </div>
      <div class="farm-fence ${f.fenceDays <= 2 ? 'warn' : ''}">
        🪵 ${f.fenceDays ? `Fence: ${f.fenceDays} day${f.fenceDays === 1 ? '' : 's'} left` : 'Fence broken! 🦊'}
        <button class="farm-btn small" data-action="farm-buy" data-item="repair" ${f.fenceDays >= 5 ? 'disabled' : ''}>${f.fenceDays >= 5 ? 'OK ✓' : `Fix 🪙 ${SHOP.find((x) => x.id === 'repair').price}`}</button>
      </div>`;
  }

  // "Needs fixing": each storm, flood or sick animal with its own Fix button.
  function troubleHTML(f, coins) {
    const list = f.trouble || [];
    if (!list.length) return '';
    return `<div class="farm-trouble">${list.map((t) => `
      <div class="trouble-row"><span>${t.icon} ${esc(t.name)}</span>
        <button class="farm-btn small warn" data-action="farm-fix" data-t="${t.id}" ${coins < t.cost ? 'disabled' : ''}>Fix 🪙 ${t.cost}</button></div>`).join('')}</div>`;
  }

  function fixTrouble(k, tid) {
    const f = farmOf(k.id);
    const t = (f.trouble || []).find((x) => x.id === tid);
    if (!t) return;
    if (balance(k.id) < t.cost) {
      ctx.speak(`You need ${t.cost - balance(k.id)} more coins. Do some jobs to earn them!`, true);
      return ctx.toast(`🪙 You need ${t.cost - balance(k.id)} more coins.`);
    }
    f.spent += t.cost;
    f.trouble = f.trouble.filter((x) => x !== t);
    let said = 'All fixed!';
    if (t.kind === 'sick') {
      const a = f.animals.find((x) => x.id === t.animal);
      if (a) { a.sick = false; said = `The vet came. ${KINDS[a.type].who || `Your ${KINDS[a.type].name.toLowerCase()}`} is all better!`; SOUNDS[KINDS[a.type].sound](); }
    } else said = unsettled(f) ? 'Fixed! One more thing to fix.' : 'All fixed! Your animals can get back to work.';
    save();
    SOUNDS.coins();
    ctx.renderKid();
    ctx.speak(said, true);
    ctx.toast(`${t.icon} ${esc(said)}`);
  }

  // Which hungry animals the free feeds cover first, and what the rest cost.
  function feedPlan(f) {
    let free = 0;
    let coins = 0;
    let packs = f.feedPacks + (f.built.veg && f.prodDay !== today() ? 2 : 0);
    for (const a of f.animals.filter((x) => x.fedDay !== today()).sort((x, y) => grown(x) - grown(y))) {
      const c = feedCost(f, a);
      if (c === 0) continue;
      if (packs > 0) { packs--; free++; } else coins += c;
    }
    return { free, coins };
  }

  // The next thing worth saving for, so every coin feels like a step.
  function goalItem(f) {
    const has = (t) => f.animals.some((a) => a.type === t);
    let id = 'egg';
    if (has('sheep') && !f.built.shears) id = 'shears';
    else if (has('cow') && !f.built.bottles) id = 'bottles';
    else if (f.level >= 2 && !has('sheep')) id = 'lamb';
    else if (f.level >= 3 && !has('cow')) id = 'calf';
    // Dream Farm: the barn, windmill and farmhouse first (the stage goal), then the rock pool for something fresh,
    // the big farmhouse, the other new friends, and last the dinosaur egg.
    else if (f.level >= 4) id = ['barn', 'mill', 'house'].find((b) => !f.built[b]) || (canGet(f, 'rockpool') ? 'rockpool' : null)
      || (!f.built.manor ? 'manor' : null) || nextFriend(f) || (roomFor(f, 'dino') ? 'dinoegg' : null);
    else if (f.level >= 2 && has('duck') && !f.built.pond) id = 'pond';
    else if (f.level >= 3 && nextFriend(f)) id = nextFriend(f); // while the calf grows
    else if (!roomFor(f, 'chicken')) id = f.level >= 2 ? 'box' : null;
    return id && SHOP.find((x) => x.id === id);
  }
  // Can this new-friend item be bought now (unlocked, its "needs" built, not built yet, someone left to hatch)?
  function canGet(f, id) {
    const it = SHOP.find((x) => x.id === id);
    if (!it || f.level < it.level || (it.needs && !f.built[it.needs])) return false;
    if (it.egg) return missingOf(f, it.egg).length > 0;
    return !f.built[id];
  }
  const nextFriend = (f) => ['bushegg', 'burrow', 'gumtree', 'rockpool', 'poolegg', 'paddock', 'jetty'].find((id) => canGet(f, id)) || null;
  // What an item costs right now. A friend's home that is built but empty (the friend was sold) can invite
  // them back for what they sold for, with no stars, so selling and inviting back never makes coins.
  function costOf(f, it) {
    if (it.home && f.built[it.id] && !f.animals.some((a) => a.type === it.home)) return { price: SELL[it.home], stars: 0, invite: true };
    return { price: it.price, stars: it.stars || 0, invite: false };
  }

  function goalPct(k, it, coins) { return Math.min(1, Math.max(0, coins) / it.price, it.stars ? starsLeft(k.id) / it.stars : 1); }
  function goalBar(k, it, coins, pct) {
    return `<div class="farm-bar"><i style="width:${Math.round(pct * 100)}%"></i><span>🪙 ${Math.min(Math.max(0, coins), it.price)} / ${it.price}${it.stars ? ` · ⭐ ${Math.min(starsLeft(k.id), it.stars)} / ${it.stars}` : ''}</span></div>`;
  }
  function goalHTML(k, f, coins) {
    const it = goalItem(f);
    if (!it) return '';
    const pct = goalPct(k, it, coins);
    return `<div class="farm-goal ${pct >= 1 ? 'ready' : ''}">
      <span>${pct >= 1 ? '✅ You can buy' : 'Saving for'} ${it.icon} ${it.name}</span>
      ${goalBar(k, it, coins, pct)}</div>`;
  }

  function bodyHTML(k) {
    const f = farmOf(k.id);
    // Full screen (painted farm only): just the field, over the whole screen, with the farm time left in the corner.
    if (painted() && mode.full) return `<div class="farm w2-full"><div class="farm-left">${worldField(k, f)}</div><div class="session-chip w2-time">${esc(ctx.sessionText?.() || '⏳')}</div></div>`;
    return `<div class="farm"><div class="farm-left">${painted() ? worldField(k, f) : fieldHTML(f)}${painted() && mode.on ? '' : stripHTML(f)}</div><aside class="farm-panel">${panelHTML(k, f)}</aside></div>`;
  }

  // The farm on the one-screen view: the animals, and just Feed, Sell, the next thing to buy and the fence.
  // No shop to browse, so a visit is a few seconds.
  function miniHTML(k) {
    const f = farmOf(k.id);
    const coins = balance(k.id);
    const plan = feedPlan(f);
    const hungry = f.animals.filter((a) => a.fedDay !== today()).length;
    const value = Object.entries(f.basket).reduce((s, [g, n]) => s + priceOf(f, g) * n, 0);
    const it = goalItem(f);
    const pct = it ? goalPct(k, it, coins) : 0;
    const shown = f.animals.slice(0, 10);
    return `
      <div class="farm-mini">
        <div class="mini-head"><b>🐔 My farm</b><span>${LEVELS[f.level].icon} ${LEVELS[f.level].name}</span></div>
        <div class="mini-field ${f.fenceDays === 0 ? 'broken' : ''}">
          ${shown.map((a, i) => `<button class="animal mini ${grown(a) ? '' : 'baby'} ${a.fedDay !== today() ? 'hungry' : ''}" data-action="farm-tap" data-id="${a.id}" style="${spot(a, i, shown.length)}">
            <span class="body">${animalArt(a.type, grown(a), a.wool || 0, moodOf(a))}</span>${a.type === 'sheep' && (a.wool || 0) >= 3 ? '<span class="mood">✂️</span>' : ''}</button>`).join('')}
          ${!f.animals.length && !f.gift ? '<div class="field-empty">Save up for a 🥚</div>' : ''}
          ${f.fenceDays === 0 ? '<span class="fox">🦊</span>' : ''}
        </div>
        <div class="mini-actions">
          ${f.gift ? '<button class="farm-btn feed" data-action="farm-gift">🎁 Open your gift egg!</button>' : ''}
          ${hungry ? `<button class="farm-btn feed" data-action="farm-feed">🌾 Feed ${plan.free ? `<small>${plan.free} free</small>` : ''} <small>🪙 ${plan.coins}</small></button>` : f.animals.length ? '<div class="mini-note">✓ Everyone is fed</div>' : ''}
          ${value ? `<button class="farm-btn sell" data-action="farm-sell">🧺 Sell for 🪙 ${value}</button>` : ''}
          ${(f.trouble || []).map((t) => `<button class="farm-btn warn" data-action="farm-fix" data-t="${t.id}">${t.icon} ${esc(t.name)} 🪙 ${t.cost}</button>`).join('')}
          ${f.fenceDays <= 2 && f.animals.length ? `<button class="farm-btn warn" data-action="farm-buy" data-item="repair">🪵 Fix the fence 🪙 ${SHOP.find((x) => x.id === 'repair').price}</button>` : ''}
          ${it ? `<div class="farm-goal ${pct >= 1 ? 'ready' : ''}">
            <span>${pct >= 1 ? '✅' : 'Saving for'} ${it.icon} ${it.name}</span>
            ${goalBar(k, it, coins, pct)}
            ${pct >= 1 ? `<button class="farm-btn buy" data-action="farm-buy" data-item="${it.id}">Buy it! 🪙 ${it.price}</button>` : ''}
          </div>` : ''}
        </div>
      </div>`;
  }

  // A still (not moving) tally of the child's animals for the family board, e.g. 🐔3 🐣1 🦆1.
  function tallyHTML(id) {
    const f = farmOf(id);
    if (!f.animals.length) return f.gift ? '<span class="tally">🎁 a gift egg is waiting</span>' : '<span class="tally">No animals yet</span>';
    const counts = {};
    for (const a of f.animals) { const icon = grown(a) ? KINDS[a.type].icon : KINDS[a.type].babyIcon; counts[icon] = (counts[icon] || 0) + 1; }
    return `<span class="tally">${Object.entries(counts).map(([icon, n]) => `${icon}<b>${n}</b>`).join(' ')}</span>`;
  }

  function goalText(id, coins) {
    const it = goalItem(farmOf(id));
    if (!it) return '';
    const need = it.price - Math.max(0, coins);
    return need > 0 ? `🎯 ${need} more → ${it.icon} ${it.name}` : `✅ Ready for ${it.icon} ${it.name}!`;
  }

  // Small farm picture for the side panel and home screen card.
  function previewIcons(id, max = 6) {
    const f = farmOf(id);
    if (!f.animals.length) return f.gift ? '🎁' : '';
    return f.animals.slice(0, max).map((a) => (grown(a) ? KINDS[a.type].icon : KINDS[a.type].babyIcon)).join('') + (f.animals.length > max ? '…' : '');
  }
  const hungryCount = (id) => farmOf(id).animals.filter((a) => a.fedDay !== today()).length;

  // ---------- overlays: hatching eggs, opening boxes, news ----------
  function overlay(html, onClick) {
    const el = document.createElement('div');
    el.className = 'farm-ov';
    el.innerHTML = `<div class="farm-sheet">${html}</div>`;
    document.body.appendChild(el);
    el.addEventListener('click', (e) => onClick?.(e, el));
    return el;
  }

  // Mystery eggs are mostly chickens; rare eggs lean to rare animals (1 in 20 is a dinosaur); dinosaur eggs always are.
  function rollEgg(kind = 'mystery', f = null) {
    if (kind === 'dino') return 'dino';
    if (kind === 'bush' || kind === 'pool') { // a new friend you don't have yet
      const left = missingOf(f, kind === 'bush' ? BUSH_EGG : POOL_EGG);
      return left[rnd(left.length)];
    }
    if (kind === 'rare') {
      const r = Math.random();
      return r < 0.3 ? 'duck' : r < 0.55 ? 'lizard' : r < 0.7 ? 'croc' : r < 0.75 ? 'komodo' : r < 0.85 ? 'snake' : r < 0.95 ? 'chicken' : 'dino';
    }
    if (kind === 'treasure') {   // the treasure chest's egg: only the rare ones
      const r = Math.random();
      return r < 0.35 ? 'komodo' : r < 0.6 ? 'croc' : r < 0.8 ? 'lizard' : r < 0.95 ? 'snake' : 'dino';
    }
    if (Math.random() < 0.005) return 'dino';
    return rollMystery();
  }
  function rollMystery() {
    const r = Math.random();
    return r < 0.66 ? 'chicken' : r < 0.86 ? 'duck' : r < 0.93 ? 'lizard' : r < 0.98 ? 'snake' : r < 0.99 ? 'croc' : 'komodo';
  }

  // Tap the egg three times to crack it open.
  function hatchMystery(f, title = 'A mystery egg!', { gift = false, kind = 'mystery', paid = gift ? 0 : EGG_PAID[kind] } = {}) {
    return new Promise((resolve) => {
      let taps = 0;
      let type = rollEgg(kind, f);
      if (!type) return resolve(null); // nobody left to hatch (the shop stops this before paying)
      if (gift) while (type === 'dino') type = rollMystery(); // a starter egg is never a dinosaur
      if (type === 'dino' && !roomFor(f, 'dino')) type = 'croc';
      // Saved before the animation, so closing the app mid-hatch never loses the animal or the coins.
      const a = { id: f.nextId++, type, growth: 0, paid };
      f.animals.push(a);
      save();
      ctx.speak(`${title} Tap it three times to crack it open!`);
      const el = overlay(`
        <h2>${title}</h2><p>Tap it 3 times to crack it open!</p>
        <button class="big-egg" data-crack>🥚<span class="cracks"></span></button>`, (e) => {
        if (!e.target.closest('[data-crack]') || taps >= 3) return;
        taps++;
        SOUNDS.crack();
        const egg = el.querySelector('.big-egg');
        egg.classList.remove('wobble'); void egg.offsetWidth; egg.classList.add('wobble');
        egg.querySelector('.cracks').textContent = ['', '⚡', '⚡⚡', ''][taps];
        if (taps < 3) return;
        if (type === 'snake') {
          setTimeout(() => {
            el.querySelector('.farm-sheet').innerHTML = `
              <div class="snake-stage"><div class="snake-pop">${snakeArt()}</div></div>
              <div class="rare">${KINDS.snake.rare}</div>
              <h2>Ssssurprise! A baby snake!</h2>
              <p>It wiggled out and said “ssss!” It's staying on your farm. ${KINDS.snake.perk}</p>
              <button class="farm-btn" data-done>Ha ha! 😄</button>`;
            SOUNDS.boing();
            setTimeout(() => SOUNDS.hiss(), 700);
            ctx.speak(`Sssssurprise! A baby snake! It's staying on your farm. ${KINDS.snake.perk}`);
            el.addEventListener('click', (ev) => { if (ev.target.closest('[data-done]')) { el.remove(); resolve(a); } });
          }, 350);
          return;
        }
        const k = KINDS[type];
        if (k.who) { // a new friend: their name, a true fact about eggs, and who they are
          setTimeout(() => {
            el.querySelector('.farm-sheet').innerHTML = `
              <div class="rare">${GROUP_NAME[k.group]}</div>
              <div class="reveal-animal">${animalArt(type, false, 0, 'happy')}</div>
              <h2>${k.full} hatched!</h2>
              <p>${k.fact} ${k.about}</p>
              <button class="farm-btn" data-done>Hello, ${k.who}! 💛</button>`;
            SOUNDS[k.sound]();
            ctx.burst(el.querySelector('.reveal-animal'), 24);
            ctx.speak(`It's ${k.full}! ${k.fact} ${k.about} Feed ${k.who} every day and watch ${k.who} grow.`);
            el.addEventListener('click', (ev) => { if (ev.target.closest('[data-done]')) { el.remove(); resolve(a); } });
          }, 350);
          return;
        }
        setTimeout(() => {
          el.querySelector('.farm-sheet').innerHTML = `
            ${k.rare ? `<div class="rare">${k.rare}</div>` : ''}
            <div class="reveal-animal">${animalArt(type, false)}</div>
            <h2>It's a ${k.baby.toLowerCase()}!</h2>
            <p>${k.perk || `Feed it every day and it grows into a ${k.name.toLowerCase()}.`}</p>
            <button class="farm-btn" data-done>Yay! 🎉</button>`;
          SOUNDS[k.sound]();
          ctx.burst(el.querySelector('.reveal-animal'), k.rare ? 30 : 16);
          ctx.speak(`It's a ${k.baby.toLowerCase()}! ${k.rare || ''} ${k.perk || ''}`);
          el.addEventListener('click', (ev) => { if (ev.target.closest('[data-done]')) { el.remove(); resolve(a); } });
        }, 350);
      });
    });
  }

  function openBox(f) {
    return new Promise((resolve) => {
      const r = Math.random();
      let prize;
      if (r < 0.35) prize = { kind: 'feed' };
      else if (r < 0.6) prize = roomFor(f, 'chicken') ? { kind: 'egg' } : { kind: 'feed' };
      else if (r < 0.75) prize = { kind: 'corn' };
      else if (r < 0.87) prize = roomFor(f, 'sheep') ? { kind: 'lamb' } : { kind: 'feed' };
      else if (r < 0.97) { const d = DECOR.filter((x) => !f.decor.includes(x)); prize = d.length ? { kind: 'decor', icon: d[rnd(d.length)] } : { kind: 'feed' }; }
      else prize = roomFor(f, 'cow') ? { kind: 'calf' } : { kind: 'feed' };
      const el = overlay('<h2>A mystery box!</h2><p>Tap it to open!</p><button class="big-egg box" data-open>🎁</button>', async (e) => {
        if (!e.target.closest('[data-open]')) return;
        SOUNDS.crack();
        if (prize.kind === 'egg') { el.remove(); await hatchMystery(f, 'A mystery egg was inside!', { paid: 45 }); return resolve(); }
        let icon;
        let text;
        if (prize.kind === 'feed') { f.feedPacks += 5; icon = '🌾'; text = 'A bag of feed! 5 free feeds.'; }
        if (prize.kind === 'corn') {
          const baby = f.animals.filter((a) => !grown(a)).sort((a, b) => a.growth - b.growth)[0];
          if (baby) { baby.growth = KINDS[baby.type].grow; icon = '🌽'; text = `Golden corn! Your ${KINDS[baby.type].baby.toLowerCase()} grew up straight away!`; }
          else { f.feedPacks += 5; icon = '🌽'; text = 'Golden corn! 5 free feeds.'; }
        }
        if (prize.kind === 'lamb') { f.animals.push({ id: f.nextId++, type: 'sheep', growth: 0, paid: 45 }); icon = '🐑'; text = 'A baby lamb!'; SOUNDS.baa(); }
        if (prize.kind === 'calf') { f.animals.push({ id: f.nextId++, type: 'cow', growth: 0, paid: 45 }); icon = '🐮'; text = 'Super rare! A baby calf!'; SOUNDS.moo(); }
        if (prize.kind === 'decor') { f.decor.push(prize.icon); icon = prize.icon; text = 'Something pretty for your farm!'; }
        const up = levelUp(f);
        save();
        if (up) setTimeout(() => levelMoment(up), 2500);
        el.querySelector('.farm-sheet').innerHTML = `<div class="reveal-animal">${icon}</div><h2>${text}</h2><button class="farm-btn" data-done>Yay! 🎉</button>`;
        ctx.burst(el.querySelector('.reveal-animal'), 20);
        ctx.speak(text);
        el.addEventListener('click', (ev) => { if (ev.target.closest('[data-done]')) { el.remove(); resolve(); } });
      });
    });
  }

  // 💰 Treasure chest (24 Nov 2026, Joel; not called "magic"): pricier than the mystery box, with bigger things inside. Never empty.
  function openTreasure(f) {
    return new Promise((resolve) => {
      const r = Math.random();
      const babies = f.animals.filter((a) => !grown(a));
      let prize;
      if (r < 0.35 && roomFor(f, 'chicken')) prize = 'egg';   // a small animal needs room
      else if (r < 0.55 && roomFor(f, 'cow')) prize = 'calf';
      else if (r < 0.72 && roomFor(f, 'pig')) prize = 'piglet';
      else if (r < 0.87 || !babies.length) prize = 'rainbow';
      else prize = 'corn';
      const el = overlay('<h2>A treasure chest! ✨</h2><p>Tap it to open!</p><button class="big-egg box treasure" data-open>💰</button>', async (e) => {
        if (!e.target.closest('[data-open]')) return;
        SOUNDS.crack();
        if (prize === 'egg') { el.remove(); await hatchMystery(f, 'A sparkly rare egg! ✨', { kind: 'treasure' }); return resolve(); }
        let icon, text;
        if (prize === 'calf') { f.animals.push({ id: f.nextId++, type: 'cow', growth: 0, paid: 300 }); icon = '🐮'; text = 'A baby calf!'; SOUNDS.moo(); }
        if (prize === 'piglet') { f.animals.push({ id: f.nextId++, type: 'pig', growth: 0, paid: 300 }); icon = '🐷'; text = 'A cute piglet!'; }
        if (prize === 'rainbow') { f.basket.rainbow = (f.basket.rainbow || 0) + 2; icon = '🌈'; text = `Two rainbow eggs to sell! (${GOODS.rainbow.price} each)`; }
        if (prize === 'corn') { babies.forEach((a) => { a.growth = KINDS[a.type].grow; }); icon = '🌽'; text = `Golden corn for everyone! ${babies.length} ${babies.length === 1 ? 'baby' : 'babies'} grew up straight away!`; }
        const up = levelUp(f);
        save();
        if (up) setTimeout(() => levelMoment(up), 2500);
        el.querySelector('.farm-sheet').innerHTML = `<div class="reveal-animal">${icon}</div><h2>${text}</h2><button class="farm-btn" data-done>Wow! ✨</button>`;
        ctx.burst(el.querySelector('.reveal-animal'), 30);
        ctx.speak(text);
        el.addEventListener('click', (ev) => { if (ev.target.closest('[data-done]')) { el.remove(); resolve(); } });
      });
    });
  }

  function showNews(f) {
    if (!f.events.length) return Promise.resolve();
    const news = f.events.splice(0);
    save();
    const fox = news.some((n) => n.fox);
    const gentleFox = fox && news.every((n) => !n.fox || n.gentle);
    if (fox) (gentleFox ? SOUNDS.foxSoft : SOUNDS.fox)();
    return new Promise((resolve) => {
      const el = overlay(`<h2>${gentleFox ? 'Uh-oh!' : fox ? 'Oh no!' : 'While you were away…'}</h2>
        ${news.map((n) => `<div class="news"><span>${n.icon}</span>${esc(n.text)}</div>`).join('')}
        <button class="farm-btn" data-done>OK</button>`, (e) => { if (e.target.closest('[data-done]')) { el.remove(); resolve(); } });
      ctx.speak(news.map((n) => n.text).join(' '));
    });
  }

  // A new friend moves into the home you built (or comes back after being sold, when invited).
  function arrive(f, type, title) {
    const k = KINDS[type];
    const a = { id: f.nextId++, type, growth: k.grow };
    f.animals.push(a);
    save(); // saved before the animation, like hatching
    ctx.renderKid();
    return new Promise((resolve) => {
      const el = overlay(`<div class="rare">${GROUP_NAME[k.group]}</div>
        <div class="reveal-animal">${animalArt(type, true, 0, 'happy')}</div>
        <h2>${esc(title)}</h2><p>${k.about} ${k.fact}</p>
        <button class="farm-btn" data-done>Welcome, ${k.who}! 💛</button>`, (e) => { if (e.target.closest('[data-done]')) { el.remove(); resolve(a); } });
      SOUNDS[k.sound]();
      ctx.chime();
      ctx.burst(el.querySelector('.reveal-animal'), 24);
      ctx.speak(`${title} ${k.about} ${k.fact}`);
    });
  }

  function levelMoment(n) {
    const lv = LEVELS[n];
    const el = overlay(`<div class="reveal-animal">${lv.icon}</div><h2>New farm stage: ${lv.name}!</h2>
      <p>${n === 2 ? 'The mystery box, lambs, the duck pond and a strong fence are in the shop now.' : n === 3 ? 'You can buy a calf now! And new Aussie friends are coming: a bush egg and a wombat burrow are in the shop.' : 'The big barn, windmill and farmhouse are in the shop now, and new friends too: a gum tree, a bush paddock and a rock pool!'}</p>
      <button class="farm-btn" data-done>Woohoo! 🎉</button>`, (e) => { if (e.target.closest('[data-done]')) el.remove(); });
    ctx.chime();
    ctx.burst(el.querySelector('.reveal-animal'), 30);
    ctx.speak(`New farm stage: ${lv.name}!`);
  }

  // ---------- actions ----------
  function feedAll(k) {
    const f = farmOf(k.id);
    const hungry = f.animals.filter((a) => a.fedDay !== today()).sort((a, b) => grown(a) - grown(b));
    const msgs = [];
    // Your animals work as hard as you do: on a day without jobs done, they eat and grow but make nothing.
    const worked = ctx.worked(k.id);
    if (!worked && hungry.length) msgs.push('😴 Your animals are resting today. They work on days you do your jobs!');
    // After a fox fright (gentle fox), hens and ducks are too scared to lay today.
    const scared = f.scaredDay === today();
    if (scared && worked && hungry.some((a) => grown(a) && (a.type === 'chicken' || a.type === 'duck'))) msgs.push('🦊 Your hens and ducks are still a bit scared, so no eggs today. Fix the fence!');
    const upset = unsettled(f);
    if (upset && worked && hungry.length) msgs.push('🛠️ Your animals are too unsettled to make anything. Fix what the weather broke!');
    if (hungry.some((a) => a.sick)) msgs.push('🤒 A sick animal needs the vet before it can grow or make anything.');
    // Gardens, orchard and bees: once a day, when the animals are fed.
    if (worked && !upset && hungry.length && f.prodDay !== today()) {
      f.prodDay = today();
      if (f.built.veg) { f.feedPacks += 2; msgs.push('🥕 Your vegetable patch grew 2 free feeds!'); }
      if (f.built.orchard) { f.basket.apple = (f.basket.apple || 0) + 2; msgs.push('🍎 You picked 2 apples!'); }
      if (f.built.hive && (f.hiveDays = (f.hiveDays || 0) + 1) % 3 === 0) { f.basket.honey = (f.basket.honey || 0) + 1; msgs.push('🍯 A jar of honey!'); }
      if (hasGrown(f, 'snake')) { f.feedPacks += 1; msgs.push('🐍 Your snake chased the mice away: 1 free feed!'); }
      // Digby's perk is just for fun: now and then he digs up a decoration (worth no coins).
      if (hasGrown(f, 'wombat') && Math.random() < 0.2) {
        const d = DECOR.filter((x) => !f.decor.includes(x));
        if (d.length) { f.decor.push(d[rnd(d.length)]); msgs.push('⛏️ Digby dug up something pretty for your farm!'); }
      }
    }
    let fed = 0;
    let laid = 0;
    for (const a of hungry) {
      const c = feedCost(f, a);
      if (c === 0) { /* windmill: small animals eat free */ }
      else if (f.feedPacks > 0) f.feedPacks--;
      else if (balance(k.id) >= c) f.spent += c;
      else { msgs.push('Not enough coins to feed everyone. Do some extra chores!'); break; }
      a.fedDay = today();
      fed++;
      const kind = KINDS[a.type];
      if (a.sick) continue;
      if (!grown(a)) {
        a.growth++;
        if (grown(a)) msgs.push(kind.who ? `${kind.who} is all grown up!` : `Your ${kind.baby.toLowerCase()} grew into a ${kind.name.toLowerCase()}!`);
        continue;
      }
      if (!worked || upset) continue;
      if (scared && (a.type === 'chicken' || a.type === 'duck')) continue;
      if (a.type === 'chicken') {
        const r = Math.random();
        if (r < RAINBOW_CHANCE) { f.basket.rainbow = (f.basket.rainbow || 0) + 1; msgs.push(`A RAINBOW egg! 🌈 It sells for ${GOODS.rainbow.price}!`); }
        else if (r < RAINBOW_CHANCE + (hasGrown(f, 'lizard') ? 0.15 : 0) + (hasGrown(f, 'dino') ? 0.15 : 0)) { f.basket.golden = (f.basket.golden || 0) + 1; msgs.push('A golden egg! 🌟'); }
        else f.basket.egg = (f.basket.egg || 0) + 1;
        laid++;
      }
      if (a.type === 'duck') { f.basket.duckegg = (f.basket.duckegg || 0) + (f.built.pond ? 2 : 1); laid++; }
      if (a.type === 'sheep') a.wool = Math.min(3, (a.wool || 0) + 1);
      if (a.type === 'pig' && (a.digs = (a.digs || 0) + 1) % 2 === 0) { f.basket.truffle = (f.basket.truffle || 0) + 1; msgs.push('Your pig found a truffle! 🍄'); }
      if (a.type === 'cow' && !f.built.bottles) { if (!msgs.includes(NEED_BOTTLES)) msgs.push(NEED_BOTTLES); continue; }
      if (a.type === 'cow') {
        f.basket.milk = (f.basket.milk || 0) + 1;
        a.milks = (a.milks || 0) + 1;
        if (a.milks % CALF_EVERY === 0) {
          if (roomFor(f, 'cow')) { f.animals.push({ id: f.nextId++, type: 'cow', growth: 0 }); msgs.push('Your cow had a calf! 🐮'); }
          else msgs.push('Your cow could have a calf, but there is no room. Build the big barn!');
        }
      }
    }
    if (laid) msgs.unshift(`${laid} egg${laid === 1 ? '' : 's'} laid!`);
    if (f.animals.some((a) => a.type === 'sheep' && a.wool >= 3)) msgs.push(f.built.shears ? 'A sheep is ready to shear. Tap it! ✂️' : 'A sheep is ready to shear! Buy sheep shears in the shop. ✂️');
    if (painted() && growCrops(k, f)) msgs.push('🧺 Your crops are ready to pick!');
    const up = levelUp(f);
    save();
    ctx.renderKid();
    document.querySelectorAll('.animal').forEach((el, i) => setTimeout(() => el.classList.add('eat'), i * 60));
    ctx.pop();
    ctx.speak(fed ? `Yum! ${msgs.join(' ') || 'Everyone is fed.'}` : msgs.join(' '));
    if (msgs.length) ctx.toast(`🌾 ${esc(msgs.join(' · '))}`);
    if (up) setTimeout(() => levelMoment(up), 900);
  }

  function sellAll(k) {
    const f = farmOf(k.id);
    const value = Object.entries(f.basket).reduce((s, [g, n]) => s + priceOf(f, g) * n, 0);
    if (!value) return;
    f.sold += value;
    f.basket = {};
    save();
    SOUNDS.coins();
    ctx.renderKid();
    ctx.burst(document.querySelector('.farm-coins'), 14);
    ctx.speak(`Sold for ${value} coins!`);
  }

  // ---------- selling an animal: choose which one, say goodbye, then 10 seconds to bring it back ----------
  // A quick tap (or a double-tap) can never sell an animal: the child picks the animal, sees its picture,
  // and has to HOLD the sell button. Even then, "Bring it back" undoes it for 10 seconds.
  const HOLD_MS = 1500;   // how long to hold the sell button
  const UNDO_MS = 10000;  // how long "Bring it back" stays on screen
  const sellableOf = (f) => f.animals.filter((a) => grown(a) && SELL[a.type]);

  // Step 1: which animal?
  function sellPicker(k) {
    const f = farmOf(k.id);
    const list = sellableOf(f);
    if (!list.length) return;
    ctx.speak('Which animal will go to a happy new farm? Tap one.', true);
    const el = overlay(`<h2>Which animal?</h2><p>Tap the one that will go to a happy new farm.</p>
      <div class="pals" style="flex-wrap:wrap;justify-content:center;overflow:visible">${list.map((a) => `
        <button class="pal" data-pick="${a.id}">${animalArt(a.type, true, a.wool || 0, 'happy')}<b>${KINDS[a.type].who || KINDS[a.type].name}</b><small>+ 🪙 ${sellPrice(a)}</small></button>`).join('')}</div>
      <button class="farm-btn" data-close>Keep them all 💛</button>`, (e) => {
      if (e.target.closest('[data-close]') || e.target === el) return el.remove();
      const b = e.target.closest('[data-pick]');
      const a = b && farmOf(k.id).animals.find((x) => x.id === Number(b.dataset.pick));
      if (!a) return;
      el.remove();
      sayGoodbye(k, a);
    });
  }

  // Step 2: "Say goodbye to your snake?" with its picture. Hold the button to sell, or keep it.
  function sayGoodbye(k, a) {
    const b = byeWords(a.type), price = sellPrice(a);
    SOUNDS[KINDS[a.type].sound]();
    ctx.speak(`Say goodbye to ${b.yours}? ${b.It} ${b.goes} to a happy new ${b.place}, and you get ${price} coins. Hold the button to sell.`, true);
    const el = overlay(`<div class="reveal-animal">${animalArt(a.type, true, a.wool || 0, 'happy')}</div>
      <h2>Say goodbye to ${b.yours}?</h2>
      <p>${b.It} ${b.goes} to a happy new ${b.place}. You get 🪙 ${price}.</p>
      <button class="farm-btn sell" data-hold style="position:relative;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none">
        <i style="position:absolute;inset:0 auto 0 0;width:0;background:#4ade80"></i><span style="position:relative">Hold to sell 👋</span></button>
      <button class="farm-btn" data-keep>Keep ${b.keep} 💛</button>`, (e) => {
      if (e.target.closest('[data-keep]') || e.target === el) { el.remove(); ctx.speak(`${b.Yours} ${b.is} staying!`, true); }
    });
    // The green fills up while the finger stays down; lifting early empties it and nothing is sold.
    const btn = el.querySelector('[data-hold]'), fill = btn.querySelector('i');
    let timer = null;
    const start = (e) => {
      e.preventDefault();
      if (timer) return;
      fill.style.transition = `width ${HOLD_MS}ms linear`;
      fill.style.width = '100%';
      timer = setTimeout(() => { timer = null; el.remove(); sellAnimal(k, a); }, HOLD_MS);
    };
    const stop = () => {
      if (!timer) return;
      clearTimeout(timer); timer = null;
      fill.style.transition = 'width .2s';
      fill.style.width = '0';
    };
    btn.addEventListener('pointerdown', start);
    ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // Step 3: sold, with a 10-second "Bring it back" (the coins go back too).
  function sellAnimal(k, a) {
    const f = farmOf(k.id);
    const at = f.animals.indexOf(a);
    if (at < 0) return;
    const b = byeWords(a.type), price = sellPrice(a);
    f.animals.splice(at, 1);
    f.sold += price;
    if (a.sick) f.trouble = (f.trouble || []).filter((t) => t.animal !== a.id); // the new farm's vet takes over
    save(); // saved straight away: closing the app now keeps the sale
    SOUNDS.coins();
    ctx.renderKid();
    ctx.speak(`Goodbye, ${b.short}! ${price} coins. Changed your mind? Tap bring it back.`, true);
    let left = UNDO_MS / 1000;
    const label = () => `↩️ Bring it back <small>${left}</small>`;
    const el = overlay(`<div class="reveal-animal">👋</div>
      <h2>${b.Yours} went to a happy new ${b.place}.</h2><p>+ 🪙 ${price}</p>
      <button class="farm-btn" data-undo>${label()}</button>
      <button class="farm-btn sell" data-done>OK</button>`, (e) => {
      if (e.target.closest('[data-undo]')) { finish(); bringBack(); }
      else if (e.target.closest('[data-done]') || e.target === el) finish();
    });
    const tick = setInterval(() => {
      left--;
      if (left <= 0) return finish();
      const b = el.querySelector('[data-undo]');
      if (b) b.innerHTML = label();
    }, 1000);
    function finish() { clearInterval(tick); el.remove(); }
    function bringBack() {
      const g = farmOf(k.id);
      if (g.animals.some((x) => x.id === a.id)) return;
      g.animals.splice(Math.min(at, g.animals.length), 0, a); // back in the same spot on the field
      g.sold -= price;
      save();
      SOUNDS[KINDS[a.type].sound]();
      ctx.renderKid();
      ctx.speak(`${b.Yours} came back home!`, true);
      ctx.toast(`${KINDS[a.type].icon} ${b.Yours} came back home!`);
    }
  }

  function hatchEgg(k) {
    const f = farmOf(k.id);
    if (!(f.basket.egg > 0) || f.nest.length >= 2 || !roomFor(f, 'chicken')) return;
    f.basket.egg--;
    f.nest.push({ day: today() });
    save();
    ctx.renderKid();
    ctx.speak('Your egg is in the nest. It will hatch tomorrow!');
    ctx.toast('🪺 Your egg is in the nest. It hatches tomorrow!');
  }

  function tapAnimal(k, el) {
    const f = farmOf(k.id);
    const a = f.animals.find((x) => x.id === Number(el.dataset.id));
    if (!a) return;
    const kind = KINDS[a.type];
    SOUNDS[kind.sound]();
    document.querySelectorAll(`[data-id="${a.id}"]`).forEach((x) => { x.classList.remove('hop'); void x.offsetWidth; x.classList.add('hop'); });
    if (a.type === 'sheep' && (a.wool || 0) >= 3 && !f.built.shears) {
      ctx.speak('Your sheep is fluffy and ready! You need sheep shears from the shop.', true);
      return ctx.toast(`✂️ Ready to shear! Buy <b>sheep shears</b> in the shop (🪙 ${SHOP.find((x) => x.id === 'shears').price}).`);
    }
    if (a.type === 'sheep' && (a.wool || 0) >= 3) {
      a.wool = 0;
      f.basket.wool = (f.basket.wool || 0) + 1;
      f.sheared++;
      const up = levelUp(f);
      save();
      ctx.renderKid();
      ctx.speak('Snip snip! You sheared the wool!');
      ctx.toast(`✂️ You sheared the wool! 🧶 It sells for 🪙 ${priceOf(f, 'wool')}.`);
      if (up) setTimeout(() => levelMoment(up), 700);
      return;
    }
    if (kind.who) { // new friends: their name, how they're doing, and one thing about them
      let status = a.fedDay === today() ? (isNight() ? 'Sleepy and happy.' : 'Fed and happy!') : 'Hungry!';
      if (!grown(a)) status += ` Growing: ${a.growth} of ${kind.grow}.`;
      const extra = [kind.about, kind.fact, kind.perk].filter(Boolean);
      ctx.speak(`${kind.full}. ${status} ${extra[rnd(extra.length)]}`);
      return ctx.toast(`${kind.icon} <b>${kind.who}</b>: ${esc(status)}`);
    }
    const name = grown(a) ? kind.name : kind.baby;
    let status = a.fedDay === today() ? 'Fed and happy!' : 'Hungry!';
    if (!grown(a)) status += ` Growing: ${a.growth} of ${kind.grow}.`;
    if (a.type === 'sheep' && grown(a)) status += ` Wool: ${a.wool || 0} of 3.`;
    if (kind.perk && grown(a)) status += ` ${kind.perk}`;
    ctx.speak(`${name}. ${status}`);
    ctx.toast(`${grown(a) ? kind.icon : kind.babyIcon} <b>${name}</b>: ${esc(status)}`);
  }

  function shopHTML(k) {
    const f = farmOf(k.id);
    const coins = balance(k.id);
    return `
      <div class="shop-head"><h2>🛒 Farm shop</h2><span class="farm-coins">🪙 <b>${coins}</b> <span class="farm-stars">⭐ ${starsLeft(k.id)}</span></span><button class="farm-btn small" data-close>Close</button></div>
      <p class="star-note">⭐ Job stars come from doing your jobs (1 star for each job). Big things need stars too!</p>
      <div class="shop-list">
        ${SHOP.map((it) => {
          if (it.painted && !painted()) return '';
          const locked = f.level < it.level;
          const cost = costOf(f, it);
          const landNow = W.landOf(f.world);
          const owned = (it.building && f.built[it.id] && !cost.invite) || (it.land && landNow >= it.land);
          const needs = (it.needs && !f.built[it.needs]) || (it.land && landNow < it.land - 1) || (it.minLand && landNow < it.minLand);
          const full = ((it.id === 'egg' || it.id === 'rareegg') && !roomFor(f, 'chicken')) || (it.id === 'dinoegg' && !roomFor(f, 'dino')) || (it.id === 'lamb' && !roomFor(f, 'sheep')) || (it.id === 'calf' && !roomFor(f, 'cow')) || (it.id === 'piglet' && !roomFor(f, 'pig'));
          const allHatched = it.egg && !needs && !missingOf(f, it.egg).length;
          const noDuck = it.needsDuck && !f.animals.some((a) => a.type === 'duck');
          if (it.sell) {
            if (!sellableOf(f).length) return '';
            return `<div class="shop-item"><span class="shop-icon">${it.icon}</span><div><b>${it.name}</b><small>${it.does}</small></div>
              <button class="farm-btn small sellhen" data-buy="${it.id}">Choose one</button></div>`;
          }
          const reason = locked ? `🔒 ${LEVELS[it.level].name}` : owned ? (it.tool || it.land ? 'Got it ✓' : 'Built ✓') : needs ? (it.land || it.minLand ? (it.minLand ? 'Buy Meadow land first' : 'Buy bigger land first') : `Build the ${SHOP.find((x) => x.id === it.needs).name.toLowerCase()} first`) : noDuck ? 'Get a duck first' : full ? (f.built.barn ? 'No room' : 'No room: build the big barn') : allHatched ? 'All hatched ✓' : '';
          const name = cost.invite ? `Invite ${KINDS[it.home].who} back` : it.name;
          const does = cost.invite ? `${KINDS[it.home].full} misses the ${it.name.toLowerCase()}. Invite ${KINDS[it.home].plural ? 'them' : KINDS[it.home].who} back home.` : it.does;
          return `<div class="shop-item ${locked ? 'locked' : ''}">
            <span class="shop-icon">${it.icon}</span>
            <div><b>${name}</b><small>${does}</small></div>
            <button class="farm-btn small" data-buy="${it.id}" ${reason || coins < cost.price || starsLeft(k.id) < cost.stars ? 'disabled' : ''}>${reason || `🪙 ${cost.price}${cost.stars ? ` + ⭐ ${cost.stars}` : ''}`}</button>
          </div>`;
        }).join('')}
      </div>`;
  }

  // First tap reads the item aloud; a second tap on the same button buys it (non-readers hear before they spend).
  function openShop(k) {
    let armed = null;
    const el = overlay(shopHTML(k), async (e) => {
      if (e.target.closest('[data-close]') || e.target === el) return el.remove();
      const item = e.target.closest('.shop-item');
      const b = e.target.closest('[data-buy]');
      const id = (b || item?.querySelector('[data-buy]'))?.dataset.buy;
      const it = SHOP.find((x) => x.id === id);
      if (!it) return;
      if (!b || armed !== id) {
        armed = id;
        el.querySelectorAll('[data-buy]').forEach((x) => {
          if (x.dataset.label) { x.innerHTML = x.dataset.label; delete x.dataset.label; }
          x.classList.remove('armed');
        });
        const btn = el.querySelector(`[data-buy="${id}"]`);
        const c = costOf(farmOf(k.id), it);
        const cost = `${c.price} coins${c.stars ? ` and ${c.stars} job stars` : ''}`;
        const short = c.stars && starsLeft(k.id) < c.stars ? ` You need ${c.stars - starsLeft(k.id)} more job stars: do some jobs!` : '';
        const words = c.invite ? `Invite ${KINDS[it.home].full} back to the ${it.name.toLowerCase()}.` : `${it.name}. ${it.does}`;
        ctx.speak(`${words} ${btn.disabled ? `It costs ${cost}.${short}` : it.sell ? 'Tap again to choose which one.' : `It costs ${cost}. Tap again to buy.`}`, true);
        if (!btn.disabled) { btn.classList.add('armed'); btn.dataset.label = btn.innerHTML; btn.innerHTML = 'Tap again ✓'; }
        return;
      }
      if (b.disabled) return;
      el.remove();
      await buy(k, id);
    });
    el.classList.add('shop');
  }

  async function buy(k, id) {
    const f = farmOf(k.id);
    const it = SHOP.find((x) => x.id === id);
    if (!it || f.level < it.level) return;
    if (it.sell) return sellPicker(k);
    if (it.needs && !f.built[it.needs]) return;
    if (it.painted && !painted()) return;
    if (it.land && (W.layout(f, KINDS).w.land || 0) !== it.land - 1) return; // one land at a time, never twice
    if (it.minLand && W.landOf(f.world) < it.minLand) return;
    if (it.id === 'piglet' && !roomFor(f, 'pig')) return;
    const cost = costOf(f, it);
    if (balance(k.id) < cost.price) {
      ctx.speak(`You need ${cost.price - balance(k.id)} more coins. Do some jobs to earn them!`, true);
      return ctx.toast(`🪙 You need ${cost.price - balance(k.id)} more coins for the ${esc(it.name.toLowerCase())}.`);
    }
    if (cost.stars && starsLeft(k.id) < cost.stars) {
      ctx.speak(`You need ${cost.stars - starsLeft(k.id)} more job stars. Every job you do gives you a star!`, true);
      return ctx.toast(`⭐ You need ${cost.stars - starsLeft(k.id)} more job stars for the ${esc(it.name.toLowerCase())}. Every job = 1 star.`);
    }
    if (it.building && f.built[id] && !cost.invite) return;
    if (it.egg && !missingOf(f, it.egg).length) return; // everyone from this egg already hatched
    f.spent += cost.price;
    f.starsSpent = (f.starsSpent || 0) + cost.stars;
    save();
    SOUNDS.coins();
    if (it.home) { // a new friend's home: they move in (or come back, when invited)
      f.built[id] = true;
      const kh = KINDS[it.home];
      await arrive(f, it.home, cost.invite ? `${kh.full} came back to the ${it.name.toLowerCase()}!` : kh.arrive);
    }
    else if (id === 'bushegg') await hatchMystery(f, 'A bush egg! 🪺', { kind: 'bush' });
    else if (id === 'poolegg') await hatchMystery(f, 'A rock pool egg! 🫧', { kind: 'pool' });
    else if (id === 'egg') await hatchMystery(f);
    else if (id === 'rareegg') await hatchMystery(f, 'A rare egg! ✨', { kind: 'rare' });
    else if (id === 'dinoegg') await hatchMystery(f, 'A dinosaur egg! 🦕', { kind: 'dino' });
    else if (id === 'box') await openBox(f);
    else if (id === 'treasure') await openTreasure(f);
    else if (id === 'repair') { f.fenceDays = f.built.strong ? FENCE_DAYS * 2 : FENCE_DAYS; ctx.toast('🪵 Fence fixed! The fox will stay out.'); ctx.speak('Fence fixed!'); }
    else if (it.land) {
      W.growLand(f.world);
      pz.u = 1; pz.x = 0; pz.y = 0;
      ctx.chime();
      ctx.speak(`You bought the ${it.name.toLowerCase()}! Your farm has lots more room now. Tap Build to spread things out.`);
      ctx.toast(`${it.icon} ${it.name}! Your paddock is bigger, with new things all around it. Everything is right where you left it.`);
    }
    else if (id === 'lamb' || id === 'calf' || id === 'piglet') {
      const type = id === 'lamb' ? 'sheep' : id === 'piglet' ? 'pig' : 'cow';
      f.animals.push({ id: f.nextId++, type, growth: 0, paid: it.price });
      SOUNDS[KINDS[type].sound]();
      ctx.speak(`Welcome, little ${KINDS[type].baby.toLowerCase()}!`);
    } else if (it.building) {
      f.built[id] = true;
      if (id === 'strong') f.fenceDays = Math.max(f.fenceDays, FENCE_DAYS * 2);
      ctx.chime();
      ctx.speak(id === 'manor' ? 'You built the big beautiful farmhouse! Your dream farm is complete!' : it.tool ? `You got the ${it.name.toLowerCase()}!` : `You built the ${it.name.toLowerCase()}!`);
    }
    save();
    ctx.renderKid();
    if (id === 'house') ctx.burst(null, 40);
    if (id === 'manor') { ctx.burst(null, 80); setTimeout(() => ctx.burst(null, 80), 700); }
  }

  // Called when a child opens the Farm tab: catch up on missed days, then show news and the starter gift.
  async function opened(k, { gift = true } = {}) {
    const f = farmOf(k.id);
    if (catchUp(f, today(), { gentle: isGentle(k.id) })) { save(); ctx.renderKid(); }
    mode.on = false; mode.sel = null; mode.asking = false; mode.full = false;
    pz.u = 1; pz.x = 0; pz.y = 0;
    if (painted() && growCrops(k, f)) { save(); ctx.renderKid(); ctx.toast('🧺 Your crops are ready to pick!'); }
    await showNews(f);
    if (f.gift && gift) {
      f.gift = false; // saved together with the new animal inside hatchMystery
      await hatchMystery(f, 'A gift to start your farm!', { gift: true });
      ctx.renderKid();
    } else if (f.fenceDays <= 2 && f.animals.length) {
      (isGentle(k.id) ? SOUNDS.foxSoft : SOUNDS.fox)();
      ctx.speak(f.fenceDays ? 'Your fence is wobbly. Fix your fence!' : 'Your fence is broken! Fix it before the fox comes.', true);
    }
  }

  async function action(a, el) {
    const k = ctx.kid();
    if (!k) return;
    ctx.unlockAudio();
    switch (a) {
      case 'farm-feed': return feedAll(k);
      case 'farm-fix': return fixTrouble(k, Number(el.dataset.t));
      case 'farm-sell': return sellAll(k);
      case 'farm-hatch': return hatchEgg(k);
      case 'farm-tap': return tapAnimal(k, el);
      case 'farm-zoom': return painted() ? pzBy(el.dataset.z === 'in' ? 1.5 : 1 / 1.5) : zoomBy(el.dataset.z === 'in' ? 1.5 : 1 / 1.5);
      case 'farm-full': mode.full = !mode.full; pz.u = 1; pz.x = 0; pz.y = 0; return ctx.renderKid();
      case 'farm-pony': {
        SOUNDS.neigh();
        el.classList.remove('gallop'); void el.offsetWidth; el.classList.add('gallop');
        ctx.speak(['Giddy up!', 'Neigh! Your pony loves you!', 'Off we go, around the farm!'][rnd(3)], true);
        return;
      }
      case 'farm-shop': return openShop(k);
      case 'farm-build': return toggleBuild(k, el);
      case 'farm-pick': return pick(k, el);
      case 'farm-tile': return placeAt(k, Number(el.dataset.i), Number(el.dataset.j));
      case 'farm-bed': return harvest(k, el.dataset.bed);
      case 'farm-buy': return buy(k, el.dataset.item);
      case 'farm-gift': {
        const f = farmOf(k.id);
        if (!f.gift) return;
        f.gift = false;
        await hatchMystery(f, 'A gift to start your farm!', { gift: true });
        return ctx.renderKid();
      }
    }
  }

  return { starsLeft, bodyHTML, miniHTML, tallyHTML, goalText, previewIcons, hungryCount, balance, action, opened, farmOf, catchUp: (id) => catchUp(farmOf(id), today(), { gentle: isGentle(id) }) };
}
