/**
 * Reconoce, por `code`, los dos rechazos de `POST /api/v1/profiles` que
 * `NewProfilePage` muestra con mensaje propio (CA-2.2.3, CM-270, CM-298,
 * `ADR-0008`). Acotadas a la CREACIÓN de perfil: en otros endpoints el mismo
 * estado o código significa otra cosa (p. ej. `409` de habilidad duplicada,
 * `403` de perfil ajeno), así que no deben usarse fuera de ella.
 *
 * Son estrictas: sin `code`, o con uno que no esté en la lista, devuelven
 * `false` aunque el estado sea `409` o `403`. No hay respaldo por estado
 * (`CLAUDE.md` §8): un mensaje genérico es honesto, uno específico
 * equivocado no. CM-270 resolvía por estado porque `ApiError` no exponía el
 * `code`, y por eso mostraba como cupo agotado el
 * `409 PROFILE_CREATION_IN_PROGRESS` (que sustituyó al
 * `503 PROFILE_CREATION_TIMEOUT`, `cameia-perfil` commit `147d1e8`) y habría
 * mostrado un `403 EMAIL_NOT_VERIFIED` del Gateway (hoy hipotético:
 * `GW-TBD-17` abierto).
 */
import { ApiError } from '@/services/http/ApiError';

/** `409` de hoy y `403` del backlog v6 (aún sin desplegar): Backend cambia estado y código a la vez. */
const PROFILE_LIMIT_CODES = ['PROFILE_LIMIT_REACHED', 'PLAN_LIMIT'];

const PROFILE_CREATION_IN_PROGRESS_CODE = 'PROFILE_CREATION_IN_PROGRESS';

/**
 * Cupo del plan agotado al crear un perfil (CA-2.2.3).
 *
 * @param error el error de la mutación de creación (`createProfile.error`).
 * @returns `true` si `error` es un `ApiError` con `code` `PROFILE_LIMIT_REACHED` o `PLAN_LIMIT`.
 */
export function isProfileLimitReached(error: unknown): boolean {
  return error instanceof ApiError && error.hasCode(...PROFILE_LIMIT_CODES);
}

/**
 * Otra creación del mismo usuario no terminó (`409`, `cameia-perfil`): no se
 * creó nada y se puede reintentar.
 *
 * @param error el error de la mutación de creación (`createProfile.error`).
 * @returns `true` si `error` es un `ApiError` con `code` `PROFILE_CREATION_IN_PROGRESS`.
 */
export function isProfileCreationInProgress(error: unknown): boolean {
  return error instanceof ApiError && error.hasCode(PROFILE_CREATION_IN_PROGRESS_CODE);
}
