/**
 * Protege el chat de Simulación con respuesta escrita (HU-5.2, responder por
 * escrito cada pregunta principal y avanzar sin ver retroalimentación;
 * backlog v11.3): avance con «Pregunta k de 5» (CA-5.2.1, respuesta registrada
 * y avance; CA-5.2.14, siguiente pregunta con su texto original), «Enviar»
 * bloqueado vacío (CA-5.2.3), doble selección de «Enviar» (CA-5.2.4),
 * envío a una entrevista que no está en curso (CA-5.2.6, v11.3 D3),
 * entrevista ajena (CA-5.2.7), límite de 4000 caracteres contados por puntos
 * de código NFC y enviados sin recortar (CA-5.2.8, CA-5.2.9, D9), chat sin
 * pausa ni repregunta (CA-5.2.15), sin conexión (CA-5.2.18), fallo de la IA
 * con «Reintentar», también con `LLM_INVALID_OUTPUT` (CA-5.2.19, v11.3 D1),
 * reintentos agotados en dos tramos de 2 usos, el segundo terminado solo con
 * «Ir al inicio» (CA-5.2.20, D3, D4, v11.3 D2, que sustituye a D5), respuesta
 * 200 con forma inesperada (D10), cierre tras la pregunta 5 (CA-5.2.5) y la
 * vuelta a «Nueva entrevista» sin entrada (HU-5.7 aún no existe). Frente al
 * contrato real de `cameia-entrevista` (`origin/develop` `48773cb`), los `409`
 * de `…/reprocess`: el tope de Backend (`TURN_RETRY_LIMIT_REACHED`, v11.3 D7),
 * la entrevista que ya no admite la acción (`SESSION_*`, v11.3 D8) y el turno
 * que ya no espera reintento (`TURN_NOT_RETRYABLE`, v11.3 D9). Los códigos
 * de error se importan de `model/interviewSession.errorCodes` (D2); los topes
 * van como números literales del CA para que un cambio de constante rompa la
 * prueba (SPEC §6, plan de CM-217).
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import i18n from '@/i18n';
import { useHandlers } from '@/test/msw';
import {
  LLM_INVALID_OUTPUT,
  LLM_LIMIT_REACHED,
  LLM_UNAVAILABLE,
  SESSION_ABANDONED,
  SESSION_ALREADY_CLOSED,
  SESSION_TRANSITION_NOT_ALLOWED,
  TURN_NOT_RETRYABLE,
  TURN_RETRY_LIMIT_REACHED,
} from '../model/interviewSession.errorCodes';
import { InterviewSessionPage } from './InterviewSessionPage';

const ANSWERS_URL = '*/api/v1/interviews/sessions/:id/answers';
const REPROCESS_URL = '*/api/v1/interviews/sessions/:id/turns/:turnId/reprocess';

const GENERIC = 'Ocurrió un error. Inténtalo de nuevo.';
const NO_CONNECTION = 'No hay conexión. Revisa tu internet e inténtalo de nuevo.';
const COUNTER = /\d+ \/ 4000 caracteres$/;
const NOT_FOUND = 'No encontramos lo que buscabas.';
const EXHAUSTED =
  'No pudimos evaluar tu respuesta en este momento. Tu respuesta quedó guardada; inténtalo más tarde.';
const NOT_ALLOWED = 'Esta entrevista ya no admite esa acción.';
const RETRYING = 'Procesando tu respuesta…';

const ENTRY = {
  sessionId: 's1',
  sessionLanguage: 'es-CO',
  answerFormat: 'TEXTO',
  question: { turnId: 's1-t1', number: 1, text: 'Cuéntame sobre un proyecto.' },
  progress: { current: 1, total: 5 },
};

/** Respuesta 200 común del contrato previsto: la pregunta 2 sigue. */
const NEXT_QUESTION_TEXT = '¿Cómo resolviste un conflicto en tu equipo?';
const OK_NEXT = {
  turn: { turnId: 's1-t1', status: 'COMPLETED' },
  progress: { currentQuestion: 2, totalQuestions: 5 },
  nextQuestion: { turnId: 's1-t2', number: 2, text: NEXT_QUESTION_TEXT },
  interviewFinished: false,
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

function problem(status: number, code?: string) {
  return HttpResponse.json(
    { title: 'x', detail: 'detalle técnico', status, ...(code ? { code } : {}) },
    { status },
  );
}

const llmUnavailable = () =>
  HttpResponse.json(
    {
      title: 'Service Unavailable',
      detail: 'LLM no disponible',
      status: 503,
      code: LLM_UNAVAILABLE,
    },
    { status: 503 },
  );

const llmLimitReached = () => problem(503, LLM_LIMIT_REACHED);
const llmInvalidOutput = () => problem(503, LLM_INVALID_OUTPUT);
const internalError = () => problem(500, 'INTERNAL_ERROR');
const notFound = () => problem(404, 'SESSION_NOT_FOUND');
const networkError = () => HttpResponse.error();
/** `503` que Backend cuenta como uso de «Reintentar» (suma en la reserva) y el front no (v11.3 D7). */
const databaseUnavailable = () => problem(503, 'DATABASE_UNAVAILABLE');
const retryLimitReached = () => problem(409, TURN_RETRY_LIMIT_REACHED);
const turnNotRetryable = () => problem(409, TURN_NOT_RETRYABLE);

/** Handler de `…/reprocess` que responde en orden y repite la última respuesta. */
function reprocessSequence(...responses: Array<() => Response>) {
  const state = { count: 0 };
  const handler = http.post(REPROCESS_URL, () => {
    const respond = responses[Math.min(state.count, responses.length - 1)] ?? llmUnavailable;
    state.count += 1;
    return respond();
  });
  return { state, handler };
}

async function submitText(user: ReturnType<typeof userEvent.setup>, text = 'Mi respuesta') {
  await user.type(screen.getByLabelText('Respuesta'), text);
  await user.click(screen.getByRole('button', { name: 'Enviar' }));
}

/** Pulsa «Reintentar» y espera a que `…/reprocess` haya respondido y el panel vuelva a estar libre. */
async function retryAndSettle(
  user: ReturnType<typeof userEvent.setup>,
  state: { count: number },
  expectedCalls: number,
) {
  await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
  await waitFor(() => expect(state.count).toBe(expectedCalls));
  await screen.findByRole('button', { name: 'Reintentar' });
}

/**
 * Pulsa el último «Reintentar» del tramo 2 y espera a que `…/reprocess` haya respondido y el
 * panel ya no esté en carga. No basta con que falte «Reintentar»: en carga el botón se llama
 * «Procesando tu respuesta…» (`Button.tsx:124-133`), así que se exige también que ese no esté.
 */
async function lastRetryAndSettle(
  user: ReturnType<typeof userEvent.setup>,
  state: { count: number },
  expectedCalls: number,
) {
  await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
  await waitFor(() => {
    expect(state.count).toBe(expectedCalls);
    expect(screen.queryByRole('button', { name: RETRYING })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
  });
}

/**
 * Pulsa «Reintentar» y espera a que `…/reprocess` haya respondido y el panel ya no esté en carga,
 * sin suponer qué queda en pantalla: lo afirma cada prueba.
 */
async function retryOnce(
  user: ReturnType<typeof userEvent.setup>,
  state: { count: number },
  expectedCalls: number,
) {
  await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
  await waitFor(() => {
    expect(state.count).toBe(expectedCalls);
    expect(screen.queryByRole('button', { name: RETRYING })).not.toBeInTheDocument();
  });
}

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

  it('mantiene «Enviar» deshabilitado con el campo vacío o solo espacios', async () => {
    const calls: string[] = [];
    useHandlers(
      http.post(ANSWERS_URL, () => {
        calls.push('answers');
        return HttpResponse.json(OK_NEXT);
      }),
    );
    const user = userEvent.setup();
    renderPage();
    const field = screen.getByLabelText('Respuesta');
    const send = screen.getByRole('button', { name: 'Enviar' });
    expect(send).toBeDisabled();
    for (const blank of ['   ', '\t\n  \n', ' ']) {
      await user.clear(field);
      await user.click(field);
      await user.paste(blank);
      expect(send).toBeDisabled();
    }
    await user.click(send);
    expect(calls).toHaveLength(0);
  });

  it('con 4001 caracteres marca el contador, muestra el mensaje y no envía', async () => {
    const calls: string[] = [];
    useHandlers(
      http.post(ANSWERS_URL, () => {
        calls.push('answers');
        return HttpResponse.json(OK_NEXT);
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByLabelText('Respuesta'));
    await user.paste('a'.repeat(4001));
    expect(screen.getByText('4001 / 4000 caracteres')).toBeInTheDocument();
    expect(
      screen.getByText('Tu respuesta no puede superar los 4000 caracteres.'),
    ).toBeInTheDocument();
    const send = screen.getByRole('button', { name: 'Enviar' });
    expect(send).toBeDisabled();
    await user.click(send);
    expect(screen.getByLabelText('Respuesta')).toHaveValue('a'.repeat(4001));
    expect(calls).toHaveLength(0);
  });

  it('acepta exactamente 4000 caracteres y los envía tal como se escribieron', async () => {
    const bodies: Array<{ turnId?: string; answerText?: string }> = [];
    useHandlers(
      http.post(ANSWERS_URL, async ({ request }) => {
        bodies.push((await request.json()) as { turnId?: string; answerText?: string });
        return HttpResponse.json(OK_NEXT);
      }),
    );
    const user = userEvent.setup();
    renderPage();
    const written = `  ${'a'.repeat(3996)}  `;
    await user.click(screen.getByLabelText('Respuesta'));
    await user.paste(written);
    expect(screen.getByText('4000 / 4000 caracteres')).toBeInTheDocument();
    expect(
      screen.queryByText('Tu respuesta no puede superar los 4000 caracteres.'),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByRole('progressbar', { name: 'Pregunta 2 de 5' })).toBeInTheDocument();
    expect(bodies).toHaveLength(1);
    expect(bodies[0]?.answerText).toBe(written);
  });

  it('cuenta caracteres como puntos de código NFC', async () => {
    const user = userEvent.setup();
    renderPage();
    const field = screen.getByLabelText('Respuesta');
    await user.click(field);
    await user.paste('😀'.repeat(4000));
    expect(screen.getByText(COUNTER)).toHaveTextContent('4000 / 4000 caracteres');
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeEnabled();

    await user.clear(field);
    await user.paste('😀'.repeat(4001));
    expect(screen.getByText(COUNTER)).toHaveTextContent('4001 / 4000 caracteres');
    expect(
      screen.getByText('Tu respuesta no puede superar los 4000 caracteres.'),
    ).toBeInTheDocument();

    await user.clear(field);
    await user.paste('é');
    expect(screen.getByText(COUNTER)).toHaveTextContent('1 / 4000 caracteres');
  });

  it('al enviar muestra la pregunta 2 con su texto original, «Pregunta 2 de 5», el campo vacío y ninguna retroalimentación', async () => {
    useHandlers(
      http.post(ANSWERS_URL, () =>
        HttpResponse.json({ ...OK_NEXT, feedback: 'Excelente respuesta, puntaje 9 de 10.' }),
      ),
    );
    const user = userEvent.setup();
    renderPage();
    await submitText(user, 'Lideré una migración.');
    expect(
      await screen.findByRole('heading', { level: 1, name: NEXT_QUESTION_TEXT }),
    ).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Pregunta 2 de 5' })).toBeInTheDocument();
    expect(screen.getByLabelText('Respuesta')).toHaveValue('');
    expect(screen.queryByText(/Excelente respuesta/)).not.toBeInTheDocument();
  });

  it('con doble clic en «Enviar» registra una sola respuesta y muestra «Procesando tu respuesta…»', async () => {
    const calls: string[] = [];
    useHandlers(
      http.post(ANSWERS_URL, async () => {
        calls.push('answers');
        await delay(200);
        return HttpResponse.json(OK_NEXT);
      }),
    );
    const user = userEvent.setup();
    const { container } = renderPage();
    await user.type(screen.getByLabelText('Respuesta'), 'Mi respuesta');
    await user.dblClick(screen.getByRole('button', { name: 'Enviar' }));
    const live = container.querySelector('[aria-live]');
    await waitFor(() => expect(live).toHaveTextContent('Procesando tu respuesta…'));
    expect(screen.queryByRole('button', { name: 'Enviar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar' })).toBeDisabled();
    expect(await screen.findByRole('progressbar', { name: 'Pregunta 2 de 5' })).toBeInTheDocument();
    expect(calls).toHaveLength(1);
  });

  it('tras un fallo de red el reenvío del mismo turno usa la misma Idempotency-Key', async () => {
    const keys: Array<string | null> = [];
    const turnIds: Array<string | undefined> = [];
    useHandlers(
      http.post(ANSWERS_URL, async ({ request }) => {
        keys.push(request.headers.get('Idempotency-Key'));
        turnIds.push(((await request.json()) as { turnId?: string }).turnId);
        return keys.length === 1 ? HttpResponse.error() : HttpResponse.json(OK_NEXT);
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    expect(await screen.findByText(NO_CONNECTION)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByRole('progressbar', { name: 'Pregunta 2 de 5' })).toBeInTheDocument();
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBeTruthy();
    expect(keys[1]).toBe(keys[0]);
    expect(turnIds).toEqual(['s1-t1', 's1-t1']);
  });

  it('sin conexión muestra el aviso y conserva el texto', async () => {
    useHandlers(http.post(ANSWERS_URL, () => HttpResponse.error()));
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    expect(await screen.findByText(NO_CONNECTION)).toBeInTheDocument();
    expect(screen.getByLabelText('Respuesta')).toHaveValue('Mi respuesta');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Cuéntame sobre un proyecto.' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Pregunta 1 de 5' })).toBeInTheDocument();
  });

  it('una respuesta 200 con forma inesperada muestra el error genérico, no el de conexión', async () => {
    const calls: string[] = [];
    useHandlers(
      http.post(ANSWERS_URL, () => {
        calls.push('answers');
        return HttpResponse.json({ turn: { turnId: 's1-t1', status: 'COMPLETED' } });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    await waitFor(() => expect(calls).toHaveLength(1));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Enviar' })).toBeEnabled());
    expect(screen.queryByText(NO_CONNECTION)).not.toBeInTheDocument();
    expect(screen.getByText(GENERIC)).toBeInTheDocument();
    expect(screen.getByLabelText('Respuesta')).toHaveValue('Mi respuesta');
    expect(screen.getByRole('progressbar', { name: 'Pregunta 1 de 5' })).toBeInTheDocument();
  });

  it('si la IA falla muestra el error genérico con «Reintentar»', async () => {
    useHandlers(http.post(ANSWERS_URL, llmUnavailable));
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    expect(await screen.findByText(GENERIC)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Respuesta')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ir al inicio' })).not.toBeInTheDocument();
    expect(screen.queryByText('LLM no disponible')).not.toBeInTheDocument();
  });

  it('si la IA entrega una evaluación con formato inválido muestra el error genérico con «Reintentar»', async () => {
    useHandlers(http.post(ANSWERS_URL, llmInvalidOutput));
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Respuesta')).not.toBeInTheDocument();
    expect(screen.getByText(GENERIC)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ir al inicio' })).not.toBeInTheDocument();
    expect(screen.queryByText('detalle técnico')).not.toBeInTheDocument();
  });

  it('tras 2 usos fallidos muestra el mensaje de CA-5.2.20, permite 2 usos más y después deja solo «Ir al inicio»', async () => {
    const { state, handler } = reprocessSequence(llmUnavailable);
    useHandlers(http.post(ANSWERS_URL, llmUnavailable), handler);
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    await retryAndSettle(user, state, 1);
    expect(screen.getByText(GENERIC)).toBeInTheDocument();
    expect(screen.queryByText(EXHAUSTED)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ir al inicio' })).not.toBeInTheDocument();

    for (const call of [2, 3]) {
      await retryAndSettle(user, state, call);
      expect(await screen.findByText(EXHAUSTED)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/inicio');
    }

    await lastRetryAndSettle(user, state, 4);
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
    expect(screen.getByText(EXHAUSTED)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/inicio');
    expect(state.count).toBe(4);
  });

  it('LLM_LIMIT_REACHED al reintentar suma al tope igual que LLM_UNAVAILABLE', async () => {
    const { state, handler } = reprocessSequence(llmLimitReached);
    useHandlers(http.post(ANSWERS_URL, llmUnavailable), handler);
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    await retryAndSettle(user, state, 1);
    await retryAndSettle(user, state, 2);
    expect(await screen.findByText(EXHAUSTED)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toBeInTheDocument();
  });

  it('LLM_INVALID_OUTPUT al reintentar suma al tope igual que LLM_UNAVAILABLE', async () => {
    const { state, handler } = reprocessSequence(llmInvalidOutput);
    useHandlers(http.post(ANSWERS_URL, llmUnavailable), handler);
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    await retryAndSettle(user, state, 1);
    await retryAndSettle(user, state, 2);
    expect(await screen.findByText(EXHAUSTED)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/inicio');
  });

  it('un fallo de red al reintentar muestra «No hay conexión…» sin sumar al tope', async () => {
    const { state, handler } = reprocessSequence(networkError, llmUnavailable);
    useHandlers(http.post(ANSWERS_URL, llmUnavailable), handler);
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    await retryAndSettle(user, state, 1);
    expect(screen.getByText(NO_CONNECTION)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();

    await retryAndSettle(user, state, 2);
    expect(screen.getByText(GENERIC)).toBeInTheDocument();
    expect(screen.queryByText(EXHAUSTED)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ir al inicio' })).not.toBeInTheDocument();
  });

  it('otro error al reintentar muestra el genérico sin sumar al tope', async () => {
    const { state, handler } = reprocessSequence(internalError);
    useHandlers(http.post(ANSWERS_URL, llmUnavailable), handler);
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    for (const call of [1, 2, 3]) {
      await retryAndSettle(user, state, call);
      expect(screen.queryByText(EXHAUSTED)).not.toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Ir al inicio' })).not.toBeInTheDocument();
      expect(screen.getByText(GENERIC)).toBeInTheDocument();
    }
  });

  it('un 404 al reintentar muestra «No encontramos lo que buscabas.» sin sumar', async () => {
    const { state, handler } = reprocessSequence(notFound);
    useHandlers(http.post(ANSWERS_URL, llmUnavailable), handler);
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    await retryAndSettle(user, state, 1);
    expect(screen.getByRole('alert')).toHaveTextContent(NOT_FOUND);
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ir al inicio' })).not.toBeInTheDocument();
  });

  it('tras agotar «Reintentar», «Ir al inicio» no desaparece si llega un fallo de otro tipo', async () => {
    const { state, handler } = reprocessSequence(llmUnavailable, llmUnavailable, networkError);
    useHandlers(http.post(ANSWERS_URL, llmUnavailable), handler);
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    await retryAndSettle(user, state, 1);
    await retryAndSettle(user, state, 2);
    expect(await screen.findByText(EXHAUSTED)).toBeInTheDocument();

    await retryAndSettle(user, state, 3);
    expect(screen.getByText(NO_CONNECTION)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toBeInTheDocument();
  });

  it('en el tramo 2 un «Reintentar» con éxito avanza a la pregunta siguiente y el contador vuelve a cero', async () => {
    const { state, handler } = reprocessSequence(llmUnavailable, llmUnavailable, () =>
      HttpResponse.json(OK_NEXT),
    );
    useHandlers(http.post(ANSWERS_URL, llmUnavailable), handler);
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    await retryAndSettle(user, state, 1);
    await retryAndSettle(user, state, 2);
    expect(await screen.findByText(EXHAUSTED)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('progressbar', { name: 'Pregunta 2 de 5' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: NEXT_QUESTION_TEXT })).toBeInTheDocument();
    expect(screen.getByLabelText('Respuesta')).toHaveValue('');
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
    expect(screen.queryByText(EXHAUSTED)).not.toBeInTheDocument();
    expect(state.count).toBe(3);

    await submitText(user, 'Segunda respuesta');
    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.getByText(GENERIC)).toBeInTheDocument();
    expect(screen.queryByText(EXHAUSTED)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ir al inicio' })).not.toBeInTheDocument();
  });

  it('en el tramo 2 sin red o un 404 al reintentar no gastan un uso', async () => {
    const { state, handler } = reprocessSequence(
      llmUnavailable,
      llmUnavailable,
      networkError,
      notFound,
      llmUnavailable,
      llmUnavailable,
    );
    useHandlers(http.post(ANSWERS_URL, llmUnavailable), handler);
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    await retryAndSettle(user, state, 1);
    await retryAndSettle(user, state, 2);
    expect(await screen.findByText(EXHAUSTED)).toBeInTheDocument();

    await retryAndSettle(user, state, 3);
    expect(screen.getByText(NO_CONNECTION)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toBeInTheDocument();

    await retryAndSettle(user, state, 4);
    expect(screen.getByText(NOT_FOUND)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toBeInTheDocument();

    await retryAndSettle(user, state, 5);
    expect(screen.getByText(EXHAUSTED)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();

    await lastRetryAndSettle(user, state, 6);
    expect(screen.queryByRole('button', { name: 'Reintentar' })).toBeNull();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toBeInTheDocument();
    expect(state.count).toBe(6);
  });

  it('con doble clic en «Reintentar» del mensaje de CA-5.2.20 pide una sola evaluación y deshabilita el botón mientras espera', async () => {
    let releaseThird: () => void = () => {};
    const third = new Promise<void>((resolve) => {
      releaseThird = resolve;
    });
    const state = { count: 0 };
    useHandlers(
      http.post(ANSWERS_URL, llmUnavailable),
      http.post(REPROCESS_URL, async () => {
        state.count += 1;
        if (state.count === 3) await third;
        return llmUnavailable();
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    await retryAndSettle(user, state, 1);
    await retryAndSettle(user, state, 2);
    expect(await screen.findByText(EXHAUSTED)).toBeInTheDocument();

    // Se toma antes del clic: en carga su nombre accesible pasa a «Procesando tu respuesta…».
    const retry = screen.getByRole('button', { name: 'Reintentar' });
    await user.dblClick(retry);
    await waitFor(() => expect(state.count).toBeGreaterThanOrEqual(3));
    await waitFor(() => expect(retry).toBeDisabled());
    expect(state.count).toBe(3);

    releaseThird();
    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeEnabled();
    expect(state.count).toBe(3);
  });

  it('«Reintentar» con éxito avanza a la pregunta siguiente', async () => {
    // Su propio `…/reprocess`: el mock por defecto no vio el fallo de `…/answers` forzado aquí y,
    // con el orden real, respondería `TURN_NOT_RETRYABLE` (SPEC §6, lección 6; v11.3 D10).
    useHandlers(
      http.post(ANSWERS_URL, llmUnavailable),
      http.post(REPROCESS_URL, () => HttpResponse.json(OK_NEXT)),
    );
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Respuesta'), 'Mi respuesta');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    await user.click(await screen.findByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('progressbar', { name: 'Pregunta 2 de 5' })).toBeInTheDocument();
  });

  it('con una entrevista ajena o inexistente muestra «No encontramos lo que buscabas.»', async () => {
    useHandlers(http.post(ANSWERS_URL, () => problem(404, 'SESSION_NOT_FOUND')));
    const withCode = renderPage();
    await submitText(userEvent.setup());
    expect(await screen.findByText(NOT_FOUND)).toBeInTheDocument();
    withCode.unmount();

    useHandlers(http.post(ANSWERS_URL, () => problem(404)));
    renderPage();
    await submitText(userEvent.setup());
    expect(await screen.findByText(NOT_FOUND)).toBeInTheDocument();
  });

  it('en una entrevista con Texto solo muestra el campo «Respuesta» y «Enviar»', () => {
    renderPage();
    expect(screen.getAllByRole('textbox')).toHaveLength(1);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveAccessibleName('Enviar');
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: /pausar|repreguntar|reintentar/i })).toBeNull();
  });

  it('tras la pregunta 5 sigue con el cierre de HU-5.5, sin campo ni «Enviar» (CA-5.2.5, backlog v11)', async () => {
    const user = userEvent.setup();
    renderPage({
      ...ENTRY,
      question: { turnId: 's1-t5', number: 5, text: 'Última pregunta' },
      progress: { current: 5, total: 5 },
    });
    await user.type(screen.getByLabelText('Respuesta'), 'Fin');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(
      // Con HU-5.5 el título pasa al mensaje de cierre de CA-5.5.3.
      await screen.findByRole('heading', { level: 1, name: /^Tu entrevista terminó\./ }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Respuesta')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enviar' })).not.toBeInTheDocument();
  });

  it('con LLM_LIMIT_REACHED se trata como fallo de la IA, con «Reintentar»', async () => {
    useHandlers(http.post(ANSWERS_URL, llmLimitReached));
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByLabelText('Respuesta'), 'Mi respuesta');
    await user.click(screen.getByRole('button', { name: 'Enviar' }));
    expect(await screen.findByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('si la entrevista no está en curso rechaza la respuesta con «Esta entrevista ya no admite esa acción.» (CA-5.2.6)', async () => {
    const { state, handler } = reprocessSequence(llmUnavailable);
    useHandlers(
      http.post(ANSWERS_URL, () => problem(409, SESSION_TRANSITION_NOT_ALLOWED)),
      handler,
    );
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    expect(await screen.findByText(NOT_ALLOWED)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
    expect(screen.queryByText('detalle técnico')).not.toBeInTheDocument();
    expect(state.count).toBe(0);
  });

  it('si Backend agota el tope antes que la pantalla, el 5.º «Reintentar» deja el mensaje de CA-5.2.20 solo con «Ir al inicio»', async () => {
    const { state, handler } = reprocessSequence(
      llmUnavailable,
      llmUnavailable,
      databaseUnavailable,
      llmUnavailable,
      retryLimitReached,
    );
    useHandlers(http.post(ANSWERS_URL, llmUnavailable), handler);
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    await retryAndSettle(user, state, 1);
    await retryAndSettle(user, state, 2);

    await retryAndSettle(user, state, 3);
    expect(screen.getByText(GENERIC)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toBeInTheDocument();

    // Al front le queda 1 uso; Backend ya contó 4 (v11.3 D7).
    await retryAndSettle(user, state, 4);
    expect(screen.getByText(EXHAUSTED)).toBeInTheDocument();

    await lastRetryAndSettle(user, state, 5);
    expect(await screen.findByText(EXHAUSTED)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/inicio');
    expect(screen.queryByText('detalle técnico')).not.toBeInTheDocument();
    expect(state.count).toBe(5);
  });

  it('con TURN_RETRY_LIMIT_REACHED en el primer «Reintentar» pasa directo al estado final de CA-5.2.20', async () => {
    const { state, handler } = reprocessSequence(retryLimitReached);
    useHandlers(http.post(ANSWERS_URL, llmUnavailable), handler);
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    await retryOnce(user, state, 1);
    expect(await screen.findByText(EXHAUSTED)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/inicio');
    expect(state.count).toBe(1);
  });

  /** R10 y R11: un `409 SESSION_*` en `…/reprocess` cierra igual que en `…/answers` (v11.3 D8). */
  async function expectNotAllowedOnRetry(state: { count: number }) {
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    await retryOnce(user, state, 1);
    expect(await screen.findByText(NOT_ALLOWED)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ir al inicio' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Respuesta')).not.toBeInTheDocument();
    expect(screen.queryByText('detalle técnico')).not.toBeInTheDocument();
    expect(state.count).toBe(1);
  }

  it('si al reintentar la entrevista no admite la acción muestra «Esta entrevista ya no admite esa acción.» sin «Reintentar»', async () => {
    const { state, handler } = reprocessSequence(() =>
      problem(409, SESSION_TRANSITION_NOT_ALLOWED),
    );
    useHandlers(http.post(ANSWERS_URL, llmUnavailable), handler);
    await expectNotAllowedOnRetry(state);
  });

  it('si al reintentar la entrevista ya está cerrada muestra «Esta entrevista ya no admite esa acción.» sin «Reintentar»', async () => {
    const { state, handler } = reprocessSequence(() => problem(409, SESSION_ALREADY_CLOSED));
    useHandlers(http.post(ANSWERS_URL, llmUnavailable), handler);
    await expectNotAllowedOnRetry(state);
  });

  it('si al reintentar la entrevista se abandonó muestra su mensaje sin «Reintentar»', async () => {
    const { state, handler } = reprocessSequence(() => problem(409, SESSION_ABANDONED));
    useHandlers(http.post(ANSWERS_URL, llmUnavailable), handler);
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    await retryOnce(user, state, 1);
    expect(await screen.findByText('Sesión abandonada: no genera evaluación.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reintentar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ir al inicio' })).not.toBeInTheDocument();
    expect(state.count).toBe(1);
  });

  it('si el turno ya no espera reintento lo dice, con «Ir al inicio» y sin «Reintentar»', async () => {
    const { state, handler } = reprocessSequence(turnNotRetryable);
    useHandlers(http.post(ANSWERS_URL, llmUnavailable), handler);
    const user = userEvent.setup();
    renderPage();
    await submitText(user);
    await lastRetryAndSettle(user, state, 1);
    expect(screen.getByText('Tu respuesta no está esperando un reintento.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir al inicio' })).toHaveAttribute('href', '/inicio');
    expect(screen.queryByText('detalle técnico')).not.toBeInTheDocument();
    expect(state.count).toBe(1);
  });

  describe('cierre de la entrevista (HU-5.5)', () => {
    const CLOSING = 'Tu entrevista terminó. Tu reporte completo estará disponible próximamente.';
    const CONSOLIDATION_URL = '*/api/v1/interviews/sessions/:id/consolidation';
    const LAST = {
      ...ENTRY,
      question: { turnId: 's1-t5', number: 5, text: 'Última pregunta' },
      progress: { current: 5, total: 5 },
    };
    const FINISHED = {
      turn: { turnId: 's1-t5', status: 'COMPLETED' },
      progress: { currentQuestion: 5, totalQuestions: 5 },
      nextQuestion: null,
      interviewFinished: true,
    };
    const FINALIZED = {
      sessionId: 's1',
      status: 'FINALIZADA',
      interviewFinished: true,
      progress: { currentQuestion: 5, totalQuestions: 5 },
      pendingQuestion: null,
      history: [],
    };

    async function answerLast() {
      const user = userEvent.setup();
      renderPage(LAST);
      await user.type(screen.getByLabelText('Respuesta'), 'Fin');
      await user.click(screen.getByRole('button', { name: 'Enviar' }));
      return user;
    }

    it('mientras reúne la evaluación muestra «Procesando tu respuesta…», no «Tu entrevista terminó.», sin campo ni «Enviar» (CA-5.5.6)', async () => {
      useHandlers(
        http.post(ANSWERS_URL, () => HttpResponse.json(FINISHED)),
        http.post(CONSOLIDATION_URL, async () => {
          await delay('infinite');
          return HttpResponse.json(FINALIZED);
        }),
      );
      await answerLast();
      expect(await screen.findByText('Procesando tu respuesta…')).toBeInTheDocument();
      expect(screen.queryByLabelText('Respuesta')).not.toBeInTheDocument();
      expect(screen.queryByText(/^Tu entrevista terminó/)).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Enviar' })).not.toBeInTheDocument();
    });

    it('al quedar finalizada muestra el mensaje de cierre sin resultados (CA-5.5.3)', async () => {
      useHandlers(
        http.post(ANSWERS_URL, () => HttpResponse.json(FINISHED)),
        http.post(CONSOLIDATION_URL, () => HttpResponse.json(FINALIZED)),
      );
      await answerLast();
      expect(await screen.findByRole('heading', { level: 1, name: CLOSING })).toBeInTheDocument();
      expect(screen.queryByLabelText('Respuesta')).not.toBeInTheDocument();
      expect(screen.queryByText('Procesando tu respuesta…')).not.toBeInTheDocument();
    });

    it('ofrece «Ver mis entrevistas» deshabilitado con «Próximamente» mientras HU-5.10 no exista (CA-5.5.3, CM-376)', async () => {
      useHandlers(
        http.post(ANSWERS_URL, () => HttpResponse.json(FINISHED)),
        http.post(CONSOLIDATION_URL, () => HttpResponse.json(FINALIZED)),
      );
      await answerLast();
      expect(await screen.findByRole('button', { name: 'Ver mis entrevistas' })).toBeDisabled();
      expect(screen.getByText('Próximamente')).toBeInTheDocument();
    });

    it('si la evaluación no se reúne muestra el error con «Reintentar», que pide otro ciclo (CA-5.5.11)', async () => {
      let calls = 0;
      useHandlers(
        http.post(ANSWERS_URL, () => HttpResponse.json(FINISHED)),
        http.post(CONSOLIDATION_URL, () => {
          calls += 1;
          if (calls === 1) {
            return HttpResponse.json(
              { title: 'x', detail: 'x', status: 503, code: 'SESSION_CONSOLIDATION_FAILED' },
              { status: 503 },
            );
          }
          return HttpResponse.json(FINALIZED);
        }),
      );
      const user = await answerLast();
      expect(await screen.findByText(GENERIC)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Reintentar' }));
      expect(await screen.findByRole('heading', { level: 1, name: CLOSING })).toBeInTheDocument();
      expect(calls).toBe(2);
    });

    it('en una entrevista abandonada rechaza la respuesta con su mensaje y sin campo (CA-5.5.4)', async () => {
      useHandlers(
        http.post(ANSWERS_URL, () =>
          HttpResponse.json(
            { title: 'x', detail: 'x', status: 409, code: 'SESSION_ABANDONED' },
            { status: 409 },
          ),
        ),
      );
      await answerLast();
      expect(
        await screen.findByText('Sesión abandonada: no genera evaluación.'),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText('Respuesta')).not.toBeInTheDocument();
    });

    it('en una entrevista ya cerrada avisa que no admite la acción (CA-5.5.5)', async () => {
      useHandlers(
        http.post(ANSWERS_URL, () =>
          HttpResponse.json(
            { title: 'x', detail: 'x', status: 409, code: 'SESSION_ALREADY_CLOSED' },
            { status: 409 },
          ),
        ),
      );
      await answerLast();
      expect(
        await screen.findByText('Esta entrevista ya no admite esa acción.'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Enviar' })).not.toBeInTheDocument();
    });
  });
});
