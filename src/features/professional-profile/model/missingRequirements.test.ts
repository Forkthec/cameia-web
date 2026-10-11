/**
 * Protege que `getMissingRequirementFields` discrimine por
 * `code: 'PROFILE_INCOMPLETE'` (`ADR-0008`) y lea los requisitos de
 * `error.errors[]` — cualquier otro `code` o clase de error se ignora.
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/services/http/ApiError';
import { getMissingRequirementFields } from './missingRequirements';

describe('getMissingRequirementFields', () => {
  it('devuelve el campo de cada requisito incumplido, en el orden recibido', () => {
    const error = new ApiError({
      httpStatus: 422,
      title: 'Perfil incompleto',
      detail: 'Revisa los campos marcados.',
      code: 'PROFILE_INCOMPLETE',
      errors: [
        { field: 'name', message: 'Obligatorio' },
        { field: 'skills', message: 'Obligatorio' },
        { field: 'targetRoles', message: 'Obligatorio' },
      ],
    });

    expect(getMissingRequirementFields(error)).toEqual(['name', 'skills', 'targetRoles']);
  });

  it('un PROFILE_INCOMPLETE sin errors por campo devuelve undefined', () => {
    const error = new ApiError({
      httpStatus: 422,
      title: 'Perfil incompleto',
      detail: 'Revisa los campos marcados.',
      code: 'PROFILE_INCOMPLETE',
    });

    expect(getMissingRequirementFields(error)).toBeUndefined();
  });

  it('un 422 con otro code devuelve undefined', () => {
    const error = new ApiError({
      httpStatus: 422,
      title: 'Datos no válidos',
      detail: 'Revisa los campos marcados.',
      code: 'VALIDATION_FAILED',
      errors: [{ field: 'name', message: 'Requerido' }],
    });

    expect(getMissingRequirementFields(error)).toBeUndefined();
  });

  it('un 422 sin code devuelve undefined', () => {
    const error = new ApiError({
      httpStatus: 422,
      title: 'Datos no válidos',
      detail: 'Revisa los datos enviados.',
      errors: [{ field: 'name', message: 'Requerido' }],
    });

    expect(getMissingRequirementFields(error)).toBeUndefined();
  });

  it('un error que no es ApiError devuelve undefined', () => {
    expect(getMissingRequirementFields(new Error('fallo de red'))).toBeUndefined();
  });
});
