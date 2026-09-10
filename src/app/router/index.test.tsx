/**
 * Prueba de integración del árbol de rutas real (`routeConfig`), montado
 * sobre `createMemoryRouter` en vez de `createBrowserRouter` (ver comentario
 * en `index.tsx`). Verifica el criterio de aceptación pedido: la app navega
 * entre rutas y una ruta inexistente muestra el 404.
 */
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { useAuthStore } from '@/stores';
import { routeConfig } from './index';

async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

function renderAt(path: string) {
  const memoryRouter = createMemoryRouter(routeConfig, { initialEntries: [path] });
  return render(
    <I18nextProvider i18n={i18n}>
      <RouterProvider router={memoryRouter} />
    </I18nextProvider>,
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
});
