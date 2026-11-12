/**
 * Funciones de red del chat de Simulación (HU-5.2):
 * - `POST /api/v1/interviews/sessions/{session_id}/answers` registra la
 *   respuesta escrita con `Idempotency-Key` (CA-5.2.4, CA-5.2.11).
 * - `POST …/turns/{turnId}/reprocess` (provisional) vuelve a evaluar la
 *   respuesta guardada tras un fallo de la IA (CA-5.2.19).
 * - `POST …/answers/audio` (HU-5.8) envía la grabación como multipart, con
 *   la misma `Idempotency-Key` del turno (CA-5.8.6, CA-5.8.22), y espera
 *   hasta 130 s porque transcribe y evalúa en la misma petición.
 */
import { httpClient } from '@/services/http/httpClient';
import { toAnswerResult } from './interviewSession.mapper';
import type {
  AnswerResponseDto,
  ConsolidationResponseDto,
  SubmitAnswerRequestDto,
} from './interviewSession.dto';
import {
  AUDIO_REQUEST_TIMEOUT_MS,
  INTERVIEW_AI_TIMEOUT_MS,
} from '../model/interviewSession.constants';
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
  const body: SubmitAnswerRequestDto = { turnId, answerText: text };
  const dto = await httpClient.post<AnswerResponseDto>(
    `/api/v1/interviews/sessions/${sessionId}/answers`,
    body,
    { headers: { 'Idempotency-Key': idempotencyKey }, timeoutMs: INTERVIEW_AI_TIMEOUT_MS },
  );
  return toAnswerResult(dto);
}

/**
 * @param sessionId sesión en curso.
 * @param turnId turno cuya evaluación falló.
 * @returns el resultado del turno si la nueva evaluación tiene éxito.
 * @throws ApiError con `LLM_UNAVAILABLE`, `LLM_LIMIT_REACHED` o `LLM_INVALID_OUTPUT` si la IA
 *   vuelve a fallar (CA-5.2.19, CA-5.2.20; SPEC v11.3 D1).
 */
export async function reprocessTurn(sessionId: string, turnId: string): Promise<AnswerResult> {
  const dto = await httpClient.post<AnswerResponseDto>(
    `/api/v1/interviews/sessions/${sessionId}/turns/${turnId}/reprocess`,
    undefined,
    { timeoutMs: INTERVIEW_AI_TIMEOUT_MS },
  );
  return toAnswerResult(dto);
}

interface SubmitAudioAnswerParams {
  sessionId: string;
  turnId: string;
  audio: Blob;
  idempotencyKey: string;
}

/**
 * @param params sesión, turno, audio grabado y la clave de idempotencia del turno.
 * @returns el resultado del turno, igual que la respuesta escrita.
 * @throws ApiError si el backend rechaza el audio; TypeError si no hay red.
 */
export async function submitAudioAnswer({
  sessionId,
  turnId,
  audio,
  idempotencyKey,
}: SubmitAudioAnswerParams): Promise<AnswerResult> {
  const form = new FormData();
  form.append('turnId', turnId);
  // El nombre del archivo no importa: el backend lo ignora (CA-5.8.16).
  form.append('audio', audio, audio.type.includes('mp4') ? 'respuesta.mp4' : 'respuesta.webm');
  const dto = await httpClient.post<AnswerResponseDto>(
    `/api/v1/interviews/sessions/${sessionId}/answers/audio`,
    form,
    { headers: { 'Idempotency-Key': idempotencyKey }, timeoutMs: AUDIO_REQUEST_TIMEOUT_MS },
  );
  return toAnswerResult(dto);
}

/**
 * Pide reunir la evaluación de una entrevista en evaluación y finalizarla
 * (HU-5.5). Es idempotente: si ya estaba finalizada responde igual.
 *
 * @param sessionId sesión que respondió sus 5 preguntas.
 * @returns `true` si la entrevista quedó finalizada.
 * @throws ApiError 503 `SESSION_CONSOLIDATION_FAILED` si los 3 intentos de
 *   Backend fallan (CA-5.5.11); TypeError si no hay red.
 */
export async function consolidateSession(sessionId: string): Promise<boolean> {
  const dto = await httpClient.post<ConsolidationResponseDto>(
    `/api/v1/interviews/sessions/${sessionId}/consolidation`,
    undefined,
    { timeoutMs: INTERVIEW_AI_TIMEOUT_MS },
  );
  return dto.status === 'FINALIZADA';
}
