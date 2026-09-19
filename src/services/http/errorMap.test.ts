/**
 * Protege el contrato real de `errorMap.ts` (`ADR-0007`: `ProblemDetail`,
 * RFC 7807, confirmado contra `BusinessExceptionHandler.java`): que un error
 * de validación con `errors` se mapea completo, que 401 se distingue como
 * `isUnauthorized` y 500 como `isServer`, y que una respuesta malformada o
 * con una forma inesperada (sin `title`/`detail`) no lanza sin control, sino
 * que arma un `ApiError` con `title: 'UNKNOWN_ERROR'`.
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

  it('ante JSON válido pero con una forma inesperada (sin title/detail), también arma UNKNOWN_ERROR', async () => {
    const response = jsonResponse(400, { error: 'algo salió mal', reason: 'desconocida' });

    const error = await mapErrorResponse(response);

    expect(error.title).toBe('UNKNOWN_ERROR');
    expect(error.httpStatus).toBe(400);
  });
});
