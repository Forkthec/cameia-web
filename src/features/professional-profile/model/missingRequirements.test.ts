/**
 * Protege que `getMissingRequirementFields` lea `error.details` (no un
 * `missingRequirements` aparte) y solo para un `422 PROFILE_INCOMPLETE` —
 * cualquier otro código o clase de error debe ignorarse, para no confundir
 * un error real distinto con una lista vacía de requisitos.
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/services/http/ApiError';
import { getMissingRequirementFields } from './missingRequirements';

describe('getMissingRequirementFields', () => {
  it('devuelve el campo de cada requisito incumplido, en el orden recibido', () => {
    const error = new ApiError({
      httpStatus: 422,
      code: 'PROFILE_INCOMPLETE',
      message: 'Todavía no cumples los requisitos para finalizar.',
      details: [
        { field: 'name', code: 'REQUIRED' },
        { field: 'skills', code: 'REQUIRED' },
        { field: 'targetRoles', code: 'REQUIRED' },
      ],
    });

    expect(getMissingRequirementFields(error)).toEqual(['name', 'skills', 'targetRoles']);
  });

  it('un ApiError con otro código devuelve undefined', () => {
    const error = new ApiError({ httpStatus: 404, code: 'NOT_FOUND', message: 'No encontrado.' });

    expect(getMissingRequirementFields(error)).toBeUndefined();
  });

  it('un error que no es ApiError devuelve undefined', () => {
    expect(getMissingRequirementFields(new Error('fallo de red'))).toBeUndefined();
  });
});
