/**
 * Protege que los pasos 2 y 3 del asistente lean el catálogo de
 * personalización de Backend (HU-4.3, backlog v8.2): opciones y
 * disponibilidad del catálogo (CA-4.3.10) y su error con «Reintentar carga»
 * sin poder avanzar (CA-4.3.11). También que un doble clic en «Iniciar
 * entrevista» envíe una sola petición (CA-4.4.17, defecto CM-341).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { useHandlers } from '@/test/msw';
import { useInterviewSetupStore } from '../store/interviewSetup.store';
import { NewInterviewWizardPage } from './NewInterviewWizardPage';

function renderAtStep(step: number) {
  useInterviewSetupStore.getState().goToStep(step);
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <NewInterviewWizardPage />
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

const catalogUrl = '*/api/v1/interviews/config/catalog';

describe('NewInterviewWizardPage · catálogo de personalización', () => {
  beforeEach(() => {
    useInterviewSetupStore.getState().reset();
  });

  it('el paso 2 muestra las modalidades y tonos del catálogo, con Entreno «Próximamente» (CA-4.3.10)', async () => {
    renderAtStep(2);
    expect(await screen.findByText('Profesional y neutro')).toBeInTheDocument();
    expect(screen.getByText('Próximamente')).toBeInTheDocument();
  });

  it('si el catálogo habilita Entreno, ya no dice «Próximamente» (CA-4.3.10)', async () => {
    useHandlers(
      http.get(catalogUrl, () =>
        HttpResponse.json({
          tones: [{ value: 'PROFESIONAL_NEUTRO', available: true }],
          answerFormats: [{ value: 'TEXTO', available: true }],
          languages: [{ value: 'es-CO', available: true }],
          modes: [
            { value: 'SIMULACION', available: true },
            { value: 'ENTRENO', available: true },
          ],
        }),
      ),
    );
    renderAtStep(2);
    expect(await screen.findByText('Profesional y neutro')).toBeInTheDocument();
    expect(screen.queryByText('Próximamente')).not.toBeInTheDocument();
  });

  it('si falla la carga muestra el error con «Reintentar carga» y no deja avanzar (CA-4.3.11)', async () => {
    let calls = 0;
    useHandlers(
      http.get(catalogUrl, () => {
        calls += 1;
        return HttpResponse.json(
          { title: 'x', detail: 'x', status: 500, code: 'INTERNAL_ERROR' },
          { status: 500 },
        );
      }),
    );
    const user = userEvent.setup();
    renderAtStep(3);
    expect(await screen.findByText('Ocurrió un error. Inténtalo de nuevo.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Reintentar carga' }));
    expect(calls).toBe(2);
  });
});

describe('NewInterviewWizardPage · iniciar entrevista', () => {
  beforeEach(() => {
    useInterviewSetupStore.getState().reset();
  });

  it('un doble clic en «Iniciar entrevista» envía una sola petición (CA-4.4.17)', async () => {
    let posts = 0;
    useHandlers(
      http.get('*/api/v1/profiles', () =>
        HttpResponse.json({
          profiles: [{ id: 'p1', name: 'Mi perfil', status: 'COMPLETED', targetRoles: [] }],
        }),
      ),
      http.post('*/api/v1/interviews/sessions', async () => {
        posts += 1;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json(
          { sessionId: 's1', status: 'CONFIGURADA', ongoingSession: null },
          { status: 201 },
        );
      }),
    );
    useInterviewSetupStore.getState().setProfile('p1');
    useInterviewSetupStore.getState().setTargetRole('r1');
    renderAtStep(4);
    const start = await screen.findByRole('button', { name: /Iniciar entrevista/ });
    await waitFor(() => expect(start).toBeEnabled());
    // Dos clics en el mismo tick, sin dejar que React pinte entre ellos,
    // como un doble clic real del navegador.
    fireEvent.click(start);
    fireEvent.click(start);
    await waitFor(() => expect(posts).toBe(1));
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(posts).toBe(1);
  });
});
