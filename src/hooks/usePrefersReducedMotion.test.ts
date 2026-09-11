/**
 * Comportamiento observable de `usePrefersReducedMotion`, no
 * implementación: que refleja `prefers-reduced-motion` del sistema
 * (CLAUDE.md §10: con `reduce`, las duraciones de animación se van a 0),
 * y que consulta exactamente esa media query, no una parecida.
 */
import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

function stubMatchMedia(matchingQuery: string) {
  const matchMedia = vi.fn(
    (query: string): MediaQueryList =>
      ({
        matches: query === matchingQuery,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );
  vi.stubGlobal('matchMedia', matchMedia);
  return matchMedia;
}

describe('usePrefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('es true cuando el sistema pide movimiento reducido', () => {
    stubMatchMedia('(prefers-reduced-motion: reduce)');
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it('es false cuando el sistema no pide movimiento reducido', () => {
    stubMatchMedia('(min-width: 768px)');
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it('consulta exactamente la media query de prefers-reduced-motion', () => {
    const matchMedia = stubMatchMedia('(prefers-reduced-motion: reduce)');
    renderHook(() => usePrefersReducedMotion());
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });
});
