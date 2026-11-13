/**
 * Mocks de Entrevistas. El contrato de `…/answers` y `…/reprocess` ya está
 * publicado (`InterviewSessionController` y su OpenAPI, `cameia-entrevista`
 * `origin/develop` `48773cb`); los mocks lo siguen en lo que afecta a los CA
 * de HU-5.2 (SPEC de interview-session §9, v11.3 D10). El audio y la
 * creación de sesión siguen siendo del contrato previsto:
 * - POST /api/v1/interviews/sessions (HU-4.4, CA-4.4.1): 201 con un sessionId;
 *   la misma `Idempotency-Key` devuelve la misma sesión.
 * - POST …/sessions/{id}/answers (HU-5.2): registra la respuesta del turno
 *   pendiente y devuelve la siguiente pregunta. Valida antes de mirar la caché:
 *   422 si falta la `Idempotency-Key` o si la respuesta está vacía o pasa de
 *   4000 caracteres, contados como puntos de código NFC sobre lo recibido sin
 *   recortar (CA-5.2.4, CA-5.2.8, CA-5.2.9, CA-5.2.10). Caché propia con huella
 *   (turno y texto): misma clave y mismo cuerpo → mismo resultado (CA-5.2.11);
 *   otro cuerpo → 409 IDEMPOTENCY_KEY_CONFLICT.
 * - POST …/turns/{turnId}/reprocess (CA-5.2.19, CA-5.2.20): solo un turno que
 *   espera reintento (409 TURN_NOT_RETRYABLE), con tope de 4 usos por turno
 *   (409 TURN_RETRY_LIMIT_REACHED). `failInterviewEvaluations` hace fallar la
 *   evaluación con 503 LLM_UNAVAILABLE.
 * - POST …/sessions/{id}/consolidation (HU-5.5): la entrevista queda FINALIZADA.
 * - POST …/sessions/{id}/answers/audio (HU-5.8): mismo avance que el texto;
 *   la transcripción la simula el backend real (HU-5.12).
 * - POST …/sessions/{id}/start (HU-4.5) y GET …/{id}/state: objeto de estado
 *   con la pregunta pendiente (aviso de Backend del 7-11-2026, §6.1).
 * - DELETE …/sessions/{id} (provisional, CA-4.5.17): 204.
 *
 * Los `code` de error van como literales: la política de ESLint de `mocks` no
 * deja importar de `features`. Son copia de `ErrorCode.java` de
 * `cameia-entrevista` (`origin/develop` `48773cb`).
 *
 * Las preguntas son datos de prueba; el texto real lo planifica el backend
 * (HU-4.5).
 */
import { http, HttpResponse, type JsonBodyType } from 'msw';

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

/** Objeto de estado de la sesión (aviso de Backend del 7-11-2026, §6.1). */
function sessionState(sessionId: string) {
  const pending = pendingBySession.get(sessionId) ?? 0;
  const finished = pending >= MOCK_QUESTIONS.length;
  return {
    sessionId,
    status: finished ? 'FINALIZADA' : 'EN_CURSO',
    answerFormat: formatBySession.get(sessionId) ?? 'TEXTO',
    interviewFinished: finished,
    progress: {
      currentQuestion: finished ? MOCK_QUESTIONS.length : pending + 1,
      totalQuestions: MOCK_QUESTIONS.length,
    },
    pendingQuestion: finished ? null : questionDto(sessionId, pending),
    history: [],
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

// Copia literal de `ErrorCode.java` de `cameia-entrevista` (`origin/develop` `48773cb`).
const LLM_UNAVAILABLE = 'LLM_UNAVAILABLE';
const VALIDATION_FAILED = 'VALIDATION_FAILED';
const ANSWER_TEXT_REQUIRED = 'ANSWER_TEXT_REQUIRED';
const ANSWER_TEXT_TOO_LONG = 'ANSWER_TEXT_TOO_LONG';
const IDEMPOTENCY_KEY_REQUIRED = 'IDEMPOTENCY_KEY_REQUIRED';
const IDEMPOTENCY_KEY_CONFLICT = 'IDEMPOTENCY_KEY_CONFLICT';
const TURN_NOT_RETRYABLE = 'TURN_NOT_RETRYABLE';
const TURN_RETRY_LIMIT_REACHED = 'TURN_RETRY_LIMIT_REACHED';

/** Usos de «Reintentar» por turno que cuenta Backend (`InterviewTurn.java:19`). */
const MAX_MANUAL_RETRIES = 4;

interface CachedAnswer {
  /** Turno y texto de la primera petición (`RegisterAnswerService.java:248-252`). */
  fingerprint: string;
  status: number;
  body: JsonBodyType;
}

/** Caché de `…/answers` por `Idempotency-Key`; propia, aparte de `resultByKey` (v11.3 D10). */
const answerByKey = new Map<string, CachedAnswer>();
/** Turnos cuya evaluación falló y esperan «Reintentar». */
const retryableTurns = new Set<string>();
/** Usos de «Reintentar» ya contados por turno. */
const retriesByTurn = new Map<string, number>();
let evaluationsFail = false;

const LLM_UNAVAILABLE_BODY = {
  title: 'Servicio no disponible',
  detail: 'No pudimos evaluar tu respuesta en este momento.',
  status: 503,
  code: LLM_UNAVAILABLE,
};

function problem(status: number, title: string, detail: string, code: string) {
  return HttpResponse.json({ title, detail, status, code }, { status });
}

/**
 * Hace que la evaluación del mock falle con `503 LLM_UNAVAILABLE` en `…/answers` y
 * `…/reprocess`, y deja el turno esperando reintento, para llegar al tope de «Reintentar» sin
 * `useHandlers` (SPEC §9, v11.3 D10; prueba R14). `resetInterviewSessions` lo apaga.
 */
export function failInterviewEvaluations() {
  evaluationsFail = true;
}

/** Reinicia el estado en memoria entre pruebas. */
export function resetInterviewSessions() {
  pendingBySession.clear();
  formatBySession.clear();
  resultByKey.clear();
  answerByKey.clear();
  retryableTurns.clear();
  retriesByTurn.clear();
  evaluationsFail = false;
}

export const interviewSessionsHandlers = [
  http.post('*/api/v1/interviews/sessions/:sessionId/answers', async ({ request, params }) => {
    const sessionId = String(params.sessionId);
    const key = (request.headers.get('Idempotency-Key') ?? '').trim();
    const body = (await request.json()) as { turnId?: string; answerText?: string };
    const turnId = String(body.turnId);
    const text = body.answerText ?? '';

    // Valida antes de mirar la caché (`RegisterAnswerService.java:142-175`). Se cuenta lo
    // recibido, sin recortar; `trim()` solo decide si está vacía. Puntos de código tras NFC,
    // igual que `src/utils/unicodeLength.ts` (`mocks` no puede importar `utils`).
    const errors = [];
    if (!text.trim()) {
      errors.push({
        field: 'answerText',
        code: ANSWER_TEXT_REQUIRED,
        message: 'Ingresa tu respuesta.',
      });
    } else if ([...text.normalize('NFC')].length > 4000) {
      errors.push({
        field: 'answerText',
        code: ANSWER_TEXT_TOO_LONG,
        message: 'Tu respuesta no puede superar los 4000 caracteres.',
      });
    }
    if (!key) {
      errors.push({
        field: 'Idempotency-Key',
        code: IDEMPOTENCY_KEY_REQUIRED,
        message: 'Ocurrió un error. Inténtalo de nuevo.',
      });
    }
    if (errors.length > 0) {
      return HttpResponse.json(
        {
          title: 'Datos no válidos',
          detail: 'Revisa los campos marcados.',
          status: 422,
          code: VALIDATION_FAILED,
          errors,
        },
        { status: 422 },
      );
    }

    const fingerprint = JSON.stringify([turnId, text]);
    const cached = answerByKey.get(key);
    if (cached) {
      if (cached.fingerprint !== fingerprint) {
        return problem(
          409,
          'Solicitud distinta',
          'La Idempotency-Key ya se usó con otra solicitud.',
          IDEMPOTENCY_KEY_CONFLICT,
        );
      }
      return HttpResponse.json(cached.body, { status: cached.status });
    }

    if (evaluationsFail) {
      // Un 503 también queda en la caché de su clave (`RegisterAnswerService.java:259-264`).
      retryableTurns.add(turnId);
      answerByKey.set(key, { fingerprint, status: 503, body: LLM_UNAVAILABLE_BODY });
      return HttpResponse.json(LLM_UNAVAILABLE_BODY, { status: 503 });
    }
    const result = advance(sessionId, turnId);
    answerByKey.set(key, { fingerprint, status: 200, body: result });
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
    if (!pendingBySession.has(sessionId)) pendingBySession.set(sessionId, 0);
    return HttpResponse.json(sessionState(sessionId));
  }),

  http.get('*/api/v1/interviews/sessions/:sessionId/state', ({ params }) => {
    const sessionId = String(params.sessionId);
    if (!pendingBySession.has(sessionId)) {
      return HttpResponse.json(
        { title: 'Not Found', detail: 'x', status: 404, code: 'SESSION_NOT_FOUND' },
        { status: 404 },
      );
    }
    return HttpResponse.json(sessionState(sessionId));
  }),

  http.delete('*/api/v1/interviews/sessions/:sessionId', ({ params }) => {
    formatBySession.delete(String(params.sessionId));
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('*/api/v1/interviews/sessions/:sessionId/consolidation', ({ params }) =>
    HttpResponse.json({
      sessionId: String(params.sessionId),
      status: 'FINALIZADA',
      interviewFinished: true,
      progress: { currentQuestion: 5, totalQuestions: 5 },
      pendingQuestion: null,
      history: [],
    }),
  ),

  http.post('*/api/v1/interviews/sessions/:sessionId/turns/:turnId/reprocess', ({ params }) => {
    const turnId = String(params.turnId);
    // Orden real: primero si el turno espera reintento, luego el tope, y si no suma
    // (`ReprocessTurnService.java:98-142`).
    if (!retryableTurns.has(turnId)) {
      return problem(
        409,
        'Acción no permitida',
        'Tu respuesta no está esperando un reintento.',
        TURN_NOT_RETRYABLE,
      );
    }
    const used = retriesByTurn.get(turnId) ?? 0;
    if (used >= MAX_MANUAL_RETRIES) {
      return problem(
        409,
        'Reintentos agotados',
        'No pudimos evaluar tu respuesta en este momento. Tu respuesta quedó guardada; inténtalo más tarde.',
        TURN_RETRY_LIMIT_REACHED,
      );
    }
    retriesByTurn.set(turnId, used + 1);
    if (evaluationsFail) return HttpResponse.json(LLM_UNAVAILABLE_BODY, { status: 503 });
    retryableTurns.delete(turnId);
    return HttpResponse.json(advance(String(params.sessionId), turnId));
  }),

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
