/**
 * Protege que los mocks de `…/answers` y `…/reprocess` de `interviewSessions.handlers.ts` no
 * dejen en verde lo que el servicio real rechazaría (lección 6; SPEC de interview-session §9,
 * v11.3 D10): validar antes de mirar la `Idempotency-Key` ya usada, `422` con los `code` y la
 * forma de Backend, `409 IDEMPOTENCY_KEY_CONFLICT` con la misma clave y otro cuerpo, y en
 * `…/reprocess` el contador de 4 usos por turno (`409 TURN_RETRY_LIMIT_REACHED`) y
 * `409 TURN_NOT_RETRYABLE` si el turno no espera reintento (v11.3 D7 y D9). La fuente es el
 * contrato publicado de `cameia-entrevista` (`origin/develop` `48773cb`: `AnswerRequestPolicy`,
 * `RegisterAnswerService`, `ReprocessTurnService`, `InterviewTurn`, `BusinessExceptionHandler`).
 *
 * Prueba la capa de mocks, no una feature, igual que `profiles.handlers.test.ts`: sin
 * `useHandlers`, contra los handlers por defecto. El estado en memoria lo reinicia
 * `resetInterviewSessions` antes de cada prueba (`src/test/setup.ts`). Plan de rojo R14 a R19
 * del SPEC, §6.
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/services/http/ApiError';
import { httpClient } from '@/services/http/httpClient';
import { failInterviewEvaluations } from './interviewSessions.handlers';

// Copia literal de `ErrorCode.java` de `cameia-entrevista` (`origin/develop` `48773cb`): la
// política de ESLint de `mocks` no deja importar `features/interview-session/model/
// interviewSession.errorCodes.ts`.
const LLM_UNAVAILABLE = 'LLM_UNAVAILABLE';
const VALIDATION_FAILED = 'VALIDATION_FAILED';
const ANSWER_TEXT_REQUIRED = 'ANSWER_TEXT_REQUIRED';
const ANSWER_TEXT_TOO_LONG = 'ANSWER_TEXT_TOO_LONG';
const IDEMPOTENCY_KEY_REQUIRED = 'IDEMPOTENCY_KEY_REQUIRED';
const IDEMPOTENCY_KEY_CONFLICT = 'IDEMPOTENCY_KEY_CONFLICT';
const TURN_NOT_RETRYABLE = 'TURN_NOT_RETRYABLE';
const TURN_RETRY_LIMIT_REACHED = 'TURN_RETRY_LIMIT_REACHED';

const SESSION = 'mock-s1';
const BASE = `/api/v1/interviews/sessions/${SESSION}`;

interface Outcome {
  status: number;
  code?: string;
  error?: ApiError;
  body?: unknown;
}

/** Inicia la sesión en el mock y devuelve el turno de la pregunta 1 (`…/start` no cambia). */
async function startSession() {
  const state = await httpClient.post<{ pendingQuestion: { turnId: string } }>(`${BASE}/start`);
  return state.pendingQuestion.turnId;
}

function answer(body: { turnId: string; answerText: string }, key?: string) {
  return httpClient.post(
    `${BASE}/answers`,
    body,
    key ? { headers: { 'Idempotency-Key': key } } : undefined,
  );
}

function reprocess(turnId: string) {
  return httpClient.post(`${BASE}/turns/${turnId}/reprocess`);
}

/** Estado HTTP y `code` de una llamada, salga bien o mal, para afirmar sobre los dos casos igual. */
async function outcome(request: Promise<unknown>): Promise<Outcome> {
  try {
    return { status: 200, body: await request };
  } catch (error) {
    if (error instanceof ApiError) return { status: error.httpStatus, code: error.code, error };
    throw error;
  }
}

describe('interviewSessionsHandlers', () => {
  it('el 5.º «Reintentar» del mismo turno recibe 409 TURN_RETRY_LIMIT_REACHED', async () => {
    const turnId = await startSession();
    failInterviewEvaluations();
    const first = await outcome(answer({ turnId, answerText: 'Mi respuesta' }, 'clave-r14'));
    const uses: Outcome[] = [];
    for (let use = 1; use <= 5; use += 1) uses.push(await outcome(reprocess(turnId)));

    // Lo que se protege es el 5.º: Backend cuenta 4 usos por turno (`InterviewTurn.java:19`).
    expect(uses[4]).toMatchObject({ status: 409, code: TURN_RETRY_LIMIT_REACHED });
    for (const use of uses.slice(0, 4)) {
      expect(use).toMatchObject({ status: 503, code: LLM_UNAVAILABLE });
    }
    expect(first).toMatchObject({ status: 503, code: LLM_UNAVAILABLE });
  });

  it('sin Idempotency-Key responde 422 IDEMPOTENCY_KEY_REQUIRED', async () => {
    const turnId = await startSession();
    const result = await outcome(answer({ turnId, answerText: 'Mi respuesta' }));

    // `AnswerRequestPolicy.java:91-102`: la clave es obligatoria en el dominio.
    expect(result.status).toBe(422);
    expect(result.code).toBe(VALIDATION_FAILED);
    expect(result.error?.errors).toContainEqual(
      expect.objectContaining({ field: 'Idempotency-Key', code: IDEMPOTENCY_KEY_REQUIRED }),
    );
  });

  it('responde 422 con los code y la forma de Backend', async () => {
    const turnId = await startSession();
    const blank = await outcome(answer({ turnId, answerText: '   ' }, 'clave-vacia'));
    const tooLong = await outcome(answer({ turnId, answerText: 'a'.repeat(4001) }, 'clave-larga'));

    // `AnswerRequestPolicy.java:72-89` y `BusinessExceptionHandler.java:101-104`.
    expect(blank.error?.errors[0]).toMatchObject({
      field: 'answerText',
      code: ANSWER_TEXT_REQUIRED,
    });
    expect(tooLong.error?.errors[0]).toMatchObject({
      field: 'answerText',
      code: ANSWER_TEXT_TOO_LONG,
    });
    for (const result of [blank, tooLong]) {
      expect(result.status).toBe(422);
      expect(result.code).toBe(VALIDATION_FAILED);
      expect(result.error?.title).toBe('Datos no válidos');
      expect(result.error?.detail).toBe('Revisa los campos marcados.');
    }
  });

  it('valida la respuesta antes de mirar la Idempotency-Key ya usada', async () => {
    const turnId = await startSession();
    const valid = await outcome(answer({ turnId, answerText: 'Mi respuesta' }, 'clave-k'));
    const repeatedBlank = await outcome(answer({ turnId, answerText: '   ' }, 'clave-k'));

    // `RegisterAnswerService.java:142-175`: primero la validación (422), después la repetición.
    expect(valid.status).toBe(200);
    expect(repeatedBlank.status).toBe(422);
  });

  it('la misma Idempotency-Key con otro cuerpo responde 409 IDEMPOTENCY_KEY_CONFLICT', async () => {
    const turnId = await startSession();
    const original = await outcome(answer({ turnId, answerText: 'Mi respuesta' }, 'clave-k'));
    const repeated = await outcome(answer({ turnId, answerText: 'Mi respuesta' }, 'clave-k'));
    const changed = await outcome(answer({ turnId, answerText: 'Otra respuesta' }, 'clave-k'));

    // `RegisterAnswerService.java:248-252`: la huella es el turno y el texto.
    expect(original.status).toBe(200);
    expect(repeated).toEqual(original);
    expect(changed).toMatchObject({ status: 409, code: IDEMPOTENCY_KEY_CONFLICT });
  });

  it('reprocess de un turno que no espera reintento responde 409 TURN_NOT_RETRYABLE', async () => {
    const turnId = await startSession();
    const pending = await outcome(reprocess(turnId));
    await answer({ turnId, answerText: 'Mi respuesta' }, 'clave-r19');
    const completed = await outcome(reprocess(turnId));

    // `InterviewTurn.java:109-113`: solo un turno en `RETRYING` admite `…/reprocess`.
    expect(pending).toMatchObject({ status: 409, code: TURN_NOT_RETRYABLE });
    expect(completed).toMatchObject({ status: 409, code: TURN_NOT_RETRYABLE });
  });
});
