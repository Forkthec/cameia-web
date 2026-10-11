/**
 * Carrera entre `useLogin` y `RedirectIfAuthenticated` (CA-1.3.1, CA-1.3.10;
 * `features/auth/SPEC.md`, «Decisiones de CM-40», punto 1; patrón del defecto
 * B-22). `useLogin` escribe la sesión en el store y navega a `from` en el mismo
 * tick, mientras que `RedirectIfAuthenticated` (que envuelve `/ingresar`)
 * redirige a `/inicio` en cuanto ve `isAuthenticated`. Aquí se monta el
 * `routeConfig` real, con sus guards y sin mockear `useNavigate`, para
 * comprobar a dónde llega de verdad quien inicia sesión.
 *
 * Solo se mockea el SDK de Firebase (`@/services/firebase/auth.service`).
 * `AuthProvider` no se monta: la sesión la escribe únicamente `useLogin`, así
 * que esta prueba cubre la carrera entre el hook y el guard, no la del
 * listener `onAuthStateChanged`.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { useAuthStore } from '@/stores/auth.store';
import { routeConfig } from './index';

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
  return {
    AuthError,
    signIn: signInMock,
    signOut: vi.fn().mockResolvedValue(undefined),
    sendEmailVerification: vi.fn().mockResolvedValue(undefined),
    getIdToken: vi.fn().mockResolvedValue(null),
  };
});

async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

function renderAt(path: string) {
  const router = createMemoryRouter(routeConfig, { initialEntries: [path] });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <RouterProvider router={router} />
        </I18nextProvider>
      </QueryClientProvider>
    </HelmetProvider>,
  );
  return router;
}

async function logInWithValidCredentials() {
  signInMock.mockResolvedValue({
    uid: 'u1',
    email: 'ada@cameia.com',
    displayName: null,
    emailVerified: true,
  });
  const user = userEvent.setup();
  await user.type(await screen.findByLabelText('Correo electrónico'), 'ada@cameia.com');
  await user.type(screen.getByLabelText('Contraseña'), 'secreta123');
  await user.click(screen.getByRole('button', { name: 'Ingresar' }));
}

describe('login con los guards reales', () => {
  afterEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: null,
      plan: null,
      isAuthenticated: false,
      isLoading: true,
      unverifiedEmail: null,
      verificationResent: false,
    });
  });

  it('sin origen previo, llega al Tablero (CA-1.3.1)', async () => {
    await waitUntilReady();
    useAuthStore.setState({ isLoading: false, isAuthenticated: false });
    const router = renderAt('/ingresar');

    await logInWithValidCredentials();

    expect(await screen.findByText('Pantalla pendiente · sin HU')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/inicio');
  });

  it('desde una pantalla privada sin sesión, vuelve a ella tras iniciar sesión y no al Tablero (from)', async () => {
    await waitUntilReady();
    useAuthStore.setState({ isLoading: false, isAuthenticated: false });
    const router = renderAt('/perfiles/nuevo');
    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/ingresar');

    await logInWithValidCredentials();

    await waitFor(() => {
      expect(router.state.location.pathname).not.toBe('/ingresar');
    });
    expect(
      await screen.findByRole('heading', { name: '¿Cómo quieres completarlo?' }),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/perfiles/nuevo');
  });
});
