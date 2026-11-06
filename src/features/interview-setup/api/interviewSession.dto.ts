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
 * a EN_CURSO con la pregunta 1. Contrato previsto de Backend (respuesta del
 * 20-10-2026, §6.3); el endpoint aún no está publicado.
 */
export interface StartSessionResponseDto {
  status: string;
  answerFormat: string;
  question: { turnId: string; number: number; text: string };
  progress: { currentQuestion: number; totalQuestions: number };
}
