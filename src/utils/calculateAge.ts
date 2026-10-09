/**
 * Edad en años cumplidos y la regla de mayoría de edad (18 años, Colombia),
 * calculadas siempre en UTC. Usar UTC evita el off-by-one clásico: si se
 * calculara con getFullYear/getMonth/getDate en hora local, alguien que
 * cumple años justo hoy podría aparecer un día antes o después según el
 * huso horario del navegador frente a la zona en que se generó `birthDate`.
 *
 * `isFutureDate`/`isImplausiblyOld` (CM-34, `SPEC.md` §3 Registro) cubren las
 * dos causas de rechazo de `fechaNacimiento` que `isAdult` no puede: una
 * fecha futura no es "menor de edad", es inválida por completo; y una edad
 * mayor a 110 años es la misma señal ("fecha probablemente mal escrita") que
 * usan otros formularios de identidad, no una regla de negocio de CAMEIA.
 */
const LEGAL_AGE = 18;
const MAX_PLAUSIBLE_AGE = 110;

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

/**
 * @param date fecha a evaluar.
 * @param referenceDate fecha contra la que se compara; por defecto, ahora.
 * @returns `true` si `date` es posterior a `referenceDate`.
 */
export function isFutureDate(date: Date, referenceDate: Date = new Date()): boolean {
  return date.getTime() > referenceDate.getTime();
}

/**
 * El día de hoy en UTC, `yyyy-MM-dd` (mismo formato que produce
 * `<input type="date">`). CM-267/C-05: «"hoy" es la fecha UTC en cameia-web
 * y en Cuentas». Entre las 19:00 y las 24:00 hora de Colombia ya es la del
 * día siguiente en UTC — es el comportamiento esperado, porque el backend
 * también usa UTC. Así ambas capas evalúan la edad contra la misma fecha.
 */
export function todayLocalIsoDate(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * @param birthDate fecha de nacimiento.
 * @param referenceDate fecha contra la que se evalúa; por defecto, ahora.
 * @returns `true` si `birthDate` implica más de 110 años cumplidos.
 */
export function isImplausiblyOld(birthDate: Date, referenceDate: Date = new Date()): boolean {
  return calculateAge(birthDate, referenceDate) > MAX_PLAUSIBLE_AGE;
}

/**
 * La fecha de nacimiento más antigua que `isImplausiblyOld` todavía acepta,
 * en UTC, `yyyy-MM-dd` — mismo criterio que `todayLocalIsoDate` (CM-267/C-05).
 *
 * No es simplemente "hace 110 años, mismo mes y día": ese valor exacto
 * cumple 110 años (plausible, `isImplausiblyOld` lo acepta), así que el
 * límite real es un día después de "hace 111 años" — un día antes, la
 * persona ya cumplió 111 (mismo cálculo de cumpleaños que usa
 * `calculateAge`, aplicado al revés).
 */
export function oldestPlausibleBirthDateIsoDate(): string {
  const now = new Date();
  const date = new Date(Date.UTC(
    now.getUTCFullYear() - (MAX_PLAUSIBLE_AGE + 1),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  ));
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
