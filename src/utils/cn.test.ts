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
});
