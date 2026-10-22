/**
 * Protege la respuesta por voz del chat (HU-5.8, backlog v8.2) con la
 * grabación simulada (`useVoiceRecorder` se reemplaza; el navegador no
 * graba en jsdom): controles y aviso de privacidad (CA-5.8.24), grabando
 * con el tiempo (CA-5.8.2), envío y avance (CA-5.8.5), voz insuficiente
 * (CA-5.8.10), micrófono denegado (CA-5.8.3) o ausente (CA-5.8.23),
 * «Responder por texto» (CA-5.8.19) y sin «Grabar» en una entrevista de
 * texto (CA-5.8.20), y los rechazos de Backend al transcribir
 * (CA-5.12.8, CA-5.12.10).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { useHandlers } from '@/test/msw';
import { InterviewSessionPage } from './InterviewSessionPage';

const recorder = vi.hoisted(() => ({
  status: 'idle',
  elapsedSeconds: 0,
  audio: null as Blob | null,
  start: vi.fn(),
  stop: vi.fn(),
  discard: vi.fn(),
}));

vi.mock('../hooks/useVoiceRecorder', () => ({ useVoiceRecorder: () => recorder }));

const AUDIO_ENTRY = {
  sessionId: 's1',
  sessionLanguage: 'es-CO',
  answerFormat: 'AUDIO',
  question: { turnId: 's1-t1', number: 1, text: 'Cuéntame sobre un proyecto.' },
  progress: { current: 1, total: 5 },
};

function renderPage(entry: unknown = AUDIO_ENTRY) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[{ pathname: '/entrenar/sesion/s1', state: entry }]}>
          <Routes>
            <Route path="/entrenar/sesion/:sessionId" element={<InterviewSessionPage />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('InterviewSessionPage (voz)', () => {
  beforeEach(() => {
    recorder.status = 'idle';
    recorder.elapsedSeconds = 0;
    recorder.audio = null;
    vi.clearAllMocks();
  });

  it('muestra «Grabar», «Responder por texto» y el aviso del audio antes de grabar (CA-5.8.24)', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Grabar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Responder por texto' })).toBeInTheDocument();
    expect(
      screen.getByText('Tu audio se usa solo para transcribir tu respuesta y no se guarda.'),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Respuesta')).not.toBeInTheDocument();
  });

  it('al grabar muestra «Detener» y el tiempo sobre 3:00 (CA-5.8.2)', () => {
    recorder.status = 'recording';
    recorder.elapsedSeconds = 42;
    renderPage();
    expect(screen.getByRole('button', { name: 'Detener' })).toBeInTheDocument();
    expect(screen.getByText('0:42 / 3:00')).toBeInTheDocument();
  });

  it('con una grabación lista, «Enviar» avanza a «Pregunta 2 de 5» y suelta el audio (CA-5.8.5)', async () => {
    recorder.status = 'stopped';
    recorder.audio = new Blob(['x'], { type: 'audio/webm' });
    // Respuesta propia sin leer el multipart: en Node 24, `request.formData()`
    // de MSW rechaza el `Blob` de jsdom (en el navegador funciona).
    useHandlers(
      http.post('*/api/v1/interviews/sessions/:id/answers/audio', () =>
        HttpResponse.json({
          turn: { turnId: 's1-t1', status: 'COMPLETED' },
          progress: { currentQuestion: 2, totalQuestions: 5 },
          nextQuestion: { turnId: 's1-t2', number: 2, text: 'Segunda pregunta' },
          interviewFinished: false,
        }),
      ),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByRole('progressbar', { name: 'Pregunta 2 de 5' })).toBeInTheDocument();
    expect(recorder.discard).toHaveBeenCalled();
  });

  it('con menos de 2 s de voz muestra el aviso y deja grabar otra vez (CA-5.8.10)', () => {
    recorder.status = 'noVoice';
    renderPage();
    expect(screen.getByText('No detectamos tu voz, intenta de nuevo.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Grabar' })).toBeInTheDocument();
  });

  it('con el micrófono denegado ofrece el texto en la misma pregunta (CA-5.8.3)', () => {
    recorder.status = 'denied';
    renderPage();
    expect(
      screen.getByText('No pudimos acceder a tu micrófono. Puedes responder por texto.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Respuesta')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Pregunta 1 de 5' })).toBeInTheDocument();
  });

  it('sin micrófono avisa y ofrece el texto (CA-5.8.23)', () => {
    recorder.status = 'noMicrophone';
    renderPage();
    expect(
      screen.getByText('No encontramos un micrófono. Puedes responder por texto.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Respuesta')).toBeInTheDocument();
  });

  it('«Responder por texto» descarta la grabación y muestra el campo (CA-5.8.19)', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Responder por texto' }));
    expect(recorder.discard).toHaveBeenCalled();
    expect(screen.getByLabelText('Respuesta')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Grabar' })).not.toBeInTheDocument();
  });

  it('una entrevista de texto no muestra «Grabar» (CA-5.8.20)', () => {
    renderPage({ ...AUDIO_ENTRY, answerFormat: 'TEXTO' });
    expect(screen.queryByRole('button', { name: 'Grabar' })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Respuesta')).toBeInTheDocument();
  });

  it('si Backend detecta otro idioma, avisa en el idioma de la entrevista y descarta la grabación (CA-5.12.10)', async () => {
    recorder.status = 'stopped';
    recorder.audio = new Blob(['x'], { type: 'audio/webm' });
    useHandlers(
      http.post('*/api/v1/interviews/sessions/:id/answers/audio', () =>
        HttpResponse.json(
          { title: 'x', detail: 'x', status: 422, code: 'TRANSCRIPTION_LANGUAGE_MISMATCH' },
          { status: 422 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderPage({ ...AUDIO_ENTRY, sessionLanguage: 'en' });
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(
      await screen.findByText('Tu entrevista es en inglés. Responde en inglés.'),
    ).toBeInTheDocument();
    expect(recorder.discard).toHaveBeenCalled();
    expect(screen.getByRole('progressbar', { name: 'Pregunta 1 de 5' })).toBeInTheDocument();
  });

  it('si falla la transcripción avisa, descarta la grabación y deja «Responder por texto» (CA-5.12.8)', async () => {
    recorder.status = 'stopped';
    recorder.audio = new Blob(['x'], { type: 'audio/webm' });
    useHandlers(
      http.post('*/api/v1/interviews/sessions/:id/answers/audio', () =>
        HttpResponse.json(
          { title: 'x', detail: 'x', status: 503, code: 'TRANSCRIPTION_UNAVAILABLE' },
          { status: 503 },
        ),
      ),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(
      await screen.findByText(
        'No pudimos transcribir tu respuesta. Graba de nuevo o responde por texto.',
      ),
    ).toBeInTheDocument();
    expect(recorder.discard).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Responder por texto' })).toBeInTheDocument();
  });
});
