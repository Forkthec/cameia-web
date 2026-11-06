/**
 * Lógica pura de `MonthField` (CM-273, PR 1; `SPEC.md` §3.3 y D-K, D-L): máscara «mm/aaaa» al teclear,
 * pegar y borrar, conversión «mm/aaaa» ↔ «AAAA-MM» y mes actual en UTC. El campo entrega al formulario el
 * texto de la máscara sin validarlo; quien valida es el esquema de Zod, que usa `parseMonthText` para
 * transformar a «AAAA-MM» (el formato del servidor). Viven aquí y no en el componente por `CLAUDE.md` §4
 * (funciones puras con prueba al lado).
 */

const MONTH_DIGITS = 2;
const MAX_DIGITS = 6;
const MONTH_TEXT = /^(\d{2})\/(\d{4})$/;
const YEAR_MONTH_VALUE = /^(\d{4})-(\d{2})$/;

/**
 * Aplica la máscara «mm/aaaa»: descarta lo que no es dígito, corta en seis dígitos e inserta la barra solo
 * cuando ya hay más de dos, de modo que «Retroceso» desde «06/2» llega a «06» y no deja la barra colgando.
 *
 * @param raw texto tal como lo dejó la persona al teclear, pegar o borrar.
 * @returns el texto enmascarado; cadena vacía si no hay ningún dígito.
 */
export function maskMonthInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, MAX_DIGITS);

  if (digits.length <= MONTH_DIGITS) return digits;

  return `${digits.slice(0, MONTH_DIGITS)}/${digits.slice(MONTH_DIGITS)}`;
}

/**
 * Convierte «mm/aaaa» a «AAAA-MM».
 *
 * @param text texto con la máscara «mm/aaaa».
 * @returns el valor «AAAA-MM», o `null` si el texto está incompleto o el mes no existe. Con cadena vacía
 * también devuelve `null`: si vacío es obligatorio u opcional lo decide el esquema.
 */
export function parseMonthText(text: string): string | null {
  const match = MONTH_TEXT.exec(text);
  if (!match) return null;

  const [, month, year] = match;
  const monthNumber = Number(month);
  if (monthNumber < 1 || monthNumber > 12) return null;

  return `${year}-${month}`;
}

/**
 * Convierte «AAAA-MM» a «mm/aaaa».
 *
 * @param yearMonth valor «AAAA-MM».
 * @returns el texto «mm/aaaa»; cadena vacía si el valor está vacío o no tiene esa forma.
 */
export function formatMonthValue(yearMonth: string): string {
  const match = YEAR_MONTH_VALUE.exec(yearMonth);
  if (!match) return '';

  const [, year, month] = match;

  return `${month}/${year}`;
}

/**
 * Mes del instante dado en UTC (RT-07-CA04): en Colombia (UTC-5) las últimas cinco horas del mes ya cuentan
 * como el mes siguiente, igual que en el servidor.
 *
 * @param now instante de referencia; por defecto, ahora.
 * @returns el mes como «AAAA-MM».
 */
export function getCurrentUtcYearMonth(now: Date = new Date()): string {
  const year = String(now.getUTCFullYear()).padStart(4, '0');
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');

  return `${year}-${month}`;
}
