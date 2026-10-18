const attendingStorageKey = "momentum-attending";
const getAttendingIds = () => JSON.parse(localStorage.getItem(attendingStorageKey) || "[]");
const setAttendingIds = (ids) => localStorage.setItem(attendingStorageKey, JSON.stringify(ids));
const mapEventGrid = document.querySelector("[data-map-events]");
mapEventGrid?.replaceChildren();

const eventsDataReady = fetch("events.json")
	.then((response) => {
		if (!response.ok) {
			throw new Error(`Could not load events: ${response.status}`);
		}
		return response.json();
	})
	.catch((error) => {
		console.error("Could not load event data.", error);
		return [];
	});
window.eventsDataReady = eventsDataReady;
window.getAttendingIds = getAttendingIds;
window.setAttendingIds = setAttendingIds;

eventsDataReady.then((eventsData) => {
	const eventsByTitle = new Map(eventsData.flatMap((item) => item.aliases.map((alias) => [alias.toLowerCase(), item])));
	const mapEvents = mapEventGrid
		? eventsData.filter((item) => item.format === "presencial"
			&& Array.isArray(item.coordinates)
			&& Math.abs(item.coordinates[0]) <= 90
			&& Math.abs(item.coordinates[1]) <= 180)
		: [];
	const searchableEvents = mapEventGrid ? mapEvents : eventsData;
	const categorySearchTranslations = {
		"Digital Product": "Diseño de producto",
		"Brand & Graphic": "Diseño gráfico",
		"Industrial Design": "Diseño industrial",
		"Media & Motion": "Audiovisual y animación"
	};
	const categorySearchAliases = {
		"Digital Product": ["Product Design"],
		"Brand & Graphic": ["Graphic Design"]
	};
	const keywordSearchAliases = {
		"Inteligencia artificial": ["IA"],
		"Artificial intelligence": ["AI"]
	};
	const categorySearchSuggestions = {
		"Digital Product": [
			{ label: "Product Design", value: "Product Design", aliases: ["Digital Product"] },
			{ label: "Diseño de producto", value: "Diseño de producto" }
		],
		"Brand & Graphic": [
			{ label: "Graphic Design", value: "Graphic Design", aliases: ["Brand & Graphic"] },
			{ label: "Diseño gráfico", value: "Diseño gráfico" }
		],
		"Industrial Design": [
			{ label: "Industrial Design", value: "Industrial Design" },
			{ label: "Diseño industrial", value: "Diseño industrial" }
		],
		"Media & Motion": [
			{ label: "Media & Motion", value: "Media & Motion" },
			{ label: "Audiovisual y animación", value: "Audiovisual y animación" }
		]
	};
	const eventCardMarkup = (item, isMapCard = false) => {
		const cardClass = isMapCard ? "event-card event-card-map" : "event-card";
		const mapCardId = isMapCard ? ` id="map-event-${item.id}"` : "";
		return `
		<article class="${cardClass}"${mapCardId} data-event-id="${item.id}">
			<div class="event-card__visual">
				<img class="event-card__image" src="${item.image}" alt="${item.imageAlt}" loading="lazy">
				<button class="event-card__favorite" type="button" data-event-id="${item.id}" aria-label="Añadir ${item.title} a favoritos" aria-pressed="false"><svg class="event-card__favorite-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" /></svg></button>
				<span class="event-card__category" data-category="${item.category}">${item.category}</span>
			</div>
			<div class="event-card__details"><h3 class="event-card__title"><a href="event-detail.html?id=${item.id}">${item.title}</a></h3><div class="event-card__meta"><span>${item.date}</span><span class="event-card__price">${item.price}</span></div><p class="event-card__venue">${item.organizer}</p></div>
		</article>`;
	};
	window.eventCardMarkup = eventCardMarkup;
	const normalizeSearchText = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");
	const searchEvents = (query) => {
		const terms = normalizeSearchText(query).split(/\s+/).filter(Boolean);
		if (!terms.length) {
			return searchableEvents;
		}

		return searchableEvents.filter((item) => {
			const searchableText = normalizeSearchText([
				item.title,
				...item.aliases,
				item.category,
				categorySearchTranslations[item.category],
				...(categorySearchAliases[item.category] || []),
				...(item.keywords || []),
				item.city,
				item.autonomousCommunity,
				item.country,
				item.organizer,
				item.location
			].join(" "));
			return terms.every((term) => searchableText.includes(term));
		});
	};
	window.searchEvents = searchEvents;
	const searchSuggestions = [...new Map(searchableEvents.flatMap((item) => [
		{ label: [item.city, item.autonomousCommunity, item.country].filter(Boolean).join(" · "), value: item.city },
		...(categorySearchSuggestions[item.category] || [{ label: item.category, value: item.category }]),
		...(item.keywords || []).map((keyword) => ({
			label: keyword,
			value: keyword,
			aliases: keywordSearchAliases[keyword] || []
		}))
	]).map((suggestion) => [normalizeSearchText(suggestion.label), suggestion])).values()];
	const findSearchSuggestions = (query) => {
		const normalizedQuery = normalizeSearchText(query.trim());
		return searchSuggestions
			.filter((suggestion) => [suggestion.label, ...(suggestion.aliases || [])]
				.some((value) => normalizeSearchText(value).includes(normalizedQuery)))
			.slice(0, 6);
	};

	const searchInput = document.querySelector("#event-search");
	const clearSearchButton = document.querySelector("[data-search-clear]");
	const suggestionsList = document.querySelector("#event-search-suggestions");
	let suggestionTimer;
	const resetActiveSearch = () => {
		const isMapPage = window.location.pathname.endsWith("/map.html");
		const isExplorePage = window.location.pathname.endsWith("/explorar.html");
		if ((isMapPage || isExplorePage) && new URLSearchParams(window.location.search).has("q")) {
			window.location.assign(isMapPage ? "map.html" : "explorar.html");
			return true;
		}
		return false;
	};

	if (searchInput && clearSearchButton) {
		clearSearchButton.hidden = !searchInput.value;
		clearSearchButton.addEventListener("click", () => {
			if (resetActiveSearch()) {
				return;
			}

			searchInput.value = "";
			searchInput.dispatchEvent(new Event("input", { bubbles: true }));
			searchInput.focus();
		});
	}

	const closeSuggestions = () => {
		if (!suggestionsList || !searchInput) {
			return;
		}
		suggestionsList.hidden = true;
		searchInput.setAttribute("aria-expanded", "false");
	};

	if (searchInput && suggestionsList) {
		searchInput.addEventListener("input", () => {
			clearTimeout(suggestionTimer);
			const query = searchInput.value.trim();
			if (clearSearchButton) {
				clearSearchButton.hidden = !query;
			}
			if (!query) {
				closeSuggestions();
				resetActiveSearch();
				return;
			}

			suggestionTimer = setTimeout(() => {
				const matches = findSearchSuggestions(query);
				suggestionsList.replaceChildren(...matches.map((suggestion) => {
					const option = document.createElement("button");
					option.type = "button";
					option.role = "option";
					option.dataset.searchSuggestion = suggestion.value;
					option.textContent = suggestion.label;
					return option;
				}));
				suggestionsList.hidden = matches.length === 0;
				searchInput.setAttribute("aria-expanded", String(matches.length > 0));
			}, 300);
		});

		searchInput.addEventListener("keydown", (event) => {
			if (event.key === "Escape") {
				closeSuggestions();
			}
		});

		suggestionsList.addEventListener("click", (event) => {
			const option = event.target.closest("[data-search-suggestion]");
			if (!option) {
				return;
			}
			searchInput.value = option.dataset.searchSuggestion;
			closeSuggestions();
			searchInput.form.requestSubmit();
		});

		searchInput.form.addEventListener("submit", (event) => {
			searchInput.value = searchInput.value.trim();
			if (searchInput.value) {
				closeSuggestions();
				return;
			}

			event.preventDefault();
			closeSuggestions();
		});

		document.addEventListener("click", (event) => {
			if (!suggestionsList.parentElement.contains(event.target)) {
				closeSuggestions();
			}
		});
	}

	const eventGrids = [...document.querySelectorAll("[data-event-ids]")];
	eventGrids.forEach((grid) => {
		const eventIds = grid.dataset.eventIds.trim();
		const gridEvents = eventIds === "all"
			? eventsData
			: eventIds.split(",").map((id) => eventsData.find((item) => item.id === id)).filter(Boolean);
		grid.innerHTML = gridEvents.map((item) => eventCardMarkup(item)).join("");
	});

	if (mapEventGrid) {
		mapEventGrid.innerHTML = mapEvents.map((item) => eventCardMarkup(item, true)).join("");
	}

	const syncAttendingLabels = () => {
		const isUserAuthenticated = localStorage.getItem("momentum-authenticated") === "true";
		const attendedIds = getAttendingIds();

		document.querySelectorAll(".event-card").forEach((card) => {
			const categoryLabel = card.querySelector(".event-card__category");
			if (!categoryLabel) {
				return;
			}

			const eventId = card.dataset.eventId || card.dataset.mapPopupSource;
			const eventData = eventsData.find((item) => item.id === eventId);
			if (!eventData) {
				return;
			}

			categoryLabel.dataset.category = eventData.category;
			categoryLabel.textContent = eventData.category;
			const isAttending = isUserAuthenticated && attendedIds.includes(eventId);
			let attendingLabel = card.querySelector(".event-card__attending");
			if (isAttending && !attendingLabel) {
				attendingLabel = document.createElement("span");
				attendingLabel.className = "event-card__attending";
				attendingLabel.textContent = "Asistiré";
				categoryLabel.before(attendingLabel);
			} else if (!isAttending) {
				attendingLabel?.remove();
			}
		});
	};

	const favoritesGrid = document.querySelector("[data-favorites-grid]");
	if (favoritesGrid) {
		const renderFavorites = () => {
			const favoriteIds = localStorage.getItem("momentum-authenticated") === "true" ? getFavoriteIds() : [];
			const favoriteEvents = eventsData.filter((item) => favoriteIds.includes(item.id));
			favoritesGrid.innerHTML = favoriteEvents.map(eventCardMarkup).join("");
			document.querySelector("[data-favorites-empty]").hidden = favoriteEvents.length > 0;
			syncFavoriteButtons();
			syncAttendingLabels();
		};

		renderFavorites();
		document.addEventListener("favorites-changed", renderFavorites);
	}

	document.querySelectorAll(".event-card__title").forEach((title) => {
		const item = eventsByTitle.get(title.textContent.trim().toLowerCase());
		if (item) {
			const card = title.closest(".event-card");
			card.dataset.eventId = item.id;
			card.querySelector(".event-card__favorite")?.setAttribute("data-event-id", item.id);
			const categoryLabel = card.querySelector(".event-card__category");
			if (categoryLabel) {
				categoryLabel.dataset.category = item.category;
				categoryLabel.textContent = item.category;
			}
		}

		if (!item || title.querySelector("a")) {
			return;
		}

		const link = document.createElement("a");
		link.href = `event-detail.html?id=${item.id}`;
		link.textContent = title.textContent;
		title.replaceChildren(link);
	});

	syncAttendingLabels();
	document.addEventListener("attending-changed", syncAttendingLabels);
	document.addEventListener("click", (event) => {
		if (event.target.closest("a, button")) {
			return;
		}

		const detailLink = event.target.closest(".event-card")?.querySelector(".event-card__title a");
		if (detailLink) {
			window.location.href = detailLink.href;
		}
	});
});
