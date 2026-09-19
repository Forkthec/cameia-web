/**
 * Copia literal de `COMMON_PASSWORDS` en `PasswordPolicy.java`
 * (`tech.cameia.cuentas.domain.policy`, confirmado 19-sep-2026): 32
 * contraseñas rechazadas aunque cumplan la longitud mínima. El backend las
 * compara sin mayúsculas ni espacios alrededor (`esConocida()`) — se replica
 * el mismo criterio aquí para que el cliente detecte el rechazo antes de
 * llamar al backend (somos la primera línea de seguridad, no la única).
 */
const COMMON_PASSWORDS = new Set([
  '123456789012',
  '1234567890123',
  '12345678901234',
  '123456789012345',
  '1234567890123456',
  '111111111111',
  '000000000000',
  '121212121212',
  '123123123123',
  'abcdefghijkl',
  'abcd1234abcd',
  'qwertyuiop12',
  'qwertyuiop123',
  'qwertyuiopasd',
  'asdfghjklzxc',
  '1qaz2wsx3edc',
  'password1234',
  'password12345',
  'passwordpassword',
  'contrasena123',
  'contrasena1234',
  'contrasenia123',
  'administrador',
  'administrator',
  'iloveyou1234',
  'letmein12345',
  'welcome12345',
  'superman1234',
  'futbol123456',
  'colombia1234',
  'bogota123456',
  'cameia123456',
]);

/**
 * @param value contraseña tal como la escribió la persona.
 * @returns `true` si coincide con una de la lista, ignorando mayúsculas y espacios alrededor.
 */
export function isCommonPassword(value: string): boolean {
  return COMMON_PASSWORDS.has(value.trim().toLowerCase());
}
