/**
 * Comportamiento observable de `AuthProvider`, no implementación: que no
 * bloquea el render de sus hijos esperando a que resuelva Firebase, y que
 * sincroniza el resultado (con o sin sesión) en `useAuthStore` (CLAUDE.md
 * §3.6: el estado de sesión vive en Zustand, no en un estado local de
 * este componente).
 */
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth.store';
import { AuthProvider } from './AuthProvider';

const { onAuthStateChangedMock, getIdTokenResultMock } = vi.hoisted(() => ({
  onAuthStateChangedMock: vi.fn(),
  getIdTokenResultMock: vi.fn(),
}));

// Se mockea el servicio (no Firebase directo) porque `firebaseApp.ts` valida
// `config/env.ts` al importarse, y esta prueba no necesita un .env real.
vi.mock('@/services/firebase/auth.service', () => ({
  onAuthStateChanged: onAuthStateChangedMock,
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
});
