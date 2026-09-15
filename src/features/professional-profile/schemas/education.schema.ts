/**
 * Validación del formulario de alta de una Formación académica (HU-2.4,
 * CM-61). A propósito sin mensajes de texto (mismo patrón que
 * `generalInfo.schema.ts`): el componente lee `fieldState.error?.type` (y,
 * para las reglas cruzadas de `.superRefine`, `fieldState.error?.message`
 * como código interno — nunca se muestra, solo se usa como discriminador,
 * igual que `type` ya lo es) y elige la prop de texto ya traducida.
 *
 * `fieldOfStudy` es el único campo de texto NO obligatorio: el backend real
 * (`AddEducationRequest`/`Education.java` de `cameia-perfil`) no lo valida
 * en absoluto (ni `@NotBlank` en el DTO ni `requireNonBlankMax` en el
 * dominio, a diferencia de `institution` y `degree`, que sí lo exigen) —
 * exigirlo aquí sería una regla más estricta que la que el propio backend
 * define. Bloqueo C-12 de `SPEC.md` §8: Figma tampoco dibuja este campo.
 *
 * La regla `endDate >= startDate` no la exige `Education.java` (a diferencia
 * de `WorkExperience.java`, que sí la valida) — se mantiene aquí solo como
 * salvaguarda de UX (nadie termina una formación antes de empezarla), no
 * como una regla de negocio inventada: documentado para que quede claro que
 * el backend real no la rechazaría si llegara a fallar por otro camino.
 *
 * `level` se valida como "no vacío", no contra el enumerado real
 * (`EDUCATION_LEVELS`): el `<Select>` que lo edita solo ofrece esas tres
 * opciones como `<option>`, así que un valor fuera del catálogo no es
 * alcanzable desde la interfaz — validarlo aquí de nuevo sería redundante.
 */
import { z } from 'zod';

const IN_PROGRESS_WITH_END_DATE = 'IN_PROGRESS_WITH_END_DATE';
const END_BEFORE_START = 'END_BEFORE_START';

export const educationSchema = z
  .object({
    level: z.string().min(1),
    degree: z.string().trim().min(1),
    fieldOfStudy: z.string().trim(),
    institution: z.string().trim().min(1),
    startDate: z.string().min(1),
    endDate: z.string(),
    inProgress: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.inProgress && values.endDate.length > 0) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: IN_PROGRESS_WITH_END_DATE });
      return;
    }
    if (
      !values.inProgress &&
      values.endDate.length > 0 &&
      values.startDate.length > 0 &&
      values.endDate < values.startDate
    ) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: END_BEFORE_START });
    }
  });

export type EducationFormValues = z.infer<typeof educationSchema>;

/** Valores iniciales de un formulario de alta vacío: un nuevo ítem siempre empieza sin datos. */
export const EMPTY_EDUCATION_VALUES: EducationFormValues = {
  level: '',
  degree: '',
  fieldOfStudy: '',
  institution: '',
  startDate: '',
  endDate: '',
  inProgress: false,
};

/** Códigos internos de `.superRefine`, expuestos para que el organismo los use como discriminador de `fieldState.error?.message` sin repetir el string. */
export const educationSchemaErrorCodes = { IN_PROGRESS_WITH_END_DATE, END_BEFORE_START } as const;
