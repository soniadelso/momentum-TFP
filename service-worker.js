const cacheName = "momentum-pwa-v11";
const isLocalDevelopment = self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1";
const appShell = [
	"./",
	"./index.html",
	"./about.html",
	"./contact.html",
	"./event-detail.html",
	"./explorar.html",
	"./host-event.html",
	"./log-in.html",
	"./map.html",
	"./user-profile.html",
	"./manifest.webmanifest",
	"./events.json",
	"./css/reset.css",
	"./css/tokens.css",
	"./css/typography.css",
	"./css/styles.css",
	"./css/header.css",
	"./css/hero.css",
	"./css/sections-cards.css",
	"./css/footer.css",
	"./css/buttons.css",
	"./css/login.css",
	"./css/filters.css",
	"./css/responsive.css",
	"./css/profile.css",
	"./css/event-detail.css",
	"./css/map.css",
	"./javascript/general.js",
	"./javascript/header-menu.js",
	"./javascript/favorites.js",
	"./javascript/events.js",
	"./javascript/login-dialog.js",
	"./javascript/login-form.js",
	"./javascript/attending.js",
	"./javascript/filters.js",
	"./javascript/filter-scroll.js",
	"./javascript/map.js",
	"./javascript/event-detail.js",
	"./javascript/host-event-form.js",
	"./javascript/contact-form.js",
	"./typography/RecoletaAlt-Bold.woff",
	"./typography/RecoletaAlt-Medium.woff",
	"./typography/RecoletaAlt-Regular.woff",
	"./typography/RecoletaAlt-SemiBold.woff",
	"./assets/1avatar.jpg",
	"./assets/2avatar.jpg",
	"./assets/3avatar.jpg",
	"./assets/4avatar.jpg",
	"./assets/5avatar.jpg",
	"./assets/6avatar.jpg",
	"./assets/7avatar.jpg",
	"./assets/8avatar.jpg",
	"./assets/9avatar.jpg",
	"./assets/10avatar.jpg",
	"./assets/11avatar.jpg",
	"./assets/12avatar.jpg",
	"./assets/13avatar.jpg",
	"./assets/14avatar.jpg",
	"./assets/PinMarker.svg",
	"./assets/ai-workshops.jpg",
	"./assets/conferences-around-the-world.jpg",
	"./assets/diseño-uiux.jpg",
	"./assets/favicon-momentum.svg",
	"./assets/apple-touch-icon.png",
	"./assets/pwa-icon-192.png",
	"./assets/pwa-icon-512.png",
	"./assets/eye-icon.svg",
	"./assets/filters-icon.svg",
	"./assets/footer-divider.svg",
	"./assets/get-nerd-product-design.jpg",
	"./assets/hero-workshop.jpg",
	"./assets/icon-back.svg",
	"./assets/icon-brand-graphic-2.svg",
	"./assets/icon-card-3.svg",
	"./assets/icon-card-4.svg",
	"./assets/icon-digital-product.svg",
	"./assets/icon-eye-closed.svg",
	"./assets/icon-home-mobile.svg",
	"./assets/icon-industrial-design.svg",
	"./assets/icon-logout.svg",
	"./assets/icon-map.svg",
	"./assets/icon-media-motion.svg",
	"./assets/icon-play.svg",
	"./assets/icon-search.svg",
	"./assets/icon-social.svg",
	"./assets/icon-user.svg",
	"./assets/event-typography.jpg",
	"./assets/event-art-direction.jpg",
	"./assets/event-networking.jpg",
	"./assets/event-accessibility.jpg",
	"./assets/event-after-effects.jpg",
	"./assets/event-interviews.jpg",
	"./assets/ilustracion-digital.jpg",
	"./assets/profile-avatar-2.jpg",
	"./assets/profile-avatar.png",
	"./assets/uxui-talks.jpg"
];

// Prepara las páginas principales y espera a que se active la caché nueva.
self.addEventListener("install", (event) => {
	if (isLocalDevelopment) {
		event.waitUntil(self.skipWaiting());
		return;
	}

	event.waitUntil(
		caches.open(cacheName)
			.then((cache) => cache.addAll(appShell))
			.then(() => self.skipWaiting())
	);
});

// Elimina versiones anteriores de la caché y controla las páginas abiertas.
self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches.keys()
			.then((cacheNames) => Promise.all(
				cacheNames
					.filter((name) => name.startsWith("momentum-pwa-") && name !== cacheName)
					.map((name) => caches.delete(name))
			))
			.then(() => self.clients.claim())
	);
});

// Usa red primero para páginas y caché primero para recursos del mismo origen.
self.addEventListener("fetch", (event) => {
	if (isLocalDevelopment) {
		return;
	}

	const { request } = event;
	if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
		return;
	}

	if (request.mode === "navigate") {
		event.respondWith(
			fetch(request)
				.then((response) => {
					if (response.ok) {
						const copy = response.clone();
						caches.open(cacheName).then((cache) => cache.put(request, copy));
					}
					return response;
				})
				.catch(async () => (await caches.match(request, { ignoreSearch: true })) || caches.match("./index.html"))
		);
		return;
	}

	event.respondWith(
		caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
			if (cachedResponse) {
				return cachedResponse;
			}

			return fetch(request).then((response) => {
				if (response.ok) {
					const copy = response.clone();
					caches.open(cacheName).then((cache) => cache.put(request, copy));
				}
				return response;
			});
		})
	);
});
