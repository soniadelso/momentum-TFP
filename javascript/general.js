// Centraliza el estado de sesión y los elementos comunes de la página actual.
const authStorageKey = "momentum-authenticated";
const currentPage = window.location.pathname.split("/").pop() || "index.html";
const isAuthenticated = localStorage.getItem(authStorageKey) === "true";
const homeHref = "index.html";

// Registra la caché offline en localhost o cuando la página usa HTTPS.
if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker.register("service-worker.js")
			.catch((error) => console.error("No se pudo registrar la PWA.", error));
	});
}

const guestHome = document.querySelector("[data-home-guest]");
const authenticatedHome = document.querySelector("[data-home-authenticated]");
// Alterna la portada para mostrar solo el contenido correspondiente a la sesión.
if (guestHome && authenticatedHome) {
	guestHome.hidden = isAuthenticated;
	authenticatedHome.hidden = !isAuthenticated;
	document.querySelectorAll("[data-home-guest-only]").forEach((section) => {
		section.hidden = isAuthenticated;
	});
}

const guestProfile = document.querySelector("[data-profile-guest]");
// Protege las secciones del perfil y muestra el login a visitantes.
if (guestProfile) {
	guestProfile.hidden = isAuthenticated;
	document.querySelectorAll("[data-profile-private]").forEach((section) => {
		section.hidden = !isAuthenticated;
	});
}

// Actualiza la portada tras iniciar sesión y conserva la posición al volver de favoritos.
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