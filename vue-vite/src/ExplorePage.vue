<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import events from "../../events.json";
import filterIcon from "../../assets/filters-icon.svg";
import eventAccessibilityImage from "../../assets/event-accessibility.png";
import eventAfterEffectsImage from "../../assets/event-after-effects.png";
import eventArtDirectionImage from "../../assets/event-art-direction.png";
import eventInterviewsImage from "../../assets/event-interviews.png";
import eventNetworkingImage from "../../assets/event-networking.png";
import eventTypographyImage from "../../assets/event-typography.png";
import aiWorkshopsImage from "../../assets/ai-workshops.jpg";
import illustrationImage from "../../assets/ilustracion-digital.jpg";
import uxuiTalksImage from "../../assets/uxui-talks.jpg";

// Relaciona cada ruta del JSON con el archivo que Vite incluirá en el build.
const eventImages = {
	"assets/event-accessibility.png": eventAccessibilityImage,
	"assets/event-after-effects.png": eventAfterEffectsImage,
	"assets/event-art-direction.png": eventArtDirectionImage,
	"assets/event-interviews.png": eventInterviewsImage,
	"assets/event-networking.png": eventNetworkingImage,
	"assets/event-typography.png": eventTypographyImage,
	"assets/ai-workshops.jpg": aiWorkshopsImage,
	"assets/ilustracion-digital.jpg": illustrationImage,
	"assets/uxui-talks.jpg": uxuiTalksImage
};

const categoryTranslations = {
	"Digital Product": "Diseño de producto",
	"Brand & Graphic": "Diseño gráfico",
	"Industrial Design": "Diseño industrial",
	"Media & Motion": "Audiovisual y animación"
};
const categories = [...new Set(events.map((eventItem) => eventItem.category).filter(Boolean))];
const filters = [
	{ key: "format", label: "Formato", options: [["", "Todos"], ["presencial", "Presencial"], ["online", "Online"]] },
	{ key: "date", label: "Fechas", options: [["", "Cualquier fecha"], ["today", "Hoy"], ["week", "Esta semana"], ["month", "Este mes"]] },
	{ key: "location", label: "Ubicación", options: [["", "Cualquier distancia"], ["1", "Cerca de mí"], ["3", "3 km"], ["5", "5 km"], ["10", "10 km"], ["25", "25 km"], ["50", "50 km"], ["100", "100 km"], ["150", "150 km"]] },
	{ key: "price", label: "Precio", options: [["", "Cualquier precio"], ["free", "Gratuito"], ["paid", "De pago"]] }
];

// Lee búsqueda y categorías que llegan desde enlaces como index.html?category=...
const pageParameters = new URLSearchParams(window.location.search);
const query = ref(pageParameters.get("q") || "");
const selectedCategories = ref(new Set(pageParameters.getAll("category")));
const filterValues = reactive({ format: "", date: "", location: "", price: "" });
const locationCenter = ref(null);
const locationError = ref("");
const filterDialog = ref(null);
const searchInput = ref(null);
const favoriteIds = ref(new Set());
const activeFilterCount = computed(() => selectedCategories.value.size + Object.values(filterValues).filter(Boolean).length);
const sectionTitle = computed(() => pageParameters.get("title") || (query.value ? `Explorar ${query.value.toLocaleLowerCase("es")}` : "Explorar"));

const normalizeText = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es");

// Calcula distancias para que Ubicación pueda filtrar eventos alrededor de la persona.
const distanceInKilometers = (first, second) => {
	const radians = (degrees) => degrees * Math.PI / 180;
	const latitudeDelta = radians(second[0] - first[0]);
	const longitudeDelta = radians(second[1] - first[1]);
	const value = Math.sin(latitudeDelta / 2) ** 2
		+ Math.cos(radians(first[0])) * Math.cos(radians(second[0])) * Math.sin(longitudeDelta / 2) ** 2;
	return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const matchesDateRange = (startsAt, range) => {
	const eventDate = new Date(startsAt);
	if (Number.isNaN(eventDate.getTime())) return false;

	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const tomorrow = new Date(today);
	tomorrow.setDate(tomorrow.getDate() + 1);
	if (range === "today") return eventDate >= today && eventDate < tomorrow;
	if (range === "week") {
		const monday = new Date(today);
		monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
		const nextMonday = new Date(monday);
		nextMonday.setDate(nextMonday.getDate() + 7);
		return eventDate >= monday && eventDate < nextMonday;
	}
	if (range === "month") return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
	return true;
};

// Vue vuelve a calcular esta lista cuando cambia la búsqueda o cualquier filtro.
const visibleEvents = computed(() => {
	const terms = normalizeText(query.value).split(/\s+/).filter(Boolean);
	return events.filter((eventItem) => {
		const searchableText = normalizeText([
			eventItem.title,
			...(eventItem.aliases || []),
			eventItem.category,
			categoryTranslations[eventItem.category],
			...(eventItem.keywords || []),
			eventItem.city,
			eventItem.autonomousCommunity,
			eventItem.country,
			eventItem.organizer,
			eventItem.location
		].filter(Boolean).join(" "));

		if (terms.some((term) => !searchableText.includes(term))) return false;
		if (selectedCategories.value.size && !selectedCategories.value.has(eventItem.category)) return false;
		if (filterValues.format && eventItem.format !== filterValues.format) return false;
		if (filterValues.date && !matchesDateRange(eventItem.startsAt, filterValues.date)) return false;
		if (filterValues.location && (!locationCenter.value || !eventItem.coordinates
			|| distanceInKilometers(locationCenter.value, eventItem.coordinates) > Number(filterValues.location))) return false;
		if (filterValues.price === "free" && eventItem.priceAmount !== 0) return false;
		if (filterValues.price === "paid" && eventItem.priceAmount <= 0) return false;
		return true;
	});
});

const toggleCategory = (category) => {
	const nextCategories = new Set(selectedCategories.value);
	nextCategories.has(category) ? nextCategories.delete(category) : nextCategories.add(category);
	selectedCategories.value = nextCategories;
};

// Pide permiso de ubicación solo si se elige un filtro de distancia.
const selectFilter = (key, value, event) => {
	event?.currentTarget.closest("details")?.removeAttribute("open");
	if (key !== "location" || !value) {
		filterValues[key] = value;
		if (key === "location") locationCenter.value = null;
		locationError.value = "";
		return;
	}

	if (!navigator.geolocation) {
		locationError.value = "Este navegador no permite acceder a la ubicación.";
		return;
	}

	navigator.geolocation.getCurrentPosition(({ coords }) => {
		locationCenter.value = [coords.latitude, coords.longitude];
		filterValues.location = value;
		locationError.value = "";
	}, () => {
		locationError.value = "No se pudo acceder a tu ubicación. Revisa los permisos del navegador.";
	}, { maximumAge: 300000, timeout: 10000 });
};

const clearFilters = () => {
	selectedCategories.value = new Set();
	Object.keys(filterValues).forEach((key) => { filterValues[key] = ""; });
	locationCenter.value = null;
	locationError.value = "";
};

const syncSearchQuery = () => {
	query.value = searchInput.value?.value || "";
};
const syncFavorites = () => {
	const storedIds = localStorage.getItem("momentum-authenticated") === "true"
		? JSON.parse(localStorage.getItem("momentum-favorites") || "[]")
		: [];
	favoriteIds.value = new Set(storedIds);
};

// Los scripts existentes escuchan estos eventos para actualizar favoritos y asistencia.
watch(visibleEvents, () => {
	nextTick(() => document.dispatchEvent(new Event("attending-changed")));
}, { flush: "post" });

onMounted(() => {
	searchInput.value = document.querySelector("#event-search");
	searchInput.value?.addEventListener("input", syncSearchQuery);
	if (searchInput.value) query.value = searchInput.value.value || query.value;

	syncFavorites();
	document.addEventListener("favorites-changed", syncFavorites);
	document.addEventListener("momentum-login-success", syncFavorites);
	document.dispatchEvent(new Event("attending-changed"));
});
onUnmounted(() => {
	searchInput.value?.removeEventListener("input", syncSearchQuery);
	document.removeEventListener("favorites-changed", syncFavorites);
	document.removeEventListener("momentum-login-success", syncFavorites);
});
</script>

<template>
	<section class="explore-filters section" aria-label="Filtros de eventos">
		<div class="explore-filters__discipline-wrap">
			<div class="explore-filters__group" role="group" aria-label="Disciplina">
				<button class="button" :class="selectedCategories.size ? 'button--secondary-outline' : 'button--secondary'" type="button" :aria-pressed="String(selectedCategories.size === 0)" @click="selectedCategories = new Set()">Todos</button>
				<button v-for="category in categories" :key="category" class="button" :class="selectedCategories.has(category) ? 'button--secondary' : 'button--secondary-outline'" type="button" :aria-pressed="String(selectedCategories.has(category))" @click="toggleCategory(category)">{{ category }}</button>
			</div>
			<button class="button button--secondary map-filter-trigger" type="button" :aria-label="activeFilterCount ? `Abrir filtros, ${activeFilterCount} activos` : 'Abrir filtros'" aria-haspopup="dialog" @click="filterDialog?.showModal()">
				<img class="map-filter-trigger__icon" :src="filterIcon" alt="">
				<span class="map-filter-trigger__count" :hidden="activeFilterCount === 0">{{ activeFilterCount }}</span>
			</button>
		</div>
		<div class="explore-filters__group explore-filters__group--facets" role="group" aria-label="Más filtros">
			<details v-for="filter in filters" :key="filter.key" class="explore-filters__facet-dropdown">
				<summary class="button button--filter-outline explore-filters__facet"><span>{{ filter.label }}</span><span>{{ filterValues[filter.key] ? `: ${filter.options.find(([value]) => value === filterValues[filter.key])?.[1]}` : "" }}</span><span aria-hidden="true">▾</span></summary>
				<div class="explore-filters__facet-menu" role="listbox" :aria-label="filter.label">
					<button v-for="option in filter.options" :key="option[0]" type="button" role="option" :aria-selected="String(filterValues[filter.key] === option[0])" @click="selectFilter(filter.key, option[0], $event)">{{ option[1] }}</button>
				</div>
			</details>
		</div>
		<p v-if="locationError" class="login-card__description" role="alert">{{ locationError }}</p>
		<dialog ref="filterDialog" class="map-filter-sheet" aria-labelledby="vue-filter-title">
			<div class="map-filter-sheet__header"><h2 id="vue-filter-title">Filtros</h2><button class="map-filter-sheet__close" type="button" aria-label="Cerrar filtros" @click="filterDialog?.close()">×</button></div>
			<form method="dialog" class="map-filter-sheet__form">
				<div class="map-filter-sheet__fields">
					<details v-for="filter in filters" :key="filter.key" class="explore-filters__facet-dropdown map-filter-sheet__facet-dropdown">
						<summary><span>{{ filter.label }}</span><span>{{ filterValues[filter.key] ? `: ${filter.options.find(([value]) => value === filterValues[filter.key])?.[1]}` : "" }}</span><span aria-hidden="true">▾</span></summary>
						<div class="explore-filters__facet-menu" role="listbox" :aria-label="filter.label">
							<button v-for="option in filter.options" :key="option[0]" type="button" role="option" :aria-selected="String(filterValues[filter.key] === option[0])" @click="selectFilter(filter.key, option[0], $event)">{{ option[1] }}</button>
						</div>
					</details>
				</div>
				<div class="map-filter-sheet__actions"><button class="header__link header__link--button" type="button" @click="clearFilters">Limpiar</button><button class="button button--primary" type="submit">Listo</button></div>
			</form>
		</dialog>
	</section>

	<section class="events section" id="interests" aria-label="Según tus intereses">
		<div class="section__heading"><h1 class="section__title">{{ sectionTitle }}</h1></div>
		<div v-if="visibleEvents.length" class="events__grid">
			<article v-for="eventItem in visibleEvents" :key="eventItem.id" class="event-card" :data-event-id="eventItem.id">
				<div class="event-card__visual">
					<img class="event-card__image" :src="eventImages[eventItem.image]" :alt="eventItem.imageAlt" loading="lazy">
					<span class="event-card__category">{{ eventItem.category }}</span>
					<button class="event-card__favorite" type="button" :data-event-id="eventItem.id" :aria-label="`${favoriteIds.has(eventItem.id) ? 'Quitar' : 'Añadir'} ${eventItem.title} ${favoriteIds.has(eventItem.id) ? 'de' : 'a'} favoritos`" :aria-pressed="String(favoriteIds.has(eventItem.id))"><svg class="event-card__favorite-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78Z" /></svg></button>
				</div>
				<div class="event-card__details">
					<h2 class="event-card__title"><a :href="`event-detail.html?id=${eventItem.id}`">{{ eventItem.title }}</a></h2>
					<div class="event-card__meta"><span>{{ eventItem.date }}</span><span class="event-card__price">{{ eventItem.price }}</span></div>
					<p class="event-card__venue">{{ eventItem.organizer }}</p>
				</div>
			</article>
		</div>
		<p v-else role="status">No se encontraron eventos con esos criterios.</p>
	</section>
</template>
