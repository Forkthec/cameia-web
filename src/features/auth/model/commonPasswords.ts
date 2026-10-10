/**
 * CM-267/CA-1.1.27 (ASVS 6.2.4): 3000 contraseñas más frecuentes de 12 a 64
 * caracteres, tomadas del archivo versionado en `cameia-cuentas`
 * (`src/main/resources/security/common-passwords.txt`). La comparación ignora
 * mayúsculas, espacios alrededor y forma Unicode (NFC), replicando
 * `PasswordPolicy.java` (`esConocida()`).
 */
import passwordsRaw from './common-passwords.txt?raw';

const COMMON_PASSWORDS = new Set(passwordsRaw.trim().split('\n'));

/**
 * @param value contraseña tal como la escribió la persona.
 * @returns `true` si coincide con una de la lista, ignorando mayúsculas,
 *          espacios alrededor y forma Unicode.
 */
export function isCommonPassword(value: string): boolean {
  return COMMON_PASSWORDS.has(value.trim().toLowerCase().normalize('NFC'));
}
