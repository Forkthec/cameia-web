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
 *
 * El segundo `describe` (CM-40) fija los criterios de HU-1.3 del backlog v6 con
 * el texto COMPLETO de cada mensaje (`findByText` exacto, no por subcadena) y con
 * aserciones explícitas de si `signIn` se llamó o no.
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { useAuthStore } from '@/stores/auth.store';
import { LoginPage } from './LoginPage';

const { signInMock, signOutMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock('@/services/firebase/auth.service', () => {
  class AuthError extends Error {
    readonly code: string;
    constructor(code: string) {
      super(code);
      this.name = 'AuthError';
      this.code = code;
    }
  }
  return { signIn: signInMock, signOut: signOutMock, sendEmailVerification: vi.fn(), AuthError };
});

function resetSession() {
  useAuthStore.setState({
    user: null,
    plan: null,
    isAuthenticated: false,
    isLoading: false,
    unverifiedEmail: null,
    verificationResent: false,
  });
}

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
          <Route path="/registro" element={<p>Pantalla de registro</p>} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('LoginPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    resetSession();
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

const WRONG_CREDENTIALS_MESSAGE = 'Correo o contraseña incorrectos.';
const UNVERIFIED_MESSAGE =
  'Tu correo aún no está verificado. Revisa tu bandeja de entrada o pide un nuevo enlace.';

async function fillAndSubmit(correo: string, contrasena: string) {
  const user = userEvent.setup();
  if (correo) await user.type(screen.getByLabelText('Correo electrónico'), correo);
  if (contrasena) await user.type(screen.getByLabelText('Contraseña'), contrasena);
  await user.click(screen.getByRole('button', { name: 'Ingresar' }));
  return user;
}

describe('LoginPage · criterios del backlog v6 (CM-40)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    resetSession();
  });

  it('CA-1.3.2: con contraseña incorrecta, muestra el mensaje exacto, llama a Firebase una vez y no al backend', async () => {
    await waitUntilReady();
    const { AuthError } = await import('@/services/firebase/auth.service');
    signInMock.mockRejectedValue(new AuthError('AUTH_INVALID_CREDENTIALS'));
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderLoginPage();

    await fillAndSubmit('ada@cameia.com', 'mala-clave');

    expect(await screen.findByText(WRONG_CREDENTIALS_MESSAGE)).toBeInTheDocument();
    expect(signInMock).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('CA-1.3.3: con un correo no registrado, muestra el mismo mensaje exacto que con contraseña incorrecta', async () => {
    await waitUntilReady();
    const { AuthError } = await import('@/services/firebase/auth.service');
    signInMock.mockRejectedValue(new AuthError('AUTH_INVALID_CREDENTIALS'));
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    renderLoginPage();

    await fillAndSubmit('nadie@cameia.com', 'cualquiera123');

    expect(await screen.findByText(WRONG_CREDENTIALS_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByText(/no está registrado|no existe|no tiene cuenta/i)).toBeNull();
    expect(signInMock).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('CA-1.3.4: un correo con solo espacios muestra «Ingresa tu correo electrónico.» y no llama a Firebase', async () => {
    await waitUntilReady();
    renderLoginPage();

    await fillAndSubmit('   ', 'secreta123');

    expect(await screen.findByText('Ingresa tu correo electrónico.')).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('CA-1.3.6: un correo con formato inválido muestra el mensaje exacto y no llama a Firebase', async () => {
    await waitUntilReady();
    renderLoginPage();

    await fillAndSubmit('no-es-un-correo', 'secreta123');

    expect(await screen.findByText('Ingresa un correo electrónico válido.')).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('CA-1.3.11: con una cuenta deshabilitada, muestra el mensaje exacto, sin «Contacta a soporte»', async () => {
    await waitUntilReady();
    const { AuthError } = await import('@/services/firebase/auth.service');
    signInMock.mockRejectedValue(new AuthError('AUTH_USER_DISABLED'));
    renderLoginPage();

    await fillAndSubmit('ada@cameia.com', 'secreta123');

    expect(await screen.findByText('Esta cuenta está deshabilitada.')).toBeInTheDocument();
    expect(screen.queryByText(/soporte/i)).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('CA-1.3.12: un correo de 255 caracteres muestra el mensaje del límite y no llama a Firebase', async () => {
    await waitUntilReady();
    const correo255 = `${'a'.repeat(243)}@ejemplo.com`;
    expect(correo255).toHaveLength(255);
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByLabelText('Correo electrónico'));
    await user.paste(correo255);
    await user.type(screen.getByLabelText('Contraseña'), 'secreta123');
    await user.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(
      await screen.findByText('El correo no puede superar los 254 caracteres.'),
    ).toBeInTheDocument();
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('CA-1.3.13: «¿Olvidaste tu contraseña?» está deshabilitado y lleva la etiqueta «Próximamente» visible', async () => {
    await waitUntilReady();
    renderLoginPage();

    expect(screen.getByRole('button', { name: /¿Olvidaste tu contraseña\?/ })).toBeDisabled();
    expect(screen.getByText('Próximamente')).toBeVisible();
  });

  it('CA-1.3.14: «Crear cuenta» navega a Registro', async () => {
    await waitUntilReady();
    const user = userEvent.setup();
    renderLoginPage();

    await user.click(screen.getByRole('link', { name: 'Crear cuenta' }));

    expect(await screen.findByText('Pantalla de registro')).toBeInTheDocument();
  });

  describe('CA-1.3.7 · correo sin verificar', () => {
    const unverifiedUser = {
      uid: 'u1',
      email: 'ada@cameia.com',
      displayName: null,
      emailVerified: false,
    };

    it('cierra la sesión de Firebase y no navega a ninguna pantalla privada', async () => {
      await waitUntilReady();
      signInMock.mockResolvedValue(unverifiedUser);
      signOutMock.mockResolvedValue(undefined);
      renderLoginPage();

      await fillAndSubmit('ada@cameia.com', 'secreta123');

      expect(await screen.findByText(UNVERIFIED_MESSAGE)).toBeInTheDocument();
      expect(signOutMock).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Tablero')).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('muestra en un modal el aviso exacto con los botones «Reenviar correo de verificación» y «Usar otra cuenta»', async () => {
      await waitUntilReady();
      signInMock.mockResolvedValue(unverifiedUser);
      signOutMock.mockResolvedValue(undefined);
      renderLoginPage();

      await fillAndSubmit('ada@cameia.com', 'secreta123');

      const dialog = await screen.findByRole('dialog');
      expect(within(dialog).getByText(UNVERIFIED_MESSAGE)).toBeInTheDocument();
      expect(
        within(dialog).getByRole('button', { name: 'Reenviar correo de verificación' }),
      ).toBeInTheDocument();
      expect(within(dialog).getByRole('button', { name: 'Usar otra cuenta' })).toBeInTheDocument();
    });

    it('«Usar otra cuenta» cierra el modal y deja vacíos los campos', async () => {
      await waitUntilReady();
      signInMock.mockResolvedValue(unverifiedUser);
      signOutMock.mockResolvedValue(undefined);
      renderLoginPage();
      const user = await fillAndSubmit('ada@cameia.com', 'secreta123');
      await screen.findByRole('dialog');

      await user.click(screen.getByRole('button', { name: 'Usar otra cuenta' }));

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).toBeNull();
      });
      expect(screen.getByLabelText('Correo electrónico')).toHaveValue('');
      expect(screen.getByLabelText('Contraseña')).toHaveValue('');
    });
  });
});
