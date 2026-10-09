document.querySelectorAll(".header__menu").forEach((menu) => {
    const toggle = menu.querySelector(".header__menu-toggle");
    const nav = menu.querySelector(".header__nav");
    const originalBodyOverflow = document.body.style.overflow;

    const setExpanded = (expanded) => {
        toggle.setAttribute("aria-expanded", String(expanded));
        toggle.setAttribute("aria-label", expanded ? "Close navigation menu" : "Open navigation menu");
        document.body.style.overflow = expanded ? "hidden" : originalBodyOverflow;
    };

    toggle.addEventListener("click", () => {
        setExpanded(toggle.getAttribute("aria-expanded") !== "true");
    });

    nav.addEventListener("click", (event) => {
        if (event.target === nav || event.target.closest("a")) {
            setExpanded(false);
        }
    });

    document.addEventListener("click", (event) => {
        if (!menu.contains(event.target)) {
            setExpanded(false);
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
            setExpanded(false);
            toggle.focus();
        }
    });

    window.addEventListener("resize", () => {
        if (window.matchMedia("(min-width: 701px)").matches) {
            setExpanded(false);
        }
    });
});