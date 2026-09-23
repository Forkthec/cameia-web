/**
 * Comportamiento observable de `signOut()` (`CM-194`): en éxito no lanza
 * nada, y un fallo de Firebase se traduce a un `AuthError` de CAMEIA —nunca
 * al error crudo del SDK— con el mismo contrato que ya protege `signIn()`.
 *
 * Y de `reloadCurrentUser()`/`refreshIdToken()` (`CM-14`): que sin sesión
 * devuelven `null` en vez de estallar, y que el refresco del token es
 * **forzado** — es lo único que hace que el claim `email_verified` viaje en
 * `true`, y sin eso la activación de la Cuenta responde `403` (`REQ-CU-13`
 * de `cameia-cuentas`; `SPEC.md` §3).
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthError, refreshIdToken, reloadCurrentUser, signOut } from './auth.service';

const { firebaseSignOutMock, firebaseGetIdTokenMock, authStub } = vi.hoisted(() => {
  // `auth.service.ts` llama `getAuth()` una sola vez, a nivel de módulo: este
  // objeto es la misma instancia durante toda la prueba, así que basta con
  // reescribirle `currentUser` para simular que hay o no sesión.
  const authStub: { currentUser: unknown } = { currentUser: null };
  return { firebaseSignOutMock: vi.fn(), firebaseGetIdTokenMock: vi.fn(), authStub };
});

// Se mockea "firebase/auth" (no el servicio) para ejercitar el try/catch real
// de `signOut()`. `getAuth` se mockea porque `auth.service.ts` la llama a
// nivel de módulo; `firebaseApp.ts` importa una configuración real de
// `.env.test` (dummy, sin red), así que no hace falta mockearlo aparte.
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => authStub),
  getIdToken: firebaseGetIdTokenMock,
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

describe('reloadCurrentUser', () => {
  afterEach(() => {
    authStub.currentUser = null;
  });

  it('devuelve null sin sesión activa, sin llamar a Firebase', async () => {
    await expect(reloadCurrentUser()).resolves.toBeNull();
  });

  it('refresca el usuario y devuelve el estado ya actualizado', async () => {
    const reload = vi.fn().mockImplementation(() => {
      authStub.currentUser = { emailVerified: true, reload };
      return Promise.resolve();
    });
    authStub.currentUser = { emailVerified: false, reload };

    const user = await reloadCurrentUser();

    expect(reload).toHaveBeenCalledOnce();
    expect(user).toMatchObject({ emailVerified: true });
  });

  it('traduce un fallo del SDK a AuthError', async () => {
    authStub.currentUser = {
      reload: vi.fn().mockRejectedValue({ code: 'auth/network-request-failed' }),
    };

    await expect(reloadCurrentUser()).rejects.toMatchObject({ code: 'AUTH_NETWORK_ERROR' });
  });
});

describe('refreshIdToken', () => {
  afterEach(() => {
    authStub.currentUser = null;
    firebaseGetIdTokenMock.mockReset();
  });

  it('devuelve null sin sesión activa', async () => {
    await expect(refreshIdToken()).resolves.toBeNull();
  });

  it('pide el token saltándose la caché', async () => {
    const user = { uid: 'u1' };
    authStub.currentUser = user;
    firebaseGetIdTokenMock.mockResolvedValue('token-nuevo');

    await expect(refreshIdToken()).resolves.toBe('token-nuevo');
    expect(firebaseGetIdTokenMock).toHaveBeenCalledWith(user, true);
  });

  it('traduce un fallo del SDK a AuthError', async () => {
    authStub.currentUser = { uid: 'u1' };
    firebaseGetIdTokenMock.mockRejectedValue({ code: 'auth/network-request-failed' });

    await expect(refreshIdToken()).rejects.toBeInstanceOf(AuthError);
  });
});
