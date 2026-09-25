/**
 * Comportamiento observable de `signOut()` (`CM-194`): en éxito no lanza
 * nada, y un fallo de Firebase se traduce a un `AuthError` de CAMEIA —nunca
 * al error crudo del SDK— con el mismo contrato que ya protege `signIn()`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthError, signOut } from './auth.service';

const { firebaseSignOutMock } = vi.hoisted(() => ({ firebaseSignOutMock: vi.fn() }));

// Se mockea "firebase/auth" (no el servicio) para ejercitar el try/catch real
// de `signOut()`. `getAuth` se mockea porque `auth.service.ts` la llama a
// nivel de módulo; `firebaseApp.ts` importa una configuración real de
// `.env.test` (dummy, sin red), así que no hace falta mockearlo aparte.
vi.mock('firebase/auth', () => ({
  connectAuthEmulator: vi.fn(),
  getAuth: vi.fn(() => ({})),
  getIdToken: vi.fn(),
  onAuthStateChanged: vi.fn(),
  sendEmailVerification: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: firebaseSignOutMock,
}));

describe('signOut', () => {
  afterEach(() => {
    firebaseSignOutMock.mockReset();
  });

  it('resuelve sin error cuando Firebase cierra la sesión con éxito', async () => {
    firebaseSignOutMock.mockResolvedValue(undefined);

    await expect(signOut()).resolves.toBeUndefined();
  });

  it('lanza instancias de AuthError, no el error crudo de Firebase', async () => {
    firebaseSignOutMock.mockRejectedValue({ code: 'auth/network-request-failed' });

    await expect(signOut()).rejects.toBeInstanceOf(AuthError);
  });

  it('con un código de Firebase mapeado, usa el código de CAMEIA correspondiente', async () => {
    firebaseSignOutMock.mockRejectedValue({ code: 'auth/network-request-failed' });

    await expect(signOut()).rejects.toMatchObject({ code: 'AUTH_NETWORK_ERROR' });
  });

  it('con un código de Firebase no mapeado, cae al código genérico', async () => {
    firebaseSignOutMock.mockRejectedValue({ code: 'auth/internal-error' });

    await expect(signOut()).rejects.toMatchObject({ code: 'AUTH_UNKNOWN_ERROR' });
  });
});
