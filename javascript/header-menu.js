// Genera la cabecera compartida con navegación y búsqueda según la página y la sesión.
const headerRoot = document.querySelector("[data-app-header]");
const headerPage = window.location.pathname.split("/").pop() || "index.html";
const headerAuthenticated = localStorage.getItem("momentum-authenticated") === "true";
const headerHomeHref = "index.html";

if (headerRoot) {
    const homeCurrent = headerPage === "index.html" ? ' aria-current="page"' : "";
    const exploreCurrent = headerPage === "explorar.html" ? ' aria-current="page"' : "";
    const mapCurrent = headerPage === "map.html" ? ' aria-current="page"' : "";
    const profileCurrent = headerPage === "user-profile.html" ? ' aria-current="page"' : "";
    const hostCurrent = headerPage === "host-event.html" ? ' aria-current="page"' : "";
    const loginCurrent = headerPage === "log-in.html" ? ' aria-current="page"' : "";
    const authenticatedLink = headerAuthenticated
        ? `<a class="header__link header__link--profile" href="user-profile.html"${profileCurrent}>My profile</a>`
        : "";
    const accountAction = headerAuthenticated
        ? `<a class="header__profile" href="user-profile.html" aria-label="Your profile"><img src="assets/profile-avatar-2.jpg" alt=""></a>`
        : `<a class="button button--primary" href="log-in.html">Log In</a>`;
    const mobileProfileAction = headerAuthenticated
        ? `<a class="mobile-bottom-nav__link" href="user-profile.html"${profileCurrent}><span class="mobile-bottom-nav__avatar" aria-hidden="true"><img src="assets/profile-avatar-2.jpg" alt=""></span><span>Perfil</span></a>`
        : `<a class="mobile-bottom-nav__link" href="log-in.html"${loginCurrent}><span class="mobile-bottom-nav__user" aria-hidden="true"><img src="assets/icon-user.svg" alt=""></span><span>Log In</span></a>`;
    const searchAction = headerPage === "map.html" ? "map.html" : "explorar.html";

    headerRoot.innerHTML = `
        <header class="header">
            <a class="header__brand" href="${headerHomeHref}" aria-label="momentum home">momentum</a>
            <a class="button button--primary header__host-mobile" href="host-event.html"${hostCurrent}>Modo Anfitrión</a>
            <div class="header__menu">
                <button class="header__menu-toggle" type="button" aria-controls="header-nav" aria-expanded="false" aria-label="Open navigation menu">
                    <span class="header__menu-icon" aria-hidden="true"></span>
                </button>
                <nav class="header__nav" id="header-nav" aria-label="Main navigation">
                    <a class="header__link header__link--host" href="host-event.html"${hostCurrent}>Modo Anfitrión</a>
                    <a class="header__link" href="explorar.html"${exploreCurrent}>Explorar</a>
                    <a class="header__map" href="map.html" aria-label="Mapa"${mapCurrent}><span>Mapa</span><img src="assets/icon-map.svg" alt=""></a>
                    ${authenticatedLink}
                </nav>
            </div>
            <div class="header__search explore-filters__facet-dropdown">
                <form class="search-form" action="${searchAction}" method="get" role="search">
                    <label class="visually-hidden" for="event-search">Search events</label>
                    <input class="search-form__input" id="event-search" name="q" type="search" placeholder="Search events / city..." aria-controls="event-search-suggestions" aria-expanded="false" aria-autocomplete="list" aria-haspopup="listbox">
                    <button class="explore-filters__clear" type="button" data-search-clear aria-label="Limpiar búsqueda" hidden>×</button>
                    <button class="search-form__button" type="submit" aria-label="Search events"><svg preserveAspectRatio="none" overflow="visible" style="display: block;" width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><g id="Search Button"><rect width="38" height="38" rx="19" fill="#EDFF57"/><path id="Union" d="M10.51 18.0626C10.7038 21.8826 13.8625 24.9201 17.7307 24.9201L18.1028 24.9113C19.58 24.8363 20.9392 24.3168 22.052 23.4855L25.8176 27.2511C26.2026 27.6357 26.8263 27.6357 27.2112 27.2511C27.5961 26.8663 27.5962 26.2416 27.2112 25.8566L23.4563 22.1017C24.3981 20.8808 24.9601 19.3518 24.9602 17.6906L24.9514 17.3185C24.7642 13.6215 21.7997 10.6575 18.1028 10.4699L17.7307 10.4601C13.7376 10.4601 10.5002 13.6975 10.5002 17.6906L10.51 18.0626ZM12.4719 17.6906C12.4719 14.7865 14.8266 12.4318 17.7307 12.4318C20.6346 12.432 22.9885 14.7866 22.9885 17.6906C22.9883 20.5944 20.6345 22.9482 17.7307 22.9484C14.8268 22.9484 12.4721 20.5945 12.4719 17.6906Z" fill="#272727"/></g></svg></button>
                </form>
                <div class="explore-filters__facet-menu" id="event-search-suggestions" role="listbox" aria-label="Sugerencias de eventos" hidden></div>
            </div>
            ${accountAction}
        </header>
        <nav class="mobile-bottom-nav" aria-label="Navegación principal">
            <a class="mobile-bottom-nav__link" href="${headerHomeHref}"${homeCurrent}><span class="mobile-bottom-nav__icon mobile-bottom-nav__icon--home"><img src="assets/icon-home-mobile.svg" alt=""></span><span>Home</span></a>
            <a class="mobile-bottom-nav__link" href="explorar.html"${exploreCurrent}><span class="mobile-bottom-nav__icon mobile-bottom-nav__icon--search"><img src="assets/icon-search.svg" alt=""></span><span>Explorar</span></a>
            <a class="mobile-bottom-nav__link" href="map.html"${mapCurrent}><span class="mobile-bottom-nav__icon"><img src="assets/icon-map.svg" alt=""></span><span>Mapa</span></a>
            ${mobileProfileAction}
        </nav>`;

    // Activa la transición visual de la cabecera al desplazarse.
    const updateHeaderScrollState = () => headerRoot.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", updateHeaderScrollState, { passive: true });
    updateHeaderScrollState();

    // Restaura la consulta inicial del buscador desde la URL.
    const headerSearchInput = headerRoot.querySelector(".search-form__input");
    if (headerSearchInput) {
        headerSearchInput.value = new URLSearchParams(window.location.search).get("q") || "";
    }
}

// Actualiza los accesos de la cabecera después de iniciar sesión sin recargarla.
document.addEventListener("momentum-login-success", () => {
    const desktopLogin = headerRoot?.querySelector(".header > a.button--primary:not(.header__host-mobile)");
    if (desktopLogin) {
        desktopLogin.outerHTML = '<a class="header__profile" href="user-profile.html" aria-label="Your profile"><img src="assets/profile-avatar-2.jpg" alt=""></a>';
    }

    const mainNavigation = headerRoot?.querySelector(".header__nav");
    if (mainNavigation && !mainNavigation.querySelector(".header__link--profile")) {
        mainNavigation.insertAdjacentHTML("beforeend", '<a class="header__link header__link--profile" href="user-profile.html">My profile</a>');
    }

    const mobileLogin = headerRoot?.querySelector('.mobile-bottom-nav > a[href="log-in.html"]');
    if (mobileLogin) {
        mobileLogin.outerHTML = '<a class="mobile-bottom-nav__link" href="user-profile.html"><span class="mobile-bottom-nav__avatar" aria-hidden="true"><img src="assets/profile-avatar-2.jpg" alt=""></span><span>Perfil</span></a>';
    }
});

// Configura el menú móvil de cada cabecera y conserva su estado de desplazamiento.
document.querySelectorAll(".header__menu").forEach((menu) => {
    const toggle = menu.querySelector(".header__menu-toggle");
    const nav = menu.querySelector(".header__nav");
    const originalBodyOverflow = document.body.style.overflow;

    // Sincroniza el estado accesible del botón con el bloqueo del fondo.
    const setExpanded = (expanded) => {
        toggle.setAttribute("aria-expanded", String(expanded));
        toggle.setAttribute("aria-label", expanded ? "Close navigation menu" : "Open navigation menu");
        document.body.style.overflow = expanded ? "hidden" : originalBodyOverflow;
    };

    // Abre/cierra el menú y lo cierra con selección, clic exterior o Escape.
    toggle.addEventListener("click", () => {
        setExpanded(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", (event) => {
        if (event.target === nav || event.target.closest("a")) {
            setExpanded(false);
        }
    });

    document.addEventListener("click", (event) => {
        if (!menu.contains(event.target)) {
            setExpanded(false);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
            setExpanded(false);
            toggle.focus();
        }
    });

    // Cierra el menú al cambiar a escritorio para evitar que quede bloqueado.
    window.addEventListener("resize", () => {
        if (window.matchMedia("(min-width: 701px)").matches) {
            setExpanded(false);
        }
    });
});