/**
 * Prueba de integración del árbol de rutas real (`routeConfig`), montado
 * sobre `createMemoryRouter` en vez de `createBrowserRouter` (ver comentario
 * en `index.tsx`). Verifica el criterio de aceptación pedido: la app navega
 * entre rutas y una ruta inexistente muestra el 404. Incluye `/perfiles/nuevo`
 * (CM-46): al mudarse de `professionalProfileWizardRoutes` a
 * `professionalProfileShellRoutes`, esta es la prueba que demuestra que
 * `RequireAuth` la sigue protegiendo y que ahora renderiza dentro de
 * `AppShell` — `NewProfilePage.test.tsx` no puede probarlo porque `features`
 * no puede importar `RequireAuth` (docs/ARCHITECTURE.md §4).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { useAuthStore } from '@/stores/auth.store';
import { routeConfig } from './index';

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
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={memoryRouter} />
      </I18nextProvider>
    </QueryClientProvider>,
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

    expect(await screen.findByText('Pantalla pendiente · sin HU')).toBeInTheDocument();
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

    expect(await screen.findByText('Pantalla pendiente · CM-40')).toBeInTheDocument();
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

    expect(await screen.findByText('Pantalla pendiente · CM-40')).toBeInTheDocument();
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
});
