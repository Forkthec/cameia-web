import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from './useMediaQuery';

function createMatchMediaMock(initialMatches: boolean) {
  let matches = initialMatches;
  const listeners = new Set<() => void>();

  const mediaQueryList = {
    get matches() {
      return matches;
    },
    media: '',
    addEventListener: (_event: string, listener: () => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_event: string, listener: () => void) => {
      listeners.delete(listener);
    },
  };

  return {
    matchMedia: vi.fn((): MediaQueryList => mediaQueryList as unknown as MediaQueryList),
    setMatches(next: boolean) {
      matches = next;
      listeners.forEach((listener) => listener());
    },
  };
}

describe('useMediaQuery', () => {
  let matchMediaMock: ReturnType<typeof createMatchMediaMock>;

  beforeEach(() => {
    matchMediaMock = createMatchMediaMock(false);
    vi.stubGlobal('matchMedia', matchMediaMock.matchMedia);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('devuelve el estado inicial de la media query', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('se actualiza cuando la media query cambia', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));

    act(() => {
      matchMediaMock.setMatches(true);
    });

    expect(result.current).toBe(true);
  });
});
