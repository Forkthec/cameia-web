/**
 * Convierte la respuesta de error del backend en un {@link ApiError}. Nunca
 * lanza un error sin tipar: si el cuerpo no es JSON (p. ej. un 502 del proxy
 * devolviendo HTML) o no tiene ninguna de las dos formas esperadas, igual arma
 * un ApiError con `title: 'UNKNOWN_ERROR'` en vez de dejar propagar la
 * excepción original.
 *
 * Dos formas de cuerpo (`ADR-0008`, que sustituye al `ADR-0007`):
 * - `ProblemDetail` (RFC 7807) de los microservicios: `title`/`detail`/`status`
 *   estándar, más las extensiones propias `code`, `requestId` y
 *   `errors: [{field, code, message}]`. `code`, `requestId` y `errors[].code`
 *   son opcionales: solo se conservan si el cuerpo los trae. `type`/`instance`
 *   también, porque Spring los omite si no se configuran.
 * - `{code, message}` del Gateway (`GlobalErrorHandler.java`,
 *   `FirebaseAuthGlobalFilter.java`): `code` va a su campo, `message` a
 *   `detail` y `title` queda vacío. Su `requestId` viaja en la cabecera
 *   `X-Request-Id`, que este archivo no lee (fuera de CM-298).
 */
import { ApiError, type ApiErrorField } from './ApiError';

interface ErrorBody {
  title: string;
  detail: string;
  status?: number;
  code?: string;
  requestId?: string;
  errors?: ApiErrorField[];
  type?: string;
  instance?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function isApiErrorField(value: unknown): value is ApiErrorField {
  return (
    isRecord(value) &&
    typeof value.field === 'string' &&
    typeof value.message === 'string' &&
    (value.code === undefined || typeof value.code === 'string')
  );
}

/** Devuelve `undefined` si `value` no calza con el `ProblemDetail` esperado. */
function parseProblemDetail(value: unknown): ErrorBody | undefined {
  if (!isRecord(value) || typeof value.title !== 'string' || typeof value.detail !== 'string') {
    return undefined;
  }

  return {
    title: value.title,
    detail: value.detail,
    status: typeof value.status === 'number' ? value.status : undefined,
    code: optionalString(value.code),
    requestId: optionalString(value.requestId),
    errors: Array.isArray(value.errors) ? value.errors.filter(isApiErrorField) : undefined,
    type: optionalString(value.type),
    instance: optionalString(value.instance),
  };
}

/** Devuelve `undefined` si `value` no calza con el `{code, message}` del Gateway. */
function parseGatewayError(value: unknown): ErrorBody | undefined {
  if (!isRecord(value) || typeof value.code !== 'string' || typeof value.message !== 'string') {
    return undefined;
  }

  return {
    title: '',
    detail: value.message,
    code: value.code,
    requestId: optionalString(value.requestId),
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

  const parsed = parseProblemDetail(rawBody) ?? parseGatewayError(rawBody);

  if (parsed) {
    return new ApiError({
      httpStatus: parsed.status ?? response.status,
      title: parsed.title,
      detail: parsed.detail,
      errors: parsed.errors,
      type: parsed.type,
      instance: parsed.instance ?? response.url,
      code: parsed.code,
      requestId: parsed.requestId,
    });
  }

  return new ApiError({
    httpStatus: response.status,
    title: 'UNKNOWN_ERROR',
    detail: `Respuesta de error con formato inesperado (HTTP ${response.status}).`,
    instance: response.url,
  });
}
