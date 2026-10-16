/**
 * Presentación de un `YearMonth` (`java.time.YearMonth`, formato `"YYYY-MM"`, sin día) que exige el backend
 * real de Educación y Experiencia Laboral. Desde CM-273 (PR 1, D-K) el formulario ya guarda «AAAA-MM» y la
 * conversión desde la fecha completa del selector nativo (`toYearMonth`, bloqueo C-14) dejó de existir.
 */
import type { YearMonth } from './profile.types';

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
