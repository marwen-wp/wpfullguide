/**
 * sw.js — Production Speed Engine (Version 4.0)
 * ─────────────────────────────────────────────────────────────────────────
 * 1. PERSISTENT CACHING: Instant loads for repeat visitors (0ms).
 * 2. STALE-WHILE-REVALIDATE: Serve from cache, update in background.
 * 3. VIRTUAL ROUTING: Handles /fr/ and /ar/ paths locally.
 * ─────────────────────────────────────────────────────────────────────────
 */

const CACHE_NAME = 'portfolio-prod-v1';
const ASSETS_TO_CACHE = [
  '../css/style.css',
  './i18n.js',
  './sanity.js',
  './main.js',
  './animations.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 🚀 PATH A: Virtual Language Subpath Handling
  const LANGUAGES = ['fr', 'ar'];
  const scopePath = new URL(self.registration.scope).pathname;
  const relativePath = url.pathname.startsWith(scopePath) ? url.pathname.slice(scopePath.length) : url.pathname;
  const parts = relativePath.split('/').filter(Boolean);
  const langIdx = parts.findIndex(p => LANGUAGES.includes(p));

  if (langIdx !== -1) {
    const realParts = [...parts];
    realParts.splice(langIdx, 1);
    const realFile = (scopePath + '/' + (realParts.join('/') || 'index.html')).replace(/\/+/g, '/');

    event.respondWith(
      fetch(realFile).then(res => {
        if (res.ok) return res;
        return fetch(scopePath + 'index.html');
      }).catch(() => caches.match(scopePath + 'index.html'))
    );
    return;
  }

  // 🚀 PATH B: Stale-While-Revalidate for Assets and Sanity API
  const isAsset = url.pathname.match(/\.(js|css|woff2|png|jpg|svg)$/);
  const isSanity = url.hostname.includes('sanity.io');

  if (isAsset || isSanity) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const fetchPromise = fetch(request).then((networkResponse) => {
            if (networkResponse.ok) cache.put(request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // 🚀 PATH C: Default Network Fallback
  event.respondWith(fetch(request));
});
