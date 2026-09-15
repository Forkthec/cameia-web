/**
 * Conversión entre la fecha completa que produce `<input type="date">`
 * (`"YYYY-MM-DD"`) y el `YearMonth` que exige el backend real de Educación y
 * Experiencia Laboral (`java.time.YearMonth`, formato `"YYYY-MM"`, sin día).
 * El día que el usuario elige en el selector se descarta aquí — bloqueo
 * C-14 de `SPEC.md` §8, decisión D-F: mantener el selector nativo fiel a
 * Figma (dd/mm/aaaa) y truncar en el cortafuegos del mapper, no cambiar el
 * control visual.
 */
import type { YearMonth } from './profile.types';

/**
 * @param isoDate fecha en formato `"YYYY-MM-DD"` o ya `"YYYY-MM"`.
 * @returns el mismo valor truncado a `"YYYY-MM"`.
 * @throws {Error} si `isoDate` no empieza con un año y mes reconocibles.
 */
export function toYearMonth(isoDate: string): YearMonth {
  const match = /^(\d{4}-\d{2})/.exec(isoDate);
  const captured = match?.[1];
  if (!captured) {
    throw new Error(`Fecha inválida para truncar a YearMonth: "${isoDate}".`);
  }
  return captured;
}

/**
 * Formatea un `YearMonth` para mostrarlo al usuario (p. ej. en la tarjeta de
 * un ítem ya agregado). Usa `Intl`, nunca formateo manual de fechas
 * (CLAUDE.md §7).
 * @param value `YearMonth` en formato `"YYYY-MM"`.
 * @param locale locale BCP-47 de la interfaz (p. ej. `"es-CO"`).
 * @returns el mes y año en el idioma de `locale` (p. ej. "marzo de 2024").
 */
export function formatYearMonth(value: YearMonth, locale: string): string {
  const [yearText, monthText] = value.split('-');
  if (!yearText || !monthText) {
    throw new Error(`YearMonth inválido para formatear: "${value}".`);
  }
  const date = new Date(Date.UTC(Number(yearText), Number(monthText) - 1, 1));
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  }).format(date);
}
