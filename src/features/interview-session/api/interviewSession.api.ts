/**
 * Funciones de red del chat de Simulación (HU-5.2):
 * - `POST /api/v1/interviews/sessions/{session_id}/answers` registra la
 *   respuesta escrita con `Idempotency-Key` (CA-5.2.4, CA-5.2.11).
 * - `POST …/turns/{turno_id}/reprocess` (provisional) vuelve a evaluar la
 *   respuesta guardada tras un fallo de la IA (CA-5.2.19).
 */
import { httpClient } from '@/services/http/httpClient';
import { toAnswerResult } from './interviewSession.mapper';
import type { AnswerResponseDto, SubmitAnswerRequestDto } from './interviewSession.dto';
import type { AnswerResult } from '../model/interviewSession.types';

interface SubmitTextAnswerParams {
  sessionId: string;
  turnId: string;
  text: string;
  idempotencyKey: string;
}

/**
 * @param params sesión, turno, texto ya recortado y la clave de idempotencia del turno.
 * @returns el resultado del turno.
 * @throws ApiError si el backend rechaza la respuesta; TypeError si no hay red.
 */
export async function submitTextAnswer({
  sessionId,
  turnId,
  text,
  idempotencyKey,
}: SubmitTextAnswerParams): Promise<AnswerResult> {
  const body: SubmitAnswerRequestDto = { turno_id: turnId, respuesta_texto: text };
  const dto = await httpClient.post<AnswerResponseDto>(
    `/api/v1/interviews/sessions/${sessionId}/answers`,
    body,
    { headers: { 'Idempotency-Key': idempotencyKey } },
  );
  return toAnswerResult(dto);
}

/**
 * @param sessionId sesión en curso.
 * @param turnId turno cuya evaluación falló.
 * @returns el resultado del turno si la nueva evaluación tiene éxito.
 * @throws ApiError con `LLM_UNAVAILABLE` si vuelve a fallar.
 */
export async function reprocessTurn(sessionId: string, turnId: string): Promise<AnswerResult> {
  const dto = await httpClient.post<AnswerResponseDto>(
    `/api/v1/interviews/sessions/${sessionId}/turns/${turnId}/reprocess`,
  );
  return toAnswerResult(dto);
}
