/**
 * Contrato de {@link useScrolledPast} (`SPEC.md` §3.7): el header fijo de la
 * landing se asienta en cuanto la página baja más del umbral y vuelve a ser
 * transparente al regresar arriba.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useScrolledPast } from './useScrolledPast';

function scrollTo(y: number) {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  window.dispatchEvent(new Event('scroll'));
}

describe('useScrolledPast', () => {
  afterEach(() => {
    scrollTo(0);
  });

  it('cambia a true al pasar el umbral y vuelve a false al regresar arriba', () => {
    const { result } = renderHook(() => useScrolledPast(8));

    expect(result.current).toBe(false);

    act(() => scrollTo(120));
    expect(result.current).toBe(true);

    act(() => scrollTo(0));
    expect(result.current).toBe(false);
  });
});
