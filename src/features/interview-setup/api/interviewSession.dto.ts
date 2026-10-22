// PROVISIONAL — pendiente de OpenAPI
/**
 * DTO para la creacion de una sesion de entrevista (POST /api/v1/interviews/sessions).
 * Nombres en ingles y camelCase segun el contrato previsto de Backend
 * (respuesta de Paula del 20-10-2026, §6.1); los valores siguen el backlog.
 * La respuesta es 201 (sesion nueva) o 200 (se reutilizo la configurada sin
 * iniciar), con el mismo cuerpo.
 */

export interface CreateSessionRequestDto {
  profileId: string;
  targetRoleId: string;
  jobOffer: string | null;
  mode: string;
  tone: string;
  answerFormat: string;
  sessionLanguage: string;
}

export interface OngoingSessionDto {
  sessionId: string;
  answersCount: number;
}

export interface CreateSessionResponseDto {
  sessionId: string;
  status: string;
  ongoingSession?: OngoingSessionDto | null;
}

/**
 * Respuesta de `POST …/sessions/{session_id}/start` (HU-4.5): la sesión pasa
 * a EN_CURSO con la pregunta 1. Forma propuesta por Frontend; Backend aún no
 * publica el endpoint.
 */
export interface StartSessionResponseDto {
  estado: string;
  forma_respuesta: string;
  pregunta: { turno_id: string; numero: number; texto: string };
  progreso: { pregunta_actual: number; total_preguntas: number };
}
