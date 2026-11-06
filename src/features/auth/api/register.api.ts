/**
 * Único llamado de red de Registro: `POST /api/v1/users`, sin sesión
 * ("Caso B" de `ADR-0006`). `httpClient` ya no adjunta `Authorization`
 * cuando `getIdToken()` no tiene sesión que ofrecer (confirmado en
 * `services/http/httpClient.ts`), así que esta llamada no necesita ningún
 * mecanismo propio para omitir el token.
 */
import { httpClient } from '@/services/http/httpClient';
import {
  toRegisterUserRequest,
  toRegisteredAccount,
  type RegisteredAccount,
} from './register.mapper';
import type { RegisteredUserResponseDto } from './register.dto';
import type { RegisterFormValues } from '../schemas/register.schema';

export async function registerUser(values: RegisterFormValues): Promise<RegisteredAccount> {
  const dto = await httpClient.post<RegisteredUserResponseDto>(
    '/api/v1/users',
    toRegisterUserRequest(values),
  );
  return toRegisteredAccount(dto);
}
