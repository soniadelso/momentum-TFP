# Instrucciones del proyecto

## Antes de empezar a programar

- Leer este archivo y la petición actual antes de realizar cambios de código.
- Basar el trabajo en instrucciones expresas de la usuaria. No convertir suposiciones sobre el proyecto en requisitos.
- Añadir a este archivo las nuevas instrucciones explícitas para que sirvan de referencia en trabajos posteriores.

## Instrucciones recopiladas

- Crear y mantener un archivo con las instrucciones que la usuaria ha dado, y consultarlo antes de comenzar a programar.
- Reutilizar los tokens, componentes y estilos existentes del proyecto; revisar lo disponible antes de crear nuevos y evitar duplicaciones.
- Si hace falta un color, espaciado, tipografía o tamaño tipográfico que no exista en los tokens, preguntarme antes de añadirlo a `tokens.css`; solo crearlo después de mi aprobación.
- De necesitar crear un nuevo componente o estilo pregunta a la usuaria.
- No crees estilos de más, la estructura ha de ser sencilla para todos los tipos de archivo (CSS, HTML, JS,...) para que su mantenimiento sea fácil evitando romper el código.
- También quiero que por cada archivo que no sea html o css expliques o pongas comentarios de lo que estás haciendo en castellano.

## Convenciones para formularios nuevos

- Para páginas de formulario, reutilizar la estructura y las clases de `log-in.html`: `login-main`, `login-card`, `login-card__heading`, `login-form`, `login-field`, `login-field__label`, `login-field__input` y `login-form__submit`.
- No reutilizar `login-form.js` para un formulario que no sea de acceso: ese script inicia sesión y redirige. Crear un manejador específico cuando haga falta.
- Indicar los campos obligatorios con `required` y un asterisco (`*`) en su etiqueta. Los opcionales no llevan `required` y se identifican con `(opcional)`.
- Usar validación personalizada con `noValidate`, comprobar los campos obligatorios con `checkValidity()`, marcar los inválidos con `aria-invalid="true"` y enfocar el primer campo inválido.
- Para campos obligatorios incompletos o con formato inválido, mostrar exactamente: `Faltan campos por rellenar.`. Ocultar el error cuando los campos vuelvan a ser válidos.
- Usar el token de color `var(--color-error)` para los mensajes de error y los bordes de campos inválidos; no escribir el valor rojo directamente en las hojas de estilo.
- Tras un envío válido, ocultar el formulario y el encabezado introductorio, y mostrar únicamente el bloque de confirmación. Marcar el bloque con `role="status"` y `aria-live="polite"`.
- Añadir reglas explícitas para `[hidden]` en los bloques del formulario y confirmación cuando compartan estilos con elementos que definan `display`.
- Si el formulario no está conectado a un servidor, la confirmación debe dejar claro que el mensaje no se ha enviado ni guardado.
- Mantener los comentarios del JavaScript en castellano y reutilizar estilos existentes; no añadir estilos nuevos si las clases del login cubren el diseño.

## Alcance del registro

En el contexto disponible no constan otras instrucciones previas de la usuaria sobre diseño, funcionalidades, tecnologías o restricciones. No se han añadido criterios inferidos; incorporar aquí las instrucciones concretas cuando se indiquen.
