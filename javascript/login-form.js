// Conecta cada botón de visibilidad con su propio campo de contraseña.
document.querySelectorAll(".login-field__visibility").forEach((passwordToggle) => {
    const passwordInput = document.getElementById(passwordToggle.getAttribute("aria-controls"));
    const passwordIcon = passwordToggle.querySelector("img");

    passwordToggle.addEventListener("click", () => {
        const showPassword = passwordInput.type === "password";

        passwordInput.type = showPassword ? "text" : "password";
        passwordIcon.src = showPassword ? "assets/icon-eye-closed.svg" : "assets/eye-icon.svg";
        passwordToggle.setAttribute("aria-pressed", String(showPassword));
        passwordToggle.setAttribute("aria-label", showPassword ? "Hide password" : "Show password");
    });
});

// Valida el formulario de acceso y deja intacto el envío del formulario Host Event.
document.querySelectorAll('.login-form:not([data-host-event-form])').forEach((loginForm) => {
    const errorMessage = loginForm.querySelector("[data-login-error]");
    const requiredFields = [...loginForm.querySelectorAll("[required]")];
    let hasAttemptedSubmit = false;

    const updateLoginValidation = () => {
        const invalidFields = requiredFields.filter((field) => !field.checkValidity());
        requiredFields.forEach((field) => {
            if (field.checkValidity()) {
                field.removeAttribute("aria-invalid");
            } else {
                field.setAttribute("aria-invalid", "true");
            }
        });

        if (errorMessage && hasAttemptedSubmit) {
            errorMessage.textContent = invalidFields.length ? "Faltan campos por rellenar." : "";
            errorMessage.hidden = invalidFields.length === 0;
        }

        return invalidFields;
    };

    loginForm.noValidate = true;
    ["input", "change"].forEach((eventName) => {
        loginForm.addEventListener(eventName, () => {
            if (hasAttemptedSubmit) {
                updateLoginValidation();
            }
        });
    });

    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        hasAttemptedSubmit = true;
        const invalidFields = updateLoginValidation();
        if (invalidFields.length) {
            invalidFields[0].focus();
            return;
        }

        localStorage.setItem("momentum-authenticated", "true");
        document.dispatchEvent(new Event("momentum-login-success"));
        const currentPage = window.location.pathname.split("/").pop() || "index.html";
        if (currentPage === "index.html") {
            loginForm.closest("dialog")?.close();
            return;
        }
        const shouldStayOnPage = loginForm.hasAttribute("data-login-stay") && currentPage !== "index.html";
        window.location.assign(shouldStayOnPage ? window.location.href : "index.html");
    });
});