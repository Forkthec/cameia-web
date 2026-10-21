/**
 * Protege «Iniciando sesión de entrevista» (HU-4.5, backlog v8.2): texto y
 * carga sin controles (CA-4.5.13), apertura del chat con la pregunta 1,
 * fallo con «Reintentar» y «Cancelar» (CA-4.5.14), reintentos agotados
 * solo con «Cancelar» (CA-4.5.19), cancelar vuelve a «Nueva entrevista»
 * (CA-4.5.17) y entrevista ajena (CA-4.5.10).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { useHandlers } from '@/test/msw';
import { StartingSessionPage } from './StartingSessionPage';

function ChatProbe() {
  const location = useLocation();
  const state = location.state as { question: { text: string } };
  return <p>Chat: {state.question.text}</p>;
}

function renderPage(state: unknown = { sessionId: 's1' }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[{ pathname: '/entrenar/nueva/iniciando', state }]}>
          <Routes>
            <Route path="/entrenar/nueva/iniciando" element={<StartingSessionPage />} />
            <Route path="/entrenar/sesion/:sessionId" element={<ChatProbe />} />
            <Route path="/entrenar/nueva" element={<p>Nueva entrevista</p>} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

const llmUnavailable = () =>
  HttpResponse.json(
    { title: 'Service Unavailable', detail: 'x', status: 503, code: 'LLM_UNAVAILABLE' },
    { status: 503 },
  );

describe('StartingSessionPage', () => {
  it('sin sesión en el estado vuelve a «Nueva entrevista»', () => {
    renderPage(null);
    expect(screen.getByText('Nueva entrevista')).toBeInTheDocument();
  });

  it('muestra «Iniciando sesión de entrevista» sin botones mientras prepara (CA-4.5.13)', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { name: 'Iniciando sesión de entrevista' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('al iniciar abre el chat con la pregunta 1', async () => {
    renderPage();
    expect(
      await screen.findByText(/Chat: Cuéntame sobre un proyecto/, {}, { timeout: 4000 }),
    ).toBeInTheDocument();
  });

  it('si falla la preparación muestra el error con «Reintentar» y «Cancelar» (CA-4.5.14)', async () => {
    useHandlers(http.post('*/api/v1/interviews/sessions/:id/start', llmUnavailable));
    renderPage();
    expect(await screen.findByText('Ocurrió un error. Inténtalo de nuevo.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('tras 2 reintentos fallidos deja solo «Cancelar» (CA-4.5.19)', async () => {
    useHandlers(http.post('*/api/v1/interviews/sessions/:id/start', llmUnavailable));
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(
      await screen.findByText(
        'No pudimos preparar tu entrevista en este momento. Inténtalo más tarde.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeInTheDocument();
  });

  it('«Cancelar» elimina la sesión y vuelve a «Nueva entrevista» (CA-4.5.17)', async () => {
    let deleted = false;
    useHandlers(
      http.post('*/api/v1/interviews/sessions/:id/start', llmUnavailable),
      http.delete('*/api/v1/interviews/sessions/:id', () => {
        deleted = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole('button', { name: 'Cancelar' }));
    expect(await screen.findByText('Nueva entrevista')).toBeInTheDocument();
    expect(deleted).toBe(true);
  });

  it('con una entrevista ajena muestra «No encontramos lo que buscabas.» (CA-4.5.10)', async () => {
    useHandlers(
      http.post('*/api/v1/interviews/sessions/:id/start', () =>
        HttpResponse.json(
          { title: 'Not Found', detail: 'x', status: 404, code: 'NOT_FOUND' },
          { status: 404 },
        ),
      ),
    );
    renderPage();
    expect(await screen.findByText('No encontramos lo que buscabas.')).toBeInTheDocument();
  });
});
