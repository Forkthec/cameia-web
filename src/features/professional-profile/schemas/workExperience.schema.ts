/**
 * Validación del formulario de alta de una Experiencia laboral (HU-2.4,
 * CM-61). Sin mensajes de texto, mismo patrón que `education.schema.ts`.
 *
 * `isCurrent`/`unknownEnd` son los dos checkboxes reales del frame
 * ("Trabajo aquí actualmente" / "No recuerdo la fecha exacta de
 * finalización"): en el organismo son mutuamente excluyentes por UI (marcar
 * uno desmarca el otro), pero el schema igual valida que no lleguen ambos
 * en `true` — red de seguridad, no la única barrera.
 *
 * `endDate >= startDate` y "sin fecha de fin si el trabajo sigue activo o la
 * fecha se desconoce" SÍ son reglas reales del backend
 * (`WorkExperience.java`: `validateEndDate`), a diferencia de la misma regla
 * en `education.schema.ts`, que ahí es solo una salvaguarda de UX.
 */
import { z } from 'zod';
import { DESCRIPTION_MAX_LENGTH } from '../model/profile.constants';

const BOTH_STATUS_CHECKBOXES = 'BOTH_STATUS_CHECKBOXES';
const END_DATE_REQUIRED = 'END_DATE_REQUIRED';
const END_BEFORE_START = 'END_BEFORE_START';
const END_DATE_NOT_ALLOWED = 'END_DATE_NOT_ALLOWED';

export const workExperienceSchema = z
  .object({
    position: z.string().trim().min(1),
    company: z.string().trim().min(1),
    startDate: z.string().min(1),
    endDate: z.string(),
    description: z.string().max(DESCRIPTION_MAX_LENGTH),
    isCurrent: z.boolean(),
    unknownEnd: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.isCurrent && values.unknownEnd) {
      ctx.addIssue({ code: 'custom', path: ['unknownEnd'], message: BOTH_STATUS_CHECKBOXES });
      return;
    }

    const stillOpen = values.isCurrent || values.unknownEnd;

    if (stillOpen && values.endDate.length > 0) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: END_DATE_NOT_ALLOWED });
      return;
    }

    if (!stillOpen) {
      if (values.endDate.length === 0) {
        ctx.addIssue({ code: 'custom', path: ['endDate'], message: END_DATE_REQUIRED });
        return;
      }
      if (values.startDate.length > 0 && values.endDate < values.startDate) {
        ctx.addIssue({ code: 'custom', path: ['endDate'], message: END_BEFORE_START });
      }
    }
  });

export type WorkExperienceFormValues = z.infer<typeof workExperienceSchema>;

/** Valores iniciales de un formulario de alta vacío. */
export const EMPTY_WORK_EXPERIENCE_VALUES: WorkExperienceFormValues = {
  position: '',
  company: '',
  startDate: '',
  endDate: '',
  description: '',
  isCurrent: false,
  unknownEnd: false,
};

/** Códigos internos de `.superRefine`, usados como discriminador de `fieldState.error?.message` en el organismo. */
export const workExperienceSchemaErrorCodes = {
  BOTH_STATUS_CHECKBOXES,
  END_DATE_REQUIRED,
  END_BEFORE_START,
  END_DATE_NOT_ALLOWED,
} as const;
