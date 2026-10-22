// Obtiene el identificador del evento solicitado en la URL.
const eventId = new URLSearchParams(window.location.search).get("id");

// Rellena la ficha cuando el catálogo de eventos termina de cargar.
window.eventsDataReady.then((eventsData) => {
	const currentEvent = eventsData.find((item) => item.id === eventId);

	if (!currentEvent) {
		window.location.replace("explorar.html");
		return;
	}

	// Prepara los datos de la ficha y los elementos compartidos del evento.
	const avatarCount = 14;
	const eventIndex = eventsData.indexOf(currentEvent);
	const memberAvatars = Array.from({ length: 6 }, (_, i) => `assets/${((eventIndex * 3 + i) % avatarCount) + 1}avatar.jpg`);
	const setText = (selector, value) => {
		document.querySelector(selector).textContent = value;
	};

	document.title = `momentum | ${currentEvent.title}`;
	setText("[data-event-title]", currentEvent.title);
	setText("[data-event-category]", currentEvent.category);
	setText("[data-event-price]", currentEvent.price);
	setText("[data-event-date]", currentEvent.date);
	setText("[data-event-location]", currentEvent.location);
	setText("[data-event-organizer]", currentEvent.organizer);
	setText("[data-event-members]", `${currentEvent.members} miembros`);

	const image = document.querySelector("[data-event-image]");
	image.src = currentEvent.image;
	image.alt = currentEvent.imageAlt;

	const favoriteButton = document.querySelector("[data-event-favorite]");
	favoriteButton.dataset.eventId = currentEvent.id;
	favoriteButton.setAttribute("aria-label", `Añadir ${currentEvent.title} a favoritos`);
	document.querySelector("[data-event-description]").replaceChildren(
		...currentEvent.description.map((text) => {
			const paragraph = document.createElement("p");
			paragraph.textContent = text;
			return paragraph;
		})
	);
	document.querySelector("[data-event-avatars]").replaceChildren(
		...memberAvatars.map((src) => {
			const avatar = document.createElement("span");
			avatar.className = "header__profile";
			avatar.innerHTML = `<img src="${src}" alt="">`;
			return avatar;
		})
	);
	const moreAvatars = document.createElement("span");
	moreAvatars.className = "event-detail__more";
	moreAvatars.textContent = "+";
	document.querySelector("[data-event-avatars]").append(moreAvatars);

	// Carga Leaflet solo si el evento dispone de coordenadas.
	const mapElement = document.querySelector("#event-map");
	if (mapElement && currentEvent.coordinates) {
		const leafletModule = "leaflet";
		import(/* @vite-ignore */ leafletModule).then(({ DivIcon, LeafletMap, Marker, TileLayer }) => {
			const eventMap = new LeafletMap(mapElement).setView(currentEvent.coordinates, 16);
			new TileLayer("https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_4iai_1_1d3ce10022d7a760e0ece1ee", {
				maxZoom: 20,
				attribution: "&copy; OpenStreetMap &copy; CARTO"
			}).addTo(eventMap);

			const eventIcon = new DivIcon({
				className: "map-event-marker",
				html: '<span class="map-event-marker__pin" aria-hidden="true"></span>',
				iconSize: [36, 42],
				iconAnchor: [18, 41]
			});
			new Marker(currentEvent.coordinates, {
				icon: eventIcon,
				title: currentEvent.title,
				alt: currentEvent.title
			}).addTo(eventMap);
		}).catch((error) => console.error("Could not load the event map.", error));
	}

	// Muestra eventos relacionados y actualiza el estado de asistencia compartido.
	document.querySelector("[data-related-grid]").innerHTML = eventsData
		.filter((item) => item.id !== currentEvent.id)
		.slice(0, 4)
		.map(window.eventCardMarkup)
		.join("");
	document.dispatchEvent(new Event("attending-changed"));

	// Sincroniza el botón «Asistir» y guarda los cambios en la sesión activa.
	const attendButton = document.querySelector("[data-event-attend]");
	const renderAttendButton = () => {
		const isAttending = localStorage.getItem(authStorageKey) === "true" && window.getAttendingIds().includes(currentEvent.id);
		attendButton.textContent = isAttending ? "Cancelar asistencia" : "Asistir";
		attendButton.classList.toggle("button--secondary", !isAttending);
		attendButton.classList.toggle("button--secondary-outline", isAttending);
		attendButton.setAttribute("aria-pressed", String(isAttending));
	};

	attendButton.addEventListener("click", () => {
		if (localStorage.getItem(authStorageKey) !== "true") {
			openLoginDialog();
			return;
		}

		const ids = window.getAttendingIds();
		window.setAttendingIds(ids.includes(currentEvent.id) ? ids.filter((id) => id !== currentEvent.id) : [...ids, currentEvent.id]);
		renderAttendButton();
		document.dispatchEvent(new Event("attending-changed"));
	});
	renderAttendButton();
});
