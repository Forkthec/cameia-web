/**
 * Límites del chat de Simulación fijados por el backlog v8.2 (HU-5.2). Son
 * reglas de validación de la interfaz que el backend revalida (RT-01), no
 * constantes de negocio que deba mandar el servidor.
 */

/** Respuesta escrita: 1 a 4000 caracteres (CA-5.2.8, CA-5.2.9). */
export const ANSWER_MAX_LENGTH = 4000;

/** «Reintentar» ante un fallo de la IA: máximo 2 veces por respuesta (CA-5.2.19, CA-5.2.20). */
export const MAX_EVALUATION_RETRIES = 2;
