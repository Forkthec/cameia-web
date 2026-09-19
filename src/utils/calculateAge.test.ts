/**
 * Contrato de `calculateAge`: un cumpleaños hoy ya cuenta el año recién
 * cumplido, uno mañana todavía no; y el caso límite del 29 de febrero no
 * sube la edad hasta el 1 de marzo en un año no bisiesto, mientras que
 * en uno bisiesto el cumpleaños cae el mismo día.
 *
 * `isFutureDate`/`isImplausiblyOld` (CM-34): las dos guardas de
 * `fechaNacimiento` que Login nunca necesitó, con su caso límite propio
 * (110 años cumplidos es plausible, 111 no).
 */
import { describe, expect, it } from 'vitest';
import { calculateAge, isAdult, isFutureDate, isImplausiblyOld } from './calculateAge';

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

describe('calculateAge', () => {
  it('cumpleaños hoy: ya cuenta el año recién cumplido', () => {
    const birthDate = utcDate(2008, 9, 6);
    const referenceDate = utcDate(2026, 9, 6);

    expect(calculateAge(birthDate, referenceDate)).toBe(18);
    expect(isAdult(birthDate, referenceDate)).toBe(true);
  });

  it('cumpleaños mañana: todavía no cuenta el año que falta por cumplir', () => {
    const birthDate = utcDate(2008, 9, 7);
    const referenceDate = utcDate(2026, 9, 6);

    expect(calculateAge(birthDate, referenceDate)).toBe(17);
    expect(isAdult(birthDate, referenceDate)).toBe(false);
  });

  it('29 de febrero: en un año no bisiesto, la edad no sube hasta el 1 de marzo', () => {
    const birthDate = utcDate(2004, 2, 29);

    expect(calculateAge(birthDate, utcDate(2023, 2, 28))).toBe(18);
    expect(calculateAge(birthDate, utcDate(2023, 3, 1))).toBe(19);
  });

  it('29 de febrero: en un año bisiesto, el cumpleaños cae el mismo día', () => {
    const birthDate = utcDate(2004, 2, 29);

    expect(calculateAge(birthDate, utcDate(2024, 2, 29))).toBe(20);
  });
});

describe('isFutureDate', () => {
  it('una fecha posterior a la de referencia es futura', () => {
    expect(isFutureDate(utcDate(2026, 9, 20), utcDate(2026, 9, 19))).toBe(true);
  });

  it('la propia fecha de referencia no es futura', () => {
    expect(isFutureDate(utcDate(2026, 9, 19), utcDate(2026, 9, 19))).toBe(false);
  });

  it('una fecha pasada no es futura', () => {
    expect(isFutureDate(utcDate(2008, 9, 6), utcDate(2026, 9, 19))).toBe(false);
  });
});

describe('isImplausiblyOld', () => {
  it('exactamente 110 años cumplidos todavía es plausible', () => {
    const birthDate = utcDate(1916, 9, 6);
    expect(isImplausiblyOld(birthDate, utcDate(2026, 9, 6))).toBe(false);
  });

  it('111 años cumplidos ya no es plausible', () => {
    const birthDate = utcDate(1915, 9, 6);
    expect(isImplausiblyOld(birthDate, utcDate(2026, 9, 6))).toBe(true);
  });
});
