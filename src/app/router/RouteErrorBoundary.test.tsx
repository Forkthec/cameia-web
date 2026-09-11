/**
 * Comportamiento observable de `RouteErrorBoundary`, no implementación:
 * que un error lanzado por el loader o el render de una ruta (react-
 * router) se resuelve en `errors:generico` (CLAUDE.md §8) dentro de esa
 * ruta, sin depender de `RootErrorBoundary`, que cubre un caso distinto.
 */
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { RouteErrorBoundary } from './RouteErrorBoundary';

async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

describe('RouteErrorBoundary', () => {
  it('captura el error de un loader y muestra el mensaje genérico', async () => {
    await waitUntilReady();

    const router = createMemoryRouter(
      [
        {
          path: '/',
          errorElement: <RouteErrorBoundary />,
          loader: () => {
            throw new Error('falla simulada');
          },
        },
      ],
      { initialEntries: ['/'] },
    );

    render(
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>,
    );

    expect(await screen.findByText('Ocurrió un error. Inténtalo de nuevo.')).toBeInTheDocument();
  });
});
