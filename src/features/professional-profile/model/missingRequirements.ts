/**
 * Extrae los campos incumplidos de un `422 PROFILE_INCOMPLETE` de
 * `POST /api/v1/profiles/:id/completion` (HU-2.5, CM-65). Función pura,
 * separada de `EditProfilePage.tsx`, para poder probarla sin renderizar: la
 * traducción de cada campo a texto visible (`profile:formulario.requisitos.*`)
 * sigue viviendo en la página, que es la única capa con `useTranslation`
 * (CLAUDE.md §14.7) — esta función no sabe de i18n.
 *
 * Discrimina por `code` `PROFILE_INCOMPLETE` (`ADR-0008`), no por
 * `httpStatus`: sin ese `code` devuelve `undefined` y la pantalla muestra el
 * mensaje genérico (`CLAUDE.md` §8).
 */
import { ApiError } from '@/services/http/ApiError';

/**
 * @param error el error de la mutación (`useFinalizeProfile().error`).
 * @returns el nombre de cada campo incumplido (p. ej. `['name', 'skills']`),
 *   o `undefined` si `error` no es un `PROFILE_INCOMPLETE` con requisitos.
 */
export function getMissingRequirementFields(error: unknown): string[] | undefined {
  if (
    !(error instanceof ApiError) ||
    !error.hasCode('PROFILE_INCOMPLETE') ||
    error.errors.length === 0
  ) {
    return undefined;
  }
  return error.errors.map((item) => item.field);
}
