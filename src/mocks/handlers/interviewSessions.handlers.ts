/**
 * Mocks de Entrevistas mientras cameia-entrevista no publique sus
 * endpoints (solo expone `/health`):
 * - POST /api/v1/interviews/sessions (HU-4.4, CA-4.4.1): 201 con un session_id.
 * - POST …/sessions/{id}/answers (HU-5.2): registra la respuesta del turno
 *   pendiente y devuelve la siguiente pregunta; 422 si está vacía o pasa de
 *   4000 caracteres (CA-5.2.9, CA-5.2.10); misma `Idempotency-Key` → mismo
 *   resultado (CA-5.2.11).
 * - POST …/turns/{turno_id}/reprocess (provisional, CA-5.2.19).
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
    turno_id: `${sessionId}-t${index + 1}`,
    numero: index + 1,
    texto: MOCK_QUESTIONS[index],
  };
}

function advance(sessionId: string, turnId: string) {
  const answered = Number(turnId.split('-t').pop()) - 1;
  const next = answered + 1;
  pendingBySession.set(sessionId, next);
  const finished = next >= MOCK_QUESTIONS.length;
  return {
    turno: { turno_id: turnId, estado: 'COMPLETED' },
    progreso: {
      pregunta_actual: finished ? MOCK_QUESTIONS.length : next + 1,
      total_preguntas: MOCK_QUESTIONS.length,
    },
    siguiente_pregunta: finished ? null : questionDto(sessionId, next),
    entrevista_terminada: finished,
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

    const body = (await request.json()) as { turno_id?: string; respuesta_texto?: string };
    const text = (body.respuesta_texto ?? '').trim();
    if (!text || text.length > 4000) {
      return HttpResponse.json(
        {
          title: 'Unprocessable Content',
          detail: 'Respuesta inválida',
          status: 422,
          code: 'VALIDATION_ERROR',
          errors: [
            {
              field: 'respuesta_texto',
              code: text ? 'TOO_LONG' : 'REQUIRED',
              message: 'Respuesta inválida',
            },
          ],
        },
        { status: 422 },
      );
    }
    const result = advance(sessionId, String(body.turno_id));
    resultByKey.set(key, result);
    return HttpResponse.json(result);
  }),

  http.post('*/api/v1/interviews/sessions/:sessionId/start', ({ params }) => {
    const sessionId = String(params.sessionId);
    pendingBySession.set(sessionId, 0);
    return HttpResponse.json({
      estado: 'EN_CURSO',
      forma_respuesta: formatBySession.get(sessionId) ?? 'TEXTO',
      pregunta: questionDto(sessionId, 0),
      progreso: { pregunta_actual: 1, total_preguntas: MOCK_QUESTIONS.length },
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

    if (!body.profile_id || !body.target_role_id || !body.tone || !body.mode) {
      return HttpResponse.json(
        {
          title: 'Unprocessable Content',
          status: 422,
          code: 'VALIDATION_ERROR',
          errors: [
            ...(!body.profile_id ? [{ field: 'profile_id', code: 'REQUIRED' }] : []),
            ...(!body.target_role_id ? [{ field: 'target_role_id', code: 'REQUIRED' }] : []),
          ],
        },
        { status: 422 },
      );
    }

    const sessionId = crypto.randomUUID();
    formatBySession.set(sessionId, body.answer_format === 'AUDIO' ? 'AUDIO' : 'TEXTO');
    return HttpResponse.json(
      {
        session_id: sessionId,
        status: 'CONFIGURADA',
        ongoing_session: null,
      },
      { status: 201 },
    );
  }),
];
