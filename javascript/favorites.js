const favoritesStorageKey = "momentum-favorites";
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

document.addEventListener("DOMContentLoaded", syncFavoriteButtons);

document.addEventListener("click", (event) => {
	const favoriteButton = event.target.closest(".event-card__favorite");
	if (!favoriteButton) {
		return;
	}

	if (localStorage.getItem("momentum-authenticated") !== "true") {
		openLoginDialog();
		return;
	}

	const eventId = favoriteButton.dataset.eventId;
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