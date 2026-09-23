/**
 * Comportamiento observable de `RequireAuth`, `RequireVerifiedEmail` y
 * `RedirectIfAuthenticated`, no implementación: que todo lo que no es la landing pública, `/registro`
 * ni `/ingresar` vive detrás de sesión (CLAUDE.md §11), que mientras la
 * sesión no resuelve se muestra un estado de carga en vez de decidir en
 * falso, y que con sesión ya resuelta no se vuelven a mostrar las
 * pantallas públicas de entrada. Desde `CM-14`, también que una sesión con
 * el correo sin verificar no alcanza ninguna ruta protegida: se la lleva a
 * `/verificar-correo`, la única pantalla autenticada fuera de esa regla.
 */
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { useAuthStore } from '@/stores/auth.store';
import { RedirectIfAuthenticated, RequireAuth, RequireVerifiedEmail } from './RequireAuth';

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
          <Route path="/verificar-correo" element={<p>Verifica tu correo</p>} />
        </Routes>
      </MemoryRouter>
    </I18nextProvider>,
  );
}

function renderVerified(path: string) {
  return render(
    <I18nextProvider i18n={i18n}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<RequireVerifiedEmail />}>
            <Route path="/inicio" element={<p>Contenido protegido</p>} />
          </Route>
          <Route path="/verificar-correo" element={<p>Verifica tu correo</p>} />
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

  it('redirige a /inicio cuando ya hay sesión con el correo verificado', async () => {
    await waitUntilReady();
    useAuthStore.setState({
      isLoading: false,
      isAuthenticated: true,
      user: { uid: 'u1', email: 'ada@cameia.com', displayName: null, emailVerified: true },
    });

    renderPublic('/ingresar');
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });

  it('redirige a /verificar-correo cuando la sesión tiene el correo sin verificar', async () => {
    await waitUntilReady();
    useAuthStore.setState({
      isLoading: false,
      isAuthenticated: true,
      user: { uid: 'u1', email: 'ada@cameia.com', displayName: null, emailVerified: false },
    });

    renderPublic('/ingresar');
    expect(screen.getByText('Verifica tu correo')).toBeInTheDocument();
  });
});

/**
 * `RequireVerifiedEmail` protege la regla de negocio de `cameia-cuentas`
 * (su spec §5): una Cuenta `PENDING_VERIFICATION` existe, pero el resto de
 * la plataforma no debe tratarla como utilizable (`SPEC.md` §2, `CM-14`).
 */
describe('RequireVerifiedEmail', () => {
  afterEach(() => {
    useAuthStore.setState({ user: null, plan: null, isAuthenticated: false, isLoading: true });
  });

  it('renderiza la ruta hija cuando el correo está verificado', async () => {
    await waitUntilReady();
    useAuthStore.setState({
      isLoading: false,
      isAuthenticated: true,
      user: { uid: 'u1', email: 'ada@cameia.com', displayName: null, emailVerified: true },
    });

    renderVerified('/inicio');
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });

  it('redirige a /verificar-correo cuando el correo no está verificado', async () => {
    await waitUntilReady();
    useAuthStore.setState({
      isLoading: false,
      isAuthenticated: true,
      user: { uid: 'u1', email: 'ada@cameia.com', displayName: null, emailVerified: false },
    });

    renderVerified('/inicio');
    expect(screen.getByText('Verifica tu correo')).toBeInTheDocument();
  });

  it('no decide mientras la sesión no ha resuelto', async () => {
    await waitUntilReady();
    useAuthStore.setState({ isLoading: true, isAuthenticated: true });

    renderVerified('/inicio');
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument();
  });
});
