/**
 * Comportamiento observable de `RegisterPage` de punta a punta (CA-1.1.1/
 * CA-1.1.3, CM-180): valida el mismo alcance que `RegisterForm.test.tsx` y
 * `useRegister.test.tsx` por separado, pero aquí verificando que las tres
 * piezas (traducción, hook, formulario) quedan bien cableadas — solo el
 * camino feliz y el caso de correo duplicado.
 *
 * **CM-180:** tras el registro exitoso se muestra la pantalla de «Verifica tu
 * correo» en lugar del modal de Plan Gratis, y al pulsar «Ir a iniciar
 * sesión» se redirige a `/ingresar`.
 *
 * `POST /api/v1/users` pasa por el servidor de MSW real (`register.api.ts`
 * intacto, `mocks/handlers/auth.handlers.ts`) — es la primera llamada de
 * red propia de esta feature (`ADR-0006`); solo se mockea el módulo de
 * Firebase (`signIn`/`sendEmailVerification`/`signOut`), igual que
 * `LoginPage.test.tsx`.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { httpClient } from '@/services/http/httpClient';
import { useAuthStore } from '@/stores/auth.store';
import { RegisterPage } from './RegisterPage';

const { signInMock, sendEmailVerificationMock, signOutMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
  sendEmailVerificationMock: vi.fn(),
  signOutMock: vi.fn(),
}));

vi.mock('@/services/firebase/auth.service', () => ({
  signIn: signInMock,
  sendEmailVerification: sendEmailVerificationMock,
  signOut: signOutMock,
  getIdToken: vi.fn().mockResolvedValue(null),
}));

async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

function renderRegisterPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={['/registro']}>
        <Routes>
          <Route path="/registro" element={<RegisterPage />} />
          <Route path="/ingresar" element={<p>Iniciar sesión</p>} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

async function fillValidForm(user: ReturnType<typeof userEvent.setup>, email: string) {
  await user.type(screen.getByLabelText('Nombre(s)'), 'Ada');
  await user.type(screen.getByLabelText('Apellido(s)'), 'Lovelace');
  fireEvent.change(screen.getByLabelText('Fecha de nacimiento'), {
    target: { value: '1990-01-01' },
  });
  await user.type(screen.getByLabelText('Correo electrónico'), email);
  await user.type(screen.getByLabelText('Contraseña'), 'ClaveSegura2026');
  await user.type(screen.getByLabelText('Confirmar contraseña'), 'ClaveSegura2026');
  await user.selectOptions(screen.getByLabelText('Pronombres'), 'SHE');
}

describe('RegisterPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: null, plan: null, isAuthenticated: false, isLoading: false });
  });

  it('con datos válidos, muestra la pantalla de verificación y al cerrarla redirige a /ingresar', async () => {
    await waitUntilReady();
    signInMock.mockResolvedValue({
      uid: 'u1',
      email: 'nueva@cameia.com',
      displayName: null,
      emailVerified: false,
    });
    sendEmailVerificationMock.mockResolvedValue(undefined);
    signOutMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderRegisterPage();

    await fillValidForm(user, 'nueva@cameia.com');
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(await screen.findByText(/Te enviamos un enlace de verificación/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Ir a iniciar sesión' }));

    expect(await screen.findByText('Iniciar sesión')).toBeInTheDocument();
  });

  it('si el envío del correo falla, muestra el mensaje de fallo con el botón a /ingresar', async () => {
    await waitUntilReady();
    signInMock.mockResolvedValue({
      uid: 'u2',
      email: 'fallo-envio@cameia.com',
      displayName: null,
      emailVerified: false,
    });
    sendEmailVerificationMock.mockRejectedValue(new Error('too-many-requests'));
    signOutMock.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderRegisterPage();

    await fillValidForm(user, 'fallo-envio@cameia.com');
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(
      await screen.findByText(/No pudimos enviar el correo de verificación/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ir a iniciar sesión' })).toBeInTheDocument();
  });

  it('un correo ya registrado muestra el error con el bloque de dos acciones', async () => {
    await waitUntilReady();
    await httpClient.post('/api/v1/users', {
      firstName: 'Ada',
      lastName: 'Lovelace',
      birthDate: '01/01/1990',
      email: 'ya-existe@cameia.com',
      password: 'ClaveSegura2026',
      pronoun: 'SHE',
    });
    const user = userEvent.setup();
    renderRegisterPage();

    await fillValidForm(user, 'ya-existe@cameia.com');
    await user.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(await screen.findByText('Ese correo ya tiene una cuenta.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recuperar contraseña' })).toBeDisabled();
    expect(signInMock).not.toHaveBeenCalled();
  });
});
