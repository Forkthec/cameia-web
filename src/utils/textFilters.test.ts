/**
 * Contrato de `filterToLettersAndSpaces`/`filterToDigits` (CM-195): cada uno
 * conserva únicamente su alfabeto permitido y descarta todo lo demás,
 * incluidas tildes/ñ (sí permitidas en letras) y espacios repetidos (se
 * conservan tal cual, no se colapsan — no es responsabilidad de este filtro).
 */
import { describe, expect, it } from 'vitest';
import { filterToDigits, filterToLettersAndSpaces } from './textFilters';

describe('filterToLettersAndSpaces', () => {
  it('conserva letras, tildes, ñ/Ñ y espacios', () => {
    expect(filterToLettersAndSpaces('María José Ñáñez')).toBe('María José Ñáñez');
  });

  it('descarta dígitos y símbolos', () => {
    expect(filterToLettersAndSpaces('Ada123!@# Lovelace')).toBe('Ada Lovelace');
  });

  it('devuelve cadena vacía si no hay letras', () => {
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
