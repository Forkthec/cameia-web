/**
 * Prueba de humo del handler de `POST /api/v1/users` (CM-34): protege que
 * las reglas reales de dominio (`AgePolicy.java`, `PasswordPolicy.java`,
 * `PhoneNumber.java`, correo duplicado vía Firebase) sigan respondiendo en
 * el orden real de `RegisterUserService.register()`, con la forma de
 * `ProblemDetail` (`ADR-0007`, sin `code` propio), y que un registro válido
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
  password: 'contrasena-larga-1',
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

  it('un correo ya registrado falla con 409, sin errors por campo', async () => {
    await httpClient.post('/api/v1/users', validBody);

    const error = await httpClient.post('/api/v1/users', validBody).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(409);
    expect((error as ApiError).errors).toEqual([]);
  });

  it('una fecha de nacimiento de menor de edad falla con 422 y field birthDate', async () => {
    const error = await httpClient
      .post('/api/v1/users', { ...validBody, birthDate: '01/01/2015' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(422);
    expect((error as ApiError).fieldMessage('birthDate')).toBe('Debes ser mayor de edad');
  });

  it('una fecha de nacimiento con formato inválido falla con 422 sin errors por campo', async () => {
    const error = await httpClient
      .post('/api/v1/users', { ...validBody, birthDate: '1990-01-01' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(422);
    expect((error as ApiError).errors).toEqual([]);
  });

  it('una contraseña corta falla con 422 y field password', async () => {
    const error = await httpClient
      .post('/api/v1/users', { ...validBody, password: 'corta1' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(422);
    expect((error as ApiError).hasField('password')).toBe(true);
  });

  it('una contraseña común falla con 422 y field password', async () => {
    const error = await httpClient
      .post('/api/v1/users', { ...validBody, password: 'password1234' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).hasField('password')).toBe(true);
  });

  it('un celular sin indicativo falla con 422 sin errors por campo', async () => {
    const error = await httpClient
      .post('/api/v1/users', { ...validBody, phoneNumber: '3001234567' })
      .catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).httpStatus).toBe(422);
    expect((error as ApiError).errors).toEqual([]);
  });

  it('un celular en formato E.164 válido no bloquea el registro', async () => {
    const account = await httpClient.post<RegisteredUserResponse>('/api/v1/users', {
      ...validBody,
      phoneNumber: '+573001234567',
    });

    expect(account.status).toBe('PENDING_VERIFICATION');
  });
});
