document.querySelectorAll(".explore-filters__group").forEach((group) => {
    let startX = 0;
    let startScrollLeft = 0;
    let isDragging = false;
    let didDrag = false;

    const preventClickAfterDrag = (event) => {
        event.preventDefault();
        event.stopPropagation();
    };

    group.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "touch" || event.button !== 0 || event.target.closest(".map-filter-trigger, select, .explore-filters__facet-dropdown")) {
            return;
        }

        startX = event.clientX;
        startScrollLeft = group.scrollLeft;
        isDragging = true;
        didDrag = false;
    });

    group.addEventListener("pointermove", (event) => {
        if (!isDragging) {
            return;
        }

        const distance = event.clientX - startX;
        if (Math.abs(distance) > 4) {
            // Capture only once dragging starts, otherwise clicks get retargeted away from the buttons.
            if (!didDrag) {
                group.setPointerCapture(event.pointerId);
            }

            didDrag = true;
            group.style.cursor = "grabbing";
            group.scrollLeft = startScrollLeft - distance;
        }
    });

    const stopDragging = (event) => {
        if (!isDragging) {
            return;
        }

        isDragging = false;
        group.style.cursor = "";
        if (group.hasPointerCapture(event.pointerId)) {
            group.releasePointerCapture(event.pointerId);
        }

        if (didDrag) {
            group.addEventListener("click", preventClickAfterDrag, { capture: true, once: true });
            setTimeout(() => {
                group.removeEventListener("click", preventClickAfterDrag, true);
            }, 0);
        }
    };

    group.addEventListener("pointerup", stopDragging);
    group.addEventListener("pointercancel", stopDragging);
});