/* Bhagavad Gita – Learn & Explore — service worker
   Strategy:
     • app shell      → precached on install
     • navigations    → network-first, cache fallback, offline shell as last resort
     • data.js        → stale-while-revalidate (large, changes rarely, must stay fresh)
     • fonts / icons  → cache-first (immutable)
     • commentary API → stale-while-revalidate in a separate runtime cache,
                        so scholarly notes you have opened once stay readable offline
*/
const VERSION       = 'v3';
const SHELL_CACHE   = `gita-shell-${VERSION}`;
const STATIC_CACHE  = `gita-static-${VERSION}`;
const RUNTIME_CACHE = `gita-runtime-${VERSION}`;
const ALL_CACHES    = [SHELL_CACHE, STATIC_CACHE, RUNTIME_CACHE];

const SHELL_ASSETS = [
    './',
    './index.html',
    './data.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon.svg'
];

const COMMENTARY_HOST = 'raw.githubusercontent.com';
const FONT_HOSTS      = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(SHELL_CACHE)
            // addAll is all-or-nothing; add individually so one 404 cannot
            // abort the whole install and leave the app uncached.
            .then(cache => Promise.all(
                SHELL_ASSETS.map(url => cache.add(url).catch(() => null))
            ))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys.filter(k => k.startsWith('gita') && !ALL_CACHES.includes(k))
                    .map(k => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

// Let the page trigger an immediate update instead of waiting for all tabs to close.
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function staleWhileRevalidate(request, cacheName) {
    const cache  = await caches.open(cacheName);
    const cached = await cache.match(request);
    const network = fetch(request)
        .then(res => {
            if (res && res.ok) cache.put(request, res.clone());
            return res;
        })
        .catch(() => null);
    return cached || (await network) || Response.error();
}

async function cacheFirst(request, cacheName) {
    const cache  = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
        const res = await fetch(request);
        if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
        return res;
    } catch (err) {
        return cached || Response.error();
    }
}

async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    try {
        const res = await fetch(request);
        if (res && res.ok) cache.put(request, res.clone());
        return res;
    } catch (err) {
        const cached = await cache.match(request) || await cache.match('./index.html') || await cache.match('./');
        if (cached) return cached;
        return new Response(
            '<!doctype html><meta charset="utf-8"><title>Offline</title>' +
            '<body style="font-family:system-ui;background:#07102E;color:#F8F6F0;display:grid;place-items:center;height:100vh;margin:0;text-align:center">' +
            '<div><div style="font-size:3rem">ॐ</div><h1 style="font-weight:600">You are offline</h1>' +
            '<p style="opacity:.75">Open the app once while connected and it will work offline afterwards.</p></div>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
        );
    }
}

self.addEventListener('fetch', event => {
    const { request } = event;
    if (request.method !== 'GET') return;

    let url;
    try { url = new URL(request.url); } catch (e) { return; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

    // Page navigations — always try the network so deploys land immediately.
    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request, SHELL_CACHE));
        return;
    }

    // Scholarly commentary fetched on demand — keep what has been read.
    if (url.hostname === COMMENTARY_HOST) {
        event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
        return;
    }

    // Web fonts are immutable and versioned by URL.
    if (FONT_HOSTS.includes(url.hostname)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE));
        return;
    }

    if (url.origin === self.location.origin) {
        // The verse corpus is big; serve it instantly but refresh in the background.
        if (url.pathname.endsWith('/data.js')) {
            event.respondWith(staleWhileRevalidate(request, SHELL_CACHE));
            return;
        }
        event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    }
});
