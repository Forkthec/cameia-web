/**
 * Contrato de {@link useScrolledPast} (`SPEC.md` §3.7): el header fijo de la
 * landing se asienta al bajar y vuelve a transparente al regresar arriba, con
 * histéresis para que el salto que produce plegar el header en móvil no lo
 * haga parpadear (bug real, CM-329).
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

  it('cambia a true al pasar el umbral de entrada y vuelve a false cerca del inicio', () => {
    const { result } = renderHook(() => useScrolledPast(80, 4));

    expect(result.current).toBe(false);

    act(() => scrollTo(120));
    expect(result.current).toBe(true);

    act(() => scrollTo(0));
    expect(result.current).toBe(false);
  });

  it('no se desactiva por el salto de ~56px que produce plegar el header', () => {
    const { result } = renderHook(() => useScrolledPast(80, 4));

    act(() => scrollTo(90));
    expect(result.current).toBe(true);

    act(() => scrollTo(34));
    expect(result.current).toBe(true);
  });

  it('no se activa por un scroll menor al umbral de entrada', () => {
    const { result } = renderHook(() => useScrolledPast(80, 4));

    act(() => scrollTo(47));
    expect(result.current).toBe(false);
  });
});
