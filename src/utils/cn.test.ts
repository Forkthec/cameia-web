/**
 * Contrato de `cn`: concatena clases descartando valores falsy, y ante un
 * conflicto de utilidades de Tailwind (vía `tailwind-merge`) se queda
 * con la última, no con las dos a la vez.
 */
import { describe, expect, it } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('concatena clases y descarta valores falsy', () => {
    const condicion = false;
    expect(cn('a', condicion && 'b', undefined, 'c')).toBe('a c');
  });

  it('resuelve conflictos de Tailwind quedándose con la última utilidad', () => {
    expect(cn('p-space-2', 'p-space-4')).toBe('p-space-4');
  });

  it('conserva un tamaño de texto de la escala junto a un color de texto', () => {
    expect(cn('text-display', 'text-text-on-inverse')).toBe('text-display text-text-on-inverse');
  });

  it('resuelve el conflicto entre dos tamaños de texto de la escala', () => {
    expect(cn('text-small text-brand-base', 'text-body')).toBe('text-brand-base text-body');
  });
});
