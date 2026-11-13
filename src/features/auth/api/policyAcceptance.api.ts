/**
 * Aceptación de la política (CM-365, criterio 5):
 * - `GET /api/v1/users/me` dice qué versión aceptó la persona y cuál está vigente.
 * - `POST /api/v1/users/me/policy-acceptance` guarda la aceptación de la versión
 *   que muestra la web (`POLICY_VERSION`); es idempotente. Si Cuentas tiene otra
 *   vigente responde `422 POLICY_VERSION_OUTDATED`.
 */
import { POLICY_VERSION } from '@/config/policy';
import { httpClient } from '@/services/http/httpClient';
import type { CurrentAccountDto, PolicyAcceptanceRequestDto } from './policyAcceptance.dto';

/**
 * @returns `true` si la persona debe aceptar la versión vigente antes de seguir.
 * @throws ApiError si Cuentas no responde; quien lo usa no bloquea la app por eso.
 */
export async function fetchNeedsPolicyAcceptance(): Promise<boolean> {
  const dto = await httpClient.get<CurrentAccountDto>('/api/v1/users/me');
  return dto.policyAcceptance.acceptedVersion !== dto.policyAcceptance.currentVersion;
}

/** @throws ApiError `422 POLICY_VERSION_OUTDATED` si la versión de la web ya no es la vigente. */
export async function acceptCurrentPolicy(): Promise<void> {
  const body: PolicyAcceptanceRequestDto = { policyVersion: POLICY_VERSION };
  await httpClient.post<unknown>('/api/v1/users/me/policy-acceptance', body);
}
