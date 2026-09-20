/**
 * Comportamiento observable de `useLogout` (`CA-1.8.1`): con éxito limpia el
 * store de sesión y navega a `/ingresar`; si `signOut` falla, limpia igual
 * el store y navega con la marca de error para que `LoginPage` la muestre;
 * `isLoggingOut` refleja la llamada en curso.
 */
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from './useLogout';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => navigateMock };
});

const { signOutMock } = vi.hoisted(() => ({ signOutMock: vi.fn() }));

vi.mock('@/services/firebase/auth.service', () => ({ signOut: signOutMock }));

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

  it('con éxito, limpia el store de sesión y navega a /ingresar', async () => {
    signOutMock.mockResolvedValue(undefined);
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

  it('mientras signOut está en curso, isLoggingOut es true, y vuelve a false al resolver', async () => {
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
