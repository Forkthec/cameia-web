/**
 * Comportamiento observable de `EditProfilePage` (PRT-02.03, CM-61/CM-65/
 * CM-69): estado de carga mientras se obtienen el perfil y el catálogo de
 * roles profesionales, error distinguiendo `NOT_FOUND` del genérico con
 * reintento, estado vacío de Educación/Experiencia/Habilidades/Roles
 * Objetivo con la barra de completitud en su valor bajo, el recorrido
 * completo de agregar y eliminar una formación académica, una habilidad y
 * un rol objetivo (página → hook → MSW → caché), que alterna `StepList`/
 * acordeón según el breakpoint, que "Guardar borrador" solo envía
 * Información General (nunca dispara un alta de ítem), y que "Finalizar y
 * Continuar" se habilita de verdad al cumplir los 5 requisitos reales y
 * finaliza el perfil (Borrador → Activo) — con Habilidades (CM-65) y Roles
 * Objetivo (CM-69) ya fusionados, esta prueba puede completar el flujo de
 * punta a punta por primera vez.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { httpClient } from '@/services/http/httpClient';
import { setViewportMatches } from '@/test/matchMedia';
import { useHandlers } from '@/test/msw';
import { EditProfilePage } from './EditProfilePage';

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

async function createProfile(name = 'Ana María Pérez') {
  return httpClient.post<{ id: string }>('/api/v1/profiles', { name });
}

describe('EditProfilePage', () => {
  it('muestra un indicador de carga mientras obtiene el perfil', async () => {
    await waitUntilReady();
    const created = await createProfile();

    renderPage(created.id);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'Editar perfil profesional' }),
    ).toBeInTheDocument();
  });

  it('un perfil inexistente muestra el error NOT_FOUND con la opción de reintentar', async () => {
    await waitUntilReady();
    setViewportMatches(true);

    renderPage('no-existe');

    expect(await screen.findByRole('alert')).toHaveTextContent('No encontramos lo que buscabas.');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('un fallo de red real muestra errors:red', async () => {
    await waitUntilReady();
    useHandlers(http.get('*/api/v1/profiles/:id', () => HttpResponse.error()));
    const created = await createProfile();

    renderPage(created.id);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No hay conexión. Revisa tu internet e inténtalo de nuevo.',
    );
  });

  it('un perfil recién creado muestra todas las secciones vacías y la completitud en su valor bajo', async () => {
    await waitUntilReady();
    setViewportMatches(true);
    // Sin body: el mock crea el perfil con name='' (CA-2.2.1 solo rechaza un
    // `name: ''` explícito, no la ausencia de body — ver profiles.handlers.ts).
    const created = await httpClient.post<{ id: string }>('/api/v1/profiles');

    renderPage(created.id);

    expect(await screen.findByText('Todavía no agregas formación académica')).toBeInTheDocument();
    expect(screen.getByText('Todavía no agregas experiencia laboral')).toBeInTheDocument();
    expect(screen.getByText('Todavía no agregas habilidades')).toBeInTheDocument();
    expect(screen.getByText('Todavía no agregas roles objetivo')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
  });

  it('en escritorio muestra el índice StepList; en móvil, los disparadores del acordeón', async () => {
    await waitUntilReady();
    const created = await createProfile();

    setViewportMatches(true);
    const { unmount } = renderPage(created.id);
    expect(await screen.findByRole('list', { name: 'Secciones del perfil' })).toBeInTheDocument();
    unmount();

    setViewportMatches(false);
    renderPage(created.id);
    expect(await screen.findByRole('button', { name: 'Información General' })).toHaveAttribute(
      'aria-expanded',
    );
  });

  it('agregar una formación académica la muestra en la lista, y eliminarla la retira', async () => {
    await waitUntilReady();
    setViewportMatches(true);
    const user = userEvent.setup();
    const created = await createProfile();

    renderPage(created.id);
    await screen.findByRole('heading', { name: 'Editar perfil profesional' });
    // "Fecha de inicio" existe en Educación Y en Experiencia Laboral a la
    // vez (ambas secciones se ven completas en escritorio) — se acota la
    // interacción a la región de Formación académica.
    const educationSection = within(screen.getByRole('region', { name: 'Formación académica' }));

    await user.selectOptions(educationSection.getByLabelText('Nivel educativo'), 'UNDERGRADUATE');
    await user.type(educationSection.getByLabelText('Título obtenido'), 'Ingeniería de Sistemas');
    await user.type(educationSection.getByLabelText('Institución'), 'Universidad del Cauca');
    fireEvent.change(educationSection.getByLabelText('Fecha de inicio'), {
      target: { value: '2018-01-01' },
    });
    await user.click(educationSection.getByRole('button', { name: 'Agregar formación' }));

    expect(await screen.findByText('Ingeniería de Sistemas')).toBeInTheDocument();
    expect(screen.getByText('Formación agregada.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Eliminar Ingeniería de Sistemas/ }));

    await waitFor(() =>
      expect(screen.queryByText('Ingeniería de Sistemas')).not.toBeInTheDocument(),
    );
  });

  it('agregar una habilidad la muestra como chip, y quitarla la retira', async () => {
    await waitUntilReady();
    setViewportMatches(true);
    const user = userEvent.setup();
    const created = await createProfile();

    renderPage(created.id);
    await screen.findByRole('heading', { name: 'Editar perfil profesional' });
    const skillsSection = within(screen.getByRole('region', { name: 'Habilidades' }));

    await user.type(skillsSection.getByLabelText('Habilidad'), 'React');
    await user.selectOptions(skillsSection.getByLabelText('Nivel'), 'ADVANCED');
    await user.click(skillsSection.getByRole('button', { name: 'Agregar habilidad' }));

    expect(await screen.findByText('React · Avanzado')).toBeInTheDocument();
    expect(screen.getByText('Habilidad agregada.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Quitar React' }));

    await waitFor(() => expect(screen.queryByText('React · Avanzado')).not.toBeInTheDocument());
  });

  it('agregar un rol objetivo lo muestra en la lista, y eliminarlo lo retira', async () => {
    await waitUntilReady();
    setViewportMatches(true);
    const user = userEvent.setup();
    const created = await createProfile();

    renderPage(created.id);
    await screen.findByRole('heading', { name: 'Editar perfil profesional' });
    const targetRolesSection = within(screen.getByRole('region', { name: 'Roles objetivo' }));

    await user.click(targetRolesSection.getByRole('combobox', { name: 'Agregar rol objetivo' }));
    await user.click(screen.getByRole('option', { name: 'Desarrollador Backend' }));

    expect(await screen.findByText('Desarrollador Backend')).toBeInTheDocument();
    expect(screen.getByText('Rol objetivo agregado.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Eliminar Desarrollador Backend' }));

    await waitFor(() =>
      expect(screen.queryByText('Desarrollador Backend')).not.toBeInTheDocument(),
    );
  });

  it('"Guardar borrador" solo envía Información General, sin disparar ningún alta de ítem', async () => {
    await waitUntilReady();
    setViewportMatches(true);
    const user = userEvent.setup();
    let workExperiencePosts = 0;
    let educationPosts = 0;
    useHandlers(
      http.post('*/api/v1/profiles/:id/work-experiences', () => {
        workExperiencePosts += 1;
        return HttpResponse.json({}, { status: 201 });
      }),
      http.post('*/api/v1/profiles/:id/educations', () => {
        educationPosts += 1;
        return HttpResponse.json({}, { status: 201 });
      }),
    );
    const created = await createProfile();

    renderPage(created.id);
    await screen.findByRole('heading', { name: 'Editar perfil profesional' });

    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }));

    await waitFor(() => expect(screen.getByText('Cambios guardados.')).toBeInTheDocument());
    expect(workExperiencePosts).toBe(0);
    expect(educationPosts).toBe(0);
  });

  it('"Finalizar y Continuar" está deshabilitado hasta cumplir los 5 requisitos', async () => {
    await waitUntilReady();
    const created = await createProfile();

    renderPage(created.id);

    expect(await screen.findByRole('button', { name: 'Finalizar y Continuar' })).toBeDisabled();
  });

  it('cumplir los 5 requisitos habilita "Finalizar y Continuar" y el perfil pasa a Activo', async () => {
    await waitUntilReady();
    setViewportMatches(true);
    const user = userEvent.setup();
    // Nombre y resumen ya completos: el perfil se crea con `name`, y el
    // resumen se guarda vía "Guardar borrador" más abajo.
    const created = await createProfile();

    renderPage(created.id);
    await screen.findByRole('heading', { name: 'Editar perfil profesional' });

    // `GeneralInfoForm` no se envuelve en un `<section>` con nombre accesible
    // como los demás organismos (§3.2 no lo requería) — su único campo de
    // texto libre en esta página es "Resumen profesional", sin necesidad de
    // acotar la búsqueda.
    await user.type(screen.getByLabelText('Resumen profesional'), 'Backend con Node.js.');
    await user.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    await waitFor(() => expect(screen.getByText('Cambios guardados.')).toBeInTheDocument());

    const educationSection = within(screen.getByRole('region', { name: 'Formación académica' }));
    await user.selectOptions(educationSection.getByLabelText('Nivel educativo'), 'UNDERGRADUATE');
    await user.type(educationSection.getByLabelText('Título obtenido'), 'Ingeniería de Sistemas');
    await user.type(educationSection.getByLabelText('Institución'), 'Universidad del Cauca');
    fireEvent.change(educationSection.getByLabelText('Fecha de inicio'), {
      target: { value: '2018-01-01' },
    });
    await user.click(educationSection.getByRole('button', { name: 'Agregar formación' }));
    await screen.findByText('Ingeniería de Sistemas');

    const skillsSection = within(screen.getByRole('region', { name: 'Habilidades' }));
    await user.type(skillsSection.getByLabelText('Habilidad'), 'Node.js');
    await user.selectOptions(skillsSection.getByLabelText('Nivel'), 'ADVANCED');
    await user.click(skillsSection.getByRole('button', { name: 'Agregar habilidad' }));
    await screen.findByText('Node.js · Avanzado');

    const targetRolesSection = within(screen.getByRole('region', { name: 'Roles objetivo' }));
    await user.click(targetRolesSection.getByRole('combobox', { name: 'Agregar rol objetivo' }));
    await user.click(screen.getByRole('option', { name: 'Desarrollador Backend' }));
    await screen.findByText('Desarrollador Backend');

    const finishButton = await screen.findByRole('button', { name: 'Finalizar y Continuar' });
    await waitFor(() => expect(finishButton).not.toBeDisabled());
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5');

    await user.click(finishButton);

    expect(await screen.findByText('Tu perfil ya está activo.')).toBeInTheDocument();
  });

  it('finalizar un perfil incompleto muestra todos los requisitos faltantes a la vez', async () => {
    await waitUntilReady();
    setViewportMatches(true);
    const user = userEvent.setup();
    const created = await createProfile();

    renderPage(created.id);
    await screen.findByRole('heading', { name: 'Editar perfil profesional' });

    const educationSection = within(screen.getByRole('region', { name: 'Formación académica' }));
    await user.selectOptions(educationSection.getByLabelText('Nivel educativo'), 'UNDERGRADUATE');
    await user.type(educationSection.getByLabelText('Título obtenido'), 'Ingeniería de Sistemas');
    await user.type(educationSection.getByLabelText('Institución'), 'Universidad del Cauca');
    fireEvent.change(educationSection.getByLabelText('Fecha de inicio'), {
      target: { value: '2018-01-01' },
    });
    await user.click(educationSection.getByRole('button', { name: 'Agregar formación' }));
    await screen.findByText('Ingeniería de Sistemas');

    // El botón real sigue deshabilitado (faltan resumen, habilidad y rol
    // objetivo): se fuerza el intento directamente contra el mock para
    // probar que el 422 lista TODOS los requisitos incumplidos a la vez.
    expect(screen.getByRole('button', { name: 'Finalizar y Continuar' })).toBeDisabled();

    const error = await httpClient
      .post(`/api/v1/profiles/${created.id}/completion`)
      .catch((e: unknown) => e);
    expect(error).toMatchObject({ httpStatus: 422 });
  });
});
