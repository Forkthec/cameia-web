/**
 * Comportamiento observable de `AppShell`, no implementación: que
 * renderiza la ruta hija a través de `Outlet`, que `NavHeader` y
 * `TabBar` repiten los mismos ítems de navegación (una sola fuente de
 * verdad para las dos superficies), que «Progreso» se deshabilita según
 * `progressEnabled`, que «Progreso» nunca es un enlace real todavía —
 * HE-07 no tiene ruta propia en este sprint (CLAUDE.md §11)—, y que el
 * wordmark "cameia" se renderiza en todos los breakpoints y enlaza a
 * `/inicio` (CM-46: sin él, la cabecera queda vacía en móvil, donde
 * `NavHeader` está oculto).
 */
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { AppShell } from './AppShell';

async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

function renderShell(path = '/inicio', progressEnabled = false) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppShell progressEnabled={progressEnabled} />}>
            <Route path="/inicio" element={<p>Contenido de inicio</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('AppShell', () => {
  it('renderiza el contenido de la ruta hija a través de Outlet', async () => {
    await waitUntilReady();
    renderShell();

    expect(screen.getByText('Contenido de inicio')).toBeInTheDocument();
  });

  it('repite los mismos 4 ítems de navegación en NavHeader y TabBar', async () => {
    await waitUntilReady();
    renderShell();

    expect(screen.getAllByText('Inicio')).toHaveLength(2);
    expect(screen.getAllByText('Entrenar')).toHaveLength(2);
    expect(screen.getAllByText('Progreso')).toHaveLength(2);
    expect(screen.getAllByText('Perfiles')).toHaveLength(2);
  });

  it('deshabilita "Progreso" cuando progressEnabled es false', async () => {
    await waitUntilReady();
    renderShell('/inicio', false);

    const progresoItems = screen.getAllByText('Progreso');
    for (const item of progresoItems) {
      expect(item.closest('[aria-disabled]')).toHaveAttribute('aria-disabled', 'true');
    }
  });

  it('"Progreso" nunca es un enlace real todavía — HE-07 no tiene ruta propia', async () => {
    await waitUntilReady();
    renderShell('/inicio', true);

    // Aunque progressEnabled sea true, el ítem no tiene `to` (sin HE-07 no
    // hay a dónde navegar): sigue sin ser un <NavLink>, solo cambia
    // aria-disabled cuando en el futuro sí exista una ruta propia.
    expect(screen.queryAllByRole('link', { name: /Progreso/ })).toHaveLength(0);
  });

  it('renderiza el wordmark "cameia" y enlaza a /inicio', async () => {
    await waitUntilReady();
    renderShell();

    const wordmark = screen.getByRole('link', { name: 'cameia' });
    expect(wordmark).toHaveAttribute('href', '/inicio');
  });
});
