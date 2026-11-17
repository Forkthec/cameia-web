/**
 * Datos del Reporte de Evaluación (HU-6.4) en TanStack Query (CLAUDE.md §3.6).
 *
 * - Mientras llega la primera respuesta, o mientras el servidor responde 202 (otra consulta lo
 *   genera), el estado es `generating`; con 202 vuelve a consultar cada 3 s y, pasados 2 minutos
 *   desde el primer 202, pasa al error del servidor (CA-6.4.3).
 * - Los errores se deciden por `code` (CLAUDE.md §8): 404 `SESSION_NOT_FOUND` (CA-6.4.5),
 *   409 `SESSION_ABANDONED` / `SESSION_NOT_FINISHED` (CA-6.4.4); 5xx y otros, `generico`; sin
 *   red, `red` (CA-6.4.6). El 401 lo maneja `httpClient` (rutas privadas).
 * - El reporte no cambia una vez emitido: no se vuelve a pedir solo.
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/services/http/ApiError';
import { fetchEvaluationReport } from '../api/evaluationReport.api';
import type { EvaluationReport } from '../model/evaluationReport.types';

/** Espera entre consultas con 202 y tope total (CA-6.4.3). */
const POLL_INTERVAL_MS = 3_000;
const POLL_LIMIT_MS = 120_000;

export type ReportError = 'noEncontrada' | 'abandonada' | 'noTerminada' | 'generico' | 'red';

export type ReportState =
  | { status: 'generating' }
  | { status: 'ready'; report: EvaluationReport }
  | { status: 'error'; error: ReportError };

function toReportError(error: unknown): ReportError {
  if (!(error instanceof ApiError)) return 'red';
  if (error.hasCode('SESSION_NOT_FOUND') || error.httpStatus === 404) return 'noEncontrada';
  if (error.hasCode('SESSION_ABANDONED')) return 'abandonada';
  if (error.hasCode('SESSION_NOT_FINISHED')) return 'noTerminada';
  return 'generico';
}

/**
 * @param sessionId sesión del reporte (de la dirección).
 * @returns el estado de la pantalla y `retry` para «Reintentar».
 */
export function useEvaluationReport(sessionId: string) {
  const [timedOut, setTimedOut] = useState(false);

  const query = useQuery({
    queryKey: ['evaluationReport', sessionId],
    queryFn: () => fetchEvaluationReport(sessionId),
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchInterval: (current) =>
      current.state.data?.status === 'generating' && !timedOut ? POLL_INTERVAL_MS : false,
  });

  const polling = query.data?.status === 'generating' && !timedOut;
  useEffect(() => {
    if (!polling) return;
    const id = window.setTimeout(() => setTimedOut(true), POLL_LIMIT_MS);
    return () => window.clearTimeout(id);
  }, [polling]);

  let state: ReportState;
  if (timedOut) state = { status: 'error', error: 'generico' };
  else if (query.isError && !query.isFetching)
    state = { status: 'error', error: toReportError(query.error) };
  else if (query.data?.status === 'ready') state = { status: 'ready', report: query.data.report };
  else state = { status: 'generating' };

  function retry() {
    setTimedOut(false);
    void query.refetch();
  }

  return { state, retry };
}
