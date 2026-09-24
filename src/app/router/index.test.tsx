/**
 * Prueba de integración del árbol de rutas real (`routeConfig`), montado
 * sobre `createMemoryRouter` en vez de `createBrowserRouter` (ver comentario
 * en `index.tsx`). Verifica el criterio de aceptación pedido: la app navega
 * entre rutas y una ruta inexistente muestra el 404. Incluye `/perfiles/nuevo`
 * (CM-46) y `/perfiles/:id/editar` (CM-61): ambas se mudaron de
 * `professionalProfileWizardRoutes` (retirada, SPEC.md §9 decisión D-E) a
 * `professionalProfileShellRoutes`, así que esta es la prueba que demuestra
 * que `RequireAuth` las sigue protegiendo y que ahora renderizan dentro de
 * `AppShell` — ninguna feature puede probarlo por su cuenta porque
 * `features` no puede importar `RequireAuth` (docs/ARCHITECTURE.md §4).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HelmetProvider } from 'react-helmet-async';
import { I18nextProvider } from 'react-i18next';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { httpClient } from '@/services/http/httpClient';
import { useAuthStore } from '@/stores/auth.store';
import { routeConfig } from './index';

// `signOut`/`getIdToken` reales llaman al SDK de Firebase; se mockean aquí
// (no solo en `useLogout.test.tsx`) para el caso de integración de `CM-194`
// de más abajo. `getIdToken` resuelve `null`, el mismo valor que ya
// devolvía sin mock (no hay usuario real de Firebase en este árbol de
// pruebas), así que no cambia el comportamiento de las pruebas existentes
// que ya usan `httpClient` contra MSW.
vi.mock('@/services/firebase/auth.service', () => ({
  signOut: vi.fn().mockResolvedValue(undefined),
  getIdToken: vi.fn().mockResolvedValue(null),
}));

async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

function renderAt(path: string) {
  const memoryRouter = createMemoryRouter(routeConfig, { initialEntries: [path] });
  // Fuera de esta prueba, `AppProviders` es quien aporta el QueryClientProvider
  // real (ver app/App.tsx); aquí no se reutiliza porque también trae
  // `AuthProvider`, que se suscribe al `onAuthStateChanged` real de Firebase
  // — esta prueba maneja la sesión manipulando `useAuthStore` directo. Desde
  // que /perfiles/nuevo (CM-46) usa `useMutation`, esta rama del árbol de
  // rutas real lo necesita para no fallar con "No QueryClient set".
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <RouterProvider router={memoryRouter} />
        </I18nextProvider>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

describe('routeConfig', () => {
  afterEach(() => {
    useAuthStore.setState({ user: null, plan: null, isAuthenticated: false, isLoading: true });
  });

  it('"/" renderiza la landing pública', async () => {
    await waitUntilReady();
    useAuthStore.setState({ isLoading: false, isAuthenticated: false });

    renderAt('/');

    expect(
      await screen.findByRole('heading', { name: 'Entra a la entrevista listo' }),
    ).toBeInTheDocument();
  });

  it('una ruta inexistente muestra el 404', async () => {
    await waitUntilReady();
    useAuthStore.setState({ isLoading: false, isAuthenticated: false });

    renderAt('/ruta-que-no-existe');

    expect(await screen.findByText('No encontramos lo que buscabas.')).toBeInTheDocument();
  });

  it('una ruta protegida sin sesión redirige a /ingresar', async () => {
    await waitUntilReady();
    useAuthStore.setState({ isLoading: false, isAuthenticated: false });

    renderAt('/inicio');

    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
  });

  it('una ruta protegida con sesión renderiza dentro de AppShell', async () => {
    await waitUntilReady();
    useAuthStore.setState({ isLoading: false, isAuthenticated: true });

    renderAt('/inicio');

    expect(await screen.findByText('Pantalla pendiente · sin HU')).toBeInTheDocument();
    expect(
      screen.getAllByRole('navigation', { name: 'Navegación principal' }).length,
    ).toBeGreaterThan(0);
  });

  it('"/perfiles/nuevo" sin sesión redirige a /ingresar', async () => {
    await waitUntilReady();
    useAuthStore.setState({ isLoading: false, isAuthenticated: false });

    renderAt('/perfiles/nuevo');

    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
  });

  it('"/perfiles/nuevo" con sesión renderiza el selector de método dentro de AppShell', async () => {
    await waitUntilReady();
    useAuthStore.setState({ isLoading: false, isAuthenticated: true });

    renderAt('/perfiles/nuevo');

    expect(
      await screen.findByRole('heading', { name: '¿Cómo quieres completarlo?' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('navigation', { name: 'Navegación principal' }).length,
    ).toBeGreaterThan(0);
  });

  it('"/perfiles/:id/editar" sin sesión redirige a /ingresar', async () => {
    await waitUntilReady();
    useAuthStore.setState({ isLoading: false, isAuthenticated: false });

    renderAt('/perfiles/profile-1/editar');

    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
  });

  it('"/perfiles/:id/editar" con sesión renderiza el formulario dentro de AppShell', async () => {
    await waitUntilReady();
    useAuthStore.setState({ isLoading: false, isAuthenticated: true });
    const created = await httpClient.post<{ id: string }>('/api/v1/profiles', {
      name: 'Ana María Pérez',
    });

    renderAt(`/perfiles/${created.id}/editar`);

    expect(
      await screen.findByRole('heading', { name: 'Editar perfil profesional' }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('navigation', { name: 'Navegación principal' }).length,
    ).toBeGreaterThan(0);
  });

  it('tras cerrar sesión desde una ruta protegida, RequireAuth ya no deja pasar (CM-194)', async () => {
    await waitUntilReady();
    useAuthStore.setState({
      isLoading: false,
      isAuthenticated: true,
      user: { uid: 'u1', email: 'ada@cameia.com', displayName: null, emailVerified: true },
    });
    const user = userEvent.setup();

    renderAt('/inicio');
    await screen.findByText('Pantalla pendiente · sin HU');

    await user.click(screen.getByRole('button', { name: /Menú de usuario/ }));
    await user.click(screen.getByRole('menuitem', { name: /Cerrar sesión/ }));
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(await screen.findByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
  });
});
