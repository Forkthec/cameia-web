/**
 * Validación del formulario de alta de una Experiencia laboral (HU-2.4,
 * CM-61). Sin mensajes de texto, mismo patrón que `education.schema.ts`.
 *
 * CM-273 (PR 1, `SPEC.md` §3.3 y D-K, D-M): el esquema es una FUNCIÓN que recibe el mes actual en UTC
 * («AAAA-MM», lo calcula la página). Las fechas llegan como el texto «mm/aaaa» que entrega `MonthField`; el
 * esquema valida el formato y el mes futuro, compara fin e inicio por mes y año, y transforma a «AAAA-MM».
 * CM-273 (PR 2, `SPEC.md` §3.3 puntos 2 y 3): el inicio es opcional (CA-2.4.15 y 22) y la descripción se mide
 * con `unicodeLength`, como el servidor, para que el campo no corte lo escrito (D-X).
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
import { parseMonthText } from '@/utils/monthMask';
import { unicodeLength } from '@/utils/unicodeLength';
import {
  COMPANY_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  POSITION_MAX_LENGTH,
} from '../model/profile.constants';
import { checkMonthDate, monthDateErrorCodes } from './monthDate';

const BOTH_STATUS_CHECKBOXES = 'BOTH_STATUS_CHECKBOXES';
const END_DATE_REQUIRED = 'END_DATE_REQUIRED';
const END_BEFORE_START = 'END_BEFORE_START';
const END_DATE_NOT_ALLOWED = 'END_DATE_NOT_ALLOWED';
const DESCRIPTION_TOO_LONG = 'DESCRIPTION_TOO_LONG';

/**
 * @param currentMonth mes actual en UTC como «AAAA-MM» (D-M).
 * @returns el esquema del formulario de alta de una experiencia.
 */
export function createWorkExperienceSchema(currentMonth: string) {
  return (
    z
      .object({
        position: z.string().trim().min(1).max(POSITION_MAX_LENGTH),
        company: z.string().trim().min(1).max(COMPANY_MAX_LENGTH),
        startDate: z.string(),
        endDate: z.string(),
        description: z
          .string()
          .refine((text) => unicodeLength(text) <= DESCRIPTION_MAX_LENGTH, DESCRIPTION_TOO_LONG),
        isCurrent: z.boolean(),
        unknownEnd: z.boolean(),
      })
      .superRefine((values, ctx) => {
        const start =
          values.startDate.length > 0 ? checkMonthDate(values.startDate, currentMonth) : null;
        if (start && 'code' in start) {
          ctx.addIssue({ code: 'custom', path: ['startDate'], message: start.code });
        }

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
          const end = checkMonthDate(values.endDate, currentMonth);
          if ('code' in end) {
            ctx.addIssue({ code: 'custom', path: ['endDate'], message: end.code });
            return;
          }
          if (start && 'yearMonth' in start && end.yearMonth < start.yearMonth) {
            ctx.addIssue({ code: 'custom', path: ['endDate'], message: END_BEFORE_START });
          }
        }
      })
      // Solo llega aquí si no hubo ningún error: el texto ya es «mm/aaaa» válido o está vacío (fin opcional).
      .transform((values) => ({
        ...values,
        startDate: parseMonthText(values.startDate) ?? '',
        endDate: parseMonthText(values.endDate) ?? '',
      }))
  );
}

/** Valores del formulario: las fechas son texto «mm/aaaa» al escribir y «AAAA-MM» al enviar (D-K). */
export type WorkExperienceFormValues = z.input<ReturnType<typeof createWorkExperienceSchema>>;

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
  DESCRIPTION_TOO_LONG,
  ...monthDateErrorCodes,
} as const;
