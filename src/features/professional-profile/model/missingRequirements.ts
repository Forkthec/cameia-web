/**
 * Extrae los campos incumplidos de un `422` de
 * `POST /api/v1/profiles/:id/completion` (HU-2.5, CM-65). Función pura,
 * separada de `EditProfilePage.tsx`, para poder probarla sin renderizar: la
 * traducción de cada campo a texto visible (`profile:formulario.requisitos.*`)
 * sigue viviendo en la página, que es la única capa con `useTranslation`
 * (CLAUDE.md §14.7) — esta función no sabe de i18n.
 *
 * El backend real (`ProblemDetail`, `ADR-0007`) transporta "la lista de
 * requisitos faltantes" en `error.errors` (un `{field, message}` por
 * requisito) — sin `code` propio, así que el único discriminador de que este
 * `422` es justo el de "perfil incompleto" es que venga de esta mutación
 * específica con al menos un `errors[]` — ver TSDoc de `finalizeProfile` en
 * `api/profile.api.ts`.
 */
import { ApiError } from '@/services/http/ApiError';

/**
 * @param error el error de la mutación (`useFinalizeProfile().error`).
 * @returns el nombre de cada campo incumplido (p. ej. `['name', 'skills']`),
 *   o `undefined` si `error` no es un `422` con requisitos faltantes.
 */
export function getMissingRequirementFields(error: unknown): string[] | undefined {
  if (!(error instanceof ApiError) || error.httpStatus !== 422 || error.errors.length === 0) {
    return undefined;
  }
  return error.errors.map((item) => item.field);
}
