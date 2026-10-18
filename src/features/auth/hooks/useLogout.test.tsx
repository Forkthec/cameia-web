/**
 * Comportamiento observable de `useLogout` (`CA-1.8.1`): con éxito limpia el
 * store de sesión y navega a `/ingresar`; si `signOut` falla, limpia igual
 * el store y navega con la marca de error para que `LoginPage` la muestre;
 * CM-331 (CA-1.8.2): `logoutAll()` se invoca antes de `signOut()` para revocar
 * sesiones en todos los dispositivos; si falla, el cierre local ocurre igual.
 * `isLoggingOut` refleja la llamada en curso. Además, `CA-1.8.3` (CM-243,
 * DF-003): el cierre borra `lastUsedProfileId` para que otra cuenta en el
 * mismo navegador no herede el perfil de la anterior, pero no el idioma.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth.store';
import { useUiPreferencesStore } from '@/stores/uiPreferences.store';
import { useLogout } from './useLogout';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => navigateMock };
});

const { signOutMock } = vi.hoisted(() => ({ signOutMock: vi.fn() }));

vi.mock('@/services/firebase/auth.service', () => ({ signOut: signOutMock }));

const { logoutAllMock } = vi.hoisted(() => ({ logoutAllMock: vi.fn() }));

vi.mock('../api/session.api', () => ({ logoutAll: logoutAllMock }));

function renderUseLogout() {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={['/inicio']}>{children}</MemoryRouter>
  );
  return renderHook(() => useLogout(), { wrapper });
}

describe('useLogout', () => {
  afterEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: { uid: 'u1', email: 'ada@cameia.com', displayName: null, emailVerified: true },
      plan: 'FREE',
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('con éxito, llama a logoutAll antes de signOut (CM-331)', async () => {
    const callOrder: string[] = [];
    logoutAllMock.mockImplementation(() => {
      callOrder.push('logoutAll');
      return Promise.resolve();
    });
    signOutMock.mockImplementation(() => {
      callOrder.push('signOut');
      return Promise.resolve();
    });
    const { result } = renderUseLogout();

    await act(async () => {
      await result.current.logout();
    });

    expect(callOrder).toEqual(['logoutAll', 'signOut']);
  });

  it('cuando logoutAll falla, signOut se ejecuta igual (CM-331)', async () => {
    logoutAllMock.mockRejectedValue(new Error('network'));
    signOutMock.mockResolvedValue(undefined);
    const { result } = renderUseLogout();

    await act(async () => {
      await result.current.logout();
    });

    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/ingresar', { replace: true, state: undefined });
  });

  it('con éxito, limpia el store de sesión y navega a /ingresar', async () => {
    signOutMock.mockResolvedValue(undefined);
    logoutAllMock.mockResolvedValue(undefined);
    const { result } = renderUseLogout();

    await act(async () => {
      await result.current.logout();
    });

    expect(useAuthStore.getState()).toMatchObject({
      user: null,
      plan: null,
      isAuthenticated: false,
    });
    expect(navigateMock).toHaveBeenCalledWith('/ingresar', { replace: true, state: undefined });
  });

  it('cuando signOut falla, limpia igual el store y navega con el estado de error', async () => {
    logoutAllMock.mockResolvedValue(undefined);
    signOutMock.mockRejectedValue(new Error('AUTH_UNKNOWN_ERROR'));
    const { result } = renderUseLogout();

    await act(async () => {
      await result.current.logout();
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(navigateMock).toHaveBeenCalledWith('/ingresar', {
      replace: true,
      state: { logoutError: true },
    });
  });

  it('con éxito, borra el último perfil usado del Usuario A (CA-1.8.3)', async () => {
    useUiPreferencesStore.setState({ lastUsedProfileId: 'perfil-de-A' });
    logoutAllMock.mockResolvedValue(undefined);
    signOutMock.mockResolvedValue(undefined);
    const { result } = renderUseLogout();

    await act(async () => {
      await result.current.logout();
    });

    expect(useUiPreferencesStore.getState().lastUsedProfileId).toBeNull();
  });

  it('cuando signOut falla, borra igual el último perfil usado (CA-1.8.3)', async () => {
    useUiPreferencesStore.setState({ lastUsedProfileId: 'perfil-de-A' });
    logoutAllMock.mockResolvedValue(undefined);
    signOutMock.mockRejectedValue(new Error('AUTH_UNKNOWN_ERROR'));
    const { result } = renderUseLogout();

    await act(async () => {
      await result.current.logout();
    });

    expect(useUiPreferencesStore.getState().lastUsedProfileId).toBeNull();
  });

  it('conserva el idioma de la interfaz al cerrar sesión: es del dispositivo, no del usuario', async () => {
    useUiPreferencesStore.setState({ idioma: 'en', lastUsedProfileId: 'perfil-de-A' });
    logoutAllMock.mockResolvedValue(undefined);
    signOutMock.mockResolvedValue(undefined);
    const { result } = renderUseLogout();

    await act(async () => {
      await result.current.logout();
    });

    expect(useUiPreferencesStore.getState().idioma).toBe('en');
    useUiPreferencesStore.setState({ idioma: 'es-CO' });
  });

  it('mientras signOut está en curso, isLoggingOut es true, y vuelve a false al resolver', async () => {
    logoutAllMock.mockResolvedValue(undefined);
    let resolveSignOut: () => void = () => {};
    signOutMock.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveSignOut = resolve;
      }),
    );
    const { result } = renderUseLogout();

    let logoutPromise!: Promise<void>;
    act(() => {
      logoutPromise = result.current.logout();
    });

    await waitFor(() => {
      expect(result.current.isLoggingOut).toBe(true);
    });

    await act(async () => {
      resolveSignOut();
      await logoutPromise;
    });

    expect(result.current.isLoggingOut).toBe(false);
  });
});
