/**
 * Códigos de error estables de `cameia-entrevista` que el chat de Simulación
 * decide por `code` (ADR-0008, CLAUDE.md §8), copiados tal cual del contrato
 * publicado de Backend (`InterviewSessionController` y su OpenAPI;
 * `ErrorCode.java` de `cameia-entrevista`, `origin/develop` `48773cb`) y acotados a
 * `…/answers` y `…/reprocess` (HU-5.2, responder por escrito cada pregunta).
 * Las pruebas los importan; los mocks los copian como literal (la política de
 * ESLint de `mocks` solo permite importar `mocks` y `services`).
 */

/** `503`: la IA falló al evaluar la respuesta (CA-5.2.19). */
export const LLM_UNAVAILABLE = 'LLM_UNAVAILABLE';

/** `503`: se agotó la cuota del modelo; mismo tratamiento que `LLM_UNAVAILABLE` (D3). */
export const LLM_LIMIT_REACHED = 'LLM_LIMIT_REACHED';

/**
 * `503`: la IA devolvió una evaluación con formato inválido; mismo tratamiento que
 * `LLM_UNAVAILABLE` (CA-5.2.19, CA-5.2.20; «Cambios v10», fila 57, #146).
 */
export const LLM_INVALID_OUTPUT = 'LLM_INVALID_OUTPUT';

/** `422`: respuesta vacía o de más de 4000 caracteres (`errors[].field = answerText`). */
export const VALIDATION_FAILED = 'VALIDATION_FAILED';

/** `409`: la entrevista quedó abandonada; no admite respuestas (CA-5.5.4). */
export const SESSION_ABANDONED = 'SESSION_ABANDONED';

/** `409`: la entrevista está en evaluación o finalizada; no admite respuestas (CA-5.5.5). */
export const SESSION_ALREADY_CLOSED = 'SESSION_ALREADY_CLOSED';

/** `409`: la entrevista no admite esa acción en su estado actual (CA-5.2.6). */
export const SESSION_TRANSITION_NOT_ALLOWED = 'SESSION_TRANSITION_NOT_ALLOWED';

/**
 * `409` de `…/reprocess`: Backend ya contó los 4 usos de «Reintentar» del turno; lleva al estado
 * final de CA-5.2.20 aunque el contador del front vaya atrás (SPEC v11.3 D7; `ErrorCode.java:186`
 * de `cameia-entrevista`, `origin/develop` `48773cb`).
 */
export const TURN_RETRY_LIMIT_REACHED = 'TURN_RETRY_LIMIT_REACHED';

/**
 * `409` de `…/reprocess`: el turno ya no espera un reintento (p. ej. una `200` perdida); genérico
 * sin «Reintentar» y con «Ir al inicio» (SPEC v11.3 D9; `ErrorCode.java:183` de
 * `cameia-entrevista`, `origin/develop` `48773cb`).
 */
export const TURN_NOT_RETRYABLE = 'TURN_NOT_RETRYABLE';
