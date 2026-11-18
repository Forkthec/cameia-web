/**
 * Protege «Escuchar la pregunta» del chat (HU-5.15, CM-373; backlog v11.6 y aviso de Backend del
 * 14-11-2026): botón con nombre «Escuchar la pregunta N» y usos «3 de 3» (CA-5.15.1, CA-5.15.16),
 * aviso del texto enviado (CA-5.15.29), «Detener» y un uso menos al reproducir (CA-5.15.2),
 * repetir desde memoria sin pedir otra vez (CA-5.15.4), límite con el botón deshabilitado
 * (CA-5.15.6), errores de la voz sin gastar uso y con la pregunta respondible (CA-5.15.8),
 * botón oculto con `audioEnabled` falso (CA-5.15.9) y escucha automática de la pregunta nueva
 * (CA-5.15.30). jsdom no reproduce audio: `HTMLMediaElement.play` se simula.
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { useUiPreferencesStore } from '@/stores/uiPreferences.store';
import { useHandlers } from '@/test/msw';
import { InterviewSessionPage } from './InterviewSessionPage';

const AUDIO_URL = '*/api/v1/interviews/sessions/:id/questions/:number/audio';
const ANSWERS_URL = '*/api/v1/interviews/sessions/:id/answers';
const NOTICE =
  'El texto de la pregunta se envía a un servicio externo para convertirlo en voz. CAMEIA no guarda el audio.';

const ENTRY = {
  sessionId: 's1',
  sessionLanguage: 'es-CO',
  answerFormat: 'TEXTO',
  question: { turnId: 's1-t1', number: 1, text: 'Cuéntame sobre un proyecto.' },
  progress: { current: 1, total: 5 },
  audioEnabled: true,
};

function audioOk() {
  return new HttpResponse(new Uint8Array([0x49, 0x44, 0x33]), {
    headers: { 'Content-Type': 'audio/mpeg' },
  });
}

function problem(status: number, code: string) {
  return HttpResponse.json({ title: 't', detail: 'd', status, code }, { status });
}

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
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>,
  );
}

describe('InterviewSessionPage · escuchar la pregunta', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('es-CO');
    useUiPreferencesStore.setState({ autoListenQuestions: false });
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    URL.createObjectURL = vi.fn(() => 'blob:audio');
    URL.revokeObjectURL = vi.fn();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('muestra «Escuchar la pregunta 1», «3 de 3», el aviso y la casilla desmarcada', () => {
    renderPage();
    expect(screen.getByRole('button', { name: 'Escuchar la pregunta 1' })).toBeEnabled();
    expect(screen.getByText('3 de 3')).toBeInTheDocument();
    expect(screen.getByText(NOTICE)).toBeInTheDocument();
    expect(screen.getByLabelText('Escuchar las preguntas automáticamente')).not.toBeChecked();
    expect(screen.getByLabelText('Respuesta')).toBeInTheDocument();
  });

  it('al escuchar reproduce, ofrece «Detener», resta un uso y oculta el aviso', async () => {
    let calls = 0;
    useHandlers(
      http.post(AUDIO_URL, () => {
        calls += 1;
        return audioOk();
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Escuchar la pregunta 1' }));
    expect(await screen.findByRole('button', { name: 'Detener' })).toBeInTheDocument();
    expect(screen.getByText('2 de 3')).toBeInTheDocument();
    expect(screen.queryByText(NOTICE)).not.toBeInTheDocument();
    expect(calls).toBe(1);
  });

  it('repetir usa el audio en memoria: no pide otra vez ni gasta usos (CA-5.15.4)', async () => {
    let calls = 0;
    useHandlers(
      http.post(AUDIO_URL, () => {
        calls += 1;
        return audioOk();
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Escuchar la pregunta 1' }));
    await user.click(await screen.findByRole('button', { name: 'Detener' }));
    await user.click(screen.getByRole('button', { name: 'Escuchar la pregunta 1' }));
    await screen.findByRole('button', { name: 'Detener' });
    expect(calls).toBe(1);
    expect(screen.getByText('2 de 3')).toBeInTheDocument();
  });

  it('con el límite alcanzado deshabilita el botón y lo dice (CA-5.15.6)', async () => {
    useHandlers(http.post(AUDIO_URL, () => problem(409, 'QUESTION_AUDIO_LIMIT_REACHED')));
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Escuchar la pregunta 1' }));
    expect(
      await screen.findByText(
        'Ya escuchaste esta pregunta el máximo de veces. Puedes leerla en pantalla.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Escuchar la pregunta 1' })).toBeDisabled();
    expect(screen.getByText('0 de 3')).toBeInTheDocument();
  });

  it.each([
    ['SPEECH_TIMEOUT', 'La voz tardó demasiado. Inténtalo de nuevo o léela en pantalla.'],
    [
      'SPEECH_UNAVAILABLE',
      'No pudimos reproducir la pregunta. Inténtalo de nuevo o léela en pantalla.',
    ],
    ['SPEECH_DISABLED', 'La voz no está disponible por ahora. Puedes leer la pregunta.'],
    ['SPEECH_BUSY', 'Hay muchas personas escuchando. Inténtalo en unos segundos.'],
  ])(
    '%s muestra su mensaje sin gastar uso y la pregunta sigue respondible (CA-5.15.8)',
    async (code, message) => {
      useHandlers(http.post(AUDIO_URL, () => problem(503, code)));
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole('button', { name: 'Escuchar la pregunta 1' }));
      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(screen.getByText('3 de 3')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Escuchar la pregunta 1' })).toBeEnabled();
      expect(screen.getByLabelText('Respuesta')).toBeEnabled();
    },
  );

  it('sin voz disponible no muestra el botón ni la casilla (CA-5.15.9)', () => {
    renderPage({ ...ENTRY, audioEnabled: false });
    expect(screen.queryByRole('button', { name: /Escuchar/ })).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText('Escuchar las preguntas automáticamente'),
    ).not.toBeInTheDocument();
  });

  it('con la casilla marcada reproduce sola la pregunta nueva (CA-5.15.30)', async () => {
    const asked: string[] = [];
    useHandlers(
      http.post(AUDIO_URL, ({ params }) => {
        asked.push(String(params.number));
        return audioOk();
      }),
      http.post(ANSWERS_URL, () =>
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
    await user.click(screen.getByLabelText('Escuchar las preguntas automáticamente'));
    await waitFor(() => expect(asked).toEqual(['1']));
    await user.click(await screen.findByRole('button', { name: 'Detener' }));
    await user.type(screen.getByLabelText('Respuesta'), 'Mi respuesta');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    await screen.findByRole('heading', { name: 'Segunda pregunta' });
    await waitFor(() => expect(asked).toEqual(['1', '2']));
    expect(useUiPreferencesStore.getState().autoListenQuestions).toBe(true);
  });
});
