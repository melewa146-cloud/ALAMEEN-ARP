/* AL AMEEN ERP — Service Worker
   يُمكّن التطبيق من العمل بدون إنترنت */

const CACHE_NAME = 'alameen-erp-v2';
const ASSETS = [
  './index.html',
  './style.css',
  './auth.css',
  './logo.js',
  './data.js',
  './auth.js',
  './coa.js',
  './reports.js',
  './transactions.js',
  './app.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// تنصيب: تخزين الملفات في الكاش
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS.map(url => new Request(url, { cache: 'reload' })));
    }).catch(err => {
      console.warn('SW install cache warning:', err);
    })
  );
  self.skipWaiting();
});

// تنشيط: حذف الكاشات القديمة
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// اعتراض الطلبات: خدمة من الكاش أولاً
self.addEventListener('fetch', e => {
  // تجاهل الطلبات غير HTTP
  if (!e.request.url.startsWith('http')) return;
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
