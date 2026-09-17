/**
 * Traduce el código de `AuthError` (`services/firebase/auth.service.ts`) a
 * la llave de i18n que el formulario debe mostrar. Vive en `model/` porque es
 * la única pieza de dominio propia que le faltaba a esta historia — el resto
 * (tipos de usuario, estado de sesión) ya lo cubren `auth.service.ts` y
 * `stores/auth.store.ts` (CLAUDE.md §16; SPEC.md §3).
 *
 * `AUTH_NETWORK_ERROR` se resuelve contra `errors:red`, el mensaje genérico
 * de conectividad que ya existe para el resto de la app — no se duplica ese
 * texto en un `errors:codigos.AUTH_NETWORK_ERROR` aparte.
 *
 * Solo reconoce los códigos que `signIn()` puede lanzar de verdad
 * (CA-1.3.1/CA-1.3.2); un código no reconocido cae al mensaje genérico en vez
 * de dejar la pantalla muda ante uno nuevo del SDK.
 */
const LOGIN_ERROR_MESSAGE_KEYS: Record<string, string> = {
  AUTH_INVALID_CREDENTIALS: 'errors:codigos.AUTH_INVALID_CREDENTIALS',
  AUTH_TOO_MANY_REQUESTS: 'errors:codigos.AUTH_TOO_MANY_REQUESTS',
  AUTH_USER_DISABLED: 'errors:codigos.AUTH_USER_DISABLED',
  AUTH_NETWORK_ERROR: 'errors:red',
};

/**
 * @param code `AuthError.code` capturado en `useLogin`.
 * @returns La llave de i18n exacta a resolver con `t(...)`.
 */
export function getAuthErrorMessageKey(code: string): string {
  return LOGIN_ERROR_MESSAGE_KEYS[code] ?? 'errors:generico';
}
