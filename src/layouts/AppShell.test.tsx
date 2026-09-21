/**
 * Comportamiento observable de `AppShell`, no implementación: que
 * renderiza la ruta hija a través de `Outlet`, que `NavHeader` y
 * `TabBar` repiten los mismos ítems de navegación (una sola fuente de
 * verdad para las dos superficies), que «Progreso» se deshabilita según
 * `progressEnabled`, que «Progreso» nunca es un enlace real todavía —
 * HE-07 no tiene ruta propia en este sprint (CLAUDE.md §11)—, y que el
 * wordmark "cameia" se renderiza en todos los breakpoints y enlaza a
 * `/inicio` (CM-46: sin él, la cabecera queda vacía en móvil, donde
 * `NavHeader` está oculto). `CM-194` (`CA-1.8.1`) suma: el disparador de
 * `MenuUsuario` se ve en todo breakpoint, confirmar/cancelar el cierre de
 * sesión, el aviso de cambios sin guardar, y que la confirmación es `Modal`
 * en escritorio y `BottomSheet` en móvil.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { useAuthStore } from '@/stores/auth.store';
import { useUiPreferencesStore } from '@/stores/uiPreferences.store';
import { useUnsavedChangesStore } from '@/stores/unsavedChanges.store';
import { setViewportMatches } from '@/test/matchMedia';
import { AppShell } from './AppShell';

async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

interface RenderShellOptions {
  progressEnabled?: boolean;
  onLogout?: () => void;
  isLoggingOut?: boolean;
}

function renderShell(path = '/inicio', options: RenderShellOptions = {}) {
  const { progressEnabled = false, onLogout = () => {}, isLoggingOut = false } = options;

  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            element={
              <AppShell
                progressEnabled={progressEnabled}
                onLogout={onLogout}
                isLoggingOut={isLoggingOut}
              />
            }
          >
            <Route path="/inicio" element={<p>Contenido de inicio</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('AppShell', () => {
  afterEach(() => {
    useAuthStore.setState({ user: null, plan: null, isAuthenticated: false, isLoading: false });
    useUnsavedChangesStore.setState({ hasUnsavedChanges: false });
    useUiPreferencesStore.setState({ lastUsedProfileId: null });
  });

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
    renderShell('/inicio', { progressEnabled: false });

    const progresoItems = screen.getAllByText('Progreso');
    for (const item of progresoItems) {
      expect(item.closest('[aria-disabled]')).toHaveAttribute('aria-disabled', 'true');
    }
  });

  it('"Progreso" nunca es un enlace real todavía — HE-07 no tiene ruta propia', async () => {
    await waitUntilReady();
    renderShell('/inicio', { progressEnabled: true });

    // Aunque progressEnabled sea true, el ítem no tiene `to` (sin HE-07 no
    // hay a dónde navegar): sigue sin ser un <NavLink>, solo cambia
    // aria-disabled cuando en el futuro sí exista una ruta propia.
    expect(screen.queryAllByRole('link', { name: /Progreso/ })).toHaveLength(0);
  });

  it('CM-195: "Perfiles" enlaza a /perfiles/nuevo sin lastUsedProfileId', async () => {
    await waitUntilReady();
    renderShell();

    for (const link of screen.getAllByRole('link', { name: 'Perfiles' })) {
      expect(link).toHaveAttribute('href', '/perfiles/nuevo');
    }
  });

  it('CM-195: "Perfiles" enlaza directo al perfil cuando hay lastUsedProfileId', async () => {
    await waitUntilReady();
    useUiPreferencesStore.setState({ lastUsedProfileId: 'profile-42' });
    renderShell();

    for (const link of screen.getAllByRole('link', { name: 'Perfiles' })) {
      expect(link).toHaveAttribute('href', '/perfiles/profile-42/editar');
    }
  });

  it('renderiza el wordmark "cameia" y enlaza a /inicio', async () => {
    await waitUntilReady();
    renderShell();

    const wordmark = screen.getByRole('link', { name: 'cameia' });
    expect(wordmark).toHaveAttribute('href', '/inicio');
  });

  it('muestra el disparador de MenuUsuario tanto en escritorio como en móvil', async () => {
    await waitUntilReady();

    setViewportMatches(true);
    const { unmount } = renderShell();
    expect(screen.getByRole('button', { name: /Menú de usuario/ })).toBeInTheDocument();
    unmount();

    setViewportMatches(false);
    renderShell();
    expect(screen.getByRole('button', { name: /Menú de usuario/ })).toBeInTheDocument();
  });

  it('al confirmar sin cambios sin guardar, invoca onLogout', async () => {
    await waitUntilReady();
    const user = userEvent.setup();
    const onLogout = vi.fn();
    renderShell('/inicio', { onLogout });

    await user.click(screen.getByRole('button', { name: /Menú de usuario/ }));
    await user.click(screen.getByRole('menuitem', { name: /Cerrar sesión/ }));
    await user.click(screen.getByRole('button', { name: 'Cerrar sesión' }));

    expect(onLogout).toHaveBeenCalledOnce();
  });

  it('con cambios sin guardar, la confirmación muestra el aviso correspondiente', async () => {
    await waitUntilReady();
    const user = userEvent.setup();
    useUnsavedChangesStore.setState({ hasUnsavedChanges: true });
    renderShell();

    await user.click(screen.getByRole('button', { name: /Menú de usuario/ }));
    await user.click(screen.getByRole('menuitem', { name: /Cerrar sesión/ }));

    expect(
      screen.getByText('Tienes cambios sin guardar. Si cierras sesión, se perderán.'),
    ).toBeInTheDocument();
  });

  it('al cancelar la confirmación, no invoca onLogout', async () => {
    await waitUntilReady();
    const user = userEvent.setup();
    const onLogout = vi.fn();
    renderShell('/inicio', { onLogout });

    await user.click(screen.getByRole('button', { name: /Menú de usuario/ }));
    await user.click(screen.getByRole('menuitem', { name: /Cerrar sesión/ }));
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onLogout).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('en escritorio, la confirmación se muestra como Modal (con botón de cierre)', async () => {
    await waitUntilReady();
    const user = userEvent.setup();
    setViewportMatches(true);
    renderShell();

    await user.click(screen.getByRole('button', { name: /Menú de usuario/ }));
    await user.click(screen.getByRole('menuitem', { name: /Cerrar sesión/ }));

    expect(screen.getByRole('button', { name: 'Cerrar' })).toBeInTheDocument();
  });

  it('en móvil, la confirmación se muestra como BottomSheet (sin botón de cierre)', async () => {
    await waitUntilReady();
    const user = userEvent.setup();
    setViewportMatches(false);
    renderShell();

    await user.click(screen.getByRole('button', { name: /Menú de usuario/ }));
    await user.click(screen.getByRole('menuitem', { name: /Cerrar sesión/ }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cerrar' })).not.toBeInTheDocument();
  });

  it('mientras isLoggingOut es true, el botón primario de la confirmación está en loading', async () => {
    await waitUntilReady();
    const user = userEvent.setup();
    renderShell('/inicio', { isLoggingOut: true });

    await user.click(screen.getByRole('button', { name: /Menú de usuario/ }));
    await user.click(screen.getByRole('menuitem', { name: /Cerrar sesión/ }));

    expect(screen.getByRole('button', { name: 'Cerrando sesión…' })).toBeDisabled();
  });
});
