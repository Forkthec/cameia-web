/**
 * Funciones de red de la sesión de entrevista:
 * - `POST /api/v1/interviews/sessions` crea la sesión (HU-4.4, CA-4.4.1).
 * - `POST …/{session_id}/start` la inicia y trae la pregunta 1 (HU-4.5).
 * - `DELETE …/{session_id}` (provisional) elimina una sesión sin iniciar al
 *   cancelar tras un fallo de preparación (CA-4.5.16, CA-4.5.17).
 */
import { httpClient } from '@/services/http/httpClient';
import type {
  CreateSessionRequestDto,
  CreateSessionResponseDto,
  StartSessionResponseDto,
} from './interviewSession.dto';

export async function createInterviewSession(
  body: CreateSessionRequestDto,
): Promise<CreateSessionResponseDto> {
  return httpClient.post<CreateSessionResponseDto>('/api/v1/interviews/sessions', body);
}

/**
 * Inicia la sesión. La planificación usa la IA y puede tardar: tope de 60 s.
 *
 * @param sessionId sesión CONFIGURADA.
 * @returns la sesión en curso con la pregunta 1.
 * @throws ApiError con `LLM_UNAVAILABLE` (503) si falla la preparación; 404 si es ajena.
 */
export async function startInterviewSession(sessionId: string): Promise<StartSessionResponseDto> {
  return httpClient.post<StartSessionResponseDto>(
    `/api/v1/interviews/sessions/${sessionId}/start`,
    undefined,
    { timeoutMs: 60_000 },
  );
}

/**
 * @param sessionId sesión CONFIGURADA que se descarta.
 * @throws ApiError si el backend la rechaza (p. ej. 409 si ya comenzó, CA-4.5.18).
 */
export async function deleteInterviewSession(sessionId: string): Promise<void> {
  await httpClient.del(`/api/v1/interviews/sessions/${sessionId}`);
}
