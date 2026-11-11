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
 * Objeto de estado de la sesión: respuesta 200 de `POST …/{id}/start` y de
 * `GET …/{id}/state` (aviso de Backend del 7-11-2026, §6.1; propuesto hasta
 * que Backend apruebe la especificación de CM-212). `pendingQuestion` solo
 * viene en EN_CURSO. Nunca trae retroalimentación (CA-5.5.2).
 */
export interface SessionStateDto {
  sessionId: string;
  status: string;
  answerFormat: string;
  interviewFinished: boolean;
  progress: { currentQuestion: number; totalQuestions: number };
  pendingQuestion: { turnId: string; number: number; text: string } | null;
  history: { number: number; text: string; answerText: string }[];
}
