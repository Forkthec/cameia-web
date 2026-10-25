/**
 * Comportamiento observable de `AuthProvider`, no implementación: que no
 * bloquea el render de sus hijos esperando a que resuelva Firebase, y que
 * sincroniza el resultado (con o sin sesión) en `useAuthStore` (CLAUDE.md
 * §3.6: el estado de sesión vive en Zustand, no en un estado local de
 * este componente). También `CA-1.8.3` (CM-243, DF-003): cuando Firebase
 * reporta que no hay usuario —cierre de sesión, 401 o sesión vencida— se
 * borra `lastUsedProfileId`. Y `CA-1.8.9` (CM-337): al restaurar una sesión
 * que «Cerrar sesión» revocó en otro dispositivo, se cierra y se muestra
 * «Tu sesión expiró. Inicia sesión de nuevo.».
 */
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth.store';
import { useUiPreferencesStore } from '@/stores/uiPreferences.store';
import { AuthProvider } from './AuthProvider';

const { onAuthStateChangedMock, getIdTokenResultMock, signOutMock } = vi.hoisted(() => ({
  onAuthStateChangedMock: vi.fn(),
  getIdTokenResultMock: vi.fn(),
  signOutMock: vi.fn(),
}));

// Se mockea el servicio (no Firebase directo) porque `firebaseApp.ts` valida
// `config/env.ts` al importarse, y esta prueba no necesita un .env real.
vi.mock('@/services/firebase/auth.service', () => ({
  onAuthStateChanged: onAuthStateChangedMock,
  signOut: signOutMock,
}));

vi.mock('firebase/auth', () => ({
  getIdTokenResult: getIdTokenResultMock,
}));

describe('AuthProvider', () => {
  afterEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, plan: null, isAuthenticated: false, isLoading: true });
  });

  it('renderiza sus hijos de inmediato, sin esperar a que resuelva la sesión', () => {
    onAuthStateChangedMock.mockReturnValue(() => {});

    render(
      <AuthProvider>
        <p>Contenido</p>
      </AuthProvider>,
    );

    expect(screen.getByText('Contenido')).toBeInTheDocument();
  });

  it('sin usuario, limpia el store de auth', () => {
    let capturedCallback: ((user: unknown) => void) | undefined;
    onAuthStateChangedMock.mockImplementation((callback: (user: unknown) => void) => {
      capturedCallback = callback;
      return () => {};
    });

    render(<AuthProvider>{null}</AuthProvider>);
    useAuthStore.setState({ isAuthenticated: true, isLoading: true });

    capturedCallback?.(null);

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('sin usuario, borra el último perfil usado: cubre el 401 y la sesión vencida (CA-1.8.3)', () => {
    let capturedCallback: ((user: unknown) => void) | undefined;
    onAuthStateChangedMock.mockImplementation((callback: (user: unknown) => void) => {
      capturedCallback = callback;
      return () => {};
    });

    render(<AuthProvider>{null}</AuthProvider>);
    useUiPreferencesStore.setState({ lastUsedProfileId: 'perfil-de-A' });

    capturedCallback?.(null);

    expect(useUiPreferencesStore.getState().lastUsedProfileId).toBeNull();
  });

  it('con usuario, conserva el último perfil usado', async () => {
    let capturedCallback: ((user: unknown) => void) | undefined;
    onAuthStateChangedMock.mockImplementation((callback: (user: unknown) => void) => {
      capturedCallback = callback;
      return () => {};
    });
    getIdTokenResultMock.mockResolvedValue({ claims: { plan: 'FREE' } });

    render(<AuthProvider>{null}</AuthProvider>);
    useUiPreferencesStore.setState({ lastUsedProfileId: 'perfil-de-A' });
    capturedCallback?.({ uid: 'u1', email: 'a@b.com', displayName: 'Ada', emailVerified: true });

    await vi.waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
    expect(useUiPreferencesStore.getState().lastUsedProfileId).toBe('perfil-de-A');
  });

  it('con usuario, guarda el perfil resuelto en el store de auth', async () => {
    let capturedCallback: ((user: unknown) => void) | undefined;
    onAuthStateChangedMock.mockImplementation((callback: (user: unknown) => void) => {
      capturedCallback = callback;
      return () => {};
    });
    getIdTokenResultMock.mockResolvedValue({ claims: { plan: 'FREE' } });

    render(<AuthProvider>{null}</AuthProvider>);
    capturedCallback?.({ uid: 'u1', email: 'a@b.com', displayName: 'Ada', emailVerified: true });

    await vi.waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });
    expect(useAuthStore.getState().user).toEqual({
      uid: 'u1',
      email: 'a@b.com',
      displayName: 'Ada',
      emailVerified: true,
    });
    expect(useAuthStore.getState().plan).toBe('FREE');
  });

  describe('sesión revocada en otro dispositivo (CA-1.8.9)', () => {
    const USER = { uid: 'u1', email: 'a@b.com', displayName: 'Ada', emailVerified: true };
    let replaceSpy: ReturnType<typeof vi.fn>;

    function captureCallback() {
      let captured: ((user: unknown) => void) | undefined;
      onAuthStateChangedMock.mockImplementation((callback: (user: unknown) => void) => {
        captured = callback;
        return () => {};
      });
      render(<AuthProvider>{null}</AuthProvider>);
      return (user: unknown) => captured?.(user);
    }

    beforeEach(() => {
      replaceSpy = vi.fn();
      vi.stubGlobal('location', { ...window.location, replace: replaceSpy });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('al restaurar la sesión pide un token nuevo', async () => {
      getIdTokenResultMock.mockResolvedValue({ claims: {} });
      captureCallback()(USER);
      await vi.waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
      expect(getIdTokenResultMock).toHaveBeenCalledWith(USER, true);
    });

    it('si Firebase dice que la sesión fue revocada, cierra y va a «Iniciar sesión» con el aviso', async () => {
      getIdTokenResultMock.mockRejectedValue({ code: 'auth/user-token-expired' });
      signOutMock.mockResolvedValue(undefined);
      captureCallback()(USER);
      await vi.waitFor(() => expect(replaceSpy).toHaveBeenCalledWith('/ingresar?sesionExpirada=1'));
      expect(signOutMock).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('sin red, sigue con el token guardado', async () => {
      getIdTokenResultMock
        .mockRejectedValueOnce({ code: 'auth/network-request-failed' })
        .mockResolvedValue({ claims: {} });
      captureCallback()(USER);
      await vi.waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
      expect(replaceSpy).not.toHaveBeenCalled();
    });

    it('tras iniciar sesión aquí mismo no fuerza un token nuevo', async () => {
      getIdTokenResultMock.mockResolvedValue({ claims: {} });
      const emit = captureCallback();
      emit(null);
      emit(USER);
      await vi.waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
      expect(getIdTokenResultMock).toHaveBeenCalledWith(USER, false);
    });
  });
});
