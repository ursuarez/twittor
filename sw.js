// Imports
importScripts('js/sw-utils.js');

const STATIC_CACHE = 'static-v3';
const DYNAMIC_CACHE = 'dynamic-v1';
const INMUTABLE_CACHE = 'inmutable-v1';

const APP_SHELL = [
	'/',
	'/index.html',
	'/css/style.css',
	'/img/favicon.ico',
	'/img/avatars/spiderman.jpg',
	'/img/avatars/ironman.jpg',
	'/img/avatars/wolverine.jpg',
	'/img/avatars/thor.jpg',
	'/img/avatars/hulk.jpg',
	'/js/app.js',
];

const APP_SHELL_INMUTABLE = [
	'https://fonts.googleapis.com/css?family=Quicksand:300,400',
	'https://fonts.googleapis.com/css?family=Lato:400,300',
	'https://use.fontawesome.com/releases/v5.3.1/css/all.css',
	'/css/animate.css',
	'/js/libs/jquery.js',
];

self.addEventListener('install', (e) => {
	const cacheStatic = caches.open(STATIC_CACHE).then(async (cache) => {
		console.log('Intentando cachear estático', APP_SHELL);
		for (const url of APP_SHELL) {
			try {
				await cache.add(url);
				console.log('✅ Cacheado', url);
			} catch (err) {
				console.error('❌ Error cacheando', url, err);
			}
		}
	});

	const cacheInmutable = caches.open(INMUTABLE_CACHE).then(async (cache) => {
		for (const url of APP_SHELL_INMUTABLE) {
			try {
				// 👇 Solución CORS: usar fetch con no-cors y cache.put manual
				const res = await fetch(url, { mode: 'no-cors' });
				await cache.put(url, res);
				console.log('✅ Cacheado (no-cors)', url);
			} catch (err) {
				console.error('❌ Error cacheando', url, err);
			}
		}
	});

	e.waitUntil(Promise.all([cacheStatic, cacheInmutable]));
});

self.addEventListener('activate', (e) => {
	const respuesta = caches.keys().then((keys) => {
		return Promise.all(
			keys.map((key) => {
				if (key !== STATIC_CACHE && key.includes('static')) {
					return caches.delete(key);
				}
			})
		);
	});
	e.waitUntil(respuesta);
});

self.addEventListener('fetch', (e) => {
	// 👇 Filtrar esquemas no soportados
	if (
		!e.request.url.startsWith('http') // evita chrome-extension, data:, etc
	) {
		return;
	}

	const respuesta = caches.match(e.request).then((res) => {
		if (res) {
			return res;
		} else {
			return fetch(e.request)
				.then((newRes) => {
					return actualizaCacheDinamico(DYNAMIC_CACHE, e.request, newRes);
				})
				.catch(() => {
					// puedes devolver un fallback aquí si quieres
				});
		}
	});

	e.respondWith(respuesta);
});
