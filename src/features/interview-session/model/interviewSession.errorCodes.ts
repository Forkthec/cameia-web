/**
 * Códigos de error estables de `cameia-entrevista` que el chat de Simulación
 * decide por `code` (ADR-0008, CLAUDE.md §8), copiados tal cual del contrato
 * previsto de Backend (documento del 20-10-2026, §6.6) y acotados a
 * `…/answers` y `…/reprocess` (HU-5.2, responder por escrito cada pregunta).
 * Las pruebas los importan; los mocks los copian como literal (la política de
 * ESLint de `mocks` solo permite importar `mocks` y `services`).
 */

/** `503`: la IA falló al evaluar la respuesta (CA-5.2.19). */
export const LLM_UNAVAILABLE = 'LLM_UNAVAILABLE';

/** `503`: se agotó la cuota del modelo; mismo tratamiento que `LLM_UNAVAILABLE` (D3). */
export const LLM_LIMIT_REACHED = 'LLM_LIMIT_REACHED';

/** `422`: respuesta vacía o de más de 4000 caracteres (`errors[].field = answerText`). */
export const VALIDATION_FAILED = 'VALIDATION_FAILED';
