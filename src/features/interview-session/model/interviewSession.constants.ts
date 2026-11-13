/**
 * Límites del chat de Simulación fijados por el backlog v8.4 (HU-5.2, HU-5.8). Son
 * reglas de validación de la interfaz que el backend revalida (RT-01), no
 * constantes de negocio que deba mandar el servidor.
 */

/** Respuesta escrita: 1 a 4000 caracteres (CA-5.2.8, CA-5.2.9). */
export const ANSWER_MAX_LENGTH = 4000;

/**
 * «Reintentar» del panel de CA-5.2.19 ante un fallo de la IA: como máximo 2 veces antes de pasar a
 * CA-5.2.20 («Cambios v11.2», #292).
 */
export const MAX_EVALUATION_RETRIES = 2;

/**
 * «Reintentar» del mensaje de CA-5.2.20: 2 usos más tras agotar los de CA-5.2.19; después solo
 * queda «Ir al inicio» («Cambios v11.2», #290; SPEC §9, v11.3 D2).
 */
export const MAX_LATER_EVALUATION_RETRIES = 2;

/** Grabación de voz: máximo 3 minutos (CA-5.8.7). */
export const MAX_RECORDING_SECONDS = 180;

/** Voz mínima detectada en el navegador: 2 segundos (CA-5.8.9, CA-5.8.10). */
export const MIN_VOICE_SECONDS = 2;

/** Espera tras la que se avisa que puede tardar hasta 2 minutos (CA-5.8.5). */
export const LONG_WAIT_NOTICE_MS = 20_000;

/** Espera máxima de la pantalla al enviar audio: 130 s (HU-5.8, notas técnicas). */
export const AUDIO_REQUEST_TIMEOUT_MS = 130_000;

/**
 * Espera máxima de las llamadas lentas de la entrevista (`…/answers`,
 * `…/reprocess` y `…/consolidation`): el Gateway espera 120 s y responde
 * 504; 130 s le deja a él dar la respuesta (aviso de Backend del 7-11-2026,
 * punto 4.4, CM-357).
 */
export const INTERVIEW_AI_TIMEOUT_MS = 130_000;
