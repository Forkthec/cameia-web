/**
 * Prueba de humo del handler de `POST /api/v1/users` (CM-34): protege que
 * las dos excepciones de dominio que el frontend distingue visualmente
 * (`EmailAlreadyRegisteredException`, `InvalidBirthDateException`) sigan
 * respondiendo con el código provisional esperado, y que un registro válido
 * responda `201` con la forma exacta de `RegisteredUserResponse.java`.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { ApiError } from '@/services/http/ApiError';
import { httpClient } from '@/services/http/httpClient';
import { resetRegisteredUsers } from './auth.handlers';

interface RegisteredUserResponse {
  id: string;
  firebaseUid: string;
  status: string;
  plan: string;
}

const validBody = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  birthDate: '01/01/1990',
  email: 'ada@cameia.com',
  password: 'secreta123',
  pronoun: 'SHE',
};

describe('authHandlers · POST /api/v1/users', () => {
  beforeEach(() => {
    resetRegisteredUsers();
  });

  it('un registro válido responde 201 pendiente de verificación con el Plan Gratis', async () => {
    const account = await httpClient.post<RegisteredUserResponse>('/api/v1/users', validBody);

    expect(account.status).toBe('PENDING_VERIFICATION');
    expect(account.plan).toBe('FREE');
    expect(account.firebaseUid).toBeTruthy();
  });

  it('un correo ya registrado falla con REGISTRO_CORREO_DUPLICADO', async () => {
    await httpClient.post('/api/v1/users', validBody);

    const error = await httpClient.post('/api/v1/users', validBody).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('REGISTRO_CORREO_DUPLICADO');
    expect((error as ApiError).httpStatus).toBe(409);
  });

  it('una fecha de nacimiento de menor de edad falla con REGISTRO_FECHA_NACIMIENTO_INVALIDA', async () => {
    const error = await httpClient
      .post('/api/v1/users', { ...validBody, birthDate: '01/01/2015' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('REGISTRO_FECHA_NACIMIENTO_INVALIDA');
    expect((error as ApiError).httpStatus).toBe(422);
  });

  it('una fecha de nacimiento con formato inválido falla con el mismo código', async () => {
    const error = await httpClient
      .post('/api/v1/users', { ...validBody, birthDate: '1990-01-01' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe('REGISTRO_FECHA_NACIMIENTO_INVALIDA');
  });
});
