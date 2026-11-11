/**
 * Constantes del flujo de configuracion de entrevista (HU-4.2).
 * `JOB_OFFER_MAX_LENGTH` viene del backlog (CA-4.2.11/CA-4.2.12, RN-056).
 */
export const JOB_OFFER_MAX_LENGTH = 3000;

/**
 * Espera máxima de las llamadas a la IA de la entrevista (`…/start`). El
 * Gateway espera 120 s y responde 504; 130 s le deja a él dar la respuesta
 * (aviso de Backend del 7-11-2026, punto 4.4, CM-357).
 */
export const INTERVIEW_AI_TIMEOUT_MS = 130_000;
