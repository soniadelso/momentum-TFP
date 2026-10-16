const attendingGroups = document.querySelector("[data-attending-groups]");
const attendingEmpty = document.querySelector("[data-attending-empty]");

window.eventsDataReady.then((eventsData) => {
	if (attendingGroups) {
		const attendingEvents = window.getAttendingIds()
			.map((id) => eventsData.find((item) => item.id === id))
			.filter(Boolean);
		const eventsByDay = Map.groupBy(attendingEvents, (item) => item.date.split(" · ")[0]);

		attendingGroups.innerHTML = [...eventsByDay]
			.map(
				([day, items]) => `
					<section class="attending__group" aria-label="${day}">
						<div class="attending__date-heading">
							<h2 class="attending__date">${day}</h2>
							<div class="attending__rule" aria-hidden="true"></div>
						</div>
						<div class="events__grid">${items.map(window.eventCardMarkup).join("")}</div>
					</section>`
			)
			.join("");
		attendingEmpty.hidden = attendingEvents.length > 0;
		document.dispatchEvent(new Event("attending-changed"));
	}
});
