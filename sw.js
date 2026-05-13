const CACHE_NAME = 'gita-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/data.js',
    'https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then(res => res || fetch(e.request))
    );
});