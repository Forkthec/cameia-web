/**
 * Error tipado para toda respuesta no-OK del API Gateway. `errorMap.ts` es el
 * único lugar que la construye a partir de una `Response`; el resto del
 * frontend solo la atrapa y la interroga con los métodos `is*()`,
 * `hasCode()` y `fieldMessage()`/`hasField()`.
 *
 * Forma real de `ProblemDetail` (RFC 7807) más las extensiones propias del
 * backend (`ADR-0008`, que sustituye al `ADR-0007`): `code` estable,
 * `requestId` y `errors: [{field, code, message}]`. La decisión de negocio
 * sobre un error se toma por `code` (`hasCode()`), acotada al endpoint cuyo
 * contrato lo define y sin respaldo por estado HTTP: si falta el `code`, la
 * pantalla muestra el mensaje genérico. El `httpStatus` queda para las
 * clases amplias (`401`, `404`, `5xx`; ver los métodos `is*()`).
 * `title`/`detail` se guardan para depuración/logs, pero `CLAUDE.md` §8
 * prohíbe renderizarlos —igual que `code` y `requestId`: el `code` elige una
 * llave de i18n, no se muestra—.
 *
 * Los errores del Gateway llegan como `{code, message}`: `errorMap.ts` pone
 * `message` en `detail` y deja `title` vacío (`ADR-0008`).
 */
export interface ApiErrorField {
  /** Nombre del campo del formulario que el backend rechazó. */
  field: string;
  /** Código estable de la causa por campo; ausente si el backend no lo envió. */
  code?: string;
  /** Texto del backend para el campo; no se renderiza (`CLAUDE.md` §8). */
  message: string;
}

interface ApiErrorParams {
  httpStatus: number;
  title: string;
  detail: string;
  errors?: ApiErrorField[];
  type?: string;
  instance?: string;
  code?: string;
  requestId?: string;
}

export class ApiError extends Error {
  readonly httpStatus: number;
  readonly title: string;
  readonly detail: string;
  readonly errors: ApiErrorField[];
  readonly type?: string;
  readonly instance?: string;
  /** Código estable del backend (`ADR-0008`); `undefined` si la respuesta no lo trae. */
  readonly code?: string;
  /** Identificador de trazabilidad del cuerpo; `undefined` si el cuerpo no lo trae (el del Gateway viaja en `X-Request-Id`, fuera de CM-298). */
  readonly requestId?: string;

  constructor({
    httpStatus,
    title,
    detail,
    errors = [],
    type,
    instance,
    code,
    requestId,
  }: ApiErrorParams) {
    super(detail);
    this.name = 'ApiError';
    this.httpStatus = httpStatus;
    this.title = title;
    this.detail = detail;
    this.errors = errors;
    this.type = type;
    this.instance = instance;
    this.code = code;
    this.requestId = requestId;
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

  /** `409` — conflicto de recurso (p. ej. `ProfileAlreadyExistsException`/`ProfileAlreadyCompletedException` en `cameia-perfil`, confirmado contra el código real, CM-195). Nunca trae `errors[]`: no es un campo inválido, es un estado del recurso. Para distinguir qué conflicto es, usar `hasCode()`. */
  isConflict(): boolean {
    return this.httpStatus === 409;
  }

  isServer(): boolean {
    return this.httpStatus >= 500;
  }

  /**
   * `true` si el `code` del error es alguno de `codes`. Es el discriminador de
   * negocio (`ADR-0008`): sin `code` devuelve siempre `false`, no cae al estado
   * HTTP.
   *
   * @param codes códigos del catálogo del backend, copiados tal cual.
   */
  hasCode(...codes: string[]): boolean {
    return this.code !== undefined && codes.includes(this.code);
  }

  /** Mensaje que el backend asoció a `field` en `errors`, o `undefined` si no lo reportó por campo. */
  fieldMessage(field: string): string | undefined {
    return this.errors.find((error) => error.field === field)?.message;
  }

  hasField(field: string): boolean {
    return this.errors.some((error) => error.field === field);
  }
}
