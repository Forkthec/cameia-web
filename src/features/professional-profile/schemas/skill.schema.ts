/**
 * Validación del formulario de alta de una Habilidad (HU-2.5, CM-65). Sin
 * mensajes de texto, mismo patrón que `education.schema.ts`.
 *
 * `skillName` es texto libre (1-255 caracteres, memo del PO del 13-sep,
 * C-06) — sin catálogo, a diferencia de Rol Objetivo. `level` se valida
 * como "no vacío", no contra el enumerado real (`SKILL_LEVELS`): el
 * `<Select>` que lo edita solo ofrece esas tres opciones, así que un valor
 * fuera del catálogo no es alcanzable desde la interfaz.
 *
 * El duplicado (mismo texto ignorando mayúsculas y espacios) NO se valida
 * aquí: este schema no conoce la lista de habilidades ya agregadas. Esa
 * comparación vive en `SkillsSection` (`setError` manual sobre el campo),
 * porque depende de `items`, que es una prop del organismo, no un valor del
 * propio formulario.
 */
import { z } from 'zod';
import { SKILL_NAME_MAX_LENGTH } from '../model/profile.constants';

export const skillSchema = z.object({
  skillName: z.string().trim().min(1).max(SKILL_NAME_MAX_LENGTH),
  level: z.string().min(1),
});

export type SkillFormValues = z.infer<typeof skillSchema>;

/** Valores iniciales de un formulario de alta vacío: un nuevo ítem siempre empieza sin datos. */
export const EMPTY_SKILL_VALUES: SkillFormValues = {
  skillName: '',
  level: '',
};

/** Código manual (`setError` en `SkillsSection`), expuesto para que el organismo lo use como discriminador de `fieldState.error?.message` sin repetir el string. */
export const skillSchemaErrorCodes = { DUPLICATE: 'DUPLICATE' } as const;
