/**
 * Protege la respuesta por voz del chat (HU-5.8, backlog v8.4) con la
 * grabación simulada (`useVoiceRecorder` se reemplaza; el navegador no
 * graba en jsdom): controles y aviso de privacidad, que sigue visible hasta
 * que la grabación empieza de verdad (CA-5.8.24, CM-316 D8), grabando con
 * el tiempo (CA-5.8.2), envío y avance con el aviso de los 20 s ligado a
 * cada envío (CA-5.8.5), doble envío con «Enviar» que conserva su nombre
 * accesible (CA-5.8.6, CM-316 D7), voz insuficiente (CA-5.8.10, CA-5.8.11),
 * micrófono denegado (CA-5.8.3) o ausente (CA-5.8.23), «Responder por
 * texto» registrado en `…/answers` (CA-5.8.19), sin «Grabar» en una
 * entrevista de texto (CA-5.8.20), entrevista ajena (CA-5.8.21), sin
 * conexión con la misma `Idempotency-Key` (CA-5.8.22), MicVAD que no carga
 * (CA-5.8.25) y formato no admitido (notas técnicas de HU-5.8, O75, con el
 * texto de CA-4.3.7). Del lado de Backend, el efecto visible de la tabla de
 * SPEC §5 «Qué muestra la pantalla al enviar audio»: `413`, `415` y `422`
 * sin `code` de transcripción (CA-5.8.8, CA-5.8.13 a 5.8.15), los rechazos
 * al transcribir (CA-5.12.8, CA-5.12.10) y el defecto de SPEC §9: tras un
 * `503 LLM_*` con audio y un «Reintentar» exitoso, la pregunta siguiente no
 * conserva el audio anterior. Los textos son los literales del archivo de
 * criterios de HU-5.8 (backlog v8.4).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '@/i18n';
import { useHandlers } from '@/test/msw';
import {
  LLM_LIMIT_REACHED,
  LLM_UNAVAILABLE,
  VALIDATION_FAILED,
} from '../model/interviewSession.errorCodes';
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

const AUDIO_URL = '*/api/v1/interviews/sessions/:id/answers/audio';
const ANSWERS_URL = '*/api/v1/interviews/sessions/:id/answers';
const REPROCESS_URL = '*/api/v1/interviews/sessions/:id/turns/:turnId/reprocess';

const GENERIC = 'Ocurrió un error. Inténtalo de nuevo.';
const NO_CONNECTION = 'No hay conexión. Revisa tu internet e inténtalo de nuevo.';
const NOT_FOUND = 'No encontramos lo que buscabas.';
const PROCESSING = 'Procesando tu respuesta…';
const LONG_WAIT = 'Esto puede tardar hasta 2 minutos. No cierres esta página.';
const NO_VOICE = 'No detectamos tu voz, intenta de nuevo.';
const PRIVACY = 'Tu audio se usa solo para transcribir tu respuesta y no se guarda.';
const VAD_FAILED = 'No pudimos preparar la grabación. Puedes responder por texto.';
const UNSUPPORTED = 'Tu navegador no permite grabar. Responderás por texto.';

/** Respuesta 200 común del contrato previsto: la pregunta 2 sigue. */
const OK_NEXT = {
  turn: { turnId: 's1-t1', status: 'COMPLETED' },
  progress: { currentQuestion: 2, totalQuestions: 5 },
  nextQuestion: { turnId: 's1-t2', number: 2, text: 'Segunda pregunta' },
  interviewFinished: false,
};

function problem(status: number, code?: string) {
  return HttpResponse.json(
    { title: 'x', detail: 'detalle técnico', status, ...(code ? { code } : {}) },
    { status },
  );
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((onResolve) => {
    resolve = onResolve;
  });
  return { promise, resolve };
}

/** Deja una grabación detenida y válida, lista para «Enviar» (CA-5.8.4). */
function withRecording() {
  recorder.status = 'stopped';
  recorder.audio = new Blob(['x'], { type: 'audio/webm;codecs=opus' });
}

/** Avanza el reloj simulado dentro de `act`, para que React pinte lo que dispararon los temporizadores. */
async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

/**
 * `refresh` vuelve a pintar la página tras cambiar `recorder` a mano: el
 * hook simulado devuelve un objeto mutable que React no observa.
 */
function renderPage(entry: unknown = AUDIO_ENTRY) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const tree = () => (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={[{ pathname: '/entrenar/sesion/s1', state: entry }]}>
          <Routes>
            <Route path="/entrenar/sesion/:sessionId" element={<InterviewSessionPage />} />
          </Routes>
        </MemoryRouter>
      </I18nextProvider>
    </QueryClientProvider>
  );
  const view = render(tree());
  return { ...view, refresh: () => view.rerender(tree()) };
}

describe('InterviewSessionPage (voz)', () => {
  beforeEach(() => {
    recorder.status = 'idle';
    recorder.elapsedSeconds = 0;
    recorder.audio = null;
    vi.clearAllMocks();
    recorder.discard.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
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
    const calls: string[] = [];
    const bodies: Array<{ turnId?: string; answerText?: string }> = [];
    useHandlers(
      http.post(ANSWERS_URL, async ({ request }) => {
        calls.push('answers');
        bodies.push((await request.json()) as { turnId?: string; answerText?: string });
        return HttpResponse.json(OK_NEXT);
      }),
      http.post(AUDIO_URL, () => {
        calls.push('answers/audio');
        return HttpResponse.json(OK_NEXT);
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Responder por texto' }));
    expect(recorder.discard).toHaveBeenCalled();
    expect(screen.getByLabelText('Respuesta')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Grabar' })).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Pregunta 1 de 5' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Respuesta'), 'Mi respuesta escrita');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByRole('progressbar', { name: 'Pregunta 2 de 5' })).toBeInTheDocument();
    expect(calls).toEqual(['answers']);
    expect(bodies[0]).toEqual({ turnId: 's1-t1', answerText: 'Mi respuesta escrita' });
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

  it('a los 20 s de espera agrega «Esto puede tardar hasta 2 minutos. No cierres esta página.» (CA-5.8.5)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    withRecording();
    const response = createDeferred<Response>();
    useHandlers(http.post(AUDIO_URL, () => response.promise));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Enviar' }));

    await advance(19_000);
    expect(screen.queryByText(LONG_WAIT)).not.toBeInTheDocument();
    await advance(1_500);
    expect(screen.getByText(LONG_WAIT)).toBeInTheDocument();

    response.resolve(HttpResponse.json(OK_NEXT));
    expect(await screen.findByRole('progressbar', { name: 'Pregunta 2 de 5' })).toBeInTheDocument();
  });

  it('tras un reenvío el aviso de 20 s no aparece antes de tiempo (CA-5.8.5)', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    withRecording();
    const responses = [createDeferred<Response>(), createDeferred<Response>()];
    let calls = 0;
    useHandlers(
      http.post(AUDIO_URL, () => {
        const response = responses[calls];
        calls += 1;
        return response?.promise ?? HttpResponse.json(OK_NEXT);
      }),
    );
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    await advance(15_000);
    responses[0]?.resolve(HttpResponse.error());
    expect(await screen.findByText(NO_CONNECTION)).toBeInTheDocument();

    // El temporizador del primer envío vencería a los 20 s, 5 s después del reenvío.
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    await advance(10_000);
    expect(screen.queryByText(LONG_WAIT)).not.toBeInTheDocument();
    await advance(10_500);
    expect(screen.getByText(LONG_WAIT)).toBeInTheDocument();

    responses[1]?.resolve(HttpResponse.json(OK_NEXT));
    expect(await screen.findByRole('progressbar', { name: 'Pregunta 2 de 5' })).toBeInTheDocument();
  });

  it('con doble clic en «Enviar» envía un solo audio (CA-5.8.6)', async () => {
    withRecording();
    const response = createDeferred<Response>();
    let calls = 0;
    useHandlers(
      http.post(AUDIO_URL, () => {
        calls += 1;
        return response.promise;
      }),
    );
    const user = userEvent.setup();
    const { container } = renderPage();
    await user.dblClick(screen.getByRole('button', { name: 'Enviar' }));

    const live = container.querySelector('[aria-live]');
    await waitFor(() => expect(live).toHaveTextContent(PROCESSING));
    const send = screen.getByRole('button', { name: 'Enviar' });
    expect(send).toBeDisabled();
    // Spinner visible dentro del botón. Prueba débil, como la de `ProgressArc`: depende de la
    // clase `animate-spin` del átomo `Spinner` (ícono «loading-arc»), porque jsdom no pinta.
    expect(send.querySelector('svg.animate-spin')).toBeInTheDocument();
    expect(screen.getAllByText(PROCESSING)).toHaveLength(1);

    response.resolve(HttpResponse.json(OK_NEXT));
    expect(await screen.findByRole('progressbar', { name: 'Pregunta 2 de 5' })).toBeInTheDocument();
    expect(calls).toBe(1);
  });

  it.each([
    ['413', () => problem(413)],
    ['415', () => problem(415)],
    ['422 sin code', () => problem(422)],
    ['422 VALIDATION_FAILED', () => problem(422, VALIDATION_FAILED)],
  ])(
    'con %s, sin code de transcripción, muestra el genérico y descarta la grabación (CA-5.8.8, CA-5.8.13 a 5.8.15)',
    async (_status, respond) => {
      withRecording();
      useHandlers(http.post(AUDIO_URL, respond));
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole('button', { name: 'Enviar' }));
      expect(await screen.findByText(GENERIC)).toBeInTheDocument();
      expect(recorder.discard).toHaveBeenCalled();
      expect(screen.queryByText(NO_CONNECTION)).not.toBeInTheDocument();
      expect(screen.getByRole('progressbar', { name: 'Pregunta 1 de 5' })).toBeInTheDocument();
    },
  );

  it('si Backend responde TRANSCRIPTION_EMPTY avisa «No detectamos tu voz, intenta de nuevo.» y descarta la grabación (CA-5.8.11)', async () => {
    withRecording();
    useHandlers(http.post(AUDIO_URL, () => problem(422, 'TRANSCRIPTION_EMPTY')));
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByText(NO_VOICE)).toBeInTheDocument();
    expect(recorder.discard).toHaveBeenCalled();
    expect(screen.getByRole('progressbar', { name: 'Pregunta 1 de 5' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Responder por texto' })).toBeInTheDocument();
  });

  it.each([
    ['con code SESSION_NOT_FOUND', () => problem(404, 'SESSION_NOT_FOUND')],
    ['sin code', () => problem(404)],
  ])(
    'al enviar audio a una entrevista ajena (404 %s) muestra «No encontramos lo que buscabas.» (CA-5.8.21)',
    async (_case, respond) => {
      withRecording();
      useHandlers(http.post(AUDIO_URL, respond));
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole('button', { name: 'Enviar' }));
      expect(await screen.findByText(NOT_FOUND)).toBeInTheDocument();
      // SPEC §5: con un 404 la grabación se conserva.
      expect(recorder.discard).not.toHaveBeenCalled();
      expect(screen.getByRole('progressbar', { name: 'Pregunta 1 de 5' })).toBeInTheDocument();
    },
  );

  it('sin conexión conserva la grabación y el reenvío usa la misma Idempotency-Key (CA-5.8.22)', async () => {
    withRecording();
    const keys: Array<string | null> = [];
    useHandlers(
      http.post(AUDIO_URL, ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key'));
        return keys.length === 1 ? HttpResponse.error() : HttpResponse.json(OK_NEXT);
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByText(NO_CONNECTION)).toBeInTheDocument();
    expect(recorder.discard).not.toHaveBeenCalled();
    expect(screen.getByRole('progressbar', { name: 'Pregunta 1 de 5' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByRole('progressbar', { name: 'Pregunta 2 de 5' })).toBeInTheDocument();
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBeTruthy();
    expect(keys[1]).toBe(keys[0]);
  });

  // En `denied` no hay controles de grabación, así que el aviso no aplica (SPEC §6, CA-5.8.24).
  it.each(['vadFailed'])(
    'el aviso sigue visible mientras se prepara la grabación y si después queda en %s (CA-5.8.24)',
    async (outcome) => {
      const user = userEvent.setup();
      const { refresh } = renderPage();
      await user.click(screen.getByRole('button', { name: 'Grabar' }));
      expect(recorder.start).toHaveBeenCalled();

      recorder.status = 'requesting';
      refresh();
      expect(screen.getByRole('button', { name: 'Grabar' })).toBeDisabled();
      expect(screen.getByText(PRIVACY)).toBeInTheDocument();

      recorder.status = outcome;
      refresh();
      expect(screen.getByText(PRIVACY)).toBeInTheDocument();
    },
  );

  it('oculta el aviso del audio cuando la grabación empieza de verdad (CM-316 D8)', async () => {
    const user = userEvent.setup();
    const { refresh } = renderPage();
    await user.click(screen.getByRole('button', { name: 'Grabar' }));
    recorder.status = 'recording';
    refresh();
    expect(screen.queryByText(PRIVACY)).not.toBeInTheDocument();
  });

  it('si no se puede preparar la grabación muestra el aviso, el campo de texto y «Grabar» (CA-5.8.25)', async () => {
    recorder.status = 'vadFailed';
    const user = userEvent.setup();
    renderPage();
    expect(screen.getByText(VAD_FAILED)).toBeInTheDocument();
    expect(screen.getByLabelText('Respuesta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Pregunta 1 de 5' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Grabar' }));
    expect(recorder.start).toHaveBeenCalled();
  });

  it('con formato no admitido muestra «Tu navegador no permite grabar. Responderás por texto.» y el campo', () => {
    recorder.status = 'unsupported';
    renderPage();
    expect(screen.getByText(UNSUPPORTED)).toBeInTheDocument();
    expect(screen.getByLabelText('Respuesta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Grabar' })).not.toBeInTheDocument();
  });

  it.each([LLM_UNAVAILABLE, LLM_LIMIT_REACHED])(
    'tras un fallo de la IA (%s) con audio y un «Reintentar» exitoso, la pregunta siguiente queda en idle sin grabación previa',
    async (code) => {
      withRecording();
      recorder.discard.mockImplementation(() => {
        recorder.status = 'idle';
        recorder.audio = null;
      });
      useHandlers(
        http.post(AUDIO_URL, () => problem(503, code)),
        http.post(REPROCESS_URL, () => HttpResponse.json(OK_NEXT)),
      );
      const user = userEvent.setup();
      renderPage();
      await user.click(screen.getByRole('button', { name: 'Enviar' }));
      await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
      expect(
        await screen.findByRole('progressbar', { name: 'Pregunta 2 de 5' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Grabar' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Enviar' })).not.toBeInTheDocument();
    },
  );
});
