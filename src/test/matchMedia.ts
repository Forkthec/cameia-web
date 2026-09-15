/**
 * Stub controlable de `window.matchMedia`, que jsdom 30 no implementa
 * (verificado: cualquier componente que use `useMediaQuery` revienta con
 * "matchMedia is not a function" sin esto). Se instala una sola vez desde
 * `src/test/setup.ts`, mobile-first por defecto (`matches: false`, la misma
 * rama que ya usa `useMediaQuery.test.ts` en su propio mock aislado).
 *
 * `setViewportMatches` cambia el resultado para TODA media query activa y
 * dispara el evento `change` de cada `MediaQueryList` suscrita, igual que
 * haría un navegador real al cruzar un breakpoint — lo usa `EditProfilePage.test.tsx`
 * para forzar la rama de escritorio (`StepList`) o la de móvil (acordeón).
 */
import { vi } from 'vitest';

type ChangeListener = () => void;

let currentMatches = false;
const listeners = new Set<ChangeListener>();

function createMediaQueryList(query: string): MediaQueryList {
  return {
    get matches() {
      return currentMatches;
    },
    media: query,
    onchange: null,
    addEventListener: (_event: string, listener: ChangeListener) => {
      listeners.add(listener);
    },
    removeEventListener: (_event: string, listener: ChangeListener) => {
      listeners.delete(listener);
    },
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
    // El objeto es un doble de prueba, no una implementación real de
    // EventTarget — TS no puede verificar la compatibilidad estructural
    // completa (sobrecargas de addEventListener), de ahí el paso por
    // `unknown` en vez de una aserción directa.
  } as unknown as MediaQueryList;
}

/** Instala el stub en `window.matchMedia`. Se llama una vez desde `src/test/setup.ts`. */
export function installMatchMediaStub(): void {
  window.matchMedia = vi.fn((query: string) => createMediaQueryList(query));
}

/**
 * Fuerza el resultado de `matches` para toda media query activa.
 * @param matches nuevo valor; `true` simula el breakpoint de escritorio.
 */
export function setViewportMatches(matches: boolean): void {
  currentMatches = matches;
  listeners.forEach((listener) => listener());
}

/** Vuelve al estado mobile-first entre pruebas, para que una no herede el viewport forzado por otra. */
export function resetViewportMatches(): void {
  currentMatches = false;
}
