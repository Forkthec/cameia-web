/**
 * Contrato de {@link useInView} (`SPEC.md` §3.7): el contenido nunca queda
 * oculto por falta de API —sin `IntersectionObserver` se da por visible— y
 * con `prefers-reduced-motion` tampoco espera a un revelado (CLAUDE.md §10).
 * Con observador, se revela al cruzar el viewport y no vuelve a ocultarse.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setViewportMatches } from '@/test/matchMedia';
import { useInView } from './useInView';

type ObserverCallback = (entries: Array<{ isIntersecting: boolean }>) => void;

function installObserver() {
  const instances: Array<{ callback: ObserverCallback; disconnect: () => void }> = [];
  class FakeObserver {
    callback: ObserverCallback;
    disconnect = vi.fn();
    constructor(callback: ObserverCallback) {
      this.callback = callback;
      instances.push(this);
    }
    observe() {}
  }
  vi.stubGlobal('IntersectionObserver', FakeObserver);
  return instances;
}

describe('useInView', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('da el elemento por visible cuando no existe IntersectionObserver', () => {
    vi.stubGlobal('IntersectionObserver', undefined);

    const { result } = renderHook(() => useInView<HTMLDivElement>());

    expect(result.current.inView).toBe(true);
  });

  it('da el elemento por visible con prefers-reduced-motion', () => {
    installObserver();
    setViewportMatches(true);

    const { result } = renderHook(() => useInView<HTMLDivElement>());

    expect(result.current.inView).toBe(true);
  });

  it('se revela al cruzar el viewport y deja de observar', () => {
    const instances = installObserver();
    const { result } = renderHook(() => useInView<HTMLDivElement>());

    expect(result.current.inView).toBe(false);

    act(() => result.current.ref(document.createElement('div')));
    act(() => instances[0]!.callback([{ isIntersecting: true }]));

    expect(result.current.inView).toBe(true);
    expect(instances[0]!.disconnect).toHaveBeenCalled();
  });
});
