/**
 * Cuenta puntos de código Unicode tras normalización NFC — alineado con el
 * backend (`cameia-perfil`), que cuenta caracteres Unicode, no unidades
 * UTF-16. Un emoji como 👩‍💻 cuenta como 1 con `String.length` pero como
 * varios puntos de código; la diferencia importa para los `.max()` de los
 * schemas Zod y para el contador visible en la interfaz. Contrato HU-2.3–2.5
 * (09-oct-2026, sección 4, fila 4).
 *
 * @param text — el texto a medir.
 * @returns cantidad de puntos de código tras NFC.
 */
export function unicodeLength(text: string): number {
  return [...text.normalize('NFC')].length;
}
