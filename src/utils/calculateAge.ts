/**
 * Edad en años cumplidos y la regla de mayoría de edad (18 años, Colombia),
 * calculadas siempre en UTC. Usar UTC evita el off-by-one clásico: si se
 * calculara con getFullYear/getMonth/getDate en hora local, alguien que
 * cumple años justo hoy podría aparecer un día antes o después según el
 * huso horario del navegador frente a la zona en que se generó `birthDate`.
 */
const LEGAL_AGE = 18;

/**
 * @param birthDate fecha de nacimiento.
 * @param referenceDate fecha contra la que se calcula la edad; por defecto, ahora.
 * @returns años cumplidos de `birthDate` a `referenceDate`.
 */
export function calculateAge(birthDate: Date, referenceDate: Date = new Date()): number {
  let age = referenceDate.getUTCFullYear() - birthDate.getUTCFullYear();

  const alreadyHadBirthdayThisYear =
    referenceDate.getUTCMonth() > birthDate.getUTCMonth() ||
    (referenceDate.getUTCMonth() === birthDate.getUTCMonth() &&
      referenceDate.getUTCDate() >= birthDate.getUTCDate());

  // Si el cumpleaños de este año todavía no llega, la resta simple de años
  // se pasa por uno: la persona aún no cumplió esa edad completa.
  if (!alreadyHadBirthdayThisYear) {
    age -= 1;
  }

  return age;
}

/**
 * Un 29 de febrero no existe en años no bisiestos: al comparar solo mes y
 * día (sin lógica especial para ese caso), `calculateAge` termina tratando
 * el 1 de marzo como la fecha en que esa persona "cumple años" ese año — es
 * consecuencia natural de la comparación, no un caso aparte que haya que
 * mantener a mano.
 *
 * @param birthDate fecha de nacimiento.
 * @param referenceDate fecha contra la que se evalúa; por defecto, ahora.
 * @returns `true` si ya alcanza los 18 años cumplidos en `referenceDate`.
 */
export function isAdult(birthDate: Date, referenceDate: Date = new Date()): boolean {
  return calculateAge(birthDate, referenceDate) >= LEGAL_AGE;
}
