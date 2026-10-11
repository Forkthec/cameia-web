/**
 * Protege el contrato real de `errorMap.ts` (`ADR-0008`, que sustituye al
 * `ADR-0007`: `ProblemDetail`, RFC 7807): que un error de validación con
 * `errors` se mapea completo, que `code`, `requestId` y `errors[].code` del
 * `ProblemDetail` no se pierden (CM-298), que el cuerpo `{code, message}` del
 * Gateway (`GlobalErrorHandler.java`) se traduce con `code` en su campo,
 * `message` en `detail` y `title` vacío, que 401 se distingue como
 * `isUnauthorized` y 500 como `isServer`, y que una respuesta malformada o
 * con una forma inesperada (sin `code` ni `title`/`detail`) no lanza sin
 * control, sino que arma un `ApiError` con `title: 'UNKNOWN_ERROR'`.
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from './ApiError';
import { mapErrorResponse } from './errorMap';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('mapErrorResponse', () => {
  it('mapea un error de validación con errors por campo (forma real de BusinessExceptionHandler)', async () => {
    const response = jsonResponse(422, {
      type: 'about:blank',
      title: 'Fecha de nacimiento no válida',
      status: 422,
      detail: 'Debes ser mayor de edad',
      instance: '/api/v1/users',
      errors: [{ field: 'birthDate', message: 'Debes ser mayor de edad' }],
    });

    const error = await mapErrorResponse(response);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.httpStatus).toBe(422);
    expect(error.isValidation()).toBe(true);
    expect(error.errors).toEqual([{ field: 'birthDate', message: 'Debes ser mayor de edad' }]);
    expect(error.hasField('birthDate')).toBe(true);
    expect(error.fieldMessage('birthDate')).toBe('Debes ser mayor de edad');
  });

  it('conserva code, requestId y errors[].code de un ProblemDetail completo (ADR-0008)', async () => {
    const response = jsonResponse(422, {
      type: 'about:blank',
      title: 'Validación fallida',
      status: 422,
      detail: 'Revisa los campos marcados.',
      code: 'VALIDATION_FAILED',
      requestId: 'req-123',
      errors: [{ field: 'name', code: 'PROFILE_NAME_REQUIRED', message: 'Ingresa un nombre.' }],
    });

    const error = await mapErrorResponse(response);

    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.requestId).toBe('req-123');
    expect(error.errors).toEqual([
      { field: 'name', code: 'PROFILE_NAME_REQUIRED', message: 'Ingresa un nombre.' },
    ]);
    expect(error.errors[0]?.code).toBe('PROFILE_NAME_REQUIRED');
    expect(error.title).toBe('Validación fallida');
    expect(error.detail).toBe('Revisa los campos marcados.');
  });

  it('un ProblemDetail sin code deja code y requestId sin definir', async () => {
    const response = jsonResponse(409, { title: 'Conflicto', detail: 'x' });

    const error = await mapErrorResponse(response);

    expect(error.code).toBeUndefined();
    expect(error.requestId).toBeUndefined();
  });

  it('traduce el cuerpo {code, message} del Gateway: code a su campo, message a detail y title vacío (401 AUTH_REQUIRED)', async () => {
    const response = jsonResponse(401, {
      code: 'AUTH_REQUIRED',
      message: 'Token de acceso requerido o inválido',
    });

    const error = await mapErrorResponse(response);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.httpStatus).toBe(401);
    expect(error.isUnauthorized()).toBe(true);
    expect(error.code).toBe('AUTH_REQUIRED');
    expect(error.detail).toBe('Token de acceso requerido o inválido');
    expect(error.title).toBe('');
    expect(error.requestId).toBeUndefined();
    expect(error.errors).toEqual([]);
  });

  it('mapea un error sin errors por campo (p. ej. correo duplicado, 409)', async () => {
    const response = jsonResponse(409, {
      title: 'Correo ya registrado',
      status: 409,
      detail: 'Ese correo ya tiene una cuenta',
    });

    const error = await mapErrorResponse(response);

    expect(error.httpStatus).toBe(409);
    expect(error.errors).toEqual([]);
    expect(error.hasField('email')).toBe(false);
  });

  it('mapea un 401 como isUnauthorized', async () => {
    const response = jsonResponse(401, {
      title: 'No autenticado',
      detail: 'Token inválido o expirado',
    });

    const error = await mapErrorResponse(response);

    expect(error.httpStatus).toBe(401);
    expect(error.isUnauthorized()).toBe(true);
    expect(error.isServer()).toBe(false);
  });

  it('mapea un 500 como isServer', async () => {
    const response = jsonResponse(500, {
      title: 'Error interno',
      detail: 'No pudimos completar la operación. Inténtalo de nuevo en unos minutos',
    });

    const error = await mapErrorResponse(response);

    expect(error.httpStatus).toBe(500);
    expect(error.isServer()).toBe(true);
    expect(error.isUnauthorized()).toBe(false);
  });

  it('ante una respuesta malformada (HTML de un proxy, no JSON), arma un ApiError con UNKNOWN_ERROR', async () => {
    const response = new Response('<html><body>502 Bad Gateway</body></html>', {
      status: 502,
      headers: { 'Content-Type': 'text/html' },
    });

    const error = await mapErrorResponse(response);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.httpStatus).toBe(502);
    expect(error.title).toBe('UNKNOWN_ERROR');
    expect(error.isServer()).toBe(true);
  });

  it('ante JSON válido pero con una forma inesperada (sin code ni title/detail), también arma UNKNOWN_ERROR', async () => {
    const response = jsonResponse(400, { error: 'algo salió mal', reason: 'desconocida' });

    const error = await mapErrorResponse(response);

    expect(error.title).toBe('UNKNOWN_ERROR');
    expect(error.httpStatus).toBe(400);
  });
});
