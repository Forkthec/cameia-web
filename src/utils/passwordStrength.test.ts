/**
 * Contrato de `calculatePasswordStrength`: cadena vacía es `empty`; menos de
 * 12 caracteres siempre es `weak` (el backend la rechaza igual); a partir de
 * ahí, más longitud y variedad de clases de caracteres suben el nivel hasta
 * `strong`.
 */
import { describe, expect, it } from 'vitest';
import { calculatePasswordStrength } from './passwordStrength';

describe('calculatePasswordStrength', () => {
  it('cadena vacía es empty', () => {
    expect(calculatePasswordStrength('')).toBe('empty');
  });

  it('menos de 12 caracteres siempre es weak, sin importar la variedad', () => {
    expect(calculatePasswordStrength('Ab1!')).toBe('weak');
  });

  it('12 caracteres de una sola clase es weak', () => {
    expect(calculatePasswordStrength('abcdefghijkl')).toBe('weak');
  });

  it('12 caracteres con minúscula y mayúscula es fair', () => {
    expect(calculatePasswordStrength('abcdefghijkL')).toBe('fair');
  });

  it('12 caracteres con minúscula, mayúscula y dígito es good', () => {
    expect(calculatePasswordStrength('abcdefghijK1')).toBe('good');
  });

  it('16+ caracteres con las 4 clases es strong', () => {
    expect(calculatePasswordStrength('abcdefghijK1!234')).toBe('strong');
  });
});
