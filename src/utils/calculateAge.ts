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
 * El día de hoy en el calendario **local** de quien usa la app, `yyyy-MM-dd`
 * (mismo formato que produce `<input type="date">`). No usa
 * `toISOString().slice(0, 10)`: esa conversión pasa por UTC, y Colombia es
 * `UTC-5` (`CLAUDE.md` §1, único mercado del producto) — entre las 7 p. m. y
 * la medianoche hora local, la fecha en UTC ya es la de mañana. Un `max` de
 * `<input type="date">` calculado así deja elegir, y un `fechaNacimiento`
 * validado contra `new Date()` sin normalizar deja pasar, una fecha que para
 * la persona es claramente "mañana" (hallazgo real, seguimiento de CM-34:
 * el selector nativo en móvil permitía elegir una fecha futura por la
 * noche). Se usan los getters locales (`getFullYear`/`getMonth`/`getDate`)
 * a propósito, lo opuesto a `calculateAge`/`isFutureDate` de este mismo
 * archivo: ahí ambas fechas comparadas ya están ancladas a medianoche UTC
 * (`parseBirthDate` en `register.schema.ts`), así que compararlas en UTC es
 * lo consistente; aquí el punto de partida es la hora real de la persona, no
 * una fecha ya normalizada.
 */
export function todayLocalIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
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
 * en el calendario **local** de quien usa la app, `yyyy-MM-dd` — pedido
 * explícito del usuario, mismo criterio que `todayLocalIsoDate`: si el
 * selector nativo ya no deja elegir una fecha futura, tampoco tiene sentido
 * que deje elegir una que ya es "más de 110 años" con solo mirar el
 * calendario.
 *
 * No es simplemente "hace 110 años, mismo mes y día": ese valor exacto
 * cumple 110 años (plausible, `isImplausiblyOld` lo acepta), así que el
 * límite real es un día después de "hace 111 años" — un día antes, la
 * persona ya cumplió 111 (mismo cálculo de cumpleaños que usa
 * `calculateAge`, aplicado al revés). Usa los getters locales
 * (`getFullYear`/`getMonth`/`getDate`) de `now`, no `toISOString()`, por la
 * misma razón que `todayLocalIsoDate`.
 */
export function oldestPlausibleBirthDateIsoDate(): string {
  const now = new Date();
  const date = new Date(
    now.getFullYear() - (MAX_PLAUSIBLE_AGE + 1),
    now.getMonth(),
    now.getDate() + 1,
  );
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
