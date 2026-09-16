/**
 * Extrae los campos incumplidos de un `422 PROFILE_INCOMPLETE` de
 * `POST /api/v1/profiles/:id/completion` (HU-2.5, CM-65). Función pura,
 * separada de `EditProfilePage.tsx`, para poder probarla sin renderizar: la
 * traducción de cada campo a texto visible (`profile:formulario.requisitos.*`)
 * sigue viviendo en la página, que es la única capa con `useTranslation`
 * (CLAUDE.md §14.7) — esta función no sabe de i18n.
 *
 * El backend real transporta "la lista de requisitos faltantes" en
 * `error.details` (un `ApiErrorDetail` por requisito, mismo mecanismo que
 * ya usa `PROFILE_NAME_INVALID`), no en un campo `missingRequirements`
 * aparte — ver TSDoc de `finalizeProfile` en `api/profile.api.ts`.
 */
import { ApiError } from '@/services/http/ApiError';

/**
 * @param error el error de la mutación (`useFinalizeProfile().error`).
 * @returns el nombre de cada campo incumplido (p. ej. `['name', 'skills']`),
 *   o `undefined` si `error` no es un `422 PROFILE_INCOMPLETE`.
 */
export function getMissingRequirementFields(error: unknown): string[] | undefined {
  if (!(error instanceof ApiError) || error.code !== 'PROFILE_INCOMPLETE') return undefined;
  return error.details.map((detail) => detail.field);
}
