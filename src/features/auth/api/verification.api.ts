/**
 * `POST /api/v1/users/me/verification` — activación de la cuenta en el
 * backend tras verificar el correo en Firebase (CA-1.2.14, CM-180).
 *
 * Se llama una vez al iniciar sesión con `emailVerified === true`. La
 * respuesta `200 {id, status: "ACTIVE"}` confirma la activación; repetir la
 * llamada es seguro (idempotente). Si falla con `5xx` o error de red, el
 * ingreso continúa y se reintenta en el siguiente inicio de sesión.
 */
import { httpClient } from '@/services/http/httpClient';

export async function activateAccount(): Promise<void> {
  await httpClient.post<unknown>('/api/v1/users/me/verification');
}
