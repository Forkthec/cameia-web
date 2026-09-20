/**
 * Comportamiento observable de `LoginPage` de punta a punta (CA-1.3.1,
 * CA-1.3.2): valida el mismo alcance que `useLogin.test.ts` y
 * `LoginForm.test.tsx` por separado, pero aquí verificando que las tres
 * piezas (traducción, hook, formulario) quedan bien cableadas — no repite
 * cada caso de esas pruebas unitarias, solo el camino feliz y el de error
 * más representativo de cada uno.
 *
 * Mockea el módulo del SDK de Firebase (`@/services/firebase/auth.service`),
 * no MSW: este flujo no genera una petición HTTP propia de la aplicación
 * (`SPEC.md` §5).
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { useAuthStore } from '@/stores/auth.store';
import { LoginPage } from './LoginPage';

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

async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

function renderLoginPage(state?: unknown) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[{ pathname: '/ingresar', state }]}>
        <Routes>
          <Route path="/ingresar" element={<LoginPage />} />
          <Route path="/inicio" element={<p>Tablero</p>} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('LoginPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, plan: null, isAuthenticated: false, isLoading: false });
  });

  it('con credenciales válidas, redirige a /inicio', async () => {
    await waitUntilReady();
    signInMock.mockResolvedValue({
      uid: 'u1',
      email: 'ada@cameia.com',
      displayName: null,
      emailVerified: true,
    });
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText('Correo electrónico'), 'ada@cameia.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secreta123');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Tablero')).toBeInTheDocument();
  });

  it('con credenciales inválidas, muestra el mensaje genérico sin revelar qué campo falló', async () => {
    await waitUntilReady();
    const { AuthError } = await import('@/services/firebase/auth.service');
    signInMock.mockRejectedValue(new AuthError('AUTH_INVALID_CREDENTIALS'));
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText('Correo electrónico'), 'ada@cameia.com');
    await user.type(screen.getByLabelText('Contraseña'), 'mala-clave');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Correo o contraseña incorrectos');
  });

  it('con demasiados intentos, muestra el mensaje de rate limiting', async () => {
    await waitUntilReady();
    const { AuthError } = await import('@/services/firebase/auth.service');
    signInMock.mockRejectedValue(new AuthError('AUTH_TOO_MANY_REQUESTS'));
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText('Correo electrónico'), 'ada@cameia.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secreta123');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Demasiados intentos. Espera un momento y vuelve a intentarlo.',
    );
  });

  it('campos vacíos no llaman a Firebase', async () => {
    await waitUntilReady();
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    await waitFor(() => {
      expect(screen.getByText('Ingresa tu correo electrónico.')).toBeInTheDocument();
    });
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('mientras se envía, el botón queda deshabilitado con el gerundio', async () => {
    await waitUntilReady();
    let resolveSignIn: (value: unknown) => void = () => {};
    signInMock.mockReturnValue(
      new Promise((resolve) => {
        resolveSignIn = resolve;
      }),
    );
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText('Correo electrónico'), 'ada@cameia.com');
    await user.type(screen.getByLabelText('Contraseña'), 'secreta123');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByRole('button', { name: 'Ingresando…' })).toBeDisabled();

    resolveSignIn({ uid: 'u1', email: 'ada@cameia.com', displayName: null, emailVerified: true });
  });

  it('con location.state.logoutError, muestra el aviso de error genérico', async () => {
    await waitUntilReady();
    renderLoginPage({ logoutError: true });

    expect(await screen.findByText('Ocurrió un error. Inténtalo de nuevo.')).toBeInTheDocument();
  });
});
