/**
 * Protege `isProfileLimitReached` (HU-2.2, CA-2.2.3, CM-270): el cupo agotado
 * de `POST /api/v1/profiles` se reconoce por estado, aceptando a la vez el
 * `409` de hoy y el `403` del backlog v6 (SPEC professional-profile §3.1),
 * y cualquier otra cosa —un `500` o algo que ni siquiera es un `ApiError`—
 * no debe confundirse con él.
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/services/http/ApiError';
import { isProfileLimitReached } from './profileLimit';

function apiError(httpStatus: number): ApiError {
  return new ApiError({ httpStatus, title: 'Error', detail: 'detalle' });
}

describe('isProfileLimitReached', () => {
  it('reconoce el 409 de hoy (PROFILE_LIMIT_REACHED)', () => {
    expect(isProfileLimitReached(apiError(409))).toBe(true);
  });

  it('reconoce el 403 del backlog v6 (PLAN_LIMIT)', () => {
    expect(isProfileLimitReached(apiError(403))).toBe(true);
  });

  it('no reconoce un 500', () => {
    expect(isProfileLimitReached(apiError(500))).toBe(false);
  });

  it('no reconoce un error que no es ApiError', () => {
    expect(isProfileLimitReached(new Error('falla de red'))).toBe(false);
    expect(isProfileLimitReached(undefined)).toBe(false);
  });
});
