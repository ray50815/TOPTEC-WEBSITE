const CACHE_NAME = 'toptec-v7';
const RUNTIME_CACHE = 'toptec-runtime';

// 預快取關鍵資源
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/about.html',
  '/contact.html',
  '/electronics.html',
  '/trading.html',
  '/case-studies.html',
  '/assets/css/style.css',
  '/assets/js/main.js',
  '/assets/img/toptec-logo.svg',
  '/locales/zh-Hant.json'
];

// 安裝事件 - 快取關鍵資源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 啟動事件 - 清理舊快取
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// 攔截請求 - HTML 用 Network First,資源用 Cache First
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 跳過非 GET 請求
  if (request.method !== 'GET') return;

  // 跳過外部請求
  if (url.origin !== location.origin) return;

  // HTML 頁面: Network First
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE)
            .then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // CSS/JS/圖片: Cache First
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then((response) => {
            // 快取成功回應
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE)
                .then((cache) => cache.put(request, responseClone));
            }
            return response;
          });
      })
  );
});
