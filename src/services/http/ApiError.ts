/**
 * Error tipado para toda respuesta no-OK del API Gateway. `errorMap.ts` es el
 * único lugar que la construye a partir de una `Response`; el resto del
 * frontend solo la atrapa y la interroga con los métodos `is*()` y
 * `fieldMessage()`/`hasField()`, nunca lee `httpStatus` a mano para tomar una
 * decisión de negocio.
 *
 * Forma real de `ProblemDetail` (RFC 7807), confirmada contra
 * `BusinessExceptionHandler.java` (cameia-cuentas) y ya anotada para
 * `cameia-perfil` en `professional-profile/SPEC.md` §4 — **no** hay `code`
 * propio (`ADR-0007`): el backend nunca lo envía, así que esta clase no lo
 * inventa. `title`/`detail` se guardan para depuración/logs, pero
 * `CLAUDE.md` §8 prohíbe renderizarlos: el resto de la app discrimina por
 * `httpStatus` + `errors[].field`.
 */
export interface ApiErrorField {
  field: string;
  message: string;
}

interface ApiErrorParams {
  httpStatus: number;
  title: string;
  detail: string;
  errors?: ApiErrorField[];
  type?: string;
  instance?: string;
}

export class ApiError extends Error {
  readonly httpStatus: number;
  readonly title: string;
  readonly detail: string;
  readonly errors: ApiErrorField[];
  readonly type?: string;
  readonly instance?: string;

  constructor({ httpStatus, title, detail, errors = [], type, instance }: ApiErrorParams) {
    super(detail);
    this.name = 'ApiError';
    this.httpStatus = httpStatus;
    this.title = title;
    this.detail = detail;
    this.errors = errors;
    this.type = type;
    this.instance = instance;
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

  /** `409` — conflicto de recurso (p. ej. `ProfileAlreadyExistsException`/`ProfileAlreadyCompletedException` en `cameia-perfil`, confirmado contra el código real, CM-195). Nunca trae `errors[]`: no es un campo inválido, es un estado del recurso. */
  isConflict(): boolean {
    return this.httpStatus === 409;
  }

  isServer(): boolean {
    return this.httpStatus >= 500;
  }

  /** Mensaje que el backend asoció a `field` en `errors`, o `undefined` si no lo reportó por campo. */
  fieldMessage(field: string): string | undefined {
    return this.errors.find((error) => error.field === field)?.message;
  }

  hasField(field: string): boolean {
    return this.errors.some((error) => error.field === field);
  }
}
