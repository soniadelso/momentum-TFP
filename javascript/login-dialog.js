const openLoginDialog = () => document.querySelector(".login-dialog")?.showModal();

if (localStorage.getItem("momentum-authenticated") !== "true") {
	document.body.insertAdjacentHTML(
		"beforeend",
		`<dialog class="login-card login-dialog" aria-labelledby="login-dialog-title">
			<button class="login-dialog__close" type="button" aria-label="Cerrar inicio de sesión" data-login-dialog-close>×</button>
			<div class="login-card__heading">
				<h2 class="login-card__title" id="login-dialog-title">Iniciar sesión</h2>
				<p class="login-card__description">Ingresa con cualquier correo y contraseña para iniciar sesión.</p>
			</div>
			<form class="login-form" data-login-stay>
				<div class="login-field">
					<label class="login-field__label" for="login-email">Correo electrónico</label>
					<input class="login-field__input" id="login-email" name="email" type="email" placeholder="tu@email.com" autocomplete="email" required>
				</div>
				<div class="login-field">
					<label class="login-field__label" for="login-password">Contraseña</label>
					<div class="login-field__control">
						<input class="login-field__input" id="login-password" name="password" type="password" placeholder="Ingresa tu contraseña" autocomplete="current-password" required>
						<button class="login-field__visibility" type="button" aria-controls="login-password" aria-label="Show password" aria-pressed="false">
							<img src="assets/eye-icon.svg" alt="">
						</button>
					</div>
				</div>
				<button class="login-form__submit" type="submit">Iniciar sesión</button>
			</form>
		</dialog>`
	);

	const loginDialog = document.querySelector(".login-dialog");
	loginDialog.querySelector("[data-login-dialog-close]").addEventListener("click", () => loginDialog.close());
	loginDialog.addEventListener("click", (event) => {
		if (event.target === loginDialog) {
			loginDialog.close();
		}
	});
}
