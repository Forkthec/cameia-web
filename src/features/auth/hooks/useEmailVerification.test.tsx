/**
 * Protege las tres reglas que hacen funcionar la verificación (`SPEC.md` §3,
 * `CM-14`; `REQ-CU-13` de `cameia-cuentas`): que el ID Token se refresca antes
 * de activar —sin eso el backend responde `403` siempre—, que un `403` se
 * reintenta exactamente una vez, y que el reenvío estrangulado por Firebase
 * tiene su propio mensaje en vez del genérico.
 */
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/http/ApiError';
import { useAuthStore } from '@/stores/auth.store';
import { useEmailVerification } from './useEmailVerification';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => navigateMock };
});

const { reloadCurrentUserMock, refreshIdTokenMock, sendEmailVerificationMock } = vi.hoisted(() => ({
  reloadCurrentUserMock: vi.fn(),
  refreshIdTokenMock: vi.fn(),
  sendEmailVerificationMock: vi.fn(),
}));

vi.mock('@/services/firebase/auth.service', () => ({
  // Clase real (no `vi.fn()`): el hook discrimina el reenvío estrangulado con
  // `instanceof`, así que la prueba tiene que lanzar esta misma clase.
  AuthError: class AuthError extends Error {
    readonly code: string;
    constructor(code: string) {
      super(code);
      this.name = 'AuthError';
      this.code = code;
    }
  },
  reloadCurrentUser: reloadCurrentUserMock,
  refreshIdToken: refreshIdTokenMock,
  sendEmailVerification: sendEmailVerificationMock,
}));

const { activateAccountMock } = vi.hoisted(() => ({ activateAccountMock: vi.fn() }));
vi.mock('../api/verification.api', () => ({ activateAccount: activateAccountMock }));

const { AuthError } = await import('@/services/firebase/auth.service');

const SESSION_USER = {
  uid: 'u1',
  email: 'ada@cameia.com',
  displayName: null,
  emailVerified: false,
};

function forbidden() {
  return new ApiError({ httpStatus: 403, title: 'Correo sin verificar', detail: 'x' });
}

function renderUseEmailVerification() {
  useAuthStore.setState({
    user: SESSION_USER,
    plan: 'FREE',
    isAuthenticated: true,
    isLoading: false,
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter>{children}</MemoryRouter>
  );
  return renderHook(() => useEmailVerification(), { wrapper });
}

describe('useEmailVerification', () => {
  afterEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, plan: null, isAuthenticated: false, isLoading: false });
  });

  it('refresca el token, activa la cuenta y redirige a /inicio al detectar el correo verificado', async () => {
    reloadCurrentUserMock.mockResolvedValue({ ...SESSION_USER, emailVerified: true });
    refreshIdTokenMock.mockResolvedValue('token-nuevo');
    activateAccountMock.mockResolvedValue(undefined);

    renderUseEmailVerification();

    await waitFor(() => expect(activateAccountMock).toHaveBeenCalledOnce());
    expect(refreshIdTokenMock).toHaveBeenCalledBefore(activateAccountMock);
    await waitFor(() => expect(useAuthStore.getState().user?.emailVerified).toBe(true));
    expect(navigateMock).toHaveBeenCalledWith('/inicio', { replace: true });
  });

  it('no activa nada mientras el correo siga sin verificar', async () => {
    reloadCurrentUserMock.mockResolvedValue({ ...SESSION_USER, emailVerified: false });

    renderUseEmailVerification();

    await waitFor(() => expect(reloadCurrentUserMock).toHaveBeenCalled());
    expect(activateAccountMock).not.toHaveBeenCalled();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('reintenta una sola vez con el token refrescado cuando la activación responde 403', async () => {
    reloadCurrentUserMock.mockResolvedValue({ ...SESSION_USER, emailVerified: true });
    refreshIdTokenMock.mockResolvedValue('token-nuevo');
    activateAccountMock.mockRejectedValueOnce(forbidden()).mockResolvedValueOnce(undefined);

    const { result } = renderUseEmailVerification();

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/inicio', { replace: true }));
    expect(refreshIdTokenMock).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeNull();
  });

  it('expone el error de verificación no confirmada cuando el 403 persiste', async () => {
    reloadCurrentUserMock.mockResolvedValue({ ...SESSION_USER, emailVerified: true });
    refreshIdTokenMock.mockResolvedValue('token-nuevo');
    activateAccountMock.mockRejectedValue(forbidden());

    const { result } = renderUseEmailVerification();

    await waitFor(() => expect(result.current.error).toBe('activation-rejected'));
    expect(result.current.isActivating).toBe(false);
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it('trata como fallo de red un error que no viene de una respuesta del backend', async () => {
    reloadCurrentUserMock.mockResolvedValue({ ...SESSION_USER, emailVerified: true });
    refreshIdTokenMock.mockResolvedValue('token-nuevo');
    activateAccountMock.mockRejectedValue(new TypeError('Failed to fetch'));

    const { result } = renderUseEmailVerification();

    await waitFor(() => expect(result.current.error).toBe('activation-network'));
  });

  it('tras reenviar el enlace arranca la espera de 60 s', async () => {
    reloadCurrentUserMock.mockResolvedValue({ ...SESSION_USER, emailVerified: false });
    sendEmailVerificationMock.mockResolvedValue(undefined);

    const { result } = renderUseEmailVerification();
    await result.current.resend();

    await waitFor(() => expect(result.current.hasResent).toBe(true));
    expect(result.current.resendCooldownSeconds).toBe(60);
    expect(sendEmailVerificationMock).toHaveBeenCalledOnce();
  });

  it('distingue el reenvío estrangulado por Firebase del error genérico', async () => {
    reloadCurrentUserMock.mockResolvedValue({ ...SESSION_USER, emailVerified: false });
    sendEmailVerificationMock.mockRejectedValue(new AuthError('AUTH_TOO_MANY_REQUESTS'));

    const { result } = renderUseEmailVerification();
    await result.current.resend();

    await waitFor(() => expect(result.current.error).toBe('resend-throttled'));
    expect(result.current.hasResent).toBe(false);
  });
});
