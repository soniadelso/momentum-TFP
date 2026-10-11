const passwordToggle = document.querySelector(".login-field__visibility");

if (passwordToggle) {
    const passwordInput = document.getElementById("login-password");
    const passwordIcon = passwordToggle.querySelector("img");

    passwordToggle.addEventListener("click", () => {
        const showPassword = passwordInput.type === "password";

        passwordInput.type = showPassword ? "text" : "password";
        passwordIcon.src = showPassword ? "assets/icon-eye-closed.svg" : "assets/eye-icon.svg";
        passwordToggle.setAttribute("aria-pressed", String(showPassword));
        passwordToggle.setAttribute("aria-label", showPassword ? "Hide password" : "Show password");
    });
}

const loginForm = document.querySelector(".login-form");

if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
        event.preventDefault();
        localStorage.setItem("momentum-authenticated", "true");
        window.location.assign("index-logged-in.html");
    });
}