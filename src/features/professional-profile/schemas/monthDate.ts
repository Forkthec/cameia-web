/**
 * Reglas de una fecha «mm/aaaa» compartidas por los esquemas de experiencia y de formación (CM-273, PR 1;
 * `SPEC.md` §3.3 y D-K, D-M). `MonthField` entrega el texto crudo (D-K); aquí se decide si es válido y,
 * cuando lo es, se convierte a «AAAA-MM», el formato del servidor. Los códigos son internos: el organismo los
 * lee de `fieldState.error?.message` para elegir la propiedad de texto ya traducida y nunca se muestran.
 */
import { parseMonthText } from '@/utils/monthMask';

const INVALID_DATE_FORMAT = 'INVALID_DATE_FORMAT';
const DATE_IN_FUTURE = 'DATE_IN_FUTURE';

/** Códigos internos de las reglas de fecha, comunes a experiencia y a formación. */
export const monthDateErrorCodes = { INVALID_DATE_FORMAT, DATE_IN_FUTURE } as const;

/**
 * Valida un texto de fecha no vacío: primero el formato y después el mes futuro (el orden de
 * `WorkExperience.java:149` y `Education.java:111`).
 *
 * @param text texto «mm/aaaa» tal como lo dejó la máscara; el vacío lo trata cada esquema.
 * @param currentMonth mes actual en UTC como «AAAA-MM» (D-M).
 * @returns el valor «AAAA-MM» si es válido, o el código del primer fallo.
 */
export function checkMonthDate(
  text: string,
  currentMonth: string,
): { yearMonth: string } | { code: string } {
  const yearMonth = parseMonthText(text);
  if (yearMonth === null) return { code: INVALID_DATE_FORMAT };
  if (yearMonth > currentMonth) return { code: DATE_IN_FUTURE };

  return { yearMonth };
}
