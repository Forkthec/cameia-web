/**
 * Reconoce el rechazo por cupo agotado de `POST /api/v1/profiles` (CA-2.2.3,
 * CM-270). Acotada a la CREACIÓN de perfil: en otros endpoints un `409` o un
 * `403` significan otra cosa (p. ej. `409` de habilidad duplicada, `403` de
 * perfil ajeno), así que no debe usarse fuera de ella.
 *
 * Acepta los dos contratos a la vez, no uno y después el otro: hoy el backend
 * responde `409 PROFILE_LIMIT_REACHED` y el backlog v6 pide `403 PLAN_LIMIT`
 * cuando se despliegue. Backend pide resolver este caso por `code`, pero
 * `ApiError`/`errorMap` no lo exponen y son compartidos con CM-267; mientras
 * tanto se decide por estado, como permiten `ADR-0007` y `CLAUDE.md` §8.
 * Cuando exista `code`, solo cambia esta función.
 *
 * Riesgo aceptado: un `403 EMAIL_NOT_VERIFIED` (GW-TBD-17, pendiente en el
 * Gateway) también pasaría por aquí y se mostraría como cupo agotado. Hoy no
 * ocurre; ver `SPEC.md` §3.1.
 *
 * @param error el error de la mutación de creación (`createProfile.error`).
 * @returns `true` si `error` es un `ApiError` `409` o `403`.
 */
import { ApiError } from '@/services/http/ApiError';

export function isProfileLimitReached(error: unknown): boolean {
  return error instanceof ApiError && (error.isConflict() || error.isForbidden());
}
