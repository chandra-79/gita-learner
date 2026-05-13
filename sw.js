const CACHE_NAME = 'gita-v2';
const ASSETS = [
    './',
    './index.html',
    './data.js',
    './manifest.json',
    './icons/icon-192.png',
    './icons/icon-512.png',
    'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Noto+Sans+Devanagari:wght@400;500&family=Noto+Sans+Telugu:wght@400;500&display=swap'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then(res => res || fetch(e.request))
    );
});