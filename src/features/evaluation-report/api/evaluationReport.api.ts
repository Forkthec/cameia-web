/**
 * Pide el Reporte de Evaluación (HU-6.4, CA-6.4.3). La primera consulta lo genera en la misma
 * petición y puede tardar unos 61,5 s (3 intentos de la IA); el Gateway corta a los 120 s, así
 * que se espera hasta ahí. Un 202 `REPORT_GENERATING` (otra consulta lo está generando) no trae
 * el reporte: llega como `{ status: 'generating' }` para que el hook vuelva a preguntar.
 */
import { httpClient } from '@/services/http/httpClient';
import { toEvaluationReport } from './evaluationReport.mapper';
import type { EvaluationReportDto } from './evaluationReport.dto';
import type { EvaluationReport } from '../model/evaluationReport.types';

/** Lo que espera el Gateway antes de cortar (aviso de Backend del 16-11-2026, §3). */
const REPORT_REQUEST_TIMEOUT_MS = 120_000;

export type ReportFetchResult =
  { status: 'ready'; report: EvaluationReport } | { status: 'generating' };

function isReport(value: unknown): value is EvaluationReportDto {
  return (
    typeof value === 'object' &&
    value !== null &&
    Array.isArray((value as EvaluationReportDto).metrics) &&
    Array.isArray((value as EvaluationReportDto).questions)
  );
}

/**
 * @param sessionId sesión FINALIZADA.
 * @returns el reporte, o `generating` si otra consulta lo está generando (202).
 * @throws ApiError 404 `SESSION_NOT_FOUND`, 409 `SESSION_ABANDONED` / `SESSION_NOT_FINISHED`
 *   o 5xx; TypeError si no hay red.
 */
export async function fetchEvaluationReport(sessionId: string): Promise<ReportFetchResult> {
  const body = await httpClient.get<unknown>(
    `/api/v1/interviews/sessions/${sessionId}/evaluation-report`,
    { timeoutMs: REPORT_REQUEST_TIMEOUT_MS },
  );
  if (!isReport(body)) return { status: 'generating' };
  return { status: 'ready', report: toEvaluationReport(body) };
}
