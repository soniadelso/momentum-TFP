const disciplineGroup = document.querySelector('.explore-filters__group[aria-label="Disciplina"]');
const allButton = disciplineGroup?.querySelector("button");
const categoryButtons = disciplineGroup ? [...disciplineGroup.querySelectorAll("button")].slice(1) : [];
const activeCategories = new Set();
const filterValues = { format: "", date: "", location: "", price: "" };
const filterCounts = [...document.querySelectorAll("[data-filter-count]")];
const filterTrigger = document.querySelector(".map-filter-trigger");
const filterSheet = document.querySelector("#map-filter-sheet");
const barcelonaCenter = [41.3874, 2.1686];
let locationCenter = barcelonaCenter;
const eventDataById = new Map();
const searchQuery = new URLSearchParams(window.location.search).get("q") || "";
const selectedCategory = new URLSearchParams(window.location.search).get("category") || "";
const exploreTitle = document.querySelector("#interests .section__title");
if (exploreTitle && searchQuery) {
	exploreTitle.textContent = `Explorar ${searchQuery.toLocaleLowerCase("es")}`;
}
const filterDefinitions = [
	{ key: "format", label: "Formato", options: [["", "Todos"], ["presencial", "Presencial"], ["online", "Online"]] },
	{ key: "date", label: "Fechas", options: [["", "Cualquier fecha"], ["today", "Hoy"], ["week", "Esta semana"], ["month", "Este mes"]] },
	// Cerca de mí filtra a 1 km y acerca más que la opción de 3 km.
	{ key: "location", label: "Ubicación", options: [["", "Cualquier distancia"], ["1", "Cerca de mí"], ["3", "3 km"], ["5", "5 km"], ["10", "10 km"], ["25", "25 km"], ["50", "50 km"], ["100", "100 km"], ["150", "150 km"]] },
	{ key: "price", label: "Precio", options: [["", "Cualquier precio"], ["free", "Gratuito"], ["paid", "De pago"]] }
];

const buildFilterDropdown = ({ key, label, options }) => `
	<details class="explore-filters__facet-dropdown" data-filter-dropdown="${key}">
		<summary class="button button--filter-outline explore-filters__facet">
			<span>${label}</span><span data-filter-label="${key}"></span><span aria-hidden="true">▾</span>
		</summary>
		<div class="explore-filters__facet-menu" role="listbox" aria-label="${label}">
			${options.map(([value, text]) => `<button type="button" role="option" aria-selected="false" data-filter-option="${key}" data-filter-value="${value}">${text}</button>`).join("")}
		</div>
	</details>`;

const desktopFilterHost = document.querySelector("[data-desktop-filters]");
const mobileFilterHost = document.querySelector("[data-mobile-filter-fields]");
if (desktopFilterHost) {
	desktopFilterHost.innerHTML = filterDefinitions.map(buildFilterDropdown).join("");
	if (mobileFilterHost) {
		filterDefinitions.forEach((definition) => {
			const dropdown = desktopFilterHost.querySelector(`[data-filter-dropdown="${definition.key}"]`).cloneNode(true);
			dropdown.classList.add("map-filter-sheet__facet-dropdown");
			mobileFilterHost.append(dropdown);
		});
	}
}

categoryButtons.forEach((button) => {
	button.dataset.category = button.textContent.trim();
});

// Activa la disciplina indicada en la URL si coincide con una categoría disponible.
const matchingCategoryButton = categoryButtons.find((button) => button.dataset.category === selectedCategory);
if (matchingCategoryButton) {
	activeCategories.add(matchingCategoryButton.dataset.category);
}

const setButtonState = (button, isActive) => {
	button.setAttribute("aria-pressed", String(isActive));
	button.classList.toggle("button--secondary", isActive);
	button.classList.toggle("button--secondary-outline", !isActive);
};

const getDistanceKm = (first, second) => {
	const radians = (degrees) => (degrees * Math.PI) / 180;
	const [firstLat, firstLon] = first.map(radians);
	const [secondLat, secondLon] = second.map(radians);
	const latitudeDelta = secondLat - firstLat;
	const longitudeDelta = secondLon - firstLon;
	const haversine = Math.sin(latitudeDelta / 2) ** 2
		+ Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(longitudeDelta / 2) ** 2;
	return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

const matchesDateRange = (startsAt, range) => {
	const eventDate = new Date(startsAt);
	if (Number.isNaN(eventDate.getTime())) {
		return false;
	}

	const today = new Date();
	const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const nextDay = new Date(dayStart);
	nextDay.setDate(nextDay.getDate() + 1);

	if (range === "today") {
		return eventDate >= dayStart && eventDate < nextDay;
	}

	if (range === "week") {
		const weekStart = new Date(dayStart);
		weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
		const nextWeek = new Date(weekStart);
		nextWeek.setDate(nextWeek.getDate() + 7);
		return eventDate >= weekStart && eventDate < nextWeek;
	}

	if (range === "month") {
		const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
		const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
		return eventDate >= monthStart && eventDate < nextMonth;
	}

	return true;
};

const syncFilterControls = () => {
	document.querySelectorAll("[data-filter-label]").forEach((label) => {
		const value = filterValues[label.dataset.filterLabel];
		const selectedOption = filterDefinitions.find((definition) => definition.key === label.dataset.filterLabel)
			?.options.find(([optionValue]) => optionValue === value);
		label.textContent = value ? `: ${selectedOption?.[1] || value}` : "";
	});
	document.querySelectorAll("[data-filter-option]").forEach((option) => {
		const isSelected = filterValues[option.dataset.filterOption] === option.dataset.filterValue;
		option.setAttribute("aria-selected", String(isSelected));
		option.classList.toggle("is-selected", isSelected);
	});

	const count = activeCategories.size + Object.values(filterValues).filter(Boolean).length;
	filterCounts.forEach((counter) => {
		counter.textContent = String(count);
		counter.hidden = count === 0;
	});
	filterTrigger?.setAttribute("aria-label", count ? `Abrir filtros, ${count} activos` : "Abrir filtros");
};

const applyFilters = ({ fitMap = false } = {}) => {
	if (allButton) {
		setButtonState(allButton, activeCategories.size === 0);
		allButton.setAttribute("aria-pressed", String(activeCategories.size === 0));
	}

	categoryButtons.forEach((button) => {
		const isActive = activeCategories.has(button.dataset.category);
		setButtonState(button, isActive);
		button.replaceChildren(button.dataset.category);
		if (isActive) {
			const close = document.createElement("span");
			close.className = "explore-filters__clear";
			close.setAttribute("aria-hidden", "true");
			close.textContent = "×";
			button.append(close);
		}
	});

	const matchingEventIds = new Set((window.searchEvents?.(searchQuery) || []).map((item) => item.id));
	let visibleCardCount = 0;
	document.querySelectorAll(".events__grid .event-card[data-event-id]").forEach((card) => {
		const eventData = eventDataById.get(card.dataset.eventId);
		if (!eventData) {
			return;
		}

		const matchesSearch = matchingEventIds.has(eventData.id);
		const matchesCategory = activeCategories.size === 0 || activeCategories.has(eventData.category);
		const matchesFormat = !filterValues.format || eventData.format === filterValues.format;
		const matchesDate = !filterValues.date || matchesDateRange(eventData.startsAt, filterValues.date);
		const matchesLocation = !filterValues.location
			|| getDistanceKm(locationCenter, eventData.coordinates) <= Number(filterValues.location);
		const matchesPrice = !filterValues.price
			|| (filterValues.price === "free" ? eventData.priceAmount === 0 : eventData.priceAmount > 0);
		card.hidden = !(matchesSearch && matchesCategory && matchesFormat && matchesDate && matchesLocation && matchesPrice);
		if (!card.hidden) {
			visibleCardCount += 1;
		}
	});

	const emptySearchMessage = document.querySelector("[data-search-empty]");
	if (emptySearchMessage) {
		emptySearchMessage.hidden = !searchQuery || visibleCardCount > 0;
	}

	syncFilterControls();
	document.dispatchEvent(new CustomEvent("map-events-filtered", {
		detail: { fitMap, locationDistance: filterValues.location, locationCenter }
	}));
};

disciplineGroup?.addEventListener("click", (event) => {
	const button = event.target.closest("button");
	if (!button) {
		return;
	}

	if (button === allButton) {
		activeCategories.clear();
	} else if (activeCategories.has(button.dataset.category)) {
		activeCategories.delete(button.dataset.category);
	} else {
		activeCategories.add(button.dataset.category);
	}

	applyFilters({ fitMap: true });
});

document.addEventListener("click", (event) => {
	const option = event.target.closest("[data-filter-option]");
	if (!option) {
		return;
	}

	filterValues[option.dataset.filterOption] = option.dataset.filterValue;
	option.closest("details")?.removeAttribute("open");
	applyFilters({ fitMap: true });
});

document.addEventListener("click", (event) => {
	document.querySelectorAll("details[data-filter-dropdown][open]").forEach((dropdown) => {
		if (!dropdown.contains(event.target)) {
			dropdown.removeAttribute("open");
		}
	});
});

document.querySelectorAll("[data-clear-filters]").forEach((button) => {
	button.addEventListener("click", () => {
		activeCategories.clear();
		Object.keys(filterValues).forEach((key) => { filterValues[key] = ""; });
		applyFilters({ fitMap: true });
	});
});

// Usa la ubicación obtenida por el mapa como origen del filtro por distancia.
document.addEventListener("user-location-found", (event) => {
	locationCenter = event.detail.coordinates;
	applyFilters();
});

if (filterTrigger && filterSheet) {
	filterTrigger.addEventListener("click", () => {
		filterSheet.showModal();
		filterTrigger.setAttribute("aria-expanded", "true");
	});

	filterSheet.addEventListener("click", (event) => {
		if (event.target === filterSheet || event.target.closest(".map-filter-sheet__close")) {
			filterSheet.close();
		}
	});

	filterSheet.addEventListener("close", () => filterTrigger.setAttribute("aria-expanded", "false"));
}

window.eventsDataReady.then((eventsData) => {
	eventsData.forEach((item) => eventDataById.set(item.id, item));
	applyFilters();
});
applyFilters();