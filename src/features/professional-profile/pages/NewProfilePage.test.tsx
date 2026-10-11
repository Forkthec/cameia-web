/**
 * Comportamiento observable de `NewProfilePage` (HU-2.2, PRT-02.02, backlog
 * 12092026_01 CA-2.2.1): que muestra el título y las dos tarjetas, que la
 * tarjeta de IA nunca navega (deshabilitada, Sprint 2), que tocar "Llenado
 * Manual" crea el perfil sin cuerpo y navega al formulario con el id
 * devuelto, que dos toques seguidos no crean dos perfiles (guarda contra
 * doble creación — el Plan Gratis permite uno solo, consulta C-03), que un
 * fallo de red muestra `errors:generico` y permite reintentar, que el grupo
 * expone su nombre accesible, que el cupo agotado se reconoce por `code`
 * (CM-298, `ADR-0008`) y no se confunde con `PROFILE_CREATION_IN_PROGRESS`
 * (mensaje propio) ni con un 409 sin `code` (mensaje genérico), y que la
 * pantalla no tiene ningún campo de
 * texto (CA-2.2.1: el perfil se crea vacío, el nombre se fija después por
 * PATCH en HU-2.3). No prueba el guard de sesión: `RequireAuth` vive en
 * `app` y esta feature no puede importarlo (docs/ARCHITECTURE.md §4); esa
 * cobertura está en `app/router/index.test.tsx`, sobre el árbol de rutas
 * real.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes, useParams } from 'react-router';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { useUiPreferencesStore } from '@/stores/uiPreferences.store';
import { useHandlers } from '@/test/msw';
import { NewProfilePage } from './NewProfilePage';

async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

function EditProfileStub() {
  const { id } = useParams();
  return <p>Editar perfil {id}</p>;
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/perfiles/nuevo']}>
          <Routes>
            <Route path="/perfiles/nuevo" element={<NewProfilePage />} />
            <Route path="/perfiles/:id/editar" element={<EditProfileStub />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('NewProfilePage', () => {
  it('renderiza el título y las dos tarjetas con sus textos', async () => {
    await waitUntilReady();
    renderPage();

    expect(
      await screen.findByRole('heading', { name: '¿Cómo quieres completarlo?' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Llenado Manual')).toBeInTheDocument();
    expect(screen.getByText('Autocompletar con IA')).toBeInTheDocument();
  });

  it('la tarjeta de IA está deshabilitada y no navega', async () => {
    await waitUntilReady();
    const user = userEvent.setup();
    renderPage();

    const aiCard = await screen.findByRole('radio', { name: /Autocompletar con IA/ });
    await user.click(aiCard);

    expect(screen.queryByText(/Editar perfil/)).not.toBeInTheDocument();
  });

  it('tocar Llenado Manual crea el perfil y navega al formulario con el id devuelto', async () => {
    await waitUntilReady();
    const user = userEvent.setup();
    renderPage();

    const manualCard = await screen.findByRole('radio', { name: /Llenado Manual/ });
    await user.click(manualCard);

    // "profile-1": resetProfiles() corre en el beforeEach global de
    // src/test/setup.ts, así que el primer perfil creado en esta prueba
    // siempre tiene este id, sin importar el orden de ejecución del archivo.
    expect(await screen.findByText('Editar perfil profile-1')).toBeInTheDocument();
  });

  it('dos toques seguidos producen una sola petición y una sola navegación', async () => {
    await waitUntilReady();
    let requestCount = 0;
    useHandlers(
      http.post('*/api/v1/profiles', () => {
        requestCount += 1;
        return HttpResponse.json({ id: 'profile-doble-toque' }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    renderPage();

    const manualCard = await screen.findByRole('radio', { name: /Llenado Manual/ });
    await user.click(manualCard);
    await user.click(manualCard);

    expect(await screen.findByText('Editar perfil profile-doble-toque')).toBeInTheDocument();
    expect(requestCount).toBe(1);
  });

  it('si la creación falla muestra el error genérico y el siguiente toque reintenta', async () => {
    await waitUntilReady();
    useHandlers(
      http.post(
        '*/api/v1/profiles',
        () =>
          HttpResponse.json(
            { code: 'UNKNOWN_ERROR', message: 'falla', details: [] },
            { status: 500 },
          ),
        { once: true },
      ),
    );
    const user = userEvent.setup();
    renderPage();

    const manualCard = await screen.findByRole('radio', { name: /Llenado Manual/ });
    await user.click(manualCard);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ocurrió un error. Inténtalo de nuevo.',
    );

    await user.click(manualCard);
    expect(await screen.findByText('Editar perfil profile-1')).toBeInTheDocument();
  });

  it('CM-195: tocar Llenado Manual guarda el id en lastUsedProfileId', async () => {
    await waitUntilReady();
    const user = userEvent.setup();
    renderPage();

    const manualCard = await screen.findByRole('radio', { name: /Llenado Manual/ });
    await user.click(manualCard);

    await screen.findByText('Editar perfil profile-1');
    expect(useUiPreferencesStore.getState().lastUsedProfileId).toBe('profile-1');
  });

  it('CM-195: con lastUsedProfileId ya guardado, redirige de inmediato sin mostrar el selector', async () => {
    await waitUntilReady();
    useUiPreferencesStore.setState({ lastUsedProfileId: 'profile-existente' });
    renderPage();

    expect(await screen.findByText('Editar perfil profile-existente')).toBeInTheDocument();
    expect(screen.queryByText('¿Cómo quieres completarlo?')).not.toBeInTheDocument();
  });

  it('CA-2.2.3: con el cupo agotado hoy (409 PROFILE_LIMIT_REACHED) muestra el mensaje del plan, no crea perfil y no navega', async () => {
    await waitUntilReady();
    useHandlers(
      http.post(
        '*/api/v1/profiles',
        () =>
          HttpResponse.json(
            {
              type: 'about:blank',
              title: 'Conflicto',
              status: 409,
              // Distinto del texto esperado a propósito: el mensaje sale del catálogo
              // i18n, no del `detail` del backend (CLAUDE.md §8, SPEC §3.1).
              detail: 'detalle del servidor',
              code: 'PROFILE_LIMIT_REACHED',
              errors: [],
            },
            { status: 409 },
          ),
        { once: true },
      ),
    );
    const user = userEvent.setup();
    renderPage();

    const manualCard = await screen.findByRole('radio', { name: /Llenado Manual/ });
    await user.click(manualCard);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu Plan Free permite 1 Perfil Profesional.',
    );
    expect(screen.queryByText(/Editar perfil/)).not.toBeInTheDocument();
    expect(useUiPreferencesStore.getState().lastUsedProfileId).toBeNull();
  });

  it('CA-2.2.3: con el cupo agotado mañana (403 PLAN_LIMIT) muestra el mismo mensaje, no crea perfil y no navega', async () => {
    await waitUntilReady();
    useHandlers(
      http.post(
        '*/api/v1/profiles',
        () =>
          HttpResponse.json(
            {
              type: 'about:blank',
              title: 'Prohibido',
              status: 403,
              detail: 'detalle del servidor',
              code: 'PLAN_LIMIT',
              errors: [],
            },
            { status: 403 },
          ),
        { once: true },
      ),
    );
    const user = userEvent.setup();
    renderPage();

    const manualCard = await screen.findByRole('radio', { name: /Llenado Manual/ });
    await user.click(manualCard);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Tu Plan Free permite 1 Perfil Profesional.',
    );
    expect(screen.queryByText(/Editar perfil/)).not.toBeInTheDocument();
    expect(useUiPreferencesStore.getState().lastUsedProfileId).toBeNull();
  });

  it('CM-298: con 409 PROFILE_CREATION_IN_PROGRESS muestra el mensaje de creación en curso, no el del cupo, no navega y no guarda lastUsedProfileId', async () => {
    await waitUntilReady();
    useHandlers(
      http.post(
        '*/api/v1/profiles',
        () =>
          HttpResponse.json(
            {
              type: 'about:blank',
              title: 'Conflicto',
              status: 409,
              // Distinto del texto esperado a propósito: el mensaje sale del catálogo
              // i18n, no del `detail` del backend (CLAUDE.md §8).
              detail: 'detalle del servidor',
              code: 'PROFILE_CREATION_IN_PROGRESS',
              errors: [],
            },
            { status: 409 },
          ),
        { once: true },
      ),
    );
    const user = userEvent.setup();
    renderPage();

    const manualCard = await screen.findByRole('radio', { name: /Llenado Manual/ });
    await user.click(manualCard);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(
      'Estamos creando tu perfil. Inténtalo de nuevo en unos segundos.',
    );
    expect(alert).not.toHaveTextContent('Tu Plan Free permite 1 Perfil Profesional.');
    expect(screen.queryByText(/Editar perfil/)).not.toBeInTheDocument();
    expect(useUiPreferencesStore.getState().lastUsedProfileId).toBeNull();
  });

  it('CM-298: con un 409 sin code muestra el mensaje genérico, no el del cupo', async () => {
    await waitUntilReady();
    useHandlers(
      http.post(
        '*/api/v1/profiles',
        () =>
          HttpResponse.json(
            {
              type: 'about:blank',
              title: 'Conflicto',
              status: 409,
              detail: 'detalle del servidor',
              errors: [],
            },
            { status: 409 },
          ),
        { once: true },
      ),
    );
    const user = userEvent.setup();
    renderPage();

    const manualCard = await screen.findByRole('radio', { name: /Llenado Manual/ });
    await user.click(manualCard);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Ocurrió un error. Inténtalo de nuevo.');
    expect(alert).not.toHaveTextContent('Tu Plan Free permite 1 Perfil Profesional.');
    expect(screen.queryByText(/Editar perfil/)).not.toBeInTheDocument();
    expect(useUiPreferencesStore.getState().lastUsedProfileId).toBeNull();
  });

  it('expone un radiogroup con el nombre accesible del método de configuración', async () => {
    await waitUntilReady();
    renderPage();

    expect(
      await screen.findByRole('radiogroup', { name: 'Método de configuración del perfil' }),
    ).toBeInTheDocument();
  });

  it('no tiene ningún campo de texto: el perfil se crea sin nombre', async () => {
    await waitUntilReady();
    renderPage();

    await screen.findByRole('radiogroup');
    expect(screen.queryAllByRole('textbox')).toHaveLength(0);
  });
});
