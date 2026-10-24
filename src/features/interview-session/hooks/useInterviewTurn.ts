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
 *   sin pedir texto nuevo (CA-5.2.19, fallo de la IA al evaluar la
 *   respuesta). Tras 2 reintentos fallidos cambia el mensaje y aparece «Ir al
 *   inicio» (CA-5.2.20, reintentos de evaluación agotados), pero «Reintentar»
 *   sigue.
 * - Al tope de «Reintentar» solo suma un fallo de `…/reprocess` con `code`
 *   `LLM_UNAVAILABLE` o `LLM_LIMIT_REACHED` (D3, D4 del SPEC). Sin red, `404`
 *   o cualquier otro error muestran su mensaje (`retryError`) sin sumar; una
 *   vez agotado el tope, «Ir al inicio» no desaparece.
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
import { MAX_EVALUATION_RETRIES } from '../model/interviewSession.constants';
import { LLM_LIMIT_REACHED, LLM_UNAVAILABLE } from '../model/interviewSession.errorCodes';
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

/** Fallos de la IA al evaluar: abren el panel y, en `…/reprocess`, suman al tope (D3). */
function isEvaluationFailure(error: unknown): boolean {
  return error instanceof ApiError && error.hasCode(LLM_UNAVAILABLE, LLM_LIMIT_REACHED);
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
  const keysByTurn = useRef(new Map<string, string>());
  const inFlight = useRef(false);

  function applyResult(result: AnswerResult) {
    setProgress(result.progress);
    setFailedRetries(0);
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
    retriesExhausted: failedRetries >= MAX_EVALUATION_RETRIES,
    audioRejection,
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
    retryEvaluation: () => reprocess.mutate(),
  };
}
