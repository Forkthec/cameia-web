/**
 * Protege que `getMissingRequirementFields` lea `error.errors` (no un
 * `missingRequirements` aparte) y solo para un `422` con requisitos —
 * cualquier otro `httpStatus` o clase de error debe ignorarse, para no
 * confundir un error real distinto con una lista vacía de requisitos.
 */
import { describe, expect, it } from 'vitest';
import { ApiError } from '@/services/http/ApiError';
import { getMissingRequirementFields } from './missingRequirements';

describe('getMissingRequirementFields', () => {
  it('devuelve el campo de cada requisito incumplido, en el orden recibido', () => {
    const error = new ApiError({
      httpStatus: 422,
      title: 'Perfil incompleto',
      detail: 'Todavía no cumples los requisitos para finalizar.',
      errors: [
        { field: 'name', message: 'Obligatorio' },
        { field: 'skills', message: 'Obligatorio' },
        { field: 'targetRoles', message: 'Obligatorio' },
      ],
    });

    expect(getMissingRequirementFields(error)).toEqual(['name', 'skills', 'targetRoles']);
  });

  it('un 422 sin errors por campo devuelve undefined', () => {
    const error = new ApiError({
      httpStatus: 422,
      title: 'Datos no válidos',
      detail: 'Revisa los datos enviados.',
    });

    expect(getMissingRequirementFields(error)).toBeUndefined();
  });

  it('un ApiError con otro httpStatus devuelve undefined', () => {
    const error = new ApiError({
      httpStatus: 404,
      title: 'No encontrado',
      detail: 'No encontrado.',
    });

    expect(getMissingRequirementFields(error)).toBeUndefined();
  });

  it('un error que no es ApiError devuelve undefined', () => {
    expect(getMissingRequirementFields(new Error('fallo de red'))).toBeUndefined();
  });
});
