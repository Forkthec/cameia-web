/**
 * Filtros de texto a nivel de tecleo (CM-195): recortan cada cambio a los
 * caracteres permitidos antes de que lleguen al estado del formulario, para
 * que nunca exista en pantalla un valor que el backend rechazaría por
 * formato (`RegisterUserRequest.java`/`PhoneNumber.java`, `cameia-cuentas`).
 * Puras y sin dominio — no saben qué es un nombre ni un celular, solo qué
 * caracteres conservar — por eso viven en `utils/`, no en `features/auth/`;
 * ya tienen dos consumidores (nombre/apellido y el número nacional de
 * teléfono) desde el primer commit.
 */
const NOT_LETTERS_OR_SPACES = /[^A-Za-zÁÉÍÓÚáéíóúÑñ\s]/g;
const NOT_DIGITS = /[^0-9]/g;

/**
 * @param value texto tal como lo escribió la persona.
 * @returns `value` sin nada distinto de letras (con tildes y `ñ`/`Ñ`) y espacios.
 */
export function filterToLettersAndSpaces(value: string): string {
  return value.replace(NOT_LETTERS_OR_SPACES, '');
}

/**
 * @param value texto tal como lo escribió la persona.
 * @returns `value` sin nada distinto de dígitos.
 */
export function filterToDigits(value: string): string {
  return value.replace(NOT_DIGITS, '');
}
