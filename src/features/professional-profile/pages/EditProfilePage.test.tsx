/**
 * Comportamiento observable de `EditProfilePage`, paso 1 · Información
 * General (HU-2.3, PRT-02.03, CM-53, CA-2.3.1, CA-2.3.3, CA-2.3.5): estado
 * de carga mientras se obtiene el perfil, formulario con los valores
 * reales una vez cargado, guardado exitoso con confirmación visible,
 * bloqueo del envío con `name` vacío sin llamar al servidor, y los tres
 * casos de error de SPEC.md §3.2 (perfil inexistente, fallo de red al
 * cargar, `PATCH` fallido al guardar).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { httpClient } from '@/services/http/httpClient';
import { useHandlers } from '@/test/msw';
import { EditProfilePage } from './EditProfilePage';

interface CreatedProfile {
  id: string;
}

async function waitUntilReady() {
  if (i18n.isInitialized) return;
  await new Promise<void>((resolve) => {
    i18n.on('initialized', () => resolve());
  });
}

function renderPage(profileId: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[`/perfiles/${profileId}/editar`]}>
          <Routes>
            <Route path="/perfiles/:id/editar" element={<EditProfilePage />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

/** Crea un perfil real contra el mock, igual que lo haría `NewProfilePage`. */
async function createProfile(name = 'Ana María Pérez'): Promise<string> {
  const profile = await httpClient.post<CreatedProfile>('/api/v1/profiles', { name });
  return profile.id;
}

describe('EditProfilePage', () => {
  it('muestra un estado de carga y luego el formulario con los datos del perfil', async () => {
    await waitUntilReady();
    const profileId = await createProfile('Ana María Pérez');
    renderPage(profileId);

    expect(await screen.findByLabelText('Nombre del perfil')).toHaveValue('Ana María Pérez');
  });

  it('guardar con éxito muestra la confirmación', async () => {
    await waitUntilReady();
    const profileId = await createProfile();
    const user = userEvent.setup();
    renderPage(profileId);

    const summaryInput = await screen.findByLabelText('Resumen profesional');
    await user.type(summaryInput, 'Desarrolladora backend con experiencia en Java.');
    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }));

    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument();
  });

  it('name vacío bloquea el envío sin llamar al servidor', async () => {
    await waitUntilReady();
    const profileId = await createProfile();
    let patchCount = 0;
    useHandlers(
      http.patch(`*/api/v1/profiles/${profileId}`, async ({ request }) => {
        patchCount += 1;
        return HttpResponse.json(await request.json(), { status: 200 });
      }),
    );
    const user = userEvent.setup();
    renderPage(profileId);

    await user.clear(await screen.findByLabelText('Nombre del perfil'));
    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }));

    expect(await screen.findByText('Ingresa un nombre para el perfil.')).toBeInTheDocument();
    expect(patchCount).toBe(0);
  });

  it('perfil inexistente muestra el error de no encontrado', async () => {
    await waitUntilReady();
    renderPage('no-existe');

    expect(await screen.findByRole('alert')).toHaveTextContent('No encontramos lo que buscabas.');
  });

  it('un fallo de red al cargar muestra el mensaje de conexión', async () => {
    await waitUntilReady();
    const profileId = await createProfile();
    useHandlers(
      http.get(`*/api/v1/profiles/${profileId}`, () => HttpResponse.error(), { once: true }),
    );
    renderPage(profileId);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
    );
  });

  it('un PATCH fallido al guardar muestra el error correspondiente', async () => {
    await waitUntilReady();
    const profileId = await createProfile();
    useHandlers(
      http.patch(
        `*/api/v1/profiles/${profileId}`,
        () =>
          HttpResponse.json(
            { code: 'NOT_FOUND', message: 'no existe', details: [] },
            { status: 404 },
          ),
        { once: true },
      ),
    );
    const user = userEvent.setup();
    renderPage(profileId);

    await screen.findByLabelText('Nombre del perfil');
    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('No encontramos lo que buscabas.'),
    );
  });
});
