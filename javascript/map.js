
import { DivIcon, LeafletMap, Marker, TileLayer } from "leaflet";

const map = new LeafletMap("map").setView([41.3874, 2.1686], 13);
new TileLayer('https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_4iai_1_1d3ce10022d7a760e0ece1ee', {
  maxZoom: 20,
  attribution: '&copy; OpenStreetMap &copy; CARTO'
}).addTo(map);

const mapMarkerIcon = new DivIcon({
	className: "map-event-marker",
	html: '<span class="map-event-marker__pin" aria-hidden="true"></span>',
	iconSize: [36, 42],
	iconAnchor: [18, 41],
	popupAnchor: [0, -38]
	});

const mapMarkers = new Map();

window.eventsDataReady.then((eventsData) => {
	eventsData.forEach((eventData) => {
	if (!eventData.coordinates) {
		return;
	}

	const sourceCard = document.getElementById(`map-event-${eventData.id}`);
	if (!sourceCard) {
		return;
	}

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
		icon: mapMarkerIcon,
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

const syncMapMarkersWithFilters = () => {
	mapMarkers.forEach((marker, cardId) => {
		const sourceCard = document.getElementById(cardId);
		if (!sourceCard || sourceCard.hidden) {
			marker.closePopup();
			marker.remove();
		} else if (!map.hasLayer(marker)) {
			marker.addTo(map);
		}
	});
};

document.addEventListener("map-events-filtered", syncMapMarkersWithFilters);