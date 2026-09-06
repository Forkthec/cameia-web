// PROVISIONAL — el formato común de error está en API-TBD-14, sin aprobar
/**
 * Convierte la respuesta de error del backend en un {@link ApiError}. Nunca
 * lanza un error sin tipar: si el cuerpo no es JSON (p. ej. un 502 del proxy
 * devolviendo HTML) o no tiene la forma esperada, igual arma un ApiError con
 * `code: 'UNKNOWN_ERROR'` en vez de dejar propagar la excepción original.
 */
import { ApiError, type ApiErrorDetail } from './ApiError';

interface BackendErrorBody {
  code: string;
  message: string;
  details: ApiErrorDetail[];
  correlationId?: string;
  path?: string;
  timestamp?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiErrorDetail(value: unknown): value is ApiErrorDetail {
  return isRecord(value) && typeof value.field === 'string' && typeof value.code === 'string';
}

/** Devuelve `undefined` si `value` no calza con el formato esperado (§ API-TBD-14). */
function parseBackendErrorBody(value: unknown): BackendErrorBody | undefined {
  if (!isRecord(value) || typeof value.code !== 'string' || typeof value.message !== 'string') {
    return undefined;
  }

  return {
    code: value.code,
    message: value.message,
    details: Array.isArray(value.details) ? value.details.filter(isApiErrorDetail) : [],
    correlationId: typeof value.correlationId === 'string' ? value.correlationId : undefined,
    path: typeof value.path === 'string' ? value.path : undefined,
    timestamp: typeof value.timestamp === 'string' ? value.timestamp : undefined,
  };
}

export async function mapErrorResponse(response: Response): Promise<ApiError> {
  let rawBody: unknown;
  try {
    rawBody = await response.json();
  } catch {
    // Cuerpo no-JSON (HTML de un proxy, respuesta vacía, etc.): se trata
    // igual que un formato inesperado, más abajo.
    rawBody = undefined;
  }

  const parsed = parseBackendErrorBody(rawBody);

  if (parsed) {
    return new ApiError({
      httpStatus: response.status,
      code: parsed.code,
      message: parsed.message,
      details: parsed.details,
      correlationId: parsed.correlationId,
      path: parsed.path ?? response.url,
      timestamp: parsed.timestamp ?? new Date().toISOString(),
    });
  }

  return new ApiError({
    httpStatus: response.status,
    code: 'UNKNOWN_ERROR',
    message: `Respuesta de error con formato inesperado (HTTP ${response.status}).`,
    details: [],
    path: response.url,
    timestamp: new Date().toISOString(),
  });
}
