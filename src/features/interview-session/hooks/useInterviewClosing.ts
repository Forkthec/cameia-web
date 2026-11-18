/**
 * Cierre de la entrevista (HU-5.5) después de la pregunta 5. Pide a Backend
 * reunir la evaluación (`…/consolidation`) y expone en qué va:
 *
 * - `processing`: «Procesando tu respuesta…», sin campo ni «Enviar» (CA-5.5.6).
 * - `finalized`: mensaje de cierre, sin resultados ni resumen (CA-5.5.3).
 * - `failed`: Backend agotó sus 3 intentos (`503`): «Ocurrió un error.
 *   Inténtalo de nuevo.» con «Reintentar», que pide un ciclo nuevo
 *   (CA-5.5.11). Un fallo de red o una respuesta inesperada se muestran
 *   igual, para no dejar a la persona sin salida.
 *
 * Se pide una sola vez al terminar; `…/consolidation` es idempotente, así que
 * repetirlo no cierra dos veces (aviso de Backend del 7-11-2026, §6.1).
 */
import { useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { consolidateSession } from '../api/interviewSession.api';

export type ClosingStatus = 'processing' | 'finalized' | 'failed';

/**
 * @param sessionId sesión que respondió sus 5 preguntas.
 * @param enabled `true` cuando la pregunta 5 quedó registrada.
 * @returns el estado del cierre y la acción «Reintentar».
 */
export function useInterviewClosing(sessionId: string, enabled: boolean) {
  const requested = useRef(false);
  const consolidation = useMutation({ mutationFn: () => consolidateSession(sessionId) });
  const { mutate } = consolidation;

  useEffect(() => {
    if (!enabled || requested.current) return;
    requested.current = true;
    mutate();
  }, [enabled, mutate]);

  const finished = consolidation.isSuccess && consolidation.data === true;
  const failed = consolidation.isError || (consolidation.isSuccess && !finished);
  const status: ClosingStatus = finished ? 'finalized' : failed ? 'failed' : 'processing';

  return {
    status,
    isRetrying: consolidation.isPending,
    retry: () => mutate(),
  };
}
