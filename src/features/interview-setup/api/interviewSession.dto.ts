// PROVISIONAL — pendiente de OpenAPI
/**
 * DTO para la creacion de una sesion de entrevista (POST /api/v1/interviews/sessions).
 * Contrato basado en CA-4.4.1 y el catalogo de campos del backlog v8.2.
 */

export interface CreateSessionRequestDto {
  profile_id: string;
  target_role_id: string;
  job_offer: string | null;
  mode: string;
  tone: string;
  answer_format: string;
  session_language: string;
}

export interface OngoingSessionDto {
  session_id: string;
  answers_count: number;
}

export interface CreateSessionResponseDto {
  session_id: string;
  status: string;
  ongoing_session?: OngoingSessionDto | null;
}
