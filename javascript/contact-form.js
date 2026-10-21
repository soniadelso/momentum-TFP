// Conecta la validación y confirmación únicamente si esta página tiene el formulario.
const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
    const contactHeading = document.querySelector("[data-contact-heading]");
    const contactConfirmation = document.querySelector("[data-contact-confirmation]");
    const contactError = contactForm.querySelector("[data-contact-error]");
    const requiredFields = [...contactForm.querySelectorAll("[required]")];
    let hasAttemptedSubmit = false;

    // Marca errores, actualiza el mensaje accesible y devuelve los campos inválidos.
    const updateContactValidation = () => {
        const invalidFields = requiredFields.filter((field) => !field.checkValidity());
        requiredFields.forEach((field) => {
            if (field.checkValidity()) {
                field.removeAttribute("aria-invalid");
            } else {
                field.setAttribute("aria-invalid", "true");
            }
        });

        if (contactError && hasAttemptedSubmit) {
            contactError.textContent = invalidFields.length
                ? "Faltan campos por rellenar."
                : "";
            contactError.hidden = invalidFields.length === 0;
        }

        return invalidFields;
    };

    // Desactiva los avisos nativos para mostrar el mismo error que el resto del sitio.
    contactForm.noValidate = true;
    ["input", "change"].forEach((eventName) => {
        contactForm.addEventListener(eventName, () => {
            if (hasAttemptedSubmit) {
                updateContactValidation();
            }
        });
    });

    // Evita un envío ficticio y cambia el formulario por el mensaje de confirmación.
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();
        hasAttemptedSubmit = true;
        const invalidFields = updateContactValidation();
        if (invalidFields.length) {
            invalidFields[0].focus();
            return;
        }

        // Explica que el formulario es una demostración sin envío a un servidor.
        contactForm.hidden = true;
        contactHeading.hidden = true;
        contactConfirmation.hidden = false;
    });
}
