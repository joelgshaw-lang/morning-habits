// Offline support: serve from cache first, refresh the cache in the background.
// Bump VERSION when you deploy a change so old files are cleared.
const VERSION = 'v64';
const CACHE = `morning-${VERSION}`;
// The app itself. An update only installs if every one of these downloads, so keep this list short.
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './js/app.js',
  './js/clock.js',
  './js/config.js',
  './js/db.js',
  './js/family.js',
  './js/pinpad.js',
  './js/farm.js',
  './js/farm-art.js',
  './js/farm-world.js',
  './js/portal.js',
  './js/quick.js',
  './js/voice.js',
  './js/fruit.js',
  './js/fruits.js',
  './js/fruit-art.js',
  './fruit.css',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
];
// The painted farm's pictures. These are fetched after the update is in, one small batch at a time, and a failed
// picture never blocks an update (it is simply fetched when it's first shown). On an iPad, one big all-or-nothing
// download (v46, v47) could stop the whole update from arriving.
const ART = [
  './farm-art/a-calf.webp',
  './farm-art/a-chick.webp',
  './farm-art/a-cow.webp',
  './farm-art/a-crab.webp',
  './farm-art/a-croc.webp',
  './farm-art/a-crocbaby.webp',
  './farm-art/a-dino.webp',
  './farm-art/a-dinobaby.webp',
  './farm-art/a-duck.webp',
  './farm-art/a-duckling.webp',
  './farm-art/a-echidna.webp',
  './farm-art/a-egg.webp',
  './farm-art/a-goldhen.webp',
  './farm-art/a-hen.webp',
  './farm-art/a-koala.webp',
  './farm-art/a-kookaburra.webp',
  './farm-art/a-lamb.webp',
  './farm-art/a-lizard.webp',
  './farm-art/a-lizardbaby.webp',
  './farm-art/a-manta.webp',
  './farm-art/a-octopus.webp',
  './farm-art/a-pig.webp',
  './farm-art/a-piglet.webp',
  './farm-art/a-platypus.webp',
  './farm-art/a-puffer.webp',
  './farm-art/a-rainbowsheep.webp',
  './farm-art/a-roo.webp',
  './farm-art/a-roojoey.webp',
  './farm-art/a-sheep.webp',
  './farm-art/a-snake.webp',
  './farm-art/a-snakebaby.webp',
  './farm-art/a-squid.webp',
  './farm-art/a-turtle.webp',
  './farm-art/a-wombat.webp',
  './farm-art/barn.webp',
  './farm-art/burrow.webp',
  './farm-art/carrots.webp',
  './farm-art/coop.webp',
  './farm-art/dog.webp',
  './farm-art/fountain.webp',
  './farm-art/fox.webp',
  './farm-art/ground.jpg',
  './farm-art/gumtree.webp',
  './farm-art/hay.webp',
  './farm-art/hive.webp',
  './farm-art/house.webp',
  './farm-art/hut.webp',
  './farm-art/jetty.webp',
  './farm-art/kite.webp',
  './farm-art/leafytree.webp',
  './farm-art/manor.webp',
  './farm-art/mushroom.webp',
  './farm-art/nest.webp',
  './farm-art/paddock.webp',
  './farm-art/pond.webp',
  './farm-art/pony.webp',
  './farm-art/pumpkin.webp',
  './farm-art/rockpool.webp',
  './farm-art/scarecrow.webp',
  './farm-art/soil.webp',
  './farm-art/sprouts.webp',
  './farm-art/stall.webp',
  './farm-art/sunflowerclump.webp',
  './farm-art/sunflowers.webp',
  './farm-art/tree.webp',
  './farm-art/trough.webp',
  './farm-art/tulips.webp',
  './farm-art/well.webp',
  './farm-art/wheat.webp',
  './farm-art/wheelbarrow.webp',
  './farm-art/windmill.webp',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

async function warmArt() {
  const cache = await caches.open(CACHE);
  for (let i = 0; i < ART.length; i += 6) {
    await Promise.all(ART.slice(i, i + 6).map(async (u) => {
      try {
        if (await cache.match(u)) return;
        const res = await fetch(u, { cache: 'no-cache' });
        if (res.ok) await cache.put(u, res);
      } catch {}
    }));
  }
}

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => warmArt()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  let refresh;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      // no-cache: skip the browser's HTTP cache so updates arrive on the next launch.
      const network = fetch(req.url, { cache: 'no-cache' })
        .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => cached);
      refresh?.(network);
      return cached || network;
    }),
  );
  // Keep the worker alive until the background refresh has finished (Safari may stop it as soon as the page has its answer).
  e.waitUntil(new Promise((done) => { refresh = (p) => p.then(done, done); setTimeout(done, 20000); }));
});
