/**
 * Mocks de Entrevistas mientras cameia-entrevista no publique sus
 * endpoints (solo expone `/health`):
 * - POST /api/v1/interviews/sessions (HU-4.4, CA-4.4.1): 201 con un sessionId;
 *   la misma `Idempotency-Key` devuelve la misma sesión.
 * - POST …/sessions/{id}/answers (HU-5.2): registra la respuesta del turno
 *   pendiente y devuelve la siguiente pregunta; 422 si está vacía o pasa de
 *   4000 caracteres (CA-5.2.9, CA-5.2.10); misma `Idempotency-Key` → mismo
 *   resultado (CA-5.2.11).
 * - POST …/turns/{turnId}/reprocess (provisional, CA-5.2.19).
 * - POST …/sessions/{id}/answers/audio (HU-5.8): mismo avance que el texto;
 *   la transcripción la simula el backend real (HU-5.12).
 * - POST …/sessions/{id}/start (HU-4.5): pregunta 1 y la forma de respuesta.
 * - DELETE …/sessions/{id} (provisional, CA-4.5.17): 204.
 *
 * Las preguntas son datos de prueba; el texto real lo planifica el backend
 * (HU-4.5).
 */
import { http, HttpResponse } from 'msw';

const MOCK_QUESTIONS = [
  'Cuéntame sobre un proyecto del que te sientas orgulloso.',
  'Describe una situación en la que tuviste que resolver un conflicto con alguien de tu equipo. ¿Qué hiciste y cuál fue el resultado?',
  '¿Cómo priorizas cuando tienes varias entregas con la misma fecha?',
  'Háblame de un error que cometiste en el trabajo y de qué aprendiste.',
  '¿Por qué te interesa este rol?',
];

/** Pregunta pendiente (índice desde 0) por sesión. */
const pendingBySession = new Map<string, number>();
/** Resultado ya calculado por `Idempotency-Key`. */
const resultByKey = new Map<string, unknown>();

function questionDto(sessionId: string, index: number) {
  return {
    turnId: `${sessionId}-t${index + 1}`,
    number: index + 1,
    text: MOCK_QUESTIONS[index],
  };
}

function advance(sessionId: string, turnId: string) {
  const answered = Number(turnId.split('-t').pop()) - 1;
  const next = answered + 1;
  pendingBySession.set(sessionId, next);
  const finished = next >= MOCK_QUESTIONS.length;
  return {
    turn: { turnId, status: 'COMPLETED' },
    progress: {
      currentQuestion: finished ? MOCK_QUESTIONS.length : next + 1,
      totalQuestions: MOCK_QUESTIONS.length,
    },
    nextQuestion: finished ? null : questionDto(sessionId, next),
    interviewFinished: finished,
  };
}

/** Forma de respuesta elegida al crear la sesión (HU-4.3). */
const formatBySession = new Map<string, string>();

/** Reinicia el estado en memoria entre pruebas. */
export function resetInterviewSessions() {
  pendingBySession.clear();
  formatBySession.clear();
  resultByKey.clear();
}

export const interviewSessionsHandlers = [
  http.post('*/api/v1/interviews/sessions/:sessionId/answers', async ({ request, params }) => {
    const sessionId = String(params.sessionId);
    const key = request.headers.get('Idempotency-Key') ?? '';
    const cached = resultByKey.get(key);
    if (cached) return HttpResponse.json(cached);

    const body = (await request.json()) as { turnId?: string; answerText?: string };
    const text = (body.answerText ?? '').trim();
    if (!text || text.length > 4000) {
      return HttpResponse.json(
        {
          title: 'Unprocessable Content',
          detail: 'Respuesta inválida',
          status: 422,
          code: 'VALIDATION_FAILED',
          errors: [
            {
              field: 'answerText',
              code: text ? 'TOO_LONG' : 'REQUIRED',
              message: 'Respuesta inválida',
            },
          ],
        },
        { status: 422 },
      );
    }
    const result = advance(sessionId, String(body.turnId));
    resultByKey.set(key, result);
    return HttpResponse.json(result);
  }),

  http.post(
    '*/api/v1/interviews/sessions/:sessionId/answers/audio',
    async ({ request, params }) => {
      const key = request.headers.get('Idempotency-Key') ?? '';
      const cached = resultByKey.get(key);
      if (cached) return HttpResponse.json(cached);
      const form = await request.formData();
      const turnId = form.get('turnId');
      const result = advance(String(params.sessionId), typeof turnId === 'string' ? turnId : '');
      resultByKey.set(key, result);
      return HttpResponse.json(result);
    },
  ),

  http.post('*/api/v1/interviews/sessions/:sessionId/start', ({ params }) => {
    const sessionId = String(params.sessionId);
    pendingBySession.set(sessionId, 0);
    return HttpResponse.json({
      status: 'EN_CURSO',
      answerFormat: formatBySession.get(sessionId) ?? 'TEXTO',
      question: questionDto(sessionId, 0),
      progress: { currentQuestion: 1, totalQuestions: MOCK_QUESTIONS.length },
    });
  }),

  http.delete('*/api/v1/interviews/sessions/:sessionId', ({ params }) => {
    formatBySession.delete(String(params.sessionId));
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('*/api/v1/interviews/sessions/:sessionId/turns/:turnId/reprocess', ({ params }) =>
    HttpResponse.json(advance(String(params.sessionId), String(params.turnId))),
  ),

  http.post('*/api/v1/interviews/sessions', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    const key = request.headers.get('Idempotency-Key') ?? '';
    const cached = resultByKey.get(key);
    if (cached) return HttpResponse.json(cached, { status: 201 });

    if (!body.profileId || !body.targetRoleId || !body.tone || !body.mode) {
      return HttpResponse.json(
        {
          title: 'Unprocessable Content',
          detail: 'Configuración inválida',
          status: 422,
          code: 'VALIDATION_FAILED',
          errors: [
            ...(!body.profileId
              ? [{ field: 'profileId', code: 'REQUIRED', message: 'Requerido' }]
              : []),
            ...(!body.targetRoleId
              ? [{ field: 'targetRoleId', code: 'REQUIRED', message: 'Requerido' }]
              : []),
          ],
        },
        { status: 422 },
      );
    }

    const sessionId = crypto.randomUUID();
    formatBySession.set(sessionId, body.answerFormat === 'AUDIO' ? 'AUDIO' : 'TEXTO');
    const created = { sessionId, status: 'CONFIGURADA', ongoingSession: null };
    resultByKey.set(key, created);
    return HttpResponse.json(created, { status: 201 });
  }),
];
