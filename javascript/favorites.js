// Mantiene las claves que comparten el flujo de favoritos y el acceso.
const favoritesStorageKey = "momentum-favorites";
const pendingFavoriteStorageKey = "momentum-pending-favorite";
const pendingFavoriteTopStorageKey = "momentum-pending-favorite-top";
const pendingFavoriteLeftStorageKey = "momentum-pending-favorite-left";
const pendingFavoriteNoticeStorageKey = "momentum-pending-favorite-notice";
const pendingFavoriteScrollStorageKey = "momentum-pending-favorite-scroll";
const shouldRestoreFavoriteScroll = sessionStorage.getItem(pendingFavoriteScrollStorageKey) !== null;
if (shouldRestoreFavoriteScroll) {
	history.scrollRestoration = "manual";
}
const getFavoriteIds = () => JSON.parse(localStorage.getItem(favoritesStorageKey) || "[]");
let favoriteNotice;
let favoriteNoticeTimeout;

// Muestra brevemente el total de favoritos y enlaza el aviso al perfil.
const showFavoriteAddedNotice = (count, anchorPosition) => {
	if (!favoriteNotice) {
		favoriteNotice = document.createElement("a");
		favoriteNotice.className = "favorite-added-notice";
		favoriteNotice.href = "user-profile.html";
		favoriteNotice.setAttribute("aria-live", "polite");
		favoriteNotice.setAttribute("aria-atomic", "true");
		favoriteNotice.innerHTML = '<span>Añadido a mi <span class="favorite-added-notice__link-label">perfil</span></span><span class="favorite-added-notice__count" aria-hidden="true"></span>';
		document.body.append(favoriteNotice);
	}

	favoriteNotice.querySelector(".favorite-added-notice__count").textContent = String(count);
	favoriteNotice.hidden = false;
	if (anchorPosition) {
		const noticeBounds = favoriteNotice.getBoundingClientRect();
		const edgeGap = 8;
		let top = anchorPosition.top - noticeBounds.height - edgeGap;
		if (top < edgeGap) {
			top = anchorPosition.top + 40;
		}
		top = Math.min(top, window.innerHeight - noticeBounds.height - edgeGap);
		const minCenter = noticeBounds.width / 2 + edgeGap;
		const maxCenter = window.innerWidth - noticeBounds.width / 2 - edgeGap;
		const center = Math.max(minCenter, Math.min(anchorPosition.left, maxCenter));
		favoriteNotice.style.top = `${Math.max(edgeGap, top)}px`;
		favoriteNotice.style.left = `${center}px`;
	} else {
		favoriteNotice.style.removeProperty("top");
		favoriteNotice.style.removeProperty("left");
	}
	favoriteNotice.classList.remove("is-visible");
	requestAnimationFrame(() => favoriteNotice.classList.add("is-visible"));
	clearTimeout(favoriteNoticeTimeout);
	favoriteNoticeTimeout = setTimeout(() => {
		favoriteNotice.classList.remove("is-visible");
		favoriteNotice.hidden = true;
	}, 1800);
};

// Sincroniza todos los botones del mismo evento con los favoritos guardados.
const syncFavoriteButtons = () => {
	const favoriteIds = localStorage.getItem("momentum-authenticated") === "true" ? getFavoriteIds() : [];
	document.querySelectorAll(".event-card__favorite[data-event-id]").forEach((button) => {
		button.setAttribute("aria-pressed", String(favoriteIds.includes(button.dataset.eventId)));
	});
};

// Restaura estados, avisos pendientes y posición después de cargar la página.
document.addEventListener("DOMContentLoaded", () => {
	syncFavoriteButtons();
	window.eventsDataReady?.then(syncFavoriteButtons);
	const pendingCount = Number(sessionStorage.getItem(pendingFavoriteNoticeStorageKey));
	if (pendingCount) {
		sessionStorage.removeItem(pendingFavoriteNoticeStorageKey);
		const pendingTop = sessionStorage.getItem(pendingFavoriteTopStorageKey);
		const pendingLeft = sessionStorage.getItem(pendingFavoriteLeftStorageKey);
		const anchorPosition = pendingTop !== null && pendingLeft !== null
			? { top: Number(pendingTop), left: Number(pendingLeft) }
			: null;
		showFavoriteAddedNotice(pendingCount, anchorPosition);
		sessionStorage.removeItem(pendingFavoriteTopStorageKey);
		sessionStorage.removeItem(pendingFavoriteLeftStorageKey);
	}
	const pendingScrollY = sessionStorage.getItem(pendingFavoriteScrollStorageKey);
	if (pendingScrollY !== null) {
		sessionStorage.removeItem(pendingFavoriteScrollStorageKey);
		window.eventsDataReady?.then(() => {
			requestAnimationFrame(() => {
				window.scrollTo(0, Number(pendingScrollY));
				history.scrollRestoration = "auto";
			});
		});
	}
});

// Completa el favorito pendiente cuando el login modal emite éxito.
document.addEventListener("momentum-login-success", () => {
	const pendingFavoriteId = sessionStorage.getItem(pendingFavoriteStorageKey);
	if (!pendingFavoriteId) {
		return;
	}

	const favoriteIds = getFavoriteIds();
	const updatedFavoriteIds = favoriteIds.includes(pendingFavoriteId)
		? favoriteIds
		: [...favoriteIds, pendingFavoriteId];
	localStorage.setItem(favoritesStorageKey, JSON.stringify(updatedFavoriteIds));
	const currentPage = window.location.pathname.split("/").pop() || "index.html";
	const pendingFavoriteButton = [...document.querySelectorAll(".event-card__favorite[data-event-id]")]
		.find((button) => button.dataset.eventId === pendingFavoriteId);
	const pendingBounds = pendingFavoriteButton?.getBoundingClientRect();
	const pendingTop = sessionStorage.getItem(pendingFavoriteTopStorageKey);
	const pendingLeft = sessionStorage.getItem(pendingFavoriteLeftStorageKey);
	const anchorPosition = pendingTop !== null && pendingLeft !== null
			? { top: Number(pendingTop), left: Number(pendingLeft) }
		: pendingBounds
			? { top: pendingBounds.top, left: pendingBounds.left + pendingBounds.width / 2 }
			: null;
	if (currentPage === "index.html") {
		sessionStorage.removeItem(pendingFavoriteNoticeStorageKey);
		sessionStorage.removeItem(pendingFavoriteScrollStorageKey);
		showFavoriteAddedNotice(updatedFavoriteIds.length, anchorPosition);
		sessionStorage.removeItem(pendingFavoriteTopStorageKey);
		sessionStorage.removeItem(pendingFavoriteLeftStorageKey);
	} else {
		sessionStorage.setItem(pendingFavoriteNoticeStorageKey, String(updatedFavoriteIds.length));
		sessionStorage.setItem(pendingFavoriteScrollStorageKey, String(window.scrollY));
	}
	if (updatedFavoriteIds.length) {
		sessionStorage.removeItem(pendingFavoriteStorageKey);
	}
	syncFavoriteButtons();
});

// Guarda o elimina favoritos; si falta sesión, conserva el evento para después del login.
document.addEventListener("click", (event) => {
	const favoriteButton = event.target.closest(".event-card__favorite");
	if (!favoriteButton) {
		return;
	}

	const eventId = favoriteButton.dataset.eventId;
	if (localStorage.getItem("momentum-authenticated") !== "true") {
		if (eventId) {
			sessionStorage.setItem(pendingFavoriteStorageKey, eventId);
			const bounds = favoriteButton.getBoundingClientRect();
			sessionStorage.setItem(pendingFavoriteTopStorageKey, String(bounds.top));
			sessionStorage.setItem(pendingFavoriteLeftStorageKey, String(bounds.left + bounds.width / 2));
		}
		openLoginDialog();
		return;
	}

	if (!eventId) {
		return;
	}

	const favoriteIds = getFavoriteIds();
	const isRemoving = favoriteIds.includes(eventId);
	const updatedFavoriteIds = isRemoving
		? favoriteIds.filter((id) => id !== eventId)
		: [...favoriteIds, eventId];
	localStorage.setItem(favoritesStorageKey, JSON.stringify(updatedFavoriteIds));
	if (!isRemoving) {
		const bounds = favoriteButton.getBoundingClientRect();
		showFavoriteAddedNotice(updatedFavoriteIds.length, { top: bounds.top, left: bounds.left + bounds.width / 2 });
	}
	syncFavoriteButtons();
	document.dispatchEvent(new Event("favorites-changed"));
});