/**
 * Protege que cada código real de `AuthError` que `signIn()` puede lanzar
 * (CA-1.3.1/CA-1.3.2) resuelva a su llave de i18n; que el error de red
 * reutilice el mensaje genérico de conectividad ya existente (`errors:red`)
 * en vez de duplicarlo; y que un código no reconocido caiga al mensaje
 * genérico en vez de dejar la pantalla muda.
 */
import { describe, expect, it } from 'vitest';
import { getAuthErrorMessageKey } from './authErrorMessage';

describe('getAuthErrorMessageKey', () => {
  it.each([
    ['AUTH_INVALID_CREDENTIALS', 'errors:codigos.AUTH_INVALID_CREDENTIALS'],
    ['AUTH_TOO_MANY_REQUESTS', 'errors:codigos.AUTH_TOO_MANY_REQUESTS'],
    ['AUTH_USER_DISABLED', 'errors:codigos.AUTH_USER_DISABLED'],
  ])('mapea %s a %s', (code, expectedKey) => {
    expect(getAuthErrorMessageKey(code)).toBe(expectedKey);
  });

  it('mapea AUTH_NETWORK_ERROR al mensaje genérico de conectividad, no a uno propio', () => {
    expect(getAuthErrorMessageKey('AUTH_NETWORK_ERROR')).toBe('errors:red');
  });

  it('un código no reconocido cae al mensaje genérico', () => {
    expect(getAuthErrorMessageKey('AUTH_UNKNOWN_ERROR')).toBe('errors:generico');
  });
});
