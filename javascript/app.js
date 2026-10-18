const authStorageKey = "momentum-authenticated";
const headerMount = document.querySelector("[data-app-header]");
const currentPage = window.location.pathname.split("/").pop() || "index.html";
const isAuthenticated = localStorage.getItem(authStorageKey) === "true";
const homeHref = "index.html";

// Alterna el contenido de inicio según el estado de sesión.
const guestHome = document.querySelector("[data-home-guest]");
const authenticatedHome = document.querySelector("[data-home-authenticated]");
if (guestHome && authenticatedHome) {
	guestHome.hidden = isAuthenticated;
	authenticatedHome.hidden = !isAuthenticated;
	document.querySelectorAll("[data-home-guest-only]").forEach((section) => {
		section.hidden = isAuthenticated;
	});
}

if (headerMount) {
	const homeCurrent = currentPage === "index.html" ? ' aria-current="page"' : "";
	const exploreCurrent = currentPage === "explorar.html" ? ' aria-current="page"' : "";
	const mapCurrent = currentPage === "map.html" ? ' aria-current="page"' : "";
	const profileCurrent = currentPage === "user-profile.html" ? ' aria-current="page"' : "";
	// Marca la página del formulario en la navegación compartida.
	const hostCurrent = currentPage === "host-event.html" ? ' aria-current="page"' : "";
	const loginCurrent = currentPage === "log-in.html" ? ' aria-current="page"' : "";
	const authenticatedLink = isAuthenticated
		? `<a class="header__link header__link--profile" href="user-profile.html"${profileCurrent}>My profile</a>`
		: "";
	const accountAction = isAuthenticated
		? `<a class="header__profile" href="user-profile.html" aria-label="Your profile"><img src="assets/profile-avatar-2.jpg" alt=""></a>`
		: `<a class="button button--primary" href="log-in.html">Log In</a>`;
	const mobileProfileAction = isAuthenticated
		? `<a class="mobile-bottom-nav__link" href="user-profile.html"${profileCurrent}><span class="mobile-bottom-nav__avatar" aria-hidden="true"><img src="assets/profile-avatar-2.jpg" alt=""></span><span>Perfil</span></a>`
		: `<a class="mobile-bottom-nav__link" href="log-in.html"${loginCurrent}><span class="mobile-bottom-nav__user" aria-hidden="true"><img src="assets/icon-user.svg" alt=""></span><span>Log In</span></a>`;
	const searchAction = currentPage === "map.html" ? "map.html" : "explorar.html";

	headerMount.innerHTML = `
		<header class="header">
			<a class="header__brand" href="${homeHref}" aria-label="momentum home">momentum</a>
			<a class="button button--primary header__host-mobile" href="host-event.html"${hostCurrent}>Modo Anfitrión</a>
			<div class="header__menu">
				<button class="header__menu-toggle" type="button" aria-controls="header-nav" aria-expanded="false" aria-label="Open navigation menu">
					<span class="header__menu-icon" aria-hidden="true"></span>
				</button>
				<nav class="header__nav" id="header-nav" aria-label="Main navigation">
					<a class="header__link header__link--host" href="host-event.html"${hostCurrent}>Modo Anfitrión</a>
					<a class="header__link" href="explorar.html"${exploreCurrent}>Explore</a>
					<a class="header__map" href="map.html" aria-label="Map"${mapCurrent}>
						<span>Map</span>
						<img src="assets/icon-map.svg" alt="">
					</a>
					${authenticatedLink}
				</nav>
			</div>
			<div class="header__search explore-filters__facet-dropdown">
				<form class="search-form" action="${searchAction}" method="get" role="search">
					<label class="visually-hidden" for="event-search">Search events</label>
					<input class="search-form__input" id="event-search" name="q" type="search" placeholder="Search events / city..." aria-controls="event-search-suggestions" aria-expanded="false" aria-autocomplete="list" aria-haspopup="listbox">
					<button class="explore-filters__clear" type="button" data-search-clear aria-label="Limpiar búsqueda" hidden>×</button>
					<button class="search-form__button" type="submit" aria-label="Search events">
					<svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
						<g id="Search Button">
							<rect width="38" height="38" rx="19" fill="#EDFF57"/>
							<path id="Union" d="M10.51 18.0626C10.7038 21.8826 13.8625 24.9201 17.7307 24.9201L18.1028 24.9113C19.58 24.8363 20.9392 24.3168 22.052 23.4855L25.8176 27.2511C26.2026 27.6357 26.8263 27.6357 27.2112 27.2511C27.5961 26.8661 27.5962 26.2416 27.2112 25.8566L23.4563 22.1017C24.3981 20.8808 24.9601 19.3518 24.9602 17.6906L24.9514 17.3185C24.7642 13.6215 21.7997 10.6575 18.1028 10.4699L17.7307 10.4601C13.7376 10.4601 10.5002 13.6975 10.5002 17.6906L10.51 18.0626ZM12.4719 17.6906C12.4719 14.7865 14.8266 12.4318 17.7307 12.4318C20.6346 12.432 22.9885 14.7866 22.9885 17.6906C22.9883 20.5944 20.6345 22.9482 17.7307 22.9484C14.8268 22.9484 12.4721 20.5945 12.4719 17.6906Z" fill="#272727"/>
						</g>
					</svg>
					</button>
				</form>
				<div class="explore-filters__facet-menu" id="event-search-suggestions" role="listbox" aria-label="Sugerencias de eventos" hidden></div>
			</div>
			${accountAction}
		</header>
		<nav class="mobile-bottom-nav" aria-label="Navegación principal">
			<a class="mobile-bottom-nav__link" href="${homeHref}"${homeCurrent}><span class="mobile-bottom-nav__icon mobile-bottom-nav__icon--home"><img src="assets/icon-home-mobile.svg" alt=""></span><span>Home</span></a>
			<a class="mobile-bottom-nav__link" href="explorar.html"${exploreCurrent}><span class="mobile-bottom-nav__icon mobile-bottom-nav__icon--search"><img src="assets/icon-search.svg" alt=""></span><span>Explorar</span></a>
			<a class="mobile-bottom-nav__link" href="map.html"${mapCurrent}><span class="mobile-bottom-nav__icon"><img src="assets/icon-map.svg" alt=""></span><span>Mapa</span></a>
			${mobileProfileAction}
		</nav>`;

}

document.addEventListener("momentum-login-success", () => {
	if (currentPage !== "index.html") {
		return;
	}

	const scrollPosition = window.scrollY;
	const pendingFavoriteId = sessionStorage.getItem("momentum-pending-favorite");
	const pendingFavoriteTop = sessionStorage.getItem("momentum-pending-favorite-top");
	const pendingFavoriteButton = [...document.querySelectorAll(".event-card__favorite[data-event-id]")]
		.find((button) => button.dataset.eventId === pendingFavoriteId);
	document.documentElement.style.overflowAnchor = "none";
	if (guestHome && authenticatedHome) {
		guestHome.hidden = true;
		authenticatedHome.hidden = false;
		document.querySelectorAll("[data-home-guest-only]").forEach((section) => {
			section.hidden = true;
		});
	}

	const desktopLogin = headerMount?.querySelector(".header > a.button--primary:not(.header__host-mobile)");
	if (desktopLogin) {
		desktopLogin.outerHTML = '<a class="header__profile" href="user-profile.html" aria-label="Your profile"><img src="assets/profile-avatar-2.jpg" alt=""></a>';
	}

	const mainNavigation = headerMount?.querySelector(".header__nav");
	if (mainNavigation && !mainNavigation.querySelector(".header__link--profile")) {
		mainNavigation.insertAdjacentHTML("beforeend", '<a class="header__link header__link--profile" href="user-profile.html">My profile</a>');
	}

	const mobileLogin = headerMount?.querySelector('.mobile-bottom-nav > a[href="log-in.html"]');
	if (mobileLogin) {
		mobileLogin.outerHTML = '<a class="mobile-bottom-nav__link" href="user-profile.html"><span class="mobile-bottom-nav__avatar" aria-hidden="true"><img src="assets/profile-avatar-2.jpg" alt=""></span><span>Perfil</span></a>';
	}
	document.dispatchEvent(new Event("attending-changed"));
	requestAnimationFrame(() => {
		document.documentElement.style.scrollBehavior = "auto";
		if (pendingFavoriteButton && pendingFavoriteTop !== null) {
			const offset = pendingFavoriteButton.getBoundingClientRect().top - Number(pendingFavoriteTop);
			window.scrollTo(0, scrollPosition + offset);
		} else {
			window.scrollTo(0, scrollPosition);
		}
		requestAnimationFrame(() => {
			document.documentElement.style.removeProperty("overflow-anchor");
			document.documentElement.style.removeProperty("scroll-behavior");
		});
	});
});

const searchInput = document.querySelector(".search-form__input");
const initialSearchQuery = new URLSearchParams(window.location.search).get("q") || "";

if (searchInput) {
	searchInput.value = initialSearchQuery;
}

document.querySelectorAll(".footer__brand").forEach((brandLink) => {
	brandLink.href = homeHref;
});

document.querySelectorAll("[data-logout]").forEach((logoutLink) => {
	logoutLink.hidden = !isAuthenticated;
	logoutLink.style.display = isAuthenticated ? "" : "none";
	logoutLink.addEventListener("click", (event) => {
		event.preventDefault();
		localStorage.removeItem(authStorageKey);
		window.location.assign("index.html");
	});
});