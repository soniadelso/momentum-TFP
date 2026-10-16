const favoritesStorageKey = "momentum-favorites";
const getFavoriteIds = () => JSON.parse(localStorage.getItem(favoritesStorageKey) || "[]");

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
	localStorage.setItem(
		favoritesStorageKey,
		JSON.stringify(favoriteIds.includes(eventId) ? favoriteIds.filter((id) => id !== eventId) : [...favoriteIds, eventId])
	);
	syncFavoriteButtons();
	document.dispatchEvent(new Event("favorites-changed"));
});