/**
 * Protege `isProfileLimitReached` (HU-2.2, CA-2.2.3, CM-270, CM-298,
 * `ADR-0008`): el cupo agotado de `POST /api/v1/profiles` se reconoce por
 * `code` —`PROFILE_LIMIT_REACHED` (`409`, hoy) y `PLAN_LIMIT` (`403`, backlog
 * v6) a la vez—, y es estricto: sin `code`, o con otro (p. ej. el
 * `409 PROFILE_CREATION_IN_PROGRESS` que sustituyó al `503
 * PROFILE_CREATION_TIMEOUT`), no es cupo agotado aunque el estado coincida.
 * Un error que ni siquiera es un `ApiError` tampoco lo es. Lo mismo para
 * `isProfileCreationInProgress`: solo `PROFILE_CREATION_IN_PROGRESS` (`409`),
 * sin respaldo por estado. Fuente de la regla: SPEC professional-profile §3.1
 * y `CLAUDE.md` §8.
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/services/http/ApiError';
import { isProfileCreationInProgress, isProfileLimitReached } from './profileLimit';

function apiError(httpStatus: number, code?: string): ApiError {
  return new ApiError({ httpStatus, title: 'Error', detail: 'detalle', code });
}

describe('isProfileLimitReached', () => {
  it('reconoce el 409 PROFILE_LIMIT_REACHED de hoy', () => {
    expect(isProfileLimitReached(apiError(409, 'PROFILE_LIMIT_REACHED'))).toBe(true);
  });

  it('reconoce el 403 PLAN_LIMIT del backlog v6', () => {
    expect(isProfileLimitReached(apiError(403, 'PLAN_LIMIT'))).toBe(true);
  });

  it('no reconoce un 409 PROFILE_CREATION_IN_PROGRESS', () => {
    expect(isProfileLimitReached(apiError(409, 'PROFILE_CREATION_IN_PROGRESS'))).toBe(false);
  });

  it('no reconoce un 409 sin code: sin code no hay respaldo por estado', () => {
    expect(isProfileLimitReached(apiError(409))).toBe(false);
  });

  it('no reconoce un 403 sin code: sin code no hay respaldo por estado', () => {
    expect(isProfileLimitReached(apiError(403))).toBe(false);
  });

  it('no reconoce un code que no está en la lista', () => {
    expect(isProfileLimitReached(apiError(409, 'OTRO_CODIGO'))).toBe(false);
    expect(isProfileLimitReached(apiError(403, 'EMAIL_NOT_VERIFIED'))).toBe(false);
  });

  it('no reconoce un 500', () => {
    expect(isProfileLimitReached(apiError(500, 'INTERNAL_ERROR'))).toBe(false);
  });

  it('no reconoce un error que no es ApiError', () => {
    expect(isProfileLimitReached(new Error('falla de red'))).toBe(false);
    expect(isProfileLimitReached(undefined)).toBe(false);
  });
});

describe('isProfileCreationInProgress', () => {
  it('reconoce el 409 PROFILE_CREATION_IN_PROGRESS', () => {
    expect(isProfileCreationInProgress(apiError(409, 'PROFILE_CREATION_IN_PROGRESS'))).toBe(true);
  });

  it('no reconoce otro code, aunque el estado sea 409', () => {
    expect(isProfileCreationInProgress(apiError(409, 'PROFILE_LIMIT_REACHED'))).toBe(false);
    expect(isProfileCreationInProgress(apiError(503, 'PROFILE_CREATION_TIMEOUT'))).toBe(false);
  });

  it('no reconoce un 409 sin code: sin code no hay respaldo por estado', () => {
    expect(isProfileCreationInProgress(apiError(409))).toBe(false);
  });

  it('no reconoce un error que no es ApiError', () => {
    expect(isProfileCreationInProgress(new Error('falla de red'))).toBe(false);
    expect(isProfileCreationInProgress(undefined)).toBe(false);
  });
});
