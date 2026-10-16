
import { Circle, CircleMarker, DivIcon, LeafletMap, Marker, TileLayer } from "leaflet";

const map = new LeafletMap("map", { zoomSnap: 0.25 }).setView([41.3874, 2.1686], 13);
const mapColors = getComputedStyle(document.documentElement);
let userLocationMarker;
// Solicita la ubicación y centra el mapa en ella si el usuario da permiso.
if (navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(({ coords }) => {
		const userCoordinates = [coords.latitude, coords.longitude];
		map.setView(userCoordinates, 13);
		userLocationMarker = new CircleMarker(userCoordinates, {
			radius: 8,
			color: mapColors.getPropertyValue("--color-text-primary").trim(),
			weight: 3,
			fillColor: mapColors.getPropertyValue("--color-accent").trim(),
			fillOpacity: 1,
			interactive: false
		}).addTo(map);
		document.dispatchEvent(new CustomEvent("user-location-found", {
			detail: { coordinates: userCoordinates }
		}));
	});
}

new TileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_4iai_1_1d3ce10022d7a760e0ece1ee', {
  maxZoom: 20,
  attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

const getFavoriteIds = () => localStorage.getItem("momentum-authenticated") === "true"
	? JSON.parse(localStorage.getItem("momentum-favorites") || "[]")
	: [];
const createMapMarkerIcon = (isFavorite) => new DivIcon({
	className: "map-event-marker",
	html: `<span class="map-event-marker__pin" aria-hidden="true">${isFavorite ? '<svg class="map-event-marker__heart" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" /></svg>' : ""}</span>`,
	iconSize: [36, 42],
	iconAnchor: [18, 41],
	popupAnchor: [0, -38]
});
const mapMarkers = new Map();

// Actualiza los iconos de los pines cuando cambia el estado de favoritos.
const syncFavoriteMarkers = () => {
	const favoriteIds = new Set(getFavoriteIds());
	mapMarkers.forEach((marker, cardId) => {
		const isFavorite = favoriteIds.has(cardId.replace("map-event-", ""));
		marker.setIcon(createMapMarkerIcon(isFavorite));
		marker.getPopup().getContent().querySelector(".event-card__favorite")
			?.setAttribute("aria-pressed", String(isFavorite));
	});
};
document.addEventListener("favorites-changed", syncFavoriteMarkers);

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

	const marker = new Marker(eventData.coordinates, {
		icon: createMapMarkerIcon(isFavorite),
		title: eventData.title,
		alt: eventData.title
	});
	marker.bindPopup(popupCard, {
		maxWidth: 300,
		minWidth: 240,
		className: "map-event-popup",
		closeButton: false
	});
	popupCloseButton.addEventListener("click", () => marker.closePopup());
	marker.addTo(map);
	mapMarkers.set(sourceCard.id, marker);
	});
	syncMapMarkersWithFilters();
});

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
	if (event?.detail?.locationDistance) {
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