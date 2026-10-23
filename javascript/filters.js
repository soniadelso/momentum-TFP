// ============================================================
// Compartido por Explorar y Mapa: estado, controles y filtrado.
// ============================================================
const disciplineGroup = document.querySelector('.explore-filters__group[aria-label="Disciplina"]');
const allButton = disciplineGroup?.querySelector("button");
const categoryButtons = disciplineGroup ? [...disciplineGroup.querySelectorAll("button")].slice(1) : [];
const activeCategories = new Set();
const filterValues = { format: "", date: "", location: "", price: "" };
const filterCounts = [...document.querySelectorAll("[data-filter-count]")];
const filterTrigger = document.querySelector(".map-filter-trigger");
const filterSheet = document.querySelector("#map-filter-sheet");
const barcelonaCenter = [41.3874, 2.1686];
const isMapPage = Boolean(document.querySelector(".map-canvas"));
const locationError = document.querySelector("[data-location-error]");
let locationCenter = barcelonaCenter;
let mapViewportBounds = null;
const eventDataById = new Map();
// Compartido: lee la búsqueda y filtros iniciales enviados en la URL.
const pageParameters = new URLSearchParams(window.location.search);
const searchQuery = pageParameters.get("q") || "";
const selectedCategories = pageParameters.getAll("category");
const sectionTitle = pageParameters.get("title") || "";
const exploreTitle = document.querySelector("#interests .section__title");
// Solo Explorar: actualiza el título de resultados según la URL.
if (exploreTitle && sectionTitle) {
	exploreTitle.textContent = sectionTitle;
} else if (exploreTitle && searchQuery) {
	exploreTitle.textContent = `Explorar ${searchQuery.toLocaleLowerCase("es")}`;
}
// Compartido: define las opciones de filtro para las dos páginas.
const filterDefinitions = [
	{ key: "format", label: "Formato", options: [["", "Todos"], ["presencial", "Presencial"], ["online", "Online"]] },
	{ key: "date", label: "Fechas", options: [["", "Cualquier fecha"], ["today", "Hoy"], ["week", "Esta semana"], ["month", "Este mes"]] },
	// Cerca de mí filtra a 1 km y acerca más que la opción de 3 km.
	{ key: "location", label: "Ubicación", options: [["", "Cualquier distancia"], ["1", "Cerca de mí"], ["3", "3 km"], ["5", "5 km"], ["10", "10 km"], ["25", "25 km"], ["50", "50 km"], ["100", "100 km"], ["150", "150 km"]] },
	{ key: "price", label: "Precio", options: [["", "Cualquier precio"], ["free", "Gratuito"], ["paid", "De pago"]] }
];
// Solo Mapa: oculta formato, ya que el mapa muestra eventos presenciales.
const visibleFilterDefinitions = isMapPage
	? filterDefinitions.filter(({ key }) => key !== "format")
	: filterDefinitions;

// Compartido: genera el HTML de cada menú de filtro.
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
// Compartido: inserta filtros en escritorio y los copia al panel móvil.
if (desktopFilterHost) {
	desktopFilterHost.innerHTML = visibleFilterDefinitions.map(buildFilterDropdown).join("");
	if (mobileFilterHost) {
		visibleFilterDefinitions.forEach((definition) => {
			const dropdown = desktopFilterHost.querySelector(`[data-filter-dropdown="${definition.key}"]`).cloneNode(true);
			dropdown.classList.add("map-filter-sheet__facet-dropdown");
			const arrow = dropdown.querySelector('summary > span[aria-hidden="true"]');
			if (arrow) {
				arrow.style.rotate = "0deg";
				dropdown.addEventListener("toggle", () => {
					arrow.style.rotate = dropdown.open ? "180deg" : "0deg";
				});
			}
			mobileFilterHost.append(dropdown);
		});
	}
}

categoryButtons.forEach((button) => {
	button.dataset.category = button.textContent.trim();
});

// Activa las disciplinas indicadas en la URL si coinciden con categorías disponibles.
categoryButtons
	.filter((button) => selectedCategories.includes(button.dataset.category))
	.forEach((button) => activeCategories.add(button.dataset.category));

// Sincroniza el aspecto de cada botón de disciplina con su estado seleccionado.
const setButtonState = (button, isActive) => {
	button.setAttribute("aria-pressed", String(isActive));
	button.classList.toggle("button--secondary", isActive);
	button.classList.toggle("button--secondary-outline", !isActive);
};

// Compartido: comprueba si una fecha pertenece al periodo elegido.
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

// Compartido: calcula la distancia geográfica para filtrar eventos por radio.
const distanceBetweenCoordinates = (firstCoordinates, secondCoordinates) => {
	const toRadians = (degrees) => degrees * Math.PI / 180;
	const latitudeDifference = toRadians(secondCoordinates[0] - firstCoordinates[0]);
	const longitudeDifference = toRadians(secondCoordinates[1] - firstCoordinates[1]);
	const haversine = Math.sin(latitudeDifference / 2) ** 2
		+ Math.cos(toRadians(firstCoordinates[0]))
		* Math.cos(toRadians(secondCoordinates[0]))
		* Math.sin(longitudeDifference / 2) ** 2;
	return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

// En Mapa, amplía el radio hasta cubrir el área visible al alejar el zoom.
const mapViewportRadius = () => {
	if (!mapViewportBounds) {
		return 0;
	}

	const viewportCorners = [
		[mapViewportBounds.south, mapViewportBounds.west],
		[mapViewportBounds.south, mapViewportBounds.east],
		[mapViewportBounds.north, mapViewportBounds.west],
		[mapViewportBounds.north, mapViewportBounds.east]
	];
	return Math.max(...viewportCorners.map((corner) => distanceBetweenCoordinates(locationCenter, corner)));
};

// Actualiza etiquetas, selecciones y contador de filtros activos.
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

// Compartido: combina criterios y oculta las tarjetas que no coinciden.
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
		const selectedDistance = Number(filterValues.location);
		const effectiveDistance = isMapPage
			? Math.max(selectedDistance, mapViewportRadius())
			: selectedDistance;
		const matchesLocation = !filterValues.location || (eventData.coordinates
			&& distanceBetweenCoordinates(locationCenter, eventData.coordinates) <= effectiveDistance);
		// Solo Mapa: limita resultados a los límites visibles del mapa.
		const matchesMapViewport = !mapViewportBounds || (eventData.coordinates
			&& eventData.coordinates[0] >= mapViewportBounds.south
			&& eventData.coordinates[0] <= mapViewportBounds.north
			&& eventData.coordinates[1] >= mapViewportBounds.west
			&& eventData.coordinates[1] <= mapViewportBounds.east);
		const matchesPrice = !filterValues.price
			|| (filterValues.price === "free" ? eventData.priceAmount === 0 : eventData.priceAmount > 0);
		card.hidden = !(matchesSearch && matchesCategory && matchesFormat && matchesDate && matchesLocation && matchesPrice && matchesMapViewport);
		if (!card.hidden) {
			visibleCardCount += 1;
		}
	});

	const emptySearchMessage = document.querySelector("[data-search-empty]");
	if (emptySearchMessage) {
		emptySearchMessage.textContent = filterValues.location
			? "No se encontraron eventos en esta distancia."
			: "No se encontraron eventos para esa búsqueda.";
		emptySearchMessage.hidden = !(searchQuery || filterValues.location) || visibleCardCount > 0;
	}

	syncFilterControls();
	// Solo Mapa: envía al mapa el resultado y el centro/radio elegidos.
	document.dispatchEvent(new CustomEvent("map-events-filtered", {
		detail: { fitMap, locationDistance: filterValues.location, locationCenter }
	}));
};

// Solo Mapa: vuelve a filtrar cuando cambia el área visible.
document.addEventListener("map-viewport-changed", (event) => {
	mapViewportBounds = event.detail.bounds;
	applyFilters();
});

// Alterna disciplinas y vuelve a calcular los eventos visibles.
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

// Compartido; solo Explorar solicita permiso al elegir un radio de ubicación.
document.addEventListener("click", (event) => {
	const option = event.target.closest("[data-filter-option]");
	if (!option) {
		return;
	}

	const filterKey = option.dataset.filterOption;
	const filterValue = option.dataset.filterValue;
	option.closest("details")?.removeAttribute("open");
	if (filterKey === "location" && filterValue && !isMapPage) {
		if (!navigator.geolocation) {
			filterValues.location = "";
			if (locationError) {
				locationError.textContent = "Este navegador no permite acceder a la ubicación.";
				locationError.hidden = false;
			}
			syncFilterControls();
			applyFilters();
			return;
		}

		navigator.geolocation.getCurrentPosition(({ coords }) => {
			locationCenter = [coords.latitude, coords.longitude];
			filterValues.location = filterValue;
			if (locationError) {
				locationError.hidden = true;
			}
			applyFilters({ fitMap: true });
		}, () => {
			filterValues.location = "";
			if (locationError) {
				locationError.textContent = "No se pudo acceder a tu ubicación. Revisa los permisos del navegador.";
				locationError.hidden = false;
			}
			syncFilterControls();
			applyFilters();
		}, { maximumAge: 300000, timeout: 10000 });
		return;
	}

	filterValues[filterKey] = filterValue;
	if (filterKey === "location" && !filterValue && locationError) {
		locationError.hidden = true;
	}
	applyFilters({ fitMap: true });
});

// Cierra los desplegables abiertos cuando el clic ocurre fuera de ellos.
document.addEventListener("click", (event) => {
	document.querySelectorAll("details[data-filter-dropdown][open]").forEach((dropdown) => {
		if (!dropdown.contains(event.target)) {
			dropdown.removeAttribute("open");
		}
	});
});

// Restablece criterios y avisos desde los botones «Limpiar».
document.querySelectorAll("[data-clear-filters]").forEach((button) => {
	button.addEventListener("click", () => {
		activeCategories.clear();
		Object.keys(filterValues).forEach((key) => { filterValues[key] = ""; });
		if (locationError) {
			locationError.hidden = true;
		}
		applyFilters({ fitMap: true });
	});
});

// Solo Mapa: usa el evento de geolocalización como centro del filtro por radio.
document.addEventListener("user-location-found", (event) => {
	locationCenter = event.detail.coordinates;
	applyFilters();
});

// Compartido: controla la apertura y cierre del panel de filtros móvil.
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

// Compartido: indexa los eventos y aplica los filtros iniciales al cargar datos.
window.eventsDataReady.then((eventsData) => {
	eventsData.forEach((item) => eventDataById.set(item.id, item));
	applyFilters();
});
applyFilters();