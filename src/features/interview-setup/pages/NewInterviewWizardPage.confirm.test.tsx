/**
 * Protege el paso «Confirmar» del asistente (HU-4.4, backlog v8.5): el error
 * de un intento anterior no queda junto al aviso de datos incompletos, porque
 * con la configuración incompleta no se puede reintentar (observación 2 del
 * testeo del 24-10-2026).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
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
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
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

describe('NewInterviewWizardPage · confirmar', () => {
  beforeEach(() => {
    useInterviewSetupStore.getState().reset();
  });

  it('con la configuración incompleta oculta el error del intento anterior', async () => {
    useHandlers(
      http.get('*/api/v1/profiles', () =>
        HttpResponse.json({
          profiles: [{ id: 'p1', name: 'Mi perfil', status: 'COMPLETED', targetRoles: [] }],
        }),
      ),
      http.post('*/api/v1/interviews/sessions', () =>
        HttpResponse.json(
          { title: 'x', detail: 'x', status: 500, code: 'INTERNAL_ERROR' },
          { status: 500 },
        ),
      ),
    );
    useInterviewSetupStore.getState().setProfile('p1');
    useInterviewSetupStore.getState().setTargetRole('r1');
    const user = userEvent.setup();
    renderAtStep(4);
    const start = await screen.findByRole('button', { name: /Iniciar entrevista/ });
    await waitFor(() => expect(start).toBeEnabled());
    await user.click(start);
    expect(await screen.findByText('Ocurrió un error. Inténtalo de nuevo.')).toBeInTheDocument();

    useInterviewSetupStore.getState().setTargetRole(null);
    expect(
      await screen.findByText(/Elige un Perfil Profesional y un rol objetivo/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Ocurrió un error. Inténtalo de nuevo.')).not.toBeInTheDocument();
  });
});
