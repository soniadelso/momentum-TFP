const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
    const contactHeading = document.querySelector("[data-contact-heading]");
    const contactConfirmation = document.querySelector("[data-contact-confirmation]");
    const contactError = contactForm.querySelector("[data-contact-error]");
    const requiredFields = [...contactForm.querySelectorAll("[required]")];
    let hasAttemptedSubmit = false;

    // Valida los campos obligatorios y marca los que necesitan corregirse.
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

    contactForm.noValidate = true;
    ["input", "change"].forEach((eventName) => {
        contactForm.addEventListener(eventName, () => {
            if (hasAttemptedSubmit) {
                updateContactValidation();
            }
        });
    });

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
