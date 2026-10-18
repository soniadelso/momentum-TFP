const favoritesStorageKey = "momentum-favorites";
const pendingFavoriteStorageKey = "momentum-pending-favorite";
const pendingFavoriteTopStorageKey = "momentum-pending-favorite-top";
const pendingFavoriteNoticeStorageKey = "momentum-pending-favorite-notice";
const pendingFavoriteScrollStorageKey = "momentum-pending-favorite-scroll";
const shouldRestoreFavoriteScroll = sessionStorage.getItem(pendingFavoriteScrollStorageKey) !== null;
if (shouldRestoreFavoriteScroll) {
	history.scrollRestoration = "manual";
}
const getFavoriteIds = () => JSON.parse(localStorage.getItem(favoritesStorageKey) || "[]");
let favoriteNotice;
let favoriteNoticeTimeout;

// Muestra el total actualizado de favoritos durante un segundo junto al perfil.
const showFavoriteAddedNotice = (count) => {
	if (!favoriteNotice) {
		favoriteNotice = document.createElement("a");
		favoriteNotice.className = "favorite-added-notice";
		favoriteNotice.href = "user-profile.html";
		favoriteNotice.setAttribute("aria-live", "polite");
		favoriteNotice.setAttribute("aria-atomic", "true");
		favoriteNotice.innerHTML = '<span>Añadido a mi perfil</span><span class="favorite-added-notice__count" aria-hidden="true"></span>';
		document.body.append(favoriteNotice);
	}

	favoriteNotice.querySelector(".favorite-added-notice__count").textContent = String(count);
	favoriteNotice.hidden = false;
	favoriteNotice.classList.remove("is-visible");
	requestAnimationFrame(() => favoriteNotice.classList.add("is-visible"));
	clearTimeout(favoriteNoticeTimeout);
	favoriteNoticeTimeout = setTimeout(() => {
		favoriteNotice.classList.remove("is-visible");
		favoriteNotice.hidden = true;
	}, 1800);
};

// Every favorite button for the same event shares one state, wherever it appears.
const syncFavoriteButtons = () => {
	const favoriteIds = localStorage.getItem("momentum-authenticated") === "true" ? getFavoriteIds() : [];
	document.querySelectorAll(".event-card__favorite[data-event-id]").forEach((button) => {
		button.setAttribute("aria-pressed", String(favoriteIds.includes(button.dataset.eventId)));
	});
};

document.addEventListener("DOMContentLoaded", () => {
	syncFavoriteButtons();
	window.eventsDataReady?.then(syncFavoriteButtons);
	const pendingCount = Number(sessionStorage.getItem(pendingFavoriteNoticeStorageKey));
	if (pendingCount) {
		sessionStorage.removeItem(pendingFavoriteNoticeStorageKey);
		showFavoriteAddedNotice(pendingCount);
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
	sessionStorage.removeItem(pendingFavoriteTopStorageKey);
	if (currentPage === "index.html") {
		sessionStorage.removeItem(pendingFavoriteNoticeStorageKey);
		sessionStorage.removeItem(pendingFavoriteScrollStorageKey);
		showFavoriteAddedNotice(updatedFavoriteIds.length);
	} else {
		sessionStorage.setItem(pendingFavoriteNoticeStorageKey, String(updatedFavoriteIds.length));
		sessionStorage.setItem(pendingFavoriteScrollStorageKey, String(window.scrollY));
	}
	if (updatedFavoriteIds.length) {
		sessionStorage.removeItem(pendingFavoriteStorageKey);
	}
	syncFavoriteButtons();
});

document.addEventListener("click", (event) => {
	const favoriteButton = event.target.closest(".event-card__favorite");
	if (!favoriteButton) {
		return;
	}

	const eventId = favoriteButton.dataset.eventId;
	if (localStorage.getItem("momentum-authenticated") !== "true") {
		if (eventId) {
			sessionStorage.setItem(pendingFavoriteStorageKey, eventId);
			sessionStorage.setItem(pendingFavoriteTopStorageKey, String(favoriteButton.getBoundingClientRect().top));
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
		showFavoriteAddedNotice(updatedFavoriteIds.length);
	}
	syncFavoriteButtons();
	document.dispatchEvent(new Event("favorites-changed"));
});