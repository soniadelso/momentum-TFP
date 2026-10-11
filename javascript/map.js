const mapFilterTrigger = document.querySelector(".map-filter-trigger");
const mapFilterSheet = document.querySelector("#map-filter-sheet");

if (mapFilterTrigger && mapFilterSheet) {
	const closeMapFilterSheet = () => {
		mapFilterSheet.close();
		mapFilterTrigger.setAttribute("aria-expanded", "false");
	};

	document.addEventListener("click", (event) => {
		if (event.target.closest(".map-filter-trigger")) {
			mapFilterSheet.showModal();
			mapFilterTrigger.setAttribute("aria-expanded", "true");
			return;
		}

		if (event.target.closest(".map-filter-sheet__close") && mapFilterSheet.open) {
			closeMapFilterSheet();
			return;
		}

		if (event.target === mapFilterSheet && mapFilterSheet.open) {
			closeMapFilterSheet();
		}
	});

	mapFilterSheet.addEventListener("close", () => mapFilterTrigger.setAttribute("aria-expanded", "false"));
}

const mapCanvas = document.querySelector('main#home[aria-label="Mapa de eventos"] > .event-card__visual');
const mapEventPopup = document.querySelector("#map-event-popup");
const mapEventPopupContent = mapEventPopup?.querySelector(".map-event-popup__content");

if (mapCanvas && mapEventPopup && mapEventPopupContent) {
	const closeMapEventPopup = (restoreFocus = true) => {
		const activePinId = mapEventPopup.dataset.eventCardId;
		const closeButton = mapEventPopup.querySelector(".map-event-popup__close");
		mapEventPopup.insertBefore(closeButton, mapEventPopupContent);
		mapEventPopup.hidden = true;
		mapEventPopupContent.replaceChildren();
		delete mapEventPopup.dataset.eventCardId;
		mapCanvas.querySelectorAll(".map-pin").forEach((pin) => {
			pin.open = false;
		});

		if (restoreFocus && activePinId) {
			mapCanvas.querySelector(`[data-event-card-id="${CSS.escape(activePinId)}"] .map-pin__toggle`)?.focus();
		}
	};

	const positionMapEventPopup = (pin) => {
		if (window.matchMedia("(max-width: 700px)").matches) {
			mapEventPopup.style.left = "";
			mapEventPopup.style.top = "";
			return;
		}

		const mapBounds = mapCanvas.getBoundingClientRect();
		const pinBounds = pin.getBoundingClientRect();
		const popupBounds = mapEventPopup.getBoundingClientRect();
		const inset = 12;
		let left = pinBounds.right - mapBounds.left + inset;

		if (left + popupBounds.width > mapBounds.width - inset) {
			left = pinBounds.left - mapBounds.left - popupBounds.width - inset;
		}

		mapEventPopup.style.left = `${Math.max(inset, Math.min(left, mapBounds.width - popupBounds.width - inset))}px`;
		mapEventPopup.style.top = `${Math.max(inset, Math.min(pinBounds.top - mapBounds.top + (pinBounds.height - popupBounds.height) / 2, mapBounds.height - popupBounds.height - inset))}px`;
	};

	document.addEventListener("click", (event) => {
		const pinToggle = event.target.closest(".map-pin__toggle");

		if (pinToggle && mapCanvas.contains(pinToggle)) {
			event.preventDefault();
			const pin = pinToggle.closest(".map-pin");
			const eventCardId = pin.dataset.eventCardId;

			if (mapEventPopup.dataset.eventCardId === eventCardId && !mapEventPopup.hidden) {
				closeMapEventPopup();
				return;
			}

			const sourceCard = document.getElementById(eventCardId);
			if (!sourceCard) {
				return;
			}

			const card = sourceCard.cloneNode(true);
			card.removeAttribute("id");
			card.dataset.mapPopupSource = eventCardId;
			mapEventPopupContent.replaceChildren(card);
			card.querySelector(".event-card__visual").append(mapEventPopup.querySelector(".map-event-popup__close"));
			mapEventPopup.dataset.eventCardId = eventCardId;
			mapEventPopup.setAttribute("aria-label", card.querySelector(".event-card__title")?.textContent.trim() || "Tarjeta del evento");
			mapEventPopup.hidden = false;
			positionMapEventPopup(pin);
			mapEventPopup.querySelector(".map-event-popup__close").focus({ preventScroll: true });
			return;
		}

		if (event.target.closest(".map-event-popup__close") && !mapEventPopup.hidden) {
			closeMapEventPopup();
			return;
		}

		if (!mapEventPopup.hidden && !event.target.closest(".map-event-popup")) {
			closeMapEventPopup(false);
		}
	});

	document.addEventListener("keydown", (event) => {
		if (event.key === "Escape" && !mapEventPopup.hidden) {
			closeMapEventPopup();
		}
	});

	window.addEventListener("resize", () => {
		if (mapEventPopup.hidden) {
			return;
		}

		const activePin = mapCanvas.querySelector(`[data-event-card-id="${CSS.escape(mapEventPopup.dataset.eventCardId)}"]`);
		if (activePin) {
			positionMapEventPopup(activePin);
		}
	});
}