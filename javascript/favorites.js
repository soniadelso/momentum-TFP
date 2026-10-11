document.addEventListener("click", (event) => {
	const favoriteButton = event.target.closest(".event-card__favorite");
	if (!favoriteButton) {
		return;
	}

	const card = favoriteButton.closest(".event-card");
	const sourceCardId = card.dataset.mapPopupSource || card.id;
	const isFavorite = favoriteButton.getAttribute("aria-pressed") !== "true";
	favoriteButton.setAttribute("aria-pressed", String(isFavorite));

	if (!sourceCardId) {
		return;
	}

	const sourceButton = document.getElementById(sourceCardId)?.querySelector(".event-card__favorite");
	if (sourceButton && sourceButton !== favoriteButton) {
		sourceButton.setAttribute("aria-pressed", String(isFavorite));
	}

	const popupButton = document.querySelector(".map-event-popup__content .event-card__favorite");
	if (popupButton && popupButton !== favoriteButton) {
		popupButton.setAttribute("aria-pressed", String(isFavorite));
	}
});