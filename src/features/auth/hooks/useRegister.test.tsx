/**
 * Comportamiento observable de `useRegister` (`ADR-0006`, `SPEC.md` §3
 * Registro): éxito encadena `registerUser` → `signIn()` →
 * `sendEmailVerification()`, guarda la sesión y abre el modal; cerrar el
 * modal redirige a `/inicio`; un `ApiError` de correo duplicado o de fecha
 * de nacimiento expone su código sin llamar a Firebase; y el caso de
 * borde (`POST` exitoso, `signIn()` falla después) redirige a `/ingresar`
 * con la marca `registerInfo`, no como error de este formulario.
 */
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/services/http/ApiError';
import { useAuthStore } from '@/stores/auth.store';
import { SIGN_IN_AFTER_REGISTER_FAILED, useRegister } from './useRegister';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => navigateMock };
});

const { registerUserMock, signInMock, sendEmailVerificationMock } = vi.hoisted(() => ({
  registerUserMock: vi.fn(),
  signInMock: vi.fn(),
  sendEmailVerificationMock: vi.fn(),
}));

vi.mock('../api/register.api', () => ({ registerUser: registerUserMock }));

vi.mock('@/services/firebase/auth.service', () => ({
  signIn: signInMock,
  sendEmailVerification: sendEmailVerificationMock,
}));

function renderUseRegister() {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter>{children}</MemoryRouter>
  );
  return renderHook(() => useRegister(), { wrapper });
}

const formValues = {
  nombre: 'Ada',
  apellido: 'Lovelace',
  fechaNacimiento: '1990-01-01',
  correo: 'ada@cameia.com',
  celular: '',
  contrasena: 'secreta123',
  confirmarContrasena: 'secreta123',
  pronombres: 'SHE',
};

describe('useRegister', () => {
  afterEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, plan: null, isAuthenticated: false, isLoading: false });
  });

  it('con el POST y la sesión exitosos, guarda la sesión y abre el modal de confirmación', async () => {
    registerUserMock.mockResolvedValue({
      id: 'account-1',
      firebaseUid: 'u1',
      status: 'PENDING_VERIFICATION',
      plan: 'FREE',
    });
    signInMock.mockResolvedValue({
      uid: 'u1',
      email: 'ada@cameia.com',
      displayName: null,
      emailVerified: false,
    });
    sendEmailVerificationMock.mockResolvedValue(undefined);
    const { result } = renderUseRegister();

    await result.current.register(formValues);

    await waitFor(() => expect(result.current.isSuccessModalOpen).toBe(true));
    expect(result.current.isSubmitting).toBe(false);
    expect(sendEmailVerificationMock).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.uid).toBe('u1');
  });

  it('al cerrar el modal de confirmación, redirige a /inicio', async () => {
    registerUserMock.mockResolvedValue({
      id: 'account-1',
      firebaseUid: 'u1',
      status: 'PENDING_VERIFICATION',
      plan: 'FREE',
    });
    signInMock.mockResolvedValue({
      uid: 'u1',
      email: 'ada@cameia.com',
      displayName: null,
      emailVerified: false,
    });
    sendEmailVerificationMock.mockResolvedValue(undefined);
    const { result } = renderUseRegister();
    await result.current.register(formValues);
    await waitFor(() => expect(result.current.isSuccessModalOpen).toBe(true));

    result.current.closeSuccessModal();

    expect(navigateMock).toHaveBeenCalledWith('/inicio', { replace: true });
  });

  it('con correo duplicado, expone el código sin llamar a Firebase', async () => {
    registerUserMock.mockRejectedValue(
      new ApiError({ httpStatus: 409, code: 'REGISTRO_CORREO_DUPLICADO', message: 'x' }),
    );
    const { result } = renderUseRegister();

    await result.current.register(formValues);

    await waitFor(() => expect(result.current.errorCode).toBe('REGISTRO_CORREO_DUPLICADO'));
    expect(result.current.isSubmitting).toBe(false);
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('con fecha de nacimiento rechazada por el backend, expone su propio código', async () => {
    registerUserMock.mockRejectedValue(
      new ApiError({ httpStatus: 422, code: 'REGISTRO_FECHA_NACIMIENTO_INVALIDA', message: 'x' }),
    );
    const { result } = renderUseRegister();

    await result.current.register(formValues);

    await waitFor(() =>
      expect(result.current.errorCode).toBe('REGISTRO_FECHA_NACIMIENTO_INVALIDA'),
    );
  });

  it('con un fallo que no es ApiError, expone NETWORK_ERROR', async () => {
    registerUserMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const { result } = renderUseRegister();

    await result.current.register(formValues);

    await waitFor(() => expect(result.current.errorCode).toBe('NETWORK_ERROR'));
  });

  it('si el POST tiene éxito pero signIn() falla después, redirige a /ingresar con el mensaje informativo', async () => {
    registerUserMock.mockResolvedValue({
      id: 'account-1',
      firebaseUid: 'u1',
      status: 'PENDING_VERIFICATION',
      plan: 'FREE',
    });
    signInMock.mockRejectedValue(new Error('network down'));
    const { result } = renderUseRegister();

    await result.current.register(formValues);

    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith('/ingresar', {
        state: { registerInfo: SIGN_IN_AFTER_REGISTER_FAILED },
      }),
    );
    expect(result.current.isSuccessModalOpen).toBe(false);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
