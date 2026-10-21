// Expone una función común para abrir el diálogo desde otras interacciones.
const openLoginDialog = () => document.querySelector(".login-dialog")?.showModal();

// Crea el formulario modal solo cuando la persona todavía no ha iniciado sesión.
if (localStorage.getItem("momentum-authenticated") !== "true") {
	document.body.insertAdjacentHTML(
		"beforeend",
		`<dialog class="login-card login-dialog" aria-labelledby="login-dialog-title">
			<button class="login-dialog__close" type="button" aria-label="Cerrar inicio de sesión" data-login-dialog-close>×</button>
			<div class="login-card__heading">
				<h2 class="login-card__title" id="login-dialog-title">Iniciar sesión</h2>
				<p class="login-card__description">Ingresa con cualquier correo y contraseña para iniciar sesión.</p>
			</div>
			<form class="login-form" data-login-stay novalidate>
				<div class="login-field">
					<label class="login-field__label" for="login-dialog-email">Correo electrónico</label>
					<input class="login-field__input" id="login-dialog-email" name="email" type="email" placeholder="tu@email.com" autocomplete="email" required>
				</div>
				<div class="login-field">
					<label class="login-field__label" for="login-dialog-password">Contraseña</label>
					<div class="login-field__control">
						<input class="login-field__input" id="login-dialog-password" name="password" type="password" placeholder="Ingresa tu contraseña" autocomplete="current-password" required>
						<button class="login-field__visibility" type="button" aria-controls="login-dialog-password" aria-label="Show password" aria-pressed="false">
							<img src="assets/eye-icon.svg" alt="">
						</button>
					</div>
				</div>
				<p class="login-card__description" data-login-error role="alert" hidden></p>
				<button class="login-form__submit" type="submit">Iniciar sesión</button>
			</form>
		</dialog>`
	);

	// Conecta el cierre manual, el clic fuera y la limpieza de acciones pendientes.
	const loginDialog = document.querySelector(".login-dialog");
	loginDialog.querySelector("[data-login-dialog-close]").addEventListener("click", () => loginDialog.close());
	loginDialog.addEventListener("close", () => {
		if (localStorage.getItem("momentum-authenticated") !== "true") {
			sessionStorage.removeItem("momentum-pending-favorite");
			sessionStorage.removeItem("momentum-pending-favorite-top");
			sessionStorage.removeItem("momentum-pending-favorite-left");
		}
	});
	loginDialog.addEventListener("click", (event) => {
		if (event.target === loginDialog) {
			loginDialog.close();
		}
	});
}
