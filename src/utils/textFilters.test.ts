/**
 * Contrato de `filterToLettersAndSpaces`/`filterToDigits` (CM-195,
 * CM-267/D2-05): cada uno conserva únicamente su alfabeto permitido y
 * descarta todo lo demás. El filtro de nombres conserva letras (con tildes,
 * ñ, ü), espacios, apóstrofo y guion (CA-1.1.31).
 */
import { describe, expect, it } from 'vitest';
import { filterToDigits, filterToLettersAndSpaces } from './textFilters';

describe('filterToLettersAndSpaces', () => {
  it('conserva letras, tildes, ñ/Ñ y espacios', () => {
    expect(filterToLettersAndSpaces('María José Ñáñez')).toBe('María José Ñáñez');
  });

  it('conserva ü/Ü, apóstrofo y guion (D2-05)', () => {
    expect(filterToLettersAndSpaces("O'Neill-Müller")).toBe("O'Neill-Müller");
  });

  it('conserva apóstrofo tipográfico (’)', () => {
    expect(filterToLettersAndSpaces('O’Neill')).toBe('O’Neill');
  });

  it('descarta dígitos y símbolos no permitidos', () => {
    expect(filterToLettersAndSpaces('Ada123!@# Lovelace')).toBe('Ada Lovelace');
  });

  it('devuelve cadena vacía si no hay caracteres permitidos', () => {
    expect(filterToLettersAndSpaces('12345')).toBe('');
  });
});

describe('filterToDigits', () => {
  it('conserva solo dígitos', () => {
    expect(filterToDigits('300 000 0000')).toBe('3000000000');
  });

  it('descarta letras y signos, incluido el negativo', () => {
    expect(filterToDigits('-300abc')).toBe('300');
  });

  it('devuelve cadena vacía si no hay dígitos', () => {
    expect(filterToDigits('abc')).toBe('');
  });
});
