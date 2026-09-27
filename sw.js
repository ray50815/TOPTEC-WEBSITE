const BUILD_ID = '__TOPTEC_BUILD_ID__';
const CACHE_PREFIX = 'toptec-';
const PRECACHE_NAME = `${CACHE_PREFIX}precache-${BUILD_ID}`;
const RUNTIME_NAME = `${CACHE_PREFIX}runtime-${BUILD_ID}`;
const MAX_RUNTIME_ENTRIES = 50;
const OFFLINE_URL = '/offline';
const ZH_OFFLINE_URL = '/zh-hant/offline';
const PRECACHE_ASSETS = [
  '__TOPTEC_PRECACHE_ASSETS__'
];
const PUBLIC_PAGE_PATHS = new Set([
  '__TOPTEC_PUBLIC_ROUTES__'
]);

const CACHEABLE_DESTINATIONS = new Set([
  'style',
  'script',
  'image',
  'font',
  'manifest'
]);

const PRIVATE_PATH_PREFIXES = [
  '/.netlify/functions/',
  '/api/',
  '/admin/',
  '/internal/',
  '/graphify-out/',
  '/scripts/'
];

function isSameOriginPublicGet(request) {
  const requestCacheControl = request.headers.get('cache-control') || '';
  if (
    request.method !== 'GET'
    || request.headers.has('authorization')
    || request.headers.has('range')
    || /(?:^|,)\s*(?:no-store|private)\b/i.test(requestCacheControl)
  ) {
    return false;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return false;
  }

  return !PRIVATE_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

function isAllowlistedPublicPath(pathname) {
  return PUBLIC_PAGE_PATHS.has(pathname)
    || pathname.startsWith('/assets/')
    || pathname === '/site.webmanifest'
    || pathname === '/favicon.ico'
    || /^\/(?:apple-touch-icon|android-chrome-\d+x\d+|favicon-\d+x\d+)\.png$/.test(pathname);
}

function isCacheableResponse(response) {
  if (!response || !response.ok || response.status !== 200 || response.type !== 'basic') {
    return false;
  }

  const cacheControl = response.headers.get('cache-control') || '';
  return !/(?:^|,)\s*(?:no-store|private)\b/i.test(cacheControl);
}

async function trimRuntimeCache(cache) {
  const keys = await cache.keys();
  const overflow = keys.length - MAX_RUNTIME_ENTRIES;
  if (overflow <= 0) {
    return;
  }

  await Promise.all(keys.slice(0, overflow).map((key) => cache.delete(key)));
}

async function putRuntime(request, response) {
  const url = new URL(request.url);
  if (!isAllowlistedPublicPath(url.pathname) || !isCacheableResponse(response)) {
    return;
  }

  // Clone synchronously before the original response is returned to the page
  // and its body becomes locked or consumed.
  const cacheableResponse = response.clone();
  const cache = await caches.open(RUNTIME_NAME);
  await cache.put(request, cacheableResponse);
  await trimRuntimeCache(cache);
}

async function disableToptecPwa() {
  const names = await caches.keys();
  await Promise.all(names
    .filter((name) => name.startsWith(CACHE_PREFIX))
    .map((name) => caches.delete(name)));
  await self.registration.unregister();
}

async function networkFirstNavigation(event) {
  const { request } = event;

  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      event.waitUntil(putRuntime(request, response));
    }
    return response;
  } catch {
    const url = new URL(request.url);
    const offlineUrl = url.pathname.startsWith('/zh-hant/') ? ZH_OFFLINE_URL : OFFLINE_URL;
    return (await caches.match(request, { ignoreSearch: true })) || (await caches.match(offlineUrl));
  }
}

async function cacheFirstPublicAsset(event) {
  const { request } = event;
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (isCacheableResponse(response)) {
    event.waitUntil(putRuntime(request, response));
  }
  return response;
}

async function networkFirstPublicAsset(event) {
  const { request } = event;
  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      event.waitUntil(putRuntime(request, response));
    }
    return response;
  } catch {
    return (await caches.match(request, { ignoreSearch: true })) || Response.error();
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX))
          .filter((name) => name !== PRECACHE_NAME && name !== RUNTIME_NAME)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'TOPTEC_PWA_KILL_SWITCH') {
    event.waitUntil(disableToptecPwa());
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (!isSameOriginPublicGet(request)) {
    return;
  }

  const url = new URL(request.url);
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(event));
    return;
  }

  if (!isAllowlistedPublicPath(url.pathname)) {
    return;
  }

  const isFingerprintedAsset = /^\/assets\/(?:css|js)\/.+\.[a-f0-9]{12}\.(?:css|js)$/.test(url.pathname);
  if (isFingerprintedAsset) {
    event.respondWith(cacheFirstPublicAsset(event));
  } else if (CACHEABLE_DESTINATIONS.has(request.destination)) {
    event.respondWith(networkFirstPublicAsset(event));
  }
});
