/**
 * Convierte la respuesta de error del backend en un {@link ApiError}. Nunca
 * lanza un error sin tipar: si el cuerpo no es JSON (p. ej. un 502 del proxy
 * devolviendo HTML) o no tiene la forma esperada, igual arma un ApiError con
 * `title: 'UNKNOWN_ERROR'` en vez de dejar propagar la excepción original.
 *
 * Forma real (`ADR-0007`, RFC 7807 `ProblemDetail`), confirmada contra
 * `BusinessExceptionHandler.java` de `cameia-cuentas`: `title`/`detail`/
 * `status` estándar del RFC, más la extensión propia `errors: [{field,
 * message}]` — sin `code`. `type`/`instance` son opcionales porque no todo
 * `ProblemDetail` los rellena (Spring los omite si no se configuran).
 */
import { ApiError, type ApiErrorField } from './ApiError';

interface ProblemDetailBody {
  title: string;
  detail: string;
  status?: number;
  errors?: ApiErrorField[];
  type?: string;
  instance?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isApiErrorField(value: unknown): value is ApiErrorField {
  return isRecord(value) && typeof value.field === 'string' && typeof value.message === 'string';
}

/** Devuelve `undefined` si `value` no calza con el `ProblemDetail` esperado. */
function parseProblemDetail(value: unknown): ProblemDetailBody | undefined {
  if (!isRecord(value) || typeof value.title !== 'string' || typeof value.detail !== 'string') {
    return undefined;
  }

  return {
    title: value.title,
    detail: value.detail,
    status: typeof value.status === 'number' ? value.status : undefined,
    errors: Array.isArray(value.errors) ? value.errors.filter(isApiErrorField) : undefined,
    type: typeof value.type === 'string' ? value.type : undefined,
    instance: typeof value.instance === 'string' ? value.instance : undefined,
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

  const parsed = parseProblemDetail(rawBody);

  if (parsed) {
    return new ApiError({
      httpStatus: parsed.status ?? response.status,
      title: parsed.title,
      detail: parsed.detail,
      errors: parsed.errors,
      type: parsed.type,
      instance: parsed.instance ?? response.url,
    });
  }

  return new ApiError({
    httpStatus: response.status,
    title: 'UNKNOWN_ERROR',
    detail: `Respuesta de error con formato inesperado (HTTP ${response.status}).`,
    instance: response.url,
  });
}
