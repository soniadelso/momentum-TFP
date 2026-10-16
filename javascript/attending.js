const attendingGroups = document.querySelector("[data-attending-groups]");
const attendingEmpty = document.querySelector("[data-attending-empty]");
const attendingCount = document.querySelector("[data-attending-count]");

window.eventsDataReady.then((eventsData) => {
	const eventIds = new Set(eventsData.map((item) => item.id));
	const syncAttendingProfile = () => {
		const attendingIds = window.getAttendingIds?.() || [];
		if (attendingCount) {
			attendingCount.textContent = String(attendingIds.filter((id) => eventIds.has(id)).length);
		}
		if (!attendingGroups) {
			return;
		}

		const attendingEvents = attendingIds
			.map((id) => eventsData.find((item) => item.id === id))
			.filter(Boolean);
		const eventsByDay = Map.groupBy(attendingEvents, (item) => item.date.split(" · ")[0]);
		attendingGroups.innerHTML = [...eventsByDay]
			.map(
				([day, items]) => `
					<section class="attending__group" aria-label="${day}">
						<div class="attending__date-heading">
							<h3 class="attending__date">${day}</h3>
							<div class="attending__rule" aria-hidden="true"></div>
						</div>
						<div class="events__grid">${items.map(window.eventCardMarkup).join("")}</div>
					</section>`
			)
			.join("");
		if (attendingEmpty) {
			attendingEmpty.hidden = attendingEvents.length > 0;
		}
	};
	syncAttendingProfile();
	if (attendingGroups) {
		document.dispatchEvent(new Event("attending-changed"));
	}
	document.addEventListener("attending-changed", syncAttendingProfile);
	window.addEventListener("storage", (event) => {
		if (event.key === "momentum-attending") {
			syncAttendingProfile();
		}
	});
});
