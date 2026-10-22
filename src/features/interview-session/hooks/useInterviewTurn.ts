/**
 * Estado y acciones del turno pendiente del chat de Simulación (HU-5.2), con
 * respuesta escrita o por voz (HU-5.8): el audio se registra y se evalúa en la
 * misma petición, con los mismos errores y reintentos que el texto.
 *
 * - Enviar registra la respuesta con una `Idempotency-Key` por turno: si se
 *   cae la red y se reintenta, se reutiliza la misma clave (RT-06,
 *   CA-5.2.18), y un doble clic no registra dos respuestas (CA-5.2.4).
 * - `503 LLM_UNAVAILABLE` o `LLM_LIMIT_REACHED` (mismo trato, respuesta de
 *   Backend del 20-10-2026 §6.6): la respuesta ya quedó guardada (CA-5.2.12); el
 *   turno pasa a `evaluationFailed` y «Reintentar» llama a `…/reprocess`
 *   sin pedir texto nuevo (CA-5.2.19). Tras 2 reintentos fallidos cambia el
 *   mensaje y aparece «Ir al inicio» (CA-5.2.20), pero «Reintentar» sigue.
 * - Audio rechazado al transcribir (sin registrar respuesta ni gastar
 *   intento): `422 TRANSCRIPTION_EMPTY` (CA-5.12.7), `TRANSCRIPTION_TOO_LONG`
 *   (CA-5.12.9), `TRANSCRIPTION_LANGUAGE_MISMATCH` (CA-5.12.10) y
 *   `503 TRANSCRIPTION_UNAVAILABLE` (CA-5.12.8). Se descarta la grabación y
 *   se puede grabar de nuevo o responder por texto en la misma pregunta.
 * - `404`: entrevista ajena o inexistente (CA-5.2.7).
 * - Sin `ApiError` (sin red): mensaje de conexión, se conserva el texto.
 *
 * Los errores se resuelven por `code` y clases amplias de estado HTTP
 * (CLAUDE.md §8); nunca se muestra `detail` ni `code`.
 */
import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ApiError } from '@/services/http/ApiError';
import { reprocessTurn, submitAudioAnswer, submitTextAnswer } from '../api/interviewSession.api';
import { MAX_EVALUATION_RETRIES } from '../model/interviewSession.constants';
import type {
  AnswerResult,
  InterviewProgress,
  InterviewQuestion,
  SessionEntry,
} from '../model/interviewSession.types';

/** Respuesta a enviar: escrita (HU-5.2) o grabada (HU-5.8). */
export type TurnAnswer = { kind: 'text'; text: string } | { kind: 'audio'; audio: Blob };

export type TurnPhase = 'answering' | 'evaluationFailed' | 'finished';
/** Mensaje de error del envío, como llave de `errors`. */
export type SubmitErrorKey = 'red' | 'generico' | 'codigos.NOT_FOUND';
/** Por qué Backend rechazó un audio; nombra la llave de `interview:sesion.voz`. */
export type AudioRejection = 'sinVoz' | 'demasiadoLarga' | 'idiomaDistinto' | 'noTranscrita';

const AUDIO_REJECTIONS: Record<string, AudioRejection> = {
  TRANSCRIPTION_EMPTY: 'sinVoz',
  TRANSCRIPTION_TOO_LONG: 'demasiadoLarga',
  TRANSCRIPTION_LANGUAGE_MISMATCH: 'idiomaDistinto',
  TRANSCRIPTION_UNAVAILABLE: 'noTranscrita',
};

function toSubmitErrorKey(error: unknown): SubmitErrorKey {
  if (!(error instanceof ApiError)) return 'red';
  if (error.httpStatus === 404) return 'codigos.NOT_FOUND';
  return 'generico';
}

/**
 * @param entry entrada del chat con la pregunta 1 (HU-4.5).
 * @returns pregunta y progreso actuales, fase del turno, errores y acciones.
 */
export function useInterviewTurn(entry: SessionEntry) {
  const [question, setQuestion] = useState<InterviewQuestion>(entry.question);
  const [progress, setProgress] = useState<InterviewProgress>(entry.progress);
  const [phase, setPhase] = useState<TurnPhase>('answering');
  const [failedRetries, setFailedRetries] = useState(0);
  const [submitError, setSubmitError] = useState<SubmitErrorKey | null>(null);
  const [retryNetworkError, setRetryNetworkError] = useState(false);
  const [audioRejection, setAudioRejection] = useState<AudioRejection | null>(null);
  const keysByTurn = useRef(new Map<string, string>());
  const inFlight = useRef(false);

  function applyResult(result: AnswerResult) {
    setProgress(result.progress);
    setFailedRetries(0);
    setRetryNetworkError(false);
    setSubmitError(null);
    if (result.finished || !result.nextQuestion) {
      setPhase('finished');
      return;
    }
    setQuestion(result.nextQuestion);
    setPhase('answering');
  }

  /** Una clave por turno y por forma de respuesta: el reintento de red reutiliza la misma (CA-5.8.22). */
  function idempotencyKeyFor(turnId: string) {
    let key = keysByTurn.current.get(turnId);
    if (!key) {
      key = crypto.randomUUID();
      keysByTurn.current.set(turnId, key);
    }
    return key;
  }

  const submit = useMutation({
    mutationFn: (answer: TurnAnswer) =>
      answer.kind === 'text'
        ? submitTextAnswer({
            sessionId: entry.sessionId,
            turnId: question.turnId,
            text: answer.text,
            idempotencyKey: idempotencyKeyFor(`${question.turnId}:text`),
          })
        : submitAudioAnswer({
            sessionId: entry.sessionId,
            turnId: question.turnId,
            audio: answer.audio,
            idempotencyKey: idempotencyKeyFor(`${question.turnId}:audio`),
          }),
    onMutate: () => {
      setSubmitError(null);
      setAudioRejection(null);
    },
    onSuccess: applyResult,
    onError: (error, answer) => {
      if (error instanceof ApiError && error.hasCode('LLM_UNAVAILABLE', 'LLM_LIMIT_REACHED')) {
        setPhase('evaluationFailed');
        return;
      }
      const rejection =
        answer.kind === 'audio' && error instanceof ApiError && error.code
          ? AUDIO_REJECTIONS[error.code]
          : undefined;
      if (rejection) {
        setAudioRejection(rejection);
        return;
      }
      setSubmitError(toSubmitErrorKey(error));
    },
  });

  const reprocess = useMutation({
    mutationFn: () => reprocessTurn(entry.sessionId, question.turnId),
    onMutate: () => setRetryNetworkError(false),
    onSuccess: applyResult,
    onError: (error) => {
      if (!(error instanceof ApiError)) {
        setRetryNetworkError(true);
        return;
      }
      setFailedRetries((count) => count + 1);
    },
  });

  return {
    question,
    progress,
    phase,
    submitError,
    isSubmitting: submit.isPending,
    isRetrying: reprocess.isPending,
    retryNetworkError,
    retriesExhausted: failedRetries >= MAX_EVALUATION_RETRIES,
    audioRejection,
    clearAudioRejection: () => setAudioRejection(null),
    /**
     * @param onSettledAudio se llama si el backend registró la respuesta o
     *   rechazó el audio: en ambos casos la grabación ya no sirve.
     */
    submitAnswer: (answer: TurnAnswer, onSettledAudio?: () => void) => {
      // Guarda síncrona: `isPending` llega tras un re-render y dos clics
      // seguidos podrían colarse antes (mismo caso que DF-004 en perfil).
      if (inFlight.current) return;
      inFlight.current = true;
      submit.mutate(answer, {
        onSuccess: () => onSettledAudio?.(),
        onError: (error) => {
          if (error instanceof ApiError && error.code && error.code in AUDIO_REJECTIONS) {
            onSettledAudio?.();
          }
        },
        onSettled: () => {
          inFlight.current = false;
        },
      });
    },
    retryEvaluation: () => reprocess.mutate(),
  };
}
