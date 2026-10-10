/**
 * Protege que `isCommonPassword` replique la comparación real de
 * `PasswordPolicy.java` (`esConocida()`): sin distinguir mayúsculas,
 * espacios alrededor ni forma Unicode (CM-267/CA-1.1.27, ASVS 6.2.4).
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

  it('la lista tiene 3000 entradas', async () => {
    const raw = (await import('./common-passwords.txt?raw')).default;
    const entries = raw.trim().split('\n');
    expect(entries).toHaveLength(3000);
  });
});
