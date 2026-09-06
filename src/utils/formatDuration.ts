/**
 * Formatea una duración en segundos como `mm:ss` (cronómetro de una sesión
 * de entrevista, temporizador de un turno). No pasa a horas: si los minutos
 * superan 99 simplemente crecen a más de dos dígitos en vez de convertirse
 * en `h:mm:ss`, porque ninguna duración de esta app llega a esa magnitud.
 */

/**
 * @param totalSeconds segundos totales; se truncan si traen decimales y se
 * tratan como 0 si son negativos (un contador que llega a cero puede quedar
 * en algo como -0.3 por el redondeo del `setInterval` que lo alimenta).
 * @returns la duración formateada como `mm:ss`, con ceros a la izquierda.
 */
export function formatDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
