/**
 * Comportamiento observable de `useLogin` (CA-1.3.1/CA-1.3.2): éxito guarda
 * la sesión y redirige (al origen protegido si existe, si no a `/inicio`);
 * un `AuthError` conocido resuelve la llave de mensaje correspondiente sin
 * revelar cuál campo falló; el estado de envío se apaga tras un error.
 */
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth.store';
import { useLogin } from './useLogin';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => navigateMock };
});

const { signInMock } = vi.hoisted(() => ({ signInMock: vi.fn() }));

vi.mock('@/services/firebase/auth.service', () => {
  class AuthError extends Error {
    readonly code: string;
    constructor(code: string) {
      super(code);
      this.name = 'AuthError';
      this.code = code;
    }
  }
  return { signIn: signInMock, AuthError };
});

function renderUseLogin(initialEntries: string[] | { pathname: string; state?: unknown }[]) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
  );
  return renderHook(() => useLogin(), { wrapper });
}

describe('useLogin', () => {
  afterEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, plan: null, isAuthenticated: false, isLoading: false });
  });

  it('con credenciales válidas, guarda la sesión y redirige a /inicio por defecto', async () => {
    signInMock.mockResolvedValue({
      uid: 'u1',
      email: 'ada@cameia.com',
      displayName: null,
      emailVerified: true,
    });
    const { result } = renderUseLogin(['/ingresar']);

    await result.current.login('ada@cameia.com', 'secreta123');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/inicio', { replace: true });
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user).toEqual({
      uid: 'u1',
      email: 'ada@cameia.com',
      displayName: null,
      emailVerified: true,
    });
  });

  it('con un origen protegido previo, redirige ahí en vez de a /inicio', async () => {
    signInMock.mockResolvedValue({
      uid: 'u1',
      email: 'ada@cameia.com',
      displayName: null,
      emailVerified: true,
    });
    const { result } = renderUseLogin([
      {
        pathname: '/ingresar',
        state: { from: { pathname: '/perfiles/nuevo', search: '', hash: '' } },
      },
    ]);

    await result.current.login('ada@cameia.com', 'secreta123');

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/perfiles/nuevo', { replace: true });
    });
  });

  it('con credenciales inválidas, expone la llave de mensaje mapeada y apaga isSubmitting', async () => {
    const { AuthError } = await import('@/services/firebase/auth.service');
    signInMock.mockRejectedValue(new AuthError('AUTH_INVALID_CREDENTIALS'));
    const { result } = renderUseLogin(['/ingresar']);

    await result.current.login('ada@cameia.com', 'mala-clave');

    await waitFor(() => {
      expect(result.current.errorMessageKey).toBe('errors:codigos.AUTH_INVALID_CREDENTIALS');
    });
    expect(result.current.isSubmitting).toBe(false);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('con demasiados intentos, expone la llave de rate limiting', async () => {
    const { AuthError } = await import('@/services/firebase/auth.service');
    signInMock.mockRejectedValue(new AuthError('AUTH_TOO_MANY_REQUESTS'));
    const { result } = renderUseLogin(['/ingresar']);

    await result.current.login('ada@cameia.com', 'secreta123');

    await waitFor(() => {
      expect(result.current.errorMessageKey).toBe('errors:codigos.AUTH_TOO_MANY_REQUESTS');
    });
  });
});
