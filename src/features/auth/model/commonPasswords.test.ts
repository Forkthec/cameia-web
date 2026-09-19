/**
 * Protege que `isCommonPassword` replique la comparación real de
 * `PasswordPolicy.java` (`esConocida()`): sin distinguir mayúsculas ni
 * espacios alrededor.
 */
import { describe, expect, it } from 'vitest';
import { isCommonPassword } from './commonPasswords';

describe('isCommonPassword', () => {
  it('reconoce una contraseña común de la lista', () => {
    expect(isCommonPassword('password1234')).toBe(true);
  });

  it('ignora mayúsculas y espacios alrededor', () => {
    expect(isCommonPassword('  Password1234  ')).toBe(true);
  });

  it('una contraseña que no está en la lista no se marca como común', () => {
    expect(isCommonPassword('una-frase-larga-y-poco-comun')).toBe(false);
  });
});
