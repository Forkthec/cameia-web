/**
 * Escala visual de 4 niveles para `design-system/molecules/PasswordStrength`
 * (Figma, nodo `33:251`). Decisión de Frontend, no un contrato del backend:
 * `PasswordPolicy.java` es binario (pasa o no pasa longitud + lista de
 * comunes), así que esta puntuación es una capa de UX de longitud/variedad
 * de caracteres, independiente de esa regla — por eso no se marca
 * `// PROVISIONAL` (esa marca es para contrato pendiente del backend, y
 * aquí no hay ninguno pendiente: el backend nunca va a tener una escala de
 * 4 niveles).
 *
 * No conoce la lista de contraseñas comunes (`features/auth/model/
 * commonPasswords.ts`) a propósito: `utils/` no puede importar de
 * `features/` (matriz de fronteras, `docs/ARCHITECTURE.md` §4). Una
 * contraseña común y larga puede verse "fuerte" aquí; el rechazo real por
 * ser común lo muestra el mensaje de error del campo, no este medidor.
 */
export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

const MIN_LENGTH = 12;
const BONUS_LENGTH = 16;

/**
 * @param password valor actual del campo Contraseña.
 * @returns el nivel visual correspondiente; `'empty'` solo para cadena vacía.
 */
export function calculatePasswordStrength(password: string): PasswordStrengthLevel {
  if (password.length === 0) return 'empty';

  const length = Array.from(password).length;
  if (length < MIN_LENGTH) return 'weak';

  let points = 1;
  if (length >= BONUS_LENGTH) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;

  if (points <= 1) return 'weak';
  if (points === 2) return 'fair';
  if (points === 3) return 'good';
  return 'strong';
}
