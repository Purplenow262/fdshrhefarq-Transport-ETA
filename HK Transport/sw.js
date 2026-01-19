// 這是 Service Worker，負責快取檔案讓 App 離線也能打開
const CACHE_NAME = 'hk-transit-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// 安裝時：把網頁存到手機肚子裡
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// 讀取時：優先從手機肚子裡拿資料 (這樣比較快)
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});