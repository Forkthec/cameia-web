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
 * - «Cancelar» elimina la sesión nueva y vuelve a «Nueva entrevista» sin
 *   datos (CA-4.5.17). CA-4.5.16 (volver a la entrevista anterior) necesita
 *   recuperar su estado (HU-5.7), que aún no existe.
 */
import { useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { ApiError } from '@/services/http/ApiError';
import { deleteInterviewSession, startInterviewSession } from '../api/interviewSession.api';
import { toChatEntry } from '../api/interviewSetup.mapper';
import { useInterviewSetupStore } from '../store/interviewSetup.store';

/** Duración de la firma animada (`BrandReveal`) antes de abrir el chat. */
const MIN_INTRO_MS = 1600;
/** «Reintentar» la preparación: máximo 2 veces por sesión (CA-4.5.15, CA-4.5.19). */
const MAX_START_RETRIES = 2;

export type StartError = 'generico' | 'agotados' | 'noEncontrada' | 'red';

/**
 * @param sessionId sesión CONFIGURADA recién creada.
 * @returns el error a mostrar (o `null` mientras prepara) y las acciones.
 */
export function useStartInterview(sessionId: string) {
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
    onSuccess: (dto) => {
      const wait = Math.max(0, MIN_INTRO_MS - (Date.now() - startedAt.current));
      window.setTimeout(() => {
        resetWizard();
        void navigate(ROUTES.entrenarSesion(sessionId), {
          replace: true,
          state: toChatEntry(sessionId, dto, sessionLanguage),
        });
      }, wait);
    },
    onError: (failure) => {
      if (!(failure instanceof ApiError)) {
        setError('red');
      } else if (failure.httpStatus === 404) {
        setError('noEncontrada');
      } else if (failure.hasCode('PLANNING_RETRIES_EXHAUSTED')) {
        setError('agotados');
      } else {
        setError(retries >= MAX_START_RETRIES ? 'agotados' : 'generico');
      }
    },
  });

  const cancel = useMutation({
    mutationFn: () => deleteInterviewSession(sessionId),
    onSettled: () => {
      resetWizard();
      void navigate(ROUTES.entrenarNueva, { replace: true });
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
