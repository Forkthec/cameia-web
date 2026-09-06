/**
 * Error tipado para toda respuesta no-OK del API Gateway. `errorMap.ts` es el
 * único lugar que la construye a partir de una `Response`; el resto del
 * frontend solo la atrapa y la interroga con los métodos `is*()`, nunca lee
 * `httpStatus` a mano para tomar una decisión de negocio.
 */
export interface ApiErrorDetail {
  field: string;
  code: string;
}

interface ApiErrorParams {
  httpStatus: number;
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  correlationId?: string;
  path?: string;
  timestamp?: string;
}

export class ApiError extends Error {
  readonly httpStatus: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];
  readonly correlationId?: string;
  readonly path?: string;
  readonly timestamp?: string;

  constructor({
    httpStatus,
    code,
    message,
    details = [],
    correlationId,
    path,
    timestamp,
  }: ApiErrorParams) {
    super(message);
    this.name = 'ApiError';
    this.httpStatus = httpStatus;
    this.code = code;
    this.details = details;
    this.correlationId = correlationId;
    this.path = path;
    this.timestamp = timestamp;
  }

  isUnauthorized(): boolean {
    return this.httpStatus === 401;
  }

  isForbidden(): boolean {
    return this.httpStatus === 403;
  }

  isValidation(): boolean {
    return this.httpStatus === 400 || this.httpStatus === 422;
  }

  isServer(): boolean {
    return this.httpStatus >= 500;
  }
}
