
// Carga Leaflet desde el import map de map.html sin empaquetarlo con Vite.
const leafletModule = "leaflet";
const { Circle, DivIcon, LeafletMap, Marker, TileLayer } = await import(/* @vite-ignore */ leafletModule);

// Inicia el mapa de Barcelona y publica sus límites para filtrar eventos.
const map = new LeafletMap("map", { zoomSnap: 0.25 }).setView([41.3874, 2.1686], 13);
// Mantiene las tarjetas emergentes por encima de los controles del mapa.
const eventPopupPane = map.createPane("eventPopupPane", map.getContainer());
eventPopupPane.style.zIndex = "1101";
eventPopupPane.style.pointerEvents = "none";
eventPopupPane.style.transformOrigin = "0 0";

// Sincroniza el pane emergente con el movimiento y zoom del mapa.
const syncEventPopupPane = () => {
	eventPopupPane.style.transform = getComputedStyle(map.getPane("mapPane")).transform;
};
map.on("move zoom zoomanim viewreset", syncEventPopupPane);
syncEventPopupPane();

// Informa al filtro qué eventos caben en la vista actual del mapa.
const dispatchMapViewport = () => {
	const bounds = map.getBounds();
	document.dispatchEvent(new CustomEvent("map-viewport-changed", {
		detail: {
			bounds: {
				south: bounds.getSouth(),
				west: bounds.getWest(),
				north: bounds.getNorth(),
				east: bounds.getEast()
			}
		}
	}));
};
map.on("moveend", dispatchMapViewport);

// Desplaza la ubicación del navegador 500 m para no mostrar el punto exacto.
const getApproximateCoordinates = ([latitude, longitude]) => {
	const bearing = Math.random() * Math.PI * 2;
	const latitudeOffset = (500 * Math.cos(bearing)) / 111320;
	const longitudeOffset = (500 * Math.sin(bearing)) / (111320 * Math.cos((latitude * Math.PI) / 180));
	return [latitude + latitudeOffset, longitude + longitudeOffset];
};

// Solicita permiso y muestra una ubicación aproximada si está disponible.
if (navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(({ coords }) => {
		const userCoordinates = getApproximateCoordinates([coords.latitude, coords.longitude]);
		map.setView(userCoordinates, 13);
		new Marker(userCoordinates, {
			icon: new DivIcon({
				className: "map-user-location",
				html: '<span class="map-user-location__pulse" aria-hidden="true"></span><span class="map-user-location__dot" aria-hidden="true"></span>',
				iconSize: [32, 32],
				iconAnchor: [16, 16]
			}),
			title: "Tu ubicación aproximada",
			alt: "Tu ubicación aproximada",
			interactive: false,
			zIndexOffset: 1000
		}).addTo(map);
		document.dispatchEvent(new CustomEvent("user-location-found", {
			detail: { coordinates: userCoordinates }
		}));
	});
}

// Añade el mapa base de CARTO.
new TileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_4iai_1_1d3ce10022d7a760e0ece1ee', {
  maxZoom: 20,
  attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

// Limita los favoritos del mapa a la sesión activa y prepara el icono del marcador.
const getFavoriteIds = () => localStorage.getItem("momentum-authenticated") === "true"
	? JSON.parse(localStorage.getItem("momentum-favorites") || "[]")
	: [];
const favoriteHeartMarkup = '<svg class="map-event-marker__heart" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" /></svg>';
const createMapMarkerIcon = (isFavorite) => new DivIcon({
	className: "map-event-marker",
	html: `<span class="map-event-marker__pin" aria-hidden="true">${isFavorite ? favoriteHeartMarkup : ""}</span>`,
	iconSize: [36, 42],
	iconAnchor: [18, 41],
	popupAnchor: [0, -38]
});
const mapMarkers = new Map();

// Actualiza los corazones de los marcadores tras cualquier cambio de favoritos.
const syncFavoriteMarkers = () => {
	const favoriteIds = new Set(getFavoriteIds());
	mapMarkers.forEach((marker, cardId) => {
		const isFavorite = favoriteIds.has(cardId.replace("map-event-", ""));
		const pin = marker.getElement()?.querySelector(".map-event-marker__pin");
		if (pin) {
			pin.innerHTML = isFavorite ? favoriteHeartMarkup : "";
		} else {
			marker.setIcon(createMapMarkerIcon(isFavorite));
		}
		marker.getPopup().getContent().querySelector(".event-card__favorite")
			?.setAttribute("aria-pressed", String(isFavorite));
	});
};
document.addEventListener("favorites-changed", syncFavoriteMarkers);

// Crea marcadores y tarjetas emergentes para los eventos con coordenadas.
window.eventsDataReady.then((eventsData) => {
	const favoriteIds = new Set(getFavoriteIds());
	eventsData.forEach((eventData) => {
	if (!eventData.coordinates) {
		return;
	}

	const sourceCard = document.getElementById(`map-event-${eventData.id}`);
	if (!sourceCard) {
		return;
	}

	// Sincroniza la tarjeta antes de clonarla para que el popup herede el favorito.
	const isFavorite = favoriteIds.has(eventData.id);
	sourceCard.querySelector(".event-card__favorite")?.setAttribute("aria-pressed", String(isFavorite));
	const popupCard = sourceCard.cloneNode(true);
	popupCard.removeAttribute("id");
	popupCard.dataset.mapPopupSource = sourceCard.id;
	const popupCloseButton = document.createElement("button");
	popupCloseButton.className = "map-event-popup__close";
	popupCloseButton.type = "button";
	popupCloseButton.setAttribute("aria-label", `Cerrar tarjeta de ${eventData.title}`);
	popupCloseButton.innerHTML = '<span aria-hidden="true">×</span>';
	const popupVisual = popupCard.querySelector(".event-card__visual");
	const favoriteButton = popupVisual.querySelector(".event-card__favorite");
	if (favoriteButton) {
		favoriteButton.insertAdjacentElement("afterend", popupCloseButton);
	} else {
		popupVisual.append(popupCloseButton);
	}
	popupCard.addEventListener("click", (clickEvent) => {
		if (clickEvent.target.closest("button, a")) {
			return;
		}

		window.location.assign(`event-detail.html?id=${eventData.id}`);
	});

	const marker = new Marker(eventData.coordinates, {
		icon: createMapMarkerIcon(isFavorite),
		title: eventData.title,
		alt: eventData.title
	});
	marker.bindPopup(popupCard, {
		maxWidth: 300,
		minWidth: 240,
		autoPanPaddingTopLeft: [56, 80],
		pane: "eventPopupPane",
		className: "map-event-popup",
		closeButton: false
	});
	popupCloseButton.addEventListener("click", () => marker.closePopup());
	marker.addTo(map);
	mapMarkers.set(sourceCard.id, marker);
	});
	syncMapMarkersWithFilters();
	dispatchMapViewport();
});

// Refleja los filtros en el mapa y ajusta el zoom al área o radio seleccionado.
const syncMapMarkersWithFilters = (event) => {
	const visibleMarkers = [];
	mapMarkers.forEach((marker, cardId) => {
		const sourceCard = document.getElementById(cardId);
		if (!sourceCard || sourceCard.hidden) {
			marker.closePopup();
			marker.remove();
		} else if (!map.hasLayer(marker)) {
			marker.addTo(map);
		}
		if (sourceCard && !sourceCard.hidden) {
			visibleMarkers.push(marker);
		}
	});

	// Ajusta el zoom al radio elegido; sin radio, encuadra los marcadores visibles.
	if (event?.detail?.fitMap && event?.detail?.locationDistance) {
		const distanceCircle = new Circle(event.detail.locationCenter, {
			radius: Number(event.detail.locationDistance) * 1000
		}).addTo(map);
		const distanceBounds = distanceCircle.getBounds();
		distanceCircle.remove();
		const distanceZoom = map.getBoundsZoom(distanceBounds, false, [32, 32]);
		map.setView(event.detail.locationCenter, Math.min(distanceZoom + 1, 15));
		return;
	}

	if (event?.detail?.fitMap && visibleMarkers.length) {
		const coordinates = visibleMarkers.map((marker) => marker.getLatLng());
		const latitudes = coordinates.map(({ lat }) => lat);
		const longitudes = coordinates.map(({ lng }) => lng);
		const bounds = [
			[Math.min(...latitudes), Math.min(...longitudes)],
			[Math.max(...latitudes), Math.max(...longitudes)]
		];
		map.fitBounds(bounds, { padding: [32, 32], maxZoom: 13 });
	}
};

document.addEventListener("map-events-filtered", syncMapMarkersWithFilters);