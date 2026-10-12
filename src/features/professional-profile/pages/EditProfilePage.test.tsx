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
import { delay, http, HttpResponse } from 'msw';
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

    await user.click(screen.getByRole('button', { name: 'Eliminar React' }));

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

  it('CM-195: un perfil ya activo (COMPLETED) muestra el aviso visible y bloquea el botón', async () => {
    await waitUntilReady();
    setViewportMatches(true);
    const user = userEvent.setup();
    const created = await createProfile();

    const { unmount } = renderPage(created.id);
    await screen.findByRole('heading', { name: 'Editar perfil profesional' });

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
    await user.click(finishButton);
    await screen.findByText('Tu perfil ya está activo.');

    // Desmontar y volver a montar simula que la persona vuelve más tarde:
    // `finalizeProfile` nace como una mutación nueva (`isSuccess: false`),
    // así que el aviso de "Tu perfil ya está activo." (ligado a esa
    // mutación) ya no aplica — el que debe aparecer es el de `profile.status
    // === 'COMPLETED'`, que no depende de haber finalizado en esta sesión.
    unmount();
    renderPage(created.id);
    await screen.findByRole('heading', { name: 'Editar perfil profesional' });

    // Dos apariciones esperadas: la alerta visible de página y el hint
    // `sr-only` del botón deshabilitado (`aria-describedby`) comparten el
    // mismo texto a propósito — refuerzan el mismo mensaje para quien lee
    // la pantalla y para quien usa un lector de pantalla enfocado en el botón.
    expect(await screen.findAllByText('Este perfil ya está activo.')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Finalizar y Continuar' })).toBeDisabled();
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

/**
 * CM-272 (HU-2.3, `SPEC.md` §3.2 «Alcance de CM-272» y D-J): lo que la
 * PÁGINA hace con el `PATCH` de Información General, porque ahí viven el
 * `useMutation` y la confirmación. Errores resueltos por `code` (puntos 1,
 * `ADR-0008`), confirmación «Cambios guardados.» solo mientras sea cierta
 * (punto 2), guardado por campo que no deshabilita el campo con foco
 * (punto 3) y sin `PATCH` si no hay cambios, salvo «Guardar borrador»
 * (punto 4). Los textos se resuelven con `i18n.t(...)`, no se escriben a
 * mano; las respuestas del servidor se montan con `useHandlers` en cada
 * prueba, sin tocar el handler compartido de `profiles.handlers.ts`.
 */
const KEYS = {
  saved: 'profile:general.confirmacionGuardado',
  nameLabel: 'profile:general.nombre.etiqueta',
  nameRequired: 'profile:general.nombre.errorRequerido',
  summaryLabel: 'profile:general.resumen.etiqueta',
  saveDraft: 'profile:general.guardarBorrador',
  title: 'profile:formulario.titulo',
  foreignProfile: 'errors:codigos.NOT_FOUND',
  activeSummary: 'profile:general.resumen.errorPerfilActivo',
  generic: 'errors:generico',
  network: 'errors:red',
} as const;

const RAW_SERVER_TEXT = 'Texto crudo del servidor que la pantalla nunca debe mostrar';

/** Espera una ventana corta para poder afirmar que NO ocurrió un `PATCH` (una afirmación negativa necesita dejar pasar el tiempo). */
function settle() {
  return new Promise<void>((resolve) => setTimeout(resolve, 100));
}

/** `ProblemDetail` mínimo que `errorMap.ts` acepta, con el texto crudo que la pantalla no debe renderizar. */
function problem(status: number, extra: Record<string, unknown> = {}) {
  return HttpResponse.json(
    { type: 'about:blank', title: RAW_SERVER_TEXT, status, detail: RAW_SERVER_TEXT, ...extra },
    { status },
  );
}

/**
 * Cuenta los `PATCH` de Información General y los responde 200 como el mock (con espera opcional).
 * Devuelve el handler en vez de instalarlo: `useHandlers` lo llama cada prueba, porque la regla
 * `react-hooks/rules-of-hooks` prohíbe llamar a algo con nombre de hook desde una función auxiliar.
 */
async function spyOnGeneralInfoPatch(profileId: string, holdMs = 0) {
  const current = await httpClient.get<Record<string, unknown>>(`/api/v1/profiles/${profileId}`);
  let calls = 0;
  const handler = http.patch('*/api/v1/profiles/:id', async ({ request }) => {
    calls += 1;
    const body = (await request.json()) as Record<string, unknown>;
    if (holdMs > 0) await delay(holdMs);
    return HttpResponse.json({ ...current, ...body }, { status: 200 });
  });
  return { count: () => calls, handler };
}

async function openEditor(profileId: string) {
  setViewportMatches(true);
  renderPage(profileId);
  await screen.findByRole('heading', { name: i18n.t(KEYS.title) });
}

describe('EditProfilePage · Información General: errores y autoguardado (CM-272)', () => {
  describe('punto 1: errores del PATCH resueltos por code', () => {
    it('un 403 PROFILE_NOT_ALLOWED muestra «No encontramos lo que buscabas.» (CA-2.3.11)', async () => {
      await waitUntilReady();
      const user = userEvent.setup();
      useHandlers(
        http.patch('*/api/v1/profiles/:id', () => problem(403, { code: 'PROFILE_NOT_ALLOWED' })),
      );
      const created = await createProfile();
      await openEditor(created.id);

      await user.click(screen.getByRole('button', { name: i18n.t(KEYS.saveDraft) }));

      expect(await screen.findByText(i18n.t(KEYS.foreignProfile))).toBeInTheDocument();
      expect(screen.queryByText(RAW_SERVER_TEXT)).not.toBeInTheDocument();
    });

    it('la llave del mensaje de CA-2.3.12 existe en es-CO y en', () => {
      expect(i18n.exists(KEYS.activeSummary, { lng: 'es-CO' })).toBe(true);
      expect(i18n.exists(KEYS.activeSummary, { lng: 'en' })).toBe(true);
    });

    it('un 422 VALIDATION_FAILED con errors[].code SUMMARY_NOT_ALLOWED muestra el mensaje del resumen activo (CA-2.3.12)', async () => {
      await waitUntilReady();
      const user = userEvent.setup();
      useHandlers(
        http.patch('*/api/v1/profiles/:id', () =>
          problem(422, {
            code: 'VALIDATION_FAILED',
            errors: [{ field: 'summary', code: 'SUMMARY_NOT_ALLOWED', message: RAW_SERVER_TEXT }],
          }),
        ),
      );
      const created = await createProfile();
      await openEditor(created.id);

      await user.click(screen.getByRole('button', { name: i18n.t(KEYS.saveDraft) }));

      expect(await screen.findByText(i18n.t(KEYS.activeSummary))).toBeInTheDocument();
      expect(screen.queryByText(RAW_SERVER_TEXT)).not.toBeInTheDocument();
    });

    it.each([
      ['un 403 sin code', 403, {}],
      ['un 403 con un code desconocido', 403, { code: 'ALGO_DESCONOCIDO' }],
      ['un 422 sin code ni errors', 422, {}],
      [
        'un 422 VALIDATION_FAILED con un errors[].code desconocido',
        422,
        { code: 'VALIDATION_FAILED', errors: [{ field: 'summary', code: 'OTRO', message: 'x' }] },
      ],
      [
        'un 422 con errors[] del campo summary pero sin code (sin respaldo por campo)',
        422,
        { errors: [{ field: 'summary', message: 'x' }] },
      ],
      ['un 409 PROFILE_UPDATE_IN_PROGRESS', 409, { code: 'PROFILE_UPDATE_IN_PROGRESS' }],
    ])(
      '%s muestra el mensaje genérico y nunca uno específico (ADR-0008)',
      async (_caso, status, extra) => {
        await waitUntilReady();
        const user = userEvent.setup();
        useHandlers(http.patch('*/api/v1/profiles/:id', () => problem(status, extra)));
        const created = await createProfile();
        await openEditor(created.id);

        await user.click(screen.getByRole('button', { name: i18n.t(KEYS.saveDraft) }));

        expect(await screen.findByText(i18n.t(KEYS.generic))).toBeInTheDocument();
        expect(screen.queryByText(i18n.t(KEYS.foreignProfile))).not.toBeInTheDocument();
        expect(screen.queryByText(i18n.t(KEYS.activeSummary))).not.toBeInTheDocument();
        expect(screen.queryByText(RAW_SERVER_TEXT)).not.toBeInTheDocument();
      },
    );

    it('un fallo de red (no ApiError) muestra errors:red', async () => {
      await waitUntilReady();
      const user = userEvent.setup();
      useHandlers(http.patch('*/api/v1/profiles/:id', () => HttpResponse.error()));
      const created = await createProfile();
      await openEditor(created.id);

      await user.click(screen.getByRole('button', { name: i18n.t(KEYS.saveDraft) }));

      expect(await screen.findByText(i18n.t(KEYS.network))).toBeInTheDocument();
    });
  });

  describe('punto 2: «Cambios guardados.» solo mientras sea cierta (CA-2.3.14)', () => {
    it('tras guardar, salir de un campo con el nombre vacío quita la confirmación y deja el error del campo', async () => {
      await waitUntilReady();
      const user = userEvent.setup();
      const created = await createProfile();
      await openEditor(created.id);
      await user.click(screen.getByRole('button', { name: i18n.t(KEYS.saveDraft) }));
      await screen.findByText(i18n.t(KEYS.saved));

      await user.clear(screen.getByLabelText(i18n.t(KEYS.nameLabel)));
      // Clic en un título no enfocable: el foco sale del formulario entero, que
      // es una salida que el código de hoy ya trata como autoguardado.
      await user.click(screen.getByRole('heading', { name: i18n.t(KEYS.title) }));

      expect(await screen.findByText(i18n.t(KEYS.nameRequired))).toBeInTheDocument();
      expect(screen.queryByText(i18n.t(KEYS.saved))).not.toBeInTheDocument();
    });

    it('tras guardar, editar un campo quita la confirmación', async () => {
      await waitUntilReady();
      const user = userEvent.setup();
      const created = await createProfile();
      await openEditor(created.id);
      await user.click(screen.getByRole('button', { name: i18n.t(KEYS.saveDraft) }));
      await screen.findByText(i18n.t(KEYS.saved));

      await user.type(screen.getByLabelText(i18n.t(KEYS.summaryLabel)), 'Nuevo texto');

      expect(screen.queryByText(i18n.t(KEYS.saved))).not.toBeInTheDocument();
    });

    it('tras guardar, salir de un campo sin cambios conserva la confirmación y no envía PATCH', async () => {
      await waitUntilReady();
      const user = userEvent.setup();
      const created = await createProfile();
      const spy = await spyOnGeneralInfoPatch(created.id);
      useHandlers(spy.handler);
      await openEditor(created.id);
      await user.click(screen.getByRole('button', { name: i18n.t(KEYS.saveDraft) }));
      await screen.findByText(i18n.t(KEYS.saved));
      expect(spy.count()).toBe(1);

      await user.click(screen.getByLabelText(i18n.t(KEYS.nameLabel)));
      await user.click(screen.getByRole('heading', { name: i18n.t(KEYS.title) }));
      await settle();

      expect(spy.count()).toBe(1);
      expect(screen.getByText(i18n.t(KEYS.saved))).toBeInTheDocument();
    });

    it('si un guardado falla, no hay confirmación y sí un mensaje de error', async () => {
      await waitUntilReady();
      const user = userEvent.setup();
      const created = await createProfile();
      await openEditor(created.id);
      await user.click(screen.getByRole('button', { name: i18n.t(KEYS.saveDraft) }));
      await screen.findByText(i18n.t(KEYS.saved));
      useHandlers(http.patch('*/api/v1/profiles/:id', () => problem(500)));

      await user.click(screen.getByRole('button', { name: i18n.t(KEYS.saveDraft) }));

      expect(await screen.findByText(i18n.t(KEYS.generic))).toBeInTheDocument();
      expect(screen.queryByText(i18n.t(KEYS.saved))).not.toBeInTheDocument();
    });
  });

  describe('punto 3: el autoguardado por campo no deshabilita el campo con foco', () => {
    it('el campo que acaba de recibir el foco sigue habilitado y enfocado mientras el PATCH está en curso', async () => {
      await waitUntilReady();
      const user = userEvent.setup();
      const created = await createProfile();
      const spy = await spyOnGeneralInfoPatch(created.id, 400);
      useHandlers(spy.handler);
      await openEditor(created.id);
      const summary = screen.getByLabelText(i18n.t(KEYS.summaryLabel));

      await user.type(screen.getByLabelText(i18n.t(KEYS.nameLabel)), ' Jr.');
      await user.tab();

      // Precondición: sin un PATCH en vuelo esta prueba no mide nada.
      await waitFor(() => expect(spy.count()).toBe(1));
      expect(summary).toHaveFocus();
      expect(summary).toBeEnabled();
    });

    it('lo que el usuario escribe en el campo con foco durante el guardado no se pierde', async () => {
      await waitUntilReady();
      const user = userEvent.setup();
      const created = await createProfile();
      const spy = await spyOnGeneralInfoPatch(created.id, 400);
      useHandlers(spy.handler);
      await openEditor(created.id);
      const summary = screen.getByLabelText(i18n.t(KEYS.summaryLabel));

      await user.type(screen.getByLabelText(i18n.t(KEYS.nameLabel)), ' Jr.');
      await user.tab();
      await waitFor(() => expect(spy.count()).toBe(1));
      await user.keyboard('texto en vuelo');
      await screen.findByText(i18n.t(KEYS.saved));

      expect(summary).toHaveValue('texto en vuelo');
    });
  });

  describe('punto 4: sin cambios, sin PATCH; «Guardar borrador» siempre envía', () => {
    it('«Guardar borrador» envía el PATCH aunque no haya ningún cambio', async () => {
      await waitUntilReady();
      const user = userEvent.setup();
      const created = await createProfile();
      const spy = await spyOnGeneralInfoPatch(created.id);
      useHandlers(spy.handler);
      await openEditor(created.id);

      await user.click(screen.getByRole('button', { name: i18n.t(KEYS.saveDraft) }));

      await screen.findByText(i18n.t(KEYS.saved));
      expect(spy.count()).toBe(1);
    });
  });
});
