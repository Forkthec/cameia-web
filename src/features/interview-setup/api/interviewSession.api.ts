/**
 * Funciones de red de la sesión de entrevista:
 * - `POST /api/v1/interviews/sessions` crea la sesión (HU-4.4, CA-4.4.1).
 * - `POST …/{session_id}/start` la inicia y trae la pregunta 1 (HU-4.5).
 * - `DELETE …/{session_id}` elimina una sesión sin iniciar al cancelar tras un
 *   fallo de preparación (CA-4.5.16, CA-4.5.17).
 * - `GET …/{session_id}/state` trae el estado de la entrevista anterior para
 *   volver a ella al cancelar (CA-4.5.16).
 */
import { httpClient } from '@/services/http/httpClient';
import { INTERVIEW_AI_TIMEOUT_MS } from '../model/interviewSetup.constants';
import type {
  CreateSessionRequestDto,
  CreateSessionResponseDto,
  SessionStateDto,
} from './interviewSession.dto';

/**
 * @param body configuración completa del asistente.
 * @param idempotencyKey misma clave en cada reintento de la misma configuración:
 *   así un reintento no crea dos sesiones (respuesta de Backend, §4.1).
 * @returns la sesión configurada (201 nueva o 200 reutilizada).
 */
export async function createInterviewSession(
  body: CreateSessionRequestDto,
  idempotencyKey: string,
): Promise<CreateSessionResponseDto> {
  return httpClient.post<CreateSessionResponseDto>('/api/v1/interviews/sessions', body, {
    headers: { 'Idempotency-Key': idempotencyKey },
  });
}

/**
 * Inicia la sesión. La planificación usa la IA y puede tardar: tope de 130 s.
 *
 * @param sessionId sesión CONFIGURADA.
 * @returns el estado de la sesión en curso con la pregunta 1.
 * @throws ApiError con `LLM_UNAVAILABLE` (503) si falla la preparación; 404 si es ajena.
 */
export async function startInterviewSession(sessionId: string): Promise<SessionStateDto> {
  return httpClient.post<SessionStateDto>(
    `/api/v1/interviews/sessions/${sessionId}/start`,
    undefined,
    { timeoutMs: INTERVIEW_AI_TIMEOUT_MS },
  );
}

/**
 * @param sessionId sesión propia en cualquier estado.
 * @returns su estado actual, con la pregunta pendiente si sigue en curso.
 * @throws ApiError 404 `SESSION_NOT_FOUND` si no existe o es ajena.
 */
export async function getInterviewSessionState(sessionId: string): Promise<SessionStateDto> {
  return httpClient.get<SessionStateDto>(`/api/v1/interviews/sessions/${sessionId}/state`);
}

/**
 * @param sessionId sesión CONFIGURADA que se descarta.
 * @throws ApiError si el backend la rechaza (p. ej. 409 si ya comenzó, CA-4.5.18).
 */
export async function deleteInterviewSession(sessionId: string): Promise<void> {
  await httpClient.del(`/api/v1/interviews/sessions/${sessionId}`);
}
