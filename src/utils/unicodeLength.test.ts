/**
 * Contrato HU-2.3–2.5 (09-oct-2026, sección 4, fila 4): el backend cuenta
 * caracteres Unicode (puntos de código tras NFC), no unidades UTF-16.
 */
import { describe, expect, it } from 'vitest';
import { unicodeLength } from './unicodeLength';

describe('unicodeLength', () => {
  it('cuenta caracteres ASCII normalmente', () => {
    expect(unicodeLength('hello')).toBe(5);
  });

  it('cuenta un emoji como sus puntos de código, no como unidades UTF-16', () => {
    expect(unicodeLength('👍')).toBe(1);
  });

  it('normaliza NFD a NFC antes de contar', () => {
    const nfd = 'café'.normalize('NFD');
    expect(nfd.length).toBeGreaterThan(4);
    expect(unicodeLength(nfd)).toBe(4);
  });

  it('devuelve 0 para cadena vacía', () => {
    expect(unicodeLength('')).toBe(0);
  });
});
