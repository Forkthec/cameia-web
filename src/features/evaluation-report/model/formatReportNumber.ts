/**
 * Formato de los números del reporte (aviso de Backend del 16-11-2026, §6): un decimal,
 * redondeado de la mitad hacia arriba (3,46 → 3,5; 3,45 → 3,5; 4,05 → 4,1), con coma en
 * español y punto en inglés. `toFixed(1)` no sirve: da 4,0 con 4,05 por la representación
 * binaria, así que se redondea aparte y `Intl` solo pone el separador (CLAUDE.md §7).
 */

/**
 * @param value número del contrato.
 * @returns el número redondeado a un decimal, de la mitad hacia arriba.
 */
export function roundHalfUpOneDecimal(value: number): number {
  return Math.round(value * 10 + 1e-9) / 10;
}

/**
 * @param value número del contrato.
 * @param locale idioma de la pantalla.
 * @returns el número con un decimal, p. ej. «3,5» en es-CO o «3.5» en en.
 */
export function formatOneDecimal(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(roundHalfUpOneDecimal(value));
}

/**
 * @param value número del contrato.
 * @param locale idioma de la pantalla.
 * @returns el número sin decimales (Ritmo de Habla), redondeado de la mitad hacia arriba.
 */
export function formatInteger(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(
    Math.round(value + 1e-9),
  );
}
