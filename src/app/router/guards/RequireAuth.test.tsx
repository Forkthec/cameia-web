import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { useAuthStore } from '@/stores';
import { RedirectIfAuthenticated, RequireAuth } from './RequireAuth';

async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

function renderProtected(path: string) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route path="/inicio" element={<p>Contenido protegido</p>} />
          </Route>
          <Route path="/ingresar" element={<p>Formulario de ingreso</p>} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

function renderPublic(path: string) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<RedirectIfAuthenticated />}>
            <Route path="/ingresar" element={<p>Formulario de ingreso</p>} />
          </Route>
          <Route path="/inicio" element={<p>Contenido protegido</p>} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

describe('RequireAuth', () => {
  afterEach(() => {
    useAuthStore.setState({ user: null, plan: null, isAuthenticated: false, isLoading: true });
  });

  it('muestra un spinner mientras isLoading es true', async () => {
    await waitUntilReady();
    useAuthStore.setState({ isLoading: true, isAuthenticated: false });

    renderProtected('/inicio');
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirige a /ingresar cuando no hay sesión', async () => {
    await waitUntilReady();
    useAuthStore.setState({ isLoading: false, isAuthenticated: false });

    renderProtected('/inicio');
    expect(screen.getByText('Formulario de ingreso')).toBeInTheDocument();
  });

  it('renderiza la ruta hija cuando hay sesión', async () => {
    await waitUntilReady();
    useAuthStore.setState({ isLoading: false, isAuthenticated: true });

    renderProtected('/inicio');
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });
});

describe('RedirectIfAuthenticated', () => {
  afterEach(() => {
    useAuthStore.setState({ user: null, plan: null, isAuthenticated: false, isLoading: true });
  });

  it('muestra la ruta pública cuando no hay sesión', async () => {
    await waitUntilReady();
    useAuthStore.setState({ isLoading: false, isAuthenticated: false });

    renderPublic('/ingresar');
    expect(screen.getByText('Formulario de ingreso')).toBeInTheDocument();
  });

  it('redirige a /inicio cuando ya hay sesión', async () => {
    await waitUntilReady();
    useAuthStore.setState({ isLoading: false, isAuthenticated: true });

    renderPublic('/ingresar');
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });
});
