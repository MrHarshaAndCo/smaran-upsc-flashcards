/* Smaran service worker: cache built assets, network-first navigation. */
const CACHE = 'smaran-v1';

self.addEventListener('install', () => {
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
			.then(() => self.clients.claim())
	);
});

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);
	if (event.request.method !== 'GET' || url.origin !== location.origin) return;

	// Built assets: cache-first.
	if (url.pathname.startsWith('/_app/')) {
		event.respondWith(
			caches.open(CACHE).then(async (cache) => {
				const hit = await cache.match(event.request);
				if (hit) return hit;
				const res = await fetch(event.request);
				if (res.ok) cache.put(event.request, res.clone());
				return res;
			})
		);
		return;
	}

	// Navigation and everything else: network-first, offline → cached shell.
	event.respondWith(
		fetch(event.request).catch(() =>
			caches.match(event.request).then((hit) => hit ?? caches.match('/'))
		)
	);
});
