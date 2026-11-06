/**
 * `POST /api/v1/auth/logout-all` — revocación de sesiones en todos los
 * dispositivos (CA-1.8.2, CA-1.8.9, CM-331).
 *
 * El Gateway propaga la identidad (`X-User-Id`) y cameia-cuentas invalida
 * los refresh tokens de Firebase para ese usuario. Responde 204 sin body;
 * repetir la llamada es seguro (idempotente).
 */
import { httpClient } from '@/services/http/httpClient';

export async function logoutAll(): Promise<void> {
  await httpClient.post<unknown>('/api/v1/auth/logout-all');
}
