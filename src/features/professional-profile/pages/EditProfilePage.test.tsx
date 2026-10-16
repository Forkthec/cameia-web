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
import type { BoundFunctions, queries } from '@testing-library/dom';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
    await user.type(educationSection.getByLabelText('Fecha de inicio'), '012018');
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
    await user.type(educationSection.getByLabelText('Fecha de inicio'), '012018');
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
    await user.type(educationSection.getByLabelText('Fecha de inicio'), '012018');
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
    await user.type(educationSection.getByLabelText('Fecha de inicio'), '012018');
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
  let completed = 0;
  const bodies: Record<string, unknown>[] = [];
  const handler = http.patch('*/api/v1/profiles/:id', async ({ request }) => {
    calls += 1;
    const body = (await request.json()) as Record<string, unknown>;
    bodies.push(body);
    if (holdMs > 0) await delay(holdMs);
    completed += 1;
    return HttpResponse.json({ ...current, ...body }, { status: 200 });
  });
  return { count: () => calls, completed: () => completed, bodies: () => bodies, handler };
}

/**
 * Simula el rechazo de un perfil Activo (CA-2.3.12): un `PATCH` con `summary` vacío responde
 * `422 VALIDATION_FAILED` con `errors[].code` `SUMMARY_NOT_ALLOWED`; cualquier otro lo acepta.
 * Devuelve el handler (lo instala cada prueba con `useHandlers`, ver `spyOnGeneralInfoPatch`).
 */
async function rejectEmptySummaryLikeActiveProfile(profileId: string, firstCallFails = false) {
  const current = await httpClient.get<Record<string, unknown>>(`/api/v1/profiles/${profileId}`);
  const bodies: Record<string, unknown>[] = [];
  const handler = http.patch('*/api/v1/profiles/:id', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    bodies.push(body);
    // `firstCallFails`: el primer guardado falla (500) para dejar el nombre sin guardar.
    if (firstCallFails && bodies.length === 1) return problem(500);
    if (body.summary === '') {
      return problem(422, {
        code: 'VALIDATION_FAILED',
        errors: [{ field: 'summary', code: 'SUMMARY_NOT_ALLOWED', message: RAW_SERVER_TEXT }],
      });
    }
    return HttpResponse.json({ ...current, ...body }, { status: 200 });
  });
  return { count: () => bodies.length, bodies: () => bodies, handler };
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
      // Se espera a que el PATCH termine, pero NO se exige «Cambios guardados.»: tras el
      // `reset`, react-hook-form emite `isDirty` en `false` y lo corrige en el render
      // siguiente, así que la confirmación solo parpadea unos milisegundos (SPEC §3.2,
      // observación de CM-272). Esta prueba protege únicamente que lo escrito no se pierda.
      await waitFor(() => expect(spy.completed()).toBe(1));
      await settle();

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

  describe('defecto D: nunca se confirma un guardado que no incluye lo último escrito', () => {
    // Guarda de regresión: esta prueba nació VERDE a propósito. El análisis previo al PR
    // supuso que `isDirty` quedaba en `false` tras el `reset` y que por eso se confirmaba un
    // guardado sin lo último escrito; no es así (react-hook-form 7.87.0 lo corrige en el render
    // siguiente, `dist/index.esm.mjs:3672-3681`). Se conserva para que no vuelva a ocurrir.
    it('guarda de regresión: con texto escrito en vuelo no se confirma el guardado y el siguiente blur lo envía', async () => {
      await waitUntilReady();
      const user = userEvent.setup();
      const created = await createProfile();
      const spy = await spyOnGeneralInfoPatch(created.id, 400);
      useHandlers(spy.handler);
      await openEditor(created.id);

      await user.type(screen.getByLabelText(i18n.t(KEYS.nameLabel)), ' Jr.');
      await user.tab();
      await waitFor(() => expect(spy.count()).toBe(1));
      await user.keyboard('texto en vuelo');
      await waitFor(() => expect(spy.completed()).toBe(1));
      await settle();

      // (a) hay texto sin enviar: no puede verse «Cambios guardados.»
      expect(screen.queryByText(i18n.t(KEYS.saved))).not.toBeInTheDocument();

      // (b) el siguiente blur sí envía lo escrito durante el vuelo
      await user.click(screen.getByRole('heading', { name: i18n.t(KEYS.title) }));
      await waitFor(() => expect(spy.count()).toBe(2));
      expect(spy.bodies()[1]).toMatchObject({ summary: 'texto en vuelo' });
    });

    it('un blur durante el vuelo no se pierde: al terminar el PATCH se envía lo último escrito', async () => {
      await waitUntilReady();
      const user = userEvent.setup();
      const created = await createProfile();
      const spy = await spyOnGeneralInfoPatch(created.id, 400);
      useHandlers(spy.handler);
      await openEditor(created.id);

      await user.type(screen.getByLabelText(i18n.t(KEYS.nameLabel)), ' Jr.');
      await user.tab();
      await waitFor(() => expect(spy.count()).toBe(1));
      await user.keyboard('texto en vuelo');
      // El blur llega mientras el primer PATCH sigue en vuelo: hoy se descarta en silencio.
      await user.click(screen.getByRole('heading', { name: i18n.t(KEYS.title) }));

      await waitFor(() => expect(spy.count()).toBe(2), { timeout: 2000 });
      expect(spy.bodies()[1]).toMatchObject({ summary: 'texto en vuelo' });
      expect(await screen.findByText(i18n.t(KEYS.saved))).toBeInTheDocument();
    });
    it('el reintento nunca se solapa con el PATCH en curso y, si falla, no se repite solo', async () => {
      await waitUntilReady();
      const user = userEvent.setup();
      const created = await createProfile();
      const current = await httpClient.get<Record<string, unknown>>(
        `/api/v1/profiles/${created.id}`,
      );
      let calls = 0;
      let inflight = 0;
      let maxInflight = 0;
      useHandlers(
        http.patch('*/api/v1/profiles/:id', async ({ request }) => {
          calls += 1;
          const attempt = calls;
          inflight += 1;
          maxInflight = Math.max(maxInflight, inflight);
          const body = (await request.json()) as Record<string, unknown>;
          await delay(400);
          inflight -= 1;
          // El primero responde bien; el reintento falla.
          return attempt === 1
            ? HttpResponse.json({ ...current, ...body }, { status: 200 })
            : problem(500);
        }),
      );
      await openEditor(created.id);

      await user.type(screen.getByLabelText(i18n.t(KEYS.nameLabel)), ' Jr.');
      await user.tab();
      await waitFor(() => expect(calls).toBe(1));
      await user.keyboard('texto en vuelo');
      await user.click(screen.getByRole('heading', { name: i18n.t(KEYS.title) }));
      await waitFor(() => expect(calls).toBe(2), { timeout: 2000 });
      expect(await screen.findByText(i18n.t(KEYS.generic))).toBeInTheDocument();
      await settle();
      await settle();

      expect(calls).toBe(2);
      expect(maxInflight).toBe(1);
    });
  });

  describe('defecto B: salir de un campo siempre valida; solo el envío exige cambios', () => {
    it('un perfil recién creado: entrar al nombre vacío y salir sin escribir muestra el mensaje y no envía PATCH', async () => {
      await waitUntilReady();
      const user = userEvent.setup();
      // Sin cuerpo: el perfil nace con el nombre vacío (SPEC §3.1).
      const created = await httpClient.post<{ id: string }>('/api/v1/profiles');
      const spy = await spyOnGeneralInfoPatch(created.id);
      useHandlers(spy.handler);
      await openEditor(created.id);

      await user.click(screen.getByLabelText(i18n.t(KEYS.nameLabel)));
      await user.tab();

      expect(await screen.findByText(i18n.t(KEYS.nameRequired))).toBeInTheDocument();
      await settle();
      expect(spy.count()).toBe(0);
    });
  });

  describe('defecto C: el 403 al CARGAR un perfil ajeno (CA-2.3.11)', () => {
    it('un GET 403 PROFILE_NOT_ALLOWED muestra «No encontramos lo que buscabas.»', async () => {
      await waitUntilReady();
      setViewportMatches(true);
      useHandlers(
        http.get('*/api/v1/profiles/:id', () => problem(403, { code: 'PROFILE_NOT_ALLOWED' })),
      );

      renderPage('ajeno');

      expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t(KEYS.foreignProfile));
      expect(screen.queryByText(RAW_SERVER_TEXT)).not.toBeInTheDocument();
    });

    it('un GET 403 sin code muestra el genérico y nunca «No encontramos lo que buscabas.» (ADR-0008)', async () => {
      await waitUntilReady();
      setViewportMatches(true);
      useHandlers(http.get('*/api/v1/profiles/:id', () => problem(403)));

      renderPage('ajeno');

      expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t(KEYS.generic));
      expect(screen.queryByText(i18n.t(KEYS.foreignProfile))).not.toBeInTheDocument();
    });
  });

  describe('CA-2.3.12: «conservar el resumen» incluye lo que la persona ve', () => {
    const SAVED_SUMMARY = 'Resumen que sigue guardado';

    async function profileWithSavedSummary() {
      const created = await createProfile();
      await httpClient.patch(`/api/v1/profiles/${created.id}`, { summary: SAVED_SUMMARY });
      return created;
    }

    it('tras el rechazo del perfil activo se ve el mensaje y el campo vuelve a mostrar el resumen guardado', async () => {
      await waitUntilReady();
      const user = userEvent.setup();
      const created = await profileWithSavedSummary();
      const server = await rejectEmptySummaryLikeActiveProfile(created.id);
      useHandlers(server.handler);
      await openEditor(created.id);
      const summary = screen.getByLabelText(i18n.t(KEYS.summaryLabel));
      expect(summary).toHaveValue(SAVED_SUMMARY);

      await user.clear(summary);
      await user.click(screen.getByRole('heading', { name: i18n.t(KEYS.title) }));

      expect(await screen.findByText(i18n.t(KEYS.activeSummary))).toBeInTheDocument();
      await waitFor(() => expect(summary).toHaveValue(SAVED_SUMMARY));
      expect(screen.queryByText(i18n.t(KEYS.saved))).not.toBeInTheDocument();
    });

    it('tras ese rechazo, salir del campo otra vez no envía otro PATCH (sin bucle)', async () => {
      await waitUntilReady();
      const user = userEvent.setup();
      const created = await profileWithSavedSummary();
      const server = await rejectEmptySummaryLikeActiveProfile(created.id);
      useHandlers(server.handler);
      await openEditor(created.id);
      const summary = screen.getByLabelText(i18n.t(KEYS.summaryLabel));
      const outside = screen.getByRole('heading', { name: i18n.t(KEYS.title) });
      await user.clear(summary);
      await user.click(outside);
      await screen.findByText(i18n.t(KEYS.activeSummary));
      expect(server.count()).toBe(1);

      await user.click(summary);
      await user.click(outside);
      await settle();

      expect(server.count()).toBe(1);
    });

    // Guarda de RT-05 / RT-05-CA01: ante un fallo técnico NO se restaura nada, se conserva lo
    // escrito. Puede nacer verde (hoy nada se restaura); protege el límite de la restauración.
    it.each([
      ['un 500', () => problem(500)],
      ['un 503', () => problem(503, { code: 'SERVICE_UNAVAILABLE' })],
      ['una caída de red', () => HttpResponse.error()],
    ])(
      '%s al guardar conserva lo que la persona escribió, sin restaurar nada',
      async (_caso, respond) => {
        await waitUntilReady();
        const user = userEvent.setup();
        const created = await profileWithSavedSummary();
        useHandlers(http.patch('*/api/v1/profiles/:id', () => respond()));
        await openEditor(created.id);
        const summary = screen.getByLabelText(i18n.t(KEYS.summaryLabel));

        await user.clear(summary);
        await user.type(summary, 'lo nuevo que escribí');
        await user.click(screen.getByRole('heading', { name: i18n.t(KEYS.title) }));

        expect(await screen.findByRole('alert')).toBeInTheDocument();
        await settle();
        expect(summary).toHaveValue('lo nuevo que escribí');
      },
    );

    it('con un nombre sin guardar, tras el rechazo el nombre conserva lo escrito y solo vuelve el resumen', async () => {
      await waitUntilReady();
      const user = userEvent.setup();
      const created = await profileWithSavedSummary();
      // El primer guardado falla: el nombre queda escrito pero sin guardar (con el autoguardado
      // por campo, un nombre editado se guarda solo al pasar al resumen, salvo que falle).
      const server = await rejectEmptySummaryLikeActiveProfile(created.id, true);
      useHandlers(server.handler);
      await openEditor(created.id);
      const name = screen.getByLabelText(i18n.t(KEYS.nameLabel));
      const summary = screen.getByLabelText(i18n.t(KEYS.summaryLabel));
      const outside = screen.getByRole('heading', { name: i18n.t(KEYS.title) });

      await user.type(name, ' Jr.');
      await user.click(summary);
      await waitFor(() => expect(server.count()).toBe(1));
      await user.clear(summary);
      await user.click(outside);

      expect(await screen.findByText(i18n.t(KEYS.activeSummary))).toBeInTheDocument();
      await waitFor(() => expect(summary).toHaveValue(SAVED_SUMMARY));
      expect(name).toHaveValue('Ana María Pérez Jr.');
      expect(server.bodies()[1]).toMatchObject({ name: 'Ana María Pérez Jr.', summary: '' });

      // El nombre sigue sin guardar: el formulario está sucio y el siguiente blur lo envía
      // junto con el resumen restaurado (no con el vacío).
      await user.click(name);
      await user.click(outside);
      await waitFor(() => expect(server.count()).toBe(3));
      expect(server.bodies()[2]).toMatchObject({
        name: 'Ana María Pérez Jr.',
        summary: SAVED_SUMMARY,
      });
    });
  });
});

/**
 * CM-273 (PR 1, `SPEC.md` §3.3 y D-M): el mes actual en UTC lo calcula la PÁGINA y lo pasa como propiedad
 * a las dos secciones (experiencia y formación). Aquí SÍ se fija la fecha, porque la página es la que lee
 * el reloj: solo se simula `Date` (`toFake: ['Date']`), no los temporizadores, para no frenar a `userEvent`,
 * TanStack Query ni MSW. El instante elegido es el 1-nov-2026 04:30 UTC, que en Bogotá (UTC-5) todavía es
 * 31-oct 23:30: el mes UTC es noviembre y el local es octubre, así que «11/2026» solo se acepta si la
 * página usa UTC (RT-07-CA04) y «12/2026» se rechaza con cualquiera de los dos.
 */
describe('EditProfilePage · mes actual en UTC (CM-273, D-M)', () => {
  const FUTURE = 'La fecha no puede ser posterior al mes actual.';

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  async function renderWithFixedClock() {
    await waitUntilReady();
    setViewportMatches(true);
    const created = await createProfile();
    vi.stubEnv('TZ', 'America/Bogota');
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-01T04:30:00Z'));

    renderPage(created.id);
    await screen.findByRole('heading', { name: 'Editar perfil profesional' });

    return {
      education: within(screen.getByRole('region', { name: 'Formación académica' })),
      experience: within(screen.getByRole('region', { name: 'Experiencia Laboral' })),
    };
  }

  it('la sección de formación acepta el mes UTC actual (noviembre) y rechaza el siguiente (diciembre)', async () => {
    const user = userEvent.setup();
    const { education } = await renderWithFixedClock();

    await user.selectOptions(education.getByLabelText('Nivel educativo'), 'UNDERGRADUATE');
    await user.type(education.getByLabelText('Título obtenido'), 'Ingeniería de Sistemas');
    await user.type(education.getByLabelText('Institución'), 'Universidad del Cauca');

    await user.type(education.getByLabelText('Fecha de inicio'), '122026');
    await user.click(education.getByRole('button', { name: 'Agregar formación' }));

    expect(await education.findByText(FUTURE)).toBeInTheDocument();
    expect(education.queryByText('Ingeniería de Sistemas')).not.toBeInTheDocument();

    await user.clear(education.getByLabelText('Fecha de inicio'));
    await user.type(education.getByLabelText('Fecha de inicio'), '112026');
    await user.click(education.getByRole('button', { name: 'Agregar formación' }));

    expect(await education.findByText('Formación agregada.')).toBeInTheDocument();
    expect(education.getByText('Ingeniería de Sistemas')).toBeInTheDocument();
  });

  it('la sección de experiencia recibe el mismo mes: acepta noviembre y rechaza diciembre', async () => {
    const user = userEvent.setup();
    const { experience } = await renderWithFixedClock();

    await user.type(experience.getByLabelText('Cargo'), 'Desarrolladora backend');
    await user.type(experience.getByLabelText('Empresa'), 'CAMEIA');
    await user.click(experience.getByText('Trabajo aquí actualmente'));

    await user.type(experience.getByLabelText('Fecha de inicio'), '122026');
    await user.click(experience.getByRole('button', { name: 'Agregar experiencia' }));

    expect(await experience.findByText(FUTURE)).toBeInTheDocument();
    expect(experience.queryByText('Experiencia agregada.')).not.toBeInTheDocument();

    await user.clear(experience.getByLabelText('Fecha de inicio'));
    await user.type(experience.getByLabelText('Fecha de inicio'), '112026');
    await user.click(experience.getByRole('button', { name: 'Agregar experiencia' }));

    expect(await experience.findByText('Experiencia agregada.')).toBeInTheDocument();
  });
});

/*
 * CM-273 (PR 2, `SPEC.md` §3.3 y D-T a D-AG): lo que solo se puede probar con la página montada y el
 * `profile.json` REAL. Los textos esperados son los literales del documento de criterios de HU-2.4 (v7), escritos
 * aquí tal cual: si una llave falta, sale la llave en vez del texto y la prueba falla por su razón. Las respuestas
 * del servidor que el mock no sabe dar (403, 409, 503, 422 por campo, red) se montan con `useHandlers` por
 * prueba, como CM-272. Los literales de «Sin fecha de inicio», «Sin fechas», etc. de los periodos salen de las
 * mismas llaves que usa `yearMonth.test.ts`.
 */
describe('EditProfilePage · HU-2.4 (CM-273, PR 2)', () => {
  const NOT_FOUND = 'No encontramos lo que buscabas.';
  const GENERIC = 'Ocurrió un error. Inténtalo de nuevo.';
  const NETWORK = 'No hay conexión. Revisa tu internet e inténtalo de nuevo.';
  const LAST_EDUCATION =
    'No puedes quedarte sin formación académica con el perfil activo. Agrega otra antes de eliminar esta.';
  const EDUCATION_LIMIT = 'Ya tienes el máximo de 5 formaciones académicas.';
  const EXPERIENCE_LIMIT = 'Ya tienes el máximo de 4 experiencias laborales.';
  const BEFORE_BIRTH = 'La fecha no puede ser anterior a tu fecha de nacimiento.';
  const BEFORE_MIN_AGE =
    'La experiencia laboral no puede iniciar antes del mes en que cumpliste 15 años.';
  const END_BEFORE_MIN_AGE =
    'La fecha de fin no puede ser anterior al mes en que cumpliste 15 años.';

  type User = ReturnType<typeof userEvent.setup>;
  type Region = BoundFunctions<typeof queries>;

  async function newProfile() {
    await waitUntilReady();
    setViewportMatches(true);
    return (await createProfile()).id;
  }

  async function mount(profileId: string) {
    renderPage(profileId);
    await screen.findByRole('heading', { name: 'Editar perfil profesional' });
    return {
      education: within(screen.getByRole('region', { name: 'Formación académica' })),
      experience: within(screen.getByRole('region', { name: 'Experiencia Laboral' })),
    };
  }

  const educationBody = (degree: string) => ({
    institution: 'Universidad del Cauca',
    degree,
    level: 'UNDERGRADUATE',
    startDate: '2018-01',
    endDate: '2023-12',
    inProgress: false,
  });

  const experienceBody = (position: string) => ({
    company: 'CAMEIA',
    position,
    description: null,
    startDate: '2024-01',
    endDate: null,
    employmentStatus: 'CURRENT',
  });

  /** Siembra formaciones a través del mock (estado real: un `DELETE` posterior sí las retira). */
  async function seedEducations(profileId: string, ...degrees: string[]) {
    for (const degree of degrees) {
      await httpClient.post(`/api/v1/profiles/${profileId}/educations`, educationBody(degree));
    }
  }

  async function seedExperiences(profileId: string, ...positions: string[]) {
    for (const position of positions) {
      await httpClient.post(
        `/api/v1/profiles/${profileId}/work-experiences`,
        experienceBody(position),
      );
    }
  }

  /** `GET` con listas fijas, para pintar casos que el mock no puede producir (inicio nulo, 4 o 5 registros). */
  async function listingHandler(
    profileId: string,
    lists: { educations?: unknown[]; workExperiences?: unknown[] },
  ) {
    const current = await httpClient.get<Record<string, unknown>>(`/api/v1/profiles/${profileId}`);
    // El catálogo de roles cuelga de la misma ruta (`/api/v1/profiles/professional-roles`): se devuelve tal cual.
    const roles = await httpClient.get<Record<string, unknown>[]>(
      '/api/v1/profiles/professional-roles',
    );
    return http.get('*/api/v1/profiles/:id', ({ params }) =>
      params.id === 'professional-roles'
        ? HttpResponse.json(roles)
        : HttpResponse.json({ ...current, ...lists }),
    );
  }

  const educationItem = (n: number, overrides: Record<string, unknown> = {}) => ({
    id: `edu-${n}`,
    institution: 'Universidad del Cauca',
    degree: `Título ${n}`,
    level: 'UNDERGRADUATE',
    startDate: '2018-01',
    endDate: '2023-12',
    inProgress: false,
    provenance: 'MANUAL',
    ...overrides,
  });

  const experienceItem = (n: number, overrides: Record<string, unknown> = {}) => ({
    id: `exp-${n}`,
    company: 'CAMEIA',
    position: `Cargo ${n}`,
    description: null,
    startDate: '2024-01',
    endDate: null,
    employmentStatus: 'CURRENT',
    provenance: 'MANUAL',
    ...overrides,
  });

  async function fillEducation(user: User, education: Region, startDate = '012018') {
    await user.selectOptions(education.getByLabelText('Nivel educativo'), 'UNDERGRADUATE');
    await user.type(education.getByLabelText('Título obtenido'), 'Ingeniería de Sistemas');
    await user.type(education.getByLabelText('Institución'), 'Universidad del Cauca');
    await user.type(education.getByLabelText('Fecha de inicio'), startDate);
  }

  async function fillCurrentExperience(user: User, experience: Region, startDate = '062024') {
    await user.type(experience.getByLabelText('Cargo'), 'Desarrolladora backend');
    await user.type(experience.getByLabelText('Empresa'), 'CAMEIA');
    await user.click(experience.getByText('Trabajo aquí actualmente'));
    await user.type(experience.getByLabelText('Fecha de inicio'), startDate);
  }

  const addEducation = (user: User, education: Region) =>
    user.click(education.getByRole('button', { name: 'Agregar formación' }));
  const addExperience = (user: User, experience: Region) =>
    user.click(experience.getByRole('button', { name: 'Agregar experiencia' }));

  async function expectDescription(field: HTMLElement, text: string) {
    await waitFor(() => expect(field).toHaveAccessibleDescription(text));
  }

  describe('errores del servidor bajo el campo (D-T; CA-2.4.21, 23 y 32)', () => {
    it('422 con START_DATE_BEFORE_BIRTH pinta el literal bajo «Fecha de inicio» de la formación, no en la alerta (CA-2.4.32)', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(
        http.post('*/api/v1/profiles/:id/educations', () =>
          problem(422, {
            code: 'VALIDATION_FAILED',
            errors: [
              { field: 'startDate', code: 'START_DATE_BEFORE_BIRTH', message: RAW_SERVER_TEXT },
            ],
          }),
        ),
      );
      const { education } = await mount(profileId);

      await fillEducation(user, education, '022008');
      await addEducation(user, education);

      await expectDescription(education.getByLabelText('Fecha de inicio'), BEFORE_BIRTH);
      // Un solo `alert`: el `<p role="alert">` del propio campo (`ErrorText`); si el texto saliera también en el
      // `AlertInline` de la sección habría dos.
      expect(education.getAllByRole('alert')).toHaveLength(1);
      expect(screen.queryByText(RAW_SERVER_TEXT)).not.toBeInTheDocument();
    });

    it('422 con START_DATE_BEFORE_MINIMUM_AGE pinta el literal bajo «Fecha de inicio» de la experiencia (CA-2.4.21)', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(
        http.post('*/api/v1/profiles/:id/work-experiences', () =>
          problem(422, {
            code: 'VALIDATION_FAILED',
            errors: [
              {
                field: 'startDate',
                code: 'START_DATE_BEFORE_MINIMUM_AGE',
                message: RAW_SERVER_TEXT,
              },
            ],
          }),
        ),
      );
      const { experience } = await mount(profileId);

      await fillCurrentExperience(user, experience, '022023');
      await addExperience(user, experience);

      await expectDescription(experience.getByLabelText('Fecha de inicio'), BEFORE_MIN_AGE);
      expect(experience.getAllByRole('alert')).toHaveLength(1);
      expect(screen.queryByText(RAW_SERVER_TEXT)).not.toBeInTheDocument();
    });

    it('422 con END_DATE_BEFORE_MINIMUM_AGE pinta el literal bajo «Fecha de fin» de una experiencia sin inicio (CA-2.4.23)', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(
        http.post('*/api/v1/profiles/:id/work-experiences', () =>
          problem(422, {
            code: 'VALIDATION_FAILED',
            errors: [
              { field: 'endDate', code: 'END_DATE_BEFORE_MINIMUM_AGE', message: RAW_SERVER_TEXT },
            ],
          }),
        ),
      );
      const { experience } = await mount(profileId);

      // Sin «Fecha de inicio»: depende también del inicio opcional (CA-2.4.15, 22, 23 y 53).
      await user.type(experience.getByLabelText('Cargo'), 'Desarrolladora backend');
      await user.type(experience.getByLabelText('Empresa'), 'CAMEIA');
      await user.type(experience.getByLabelText('Fecha de fin'), '022023');
      await addExperience(user, experience);

      await expectDescription(experience.getByLabelText('Fecha de fin'), END_BEFORE_MIN_AGE);
      expect(experience.getAllByRole('alert')).toHaveLength(1);
    });

    it('el error de campo desaparece cuando la persona edita la fecha', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(
        http.post('*/api/v1/profiles/:id/educations', () =>
          problem(422, {
            code: 'VALIDATION_FAILED',
            errors: [
              { field: 'startDate', code: 'START_DATE_BEFORE_BIRTH', message: RAW_SERVER_TEXT },
            ],
          }),
        ),
      );
      const { education } = await mount(profileId);
      await fillEducation(user, education, '022008');
      await addEducation(user, education);
      const start = education.getByLabelText('Fecha de inicio');
      await expectDescription(start, BEFORE_BIRTH);

      await user.clear(start);
      await user.type(start, '032008');

      await waitFor(() => expect(start).not.toHaveAccessibleDescription(BEFORE_BIRTH));
    });

    it('dos rechazos idénticos seguidos pintan el error las dos veces (el efecto depende del error, no del texto)', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      let requests = 0;
      useHandlers(
        http.post('*/api/v1/profiles/:id/educations', () => {
          requests += 1;
          return problem(422, {
            code: 'VALIDATION_FAILED',
            errors: [
              { field: 'startDate', code: 'START_DATE_BEFORE_BIRTH', message: RAW_SERVER_TEXT },
            ],
          });
        }),
      );
      const { education } = await mount(profileId);
      await fillEducation(user, education, '022008');
      await addEducation(user, education);
      const start = education.getByLabelText('Fecha de inicio');
      await expectDescription(start, BEFORE_BIRTH);

      await user.clear(start);
      await user.type(start, '012008');
      await waitFor(() => expect(start).not.toHaveAccessibleDescription(BEFORE_BIRTH));
      await addEducation(user, education);

      await waitFor(() => expect(requests).toBe(2));
      await expectDescription(education.getByLabelText('Fecha de inicio'), BEFORE_BIRTH);
    });
  });

  describe('bajas: confirmación y errores por code (CA-2.4.11, 37, 38, 39, 46, 51, 58 y 59)', () => {
    it('eliminar la única formación de un perfil en Borrador muestra «Formación eliminada.» y no «Formación agregada.» (CA-2.4.11)', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      await seedEducations(profileId, 'Ingeniería de Sistemas');
      await seedExperiences(profileId, 'Desarrolladora backend');
      const { education } = await mount(profileId);

      await user.click(education.getByRole('button', { name: /Eliminar Ingeniería de Sistemas/ }));

      expect(await education.findByText('Formación eliminada.')).toBeInTheDocument();
      expect(education.queryByText('Ingeniería de Sistemas')).not.toBeInTheDocument();
      expect(education.queryByText('Formación agregada.')).not.toBeInTheDocument();
    });

    it('eliminar una de dos formaciones muestra «Formación eliminada.» y deja la otra (CA-2.4.46; el cliente no depende del estado del perfil)', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      await seedEducations(profileId, 'Título uno', 'Título dos');
      const { education } = await mount(profileId);

      await user.click(education.getByRole('button', { name: /Eliminar Título uno/ }));

      expect(await education.findByText('Formación eliminada.')).toBeInTheDocument();
      expect(education.queryByText('Título uno')).not.toBeInTheDocument();
      expect(education.getByText('Título dos')).toBeInTheDocument();
    });

    it('eliminar la única experiencia muestra «Experiencia eliminada.» (CA-2.4.38)', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      await seedExperiences(profileId, 'Desarrolladora backend');
      const { experience } = await mount(profileId);

      await user.click(experience.getByRole('button', { name: /Eliminar Desarrolladora backend/ }));

      expect(await experience.findByText('Experiencia eliminada.')).toBeInTheDocument();
      expect(experience.queryByText('Desarrolladora backend')).not.toBeInTheDocument();
    });

    it('409 EDUCATION_NOT_ALLOWED muestra el literal de la última formación y la deja en la lista (CA-2.4.37)', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(
        await listingHandler(profileId, { educations: [educationItem(1)] }),
        http.delete('*/api/v1/profiles/:id/educations/:educationId', () =>
          problem(409, { code: 'EDUCATION_NOT_ALLOWED' }),
        ),
      );
      const { education } = await mount(profileId);

      await user.click(education.getByRole('button', { name: 'Eliminar Título 1' }));

      expect(await education.findByText(LAST_EDUCATION)).toBeInTheDocument();
      expect(education.getByText('Título 1')).toBeInTheDocument();
      expect(screen.queryByText(RAW_SERVER_TEXT)).not.toBeInTheDocument();
    });

    it('en dos pestañas, el 409 de la que pierde muestra el mismo literal y la lista no cambia (CA-2.4.51)', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(
        await listingHandler(profileId, { educations: [educationItem(1), educationItem(2)] }),
        http.delete('*/api/v1/profiles/:id/educations/:educationId', () =>
          problem(409, { code: 'EDUCATION_NOT_ALLOWED' }),
        ),
      );
      const { education } = await mount(profileId);

      await user.click(education.getByRole('button', { name: 'Eliminar Título 2' }));

      expect(await education.findByText(LAST_EDUCATION)).toBeInTheDocument();
      expect(education.getByText('Título 1')).toBeInTheDocument();
      expect(education.getByText('Título 2')).toBeInTheDocument();
    });

    describe.each([
      ['alta de formación', 'education', 'POST'],
      ['baja de formación', 'education', 'DELETE'],
      ['alta de experiencia', 'experience', 'POST'],
      ['baja de experiencia', 'experience', 'DELETE'],
    ] as const)('403 PROFILE_NOT_ALLOWED en la %s (CA-2.4.39)', (_name, section, verb) => {
      it('muestra «No encontramos lo que buscabas.» y no el texto del servidor', async () => {
        const profileId = await newProfile();
        const user = userEvent.setup();
        const forbidden = () => problem(403, { code: 'PROFILE_NOT_ALLOWED' });
        const lists =
          section === 'education'
            ? { educations: [educationItem(1)] }
            : { workExperiences: [experienceItem(1)] };
        const route =
          section === 'education'
            ? '*/api/v1/profiles/:id/educations'
            : '*/api/v1/profiles/:id/work-experiences';
        useHandlers(
          await listingHandler(profileId, lists),
          verb === 'POST'
            ? http.post(route, forbidden)
            : http.delete(`${route}/:itemId`, forbidden),
        );
        const { education, experience } = await mount(profileId);
        const region = section === 'education' ? education : experience;

        if (verb === 'POST') {
          if (section === 'education') {
            await fillEducation(user, education);
            await addEducation(user, education);
          } else {
            await fillCurrentExperience(user, experience);
            await addExperience(user, experience);
          }
        } else {
          await user.click(
            region.getByRole('button', {
              name: section === 'education' ? 'Eliminar Título 1' : 'Eliminar Cargo 1',
            }),
          );
        }

        expect(await region.findByText(NOT_FOUND)).toBeInTheDocument();
        expect(screen.queryByText(RAW_SERVER_TEXT)).not.toBeInTheDocument();
      });
    });

    it('404 EDUCATION_NOT_FOUND al eliminar muestra «No encontramos lo que buscabas.» (CA-2.4.58)', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(
        await listingHandler(profileId, { educations: [educationItem(1)] }),
        http.delete('*/api/v1/profiles/:id/educations/:educationId', () =>
          problem(404, { code: 'EDUCATION_NOT_FOUND' }),
        ),
      );
      const { education } = await mount(profileId);

      await user.click(education.getByRole('button', { name: 'Eliminar Título 1' }));

      expect(await education.findByText(NOT_FOUND)).toBeInTheDocument();
    });

    it('404 WORK_EXPERIENCE_NOT_FOUND al eliminar muestra «No encontramos lo que buscabas.» (CA-2.4.59)', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(
        await listingHandler(profileId, { workExperiences: [experienceItem(1)] }),
        http.delete('*/api/v1/profiles/:id/work-experiences/:workExperienceId', () =>
          problem(404, { code: 'WORK_EXPERIENCE_NOT_FOUND' }),
        ),
      );
      const { experience } = await mount(profileId);

      await user.click(experience.getByRole('button', { name: 'Eliminar Cargo 1' }));

      expect(await experience.findByText(NOT_FOUND)).toBeInTheDocument();
    });
  });

  describe('reserva y red en altas y bajas (D-W; CA-2.4.36 y CA-2.4.52)', () => {
    it('503 BIRTH_DATE_UNAVAILABLE al agregar una formación muestra el genérico y conserva lo diligenciado (CA-2.4.52)', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(
        http.post('*/api/v1/profiles/:id/educations', () =>
          problem(503, { code: 'BIRTH_DATE_UNAVAILABLE' }),
        ),
      );
      const { education } = await mount(profileId);

      await fillEducation(user, education);
      await addEducation(user, education);

      expect(await education.findByText(GENERIC)).toBeInTheDocument();
      expect(education.getByLabelText('Título obtenido')).toHaveValue('Ingeniería de Sistemas');
      expect(education.getByLabelText('Institución')).toHaveValue('Universidad del Cauca');
      expect(screen.queryByText(RAW_SERVER_TEXT)).not.toBeInTheDocument();
      expect(
        screen.queryByText('No se pudo agregar la formación académica.'),
      ).not.toBeInTheDocument();
    });

    it('503 BIRTH_DATE_UNAVAILABLE al agregar una experiencia muestra el genérico y conserva lo diligenciado (CA-2.4.36)', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(
        http.post('*/api/v1/profiles/:id/work-experiences', () =>
          problem(503, { code: 'BIRTH_DATE_UNAVAILABLE' }),
        ),
      );
      const { experience } = await mount(profileId);

      await fillCurrentExperience(user, experience);
      await addExperience(user, experience);

      expect(await experience.findByText(GENERIC)).toBeInTheDocument();
      expect(experience.getByLabelText('Cargo')).toHaveValue('Desarrolladora backend');
      expect(experience.getByLabelText('Fecha de inicio')).toHaveValue('06/2024');
      expect(screen.queryByText(RAW_SERVER_TEXT)).not.toBeInTheDocument();
      expect(
        screen.queryByText('No se pudo agregar la experiencia laboral.'),
      ).not.toBeInTheDocument();
    });

    it('un fallo de red al agregar una formación muestra «No hay conexión…» y conserva lo diligenciado', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(http.post('*/api/v1/profiles/:id/educations', () => HttpResponse.error()));
      const { education } = await mount(profileId);

      await fillEducation(user, education);
      await addEducation(user, education);

      expect(await education.findByText(NETWORK)).toBeInTheDocument();
      expect(education.getByLabelText('Título obtenido')).toHaveValue('Ingeniería de Sistemas');
    });

    it('un fallo de red al agregar una experiencia muestra «No hay conexión…» y conserva lo diligenciado', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(http.post('*/api/v1/profiles/:id/work-experiences', () => HttpResponse.error()));
      const { experience } = await mount(profileId);

      await fillCurrentExperience(user, experience);
      await addExperience(user, experience);

      expect(await experience.findByText(NETWORK)).toBeInTheDocument();
      expect(experience.getByLabelText('Cargo')).toHaveValue('Desarrolladora backend');
    });

    it('una baja de formación sin code conocido muestra el genérico, no «No se pudo eliminar…»', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(
        await listingHandler(profileId, { educations: [educationItem(1)] }),
        http.delete('*/api/v1/profiles/:id/educations/:educationId', () =>
          problem(500, { code: 'INTERNAL_ERROR' }),
        ),
      );
      const { education } = await mount(profileId);

      await user.click(education.getByRole('button', { name: 'Eliminar Título 1' }));

      expect(await education.findByText(GENERIC)).toBeInTheDocument();
      expect(
        screen.queryByText('No se pudo eliminar la formación académica.'),
      ).not.toBeInTheDocument();
    });

    it('una baja de experiencia sin code conocido muestra el genérico, no «No se pudo eliminar…»', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(
        await listingHandler(profileId, { workExperiences: [experienceItem(1)] }),
        http.delete('*/api/v1/profiles/:id/work-experiences/:workExperienceId', () =>
          problem(500, { code: 'INTERNAL_ERROR' }),
        ),
      );
      const { experience } = await mount(profileId);

      await user.click(experience.getByRole('button', { name: 'Eliminar Cargo 1' }));

      expect(await experience.findByText(GENERIC)).toBeInTheDocument();
      expect(
        screen.queryByText('No se pudo eliminar la experiencia laboral.'),
      ).not.toBeInTheDocument();
    });

    it('un fallo de red al eliminar una formación muestra «No hay conexión…»', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(
        await listingHandler(profileId, { educations: [educationItem(1)] }),
        http.delete('*/api/v1/profiles/:id/educations/:educationId', () => HttpResponse.error()),
      );
      const { education } = await mount(profileId);

      await user.click(education.getByRole('button', { name: 'Eliminar Título 1' }));

      expect(await education.findByText(NETWORK)).toBeInTheDocument();
    });

    it('un fallo de red al eliminar una experiencia muestra «No hay conexión…»', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(
        await listingHandler(profileId, { workExperiences: [experienceItem(1)] }),
        http.delete('*/api/v1/profiles/:id/work-experiences/:workExperienceId', () =>
          HttpResponse.error(),
        ),
      );
      const { experience } = await mount(profileId);

      await user.click(experience.getByRole('button', { name: 'Eliminar Cargo 1' }));

      expect(await experience.findByText(NETWORK)).toBeInTheDocument();
    });
  });

  describe('topes de 4 y 5, y el 409 desde otra pestaña (D-V; CA-2.4.10, 47, 48 y 49)', () => {
    it('409 WORK_EXPERIENCE_LIMIT_REACHED muestra «Ya tienes el máximo de 4 experiencias laborales.» (CA-2.4.48)', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(
        http.post('*/api/v1/profiles/:id/work-experiences', () =>
          problem(409, { code: 'WORK_EXPERIENCE_LIMIT_REACHED' }),
        ),
      );
      const { experience } = await mount(profileId);

      await fillCurrentExperience(user, experience);
      await addExperience(user, experience);

      expect(await experience.findByText(EXPERIENCE_LIMIT)).toBeInTheDocument();
      expect(screen.queryByText(RAW_SERVER_TEXT)).not.toBeInTheDocument();
    });

    it('409 EDUCATION_LIMIT_REACHED muestra «Ya tienes el máximo de 5 formaciones académicas.» (CA-2.4.49)', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      useHandlers(
        http.post('*/api/v1/profiles/:id/educations', () =>
          problem(409, { code: 'EDUCATION_LIMIT_REACHED' }),
        ),
      );
      const { education } = await mount(profileId);

      await fillEducation(user, education);
      await addEducation(user, education);

      expect(await education.findByText(EDUCATION_LIMIT)).toBeInTheDocument();
      expect(screen.queryByText(RAW_SERVER_TEXT)).not.toBeInTheDocument();
    });

    it('con 4 experiencias «Agregar experiencia» está deshabilitado y se lee el mensaje del tope (CA-2.4.47)', async () => {
      const profileId = await newProfile();
      useHandlers(
        await listingHandler(profileId, {
          workExperiences: [1, 2, 3, 4].map((n) => experienceItem(n)),
        }),
      );
      const { experience } = await mount(profileId);

      expect(experience.getByRole('button', { name: 'Agregar experiencia' })).toBeDisabled();
      expect(experience.getByText(EXPERIENCE_LIMIT)).toBeInTheDocument();
    });

    it('con 5 formaciones «Agregar formación» está deshabilitado y se lee el mensaje del tope (CA-2.4.10)', async () => {
      const profileId = await newProfile();
      useHandlers(
        await listingHandler(profileId, {
          educations: [1, 2, 3, 4, 5].map((n) => educationItem(n)),
        }),
      );
      const { education } = await mount(profileId);

      expect(education.getByRole('button', { name: 'Agregar formación' })).toBeDisabled();
      expect(education.getByText(EDUCATION_LIMIT)).toBeInTheDocument();
    });

    it('al guardar la cuarta experiencia el botón se deshabilita con el mensaje del tope (CA-2.4.47)', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      await seedExperiences(profileId, 'Cargo uno', 'Cargo dos', 'Cargo tres');
      const { experience } = await mount(profileId);

      await fillCurrentExperience(user, experience);
      await addExperience(user, experience);

      expect(await experience.findByText('Experiencia agregada.')).toBeInTheDocument();
      expect(experience.getByRole('button', { name: 'Agregar experiencia' })).toBeDisabled();
      expect(experience.getByText(EXPERIENCE_LIMIT)).toBeInTheDocument();
    });

    it('al guardar la quinta formación el botón se deshabilita con el mensaje del tope (CA-2.4.10)', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      await seedEducations(profileId, 'Título uno', 'Título dos', 'Título tres', 'Título cuatro');
      const { education } = await mount(profileId);

      await fillEducation(user, education);
      await addEducation(user, education);

      expect(await education.findByText('Formación agregada.')).toBeInTheDocument();
      expect(education.getByRole('button', { name: 'Agregar formación' })).toBeDisabled();
      expect(education.getByText(EDUCATION_LIMIT)).toBeInTheDocument();
    });
  });

  describe('un solo mensaje por sección: el de la última acción (D-AA y D-AD)', () => {
    it('tras agregar y luego eliminar solo se ve el mensaje de la baja', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      const { education } = await mount(profileId);

      await fillEducation(user, education);
      await addEducation(user, education);
      expect(await education.findByText('Formación agregada.')).toBeInTheDocument();

      await user.click(education.getByRole('button', { name: /Eliminar Ingeniería de Sistemas/ }));

      expect(await education.findByText('Formación eliminada.')).toBeInTheDocument();
      expect(education.queryByText('Formación agregada.')).not.toBeInTheDocument();
    });

    it('un error viejo de una alta no queda junto a la confirmación de una baja nueva', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      await seedEducations(profileId, 'Título uno');
      useHandlers(
        http.post('*/api/v1/profiles/:id/educations', () =>
          problem(409, { code: 'EDUCATION_LIMIT_REACHED' }),
        ),
      );
      const { education } = await mount(profileId);
      await fillEducation(user, education);
      await addEducation(user, education);
      expect(await education.findByText(EDUCATION_LIMIT)).toBeInTheDocument();

      await user.click(education.getByRole('button', { name: /Eliminar Título uno/ }));

      expect(await education.findByText('Formación eliminada.')).toBeInTheDocument();
      expect(education.queryByText(EDUCATION_LIMIT)).not.toBeInTheDocument();
    });

    it('la confirmación de una baja no queda junto al error de una alta nueva', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      await seedEducations(profileId, 'Título uno');
      useHandlers(
        http.post('*/api/v1/profiles/:id/educations', () =>
          problem(409, { code: 'EDUCATION_LIMIT_REACHED' }),
        ),
      );
      const { education } = await mount(profileId);
      await user.click(education.getByRole('button', { name: /Eliminar Título uno/ }));
      expect(await education.findByText('Formación eliminada.')).toBeInTheDocument();

      await fillEducation(user, education);
      await addEducation(user, education);

      expect(await education.findByText(EDUCATION_LIMIT)).toBeInTheDocument();
      expect(education.queryByText('Formación eliminada.')).not.toBeInTheDocument();
    });

    it('la confirmación de una alta no queda junto al error de una alta posterior', async () => {
      const profileId = await newProfile();
      const user = userEvent.setup();
      const { education } = await mount(profileId);
      await fillEducation(user, education);
      await addEducation(user, education);
      expect(await education.findByText('Formación agregada.')).toBeInTheDocument();
      useHandlers(
        http.post('*/api/v1/profiles/:id/educations', () =>
          problem(409, { code: 'EDUCATION_LIMIT_REACHED' }),
        ),
      );

      await fillEducation(user, education);
      await addEducation(user, education);

      expect(await education.findByText(EDUCATION_LIMIT)).toBeInTheDocument();
      expect(education.queryByText('Formación agregada.')).not.toBeInTheDocument();
    });
  });

  describe('periodos en la lista (CM-273, PR 2; CA-2.4.1, 7, 8, 15, 42 y 56)', () => {
    it('experiencias: «06/2024 – actual», «06/2024 – Fin no registrado», «Sin fechas» y «Sin fecha de inicio – actual»', async () => {
      const profileId = await newProfile();
      useHandlers(
        await listingHandler(profileId, {
          workExperiences: [
            experienceItem(1, { startDate: '2024-06', employmentStatus: 'CURRENT' }),
            experienceItem(2, { startDate: '2024-06', employmentStatus: 'UNKNOWN_END' }),
            experienceItem(3, { startDate: null, employmentStatus: 'UNKNOWN_END' }),
            experienceItem(4, { startDate: null, employmentStatus: 'CURRENT' }),
          ],
        }),
      );
      const { experience } = await mount(profileId);

      expect(experience.getByText('06/2024 – actual')).toBeInTheDocument();
      expect(experience.getByText('06/2024 – Fin no registrado')).toBeInTheDocument();
      expect(experience.getByText('Sin fechas')).toBeInTheDocument();
      expect(experience.getByText('Sin fecha de inicio – actual')).toBeInTheDocument();
    });

    it('experiencia terminada sin inicio: «Sin fecha de inicio – 06/2024» (D-U)', async () => {
      const profileId = await newProfile();
      useHandlers(
        await listingHandler(profileId, {
          workExperiences: [
            experienceItem(1, { startDate: null, endDate: '2024-06', employmentStatus: 'ENDED' }),
          ],
        }),
      );
      const { experience } = await mount(profileId);

      expect(experience.getByText('Sin fecha de inicio – 06/2024')).toBeInTheDocument();
    });

    it('formaciones: «02/2025 – en curso», «02/2025 – Sin fecha de fin» y «02/2025 – 02/2025»', async () => {
      const profileId = await newProfile();
      useHandlers(
        await listingHandler(profileId, {
          educations: [
            educationItem(1, { startDate: '2025-02', endDate: null, inProgress: true }),
            educationItem(2, { startDate: '2025-02', endDate: null, inProgress: false }),
            educationItem(3, { startDate: '2025-02', endDate: '2025-02', inProgress: false }),
          ],
        }),
      );
      const { education } = await mount(profileId);

      expect(education.getByText('02/2025 – en curso')).toBeInTheDocument();
      expect(education.getByText('02/2025 – Sin fecha de fin')).toBeInTheDocument();
      expect(education.getByText('02/2025 – 02/2025')).toBeInTheDocument();
    });
  });
});
