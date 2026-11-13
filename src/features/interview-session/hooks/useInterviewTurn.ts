/**
 * Estado y acciones del turno pendiente del chat de Simulación (HU-5.2), con
 * respuesta escrita o por voz (HU-5.8): el audio se registra y se evalúa en la
 * misma petición, con los mismos errores y reintentos que el texto.
 *
 * - Enviar registra la respuesta con una `Idempotency-Key` por turno: si se
 *   cae la red y se reintenta, se reutiliza la misma clave (RT-06,
 *   CA-5.2.18), y un doble clic no registra dos respuestas (CA-5.2.4).
 * - `503 LLM_UNAVAILABLE`, `LLM_LIMIT_REACHED` o `LLM_INVALID_OUTPUT` (mismo
 *   trato, respuesta de Backend del 20-10-2026 §6.6; SPEC v11.3 D1): la
 *   respuesta ya quedó guardada (CA-5.2.12); el turno pasa a
 *   `evaluationFailed` y «Reintentar» llama a `…/reprocess` sin pedir texto
 *   nuevo (CA-5.2.19, fallo de la IA al evaluar la respuesta).
 * - «Reintentar» en dos tramos (CA-5.2.20, reintentos de evaluación agotados;
 *   SPEC v11.3 D2): tras 2 usos fallidos cambia el mensaje y aparece «Ir al
 *   inicio» (`retriesExhausted`); quedan 2 usos más y, tras el 2.º fallo de
 *   ese tramo, ya no se puede reintentar (`canRetry`). Un éxito vuelve el
 *   contador a cero.
 * - Al tope de «Reintentar» solo suma un fallo de `…/reprocess` decidido por
 *   `code` como fallo de la IA (D3, D4 del SPEC). Sin red, `404` o cualquier
 *   otro error muestran su mensaje (`retryError`) sin sumar; una vez agotado
 *   el tramo 1, «Ir al inicio» no desaparece.
 * - `409` de `…/reprocess` (contrato real, SPEC v11.3 D7 a D9; ninguno suma):
 *   `TURN_RETRY_LIMIT_REACHED` lleva el contador al tope total (Backend manda:
 *   `retriesExhausted` y sin `canRetry`, sin `retryError`) para el estado final
 *   de CA-5.2.20; `SESSION_ABANDONED`, `SESSION_ALREADY_CLOSED` y
 *   `SESSION_TRANSITION_NOT_ALLOWED` pasan a la fase `closed` con
 *   `toClosedReason`, igual que en `…/answers`; `TURN_NOT_RETRYABLE` deja el
 *   genérico en `retryError`, sin «Reintentar» (`turnNotRetryable`).
 * - «Enviar» y «Reintentar» tienen guarda síncrona: dos llamadas en el mismo
 *   instante hacen una sola petición (CA-5.2.4, CA-5.2.20; lección DF-004).
 * - Audio rechazado al transcribir (sin registrar respuesta ni gastar
 *   intento): `422 TRANSCRIPTION_EMPTY` (CA-5.12.7), `TRANSCRIPTION_TOO_LONG`
 *   (CA-5.12.9), `TRANSCRIPTION_LANGUAGE_MISMATCH` (CA-5.12.10) y
 *   `503 TRANSCRIPTION_UNAVAILABLE` (CA-5.12.8). Se descarta la grabación y
 *   se puede grabar de nuevo o responder por texto en la misma pregunta.
 * - El audio también se descarta tras `413`, `415` o `422` sin `code` de
 *   transcripción (CA-5.8.8, CA-5.8.13 a 5.8.15) y tras un fallo de la IA,
 *   para que la pregunta siguiente no herede la grabación anterior (SPEC §5).
 * - `404`: entrevista ajena o inexistente (CA-5.2.7).
 * - Un `200` con forma inesperada (`AnswerResponseShapeError`, D10): mensaje
 *   genérico, no el de conexión.
 * - Cualquier otro error sin `ApiError` (sin red o tiempo agotado): mensaje de
 *   conexión, se conserva el texto.
 *
 * Los errores se resuelven por `code` (los de `interviewSession.errorCodes`,
 * D2) y clases amplias de estado HTTP (CLAUDE.md §8); nunca se muestra
 * `detail` ni `code`.
 */
import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ApiError } from '@/services/http/ApiError';
import { AnswerResponseShapeError } from '../api/AnswerResponseShapeError';
import { reprocessTurn, submitAudioAnswer, submitTextAnswer } from '../api/interviewSession.api';
import {
  MAX_EVALUATION_RETRIES,
  MAX_LATER_EVALUATION_RETRIES,
} from '../model/interviewSession.constants';
import {
  LLM_INVALID_OUTPUT,
  LLM_LIMIT_REACHED,
  LLM_UNAVAILABLE,
  SESSION_ABANDONED,
  SESSION_ALREADY_CLOSED,
  SESSION_TRANSITION_NOT_ALLOWED,
  TURN_NOT_RETRYABLE,
  TURN_RETRY_LIMIT_REACHED,
} from '../model/interviewSession.errorCodes';
import type {
  AnswerResult,
  InterviewProgress,
  InterviewQuestion,
  SessionEntry,
} from '../model/interviewSession.types';

/** Respuesta a enviar: escrita (HU-5.2) o grabada (HU-5.8). */
export type TurnAnswer = { kind: 'text'; text: string } | { kind: 'audio'; audio: Blob };

export type TurnPhase = 'answering' | 'evaluationFailed' | 'finished' | 'closed';
/** Por qué la entrevista ya no admite respuestas; nombra la llave de `interview:sesion`. */
export type ClosedReason = 'abandonada' | 'noAdmite';

/** `409` de una entrevista que ya no admite respuestas (CA-5.5.4, CA-5.5.5, CA-5.2.6). */
function toClosedReason(error: unknown): ClosedReason | null {
  if (!(error instanceof ApiError)) return null;
  if (error.hasCode(SESSION_ABANDONED)) return 'abandonada';
  if (error.hasCode(SESSION_ALREADY_CLOSED, SESSION_TRANSITION_NOT_ALLOWED)) return 'noAdmite';
  return null;
}
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

/** Fallos de la IA al evaluar: abren el panel y, en `…/reprocess`, suman al tope (D3, v11.3 D1). */
function isEvaluationFailure(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    error.hasCode(LLM_UNAVAILABLE, LLM_LIMIT_REACHED, LLM_INVALID_OUTPUT)
  );
}

/** `413`, `415` y `422`: el mismo audio fallaría igual al reenviarlo (SPEC §5). */
const UNUSABLE_AUDIO_STATUSES = new Set([413, 415, 422]);

/**
 * Si la grabación ya no sirve tras un error de `…/answers/audio` (SPEC §5): un rechazo al
 * transcribir, `413`, `415` o `422`, o un fallo de la IA, porque el audio ya quedó registrado y
 * «Reintentar» no lo necesita. Sin red, `404`, `409` u otro `5xx` la conservan (CA-5.8.22).
 */
function discardsAudio(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (isEvaluationFailure(error)) return true;
  if (error.code && error.code in AUDIO_REJECTIONS) return true;
  return UNUSABLE_AUDIO_STATUSES.has(error.httpStatus);
}

function toSubmitErrorKey(error: unknown): SubmitErrorKey {
  if (error instanceof AnswerResponseShapeError) return 'generico';
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
  /** Último fallo de `…/reprocess` que no es de evaluación; `null` si fue de la IA o no hubo. */
  const [retryError, setRetryError] = useState<SubmitErrorKey | null>(null);
  const [audioRejection, setAudioRejection] = useState<AudioRejection | null>(null);
  const [closedReason, setClosedReason] = useState<ClosedReason | null>(null);
  /** `409 TURN_NOT_RETRYABLE`: el turno ya no espera reintento (v11.3 D9). */
  const [turnNotRetryable, setTurnNotRetryable] = useState(false);
  const keysByTurn = useRef(new Map<string, string>());
  const inFlight = useRef(false);
  const retryInFlight = useRef(false);
  const totalRetries = MAX_EVALUATION_RETRIES + MAX_LATER_EVALUATION_RETRIES;
  const canRetry = failedRetries < totalRetries && !turnNotRetryable;

  function applyResult(result: AnswerResult) {
    setProgress(result.progress);
    setFailedRetries(0);
    setTurnNotRetryable(false);
    setRetryError(null);
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
      if (isEvaluationFailure(error)) {
        setPhase('evaluationFailed');
        return;
      }
      const closed = toClosedReason(error);
      if (closed) {
        setClosedReason(closed);
        setPhase('closed');
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
    onMutate: () => setRetryError(null),
    onSuccess: applyResult,
    onError: (error) => {
      // Solo un fallo de la IA gasta un «Reintentar» (D4); el contador no baja
      // con otros fallos, así que «Ir al inicio» se queda una vez agotado.
      if (isEvaluationFailure(error)) {
        setFailedRetries((count) => count + 1);
        return;
      }
      // `409` del contrato real (v11.3 D7 a D9): ninguno suma de a uno.
      if (error instanceof ApiError && error.hasCode(TURN_RETRY_LIMIT_REACHED)) {
        setFailedRetries(totalRetries);
        return;
      }
      const closed = toClosedReason(error);
      if (closed) {
        setClosedReason(closed);
        setPhase('closed');
        return;
      }
      if (error instanceof ApiError && error.hasCode(TURN_NOT_RETRYABLE)) {
        setTurnNotRetryable(true);
        setRetryError('generico');
        return;
      }
      setRetryError(toSubmitErrorKey(error));
    },
  });

  return {
    question,
    progress,
    phase,
    submitError,
    isSubmitting: submit.isPending,
    isRetrying: reprocess.isPending,
    retryError,
    /** Fin del tramo 1: el mensaje pasa al de CA-5.2.20 y aparece «Ir al inicio». */
    retriesExhausted: failedRetries >= MAX_EVALUATION_RETRIES,
    /** `false` tras el 2.º fallo de la IA del tramo 2: ya no se ofrece «Reintentar» (v11.3 D2). */
    canRetry,
    /** `409 TURN_NOT_RETRYABLE`: genérico sin «Reintentar» y con «Ir al inicio» (v11.3 D9). */
    turnNotRetryable,
    audioRejection,
    closedReason,
    clearAudioRejection: () => setAudioRejection(null),
    /**
     * @param onSettledAudio se llama si el backend registró la respuesta o
     *   el error deja la grabación sin uso (`discardsAudio`).
     */
    submitAnswer: (answer: TurnAnswer, onSettledAudio?: () => void) => {
      // Guarda síncrona: `isPending` llega tras un re-render y dos clics
      // seguidos podrían colarse antes (mismo caso que DF-004 en perfil).
      if (inFlight.current) return;
      inFlight.current = true;
      submit.mutate(answer, {
        onSuccess: () => onSettledAudio?.(),
        onError: (error) => {
          if (discardsAudio(error)) onSettledAudio?.();
        },
        onSettled: () => {
          inFlight.current = false;
        },
      });
    },
    retryEvaluation: () => {
      // Misma guarda síncrona que «Enviar» (DF-004): `isPending` y el botón
      // deshabilitado llegan tras un re-render.
      if (retryInFlight.current || !canRetry) return;
      retryInFlight.current = true;
      reprocess.mutate(undefined, {
        onSettled: () => {
          retryInFlight.current = false;
        },
      });
    },
  };
}
