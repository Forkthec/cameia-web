/**
 * Protege el chat de Simulación con respuesta escrita (HU-5.2, backlog
 * v8.2): avance con «Pregunta k de 5» (CA-5.2.1), «Enviar» bloqueado vacío
 * (CA-5.2.3), límite de 4000 (CA-5.2.9), sin conexión (CA-5.2.18), fallo
 * de la IA con «Reintentar» (CA-5.2.19, CA-5.2.20), entrevista ajena
 * (CA-5.2.7), cierre tras la pregunta 5 (CA-5.2.5) y la vuelta a «Nueva
 * entrevista» sin entrada (HU-5.7 aún no existe).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { useHandlers } from '@/test/msw';
import { InterviewSessionPage } from './InterviewSessionPage';

const ENTRY = {
  sessionId: 's1',
  answerFormat: 'TEXTO',
  question: { turnId: 's1-t1', number: 1, text: 'Cuéntame sobre un proyecto.' },
  progress: { current: 1, total: 5 },
};

function renderPage(state: unknown = ENTRY) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[{ pathname: '/entrenar/sesion/s1', state }]}>
          <Routes>
            <Route path="/entrenar/sesion/:sessionId" element={<InterviewSessionPage />} />
            <Route path="/entrenar/nueva" element={<p>Nueva entrevista</p>} />
            <Route path="/inicio" element={<p>Inicio</p>} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

const llmUnavailable = () =>
  HttpResponse.json(
    {
      title: 'Service Unavailable',
      detail: 'LLM no disponible',
      status: 503,
      code: 'LLM_UNAVAILABLE',
    },
    { status: 503 },
  );

describe('InterviewSessionPage', () => {
  it('sin entrada (recarga) vuelve a «Nueva entrevista»', () => {
    renderPage(null);
    expect(screen.getByText('Nueva entrevista')).toBeInTheDocument();
  });

  it('muestra la pregunta pendiente y «Pregunta 1 de 5»', () => {
    renderPage();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Cuéntame sobre un proyecto.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Pregunta 1 de 5' })).toBeInTheDocument();
  });

  it('mantiene «Enviar» deshabilitado con el campo vacío o solo espacios (CA-5.2.3)', async () => {
    const user = userEvent.setup();
    renderPage();
    const send = screen.getByRole('button', { name: 'Enviar' });
    expect(send).toBeDisabled();
    await user.type(screen.getByLabelText('Respuesta'), '   ');
    expect(send).toBeDisabled();
  });

  it('con 4001 caracteres marca el contador, muestra el mensaje y no envía (CA-5.2.9)', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText('Respuesta'));
    await user.paste('a'.repeat(4001));
    expect(screen.getByText('4001 / 4000 caracteres')).toBeInTheDocument();
    expect(
      screen.getByText('Tu respuesta no puede superar los 4000 caracteres.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });

  it('al enviar muestra la pregunta siguiente con «Pregunta 2 de 5» y el campo vacío (CA-5.2.1)', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Respuesta'), 'Lideré una migración.');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByRole('progressbar', { name: 'Pregunta 2 de 5' })).toBeInTheDocument();
    expect(screen.getByLabelText('Respuesta')).toHaveValue('');
  });

  it('sin conexión muestra el aviso y conserva el texto (CA-5.2.18)', async () => {
    useHandlers(http.post('*/api/v1/interviews/sessions/:id/answers', () => HttpResponse.error()));
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Respuesta'), 'Mi respuesta');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(
      await screen.findByText('No hay conexión. Revisa tu internet e inténtalo de nuevo.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Respuesta')).toHaveValue('Mi respuesta');
    expect(screen.getByRole('progressbar', { name: 'Pregunta 1 de 5' })).toBeInTheDocument();
  });

  it('si la IA falla muestra el error genérico con «Reintentar» (CA-5.2.19)', async () => {
    useHandlers(http.post('*/api/v1/interviews/sessions/:id/answers', llmUnavailable));
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Respuesta'), 'Mi respuesta');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByText('Ocurrió un error. Inténtalo de nuevo.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Respuesta')).not.toBeInTheDocument();
  });

  it('tras 2 reintentos fallidos muestra el mensaje de reintentos agotados e «Ir al inicio» (CA-5.2.20)', async () => {
    useHandlers(
      http.post('*/api/v1/interviews/sessions/:id/answers', llmUnavailable),
      http.post('*/api/v1/interviews/sessions/:id/turns/:turnId/reprocess', llmUnavailable),
    );
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Respuesta'), 'Mi respuesta');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(
      await screen.findByText(
        'No pudimos evaluar tu respuesta en este momento. Tu respuesta quedó guardada; inténtalo más tarde.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/inicio');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('«Reintentar» con éxito avanza a la pregunta siguiente', async () => {
    useHandlers(http.post('*/api/v1/interviews/sessions/:id/answers', llmUnavailable));
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Respuesta'), 'Mi respuesta');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('progressbar', { name: 'Pregunta 2 de 5' })).toBeInTheDocument();
  });

  it('con una entrevista ajena muestra «No encontramos lo que buscabas.» (CA-5.2.7)', async () => {
    useHandlers(
      http.post('*/api/v1/interviews/sessions/:id/answers', () =>
        HttpResponse.json(
          { title: 'Not Found', detail: 'No existe', status: 404, code: 'NOT_FOUND' },
          { status: 404 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Respuesta'), 'Mi respuesta');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByText('No encontramos lo que buscabas.')).toBeInTheDocument();
  });

  it('tras la pregunta 5 muestra «Tu entrevista terminó.» sin campo ni «Enviar» (CA-5.2.5)', async () => {
    const user = userEvent.setup();
    renderPage({
      ...ENTRY,
      question: { turnId: 's1-t5', number: 5, text: 'Última pregunta' },
      progress: { current: 5, total: 5 },
    });
    await user.type(screen.getByLabelText('Respuesta'), 'Fin');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Tu entrevista terminó.' }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Respuesta')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar' })).not.toBeInTheDocument();
  });
});
