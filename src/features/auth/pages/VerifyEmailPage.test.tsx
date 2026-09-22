/**
 * Comportamiento observable de `VerifyEmailPage` con las piezas reales
 * cableadas (traducción, hook, organismo), igual criterio que
 * `LoginPage.test.tsx`: solo se mockea Firebase y la llamada de activación.
 *
 * Protege tres decisiones de `SPEC.md` §3 (`CM-14`): que el `Toast` de
 * registro exitoso aparezca **solo** al llegar desde el registro —quien llega
 * redirigido por el guard no acaba de registrarse—, que el correo que se
 * muestra salga del store y no del estado de navegación, y que al detectarse
 * la verificación la pantalla active la Cuenta y salga a `/inicio`.
 */
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { useAuthStore } from '@/stores/auth.store';
import { VerifyEmailPage } from './VerifyEmailPage';

const { reloadCurrentUserMock, refreshIdTokenMock, sendEmailVerificationMock } = vi.hoisted(() => ({
  reloadCurrentUserMock: vi.fn(),
  refreshIdTokenMock: vi.fn(),
  sendEmailVerificationMock: vi.fn(),
}));

vi.mock('@/services/firebase/auth.service', () => ({
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

async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

const SESSION_USER = {
  uid: 'u1',
  email: 'ada@gmail.com',
  displayName: null,
  emailVerified: false,
};

function renderVerifyEmailPage(state?: { registroExitoso: true }) {
  useAuthStore.setState({
    user: SESSION_USER,
    plan: 'FREE',
    isAuthenticated: true,
    isLoading: false,
  });

  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[{ pathname: '/verificar-correo', state }]}>
        <Routes>
          <Route path="/verificar-correo" element={<VerifyEmailPage />} />
          <Route path="/inicio" element={<p>Tablero</p>} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('VerifyEmailPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, plan: null, isAuthenticated: false, isLoading: false });
  });

  it('muestra el correo de la sesión en la instrucción principal', async () => {
    await waitUntilReady();
    reloadCurrentUserMock.mockResolvedValue({ ...SESSION_USER, emailVerified: false });

    renderVerifyEmailPage();

    expect(screen.getByRole('heading', { name: 'Verifica tu correo' })).toBeInTheDocument();
    expect(screen.getByText('ada@gmail.com')).toBeInTheDocument();
  });

  it('al llegar desde el registro, anuncia el registro exitoso y el Plan Gratis', async () => {
    await waitUntilReady();
    reloadCurrentUserMock.mockResolvedValue({ ...SESSION_USER, emailVerified: false });

    renderVerifyEmailPage({ registroExitoso: true });

    expect(
      await screen.findByText(
        '¡Registro exitoso! Hemos enviado un enlace de verificación a tu correo electrónico.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Tu cuenta quedó con el Plan Gratis de CAMEIA.')).toBeInTheDocument();
  });

  it('al llegar redirigida por el guard, no muestra el aviso de registro', async () => {
    await waitUntilReady();
    reloadCurrentUserMock.mockResolvedValue({ ...SESSION_USER, emailVerified: false });

    renderVerifyEmailPage();

    expect(screen.queryByText(/Registro exitoso/)).not.toBeInTheDocument();
    expect(
      screen.queryByText('Tu cuenta quedó con el Plan Gratis de CAMEIA.'),
    ).not.toBeInTheDocument();
  });

  it('al detectar la verificación, activa la cuenta y sale a /inicio', async () => {
    await waitUntilReady();
    reloadCurrentUserMock.mockResolvedValue({ ...SESSION_USER, emailVerified: true });
    refreshIdTokenMock.mockResolvedValue('token-nuevo');
    activateAccountMock.mockResolvedValue(undefined);

    renderVerifyEmailPage();

    expect(await screen.findByText('Tablero')).toBeInTheDocument();
    expect(activateAccountMock).toHaveBeenCalledOnce();
  });

  it('con la activación rechazada, muestra el aviso y deja reintentar sin cerrar la sesión', async () => {
    await waitUntilReady();
    const { ApiError } = await import('@/services/http/ApiError');
    reloadCurrentUserMock.mockResolvedValue({ ...SESSION_USER, emailVerified: true });
    refreshIdTokenMock.mockResolvedValue('token-nuevo');
    activateAccountMock.mockRejectedValue(
      new ApiError({ httpStatus: 403, title: 'Correo sin verificar', detail: 'x' }),
    );

    renderVerifyEmailPage();

    expect(
      await screen.findByText(
        'Todavía no pudimos confirmar tu verificación. Si ya hiciste clic en el enlace, inténtalo de nuevo.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
});
