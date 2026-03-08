const CACHE_NAME = "train-track-runner-v20260308-2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=0.4",
  "./game.js?v=0.4",
  "./manifest.webmanifest",
  "./icon.svg",
];

function shouldUseNetworkFirst(request) {
  const url = new URL(request.url);
  return request.mode === "navigate"
    || url.pathname.endsWith(".css")
    || url.pathname.endsWith(".js")
    || url.pathname.endsWith(".html")
    || url.pathname.endsWith(".webmanifest");
}

async function networkFirst(request, fallbackKey) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    if (fallbackKey) {
      const fallback = await caches.match(fallbackKey);
      if (fallback) {
        return fallback;
      }
    }

    throw new Error("Network request failed and no cached response was found.");
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  const cache = await caches.open(CACHE_NAME);
  cache.put(request, response.clone());
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, "./index.html"));
    return;
  }

  event.respondWith(shouldUseNetworkFirst(request) ? networkFirst(request) : cacheFirst(request));
});