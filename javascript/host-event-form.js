const hostEventForm = document.querySelector("[data-host-event-form]");
const hostEventConfirmation = document.querySelector("[data-host-event-confirmation]");
const hostEventFormHeading = document.querySelector("[data-host-event-form-heading]");
const hostEventNewButton = document.querySelector("[data-host-event-new]");
const hostEventError = document.querySelector("[data-host-event-error]");
const hostEventGuest = document.querySelector("[data-host-event-guest]");
const hostEventPrivate = document.querySelector("[data-host-event-private]");
const hostEventIsAuthenticated = localStorage.getItem("momentum-authenticated") === "true";
let hasAttemptedSubmit = false;

// Muestra la invitación o el panel de gestión según el estado de sesión.
if (hostEventGuest && hostEventPrivate) {
    hostEventGuest.hidden = hostEventIsAuthenticated;
    hostEventPrivate.hidden = !hostEventIsAuthenticated;
}

// Abre el modal de login compartido cuando una persona visitante lo solicita.
document.querySelector("[data-host-event-login]")?.addEventListener("click", () => {
    document.querySelector(".login-dialog")?.showModal();
});

// Sincroniza cada opción visual con el valor oculto que se envía al servidor.
const updateHostEventValidation = () => {
    const requiredControls = [...hostEventForm.querySelectorAll("[required]")];
    const invalidControls = requiredControls.filter((control) => !control.checkValidity());
    const invalidDropdowns = [...hostEventForm.querySelectorAll("[data-host-dropdown]")]
        .filter((dropdown) => !document.getElementById(`event-${dropdown.dataset.hostDropdown}`).value);

    requiredControls.forEach((control) => {
        if (control.checkValidity()) {
            control.removeAttribute("aria-invalid");
        } else {
            control.setAttribute("aria-invalid", "true");
        }
    });

    hostEventForm.querySelectorAll("[data-host-dropdown]").forEach((dropdown) => {
        if (invalidDropdowns.includes(dropdown)) {
            dropdown.setAttribute("aria-invalid", "true");
        } else {
            dropdown.removeAttribute("aria-invalid");
        }
    });

    const isValid = invalidControls.length === 0 && invalidDropdowns.length === 0;
    if (hasAttemptedSubmit && hostEventError) {
        hostEventError.textContent = isValid ? "" : "Faltan campos por rellenar.";
        hostEventError.hidden = isValid;
    }

    return { isValid, invalidControls, invalidDropdowns };
};

if (hostEventForm) {
    // Usa el mensaje del formulario en vez del aviso nativo del navegador.
    hostEventForm.noValidate = true;
    ["input", "change"].forEach((eventName) => {
        hostEventForm.addEventListener(eventName, () => {
            if (hasAttemptedSubmit) {
                updateHostEventValidation();
            }
        });
    });
}

document.querySelectorAll("[data-host-dropdown]").forEach((dropdown) => {
    const valueInput = document.getElementById(`event-${dropdown.dataset.hostDropdown}`);
    const selectedLabel = dropdown.querySelector("[data-host-dropdown-label]");
    const arrow = dropdown.querySelector('summary > span[aria-hidden="true"]');

    if (arrow) {
        // Mantiene el chevron sincronizado con el estado nativo del desplegable.
        arrow.style.rotate = "0deg";
        dropdown.addEventListener("toggle", () => {
            arrow.style.rotate = dropdown.open ? "180deg" : "0deg";
        });
    }

    dropdown.querySelectorAll("[data-host-option]").forEach((option) => {
        option.addEventListener("click", () => {
            valueInput.value = option.dataset.value;
            selectedLabel.textContent = option.textContent.trim();
            dropdown.querySelectorAll("[data-host-option]").forEach((item) => {
                item.setAttribute("aria-selected", String(item === option));
                item.classList.toggle("is-selected", item === option);
            });
            dropdown.open = false;
			if (hasAttemptedSubmit) {
				updateHostEventValidation();
			}
        });
    });
});

if (hostEventForm && hostEventConfirmation) {
    hostEventForm.addEventListener("submit", (event) => {
        // Muestra una confirmación de demostración sin guardar ni enviar los datos.
        event.preventDefault();
		hasAttemptedSubmit = true;
		const validation = updateHostEventValidation();
		if (!validation.isValid) {
			const firstInvalidDropdown = validation.invalidDropdowns[0];
			if (firstInvalidDropdown) {
				firstInvalidDropdown.open = true;
				firstInvalidDropdown.querySelector("summary").focus();
			} else {
				validation.invalidControls[0]?.focus();
			}
            return;
        }

        if (hostEventError) {
            hostEventError.hidden = true;
        }

        hostEventForm.hidden = true;
        hostEventFormHeading.hidden = true;
        hostEventConfirmation.hidden = false;
    });

    hostEventNewButton.addEventListener("click", () => {
        hostEventForm.reset();
        document.querySelectorAll("[data-host-dropdown]").forEach((dropdown) => {
            const valueInput = document.getElementById(`event-${dropdown.dataset.hostDropdown}`);
            const selectedLabel = dropdown.querySelector("[data-host-dropdown-label]");
            valueInput.value = "";
            selectedLabel.textContent = dropdown.dataset.hostDropdown === "category"
                ? "Selecciona una categoría"
                : "Selecciona un formato";
            dropdown.removeAttribute("aria-invalid");
            dropdown.querySelectorAll("[data-host-option]").forEach((option) => {
                option.setAttribute("aria-selected", "false");
                option.classList.remove("is-selected");
            });
        });

        hasAttemptedSubmit = false;
        hostEventError.hidden = true;
        hostEventForm.hidden = false;
        hostEventFormHeading.hidden = false;
        hostEventConfirmation.hidden = true;
        hostEventForm.querySelector("#event-title").focus();
    });
}
