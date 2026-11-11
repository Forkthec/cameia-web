/**
 * Inicio de la entrevista (HU-4.5) desde la pantalla «Iniciando sesión de
 * entrevista» (PRT-04.11).
 *
 * - Pide el inicio una sola vez al montar (CA-4.5.12; el `StrictMode` de
 *   desarrollo monta dos veces y la guarda lo evita).
 * - Con éxito, espera a que termine la firma animada (`MIN_INTRO_MS`) y abre
 *   el chat con la pregunta 1 en el estado de la navegación.
 * - `503 LLM_UNAVAILABLE`: «Ocurrió un error…» con «Reintentar» y
 *   «Cancelar» (CA-4.5.14). El contador de reintentos lo lleva Backend: al
 *   agotarse responde `503 PLANNING_RETRIES_EXHAUSTED` y queda el mensaje de
 *   CA-4.5.19 solo con «Cancelar». El contador local de 2 es respaldo visual
 *   (respuesta de Backend del 20-10-2026, pregunta 2).
 * - `404`: «No encontramos lo que buscabas.» (CA-4.5.10).
 * - `409 SESSION_CONFLICT` (otro pedido de inicio llegó al mismo tiempo): se
 *   reintenta solo, una vez, y se muestra el estado actual (CA-4.5.12; código de cameia-entrevista, docs/errores.md).
 * - `409 SESSION_TRANSITION_NOT_ALLOWED`: «Esta entrevista ya no admite esa acción.».
 * - «Cancelar» elimina la sesión nueva. Si se llegó desde el aviso de
 *   entrevista en curso, consulta el estado de la anterior y abre su chat en
 *   la pregunta pendiente (CA-4.5.16); si no hay anterior, o no se puede
 *   abrir, vuelve a «Nueva entrevista» sin datos (CA-4.5.17).
 */
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { ApiError } from '@/services/http/ApiError';
import {
  deleteInterviewSession,
  getInterviewSessionState,
  startInterviewSession,
} from '../api/interviewSession.api';
import { toChatEntry } from '../api/interviewSetup.mapper';
import { useInterviewSetupStore } from '../store/interviewSetup.store';

/** Duración de la firma animada (`BrandReveal`) antes de abrir el chat. */
const MIN_INTRO_MS = 1600;
/** «Reintentar» la preparación: máximo 2 veces por sesión (CA-4.5.15, CA-4.5.19). */
const MAX_START_RETRIES = 2;

export type StartError = 'generico' | 'agotados' | 'noEncontrada' | 'noAdmitida' | 'red';

/**
 * @param sessionId sesión CONFIGURADA recién creada.
 * @param previousSessionId entrevista que seguía en curso cuando se eligió
 *   «Iniciar la nueva» (CA-4.4.7); a ella vuelve «Cancelar» (CA-4.5.16).
 * @returns el error a mostrar (o `null` mientras prepara) y las acciones.
 */
export function useStartInterview(sessionId: string, previousSessionId?: string) {
  const navigate = useNavigate();
  const resetWizard = useInterviewSetupStore((state) => state.reset);
  const sessionLanguage = useInterviewSetupStore((state) => state.sessionLanguage);
  const startedAt = useRef(0);
  const requested = useRef(false);
  const [retries, setRetries] = useState(0);
  const [error, setError] = useState<StartError | null>(null);

  const start = useMutation({
    mutationFn: () => startInterviewSession(sessionId),
    onMutate: () => setError(null),
    retry: (failureCount, failure) =>
      failureCount < 1 && failure instanceof ApiError && failure.hasCode('SESSION_CONFLICT'),
    retryDelay: 0,
    onSuccess: (dto) => {
      const entry = toChatEntry(sessionId, dto, sessionLanguage);
      if (!entry) {
        setError('generico');
        return;
      }
      const wait = Math.max(0, MIN_INTRO_MS - (Date.now() - startedAt.current));
      window.setTimeout(() => {
        resetWizard();
        void navigate(ROUTES.entrenarSesion(sessionId), {
          replace: true,
          state: entry,
        });
      }, wait);
    },
    onError: (failure) => {
      if (!(failure instanceof ApiError)) {
        setError('red');
      } else if (failure.httpStatus === 404) {
        setError('noEncontrada');
      } else if (failure.hasCode('SESSION_TRANSITION_NOT_ALLOWED')) {
        setError('noAdmitida');
      } else if (failure.hasCode('PLANNING_RETRIES_EXHAUSTED')) {
        setError('agotados');
      } else {
        setError(retries >= MAX_START_RETRIES ? 'agotados' : 'generico');
      }
    },
  });

  const cancel = useMutation({
    mutationFn: async () => {
      // Si borrar falla, igual se sale de esta pantalla: la sesión sin iniciar
      // no bloquea nada y el Usuario no debe quedar atrapado aquí.
      await deleteInterviewSession(sessionId).catch(() => undefined);
      if (!previousSessionId) return null;
      const state = await getInterviewSessionState(previousSessionId).catch(() => null);
      return state ? toChatEntry(previousSessionId, state, sessionLanguage) : null;
    },
    onSettled: (previousEntry) => {
      resetWizard();
      if (previousEntry && previousSessionId) {
        void navigate(ROUTES.entrenarSesion(previousSessionId), {
          replace: true,
          state: previousEntry,
        });
      } else {
        void navigate(ROUTES.entrenarNueva, { replace: true });
      }
    },
  });

  const { mutate: startMutate } = start;
  useEffect(() => {
    if (requested.current) return;
    requested.current = true;
    startedAt.current = Date.now();
    startMutate();
  }, [startMutate]);

  return {
    error,
    canRetry: error === 'generico' || error === 'red',
    isCancelling: cancel.isPending,
    retry: () => {
      setRetries((count) => count + 1);
      startMutate();
    },
    cancel: () => cancel.mutate(),
  };
}
