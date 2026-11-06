/**
 * Límites del chat de Simulación fijados por el backlog v8.4 (HU-5.2, HU-5.8). Son
 * reglas de validación de la interfaz que el backend revalida (RT-01), no
 * constantes de negocio que deba mandar el servidor.
 */

/** Respuesta escrita: 1 a 4000 caracteres (CA-5.2.8, CA-5.2.9). */
export const ANSWER_MAX_LENGTH = 4000;

/** «Reintentar» ante un fallo de la IA: máximo 2 veces por respuesta (CA-5.2.19, CA-5.2.20). */
export const MAX_EVALUATION_RETRIES = 2;

/** Grabación de voz: máximo 3 minutos (CA-5.8.7). */
export const MAX_RECORDING_SECONDS = 180;

/** Voz mínima detectada en el navegador: 2 segundos (CA-5.8.9, CA-5.8.10). */
export const MIN_VOICE_SECONDS = 2;

/** Espera tras la que se avisa que puede tardar hasta 2 minutos (CA-5.8.5). */
export const LONG_WAIT_NOTICE_MS = 20_000;

/** Espera máxima de la pantalla al enviar audio: 130 s (HU-5.8, notas técnicas). */
export const AUDIO_REQUEST_TIMEOUT_MS = 130_000;
