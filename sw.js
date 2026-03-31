// sw.js - Service Worker for MrPOS ERP (PWA Support)
const CACHE_NAME = 'mrpos-v1';
const ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/db.js',
    './js/app.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
