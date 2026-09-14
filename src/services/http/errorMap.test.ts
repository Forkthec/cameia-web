/**
 * Protege el contrato PROVISIONAL de `errorMap.ts` (CLAUDE.md §8: hoy
 * `{ code, message, details }`, no RFC 9457 todavía): que un error de
 * validación con `details` se mapea completo, que 401 se distingue como
 * `isUnauthorized` y 500 como `isServer`, y que una respuesta malformada
 * o con una forma inesperada (sin `code`/`message`) no lanza sin
 * control, sino que arma un `ApiError` con `UNKNOWN_ERROR`.
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
  it('mapea un error de validación con details', async () => {
    const response = jsonResponse(422, {
      code: 'VALIDATION_ERROR',
      message: 'Los datos enviados no son válidos',
      details: [{ field: 'email', code: 'INVALID_FORMAT' }],
      correlationId: 'corr-123',
      path: '/api/v1/auth/registro',
      timestamp: '2026-01-01T00:00:00.000Z',
    });

    const error = await mapErrorResponse(response);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.httpStatus).toBe(422);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.isValidation()).toBe(true);
    expect(error.details).toEqual([{ field: 'email', code: 'INVALID_FORMAT' }]);
    expect(error.correlationId).toBe('corr-123');
    expect(error.path).toBe('/api/v1/auth/registro');
  });

  it('mapea un 401 como isUnauthorized', async () => {
    const response = jsonResponse(401, {
      code: 'UNAUTHORIZED',
      message: 'Token inválido o expirado',
    });

    const error = await mapErrorResponse(response);

    expect(error.httpStatus).toBe(401);
    expect(error.code).toBe('UNAUTHORIZED');
    expect(error.isUnauthorized()).toBe(true);
    expect(error.isServer()).toBe(false);
  });

  it('mapea un 500 como isServer', async () => {
    const response = jsonResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor',
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
    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.isServer()).toBe(true);
  });

  it('ante JSON válido pero con una forma inesperada (sin code/message), también arma UNKNOWN_ERROR', async () => {
    const response = jsonResponse(400, { error: 'algo salió mal', reason: 'desconocida' });

    const error = await mapErrorResponse(response);

    expect(error.code).toBe('UNKNOWN_ERROR');
    expect(error.httpStatus).toBe(400);
  });
});
