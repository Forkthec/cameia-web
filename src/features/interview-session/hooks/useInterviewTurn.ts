/**
 * Estado y acciones del turno pendiente del chat de Simulación (HU-5.2).
 *
 * - Enviar registra la respuesta con una `Idempotency-Key` por turno: si se
 *   cae la red y se reintenta, se reutiliza la misma clave (RT-06,
 *   CA-5.2.18), y un doble clic no registra dos respuestas (CA-5.2.4).
 * - `503 LLM_UNAVAILABLE`: la respuesta ya quedó guardada (CA-5.2.12); el
 *   turno pasa a `evaluationFailed` y «Reintentar» llama a `…/reprocess`
 *   sin pedir texto nuevo (CA-5.2.19). Tras 2 reintentos fallidos cambia el
 *   mensaje y aparece «Ir al inicio» (CA-5.2.20), pero «Reintentar» sigue.
 * - `404`: entrevista ajena o inexistente (CA-5.2.7).
 * - Sin `ApiError` (sin red): mensaje de conexión, se conserva el texto.
 *
 * Los errores se resuelven por `code` y clases amplias de estado HTTP
 * (CLAUDE.md §8); nunca se muestra `detail` ni `code`.
 */
import { useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ApiError } from '@/services/http/ApiError';
import { reprocessTurn, submitTextAnswer } from '../api/interviewSession.api';
import { MAX_EVALUATION_RETRIES } from '../model/interviewSession.constants';
import type {
  AnswerResult,
  InterviewProgress,
  InterviewQuestion,
  SessionEntry,
} from '../model/interviewSession.types';

export type TurnPhase = 'answering' | 'evaluationFailed' | 'finished';
/** Mensaje de error del envío, como llave de `errors`. */
export type SubmitErrorKey = 'red' | 'generico' | 'codigos.NOT_FOUND';

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

  function idempotencyKeyFor(turnId: string) {
    let key = keysByTurn.current.get(turnId);
    if (!key) {
      key = crypto.randomUUID();
      keysByTurn.current.set(turnId, key);
    }
    return key;
  }

  const submit = useMutation({
    mutationFn: (text: string) =>
      submitTextAnswer({
        sessionId: entry.sessionId,
        turnId: question.turnId,
        text,
        idempotencyKey: idempotencyKeyFor(question.turnId),
      }),
    onMutate: () => setSubmitError(null),
    onSuccess: applyResult,
    onError: (error) => {
      if (error instanceof ApiError && error.hasCode('LLM_UNAVAILABLE')) {
        setPhase('evaluationFailed');
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
    submitAnswer: (text: string) => {
      // Guarda síncrona: `isPending` llega tras un re-render y dos clics
      // seguidos podrían colarse antes (mismo caso que DF-004 en perfil).
      if (inFlight.current) return;
      inFlight.current = true;
      submit.mutate(text, {
        onSettled: () => {
          inFlight.current = false;
        },
      });
    },
    retryEvaluation: () => reprocess.mutate(),
  };
}
